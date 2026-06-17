/**
 * Cloudflare Pages Function - 병원 상세정보 프록시
 * 경로: /api/hospital-details
 * 
 * 원본 API: 건강보험심사평가원_의료기관별상세정보서비스 (MadmDtlInfoService2.8)
 * /getDtlInfo2.8
 */
export async function onRequestGet(context) {
  let API_KEY = context.env?.HIRA_DTL_API_KEY || '6016d506ccaac7277d8a3492ca0cce1845c6cee2acf054d92ac5cf0ef3049d0d';
  try { API_KEY = decodeURIComponent(API_KEY); } catch (e) {}

  const url = new URL(context.request.url);
  const params = url.searchParams;
  const ykiho = params.get('ykiho');
  
  if (!ykiho) {
    return new Response(JSON.stringify({ error: 'Missing ykiho parameter' }), {
      status: 400, headers: corsHeaders('application/json')
    });
  }

  const BASE_URL = 'https://apis.data.go.kr/B551182/MadmDtlInfoService2.8/getDtlInfo2.8';
  const apiUrl = new URL(BASE_URL);
  apiUrl.searchParams.set('serviceKey', API_KEY);
  apiUrl.searchParams.set('_type', 'json');
  apiUrl.searchParams.set('ykiho', ykiho);

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

    const items = data?.response?.body?.items?.item;
    if (!items) {
      return new Response(JSON.stringify({ found: false }), { headers: corsHeaders('application/json') });
    }

    const item = Array.isArray(items) ? items[0] : items;

    // 진료시간 포맷 헬퍼 (0830 → 08:30)
    const fmtTime = (v) => {
      if (!v) return null;
      const s = String(v).padStart(4, '0');
      return s.slice(0, 2) + ':' + s.slice(2, 4);
    };
    const fmtRange = (start, end) => {
      const s = fmtTime(start);
      const e = fmtTime(end);
      return (s && e) ? `${s} ~ ${e}` : null;
    };

    const result = {
      found: true,
      // 주차 정보
      parkXpnsYn: item.parkXpnsYn, // 주차비 유무 (Y/N)
      parkEtc: item.parkEtc,
      parkQty: item.parkQty,
      // 진료시간
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
      // 응급실
      emyDayYn: item.emyDayYn,
      emyNgtYn: item.emyNgtYn,
      emyDayTelNo1: item.emyDayTelNo1,
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
