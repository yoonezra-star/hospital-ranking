/**
 * Cloudflare Pages Function - Naver Search proxy (blog / cafearticle)
 * Route: /api/search
 */
export async function onRequestGet(context) {
  const clientId = context.env?.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = context.env?.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return jsonResponse({
      items: [],
      fallback: true,
      message: 'Naver search API credentials are not configured.',
    }, 200, 'public, max-age=120');
  }

  const url = new URL(context.request.url);
  const params = url.searchParams;
  const query = params.get('query');

  if (!query) {
    return jsonResponse({ error: 'Missing query parameter.' }, 400);
  }

  const type = params.get('type') === 'cafearticle' ? 'cafearticle' : 'blog';
  const display = params.get('display') || '3';
  const sort = params.get('sort') || 'sim';

  const apiUrl = new URL(`https://openapi.naver.com/v1/search/${type}.json`);
  apiUrl.searchParams.set('query', query);
  apiUrl.searchParams.set('display', display);
  apiUrl.searchParams.set('sort', sort);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return jsonResponse({
        items: [],
        fallback: true,
        message: `Upstream API returned ${response.status}`,
      }, 200, 'public, max-age=120');
    }

    const data = await response.json();
    return jsonResponse(data, 200, 'public, max-age=300');
  } catch (error) {
    clearTimeout(timeoutId);

    const message = error.name === 'AbortError'
      ? 'Upstream API request timed out'
      : error.message;

    return jsonResponse({
      items: [],
      fallback: true,
      message,
    }, 200, 'public, max-age=120');
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function jsonResponse(payload, status = 200, cacheControl) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders('application/json', cacheControl),
  });
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