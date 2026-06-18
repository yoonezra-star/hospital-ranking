/**
 * Cloudflare Pages Function - 병원 진료시간 및 기본정보 프록시
 * 경로: /api/hospital-hours
 * 
 * 원본 API: 국립중앙의료원_전국 병·의원 찾기 서비스 (HsptlAsembySearchService)
 * /getHsptlMdcncListInfoInqire
 */
export async function onRequestGet(context) {
  let API_KEY = context.env?.NEMC_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing NEMC_API_KEY environment variable' }), {
      status: 500,
      headers: corsHeaders('application/json'),
    });
  }
  try { API_KEY = decodeURIComponent(API_KEY); } catch (e) {}

  const url = new URL(context.request.url);
  const params = url.searchParams;
  const name = params.get('name');
  const address = params.get('address') || '';
  const region = params.get('region') || '';
  
  if (!name) {
    return new Response(JSON.stringify({ error: 'Missing name parameter' }), {
      status: 400, headers: corsHeaders('application/json')
    });
  }

  const BASE_URL = 'https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire';
  const apiUrl = new URL(BASE_URL);
  apiUrl.searchParams.set('serviceKey', API_KEY);
  apiUrl.searchParams.set('_type', 'json');
  apiUrl.searchParams.set('numOfRows', '5'); // 이름이 같은 병원이 있을 수 있으므로 여유있게
  apiUrl.searchParams.set('pageNo', '1');
  apiUrl.searchParams.set('QN', name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  try {
    const response = await fetch(apiUrl.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Upstream error ${response.status}` }), { status: 502, headers: corsHeaders('application/json') });
    }

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } 
    catch { return new Response(JSON.stringify({ error: 'Invalid JSON', raw: text.slice(0, 500) }), { status: 502, headers: corsHeaders('application/json') }); }

    // 데이터 가공
    const items = data?.response?.body?.items?.item;
    if (!items) {
      return new Response(JSON.stringify({ found: false }), { headers: corsHeaders('application/json') });
    }

    const list = Array.isArray(items) ? items : [items];
    const normalize = (value) => String(value || '').replace(/\s+/g, '').toLowerCase();
    const splitTerms = (value) =>
      String(value || '')
        .split(/\s+/)
        .map((part) => part.trim())
        .filter((part) => part.length >= 2);

    const targetName = normalize(name);
    const targetAddress = normalize(address);
    const targetRegion = normalize(region);
    const addressTerms = splitTerms(address);

    const scored = list.map((item) => {
      const itemName = normalize(item.dutyName);
      const itemAddress = normalize(item.dutyAddr);
      let score = 0;

      if (itemName === targetName) score += 120;
      else if (itemName.includes(targetName)) score += 70;

      if (targetRegion && itemAddress.includes(targetRegion)) score += 30;
      if (targetAddress && itemAddress.includes(targetAddress)) score += 60;

      const termMatches = addressTerms.filter((term) => item.dutyAddr?.includes(term)).length;
      score += termMatches * 8;

      return { item, score };
    }).sort((left, right) => right.score - left.score);

    const match = scored[0]?.item || list[0];

    const normalizeTimeValue = (value) => {
      if (value === null || value === undefined || value === '') return '';
      const digits = String(value).replace(/\D/g, '');
      return digits.padStart(4, '0').slice(0, 4);
    };
    const formatTime = (s, c) => {
      const start = normalizeTimeValue(s);
      const close = normalizeTimeValue(c);
      if (!start || !close || start.length !== 4 || close.length !== 4) return null;
      return `${start.slice(0, 2)}:${start.slice(2, 4)} ~ ${close.slice(0, 2)}:${close.slice(2, 4)}`;
    };

    const result = {
      found: true,
      hpid: match.hpid,
      dutyName: match.dutyName,
      dutyAddr: match.dutyAddr,
      dutyTel1: match.dutyTel1,
      dutyMapimg: match.dutyMapimg || null,
      dutyInf: match.dutyInf,
      wgs84Lat: match.wgs84Lat || null,
      wgs84Lon: match.wgs84Lon || null,
      hours: {
        mon: formatTime(match.dutyTime1s, match.dutyTime1c),
        tue: formatTime(match.dutyTime2s, match.dutyTime2c),
        wed: formatTime(match.dutyTime3s, match.dutyTime3c),
        thu: formatTime(match.dutyTime4s, match.dutyTime4c),
        fri: formatTime(match.dutyTime5s, match.dutyTime5c),
        sat: formatTime(match.dutyTime6s, match.dutyTime6c),
        sun: formatTime(match.dutyTime7s, match.dutyTime7c),
        holiday: formatTime(match.dutyTime8s, match.dutyTime8c),
      }
    };

    return new Response(JSON.stringify(result), { headers: corsHeaders('application/json', 'public, max-age=3600') });

  } catch (err) {
    clearTimeout(timeoutId);
    let status = 500;
    if (err.name === 'AbortError') status = 504;
    return new Response(JSON.stringify({ error: err.message }), { status, headers: corsHeaders('application/json') });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders(contentType, cacheControl) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (contentType) h['Content-Type'] = contentType;
  if (cacheControl) h['Cache-Control'] = cacheControl;
  return h;
}
