const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const EXCLUDED_IDS = new Set([101]);
const EXCLUDED_HIRA_IDS = new Set([
  'JDQ4MTYyMiM2MSMkMSMkMiMkNzIkMzgxOTYxIzExIyQyIyQ3IyQwMCQyNjE0ODEjNDEjJDEjJDQjJDgz',
]);
const START_MARKER = '<!-- HOSPITAL_EXAMPLES_START -->';
const END_MARKER = '<!-- HOSPITAL_EXAMPLES_END -->';
const INSERT_BEFORE_HEADINGS = [
  '<h3>\uBE44\uAD50 \uAE30\uC900 \uC815\uB9AC</h3>',
  '<h2>\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38</h2>',
];
const DEPARTMENT_LABELS = {
  dental: '치과',
  ophthalmology: '안과',
  internal: '내과',
  ent: '이비인후과',
  orthopedic: '정형외과',
  pain: '마취통증의학과',
  pediatric: '소아청소년과',
  obgyn: '산부인과',
  urology: '비뇨의학과',
  psychiatry: '정신건강의학과',
  rehab: '재활의학과',
  dermatology: '피부과',
};

function loadArrayFromHead(file, constName) {
  const source = execFileSync('git', ['show', `HEAD:${file}`], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const match = source.match(new RegExp(`const ${constName} = \\[(.*?)\\];`, 's'));
  if (!match) {
    throw new Error(`${constName} not found in ${file}`);
  }
  return Function(`return [${match[1]}];`)();
}

function loadHospitals() {
  const source = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.__HOSPITALS = HOSPITALS; this.__NEW_HOSPITALS = NEW_HOSPITALS;`, context);
  const local = [...(context.__HOSPITALS || []), ...(context.__NEW_HOSPITALS || [])];
  const snapshotPath = path.join(ROOT, 'data/verified-landing-hospitals.json');
  const snapshot = fs.existsSync(snapshotPath)
    ? JSON.parse(fs.readFileSync(snapshotPath, 'utf8')).hospitals || []
    : [];
  const verified = [...local, ...snapshot]
    .map(normalizeHospital)
    .filter(isVerifiedHospital);
  return Array.from(new Map(verified.map((hospital) => [hospital.hiraId, hospital])).values());
}

function normalizeHospital(hospital) {
  const tokens = String(hospital.address || '').trim().split(/\s+/).filter(Boolean);
  const region = hospital.region || String(tokens[0] || '').replace(/(특별시|광역시|특별자치시|특별자치도|자치도|도)$/u, '');
  const district = hospital.district || tokens[1] || '';
  return {
    ...hospital,
    region,
    district,
  };
}

function isVerifiedHospital(hospital) {
  return ['api-retrieved', 'verified'].includes(hospital.verificationStatus)
    && Boolean(hospital.hiraId && hospital.name && hospital.address && hospital.sourceUrl && hospital.verifiedAt);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveProfile(page) {
  const profile = {
    region: page.region,
    district: null,
    departmentId: null,
    operation: null,
  };

  if (page.region === '\uAC15\uB0A8') {
    profile.region = '\uC11C\uC6B8';
    profile.district = '\uAC15\uB0A8\uAD6C';
  } else if (page.region === '\uC1A1\uD30C') {
    profile.region = '\uC11C\uC6B8';
    profile.district = '\uC1A1\uD30C\uAD6C';
  } else if (page.region === '\uC804\uAD6D') {
    profile.region = null;
  }

  const href = page.href;
  if (href.includes('dental') || href.includes('implant') || href.includes('parking-dental')) {
    profile.departmentId = 'dental';
  } else if (href.includes('ophthalmology') || href.includes('lasik') || href.includes('cataract')) {
    profile.departmentId = 'ophthalmology';
  } else if (href.includes('internal') || href.includes('endoscopy')) {
    profile.departmentId = 'internal';
  } else if (href.includes('ent')) {
    profile.departmentId = 'ent';
  } else if (href.includes('orthopedic')) {
    profile.departmentId = 'orthopedic';
  } else if (href.includes('pain')) {
    profile.departmentId = 'pain';
  } else if (href.includes('pediatric') || href.includes('vaccination')) {
    profile.departmentId = 'pediatric';
  } else if (href.includes('obgyn') || href.includes('womens-checkup')) {
    profile.departmentId = 'obgyn';
  } else if (href.includes('urology') || href.includes('urinary-stone')) {
    profile.departmentId = 'urology';
  } else if (href.includes('psychiatry')) {
    profile.departmentId = 'psychiatry';
  } else if (href.includes('rehab') || href.includes('manual-therapy')) {
    profile.departmentId = 'rehab';
  } else if (href.includes('dermatology')) {
    profile.departmentId = 'dermatology';
  }

  if (href.includes('saturday')) {
    profile.operation = 'saturdayOpen';
  } else if (href.includes('night')) {
    profile.operation = 'nightOpen';
  } else if (href.includes('sunday')) {
    profile.operation = 'sundayOpen';
  } else if (href.includes('new-openings')) {
    profile.operation = 'newOpenings';
  }

  return profile;
}

function departmentMatch(hospital, departmentId) {
  if (!departmentId) {
    return true;
  }
  if (hospital.departmentId === departmentId || hospital.registeredDepartmentIds?.includes(departmentId)) {
    return true;
  }
  if (departmentId === 'internal' && hospital.departmentId === 'general') {
    return true;
  }
  if (departmentId === 'pediatric' && (hospital.departmentId === 'familymed' || hospital.departmentId === 'general')) {
    return true;
  }
  if (departmentId === 'obgyn' && hospital.departmentId === 'general') {
    return true;
  }
  if (departmentId === 'urology' && hospital.departmentId === 'general') {
    return true;
  }
  if (departmentId === 'rehab' && hospital.departmentId === 'orthopedic') {
    return true;
  }
  return false;
}

function scoreHospital(hospital, profile) {
  let score = 0;

  if (profile.region && hospital.region === profile.region) {
    score += 25;
  }
  if (profile.district && hospital.address.includes(profile.district)) {
    score += 35;
  }
  if (profile.departmentId && hospital.departmentId === profile.departmentId) {
    score += 30;
  } else if (profile.departmentId && hospital.departmentId === 'general') {
    score += 8;
  }
  if (profile.operation && profile.operation !== 'newOpenings' && hospital[profile.operation]) {
    score += 18;
  }
  if (profile.operation === 'newOpenings' && hospital.openDate) {
    score += Number(String(hospital.openDate).replace(/-/g, '')) / 1000000;
  }

  return score;
}

function chooseExamples(page, hospitals) {
  const profile = resolveProfile(page);
  if (!profile.departmentId) return null;
  const items = hospitals.filter((hospital) => !EXCLUDED_IDS.has(hospital.id)
    && !EXCLUDED_HIRA_IDS.has(hospital.hiraId));
  const exactSpecialty = items.filter((hospital) => {
    if (profile.region && hospital.region !== profile.region) {
      return false;
    }
    if (profile.district && !hospital.address.includes(profile.district)) {
      return false;
    }
    return departmentMatch(hospital, profile.departmentId);
  });

  const exactFallback = items.filter((hospital) => {
    if (profile.region && hospital.region !== profile.region) {
      return false;
    }
    if (profile.district && !hospital.address.includes(profile.district)) {
      return false;
    }
    return departmentMatch(hospital, profile.departmentId);
  });

  const regional = items.filter((hospital) => {
    if (!profile.region || hospital.region !== profile.region) {
      return false;
    }
    if (profile.district && !hospital.address.includes(profile.district)) {
      return false;
    }
    return true;
  });

  const specialty = items.filter((hospital) => {
    if (!profile.departmentId) {
      return false;
    }
    return departmentMatch(hospital, profile.departmentId);
  });
  const picked = new Map();
  const push = (list) => {
    for (const hospital of list.sort((a, b) => scoreHospital(b, profile) - scoreHospital(a, profile))) {
      if (!picked.has(hospital.id)) {
        picked.set(hospital.id, hospital);
      }
      if (picked.size >= 3) {
        break;
      }
    }
  };

  let title = '공공데이터로 확인한 관련 병원';
  let note = '건강보험심사평가원 병원기본정보에서 지역과 진료과가 확인된 의료기관을 연결했습니다.';
  push(exactSpecialty);

  if (!picked.size) {
    push(exactFallback);
  }

  if (picked.size < 3 && !profile.district) {
    push(specialty);
  }

  if (!picked.size && !profile.district) {
    push(regional);
    title = `${profile.region || '\uC804\uAD6D'} \uB300\uD45C \uC758\uB8CC\uAE30\uAD00 \uC608\uC2DC`;
    note = '\uD604\uC7AC \uB370\uC774\uD130\uC14B\uC5D0 \uAC19\uC740 \uC870\uAC74\uC758 \uC9C1\uC811 \uC77C\uCE58 \uD56D\uBAA9\uC774 \uC801\uC5B4, \uAC19\uC740 \uC9C0\uC5ED \uB610\uB294 \uBE44\uC2B7\uD55C \uC9C4\uB8CC \uD750\uB984\uC758 \uBCD1\uC6D0\uC744 \uD568\uAED8 \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4.';
  }

  if (picked.size < 3 && !profile.district) {
    push(regional);
  }
  if (picked.size < 3 && !profile.district) {
    push(exactFallback);
  }
  const result = Array.from(picked.values()).slice(0, 3);
  if (!result.length) {
    return null;
  }

  if (profile.operation && profile.operation !== 'newOpenings') {
    title = '공공데이터로 확인한 진료과 병원';
    note = '아래 기관은 진료과를 기준으로 확인했습니다. 토요일, 야간, 일요일 운영 여부는 실시간 정보가 아니므로 방문 전 병원에 직접 확인해 주세요.';
  }
  if (profile.operation === 'newOpenings') {
    title = '\uCD5C\uADFC \uAC1C\uC6D0 \uD750\uB984 \uCC38\uACE0 \uBCD1\uC6D0';
    note = '\uAC1C\uC6D0\uC77C \uC815\uBCF4\uAC00 \uC788\uB294 \uBCD1\uC6D0\uC744 \uAE30\uC900\uC73C\uB85C \uCD5C\uADFC \uAC1C\uC6D0 \uC21C\uC11C\uC640 \uB300\uD45C \uBCD1\uC6D0\uC744 \uD568\uAED8 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4.';
  }

  return { title, note, items: result, departmentId: profile.departmentId };
}

function buildTags(hospital, departmentId) {
  return [DEPARTMENT_LABELS[departmentId] || hospital.department || hospital.type, hospital.region, '공공데이터 확인'].filter(Boolean);
}

function buildSection(examples) {
  if (!examples) {
    return '';
  }

  return `
    ${START_MARKER}
    <section class="hospital-spotlight-section landing-note intent-note" style="margin-top:28px;">
      <h2>${escapeHtml(examples.title)}</h2>
      <p>${escapeHtml(examples.note)}</p>
      <div class="hospital-spotlight-grid" style="margin-top:16px;">
        ${examples.items.map((hospital) => `
          <a href="/hospital/${encodeURIComponent(hospital.hiraId || hospital.id)}" class="hospital-spotlight-card">
            <span class="landing-badge">공공데이터 확인</span>
            <strong>${escapeHtml(hospital.name)}</strong>
            <span class="hospital-spotlight-meta">${escapeHtml(hospital.address)}</span>
            <span class="hospital-spotlight-meta">${escapeHtml(hospital.sourceName)} · ${escapeHtml(hospital.verifiedAt)} 확인</span>
            <div class="hospital-spotlight-tags">
              ${buildTags(hospital, examples.departmentId).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
            </div>
          </a>
        `).join('')}
      </div>
    </section>
    ${END_MARKER}
  `.replace(/[ \t]+$/gm, '');
}

function injectSection(html, section) {
  if (!section && !html.includes(START_MARKER)) {
    return html;
  }
  const blockPattern = new RegExp(`\\n?\\s*${START_MARKER}[\\s\\S]*?${END_MARKER}\\n?`, 'g');
  const cleaned = html.replace(blockPattern, '\n').replace(/^[ \t]+$/gm, '');
  if (!section) {
    return cleaned;
  }
  const markerIndex = INSERT_BEFORE_HEADINGS
    .map((heading) => cleaned.indexOf(heading))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0] ?? -1;
  if (markerIndex === -1) {
    return cleaned;
  }
  const sectionStart = cleaned.lastIndexOf('<section', markerIndex);
  if (sectionStart === -1) {
    return cleaned;
  }
  const lineStart = cleaned.lastIndexOf('\n', sectionStart) + 1;
  return `${cleaned.slice(0, lineStart)}${section}\n${cleaned.slice(lineStart)}`;
}

function main() {
  const pages = loadArrayFromHead('js/landing-pages.js', 'LANDING_PAGES');
  const hospitals = loadHospitals();

  for (const page of pages) {
    const filePath = path.join(ROOT, routeToFile(page.href));
    const html = fs.readFileSync(filePath, 'utf8');
    const examples = chooseExamples(page, hospitals);
    const updated = injectSection(html, buildSection(examples));
    fs.writeFileSync(filePath, updated, 'utf8');
  }

  console.log(`Injected hospital examples into ${pages.length} landing pages.`);
}

function routeToFile(href) {
  return `${String(href).replace(/^\//, '').replace(/\.html$/, '')}.html`;
}

main();
