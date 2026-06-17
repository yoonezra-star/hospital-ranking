/**
 * Cloudflare Pages Function - 병원 진료시간 및 기본정보 프록시
 * 경로: /api/hospital-hours
 * 
 * 원본 API: 국립중앙의료원_전국 병·의원 찾기 서비스 (HsptlAsembySearchService)
 * /getHsptlMdcncListInfoInqire
 */
export async function onRequestGet(context) {
  let API_KEY = context.env?.NEMC_API_KEY || '6016d506ccaac7277d8a3492ca0cce1845c6cee2acf054d92ac5cf0ef3049d0d';
  try { API_KEY = decodeURIComponent(API_KEY); } catch (e) {}

  const url = new URL(context.request.url);
  const params = url.searchParams;
  const name = params.get('name');
  
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
    const match = list.find(h => h.dutyName && h.dutyName.includes(name)) || list[0];

    const formatTime = (s, c) => {
      if (!s || !c) return null;
      return `${s.slice(0,2)}:${s.slice(2,4)} ~ ${c.slice(0,2)}:${c.slice(2,4)}`;
    };

    const result = {
      found: true,
      hpid: match.hpid,
      dutyName: match.dutyName,
      dutyAddr: match.dutyAddr,
      dutyTel1: match.dutyTel1,
      dutyInf: match.dutyInf,
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
