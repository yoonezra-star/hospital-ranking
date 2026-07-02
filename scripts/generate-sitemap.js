const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE_URL = 'https://hospital-ranking.kr';
const TODAY = '2026-07-02';
const ROOT = path.resolve(__dirname, '..');

const EXCLUDED_HTML = new Set([
  '404.html',
  'detail.html',
  'test_map.html',
]);

const HIGH_PRIORITY = new Set([
  'index.html',
  'guide.html',
]);

const POLICY_PAGES = new Set([
  'about.html',
  'contact.html',
  'editorial-policy.html',
  'ad-policy.html',
  'terms.html',
  'privacy.html',
]);

function readHospitalIds() {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
  const context = {};
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.__HOSPITALS = HOSPITALS; this.__NEW_HOSPITALS = typeof NEW_HOSPITALS !== 'undefined' ? NEW_HOSPITALS : [];`, context);
  const hospitals = [...(context.__HOSPITALS || []), ...(context.__NEW_HOSPITALS || [])];
  return Array.from(new Set(hospitals.map((hospital) => String(hospital.id || '').trim()).filter(Boolean)));
}

function getHtmlPages() {
  return fs.readdirSync(ROOT)
    .filter((file) => file.endsWith('.html'))
    .filter((file) => !EXCLUDED_HTML.has(file))
    .sort((left, right) => {
      if (left === 'index.html') return -1;
      if (right === 'index.html') return 1;
      if (POLICY_PAGES.has(left) && !POLICY_PAGES.has(right)) return -1;
      if (!POLICY_PAGES.has(left) && POLICY_PAGES.has(right)) return 1;
      return left.localeCompare(right, 'en');
    });
}

function pagePriority(file) {
  if (file === 'index.html') return '1.0';
  if (HIGH_PRIORITY.has(file)) return '0.8';
  if (POLICY_PAGES.has(file)) return '0.6';
  if (file.startsWith('guide-')) return '0.7';
  return '0.7';
}

function changefreq(file) {
  if (file === 'index.html') return 'daily';
  if (file === 'guide.html') return 'weekly';
  if (POLICY_PAGES.has(file)) return file === 'terms.html' || file === 'privacy.html' ? 'yearly' : 'monthly';
  return 'monthly';
}

function pageUrl(file) {
  if (file === 'index.html') return `${SITE_URL}/`;
  return `${SITE_URL}/${file.replace(/\.html$/, '')}`;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function renderUrl({ loc, lastmod = TODAY, freq = 'monthly', priority = '0.7' }) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${freq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

function buildSitemap() {
  const urls = [];
  for (const file of getHtmlPages()) {
    urls.push({
      loc: pageUrl(file),
      freq: changefreq(file),
      priority: pagePriority(file),
    });
  }

  for (const id of readHospitalIds()) {
    urls.push({
      loc: `${SITE_URL}/detail?id=${encodeURIComponent(id)}`,
      freq: 'weekly',
      priority: '0.6',
    });
  }

  const uniqueUrls = Array.from(new Map(urls.map((item) => [item.loc, item])).values());
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    uniqueUrls.map(renderUrl).join('\n'),
    '</urlset>',
    '',
  ].join('\n');
}

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(), 'utf8');
