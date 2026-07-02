const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ctx = { console, window: {}, globalThis: {} };
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);

for (const file of ['js/data.js', 'js/search.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), ctx, { filename: file });
}

const hospitals = [...(ctx.HOSPITALS || []), ...(ctx.NEW_HOSPITALS || [])];
const regions = ['서울', '경기', '부산', '인천', '대전', '대구', '광주'];
const departments = ['내과', '치과', '피부과', '정형외과', '소아과', '안과', '이비인후과'];
const operationQueries = ['야간 피부과', '토요일 정형외과', '일요일 소아과', '주차 가능한 치과'];

const queries = [
  ...regions.flatMap((region) => departments.map((department) => `${region} ${department}`)),
  ...operationQueries,
];

const failures = [];
const relaxed = [];

for (const query of queries) {
  const result = queryWithRelaxation(query);
  if (result.items.length === 0) {
    failures.push(query);
  } else if (result.mode !== 'exact') {
    relaxed.push(`${query} -> ${result.mode} (${result.items.length})`);
  }
}

console.log(`Search coverage OK: ${queries.length - failures.length}/${queries.length} queries return results`);
if (relaxed.length > 0) {
  console.log(`Relaxed recommendations: ${relaxed.length}`);
  console.log(relaxed.join('\n'));
}

if (failures.length > 0) {
  console.error(`Search coverage failures:\n${failures.join('\n')}`);
  process.exit(1);
}

function queryWithRelaxation(searchText) {
  const intent = ctx.SearchEngine.parseSearchIntent(searchText);
  const exact = ctx.SearchEngine.query(hospitals, {
    searchText,
    filters: {},
    sortBy: 'score',
    intent,
  });

  if (exact.length > 0) {
    return { mode: 'exact', items: exact };
  }

  const withoutOperations = {
    ...intent,
    saturdayOpen: false,
    sundayOpen: false,
    nightOpen: false,
    parkingAvailable: false,
    specialistOnly: false,
    recentOpen: false,
    hasEmergency: false,
  };
  const attempts = [
    ['without operations', withoutOperations, {}],
    ['without locality', { ...withoutOperations, locality: '' }, { town: '', locality: '' }],
    ['region and department', { ...withoutOperations, district: '', locality: '' }, { district: '', town: '', locality: '' }],
    ['department only', { ...withoutOperations, region: '', district: '', locality: '' }, { region: '', district: '', town: '', locality: '' }],
  ];

  for (const [mode, relaxedIntent, filters] of attempts) {
    const result = ctx.SearchEngine.query(hospitals, {
      searchText,
      filters,
      sortBy: 'score',
      intent: relaxedIntent,
    });
    if (result.length > 0) {
      return { mode, items: result };
    }
  }

  return { mode: 'none', items: [] };
}
