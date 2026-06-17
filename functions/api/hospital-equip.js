/**
 * Cloudflare Pages Function - 병원 의료장비 프록시
 * 경로: /api/hospital-equip
 * 
 * 원본 API: 건강보험심사평가원_의료장비 상세 현황
 * Base URL: api.odcloud.kr/api/15051055/v1
 */
export async function onRequestGet(context) {
  let API_KEY = context.env?.HIRA_EQUIP_API_KEY || '6016d506ccaac7277d8a3492ca0cce1845c6cee2acf054d92ac5cf0ef3049d0d';
  try { API_KEY = decodeURIComponent(API_KEY); } catch (e) {}

  const url = new URL(context.request.url);
  const ykiho = url.searchParams.get('ykiho');
  
  if (!ykiho) {
    return new Response(JSON.stringify({ error: 'Missing ykiho parameter' }), {
      status: 400, headers: corsHeaders('application/json')
    });
  }

  // odcloud API의 경우 정확한 UDDI 값이 필요할 수 있으나, 일단 와일드카드 또는 기본 데이터 노드를 찌름
  // (실제 데이터셋에 따라 엔드포인트 수정 필요)
  const BASE_URL = 'https://api.odcloud.kr/api/15051055/v1/uddi:b4d1b822-7935-4eb8-b219-971c261eef6c'; 
  const apiUrl = new URL(BASE_URL);
  apiUrl.searchParams.set('serviceKey', API_KEY);
  apiUrl.searchParams.set('page', '1');
  apiUrl.searchParams.set('perPage', '100');
  apiUrl.searchParams.set('returnType', 'json');
  apiUrl.searchParams.set('match:요양기관기호', ykiho); // 필터 파라미터 (명세에 따라 다름)

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(apiUrl.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // API를 찾을 수 없는 경우 무시하고 빈 배열 리턴 (프론트 에러 방지)
      return new Response(JSON.stringify({ found: false, equips: [] }), { headers: corsHeaders('application/json') });
    }

    const data = await response.json();
    const items = data?.data || [];
    
    // 장비명만 추출
    const equips = items.map(item => item['장비명'] || item.eqpNm).filter(Boolean);

    return new Response(JSON.stringify({ found: true, equips: equips }), { headers: corsHeaders('application/json', 'public, max-age=3600') });

  } catch (err) {
    clearTimeout(timeoutId);
    return new Response(JSON.stringify({ found: false, equips: [], error: err.message }), { headers: corsHeaders('application/json') });
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
