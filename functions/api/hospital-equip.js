/**
 * Cloudflare Pages Function - 병원 시설/장비 프록시
 * 경로: /api/hospital-equip
 * 
 * 원본 API: 건강보험심사평가원_의료기관별상세정보서비스 (MadmDtlInfoService2.8)
 * /getEqpInfo2.8 - 장비/시설/병상 정보
 */
export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  let API_KEY = context.env?.HIRA_DTL_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing HIRA_DTL_API_KEY environment variable' }), {
      status: 500,
      headers: corsHeaders('application/json'),
    });
  }
  try { API_KEY = decodeURIComponent(API_KEY); } catch (e) {}

  const url = new URL(context.request.url);
  const ykiho = url.searchParams.get('ykiho');
  
  if (!ykiho) {
    return new Response(JSON.stringify({ error: 'Missing ykiho parameter' }), {
      status: 400, headers: corsHeaders('application/json')
    });
  }

  const BASE_URL = 'https://apis.data.go.kr/B551182/MadmDtlInfoService2.8/getEqpInfo2.8';
  const apiUrl = new URL(BASE_URL);
  apiUrl.searchParams.set('serviceKey', API_KEY);
  apiUrl.searchParams.set('_type', 'json');
  apiUrl.searchParams.set('ykiho', ykiho);
  apiUrl.searchParams.set('numOfRows', '100');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(apiUrl.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return withDataSourceHeader(cached, 'stale-cache');
      }

      return new Response(JSON.stringify({ found: false, equips: [], error: `Upstream error ${response.status}` }), {
        headers: corsHeaders('application/json'),
      });
    }

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } 
    catch {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return withDataSourceHeader(cached, 'stale-cache');
      }

      return new Response(JSON.stringify({ found: false, equips: [], error: 'Invalid JSON' }), {
        headers: corsHeaders('application/json'),
      });
    }

    const items = data?.response?.body?.items?.item;
    if (!items) {
      return new Response(JSON.stringify({ found: false, equips: [] }), { headers: corsHeaders('application/json') });
    }

    const list = Array.isArray(items) ? items : [items];
    
    // 장비명 추출
    const equips = list.map(item => item.eqpNm).filter(Boolean);
    // 장비수량 추출
    const equipDetails = list.map(item => ({
      name: item.eqpNm || '',
      count: item.eqpCnt || 0,
    })).filter(d => d.name);

    // 시설 정보 (첫 항목에서 추출)
    const first = list[0] || {};
    const facility = {
      // 병상수
      stdSickbdCnt: first.stdSickbdCnt || 0,  // 일반 병상
      permSbdCnt: first.permSbdCnt || 0,      // 허가 병상
      // 면적
      totArea: first.totArea || null,
    };

    const liveResponse = new Response(JSON.stringify({ 
      found: true, 
      equips,
      equipDetails,
      facility,
    }), { headers: corsHeaders('application/json', 'public, max-age=3600, stale-while-revalidate=86400') });

    context.waitUntil(cache.put(cacheKey, liveResponse.clone()));

    return withDataSourceHeader(liveResponse, 'live');

  } catch (err) {
    clearTimeout(timeoutId);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return withDataSourceHeader(cached, 'stale-cache');
    }

    return new Response(JSON.stringify({
      found: false,
      equips: [],
      error: err.name === 'AbortError' ? 'Upstream API request timed out' : err.message,
    }), { headers: corsHeaders('application/json') });
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

function withDataSourceHeader(response, value) {
  const headers = new Headers(response.headers);
  headers.set('X-Data-Source', value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
