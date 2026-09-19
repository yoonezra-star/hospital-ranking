const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data');
const OUT_FILE = path.join(OUT_DIR, 'hospitals.json');
const PROVENANCE_FILE = path.join(OUT_DIR, 'hospital-provenance.json');
const PROVENANCE_SCRIPT = path.join(ROOT, 'js', 'data-provenance.js');

const source = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
const context = { window: {}, globalThis: {} };
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'js/data.js' });

const provenance = JSON.parse(fs.readFileSync(PROVENANCE_FILE, 'utf8'));
const institutionCodes = Object.values(provenance).map((item) => item.hiraId).filter(Boolean);
if (new Set(institutionCodes).size !== institutionCodes.length) {
  throw new Error('Duplicate HIRA institution codes: verify hospital identity before generating data');
}
const hospitals = [
  ...(context.HOSPITALS || []),
  ...(context.NEW_HOSPITALS || []),
].map((item) => {
  const itemProvenance = provenance[String(item.id)] || {};
  return normalizeHospital({
    ...item,
    ...itemProvenance,
    ...(itemProvenance.hiraId ? {
      sourceType: 'hira-api',
      sourceName: '건강보험심사평가원 병원기본정보 API',
      sourceUrl: 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000',
      verificationStatus: 'api-retrieved',
      verifiedAt: itemProvenance.verifiedAt || '2026-09-19',
    } : {}),
  });
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify({
  generatedAt: '2026-09-19',
  sourceType: 'local-curated',
  sourceName: '병원찾기 내부 정리 데이터',
  sourceUrl: '',
  verificationStatus: 'unverified',
  verifiedAt: '',
  provenanceCount: Object.keys(provenance).length,
  totalCount: hospitals.length,
  hospitals,
}, null, 2)}\n`, 'utf8');

const runtimeProvenance = Object.fromEntries(Object.entries(provenance).map(([id, item]) => [id, {
  ...item,
  sourceType: 'hira-api',
  sourceName: '건강보험심사평가원 병원기본정보 API',
  sourceUrl: 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000',
  verificationStatus: 'api-retrieved',
  verifiedAt: item.verifiedAt || '2026-09-19',
}]));
fs.writeFileSync(PROVENANCE_SCRIPT, `window.HOSPITAL_PROVENANCE = ${JSON.stringify(runtimeProvenance, null, 2)};\n`, 'utf8');

console.log(`Wrote ${hospitals.length} hospitals to ${path.relative(ROOT, OUT_FILE)}`);

function normalizeHospital(item) {
  return {
    id: item.id,
    hiraId: item.hiraId || '',
    name: item.name || '',
    type: item.type || '',
    department: item.department || '',
    departmentId: item.departmentId || '',
    address: item.address || '',
    region: item.region || '',
    regionCode: String(item.regionCode || ''),
    district: item.district || '',
    town: item.town || '',
    phone: item.phone || '',
    score: 0,
    reviewCount: 0,
    specialistCount: Number(item.specialistCount) || 0,
    openDate: item.openDate || '',
    saturdayOpen: Boolean(item.saturdayOpen),
    sundayOpen: Boolean(item.sundayOpen),
    nightOpen: Boolean(item.nightOpen),
    hasEmergency: Boolean(item.hasEmergency),
    parkingCapacity: Number(item.parkingCapacity) || 0,
    parkingFee: item.parkingFee || '',
    equipment: item.equipment || '',
    area: item.area || '',
    roomCount: Number(item.roomCount) || 0,
    bedCount: Number(item.bedCount) || 0,
    subway: item.subway || '',
    lat: Number(item.lat) || 0,
    lng: Number(item.lng) || 0,
    url: item.url || '',
    hours: item.hours || {},
    sourceType: item.sourceType || 'local-curated',
    sourceName: item.sourceName || '병원찾기 내부 정리 데이터',
    sourceUrl: item.sourceUrl || '',
    verificationStatus: item.verificationStatus || 'unverified',
    verifiedAt: item.verifiedAt || '',
  };
}
