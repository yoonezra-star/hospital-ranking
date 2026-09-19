const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data');
const OUT_FILE = path.join(OUT_DIR, 'hospitals.json');

const source = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
const context = { window: {}, globalThis: {} };
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'js/data.js' });

const hospitals = [
  ...(context.HOSPITALS || []),
  ...(context.NEW_HOSPITALS || []),
].map(normalizeHospital);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify({
  generatedAt: '2026-07-03',
  totalCount: hospitals.length,
  hospitals,
}, null, 2)}\n`, 'utf8');

console.log(`Wrote ${hospitals.length} hospitals to ${path.relative(ROOT, OUT_FILE)}`);

function normalizeHospital(item) {
  return {
    id: item.id,
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
  };
}
