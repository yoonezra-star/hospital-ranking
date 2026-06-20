/**
 * Cloudflare Pages Function - hospital details proxy
 * Route: /api/hospital-details
 *
 * Source API: HIRA MadmDtlInfoService2.8 /getDtlInfo2.8
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

  const apiUrl = new URL('https://apis.data.go.kr/B551182/MadmDtlInfoService2.8/getDtlInfo2.8');
  apiUrl.searchParams.set('serviceKey', apiKey);
  apiUrl.searchParams.set('_type', 'json');
  apiUrl.searchParams.set('ykiho', ykiho);

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

      return new Response(JSON.stringify({ found: false, error: `Upstream error ${response.status}` }), {
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

      return new Response(JSON.stringify({ found: false, error: 'Invalid JSON', raw: text.slice(0, 500) }), {
        headers: corsHeaders('application/json'),
      });
    }

    const items = data?.response?.body?.items?.item;
    if (!items) {
      return new Response(JSON.stringify({ found: false }), {
        headers: corsHeaders('application/json'),
      });
    }

    const item = Array.isArray(items) ? items[0] : items;
    const fmtTime = (value) => {
      if (!value) return null;
      const textValue = String(value).padStart(4, '0');
      return `${textValue.slice(0, 2)}:${textValue.slice(2, 4)}`;
    };
    const fmtRange = (start, end) => {
      const open = fmtTime(start);
      const close = fmtTime(end);
      return open && close ? `${open} ~ ${close}` : null;
    };

    const parkingSummary = [];
    if (item.parkXpnsYn) {
      parkingSummary.push(item.parkXpnsYn === 'Y' ? '유료 주차' : '무료 주차');
    }
    if (item.parkQty) {
      parkingSummary.push(`주차 가능 ${item.parkQty}대`);
    }
    if (item.parkEtc) {
      parkingSummary.push(item.parkEtc);
    }

    const emergencySummary = [];
    if (item.emyDayYn === 'Y') emergencySummary.push('주간 응급 진료 가능');
    if (item.emyNgtYn === 'Y') emergencySummary.push('야간 응급 진료 가능');
    if (item.emyDayTelNo1) emergencySummary.push(`응급 문의 ${item.emyDayTelNo1}`);

    const receptionSummary = [];
    if (item.rcvWeek) receptionSummary.push(`평일 접수 ${item.rcvWeek}`);
    if (item.rcvSat) receptionSummary.push(`토요일 접수 ${item.rcvSat}`);
    if (item.lunchWeek) receptionSummary.push(`점심시간 ${item.lunchWeek}`);

    const result = {
      found: true,
      ykiho,
      yadmNm: item.yadmNm || null,
      addr: item.addr || null,
      telno: item.telno || null,
      hospUrl: item.hospUrl || null,
      parkXpnsYn: item.parkXpnsYn,
      parkEtc: item.parkEtc,
      parkQty: item.parkQty,
      hours: {
        mon: fmtRange(item.trmtMonStart, item.trmtMonEnd),
        tue: fmtRange(item.trmtTueStart, item.trmtTueEnd),
        wed: fmtRange(item.trmtWedStart, item.trmtWedEnd),
        thu: fmtRange(item.trmtThuStart, item.trmtThuEnd),
        fri: fmtRange(item.trmtFriStart, item.trmtFriEnd),
        sat: fmtRange(item.trmtSatStart, item.trmtSatEnd),
        sun: item.noTrmtSun || '휴진',
        holiday: item.noTrmtHoli || '휴진',
      },
      lunchWeek: item.lunchWeek || null,
      rcvWeek: item.rcvWeek || null,
      rcvSat: item.rcvSat || null,
      emyDayYn: item.emyDayYn,
      emyNgtYn: item.emyNgtYn,
      emyDayTelNo1: item.emyDayTelNo1,
      parkingSummary,
      emergencySummary,
      receptionSummary,
    };

    const liveResponse = new Response(JSON.stringify(result), {
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
