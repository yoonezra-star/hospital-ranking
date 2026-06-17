/**
 * Cloudflare Pages Function - 병원 API 프록시
 * 경로: /api/hospitals
 * 
 * CORS 문제를 해결하고 API 키를 서버 사이드에서 관리합니다.
 * 
 * 환경변수 설정 (Cloudflare Dashboard > Settings > Environment variables):
 *   DATA_API_KEY = 발급받은 인증키
 */
export async function onRequestGet(context) {
  let API_KEY = context.env?.DATA_API_KEY || '6016d506ccaac7277d8a3492ca0cce1845c6cee2acf054d92ac5cf0ef3049d0d';
  
  // 공공데이터 API 키 이중 인코딩 문제 방지를 위해 디코딩 적용
  try {
    API_KEY = decodeURIComponent(API_KEY);
  } catch (e) {
    // 디코딩 에러 발생 시 원본 그대로 사용
  }

  const BASE_URL = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

  const url = new URL(context.request.url);
  const params = url.searchParams;

  const apiUrl = new URL(BASE_URL);
  apiUrl.searchParams.set('serviceKey', API_KEY);
  apiUrl.searchParams.set('_type', 'json');
  apiUrl.searchParams.set('numOfRows', params.get('numOfRows') || '20');
  apiUrl.searchParams.set('pageNo', params.get('pageNo') || '1');

  // 선택적 필터 파라미터 전달
  const optionalParams = ['ykiho', 'sidoCd', 'sgguCd', 'emdongNm', 'yadmNm', 'clCd', 'dgsbjtCd', 'xPos', 'yPos', 'radius'];
  optionalParams.forEach(key => {
    const val = params.get(key);
    if (val) apiUrl.searchParams.set(key, val);
  });

  // 타임아웃 설정 (8.5초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  try {
    const response = await fetch(apiUrl.toString(), {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Upstream API returned ${response.status}` }), {
        status: 502,
        headers: corsHeaders('application/json'),
      });
    }

    const text = await response.text();

    // data.go.kr에서 JSON 요청 시에도 XML을 반환하는 경우 대비
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON from upstream', raw: text.slice(0, 500) }), {
        status: 502,
        headers: corsHeaders('application/json'),
      });
    }

    return new Response(JSON.stringify(data), {
      headers: corsHeaders('application/json', 'public, max-age=300'),
    });
  } catch (error) {
    clearTimeout(timeoutId);
    
    let status = 500;
    let message = error.message;

    if (error.name === 'AbortError') {
      status = 504;
      message = 'Upstream API request timed out (3.5s limit)';
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
