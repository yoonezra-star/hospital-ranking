const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const EXCLUDED_IDS = new Set([101]);
const START_MARKER = '<!-- HOSPITAL_EXAMPLES_START -->';
const END_MARKER = '<!-- HOSPITAL_EXAMPLES_END -->';
const COMPARE_HEADING = '<h3>\uBE44\uAD50 \uAE30\uC900 \uC815\uB9AC</h3>';

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

function loadHospitalsFromHead() {
  const source = execFileSync('git', ['show', 'HEAD:js/data.js'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.__HOSPITALS = HOSPITALS;`, context);
  return context.__HOSPITALS || [];
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
  if (hospital.departmentId === departmentId) {
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
  score += (hospital.score || 0) * 10;
  score += (hospital.reviewCount || 0) / 40;

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
  const items = hospitals.filter((hospital) => !EXCLUDED_IDS.has(hospital.id));
  const exact = items.filter((hospital) => {
    if (profile.region && hospital.region !== profile.region) {
      return false;
    }
    if (profile.district && !hospital.address.includes(profile.district)) {
      return false;
    }
    if (profile.operation && profile.operation !== 'newOpenings' && !hospital[profile.operation]) {
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

  const specialty = items.filter((hospital) => departmentMatch(hospital, profile.departmentId));
  const operationOnly = items.filter((hospital) => {
    if (!profile.operation || profile.operation === 'newOpenings') {
      return false;
    }
    return Boolean(hospital[profile.operation]);
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

  let title = '\uC5F0\uACB0 \uBCD1\uC6D0 \uC608\uC2DC';
  let note = '\uD604\uC7AC \uB370\uC774\uD130\uC14B\uC5D0\uC11C \uC9C0\uC5ED\uACFC \uC9C4\uB8CC\uACFC\uAC00 \uC9C1\uC811 \uB9DE\uB294 \uBCD1\uC6D0\uC744 \uC6B0\uC120 \uC5F0\uACB0\uD588\uC2B5\uB2C8\uB2E4.';
  push(exact);

  if (!picked.size) {
    push(regional);
    title = `${profile.region || '\uC804\uAD6D'} \uB300\uD45C \uC758\uB8CC\uAE30\uAD00 \uC608\uC2DC`;
    note = '\uD604\uC7AC \uB370\uC774\uD130\uC14B\uC5D0 \uAC19\uC740 \uC870\uAC74\uC758 \uC9C1\uC811 \uC77C\uCE58 \uD56D\uBAA9\uC774 \uC801\uC5B4, \uAC19\uC740 \uC9C0\uC5ED \uB610\uB294 \uBE44\uC2B7\uD55C \uC9C4\uB8CC \uD750\uB984\uC758 \uBCD1\uC6D0\uC744 \uD568\uAED8 \uD45C\uAE30\uD588\uC2B5\uB2C8\uB2E4.';
  }

  if (picked.size < 3) {
    push(specialty);
  }
  if (picked.size < 3) {
    push(operationOnly);
  }

  const result = Array.from(picked.values()).slice(0, 3);
  if (!result.length) {
    return null;
  }

  if (profile.operation && profile.operation !== 'newOpenings') {
    title = '\uC6B4\uC601\uC870\uAC74\uC5D0 \uB9DE\uB294 \uBCD1\uC6D0 \uC608\uC2DC';
    note = '\uD1A0\uC694\uC77C, \uC57C\uAC04, \uC77C\uC694\uC77C \uAC19\uC740 \uC6B4\uC601 \uC870\uAC74\uC774 \uB370\uC774\uD130\uC5D0 \uD45C\uC2DC\uB41C \uBCD1\uC6D0\uC744 \uC6B0\uC120 \uC5F0\uACB0\uD588\uC2B5\uB2C8\uB2E4.';
  }
  if (profile.operation === 'newOpenings') {
    title = '\uCD5C\uADFC \uAC1C\uC6D0 \uD750\uB984 \uCC38\uACE0 \uBCD1\uC6D0';
    note = '\uAC1C\uC6D0\uC77C \uC815\uBCF4\uAC00 \uC788\uB294 \uBCD1\uC6D0\uC744 \uAE30\uC900\uC73C\uB85C \uCD5C\uADFC \uAC1C\uC6D0 \uC21C\uC11C\uC640 \uB300\uD45C \uBCD1\uC6D0\uC744 \uD568\uAED8 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4.';
  }

  return { title, note, items: result };
}

function buildTags(hospital) {
  const tags = [hospital.department || hospital.type];
  if (hospital.saturdayOpen) {
    tags.push('\uD1A0\uC694\uC77C');
  }
  if (hospital.nightOpen) {
    tags.push('\uC57C\uAC04');
  }
  if (hospital.sundayOpen) {
    tags.push('\uC77C\uC694\uC77C');
  }
  return tags;
}

function buildSection(examples) {
  if (!examples) {
    return '';
  }

  return `
    ${START_MARKER}
    <section class="landing-note" style="margin-top:28px;">
      <h3>${escapeHtml(examples.title)}</h3>
      <p>${escapeHtml(examples.note)}</p>
      <div class="hospital-spotlight-grid" style="margin-top:16px;">
        ${examples.items.map((hospital) => `
          <a href="detail.html?id=${hospital.id}" class="hospital-spotlight-card">
            <span class="landing-badge">\uBCD1\uC6D0 \uC608\uC2DC</span>
            <strong>${escapeHtml(hospital.name)}</strong>
            <span class="hospital-spotlight-meta">${escapeHtml(hospital.address)}</span>
            <span class="hospital-spotlight-meta">\uD3C9\uC810 ${escapeHtml(hospital.score || '-')} / \uB9AC\uBDF0 ${escapeHtml(hospital.reviewCount || 0)}\uAC1C / \uAC1C\uC6D0 ${escapeHtml(String(hospital.openDate || '').slice(0, 4) || '-')}\uB144</span>
            <div class="hospital-spotlight-tags">
              ${buildTags(hospital).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
            </div>
          </a>
        `).join('')}
      </div>
    </section>
    ${END_MARKER}
  `;
}

function injectSection(html, section) {
  const blockPattern = new RegExp(`\\n?\\s*${START_MARKER}[\\s\\S]*?${END_MARKER}\\n?`, 'g');
  const cleaned = html.replace(blockPattern, '\n');
  const markerIndex = cleaned.indexOf(COMPARE_HEADING);
  if (markerIndex === -1) {
    return cleaned;
  }
  const sectionStart = cleaned.lastIndexOf('    <section class="landing-note"', markerIndex);
  if (sectionStart === -1) {
    return cleaned;
  }
  return `${cleaned.slice(0, sectionStart)}${section}\n${cleaned.slice(sectionStart)}`;
}

function main() {
  const pages = loadArrayFromHead('js/landing-pages.js', 'LANDING_PAGES');
  const hospitals = loadHospitalsFromHead();

  for (const page of pages) {
    const filePath = path.join(ROOT, page.href);
    const html = fs.readFileSync(filePath, 'utf8');
    const examples = chooseExamples(page, hospitals);
    const updated = injectSection(html, buildSection(examples));
    fs.writeFileSync(filePath, updated, 'utf8');
  }

  console.log(`Injected hospital examples into ${pages.length} landing pages.`);
}

main();
