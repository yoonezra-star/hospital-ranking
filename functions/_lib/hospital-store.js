const HIRA_SOURCE_NAME = '건강보험심사평가원 병원기본정보 API';
const HIRA_SOURCE_URL = 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000';

export function hasHospitalDatabase(context) {
  const database = context?.env?.HOSPITAL_DB;
  return Boolean(database?.prepare && database?.batch);
}

export async function searchHospitalSnapshots(context, params) {
  if (!hasHospitalDatabase(context) || hasCoordinateSearch(params)) return null;

  const database = context.env.HOSPITAL_DB;
  const page = clampNumber(params.get('pageNo') || params.get('page'), 1, 1000, 1);
  const pageSize = clampNumber(params.get('numOfRows') || params.get('limit'), 1, 100, 20);
  const filters = ["h.verification_status IN ('api-retrieved', 'verified')"];
  const bindings = [];

  addExactFilter(filters, bindings, 'h.hira_id', params.get('ykiho') || params.get('id'));
  addExactFilter(filters, bindings, 'h.province_code', params.get('sidoCd'));
  addExactFilter(filters, bindings, 'h.district_code', params.get('sgguCd'));
  addExactFilter(filters, bindings, 'h.type_code', params.get('clCd'));
  addLikeFilter(filters, bindings, 'h.town', params.get('emdongNm'));
  addLikeFilter(filters, bindings, 'h.name_normalized', normalizeSearchText(params.get('yadmNm')));

  const departmentCode = cleanText(params.get('dgsbjtCd'));
  if (departmentCode) {
    filters.push(`EXISTS (
      SELECT 1 FROM hospital_departments hd
      WHERE hd.hira_id = h.hira_id AND hd.department_code = ?
    )`);
    bindings.push(departmentCode);
  }

  const where = filters.join(' AND ');
  const offset = (page - 1) * pageSize;

  try {
    const countStatement = database
      .prepare(`SELECT COUNT(*) AS total FROM hospitals h WHERE ${where}`)
      .bind(...bindings);
    const listStatement = database.prepare(`
      SELECT h.*,
        (SELECT GROUP_CONCAT(hd.department_code)
         FROM hospital_departments hd WHERE hd.hira_id = h.hira_id) AS department_codes
      FROM hospitals h
      WHERE ${where}
      ORDER BY h.name_normalized ASC, h.hira_id ASC
      LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset);

    const [countResult, listResult] = await Promise.all([
      countStatement.first(),
      listStatement.all(),
    ]);
    const rows = Array.isArray(listResult?.results) ? listResult.results : [];

    return {
      items: rows.map((row) => snapshotRowToApiItem(row, departmentCode)),
      totalCount: Number(countResult?.total || 0),
      page,
      pageSize,
      sourceCheckedAt: rows.reduce((latest, row) => (
        String(row.source_checked_at || '') > latest ? String(row.source_checked_at) : latest
      ), ''),
    };
  } catch (error) {
    console.warn('[hospital-store] snapshot search unavailable:', error?.message || error);
    return null;
  }
}

export async function getHospitalSnapshot(context, hiraId) {
  const id = cleanText(hiraId);
  if (!hasHospitalDatabase(context) || !id) return null;

  try {
    const row = await context.env.HOSPITAL_DB.prepare(`
      SELECT h.*,
        (SELECT GROUP_CONCAT(hd.department_code)
         FROM hospital_departments hd WHERE hd.hira_id = h.hira_id) AS department_codes
      FROM hospitals h
      WHERE h.hira_id = ?
        AND h.verification_status IN ('api-retrieved', 'verified')
      LIMIT 1
    `).bind(id).first();
    return row ? snapshotRowToApiItem(row) : null;
  } catch (error) {
    console.warn('[hospital-store] snapshot lookup unavailable:', error?.message || error);
    return null;
  }
}

export async function listHospitalSitemapEntries(context, limit = 10000) {
  if (!hasHospitalDatabase(context)) return [];
  const safeLimit = clampNumber(limit, 1, 45000, 10000);

  try {
    const result = await context.env.HOSPITAL_DB.prepare(`
      SELECT hira_id, source_checked_at
      FROM hospitals
      WHERE verification_status IN ('api-retrieved', 'verified')
      ORDER BY hira_id ASC
      LIMIT ?
    `).bind(safeLimit).all();
    return (Array.isArray(result?.results) ? result.results : [])
      .filter((row) => cleanText(row.hira_id))
      .map((row) => ({
        id: cleanText(row.hira_id),
        lastModified: cleanText(row.source_checked_at).slice(0, 10),
      }));
  } catch (error) {
    console.warn('[hospital-store] sitemap lookup unavailable:', error?.message || error);
    return [];
  }
}

export async function getRelatedHospitalSnapshots(context, hospital, limit = 6) {
  if (!hasHospitalDatabase(context) || !hospital?.ykiho) return [];
  const safeLimit = clampNumber(limit, 1, 12, 6);
  const districtCode = cleanText(hospital.sgguCd);
  const provinceCode = cleanText(hospital.sidoCd);
  if (!districtCode && !provinceCode) return [];

  const locationColumn = districtCode ? 'h.district_code' : 'h.province_code';
  const locationValue = districtCode || provinceCode;
  try {
    const result = await context.env.HOSPITAL_DB.prepare(`
      SELECT h.*,
        (SELECT GROUP_CONCAT(hd.department_code)
         FROM hospital_departments hd WHERE hd.hira_id = h.hira_id) AS department_codes
      FROM hospitals h
      WHERE ${locationColumn} = ?
        AND h.hira_id != ?
        AND h.verification_status IN ('api-retrieved', 'verified')
      ORDER BY CASE WHEN h.type_code = ? THEN 0 ELSE 1 END, h.name_normalized ASC
      LIMIT ?
    `).bind(locationValue, hospital.ykiho, cleanText(hospital.clCd), safeLimit).all();
    return (Array.isArray(result?.results) ? result.results : []).map((row) => snapshotRowToApiItem(row));
  } catch (error) {
    console.warn('[hospital-store] related snapshot lookup unavailable:', error?.message || error);
    return [];
  }
}

export async function storeHospitalSnapshots(context, items, departmentCode = '') {
  if (!hasHospitalDatabase(context) || !Array.isArray(items) || items.length === 0) return 0;

  const database = context.env.HOSPITAL_DB;
  const checkedAt = new Date().toISOString();
  const snapshots = items.map((item) => normalizeHospitalSnapshot(item, checkedAt)).filter(Boolean);
  if (!snapshots.length) return 0;

  const statements = [];
  for (const snapshot of snapshots) {
    statements.push(database.prepare(`
      INSERT INTO hospitals (
        hira_id, name, name_normalized, type_code, type_name, address,
        province_code, province_name, district_code, district_name, town,
        phone, homepage, longitude, latitude, established_date,
        verification_status, source_name, source_url, source_checked_at,
        snapshot_updated_at, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        'api-retrieved', ?, ?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(hira_id) DO UPDATE SET
        name = excluded.name,
        name_normalized = excluded.name_normalized,
        type_code = excluded.type_code,
        type_name = excluded.type_name,
        address = excluded.address,
        province_code = excluded.province_code,
        province_name = excluded.province_name,
        district_code = excluded.district_code,
        district_name = excluded.district_name,
        town = excluded.town,
        phone = excluded.phone,
        homepage = excluded.homepage,
        longitude = excluded.longitude,
        latitude = excluded.latitude,
        established_date = excluded.established_date,
        verification_status = 'api-retrieved',
        source_name = excluded.source_name,
        source_url = excluded.source_url,
        source_checked_at = excluded.source_checked_at,
        snapshot_updated_at = CURRENT_TIMESTAMP,
        raw_json = excluded.raw_json
    `).bind(
      snapshot.hiraId, snapshot.name, snapshot.nameNormalized, snapshot.typeCode,
      snapshot.typeName, snapshot.address, snapshot.provinceCode, snapshot.provinceName,
      snapshot.districtCode, snapshot.districtName, snapshot.town, snapshot.phone,
      snapshot.homepage, snapshot.longitude, snapshot.latitude, snapshot.establishedDate,
      HIRA_SOURCE_NAME, HIRA_SOURCE_URL, snapshot.checkedAt, snapshot.rawJson,
    ));

    const codes = new Set([
      cleanText(departmentCode),
      cleanText(snapshot.departmentCode),
    ].filter(Boolean));
    for (const code of codes) {
      statements.push(database.prepare(`
        INSERT INTO hospital_departments (hira_id, department_code, source_checked_at)
        VALUES (?, ?, ?)
        ON CONFLICT(hira_id, department_code) DO UPDATE SET
          source_checked_at = excluded.source_checked_at
      `).bind(snapshot.hiraId, code, snapshot.checkedAt));
    }
  }

  try {
    await database.batch(statements);
    return snapshots.length;
  } catch (error) {
    console.warn('[hospital-store] snapshot write unavailable:', error?.message || error);
    return 0;
  }
}

export async function getHospitalStoreStatus(context) {
  if (!hasHospitalDatabase(context)) {
    return { configured: false, hospitalCount: 0, departmentLinkCount: 0, lastCheckedAt: null };
  }

  try {
    const database = context.env.HOSPITAL_DB;
    const [hospital, departments] = await Promise.all([
      database.prepare(`
        SELECT COUNT(*) AS hospital_count, MAX(source_checked_at) AS last_checked_at
        FROM hospitals
        WHERE verification_status IN ('api-retrieved', 'verified')
      `).first(),
      database.prepare('SELECT COUNT(*) AS department_link_count FROM hospital_departments').first(),
    ]);
    return {
      configured: true,
      hospitalCount: Number(hospital?.hospital_count || 0),
      departmentLinkCount: Number(departments?.department_link_count || 0),
      lastCheckedAt: hospital?.last_checked_at || null,
    };
  } catch (error) {
    return {
      configured: true,
      ready: false,
      hospitalCount: 0,
      departmentLinkCount: 0,
      lastCheckedAt: null,
      error: 'migration-required',
    };
  }
}

export function normalizeHospitalSnapshot(item, checkedAt = new Date().toISOString()) {
  const hiraId = cleanText(item?.ykiho || item?.hiraId || item?.id);
  const name = cleanText(item?.yadmNm || item?.name);
  const address = cleanText(item?.addr || item?.address);
  if (!hiraId || !name || !address) return null;

  return {
    hiraId,
    name,
    nameNormalized: normalizeSearchText(name),
    typeCode: cleanText(item.clCd),
    typeName: cleanText(item.clCdNm || item.type),
    address,
    provinceCode: cleanText(item.sidoCd),
    provinceName: cleanText(item.sidoCdNm),
    districtCode: cleanText(item.sgguCd),
    districtName: cleanText(item.sgguCdNm),
    town: cleanText(item.emdongNm),
    phone: cleanText(item.telno || item.phone),
    homepage: cleanText(item.hospUrl || item.url),
    longitude: finiteNumber(item.XPos ?? item.xPos ?? item.lng),
    latitude: finiteNumber(item.YPos ?? item.yPos ?? item.lat),
    establishedDate: cleanText(item.estbDd || item.openDate).replaceAll('-', ''),
    departmentCode: cleanText(item.dgsbjtCd),
    checkedAt,
    rawJson: JSON.stringify(item),
  };
}

export function snapshotRowToApiItem(row, requestedDepartmentCode = '') {
  const departmentCodes = String(row.department_codes || '').split(',').filter(Boolean);
  return {
    ykiho: row.hira_id,
    yadmNm: row.name,
    clCd: row.type_code || '',
    clCdNm: row.type_name || '',
    addr: row.address,
    sidoCd: row.province_code || '',
    sidoCdNm: row.province_name || '',
    sgguCd: row.district_code || '',
    sgguCdNm: row.district_name || '',
    emdongNm: row.town || '',
    telno: row.phone || '',
    hospUrl: row.homepage || '',
    XPos: Number(row.longitude) || 0,
    YPos: Number(row.latitude) || 0,
    estbDd: row.established_date || '',
    dgsbjtCd: requestedDepartmentCode || departmentCodes[0] || '',
    registeredDepartmentCodes: departmentCodes,
    sourceType: 'hira-snapshot',
    sourceName: row.source_name || HIRA_SOURCE_NAME,
    sourceUrl: row.source_url || HIRA_SOURCE_URL,
    verificationStatus: row.verification_status || 'api-retrieved',
    verifiedAt: String(row.source_checked_at || '').slice(0, 10),
  };
}

function hasCoordinateSearch(params) {
  return Boolean(params.get('xPos') || params.get('yPos') || params.get('radius'));
}

function addExactFilter(filters, bindings, column, value) {
  const cleanValue = cleanText(value);
  if (!cleanValue) return;
  filters.push(`${column} = ?`);
  bindings.push(cleanValue);
}

function addLikeFilter(filters, bindings, column, value) {
  const cleanValue = cleanText(value);
  if (!cleanValue) return;
  filters.push(`${column} LIKE ? ESCAPE '!'`);
  bindings.push(`%${escapeLike(cleanValue)}%`);
}

function normalizeSearchText(value) {
  return cleanText(value).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function escapeLike(value) {
  return String(value).replace(/[!%_]/g, '!$&');
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}
