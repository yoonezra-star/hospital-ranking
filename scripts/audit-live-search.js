// Read-only smoke check against the deployed proxy; run explicitly to use API quota.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const ctx = { console, URLSearchParams, AbortSignal,
  fetch: (url, options) => fetch(new URL(url, 'https://hospital-ranking.kr'), options),
};
ctx.window = ctx;
vm.createContext(ctx);
for (const file of ['js/data.js', 'js/data-provenance.js', 'js/api.js', 'js/search.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
}
(async () => {
  const unavailable = [];
  for (const [regionCode, region] of Object.entries({ 11: '서울', 26: '부산', 27: '대구', 28: '인천', 29: '광주', 30: '대전', 41: '경기' })) {
    const params = ctx.HospitalAPI.buildSearchParams({ regionCode, departmentId: 'internal' });
    const response = await ctx.HospitalAPI.fetchHospitals(params);
    if (response.fromMock !== false) {
      unavailable.push(`${region}: ${response.fallbackReason || 'public API unavailable'}`);
      continue;
    }
    const results = ctx.SearchEngine.query(response.hospitals, { searchText: `${region} 내과` });
    assert(results.length > 0, `${region}: no exact live results`);
    assert(results.every((item) => item.region === region && item.registeredDepartmentIds.includes('internal')), `${region}: wrong region or department`);
    console.log(`${region} 내과: ${results.length} exact records / ${response.hospitals.length} retrieved; upstream total ${response.totalCount}`);
  }
  assert.equal(unavailable.length, 0, `Live data gaps: ${unavailable.join('; ')}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
