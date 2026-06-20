/**
 * Cloudflare Pages Function - hospital opening hours proxy
 * Route: /api/hospital-hours
 *
 * Source API: NEMC HsptlAsembySearchService /getHsptlMdcncListInfoInqire
 */
export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  let apiKey = context.env?.NEMC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing NEMC_API_KEY environment variable' }), {
      status: 500,
      headers: corsHeaders('application/json'),
    });
  }

  try {
    apiKey = decodeURIComponent(apiKey);
  } catch (error) {}

  const url = new URL(context.request.url);
  const name = url.searchParams.get('name');
  const address = url.searchParams.get('address') || '';
  const region = url.searchParams.get('region') || '';

  if (!name) {
    return new Response(JSON.stringify({ error: 'Missing name parameter' }), {
      status: 400,
      headers: corsHeaders('application/json'),
    });
  }

  const apiUrl = new URL('https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire');
  apiUrl.searchParams.set('serviceKey', apiKey);
  apiUrl.searchParams.set('_type', 'json');
  apiUrl.searchParams.set('numOfRows', '5');
  apiUrl.searchParams.set('pageNo', '1');
  apiUrl.searchParams.set('QN', name);

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

    const list = Array.isArray(items) ? items : [items];
    const normalize = (value) => String(value || '').replace(/\s+/g, '').toLowerCase();
    const splitTerms = (value) => String(value || '')
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2);

    const targetName = normalize(name);
    const targetAddress = normalize(address);
    const targetRegion = normalize(region);
    const addressTerms = splitTerms(address);

    const scored = list
      .map((item) => {
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
      })
      .sort((left, right) => right.score - left.score);

    const bestMatch = scored[0] || { item: list[0], score: 0 };
    const match = bestMatch.item || list[0];

    const normalizeTimeValue = (value) => {
      if (value === null || value === undefined || value === '') return '';
      const digits = String(value).replace(/\D/g, '');
      return digits.padStart(4, '0').slice(0, 4);
    };
    const formatTime = (startValue, closeValue) => {
      const start = normalizeTimeValue(startValue);
      const close = normalizeTimeValue(closeValue);
      if (!start || !close || start.length !== 4 || close.length !== 4) return null;
      return `${start.slice(0, 2)}:${start.slice(2, 4)} ~ ${close.slice(0, 2)}:${close.slice(2, 4)}`;
    };

    const hours = {
      mon: formatTime(match.dutyTime1s, match.dutyTime1c),
      tue: formatTime(match.dutyTime2s, match.dutyTime2c),
      wed: formatTime(match.dutyTime3s, match.dutyTime3c),
      thu: formatTime(match.dutyTime4s, match.dutyTime4c),
      fri: formatTime(match.dutyTime5s, match.dutyTime5c),
      sat: formatTime(match.dutyTime6s, match.dutyTime6c),
      sun: formatTime(match.dutyTime7s, match.dutyTime7c),
      holiday: formatTime(match.dutyTime8s, match.dutyTime8c),
    };

    const operationSummary = [];
    if (hours.mon || hours.tue || hours.wed || hours.thu || hours.fri) operationSummary.push('평일 운영 정보 확인');
    if (hours.sat) operationSummary.push(`토요일 ${hours.sat}`);
    if (hours.sun) operationSummary.push(`일요일 ${hours.sun}`);
    if (hours.holiday) operationSummary.push(`공휴일 ${hours.holiday}`);
    if (match.dutyInf) operationSummary.push(match.dutyInf);

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
      matchScore: bestMatch.score || 0,
      matchedSummary: [match.dutyName, match.dutyAddr].filter(Boolean).join(' / '),
      operationSummary,
      hours,
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
