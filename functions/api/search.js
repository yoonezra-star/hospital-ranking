/**
 * Cloudflare Pages Function - 네이버 검색 API 프록시 (블로그/카페)
 * 경로: /api/search
 * 
 * 환경변수 설정 (Cloudflare Dashboard > Settings > Environment variables):
 *   NAVER_SEARCH_CLIENT_ID = 발급받은 검색 API Client ID
 *   NAVER_SEARCH_CLIENT_SECRET = 발급받은 검색 API Client Secret
 */
export async function onRequestGet(context) {
  const CLIENT_ID = context.env?.NAVER_SEARCH_CLIENT_ID;
  const CLIENT_SECRET = context.env?.NAVER_SEARCH_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: '네이버 검색 API 키가 설정되지 않았습니다. (환경변수 누락)' }), {
      status: 500,
      headers: corsHeaders('application/json'),
    });
  }

  const url = new URL(context.request.url);
  const params = url.searchParams;
  
  const query = params.get('query');
  if (!query) {
    return new Response(JSON.stringify({ error: '검색어(query) 파라미터가 필요합니다.' }), {
      status: 400,
      headers: corsHeaders('application/json'),
    });
  }

  // 검색 타입: 'blog' (기본값) 또는 'cafearticle'
  const type = params.get('type') === 'cafearticle' ? 'cafearticle' : 'blog';
  const display = params.get('display') || '3'; // 기본 3개 노출
  const sort = params.get('sort') || 'sim'; // sim(유사도순), date(날짜순)

  const apiUrl = new URL(`https://openapi.naver.com/v1/search/${type}.json`);
  apiUrl.searchParams.set('query', query);
  apiUrl.searchParams.set('display', display);
  apiUrl.searchParams.set('sort', sort);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Upstream API returned ${response.status}` }), {
        status: 502,
        headers: corsHeaders('application/json'),
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: corsHeaders('application/json', 'public, max-age=300'),
    });
  } catch (error) {
    clearTimeout(timeoutId);
    
    let status = 500;
    let message = error.message;

    if (error.name === 'AbortError') {
      status = 504;
      message = 'Upstream API request timed out';
    }

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: corsHeaders('application/json'),
    });
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
