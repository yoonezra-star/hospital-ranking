// Read-only upstream audit. Generates evidence, never modifies hospital records.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const hospitals = JSON.parse(fs.readFileSync(path.join(root, 'data/hospitals.json'), 'utf8')).hospitals;
const normalize = (value) => String(value || '').replace(/[\s,()]/g, '').toLowerCase();
const addressKey = (value) => {
  const tokens = String(value || '').split('(')[0].replace(/,/g, ' ').trim().split(/\s+/);
  const road = tokens.findIndex((token) => /(?:대로|로|길)$/.test(token));
  if (road < 2 || !/^\d+(?:-\d+)?$/.test(tokens[road + 1] || '')) return '';
  return normalize(tokens.slice(0, road + 2).join(' '));
};
(async () => {
  const records = [];
  for (const hospital of hospitals.filter((item) => item.verificationStatus === 'unverified')) {
    const url = new URL('https://hospital-ranking.kr/api/hospitals');
    url.search = new URLSearchParams({ live: 'true', numOfRows: '50', yadmNm: hospital.name });
    const record = { id: hospital.id, name: hospital.name, address: hospital.address, query: url.href };
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.fallback || payload.fromMock) {
        record.status = 'upstream-unavailable-or-empty';
        record.reason = payload.fallbackReason || 'fallback';
        record.candidates = [];
      } else {
        const raw = payload.response?.body?.items?.item;
        const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
        record.candidates = items.map((item) => ({ name: item.yadmNm, address: item.addr, hiraId: item.ykiho,
          phone: item.telno || '', openDate: String(item.estbDd || ''), lat: item.YPos, lng: item.XPos,
          exactIdentity: normalize(item.yadmNm) === normalize(hospital.name)
            && Boolean(addressKey(hospital.address)) && addressKey(hospital.address) === addressKey(item.addr) }));
        record.status = record.candidates.filter((item) => item.exactIdentity).length === 1 ? 'exact-name-and-road-address' : 'manual-review-required';
      }
    } catch (error) { record.status = 'request-failed'; record.reason = error.message; }
    records.push(record);
    console.log(`${record.id} ${record.name}: ${record.status} (${record.candidates?.length || 0} candidates)`);
  }
  const report = { checkedAt: new Date().toISOString(), source: 'HIRA hospital basic-information API via site proxy',
    note: 'Empty responses do not prove closure or nonexistence. Candidates are not verified records.', records };
  const output = path.join(root, 'functions/_documentation/hospital-identity-audit.json');
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`Evidence report: ${output}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
