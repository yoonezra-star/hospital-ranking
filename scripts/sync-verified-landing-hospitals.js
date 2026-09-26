const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SITE_ORIGIN = process.env.HOSPITAL_SITE_ORIGIN || 'https://hospital-ranking.kr';
const OUTPUT = path.join(ROOT, 'data/verified-landing-hospitals.json');
const SOURCE_NAME = '건강보험심사평가원 병원기본정보 API';
const SOURCE_URL = 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000';

const REGION_CODES = {
  서울: '110000', 부산: '210000', 인천: '220000', 대구: '230000',
  대전: '250000', 경기: '310000',
};
const DISTRICT_CODES = { 강남구: '110001', 송파구: '110018' };

const DEPARTMENTS = {
  dental: { code: '49', name: '치과' },
  ophthalmology: { code: '12', name: '안과' },
  internal: { code: '01', name: '내과' },
  ent: { code: '13', name: '이비인후과' },
  orthopedic: { code: '05', name: '정형외과' },
  pain: { code: '09', name: '마취통증의학과' },
  pediatric: { code: '11', name: '소아청소년과' },
  obgyn: { code: '10', name: '산부인과' },
  urology: { code: '15', name: '비뇨의학과' },
  psychiatry: { code: '03', name: '정신건강의학과' },
  rehab: { code: '21', name: '재활의학과' },
  dermatology: { code: '14', name: '피부과' },
};

async function main() {
  const pages = loadArray('js/landing-pages.js', 'LANDING_PAGES');
  const queries = new Map();

  for (const page of pages) {
    const profile = resolveProfile(page);
    if (!profile.departmentId) continue;
    const department = DEPARTMENTS[profile.departmentId];
    const regionCode = REGION_CODES[profile.region] || '';
    const districtCode = DISTRICT_CODES[profile.district] || '';
    const key = `${regionCode}|${districtCode}|${department.code}`;
    queries.set(key, { regionCode, districtCode, departmentId: profile.departmentId, department });
  }

  const records = new Map();
  const queryList = Array.from(queries.values());
  for (let index = 0; index < queryList.length; index += 4) {
    const batch = queryList.slice(index, index + 4);
    const results = await Promise.all(batch.map(fetchVerifiedHospitals));
    results.flat().forEach((record) => mergeRecord(records, record));
    if (index + 4 < queryList.length) await delay(250);
  }

  const hospitals = Array.from(records.values())
    .map((record) => ({
      ...record,
      registeredDepartmentIds: Array.from(record.registeredDepartmentIds).sort(),
      registeredDepartmentCodes: Array.from(record.registeredDepartmentCodes).sort(),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'ko') || left.hiraId.localeCompare(right.hiraId));

  if (hospitals.length < 30) {
    throw new Error(`Verified landing snapshot is unexpectedly small: ${hospitals.length}`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceType: 'hira-api-snapshot',
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    queryCount: queryList.length,
    totalCount: hospitals.length,
    hospitals,
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Saved ${hospitals.length} verified hospitals from ${queryList.length} landing queries.`);
}

async function fetchVerifiedHospitals(query) {
  const url = new URL('/api/hospitals', SITE_ORIGIN);
  url.searchParams.set('live', '1');
  url.searchParams.set('dgsbjtCd', query.department.code);
  url.searchParams.set('numOfRows', '50');
  if (query.regionCode) url.searchParams.set('sidoCd', query.regionCode);
  if (query.districtCode) url.searchParams.set('sgguCd', query.districtCode);

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  const dataSource = response.headers.get('x-data-source') || '';
  const payload = await response.json();
  if (payload.fallback || dataSource === 'local-fallback') {
    throw new Error(`${url} returned unverified fallback data`);
  }

  const rawItems = payload?.response?.body?.items?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  if (!items.length) throw new Error(`${url} returned no official hospitals`);
  return items.map((item) => normalizeHospital(item, query));
}

function normalizeHospital(item, query) {
  const hiraId = clean(item.ykiho || item.hiraId || item.id);
  const address = clean(item.addr || item.address);
  const sourceDate = formatDate(item.verifiedAt) || new Date().toISOString().slice(0, 10);
  const region = normalizeRegion(item.sidoCdNm || address.split(/\s+/)[0]);
  return {
    id: hiraId,
    hiraId,
    name: clean(item.yadmNm || item.name),
    type: clean(item.clCdNm || item.type) || '의료기관',
    department: query.department.name,
    departmentId: query.departmentId,
    registeredDepartmentIds: new Set([query.departmentId]),
    registeredDepartmentCodes: new Set([query.department.code]),
    address,
    region,
    regionCode: clean(item.sidoCd),
    district: clean(item.sgguCdNm),
    districtCode: clean(item.sgguCd),
    town: clean(item.emdongNm),
    phone: clean(item.telno || item.phone),
    openDate: formatDate(item.estbDd || item.openDate),
    sourceType: 'hira-api',
    sourceName: clean(item.sourceName) || SOURCE_NAME,
    sourceUrl: clean(item.sourceUrl) || SOURCE_URL,
    verificationStatus: 'api-retrieved',
    verifiedAt: sourceDate,
  };
}

function mergeRecord(records, incoming) {
  if (!incoming.hiraId || !incoming.name || !incoming.address) return;
  const current = records.get(incoming.hiraId);
  if (!current) {
    records.set(incoming.hiraId, incoming);
    return;
  }
  incoming.registeredDepartmentIds.forEach((value) => current.registeredDepartmentIds.add(value));
  incoming.registeredDepartmentCodes.forEach((value) => current.registeredDepartmentCodes.add(value));
}

function resolveProfile(page) {
  let region = page.region;
  let district = '';
  if (region === '강남') {
    region = '서울';
    district = '강남구';
  } else if (region === '송파') {
    region = '서울';
    district = '송파구';
  }
  if (region === '전국') region = '';
  const href = page.href;
  let departmentId = '';
  if (/dental|implant|parking-dental/.test(href)) departmentId = 'dental';
  else if (/ophthalmology|lasik|cataract/.test(href)) departmentId = 'ophthalmology';
  else if (/internal|endoscopy/.test(href)) departmentId = 'internal';
  else if (href.includes('ent')) departmentId = 'ent';
  else if (href.includes('orthopedic')) departmentId = 'orthopedic';
  else if (href.includes('pain')) departmentId = 'pain';
  else if (/pediatric|vaccination/.test(href)) departmentId = 'pediatric';
  else if (/obgyn|womens-checkup/.test(href)) departmentId = 'obgyn';
  else if (/urology|urinary-stone/.test(href)) departmentId = 'urology';
  else if (href.includes('psychiatry')) departmentId = 'psychiatry';
  else if (/rehab|manual-therapy/.test(href)) departmentId = 'rehab';
  else if (href.includes('dermatology')) departmentId = 'dermatology';
  return { region, district, departmentId };
}

function loadArray(file, constName) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const match = source.match(new RegExp(`const ${constName} = \\[(.*?)\\];`, 's'));
  if (!match) throw new Error(`${constName} not found in ${file}`);
  return Function(`return [${match[1]}];`)();
}

function normalizeRegion(value) {
  const text = clean(value);
  const aliases = { 서울특별시: '서울', 부산광역시: '부산', 인천광역시: '인천', 대구광역시: '대구', 대전광역시: '대전', 경기도: '경기' };
  return aliases[text] || text.replace(/(특별시|광역시|특별자치시|특별자치도|자치도|도)$/u, '');
}

function formatDate(value) {
  const digits = clean(value).replace(/[^0-9]/g, '');
  return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : '';
}

function clean(value) {
  return String(value ?? '').trim();
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
