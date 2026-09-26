const SITE_ORIGIN = 'https://hospital-ranking.kr';

const DEPARTMENT_NAMES = {
  '00': '일반의', '01': '내과', '02': '신경과', '03': '정신건강의학과', '04': '외과',
  '05': '정형외과', '06': '신경외과', '07': '흉부외과', '08': '성형외과', '09': '마취통증의학과',
  '10': '산부인과', '11': '소아청소년과', '12': '안과', '13': '이비인후과', '14': '피부과',
  '15': '비뇨의학과', '16': '영상의학과', '17': '방사선종양학과', '18': '병리과', '19': '진단검사의학과',
  '20': '결핵과', '21': '재활의학과', '22': '핵의학과', '23': '가정의학과', '24': '응급의학과',
  '25': '직업환경의학과', '26': '예방의학과', '49': '치과', '80': '한방내과',
};

export function normalizeServerHospital(item) {
  const departmentCodes = Array.isArray(item?.registeredDepartmentCodes)
    ? item.registeredDepartmentCodes.filter(Boolean)
    : [item?.dgsbjtCd].filter(Boolean);
  const departments = departmentCodes.map((code) => DEPARTMENT_NAMES[String(code)]).filter(Boolean);
  const address = clean(item?.addr || item?.address);
  const province = clean(item?.sidoCdNm) || address.split(/\s+/)[0] || '';
  const district = clean(item?.sgguCdNm) || address.split(/\s+/)[1] || '';
  const id = clean(item?.ykiho || item?.hiraId || item?.id);

  return {
    id,
    hiraId: id,
    name: clean(item?.yadmNm || item?.name) || '병원 정보',
    type: clean(item?.clCdNm || item?.type) || '의료기관',
    department: departments.join(', ') || clean(item?.department) || clean(item?.clCdNm) || '진료과 정보 확인 필요',
    registeredDepartmentCodes: departmentCodes,
    address,
    region: province,
    regionCode: clean(item?.sidoCd || item?.regionCode),
    district,
    districtCode: clean(item?.sgguCd || item?.districtCode),
    town: clean(item?.emdongNm || item?.town),
    phone: clean(item?.telno || item?.phone),
    url: clean(item?.hospUrl || item?.url),
    lat: finiteNumber(item?.YPos ?? item?.lat),
    lng: finiteNumber(item?.XPos ?? item?.lng),
    openDate: formatDate(item?.estbDd || item?.openDate),
    sourceName: clean(item?.sourceName) || '건강보험심사평가원 병원기본정보 API',
    sourceUrl: clean(item?.sourceUrl),
    verificationStatus: clean(item?.verificationStatus) || 'unverified',
    verifiedAt: formatDate(item?.verifiedAt),
  };
}

export function renderHospitalPage(template, rawHospital, options = {}) {
  const hospital = normalizeServerHospital(rawHospital);
  const indexable = options.indexable === true && hospital.verificationStatus !== 'unverified';
  const canonical = `${SITE_ORIGIN}/hospital/${encodeURIComponent(hospital.id)}`;
  const place = [hospital.region, hospital.district, hospital.town].filter(Boolean).join(' ');
  const description = `${hospital.name}의 ${hospital.type}, 주소, 전화번호, 진료과와 방문 전 확인사항을 안내합니다. 운영시간은 병원에 직접 확인해 주세요.`;
  const department = hospital.department;
  const verifiedDate = hospital.verifiedAt || '최근 확인일 정보 없음';
  const sourceSummary = `${hospital.sourceName}${hospital.verifiedAt ? ` (${hospital.verifiedAt} 확인)` : ''}`;
  const mapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name || hospital.address)}`;
  const relatedHospitals = Array.isArray(options.relatedHospitals)
    ? options.relatedHospitals.map(normalizeServerHospital).filter((item) => item.id && item.id !== hospital.id)
    : [];

  let html = String(template || '');
  if (!/<base\b/i.test(html)) {
    html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  <base href="/">');
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(hospital.name)} 정보 - 병원찾기</title>`);
  html = replaceMeta(html, 'description', description);
  html = replaceMeta(html, 'robots', indexable ? 'index,follow,max-image-preview:large' : 'noindex,follow');
  html = injectHead(html, [
    `<link rel="canonical" href="${escapeAttribute(canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeAttribute(`${hospital.name} 정보 - 병원찾기`)}">`,
    `<meta property="og:description" content="${escapeAttribute(description)}">`,
    `<meta property="og:url" content="${escapeAttribute(canonical)}">`,
  ].join('\n  '));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: hospital.name,
    description,
    url: canonical,
    address: hospital.address ? { '@type': 'PostalAddress', streetAddress: hospital.address, addressCountry: 'KR' } : undefined,
    telephone: hospital.phone || undefined,
    sameAs: hospital.url || undefined,
  };
  html = html.replace(/<script type="application\/ld\+json" id="schema-hospital">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json" id="schema-hospital">${safeJson(schema)}</script>`);

  const fields = {
    'detail-name': hospital.name,
    'detail-type': `${hospital.type}${place ? ` · ${place}` : ''}`,
    'detail-department': department,
    'detail-choice-summary': `${place || '해당 지역'}에서 ${department} 진료 기관을 찾을 때 기본 정보와 위치를 비교할 수 있습니다.`,
    'detail-choice-compare': '실제 진료 가능 항목, 의료진 일정, 예약 여부와 비용은 방문 전에 병원에 직접 확인하세요.',
    'detail-choice-flow': '전화로 진료 가능 여부와 접수 마감 시간을 확인한 뒤 주소와 이동 경로를 점검하세요.',
    'detail-choice-caution': '공개 데이터의 운영시간은 변경될 수 있으며 이 페이지는 진단이나 병원 추천을 제공하지 않습니다.',
    'detail-decision-intro': `${hospital.name} 방문 전에는 아래 순서로 정보를 확인하면 불필요한 이동을 줄일 수 있습니다.`,
    'detail-address': hospital.address || '공개된 주소 정보가 없습니다.',
    'detail-phone': hospital.phone || '공개된 전화번호가 없습니다.',
    'detail-doctor': '의료진 구성과 진료 일정은 병원에 직접 확인해 주세요.',
    'detail-date': hospital.openDate || '개원일 정보 확인 필요',
    'detail-region': place || '지역 정보 확인 필요',
    'detail-source-summary': sourceSummary,
    'detail-snapshot-summary': `${hospital.name}은(는) ${place || '해당 지역'}의 ${hospital.type}으로 등록된 의료기관입니다.`,
    'detail-snapshot-operation': '진료시간, 점심시간, 접수 마감과 휴진 여부는 방문 당일 전화로 확인하는 것이 안전합니다.',
    'detail-snapshot-facility': '주차, 병상, 편의시설과 의료장비 정보는 병원 안내를 통해 확인해 주세요.',
    'detail-snapshot-visit': '신분증과 복용 중인 약 목록, 이전 검사 결과가 있다면 함께 준비하세요.',
    'detail-primary-services': `${department} 관련 진료 여부를 병원에 문의한 후 방문하세요.`,
    'detail-visit-targets': `${department} 진료가 필요한 이용자가 위치와 연락처를 확인할 때 참고할 수 있습니다.`,
    'detail-documents': '신분증, 복용약 목록, 의뢰서 또는 이전 검사 결과가 필요한지 미리 확인하세요.',
    'detail-reservation': '예약제 여부와 당일 접수 마감 시간은 전화 또는 공식 홈페이지에서 확인하세요.',
    'detail-transport': `${hospital.address || '주소'}를 기준으로 대중교통과 주차 가능 여부를 함께 확인하세요.`,
    'detail-accessibility': '휠체어 이동, 엘리베이터, 보호자 동행 등 편의 지원은 병원에 문의하세요.',
    'detail-checklist': '증상과 시작 시점, 복용약, 알레르기, 이전 진료 내용을 메모하면 상담에 도움이 됩니다.',
    'detail-symptom-focus': `${department} 진료 범위에 해당하는지는 증상과 검사 필요성을 병원에 설명한 뒤 확인하세요.`,
    'detail-intake-tip': '초진 접수 가능 시간과 준비 서류를 전화로 확인하세요.',
    'detail-parking-tip': '주차장 위치, 이용 요금과 만차 시 대체 주차장을 확인하세요.',
    'detail-visit-flow': '진료 가능 여부 확인 → 예약·접수 확인 → 서류 준비 → 위치 확인 순서로 준비하세요.',
    'detail-match-summary': '건강보험심사평가원 공개 데이터의 기관 식별번호와 병원명을 기준으로 연결했습니다.',
    'detail-operation-summary': '공개 기본정보에는 실시간 접수 상황이 포함되지 않으므로 병원 확인이 필요합니다.',
    'detail-location-summary': `${hospital.address || '공개 주소 정보 없음'}${hospital.lat && hospital.lng ? ' (공개 좌표 보유)' : ''}`,
    'detail-equipment-summary': '장비와 시설은 별도 공개 정보 또는 병원 안내를 확인하세요.',
    'detail-data-updated': verifiedDate,
    'detail-verification-note': '공공데이터 확인 이후 변경될 수 있는 운영시간과 의료진 일정은 병원에 직접 확인하세요.',
    'detail-medical-note': '이 페이지는 정보 탐색용이며 진단, 치료 또는 특정 의료기관 이용을 권고하지 않습니다.',
    'detail-emergency': '응급진료 가능 여부는 119 또는 응급의료포털에서 확인하세요.',
    'detail-hours-note': '접수·점심시간은 병원에 직접 확인해 주세요.',
    'detail-room-bed': '공개 기본정보에 세부 병상 정보가 없습니다.',
    'detail-area': '공개 기본정보에 면적 정보가 없습니다.',
    'detail-parking': '주차 가능 여부와 요금은 병원에 확인해 주세요.',
    'detail-equipment': '보유 장비는 병원에 직접 확인해 주세요.',
  };
  for (const [id, value] of Object.entries(fields)) html = replaceElementText(html, id, value);

  if (hospital.sourceUrl) {
    html = replaceElementHtml(html, 'detail-source-summary', `<a href="${escapeAttribute(hospital.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary); font-weight:600;">${escapeHtml(sourceSummary)}</a>`);
  }

  html = replaceElementHtml(html, 'detail-hours', '<li>공개 기본정보에는 요일별 진료시간이 포함되지 않았습니다. 방문 전 전화로 확인해 주세요.</li>');
  html = replaceElementHtml(html, 'detail-compare-points', [hospital.type, department, place].filter(Boolean)
    .map((value) => `<span style="padding:9px 13px; border-radius:999px; border:1px solid var(--border-default);">${escapeHtml(value)}</span>`).join(''));
  html = replaceElementHtml(html, 'map-container', `<div style="display:flex; flex-direction:column; gap:12px; justify-content:center; min-height:360px; padding:24px;"><strong>${escapeHtml(hospital.name)}</strong><p style="margin:0; line-height:1.7;">${escapeHtml(hospital.address || '주소 정보 확인 필요')}</p><a href="${escapeAttribute(mapUrl)}" target="_blank" rel="noopener" style="color:var(--primary); font-weight:700;">네이버 지도에서 위치 확인</a></div>`);
  html = replaceElementHtml(html, 'detail-review-list', '<article style="padding:18px; border:1px solid var(--border-default); border-radius:14px;"><h4 style="margin:0 0 10px;">방문 전 확인</h4><p style="margin:0; line-height:1.7;">실시간 후기를 제공하지 않습니다. 접수 가능 여부와 진료 범위는 병원에 직접 확인해 주세요.</p></article>');
  html = replaceElementHtml(html, 'detail-nearby-list', relatedHospitals.length
    ? relatedHospitals.map((item) => `<a href="/hospital/${encodeURIComponent(item.id)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.type)}</span><span style="color:var(--text-muted); line-height:1.6;">${escapeHtml(item.address)}</span></a>`).join('')
    : `<p style="margin:0; color:var(--text-muted);">${escapeHtml(place || '주변')}의 의료기관은 검색 화면에서 지역과 진료과를 선택해 확인할 수 있습니다.</p>`);
  html = html.replace('<script src="js/data.js', `<script>window.SERVER_HOSPITAL=${safeJson(hospital)};</script>\n  <script src="js/data.js`);
  return html;
}

function replaceMeta(html, name, content) {
  const pattern = new RegExp(`<meta\\s+name=["']${escapeRegExp(name)}["'][^>]*>`, 'i');
  return html.replace(pattern, `<meta name="${name}" content="${escapeAttribute(content)}">`);
}

function injectHead(html, content) {
  return html.replace('</head>', `  ${content}\n</head>`);
}

function replaceElementText(html, id, value) {
  return replaceElementHtml(html, id, escapeHtml(value));
}

function replaceElementHtml(html, id, value) {
  const pattern = new RegExp(`(<([a-z0-9]+)\\b[^>]*\\bid=["']${escapeRegExp(id)}["'][^>]*>)[\\s\\S]*?(<\\/\\2>)`, 'i');
  return html.replace(pattern, (_, open, tag, close) => `${open}${value}${close}`);
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clean(value) {
  return String(value ?? '').trim();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number !== 0 ? number : 0;
}

function formatDate(value) {
  const digits = clean(value).replace(/[^0-9]/g, '');
  return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : clean(value);
}
