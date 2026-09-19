const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(`${root}${path.sep}`)) return response.writeHead(403).end();
  if (!path.extname(file)) file += '.html';
  if (!mime[path.extname(file)] || !fs.existsSync(file)) return response.writeHead(404).end();
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] });
  fs.createReadStream(file).pipe(response);
});

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      // Keep this local rendering check independent of ads, fonts and map providers.
      await page.route('**/*', (route) => route.request().url().startsWith(origin) ? route.continue() : route.fulfill({ status: 200, body: '' }));
      await page.goto(`${origin}/guide-hospital-search`);
      await page.locator('.visit-tools').waitFor({ state: 'visible' });
      const checkbox = page.locator('#visit-checklist input').first();
      await checkbox.check();
      assert.equal(await page.locator('#checklist-progress').textContent(), '확인 항목 1 / 5');
      await page.locator('#checklist-reset').click();
      assert.equal(await checkbox.isChecked(), false);
      assert.equal(await page.locator('#checklist-progress').textContent(), '확인 항목 0 / 5');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Guide overflows viewport');
      await page.evaluate(() => { window.print = () => { window.printRequested = true; }; });
      await page.locator('#checklist-print').click();
      assert(await page.evaluate(() => window.printRequested), 'Print action did not run');
      await page.evaluate(() => window.scrollTo(0, 0));
      const screenshot = path.join(os.tmpdir(), `hospital-content-guide-${width}.png`);
      await page.screenshot({ path: screenshot });
      console.log(`Guide ${width}px screenshot: ${screenshot}`);

      await page.goto(`${origin}/`);
      await page.locator('#ranking-list .hospital-card').first().waitFor();
      assert(!await page.locator('body').innerText().then((text) => /평점\s*[1-5]\.\d|후기\s*\d+건|후기 수와 관심도/.test(text)), 'Unsupported rating on homepage');
      assert.equal(await page.locator('#sort-filter option[value="reviews"]').count(), 0);
      await page.locator('#hero-search').fill('김흥진치과의원');
      await page.locator('#search-btn').click();
      const result = page.locator('#search-results-list .hospital-card').first();
      await result.waitFor();
      assert((await result.innerText()).includes('김흥진치과의원'), 'Exact hospital search lost its match');
      await result.click();
      await page.locator('#detail-name').filter({ hasText: '김흥진치과의원' }).waitFor();
      const schema = JSON.parse(await page.locator('#schema-hospital').textContent());
      assert.equal(schema.aggregateRating, undefined);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,follow');
      assert.equal(await page.locator('#detail-score, #detail-reviews').count(), 0);

      const liveHospital = { ykiho: 'JDtestremote', yadmNm: '통합검증의원', addr: '서울특별시 종로구 대학로 101', telno: '02-000-0000' };
      const detailRequests = [];
      await page.route(`${origin}/api/**`, async (route) => {
        const url = new URL(route.request().url());
        let payload;
        if (url.pathname === '/api/hospitals') {
          payload = { response: { body: { items: { item: liveHospital }, totalCount: 1 } } };
        } else if (url.pathname === '/api/hospital-hours') {
          payload = { found: true, dutyName: liveHospital.yadmNm, dutyAddr: liveHospital.addr, hours: { sat: '09:00 ~ 13:00' } };
        } else {
          detailRequests.push(url.searchParams.get('ykiho'));
          payload = { found: true, ykiho: liveHospital.ykiho, hours: { sat: '09:00 ~ 14:30', sun: '휴진' }, equips: [] };
        }
        await route.fulfill({ json: payload });
      });
      await page.goto(`${origin}/`);
      await page.locator('#hero-search').fill(liveHospital.yadmNm);
      await page.locator('#search-btn').click();
      const liveResult = page.locator('#search-results-list .hospital-card').filter({ hasText: liveHospital.yadmNm }).first();
      await liveResult.waitFor();
      assert((await liveResult.getAttribute('href')).includes('name='), 'Remote detail has no reloadable name lookup');
      await liveResult.click();
      await page.locator('#detail-name').filter({ hasText: liveHospital.yadmNm }).waitFor();
      await page.locator('#detail-hours-note').filter({ hasText: '출처가 서로 다릅니다' }).waitFor();
      assert((await page.locator('#detail-hours').innerText()).includes('전화 확인 필요'));
      assert.equal(await page.evaluate(() => window.currentHospitalDetail.saturdayOpen), false);
      assert(detailRequests.length >= 2 && detailRequests.every((id) => id === liveHospital.ykiho), 'Wrong detail institution requested');
      await page.reload();
      await page.locator('#detail-name').filter({ hasText: liveHospital.yadmNm }).waitFor();
      await page.locator('#detail-hours-note').filter({ hasText: '출처가 서로 다릅니다' }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Detail overflows viewport');
      await page.screenshot({ path: path.join(os.tmpdir(), `hospital-live-detail-${width}.png`), fullPage: true });
      assert.deepEqual(errors, [], 'Browser runtime errors');
      await page.close();
      console.log(`PASS: ${width}px guide, checklist, local/live search, detail reload and hours conflict`);
    }
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${origin}/guide-hospital-search`);
    assert((await page.locator('main').innerText()).includes('도착 예정 시각에 접수할 수 있는지'), 'Useful article content missing without JavaScript');
    assert(await page.locator('#call-questions').isVisible(), 'Guide requires JavaScript');
    assert(await page.locator('.visit-tools').isHidden(), 'Dead controls visible without JavaScript');
    await context.close();
    console.log('PASS: article readable without JavaScript');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
