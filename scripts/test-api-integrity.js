const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const publicHospital = { ykiho: 'JDexample', yadmNm: '테스트의원', addr: '서울특별시 종로구 대학로 101', sidoCd: 110000 };
const apiPayload = (item) => ({ response: { body: { items: { item }, totalCount: item ? 1 : 0 } } });

function apiContext(responses, requests = []) {
  const context = vm.createContext({
    window: { HOSPITALS: [{ id: 1, name: '로컬의원' }] }, URLSearchParams, AbortSignal,
    console: { warn() {} },
    fetch: async (url) => {
      requests.push(new URL(url, 'https://hospital-ranking.kr'));
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return { ok: true, json: async () => response };
    },
  });
  vm.runInContext(read('js/api.js'), context);
  return context.window.HospitalAPI;
}

test('single-object and array API responses both return live hospitals', async () => {
  for (const item of [publicHospital, [publicHospital]]) {
    const result = await apiContext([apiPayload(item)]).fetchHospitals({ live: true });
    assert.equal(result.hospitals.length, 1);
    assert.equal(result.hospitals[0].id, publicHospital.ykiho);
    assert.equal(result.hospitals[0].regionCode, '11');
    assert.match(result.hospitals[0].verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(result.fromMock, false);
  }
});

test('server fallback preserves local provenance instead of claiming live verification', async () => {
  const result = await apiContext([{ hospitals: [{ id: 2, name: '미확인의원' }], fallback: true, fallbackReason: 'upstream-timeout' }]).fetchHospitals();
  assert.equal(result.fromMock, true);
  assert.equal(result.fallbackReason, 'upstream-timeout');
  assert.equal(result.hospitals[0].verificationStatus, 'unverified');
  assert.equal(result.hospitals[0].verifiedAt, '');
});

test('empty live result stays empty, not an unrelated local hospital', async () => {
  const result = await apiContext([apiPayload(null)]).fetchHospitals({ live: true });
  assert.equal(result.hospitals.length, 0);
  assert.equal(result.totalCount, 0);
});

test('network failure allows a later successful retry', async () => {
  const api = apiContext([new Error('offline'), apiPayload(publicHospital)]);
  assert.equal((await api.fetchHospitals()).fromMock, true);
  assert.equal((await api.fetchHospitals()).fromMock, false);
});

test('regional requests use HIRA codes and registered-department filters, not a hospital-name guess', () => {
  const api = apiContext([]);
  const mappings = { 11: '110000', 26: '210000', 27: '230000', 28: '220000', 29: '240000', 30: '250000', 31: '260000', 36: '410000', 41: '310000', 42: '320000', 43: '330000', 44: '340000', 45: '350000', 46: '360000', 47: '370000', 48: '380000', 50: '390000' };
  for (const [regionCode, code] of Object.entries(mappings)) {
    const params = api.buildSearchParams({ regionCode, departmentId: 'internal' });
    assert.equal(params.sidoCd, code);
    assert.equal(params.dgsbjtCd, '01');
    assert.equal(params.yadmNm, undefined);
  }
});

test('department-filter response preserves API evidence without changing the primary department', async () => {
  const result = await apiContext([apiPayload({ ...publicHospital, clCdNm: '종합병원' })]).fetchHospitals({ dgsbjtCd: '01' });
  assert.equal(result.hospitals[0].registeredDepartmentIds[0], 'internal');
  assert.equal(result.hospitals[0].departmentId, 'general');
});

test('upstream error is not displayed as a successful empty search', async () => {
  const result = await apiContext([{ response: { header: { resultCode: '30' } } }]).fetchHospitals();
  assert.equal(result.fromMock, true);
});

test('Gwangju queries all five current district codes and excludes other Jeonnam records', async () => {
  const requests = [];
  const responses = ['360801', '360802', '360803', '360804', '360805'].map((code) => apiPayload([
    { ...publicHospital, ykiho: 'JD' + code, sidoCd: 360000, sgguCd: code, addr: '전남광주통합특별시 동구 제봉로 42' },
    { ...publicHospital, ykiho: 'JDother', sidoCd: 360000, sgguCd: '360022', addr: '전남광주통합특별시 화순군 화순읍 서양로 322' },
  ]));
  const api = apiContext(responses, requests);
  const result = await api.fetchHospitals(api.buildSearchParams({ regionCode: '29', departmentId: 'internal' }));
  assert.equal(result.hospitals.length, 5);
  assert(result.hospitals.every((item) => item.region === '광주' && item.regionCode === '29'));
  assert.equal(result.partial, false);
  assert.equal(new Set(requests.map((url) => url.searchParams.get('sgguCd'))).size, 5);
  assert(requests.every((url) => url.searchParams.get('sidoCd') === '360000' && !url.searchParams.has('regionScope')));
});

test('Gwangju partial failures keep verified district results and report limited coverage', async () => {
  const api = apiContext([apiPayload({ ...publicHospital, sidoCd: 360000, sgguCd: '360801' }),
    new Error('offline'), { fallback: true, hospitals: [] }, new Error('offline'), new Error('offline')]);
  const result = await api.fetchHospitals(api.buildSearchParams({ regionCode: '29' }));
  assert.equal(result.fromMock, false);
  assert.equal(result.partial, true);
  assert.equal(result.districtCoverage, 1);
  assert.equal(result.hospitals.length, 1);
});

const detailContext = vm.createContext({
  window: { location: { search: '' } }, URLSearchParams,
  document: { readyState: 'loading', addEventListener() {} },
});
// Expose pure helpers in the test sandbox without adding test hooks to the browser bundle.
vm.runInContext(read('js/detail.js').replace(/\}\)\(\);\s*$/, `
  globalThis.detailTest = { mergeLiveDetails, matchesHospitalIdentity, resolveHospital, isOpenHours };
})();`), detailContext);
const { mergeLiveDetails, matchesHospitalIdentity, isOpenHours } = detailContext.detailTest;
const hospital = { id: 1, hiraId: 'JDexample', name: '테스트의원', address: publicHospital.addr, hours: {}, sundayOpen: true };

test('same name at a different branch is rejected even with a high match score', () => {
  const otherBranch = { found: true, matchScore: 242, dutyName: hospital.name, dutyAddr: '서울특별시 종로구 대학로 1010', hours: { sun: '09:00 ~ 18:00' } };
  assert.equal(matchesHospitalIdentity(hospital, otherBranch), false);
  assert.equal(mergeLiveDetails(hospital, null, otherBranch, null).sources.length, 0);
  assert.equal(matchesHospitalIdentity(hospital, { ...otherBranch, dutyAddr: `${hospital.address}, 5층 (연건동)` }), true);
});

test('different institution code cannot overwrite hospital data', () => {
  const result = mergeLiveDetails(hospital, { found: true, ykiho: 'JDother', telno: 'wrong-phone' }, null, null);
  assert.equal(result.hospital.phone, undefined);
  assert.equal(result.sources.length, 0);
});

test('conflicting operating hours require confirmation and do not produce open badges', () => {
  const hira = { found: true, ykiho: hospital.hiraId, hours: { sat: '09:00 ~ 14:30', sun: '휴진' } };
  const nemc = { found: true, dutyName: hospital.name, dutyAddr: hospital.address, hours: { sat: '09:00 ~ 13:00' } };
  const result = mergeLiveDetails(hospital, hira, nemc, null).hospital;
  assert.match(result.hours.sat, /전화 확인/);
  assert.equal(result.hoursConflicts.length, 1);
  assert.equal(result.saturdayOpen, false);
  assert.equal(result.sundayOpen, false);
  assert.equal(isOpenHours('확인 필요'), false);
  assert.equal(isOpenHours('09:00 ~ 13:00'), true);
});

test('empty equipment data is not marked as new facility information', () => {
  const result = mergeLiveDetails(hospital, null, null, { found: true, ykiho: hospital.hiraId, equips: [], facility: { permSbdCnt: 30 } });
  assert.equal(result.sources.length, 0);
  assert.equal(result.hospital.roomCount, undefined);
});

test('supplemental local hospitals resolve without an API request', async () => {
  detailContext.window.NEW_HOSPITALS = [{ id: 1009, name: '추가의원' }];
  assert.equal((await detailContext.detailTest.resolveHospital('1009')).name, '추가의원');
});

test('remote detail searches by name and only accepts the exact institution code', async () => {
  detailContext.window.location.search = '?name=' + encodeURIComponent('테스트의원');
  let request;
  detailContext.window.HospitalAPI = { fetchHospitals: async (params) => {
    request = params;
    return { fromMock: false, hospitals: [{ id: 'JDother' }, { id: 'JDexample', name: '테스트의원' }] };
  } };
  assert.equal((await detailContext.detailTest.resolveHospital('JDexample')).name, '테스트의원');
  assert.equal(request.live, true);
  assert.equal(request.yadmNm, '테스트의원');
  assert.equal(request.ykiho, undefined);
  assert.equal(await detailContext.detailTest.resolveHospital('JDmissing'), null);
  detailContext.window.HospitalAPI.fetchHospitals = async () => ({ fromMock: true, hospitals: [{ id: 'JDexample' }] });
  assert.equal(await detailContext.detailTest.resolveHospital('JDexample'), null);
});

test('each stored HIRA code belongs to only one local record and survives export', () => {
  const provenance = JSON.parse(read('data/hospital-provenance.json'));
  const codes = Object.values(provenance).map((item) => item.hiraId);
  assert.equal(new Set(codes).size, codes.length);
  const exported = JSON.parse(read('data/hospitals.json')).hospitals;
  for (const [id, item] of Object.entries(provenance)) {
    assert.equal(exported.find((record) => String(record.id) === id).hiraId, item.hiraId);
  }
});
