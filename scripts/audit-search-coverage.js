const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const file of ['js/data.js', 'js/data-provenance.js', 'js/api.js', 'js/search.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
}
const hospitals = ctx.HospitalAPI.getHospitals();
const regions = ['서울', '경기', '부산', '인천', '대전', '대구', '광주'];
const departments = ['내과', '치과', '피부과', '정형외과', '소아과', '안과', '이비인후과'];
const queries = [
  ...regions.flatMap((region) => departments.map((department) => `${region} ${department}`)),
  '야간 피부과', '토요일 정형외과', '일요일 소아과', '주차 가능한 치과',
];
const missing = [];
for (const searchText of queries) {
  const intent = ctx.SearchEngine.parseSearchIntent(searchText);
  const items = ctx.SearchEngine.query(hospitals, { searchText, intent });
  if (!items.length) missing.push(searchText);
  for (const item of items) {
    if (intent.region) assert.equal(item.region, intent.region, `Wrong region: ${searchText}`);
    if (intent.department) assert(item.departmentId === intent.department || item.registeredDepartmentIds?.includes(intent.department), `Wrong department: ${searchText}`);
  }
}
// Coverage gaps are data limitations, not passing results from unrelated regions.
console.log(JSON.stringify({
  mode: 'strict-local-only',
  queries: queries.length,
  exactQueriesWithResults: queries.length - missing.length,
  queriesNeedingLiveData: missing,
  note: 'No relaxed results counted. Live API coverage is tested separately.',
}, null, 2));
