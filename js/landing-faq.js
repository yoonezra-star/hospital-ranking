(() => {
  const LANDING_META = [
    { href: 'seoul-dental.html', region: '서울', department: '치과', focus: '임플란트, 교정, 보철', guideLabel: '임플란트 가이드' },
    { href: 'seoul-ophthalmology.html', region: '서울', department: '안과', focus: '시력검사, 백내장 상담, 안구건조', guideLabel: '시력교정 가이드' },
    { href: 'seoul-internal.html', region: '서울', department: '내과', focus: '건강검진 상담, 소화기 증상, 만성질환 추적', guideLabel: '만성질환 가이드' },
    { href: 'seoul-obgyn.html', region: '서울', department: '산부인과', focus: '여성검진, 초음파 상담, 부정출혈, 폐경 전후 체크', guideLabel: '여성검진 가이드' },
    { href: 'seoul-psychiatry.html', region: '서울', department: '정신건강의학과', focus: '우울, 불안, 수면 문제, 공황, 약물 추적', guideLabel: '우울·불안 가이드' },
    { href: 'gyeonggi-orthopedic.html', region: '경기', department: '정형외과', focus: '허리, 무릎, 관절 통증', guideLabel: '정형외과 가이드' },
    { href: 'gyeonggi-dental.html', region: '경기', department: '치과', focus: '임플란트, 교정, 보철', guideLabel: '임플란트 가이드' },
    { href: 'busan-ophthalmology.html', region: '부산', department: '안과', focus: '시력검사, 백내장 상담, 안구건조', guideLabel: '시력교정 가이드' },
    { href: 'busan-dental.html', region: '부산', department: '치과', focus: '임플란트, 교정, 보철', guideLabel: '임플란트 가이드' },
    { href: 'daejeon-internal.html', region: '대전', department: '내과', focus: '건강검진 상담, 소화기 증상, 만성질환 추적', guideLabel: '검사 준비 가이드' },
    { href: 'daejeon-ent.html', region: '대전', department: '이비인후과', focus: '비염, 목 통증, 귀 증상', guideLabel: '비염 가이드' },
    { href: 'incheon-pediatric.html', region: '인천', department: '소아과', focus: '발열, 기침, 예방접종', guideLabel: '증상 체크 가이드' },
    { href: 'incheon-ophthalmology.html', region: '인천', department: '안과', focus: '시력검사, 백내장 상담, 안구건조', guideLabel: '시력교정 가이드' },
    { href: 'daegu-ent.html', region: '대구', department: '이비인후과', focus: '비염, 목 통증, 귀 증상', guideLabel: '비염 가이드' },
  ];

  const currentPage = window.location.pathname.split('/').pop() || '';
  const meta = LANDING_META.find((item) => item.href === currentPage);
  const noteSection = document.querySelector('.landing-note');

  if (!meta || !noteSection || noteSection.dataset.faqMounted === 'true') {
    return;
  }

  const faqItems = [
    {
      question: `${meta.region} ${meta.department}를 찾을 때 무엇부터 확인하면 좋나요?`,
      answer: `${meta.focus}처럼 방문 목적을 먼저 나누는 것이 좋습니다. 같은 지역이라도 생활권, 주차, 토요일 진료 여부에 따라 실제 방문 편의가 크게 달라질 수 있습니다.`,
    },
    {
      question: `${meta.region} ${meta.department} 방문 전에 어떤 준비가 필요한가요?`,
      answer: `신분증, 기존 검사 결과, 복용약 목록을 먼저 챙기면 상담이 훨씬 수월합니다. 이 페이지에서 연결한 ${meta.guideLabel}도 함께 보면 준비 순서를 정리하는 데 도움이 됩니다.`,
    },
    {
      question: `이 페이지의 ${meta.region} ${meta.department} 정보는 어떻게 활용하면 좋나요?`,
      answer: `먼저 랜딩 페이지에서 비교 기준을 잡고, 이후 목록 페이지와 상세 페이지로 이동해 운영 시간, 주차, FAQ, 공공데이터 요약을 함께 확인하는 방식이 효율적입니다.`,
    },
  ];

  const wrapper = document.createElement('section');
  wrapper.className = 'landing-note';
  wrapper.style.marginTop = '28px';
  wrapper.innerHTML = `
    <h3>자주 묻는 질문</h3>
    <div style="display:flex; flex-direction:column; gap:12px;">
      ${faqItems.map((item, index) => `
        <details ${index === 0 ? 'open' : ''} style="border:1px solid var(--border-default); border-radius:14px; background:var(--bg-body); padding:16px 18px;">
          <summary style="cursor:pointer; font-weight:700; color:var(--text-heading); line-height:1.5;">${escapeHtml(item.question)}</summary>
          <p style="margin:12px 0 0; color:var(--text-body); line-height:1.75;">${escapeHtml(item.answer)}</p>
        </details>
      `).join('')}
    </div>
  `;

  noteSection.dataset.faqMounted = 'true';
  noteSection.insertAdjacentElement('beforebegin', wrapper);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const schemaElement = document.createElement('script');
  schemaElement.type = 'application/ld+json';
  schemaElement.textContent = JSON.stringify(schema);
  document.head.appendChild(schemaElement);

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
