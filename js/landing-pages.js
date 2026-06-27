(() => {
  const LANDING_PAGES = [
    { href: 'night-dermatology.html', title: '야간 피부과 찾기 가이드', region: '전국', department: '야간 피부과', description: '퇴근 후 외래, 접수 마감, 일반 진료와 시술 상담 시간을 함께 보는 피부과 검색 가이드입니다.' },
    { href: 'sunday-pediatric.html', title: '일요일 소아과 찾기 가이드', region: '전국', department: '일요일 소아과', description: '휴일 보호자 외래에서 발열, 기침, 중이염 의심처럼 자주 찾는 상황을 기준으로 정리했습니다.' },
    { href: 'womens-checkup-clinic.html', title: '여성검진 병원 찾기 가이드', region: '전국', department: '여성검진 병원', description: '정기 검진, 초음파 상담, 생활권 반복 방문 가능성을 함께 보는 여성검진 검색 가이드입니다.' },
    { href: 'parking-dental.html', title: '주차 가능한 치과 찾기 가이드', region: '전국', department: '주차 가능한 치과', description: '차량 이동, 보호자 동행, 고령자 방문처럼 주차 편의가 중요한 치과 탐색 기준을 정리했습니다.' },
    { href: 'vaccination-clinic.html', title: '예방접종 병원 찾기 가이드', region: '전국', department: '예방접종 병원', description: '정기 접종, 추가 접종, 보호자 상담처럼 예방접종 검색에서 자주 필요한 기준을 정리했습니다.' },
    { href: 'new-openings.html', title: '신규 개원 병원 찾기 가이드', region: '전국', department: '신규 개원', description: '최근 개원 병원을 찾을 때 생활권, 진료과, 운영 정보까지 함께 보는 흐름을 정리했습니다.' },
    { href: 'saturday-clinic.html', title: '토요일 진료 병원 찾기 가이드', region: '전국', department: '토요일 진료', description: '주말 외래에서 접수 마감, 생활권, 자주 찾는 진료과 기준으로 병원을 찾는 흐름을 정리했습니다.' },
    { href: 'night-clinic.html', title: '야간 진료 병원 찾기 가이드', region: '전국', department: '야간 진료', description: '퇴근 후 병원 검색에서 중요한 마지막 접수 시간과 실제 진료 범위를 정리한 랜딩입니다.' },
    { href: 'sunday-clinic.html', title: '일요일 진료 병원 찾기 가이드', region: '전국', department: '일요일 진료', description: '휴일 외래에서 자주 찾는 진료과와 빠르게 좁히는 기준을 정리한 설명형 랜딩입니다.' },
    { href: 'seoul-dental.html', title: '서울 치과 병원찾기', region: '서울', department: '치과', description: '임플란트, 교정, 보철 기준으로 서울 치과 탐색 흐름을 정리했습니다.' },
    { href: 'seoul-ophthalmology.html', title: '서울 안과 병원찾기', region: '서울', department: '안과', description: '시력검사와 백내장 상담 기준으로 서울 안과 비교 흐름을 묶었습니다.' },
    { href: 'seoul-internal.html', title: '서울 내과 병원찾기', region: '서울', department: '내과', description: '건강검진 상담, 소화기 증상, 만성질환 추적 기준으로 서울 내과를 정리했습니다.' },
    { href: 'seoul-obgyn.html', title: '서울 산부인과 병원찾기', region: '서울', department: '산부인과', description: '여성검진, 자궁경부검사, 초음파 상담, 부정출혈 체크 기준으로 서울 산부인과 흐름을 정리했습니다.' },
    { href: 'seoul-psychiatry.html', title: '서울 정신건강의학과 병원찾기', region: '서울', department: '정신건강의학과', description: '우울, 불안, 수면 문제, 공황, 초진 상담 준비 기준으로 서울 정신건강의학과 흐름을 정리했습니다.' },
    { href: 'seoul-urology.html', title: '서울 비뇨의학과 병원찾기', region: '서울', department: '비뇨의학과', description: '요로결석, 배뇨장애, 전립선 상담, 여성 요실금 기준으로 서울 비뇨의학과 흐름을 정리했습니다.' },
    { href: 'seoul-dermatology.html', title: '서울 피부과 병원찾기', region: '서울', department: '피부과', description: '여드름, 흉터, 색소, 피부염, 시술 상담 기준으로 서울 피부과 흐름을 정리했습니다.' },
    { href: 'seoul-pediatric.html', title: '서울 소아청소년과 병원찾기', region: '서울', department: '소아과', description: '발열, 기침, 비염, 예방접종, 주말 진료 기준으로 서울 소아청소년과 흐름을 정리했습니다.' },
    { href: 'seoul-ent.html', title: '서울 이비인후과 병원찾기', region: '서울', department: '이비인후과', description: '비염, 기침, 목 통증, 귀 증상, 야간 진료 기준으로 서울 이비인후과 흐름을 정리했습니다.' },
    { href: 'seoul-orthopedic.html', title: '서울 정형외과 병원찾기', region: '서울', department: '정형외과', description: '허리, 무릎, 어깨 통증과 도수치료 상담 기준으로 서울 정형외과를 비교합니다.' },
    { href: 'seoul-pain.html', title: '서울 통증의학과 병원찾기', region: '서울', department: '통증의학과', description: '허리, 목, 어깨 통증과 주사치료, 재활 연계 기준으로 서울 통증의학과를 비교합니다.' },
    { href: 'seoul-rehab.html', title: '서울 재활의학과 병원찾기', region: '서울', department: '재활의학과', description: '도수치료, 운동치료, 회복 외래와 통증 재활 기준으로 서울 재활의학과를 비교합니다.' },
    { href: 'gyeonggi-orthopedic.html', title: '경기 정형외과 병원찾기', region: '경기', department: '정형외과', description: '허리, 무릎, 관절 통증 외래 기준으로 경기 정형외과를 비교합니다.' },
    { href: 'gyeonggi-dental.html', title: '경기 치과 병원찾기', region: '경기', department: '치과', description: '임플란트, 교정, 보철과 주말 외래 기준으로 경기 치과를 비교합니다.' },
    { href: 'busan-ophthalmology.html', title: '부산 안과 병원찾기', region: '부산', department: '안과', description: '시력검사와 안과 상담 기준으로 부산 지역 외래 탐색을 정리했습니다.' },
    { href: 'busan-dental.html', title: '부산 치과 병원찾기', region: '부산', department: '치과', description: '부산권 치과를 임플란트, 보철, 일반 진료 기준으로 비교합니다.' },
    { href: 'daejeon-internal.html', title: '대전 내과 병원찾기', region: '대전', department: '내과', description: '검사 준비와 만성질환 추적 기준으로 대전 내과를 비교합니다.' },
    { href: 'daejeon-ent.html', title: '대전 이비인후과 병원찾기', region: '대전', department: '이비인후과', description: '비염, 목 통증, 귀 증상 중심으로 대전 이비인후과를 정리했습니다.' },
    { href: 'incheon-pediatric.html', title: '인천 소아과 병원찾기', region: '인천', department: '소아과', description: '발열, 기침, 예방접종 기준으로 인천 소아과 탐색을 정리했습니다.' },
    { href: 'incheon-ophthalmology.html', title: '인천 안과 병원찾기', region: '인천', department: '안과', description: '시력검사, 백내장 상담, 안구건조 외래 기준으로 인천 안과를 비교합니다.' },
    { href: 'daegu-ent.html', title: '대구 이비인후과 병원찾기', region: '대구', department: '이비인후과', description: '비염과 목 통증, 귀 증상 기준으로 대구 이비인후과 탐색을 정리했습니다.' },
  ];

  const currentPage = window.location.pathname.split('/').pop() || '';
  const current = LANDING_PAGES.find((item) => item.href === currentPage);
  const noteSection = document.querySelector('.landing-note');

  if (!current || !noteSection || noteSection.dataset.relatedLandingMounted === 'true') {
    return;
  }

  const picked = new Set([current.href]);
  const recommendations = [];

  const appendMatches = (predicate) => {
    LANDING_PAGES.forEach((item) => {
      if (picked.has(item.href) || !predicate(item)) {
        return;
      }

      picked.add(item.href);
      recommendations.push(item);
    });
  };

  appendMatches((item) => item.region === current.region && item.department !== current.department);
  appendMatches((item) => item.department === current.department && item.region !== current.region);
  appendMatches((item) => item.region !== current.region);

  const items = recommendations.slice(0, 3);
  if (!items.length) {
    return;
  }

  const section = document.createElement('section');
  section.className = 'landing-related-auto';
  section.style.marginTop = '28px';
  section.innerHTML = `
    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:16px;">
      <div>
        <h3 style="margin:0 0 8px;">추천 랜딩 더보기</h3>
        <p style="margin:0; color:var(--text-body); line-height:1.7;">같은 지역 또는 같은 진료과 기준으로 이어서 보기 좋은 페이지를 묶었습니다.</p>
      </div>
    </div>
    <div class="landing-link-grid">
      ${items.map((item) => `
        <a href="${item.href}" class="landing-link">
          <span class="landing-badge">${item.region} ${item.department}</span>
          <strong>${item.title}</strong>
          <span>${item.description}</span>
        </a>
      `).join('')}
    </div>
  `;

  noteSection.dataset.relatedLandingMounted = 'true';
  noteSection.insertAdjacentElement('beforebegin', section);
})();
