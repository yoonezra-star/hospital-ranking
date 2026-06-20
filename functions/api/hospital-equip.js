/**
 * Cloudflare Pages Function - hospital equipment proxy
 * Route: /api/hospital-equip
 *
 * Source API: HIRA MadmDtlInfoService2.8 /getEqpInfo2.8
 */
export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  let apiKey = context.env?.HIRA_DTL_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing HIRA_DTL_API_KEY environment variable' }), {
      status: 500,
      headers: corsHeaders('application/json'),
    });
  }

  try {
    apiKey = decodeURIComponent(apiKey);
  } catch (error) {}

  const url = new URL(context.request.url);
  const ykiho = url.searchParams.get('ykiho');

  if (!ykiho) {
    return new Response(JSON.stringify({ error: 'Missing ykiho parameter' }), {
      status: 400,
      headers: corsHeaders('application/json'),
    });
  }

  const apiUrl = new URL('https://apis.data.go.kr/B551182/MadmDtlInfoService2.8/getEqpInfo2.8');
  apiUrl.searchParams.set('serviceKey', apiKey);
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

    try {
      data = JSON.parse(text);
    } catch (error) {
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
      return new Response(JSON.stringify({ found: false, equips: [] }), {
        headers: corsHeaders('application/json'),
      });
    }

    const list = Array.isArray(items) ? items : [items];
    const equips = list.map((item) => item.eqpNm).filter(Boolean);
    const equipDetails = list
      .map((item) => ({
        name: item.eqpNm || '',
        count: Number(item.eqpCnt || 0),
      }))
      .filter((item) => item.name);

    const first = list[0] || {};
    const facility = {
      stdSickbdCnt: Number(first.stdSickbdCnt || 0),
      permSbdCnt: Number(first.permSbdCnt || 0),
      totArea: first.totArea || null,
    };

    const facilitySummary = [];
    if (facility.stdSickbdCnt > 0) facilitySummary.push(`일반 병상 ${facility.stdSickbdCnt}`);
    if (facility.permSbdCnt > 0) facilitySummary.push(`특수 병상 ${facility.permSbdCnt}`);
    if (facility.totArea) facilitySummary.push(`면적 ${facility.totArea}`);

    const topEquipment = equipDetails
      .slice()
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);

    const liveResponse = new Response(JSON.stringify({
      found: true,
      ykiho,
      equips,
      equipDetails,
      topEquipment,
      facility,
      facilitySummary,
    }), {
      headers: corsHeaders('application/json', 'public, max-age=3600, stale-while-revalidate=86400'),
    });

    context.waitUntil(cache.put(cacheKey, liveResponse.clone()));
    return withDataSourceHeader(liveResponse, 'live');
  } catch (error) {
    clearTimeout(timeoutId);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return withDataSourceHeader(cached, 'stale-cache');
    }

    return new Response(JSON.stringify({
      found: false,
      equips: [],
      error: error.name === 'AbortError' ? 'Upstream API request timed out' : error.message,
    }), {
      headers: corsHeaders('application/json'),
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
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
