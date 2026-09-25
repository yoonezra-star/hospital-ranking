import { searchHospitalSnapshots, storeHospitalSnapshots } from '../_lib/hospital-store.js';

/**
 * Cloudflare Pages Function - hospital API proxy.
 *
 * Public data API is tried first when DATA_API_KEY is configured.
 * If the upstream API is slow, missing, or invalid, this endpoint still returns
 * the curated local hospital dataset so the site does not expose a broken API.
 */
export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const cache = caches.default;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  const params = requestUrl.searchParams;
  const apiKey = normalizeApiKey(context.env?.DATA_API_KEY);
  const wantsLive = params.get('live') === 'true' || params.get('live') === '1';

  if (!wantsLive) {
    const storedResponse = await databaseFallback(context, params);
    if (storedResponse) return storedResponse;
    return localFallback(context, params, 'local-default', 200);
  }

  if (!apiKey) {
    const storedResponse = await databaseFallback(context, params);
    if (storedResponse) return storedResponse;
    return localFallback(context, params, 'missing-api-key', 200);
  }

  const apiUrl = buildPublicApiUrl(apiKey, params);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(apiUrl.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const cached = await cache.match(cacheKey);
      if (cached) return withDataSourceHeader(cached, 'stale-cache');
      const storedResponse = await databaseFallback(context, params);
      if (storedResponse) return storedResponse;
      return localFallback(context, params, `upstream-${response.status}`, 200);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cached = await cache.match(cacheKey);
      if (cached) return withDataSourceHeader(cached, 'stale-cache');
      const storedResponse = await databaseFallback(context, params);
      if (storedResponse) return storedResponse;
      return localFallback(context, params, 'invalid-upstream-json', 200);
    }

    const items = extractPublicApiItems(data);
    if (items.length === 0) {
      const cached = await cache.match(cacheKey);
      if (cached) return withDataSourceHeader(cached, 'stale-cache');
      const storedResponse = await databaseFallback(context, params);
      if (storedResponse) return storedResponse;
      return localFallback(context, params, 'empty-upstream', 200);
    }

    const liveHeaders = corsHeaders('application/json', 'public, max-age=300, stale-while-revalidate=3600');
    liveHeaders['X-Data-Source'] = 'live';

    const liveResponse = new Response(JSON.stringify(data), {
      headers: liveHeaders,
    });

    const backgroundTasks = [cache.put(cacheKey, liveResponse.clone())];
    backgroundTasks.push(storeHospitalSnapshots(context, items, params.get('dgsbjtCd') || ''));
    context.waitUntil(Promise.all(backgroundTasks));

    return liveResponse;
  } catch (error) {
    clearTimeout(timeoutId);

    const cached = await cache.match(cacheKey);
    if (cached) return withDataSourceHeader(cached, 'stale-cache');

    const storedResponse = await databaseFallback(context, params);
    if (storedResponse) return storedResponse;

    const reason = error?.name === 'AbortError'
      ? 'upstream-timeout'
      : `upstream-error-${sanitizeHeaderValue(error?.message || 'unknown')}`;
    return localFallback(context, params, reason, 200);
  }
}

async function databaseFallback(context, params) {
  const result = await searchHospitalSnapshots(context, params);
  if (!result || result.items.length === 0) return null;

  const payload = {
    response: {
      header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
      body: {
        items: { item: result.items },
        numOfRows: result.pageSize,
        pageNo: result.page,
        totalCount: result.totalCount,
      },
    },
    fromDatabase: true,
    sourceType: 'hira-snapshot',
    sourceName: '건강보험심사평가원 병원기본정보 API 저장본',
    sourceCheckedAt: result.sourceCheckedAt || null,
  };

  return jsonResponse(payload, 200, 'd1-snapshot', '', 'public, max-age=300, stale-while-revalidate=1800');
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function buildPublicApiUrl(apiKey, params) {
  const apiUrl = new URL('https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList');
  apiUrl.searchParams.set('serviceKey', apiKey);
  apiUrl.searchParams.set('_type', 'json');
  apiUrl.searchParams.set('numOfRows', String(clampNumber(params.get('numOfRows') || params.get('limit'), 1, 50, 10)));
  apiUrl.searchParams.set('pageNo', String(clampNumber(params.get('pageNo') || params.get('page'), 1, 1000, 1)));

  const optionalParams = ['ykiho', 'sidoCd', 'sgguCd', 'emdongNm', 'yadmNm', 'clCd', 'dgsbjtCd', 'xPos', 'yPos', 'radius'];
  optionalParams.forEach((key) => {
    const value = params.get(key);
    if (value) apiUrl.searchParams.set(key, value);
  });

  return apiUrl;
}

async function localFallback(context, params, reason, status = 200) {
  const localData = await readLocalHospitalData(context);
  const allHospitals = Array.isArray(localData.hospitals) ? localData.hospitals : [];
  const filteredHospitals = filterLocalHospitals(allHospitals, params);
  const page = clampNumber(params.get('pageNo') || params.get('page'), 1, 1000, 1);
  const pageSize = clampNumber(params.get('numOfRows') || params.get('limit'), 1, 100, 20);
  const start = (page - 1) * pageSize;
  const hospitals = filteredHospitals.slice(start, start + pageSize);

  return jsonResponse({
    hospitals,
    totalCount: filteredHospitals.length,
    page,
    pageSize,
    fromMock: true,
    fallback: true,
    fallbackReason: reason,
    generatedAt: localData.generatedAt || null,
  }, status, 'local-fallback', reason, 'public, max-age=120, stale-while-revalidate=600');
}

async function readLocalHospitalData(context) {
  if (!context.env?.ASSETS?.fetch) {
    return { generatedAt: null, hospitals: [] };
  }
  const assetUrl = new URL('/data/hospitals.json', context.request.url);
  const response = await context.env.ASSETS.fetch(assetUrl.toString());
  if (!response.ok) {
    return { generatedAt: null, hospitals: [] };
  }
  return response.json();
}

function filterLocalHospitals(hospitals, params) {
  return hospitals.filter((hospital) => {
    if (params.get('ykiho') && String(hospital.id) !== params.get('ykiho')) return false;
    if (params.get('id') && String(hospital.id) !== params.get('id')) return false;
    if (params.get('sidoCd') && String(hospital.regionCode) !== params.get('sidoCd')) return false;
    if (params.get('dgsbjtCd') && String(hospital.departmentId) !== normalizeDepartmentCode(params.get('dgsbjtCd'))) return false;
    if (params.get('yadmNm') && !containsText(hospital, params.get('yadmNm'))) return false;
    if (params.get('emdongNm') && !containsText(hospital, params.get('emdongNm'))) return false;
    return true;
  });
}

function containsText(hospital, keyword) {
  const needle = normalizeText(keyword);
  if (!needle) return true;
  return normalizeText([
    hospital.name,
    hospital.address,
    hospital.region,
    hospital.district,
    hospital.town,
    hospital.department,
    hospital.type,
  ].filter(Boolean).join(' ')).includes(needle);
}

function extractPublicApiItems(data) {
  const item = data?.response?.body?.items?.item;
  if (Array.isArray(item)) return item;
  if (item && typeof item === 'object') return [item];
  if (Array.isArray(data?.hospitals)) return data.hospitals;
  return [];
}

function normalizeApiKey(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function normalizeDepartmentCode(value) {
  const map = {
    '01': 'internal',
    '03': 'psychiatry',
    '04': 'surgery',
    '05': 'orthopedic',
    '06': 'neurosurgery',
    '08': 'plastic',
    '09': 'pain',
    '10': 'obgyn',
    '11': 'pediatric',
    '12': 'ophthalmology',
    '13': 'ent',
    '14': 'dermatology',
    '15': 'urology',
    '21': 'rehab',
    '23': 'familymed',
    '49': 'dental',
    '80': 'korean',
  };
  return map[String(value || '').trim()] || String(value || '').trim();
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function jsonResponse(payload, status, dataSource, reason, cacheControl) {
  const headers = corsHeaders('application/json', cacheControl);
  headers['X-Data-Source'] = dataSource;
  headers['X-Fallback-Reason'] = sanitizeHeaderValue(reason);
  return new Response(JSON.stringify(payload), { status, headers });
}

function corsHeaders(contentType, cacheControl) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (contentType) headers['Content-Type'] = contentType;
  if (cacheControl) headers['Cache-Control'] = cacheControl;
  return headers;
}

function withDataSourceHeader(response, value) {
  const headers = new Headers(response.headers);
  headers.set('X-Data-Source', value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function sanitizeHeaderValue(value) {
  return String(value || '')
    .replace(/[^\w.-]+/g, '-')
    .slice(0, 120);
}
