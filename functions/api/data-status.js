import { getHospitalStoreStatus } from '../_lib/hospital-store.js';

export async function onRequestGet(context) {
  const database = await getHospitalStoreStatus(context);
  const local = await getLocalStatus(context);

  return new Response(JSON.stringify({
    checkedAt: new Date().toISOString(),
    database,
    local,
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

async function getLocalStatus(context) {
  if (!context.env?.ASSETS?.fetch) return { available: false, hospitalCount: 0 };

  try {
    const response = await context.env.ASSETS.fetch(new URL('/data/hospitals.json', context.request.url));
    if (!response.ok) return { available: false, hospitalCount: 0 };
    const data = await response.json();
    return {
      available: true,
      hospitalCount: Number(data.totalCount || data.hospitals?.length || 0),
      officialProvenanceCount: Number(data.provenanceCount || 0),
      generatedAt: data.generatedAt || null,
    };
  } catch {
    return { available: false, hospitalCount: 0 };
  }
}

