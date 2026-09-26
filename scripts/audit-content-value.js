const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const decoder = new TextDecoder('utf-8', { fatal: true });
const read = (file) => decoder.decode(fs.readFileSync(path.join(root, file)));
const sitemapIndex = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapFile = fs.existsSync(path.join(root, 'sitemap-pages.xml')) ? 'sitemap-pages.xml' : 'sitemap.xml';
const sitemap = [...read(sitemapFile).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const errors = [];
const pages = [];
const spotlightHospitalIds = [];
const ignored = new Set(['test_map.html']);
const operationGuideFiles = ['new-openings.html', 'night-clinic.html', 'saturday-clinic.html', 'sunday-clinic.html'];
const strip = (html) => html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const verifiedLandingData = JSON.parse(read('data/verified-landing-hospitals.json'));
const verifiedLandingHospitals = verifiedLandingData.hospitals || [];
if (verifiedLandingData.sourceType !== 'hira-api-snapshot') errors.push('Landing hospital dataset must come from a HIRA API snapshot');
if (verifiedLandingData.totalCount !== verifiedLandingHospitals.length) errors.push('Landing hospital dataset totalCount is inconsistent');
if (new Set(verifiedLandingHospitals.map((hospital) => hospital.hiraId)).size !== verifiedLandingHospitals.length) {
  errors.push('Landing hospital dataset contains duplicate HIRA identifiers');
}
for (const hospital of verifiedLandingHospitals) {
  if (!hospital.hiraId || !hospital.name || !hospital.address || hospital.verificationStatus !== 'api-retrieved'
    || !hospital.sourceUrl || !hospital.verifiedAt || !hospital.registeredDepartmentIds?.length) {
    errors.push(`Landing hospital ${hospital.hiraId || hospital.name || 'unknown'}: incomplete official provenance`);
  }
}

for (const file of fs.readdirSync(root).filter((name) => name.endsWith('.html') && !ignored.has(name)).sort()) {
  const html = read(file);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  const noindex = /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b)[^>]*>/i.test(html);
  const url = `https://hospital-ranking.kr/${file === 'index.html' ? '' : file.replace(/\.html$/, '')}`;
  const externalLinks = [...main.matchAll(/href=["'](https?:\/\/[^"']+)["']/g)].map((match) => match[1]).filter((href) => !href.startsWith('https://hospital-ranking.kr'));
  const characters = strip(main).length;
  const hasDeepDive = /<section\b[^>]*class=["'][^"']*\bguide-deep-dive\b/.test(html);
  pages.push({ file, characters, externalReferences: externalLinks.length, noindex, inSitemap: sitemap.includes(url), hasDeepDive });
  if (/^guide-(?!hospital-search).*\.html$/.test(file) && (!hasDeepDive || characters < 1650)) {
    errors.push(`${file}: guide-specific practical content is too thin`);
  }
  if (noindex && sitemap.includes(url)) errors.push(`${file}: noindex URL in sitemap`);
  if (!html.includes('<meta charset="UTF-8">')) errors.push(`${file}: missing UTF-8 declaration`);
  if (/(?:href|src)=["']\s*["']/.test(html)) errors.push(`${file}: empty href or src attribute`);
  if (/"aggregateRating"|평점\s*[1-5]\.\d|리뷰\s*\d+개/.test(html)) errors.push(`${file}: unsupported ratings`);
  if (/병원 예시|운영조건에 맞는 병원 예시/.test(html)) errors.push(`${file}: unverified example wording remains`);
  for (const anchor of html.matchAll(/<a\b[^>]*\bclass=["'][^"']*\bhospital-spotlight-card\b[^"']*["'][^>]*>/gi)) {
    const href = anchor[0].match(/\bhref=["']([^"']+)["']/i)?.[1] || '';
    const id = decodeURIComponent(href.match(/^\/hospital\/([^/?#]+)/)?.[1] || '');
    if (!id || /^\d+$/.test(id)) errors.push(`${file}: spotlight card must use an official HIRA identifier`);
    else spotlightHospitalIds.push({ file, id });
  }
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const href = match[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue;
    if (/\.html(?:[?#]|$)/i.test(href)) errors.push(`${file}: legacy .html internal link ${href}`);
    const pathname = decodeURIComponent(href.split(/[?#]/)[0]).replace(/^\//, '') || 'index.html';
    if (pathname.startsWith('hospital/')) continue;
    if (!fs.existsSync(path.join(root, pathname)) && !fs.existsSync(path.join(root, `${pathname}.html`))) {
      errors.push(`${file}: missing local target ${pathname}`);
    }
  }
}

const homepage = read('index.html');
if (/승인용|광고 승인/.test(strip(homepage))) errors.push('index.html: review-oriented copy is visible to visitors');
if (/병원 상세 예시|대표 병원 보기/.test(strip(homepage))) errors.push('index.html: sample detail promotion remains');

for (const file of operationGuideFiles) {
  const html = read(file);
  const characters = strip(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '');
  if (!html.includes('operation-verification') || !html.includes('intent-call-script')) {
    errors.push(`${file}: practical operating-hours verification workflow is missing`);
  }
  if (!/전화할 때 그대로 읽어보세요/.test(html)) errors.push(`${file}: call script is missing`);
  if (/hospital-spotlight-card/.test(html)) errors.push(`${file}: operating-hours guide must not imply verified live opening status`);
  if (characters.length < 2000) errors.push(`${file}: operating-hours guide is too thin`);
}

const dataPolicy = read('data-policy.html');
const dataPolicyText = strip(dataPolicy.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '');
if (dataPolicyText.length < 2200) errors.push('data-policy.html: data provenance explanation is too thin');
if (!dataPolicy.includes('data-source-table') || !dataPolicy.includes('data/15001698/openapi.do') || !dataPolicy.includes('data/15000736/openapi.do')) {
  errors.push('data-policy.html: official source matrix is incomplete');
}
if (!/699개 기관/.test(dataPolicyText) || !/39건은 미확인/.test(dataPolicyText)) {
  errors.push('data-policy.html: current verified and unverified dataset states are missing');
}

const context = { window: {} };
vm.createContext(context);
vm.runInContext(read('js/data.js'), context);
const hospitals = [...context.window.HOSPITALS, ...context.window.NEW_HOSPITALS];
const exportedData = JSON.parse(read('data/hospitals.json'));
const exported = exportedData.hospitals;
const officialHospitalIds = new Set([
  ...verifiedLandingHospitals.map((hospital) => String(hospital.hiraId)),
  ...exported.filter((hospital) => ['api-retrieved', 'verified'].includes(hospital.verificationStatus))
    .map((hospital) => String(hospital.hiraId || '')),
]);
for (const item of spotlightHospitalIds) {
  if (!officialHospitalIds.has(item.id)) errors.push(`${item.file}: spotlight hospital ${item.id} is not in a verified dataset`);
}
if (exportedData.sourceType !== 'local-curated') errors.push('Hospital dataset sourceType must remain local-curated');
for (const hospital of [...hospitals, ...exported]) {
  if (hospital.score || hospital.reviewCount) errors.push(`Hospital ${hospital.id}: unsupported rating remains`);
  if (hospital.verificationStatus === 'verified' && (!hospital.sourceUrl || !hospital.verifiedAt)) {
    errors.push(`Hospital ${hospital.id}: verified record is missing sourceUrl or verifiedAt`);
  }
}
if (sitemap.some((url) => /\/detail(?:\?|$)/.test(url))) errors.push('Unverified detail URL in sitemap');
if (/estimateScore|estimateReviewCount|aggregateRating/.test(read('js/detail.js'))) errors.push('Synthetic detail rating code remains');

// Length and source counts flag pages for human review, not AdSense thresholds.
const guideReview = pages.filter((page) => page.file.startsWith('guide-') && page.externalReferences === 0);
const report = {
  htmlPages: pages.length,
  sitemapIndexEntries: sitemapIndex.length,
  sitemapUrls: sitemap.length,
  localHospitals: hospitals.length,
  verifiedLandingHospitals: verifiedLandingHospitals.length,
  verifiedLandingCards: spotlightHospitalIds.length,
  hospitalsWithApiProvenance: exported.filter((hospital) => hospital.verificationStatus === 'api-retrieved' && hospital.sourceUrl && hospital.verifiedAt).length,
  hospitalsMissingProvenance: exported.filter((hospital) => !hospital.sourceUrl || !hospital.verifiedAt).length,
  hospitalsExplicitlyMarkedUnverified: exported.filter((hospital) => !hospital.verificationStatus || hospital.verificationStatus === 'unverified').length,
  guidesWithDeepDive: pages.filter((page) => page.hasDeepDive).length,
  guidesWithoutExternalReferences: guideReview.map((page) => page.file),
  shortestContentPages: pages.filter((page) => !page.noindex && !['privacy.html', 'terms.html', 'contact.html', 'about.html', 'ad-policy.html', 'editorial-policy.html'].includes(page.file)).sort((a, b) => a.characters - b.characters).slice(0, 10),
  errors: [...new Set(errors)],
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
