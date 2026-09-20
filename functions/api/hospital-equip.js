/**
 * Cloudflare Pages Function - hospital equipment proxy
 * Route: /api/hospital-equip
 *
 * Source API: HIRA MadmDtlInfoService2.8 /getEqpInfo2.8
 */
export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  let apiKey = context.env?.HIRA_DTL_API_KEY || context.env?.DATA_API_KEY;
  const url = new URL(context.request.url);
  const ykiho = url.searchParams.get('ykiho');

  if (!ykiho) {
    return new Response(JSON.stringify({ error: 'Missing ykiho parameter' }), {
      status: 400,
      headers: corsHeaders('application/json'),
    });
  }

  if (!apiKey) {
    return localFallback(context, ykiho, 'missing-api-key');
  }

  try {
    apiKey = decodeURIComponent(apiKey);
  } catch (error) {}

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

      return localFallback(context, ykiho, `upstream-${response.status}`);
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

      return localFallback(context, ykiho, 'invalid-upstream-json');
    }

    const items = data?.response?.body?.items?.item;
    if (!items) {
      return localFallback(context, ykiho, 'empty-upstream');
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

    return localFallback(
      context,
      ykiho,
      error.name === 'AbortError' ? 'upstream-timeout' : `upstream-error-${sanitizeHeaderValue(error.message)}`,
    );
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

async function localFallback(context, ykiho, reason) {
  const hospital = await findLocalHospital(context, ykiho);
  const headers = corsHeaders('application/json', 'public, max-age=120, stale-while-revalidate=600');
  headers['X-Data-Source'] = 'local-fallback';
  headers['X-Fallback-Reason'] = sanitizeHeaderValue(reason);

  const equipmentNames = String(hospital?.equipment || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const facility = {
    stdSickbdCnt: Number(hospital?.bedCount || 0),
    permSbdCnt: Number(hospital?.roomCount || 0),
    totArea: hospital?.area || null,
  };

  const facilitySummary = [];
  if (facility.stdSickbdCnt > 0) facilitySummary.push(`병상 ${facility.stdSickbdCnt}`);
  if (facility.permSbdCnt > 0) facilitySummary.push(`진료실 ${facility.permSbdCnt}`);
  if (facility.totArea) facilitySummary.push(`면적 ${facility.totArea}`);

  return new Response(JSON.stringify({
    found: Boolean(hospital && (equipmentNames.length || facilitySummary.length)),
    fallback: true,
    fallbackReason: reason,
    ykiho,
    equips: equipmentNames,
    equipDetails: equipmentNames.map((name) => ({ name, count: 0 })),
    topEquipment: equipmentNames.slice(0, 6).map((name) => ({ name, count: 0 })),
    facility,
    facilitySummary,
  }), {
    headers,
  });
}

async function findLocalHospital(context, ykiho) {
  if (!context.env?.ASSETS?.fetch || !ykiho) return null;
  const assetUrl = new URL('/data/hospitals.json', context.request.url);
  const response = await context.env.ASSETS.fetch(assetUrl.toString());
  if (!response.ok) return null;
  const data = await response.json();
  return (Array.isArray(data.hospitals) ? data.hospitals : [])
    .find((hospital) => String(hospital.id) === String(ykiho) || String(hospital.hiraId) === String(ykiho)) || null;
}

function sanitizeHeaderValue(value) {
  return String(value || '')
    .replace(/[^\w.-]+/g, '-')
    .slice(0, 120);
}
