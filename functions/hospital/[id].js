import { getHospitalSnapshot, getRelatedHospitalSnapshots } from '../_lib/hospital-store.js';
import { normalizeServerHospital, renderHospitalPage } from '../_lib/render-hospital-page.js';

export async function onRequestGet(context) {
  const requestedId = clean(context.params?.id);
  if (!requestedId) return notFound(context);

  let hospital = await getHospitalSnapshot(context, requestedId);
  let indexable = Boolean(hospital);

  if (!hospital) {
    const local = await findLocalHospital(context, requestedId);
    if (local?.hiraId && local.hiraId !== requestedId) {
      const snapshot = await getHospitalSnapshot(context, local.hiraId);
      if (snapshot) {
        return Response.redirect(`https://hospital-ranking.kr/hospital/${encodeURIComponent(local.hiraId)}`, 301);
      }
    }
    hospital = local;
    indexable = local?.verificationStatus === 'api-retrieved' && Boolean(local?.sourceUrl && local?.verifiedAt);
  }

  if (!hospital) return notFound(context);

  const relatedHospitals = indexable ? await getRelatedHospitalSnapshots(context, hospital, 6) : [];
  const templateResponse = await context.env.ASSETS.fetch(new URL('/detail.html', context.request.url));
  if (!templateResponse.ok) return new Response('상세 페이지 템플릿을 불러오지 못했습니다.', { status: 500 });

  const normalized = normalizeServerHospital(hospital);
  const html = renderHospitalPage(await templateResponse.text(), normalized, { indexable, relatedHospitals });
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=900, stale-while-revalidate=86400',
      'X-Robots-Tag': indexable ? 'index, follow' : 'noindex, follow',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function findLocalHospital(context, id) {
  try {
    const response = await context.env.ASSETS.fetch(new URL('/data/hospitals.json', context.request.url));
    if (!response.ok) return null;
    const payload = await response.json();
    return (Array.isArray(payload?.hospitals) ? payload.hospitals : []).find((item) => (
      String(item.id) === id || String(item.hiraId || '') === id
    )) || null;
  } catch {
    return null;
  }
}

async function notFound(context) {
  const response = await context.env.ASSETS.fetch(new URL('/404.html', context.request.url));
  return new Response(await response.text(), {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function clean(value) {
  return String(value ?? '').trim();
}
