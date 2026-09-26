import { listHospitalSitemapEntries } from './_lib/hospital-store.js';

const SITE_ORIGIN = 'https://hospital-ranking.kr';

export async function onRequestGet(context) {
  const entries = await listHospitalSitemapEntries(context, 10000);
  const urls = entries.map((entry) => [
    '  <url>',
    `    <loc>${SITE_ORIGIN}/hospital/${encodeURIComponent(entry.id)}</loc>`,
    entry.lastModified ? `    <lastmod>${escapeXml(entry.lastModified)}</lastmod>` : '',
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.6</priority>',
    '  </url>',
  ].filter(Boolean).join('\n')).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}
