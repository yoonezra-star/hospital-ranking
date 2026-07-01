const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const SITE_URL = 'https://hospital-ranking.kr';
const CSS_VERSION = '12';

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildKeyword(page) {
  return page.region === '전국' ? page.department : `${page.region} ${page.department}`;
}

function buildRegionPhrase(page) {
  if (page.region === '전국') {
    return `${page.department} 관련 병원을 찾을 때`;
  }
  return `${page.region} 지역에서 ${page.department} 관련 병원을 찾을 때`;
}

function buildGuide(page, meta) {
  const labelMap = {
    '강남 라식 안과 가이드': { href: 'guide-lasik.html', label: '시력교정 가이드' },
    '검사 준비 가이드': { href: 'guide-endoscopy.html', label: '검사 준비 가이드' },
    '내시경 병원 가이드': { href: 'guide-endoscopy.html', label: '내시경 가이드' },
    '도수치료 병원 가이드': { href: 'guide-manual-therapy.html', label: '도수치료 가이드' },
    '라식 라섹 안과 가이드': { href: 'guide-lasik.html', label: '라식 라섹 가이드' },
    '만성질환 가이드': { href: 'guide-diabetes.html', label: '내과 가이드' },
    '백내장 병원 가이드': { href: 'guide-cataract.html', label: '백내장 가이드' },
    '비뇨의학과 가이드': { href: 'guide-urology.html', label: '비뇨의학과 가이드' },
    '비염 가이드': { href: 'guide-rhinitis.html', label: '비염 가이드' },
    '송파 여성검진 가이드': { href: 'guide-womens-checkup.html', label: '여성검진 가이드' },
    '시력교정 가이드': { href: 'guide-lasik.html', label: '시력교정 가이드' },
    '신규 개원 병원 가이드': { href: 'guide.html', label: '건강 가이드 모음' },
    '야간 진료 가이드': { href: 'guide.html', label: '야간 진료 팁' },
    '야간 피부과 가이드': { href: 'guide-acne.html', label: '피부과 가이드' },
    '여드름 가이드': { href: 'guide-acne.html', label: '피부과 가이드' },
    '여성검진 가이드': { href: 'guide-womens-checkup.html', label: '여성검진 가이드' },
    '여성검진 병원 가이드': { href: 'guide-womens-checkup.html', label: '여성검진 가이드' },
    '예방접종 병원 가이드': { href: 'guide.html', label: '예방접종 안내' },
    '요로결석 병원 가이드': { href: 'guide-urology.html', label: '비뇨의학과 가이드' },
    '우울·불안 가이드': { href: 'guide-depression.html', label: '우울·불안 가이드' },
    '일요일 소아과 가이드': { href: 'guide.html', label: '휴일 진료 안내' },
    '일요일 진료 가이드': { href: 'guide.html', label: '휴일 진료 안내' },
    '임플란트 가이드': { href: 'guide-implant.html', label: '임플란트 가이드' },
    '임플란트 치과 가이드': { href: 'guide-implant.html', label: '임플란트 가이드' },
    '재활 준비 가이드': { href: 'guide-manual-therapy.html', label: '재활 준비 가이드' },
    '정형외과 가이드': { href: 'guide-ortho.html', label: '정형외과 가이드' },
    '증상 체크 가이드': { href: 'guide.html', label: '증상별 가이드' },
    '치과 방문 준비 가이드': { href: 'guide-implant.html', label: '치과 가이드' },
    '토요일 임플란트 가이드': { href: 'guide-implant.html', label: '임플란트 가이드' },
    '토요일 진료 가이드': { href: 'guide.html', label: '토요일 진료 팁' },
    '통증 외래 가이드': { href: 'guide-ortho.html', label: '통증·재활 가이드' },
  };

  return labelMap[meta.guideLabel] || { href: 'guide.html', label: '건강 가이드 모음' };
}

function buildSecondaryKeyword(page, focusParts) {
  const firstFocus = focusParts[0] || page.department;
  if (page.region === '전국') {
    return `${page.department} ${firstFocus}`;
  }
  return `${page.region} ${firstFocus}`;
}

function buildConditionKeyword(page) {
  const keyword = buildKeyword(page);
  if (keyword.includes('토요일') || keyword.includes('야간') || keyword.includes('일요일') || keyword.includes('주차')) {
    return keyword;
  }
  if (page.department.includes('치과')) {
    return `${keyword} 토요일`;
  }
  if (page.department.includes('피부과')) {
    return `${keyword} 야간`;
  }
  if (page.department.includes('소아과')) {
    return `${keyword} 일요일`;
  }
  return `${keyword} 주차`;
}

function pickRelatedPages(current, pages) {
  const picked = new Set([current.href]);
  const recommendations = [];

  function appendMatches(predicate) {
    for (const page of pages) {
      if (picked.has(page.href) || !predicate(page)) {
        continue;
      }
      picked.add(page.href);
      recommendations.push(page);
    }
  }

  appendMatches((page) => page.region === current.region && page.department !== current.department);
  appendMatches((page) => page.department === current.department && page.region !== current.region);
  appendMatches((page) => page.region === '전국');

  return recommendations.slice(0, 3);
}

function buildFaq(page, meta, guide) {
  const keyword = buildKeyword(page);
  return [
    {
      question: `${page.title} 페이지는 어떻게 활용하면 좋나요?`,
      answer: `${page.title} 페이지는 검색 전에 비교 기준을 빠르게 정리하는 참고 페이지입니다. ${keyword} 검색 결과를 보기 전에 방문 목적과 운영조건을 먼저 정리하면 결과를 훨씬 빠르게 좁힐 수 있습니다.`,
    },
    {
      question: `방문 전에 무엇을 먼저 확인해야 하나요?`,
      answer: `접수 마감 시간, 실제 진료 가능 여부, 준비해야 할 검사 결과나 복용약 정보를 먼저 확인하는 것이 좋습니다. ${guide.label}도 함께 보면 준비 순서를 정리하는 데 도움이 됩니다.`,
    },
    {
      question: `이 페이지 정보만으로 병원을 결정해도 되나요?`,
      answer: `아닙니다. 이 페이지는 비교를 위한 참고 정보입니다. 최종 방문 전에는 병원 운영시간, 접수 가능 여부, 비용과 검사 범위를 병원에 직접 다시 확인하는 것을 권장합니다.`,
    },
  ];
}

function buildHtml(page, meta, pages) {
  const keyword = buildKeyword(page);
  const guide = buildGuide(page, meta);
  const focusParts = meta.focus.split(',').map((item) => item.trim()).filter(Boolean);
  const secondaryKeyword = buildSecondaryKeyword(page, focusParts);
  const conditionKeyword = buildConditionKeyword(page);
  const relatedPages = pickRelatedPages(page, pages);
  const faqItems = buildFaq(page, meta, guide);
  const canonical = `${SITE_URL}/${page.href.replace(/\.html$/, '')}`;
  const badge = page.region === '전국' ? page.department : `${page.region} ${page.department}`;
  const schemaCollection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title,
    url: canonical,
    description: page.description,
  };
  const schemaBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '병원찾기', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: page.title, item: canonical },
    ],
  };
  const schemaFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)} - 병원찾기</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index,follow">
  <link rel="stylesheet" href="css/style.css?v=${CSS_VERSION}">
  <style>
    .landing-page { max-width: 1120px; padding-top: 56px; }
    .landing-hero { padding: 36px; border: 1px solid var(--border-default); border-radius: 24px; background: radial-gradient(circle at top right, rgba(24, 124, 103, 0.16), transparent 28%), linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 84%, white 16%), color-mix(in srgb, var(--bg-body) 90%, white 10%)); margin-bottom: 28px; }
    .landing-grid, .landing-link-grid { display: grid; gap: 20px; }
    .landing-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-bottom: 28px; }
    .landing-link-grid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .landing-card-page, .landing-note { border: 1px solid var(--border-default); border-radius: 20px; background: var(--bg-card); box-shadow: var(--shadow-xs); padding: 24px; }
    .landing-card-page ul { padding-left: 18px; margin: 0; }
    .landing-card-page li, .landing-card-page p, .landing-note p { color: var(--text-body); line-height: 1.72; }
    .landing-link { display:flex; flex-direction:column; gap:12px; min-height:100%; padding:22px; border:1px solid var(--border-default); border-radius:18px; background:var(--bg-card); text-decoration:none; color:inherit; box-shadow:var(--shadow-xs); }
    .landing-badge { display:inline-flex; width:fit-content; padding:7px 12px; border-radius:999px; background:color-mix(in srgb, var(--primary-50) 68%, white 32%); color:var(--primary-700); font-size:0.84rem; font-weight:700; }
    .hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:20px; }
    .faq-item { border:1px solid var(--border-default); border-radius:14px; background:var(--bg-body); padding:16px 18px; }
    .faq-item summary { cursor:pointer; font-weight:700; color:var(--text-heading); line-height:1.5; }
    .faq-item p { margin:12px 0 0; }
    @media (max-width: 768px) {
      .landing-page { padding-top: 44px; }
      .landing-hero, .landing-card-page, .landing-note, .landing-link { padding: 20px 18px; }
    }
  </style>
  <script type="application/ld+json">${JSON.stringify(schemaCollection)}</script>
  <script type="application/ld+json">${JSON.stringify(schemaBreadcrumb)}</script>
  <script type="application/ld+json">${JSON.stringify(schemaFaq)}</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1441018945572157" crossorigin="anonymous"></script>
</head>
<body class="light-mode">
  <header class="header">
    <div class="header-inner">
      <a href="index.html" class="logo"><span class="logo-icon">🏥</span><span class="gradient-text">병원찾기</span></a>
      <nav class="nav-links">
        <a href="index.html#ranking">병원목록</a>
        <a href="guide.html">건강 가이드</a>
        <a href="about.html">사이트 소개</a>
      </nav>
    </div>
  </header>
  <main class="container landing-page">
    <section class="landing-hero fade-up visible">
      <span class="landing-badge">${escapeHtml(badge)}</span>
      <h1 style="margin-top:14px;">${escapeHtml(page.title)}</h1>
      <p class="section-desc" style="margin-top:12px;">${escapeHtml(page.description)}</p>
      <div class="hero-actions">
        <a href="index.html?keyword=${encodeURIComponent(keyword)}#search-results" class="btn btn-primary">${escapeHtml(keyword)} 검색</a>
        <a href="${guide.href}" class="btn btn-outline">${escapeHtml(guide.label)}</a>
      </div>
    </section>
    <section class="landing-grid">
      <article class="landing-card-page">
        <h3>이럴 때 먼저 보세요</h3>
        <ul>
          <li>${escapeHtml(buildRegionPhrase(page))} 비교 기준을 먼저 정리하고 싶은 경우</li>
          <li>${escapeHtml(focusParts[0] || meta.focus)}처럼 방문 목적이 비교적 분명한 경우</li>
          <li>토요일, 야간, 일요일 진료나 주차 같은 운영조건을 함께 보고 싶은 경우</li>
        </ul>
      </article>
      <article class="landing-card-page">
        <h3>방문 전 체크</h3>
        <ul>
          <li>접수 마감 시간과 실제 진료 가능 여부</li>
          <li>기존 검사 결과, 복용약, 이전 진료기록 준비 여부</li>
          <li>주차, 대중교통, 보호자 동행처럼 실제 방문 동선에 필요한 조건</li>
        </ul>
      </article>
      <article class="landing-card-page">
        <h3>검색 팁</h3>
        <ul>
          <li>검색창에 <strong>${escapeHtml(keyword)}</strong>처럼 지역과 진료과를 함께 입력해 보세요.</li>
          <li><strong>${escapeHtml(secondaryKeyword)}</strong>처럼 증상이나 목적을 붙이면 결과를 더 빨리 좁힐 수 있습니다.</li>
          <li><strong>${escapeHtml(conditionKeyword)}</strong>처럼 운영조건을 함께 넣으면 실제 방문 가능한 병원을 찾기 쉬워집니다.</li>
        </ul>
      </article>
    </section>
    <section class="landing-link-grid">
      <a href="index.html?keyword=${encodeURIComponent(keyword)}#search-results" class="landing-link">
        <span class="landing-badge">기본 검색</span>
        <strong>${escapeHtml(keyword)} 검색 결과 보기</strong>
        <span>${escapeHtml(page.description)}</span>
      </a>
      <a href="index.html?keyword=${encodeURIComponent(conditionKeyword)}#search-results" class="landing-link">
        <span class="landing-badge">운영조건 검색</span>
        <strong>${escapeHtml(conditionKeyword)} 바로 찾기</strong>
        <span>지역, 진료과, 운영조건을 함께 넣어 실제 방문 가능한 병원을 빠르게 좁히는 데 도움이 됩니다.</span>
      </a>
      <a href="${guide.href}" class="landing-link">
        <span class="landing-badge">건강 가이드</span>
        <strong>${escapeHtml(guide.label)}</strong>
        <span>${escapeHtml(meta.focus)} 중심으로 준비할 내용을 먼저 정리해 두면 검색 결과를 해석하기가 쉬워집니다.</span>
      </a>
    </section>
    <section class="landing-note" style="margin-top:28px;">
      <h3>비교 기준 정리</h3>
      <p>${escapeHtml(page.title)} 페이지는 광고성 추천이 아니라 비교 기준을 잡기 위한 설명형 랜딩입니다. 같은 지역이라도 생활권, 접수 마감, 주차 여부, 토요일 또는 야간 운영 여부에 따라 실제 방문 편의가 크게 달라질 수 있습니다.</p>
      <p style="margin-top:12px;">특히 ${escapeHtml(meta.focus)}처럼 방문 목적을 먼저 정리한 뒤 검색하면 목록을 훨씬 빠르게 좁힐 수 있습니다. 최종 방문 전에는 병원에 직접 연락해 진료 가능 여부와 준비사항을 다시 확인하는 것을 권장합니다.</p>
    </section>
    <section class="landing-note" style="margin-top:28px;">
      <h3>자주 묻는 질문</h3>
      <div style="display:flex; flex-direction:column; gap:12px; margin-top:14px;">
        ${faqItems.map((item, index) => `<details ${index === 0 ? 'open ' : ''}class="faq-item"><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}
      </div>
    </section>
    <section class="landing-note" style="margin-top:28px;">
      <h3>관련 페이지</h3>
      <div class="landing-link-grid" style="margin-top:16px;">
        ${relatedPages.map((item) => `<a href="${item.href}" class="landing-link"><span class="landing-badge">${escapeHtml(item.region === '전국' ? item.department : `${item.region} ${item.department}`)}</span><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></a>`).join('')}
      </div>
    </section>
    <section class="landing-note" style="margin-top:28px;">
      <h3>안내와 주의사항</h3>
      <p>이 페이지는 2026년 6월 기준으로 구조와 안내 문구를 정리한 참고 페이지입니다. 실제 진료 가능 여부, 접수 마감, 비용, 검사 범위는 병원마다 다를 수 있으므로 방문 전 직접 확인해 주세요.</p>
      <p style="margin-top:12px;">응급 상황이나 증상 악화, 수술 결정처럼 즉시 판단이 필요한 경우에는 이 페이지 정보만으로 결정하지 말고 해당 병원이나 의료진과 직접 상담하는 것이 안전합니다.</p>
    </section>
  </main>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-bottom">
        <p>&copy; 2026 병원찾기. 병원 검색과 진료 정보 탐색을 위한 안내 서비스입니다.</p>
        <p>운영시간, 접수마감, 진료 가능 여부는 변동될 수 있으므로 방문 전 병원에 직접 확인하는 것을 권장합니다.</p>
      </div>
    </div>
  </footer>
</body>
</html>
`;
}

function main() {
  const pages = loadArrayFromHead('js/landing-pages.js', 'LANDING_PAGES');
  const metaList = loadArrayFromHead('js/landing-faq.js', 'LANDING_META');
  const metaByHref = new Map(metaList.map((item) => [item.href, item]));

  for (const page of pages) {
    const meta = metaByHref.get(page.href);
    if (!meta) {
      throw new Error(`Missing FAQ meta for ${page.href}`);
    }

    const html = buildHtml(page, meta, pages);
    fs.writeFileSync(path.join(ROOT, page.href), html, 'utf8');
  }

  console.log(`Regenerated ${pages.length} landing pages.`);
}

main();
