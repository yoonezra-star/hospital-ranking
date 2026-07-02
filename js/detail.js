(() => {
  const SITE_ORIGIN = 'https://hospital-ranking.kr';
  const NAVER_MAP_DEFAULT_KEYS = ['390058kho4', 'rgd9ajy97r'];
  const NAVER_MAP_STORAGE_KEY = 'NAVER_MAP_KEY';

  const GUIDE_LINKS = {
    dental: [
      { href: 'guide-implant.html', title: '임플란트 가이드', description: '치과 선택 전에 확인할 항목을 정리했습니다.' },
      { href: 'parking-dental.html', title: '주차 가능한 치과', description: '차량 방문이 편한 치과 탐색 페이지입니다.' },
    ],
    internal: [
      { href: 'guide-endoscopy.html', title: '내시경 가이드', description: '검사 전 준비사항과 병원 선택 기준입니다.' },
      { href: 'vaccination-clinic.html', title: '예방접종 병원', description: '생활권 기준으로 찾기 쉬운 페이지입니다.' },
    ],
    pediatric: [
      { href: 'sunday-pediatric.html', title: '일요일 소아과', description: '주말 진료가 필요한 상황을 대비한 안내입니다.' },
      { href: 'guide-rhinitis.html', title: '소아 비염 가이드', description: '호흡기 증상 관련 기본 체크리스트입니다.' },
    ],
    ophthalmology: [
      { href: 'lasik-clinic.html', title: '라식/라섹 안내', description: '시력교정 병원 비교에 필요한 기준을 정리했습니다.' },
      { href: 'cataract-clinic.html', title: '백내장 병원', description: '진료 정보와 방문 포인트를 함께 볼 수 있습니다.' },
    ],
    orthopedic: [
      { href: 'guide-ortho.html', title: '정형외과 가이드', description: '통증, 영상검사, 치료 흐름을 먼저 확인하세요.' },
      { href: 'manual-therapy-clinic.html', title: '도수치료 병원', description: '도수치료 관련 병원 탐색 페이지입니다.' },
    ],
    ent: [
      { href: 'guide-rhinitis.html', title: '비염 가이드', description: '이비인후과 방문 전에 확인할 내용을 정리했습니다.' },
      { href: 'night-clinic.html', title: '야간 진료 병원', description: '퇴근 후 방문 가능한 병원을 찾을 수 있습니다.' },
    ],
    dermatology: [
      { href: 'night-dermatology.html', title: '야간 피부과', description: '야간 운영 피부과를 모아본 안내입니다.' },
      { href: 'guide-acne.html', title: '피부과 가이드', description: '증상별로 비교할 포인트를 확인하세요.' },
    ],
    obgyn: [
      { href: 'womens-checkup-clinic.html', title: '여성검진 병원', description: '검진 중심으로 병원을 살펴볼 수 있습니다.' },
      { href: 'new-openings.html', title: '신규 개원 병원', description: '최근 개원 병원을 따로 볼 수 있습니다.' },
    ],
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetailPage);
  } else {
    initDetailPage();
  }

  async function initDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const hospitalId = params.get('id') || params.get('postid');

    if (!hospitalId) {
      setText('detail-name', '병원 정보를 찾을 수 없습니다.');
      setText('detail-type', '상세 링크를 다시 확인해 주세요.');
      return;
    }

    normalizeDetailUrl(hospitalId);

    try {
      const hospital = await resolveHospital(hospitalId);
      if (!hospital) {
        setText('detail-name', '병원 정보를 찾을 수 없습니다.');
        setText('detail-type', '목록에서 다시 선택해 주세요.');
        return;
      }

      const normalizedHospital = normalizeHospitalRecord(hospital);
      window.currentHospitalDetail = normalizedHospital;

      renderHospital(normalizedHospital);
      await enrichHospital(normalizedHospital);
    } catch (error) {
      console.error('[detail] failed to initialize:', error);
      setText('detail-name', '상세 정보를 불러오지 못했습니다.');
      setText('detail-type', '잠시 후 다시 확인해 주세요.');
    }
  }

  function normalizeDetailUrl(hospitalId) {
    const expected = `detail.html?id=${encodeURIComponent(hospitalId)}`;
    const current = `${window.location.pathname.split('/').pop() || 'detail.html'}${window.location.search || ''}`;
    if (current !== expected) {
      window.history.replaceState({}, '', expected);
    }
  }

  async function resolveHospital(id) {
    const hospitalList = getHospitalList();
    if (Array.isArray(hospitalList)) {
      const localMatch = hospitalList.find((item) => String(item.id) === String(id));
      if (localMatch) {
        return localMatch;
      }
    }

    const api = getHospitalApi();
    if (api?.fetchHospitals) {
      try {
        const response = await api.fetchHospitals({ ykiho: id, limit: 1 });
        return response?.hospitals?.[0] || null;
      } catch (error) {
        console.warn('[detail] API lookup skipped:', error);
      }
    }

    return null;
  }

  function normalizeHospitalRecord(hospital) {
    const hours = normalizeHours(hospital.hours);
    const specialistCount = toNumber(hospital.specialistCount);
    const reviewCount = toNumber(hospital.reviewCount);
    const score = Number.isFinite(Number(hospital.score)) ? Number(hospital.score) : estimateScore(hospital);

    return {
      ...hospital,
      id: hospital.id,
      name: hospital.name || '병원 정보',
      type: hospital.type || '의료기관',
      address: hospital.address || '',
      phone: hospital.phone || '',
      region: hospital.region || '',
      district: hospital.district || '',
      town: hospital.town || '',
      department: hospital.department || hospital.type || '진료 정보 확인 필요',
      departmentId: hospital.departmentId || '',
      lat: Number(hospital.lat) || 0,
      lng: Number(hospital.lng) || 0,
      score,
      reviewCount: reviewCount > 0 ? reviewCount : estimateReviewCount(hospital),
      specialistCount,
      openDate: hospital.openDate || '',
      url: hospital.url || '',
      hours,
      saturdayOpen: typeof hospital.saturdayOpen === 'boolean' ? hospital.saturdayOpen : Boolean(hours.sat),
      sundayOpen: typeof hospital.sundayOpen === 'boolean' ? hospital.sundayOpen : Boolean(hours.sun),
      nightOpen: typeof hospital.nightOpen === 'boolean' ? hospital.nightOpen : hasNightHours(hours),
      hasEmergency: Boolean(hospital.hasEmergency),
      parkingCapacity: toNumber(hospital.parkingCapacity),
      parkingFee: hospital.parkingFee || '',
      bedCount: toNumber(hospital.bedCount),
      roomCount: toNumber(hospital.roomCount),
      equipment: hospital.equipment || '',
      area: hospital.area || '',
      subway: hospital.subway || '',
      keywords: buildKeywords(hospital),
    };
  }

  async function enrichHospital(hospital) {
    updateSourceSummary(['기본 병원 데이터']);

    if (hospital.id && typeof hospital.id === 'string' && hospital.id.startsWith('JD')) {
      updateSourceSummary(['기본 병원 데이터', '공공 병원 API 연동']);
    }

    renderGuideLinks(hospital);
    renderRelatedSearches(hospital);
    renderNearbyHospitals(hospital);
    renderReviewNotes(hospital);
    renderMap(hospital);
  }

  function renderHospital(hospital) {
    document.title = `${hospital.name} 상세 정보 - 병원찾기`;
    updateMetaDescription(`${hospital.name}의 진료과, 위치, 운영 정보, 방문 전 체크 포인트를 확인할 수 있습니다.`);
    updateCanonical(hospital);
    updateSchema(hospital);

    setText('detail-name', hospital.name);
    setText('detail-type', [hospital.type, buildRegionText(hospital)].filter(Boolean).join(' · ') || '의료기관');
    setText('detail-score', `⭐ ${hospital.score.toFixed(1)}`);
    setText('detail-reviews', formatNumber(hospital.reviewCount));
    setText('detail-department', hospital.department);

    setText('detail-address', hospital.address || '주소 정보 확인 중');
    setText('detail-phone', hospital.phone || '전화번호 확인 중');
    setText('detail-doctor', hospital.specialistCount > 0 ? `전문의 ${hospital.specialistCount}명` : '의료진 정보 확인 중');
    setText('detail-date', formatOpenDate(hospital.openDate));
    setText('detail-region', buildRegionText(hospital) || '지역 정보 확인 중');
    setText('detail-subway', hospital.subway || '');

    const subwayWrapper = document.getElementById('detail-subway-wrapper');
    if (subwayWrapper) {
      subwayWrapper.style.display = hospital.subway ? 'flex' : 'none';
    }

    setHomepageLinks(hospital.url);
    setQuickLinks(hospital);
    renderBadges(hospital);
    renderHours(hospital);
    renderFacility(hospital);
    renderChoiceSummary(hospital);
    renderDecisionChecklist(hospital);
    renderSnapshot(hospital);
    renderVisitGuide(hospital);
    renderSymptomGuide(hospital);
    renderComparePoints(hospital);
    renderPublicDigest(hospital);
    renderDataQuality(hospital);
  }

  function renderBadges(hospital) {
    const badges = [];
    if (hospital.specialistCount > 0) badges.push('전문의');
    if (hospital.saturdayOpen) badges.push('토요일 진료');
    if (hospital.sundayOpen) badges.push('일요일 진료');
    if (hospital.nightOpen) badges.push('야간 진료');
    if (hospital.hasEmergency) badges.push('응급 진료');
    if (hospital.type) badges.push(hospital.type);

    const container = document.getElementById('detail-badges');
    if (!container) return;

    container.innerHTML = badges.map((badge) => (
      `<span style="display:inline-flex; align-items:center; min-height:36px; padding:8px 14px; border-radius:999px; background:rgba(183,110,44,0.12); color:var(--primary-dark); font-weight:700; font-size:0.92rem;">${escapeHtml(badge)}</span>`
    )).join('');
  }

  function renderHours(hospital) {
    const target = document.getElementById('detail-hours');
    if (!target) return;

    const hours = hospital.hours;
    const rows = [
      ['월요일', hours.mon],
      ['화요일', hours.tue],
      ['수요일', hours.wed],
      ['목요일', hours.thu],
      ['금요일', hours.fri],
      ['토요일', hours.sat || '진료 정보 확인 필요'],
      ['일요일', hours.sun || '휴진 또는 확인 필요'],
      ['공휴일', hours.holiday || '휴진 또는 확인 필요'],
    ];

    target.innerHTML = rows.map(([label, value]) => (
      `<li><span class="info-label">${escapeHtml(label)}</span> <span>${escapeHtml(value || '확인 필요')}</span></li>`
    )).join('');

    const noteParts = [];
    if (hospital.saturdayOpen) noteParts.push('토요일 진료');
    if (hospital.sundayOpen) noteParts.push('일요일 진료');
    if (hospital.nightOpen) noteParts.push('야간 진료');

    setText('detail-emergency', hospital.hasEmergency ? '응급 진료 가능 여부 확인 필요' : '응급 진료 정보 확인 중');
    setText('detail-hours-note', noteParts.join(' / ') || '운영 시간은 방문 전 병원에 다시 확인해 주세요.');
    setText('detail-duty-note', '운영 정보는 공개 데이터와 병원 기본 정보를 기준으로 정리했습니다.');
  }

  function renderFacility(hospital) {
    const roomBed = [];
    if (hospital.roomCount > 0) roomBed.push(`입원실 ${hospital.roomCount}개`);
    if (hospital.bedCount > 0) roomBed.push(`병상 ${hospital.bedCount}개`);

    const parking = [];
    if (hospital.parkingCapacity > 0) parking.push(`주차 ${hospital.parkingCapacity}대`);
    if (hospital.parkingFee) parking.push(hospital.parkingFee);

    setText('detail-room-bed', roomBed.join(' / ') || '병상 및 입원실 정보 확인 중');
    setText('detail-area', hospital.area || '면적 정보 확인 중');
    setText('detail-parking', parking.join(' / ') || '주차 안내 확인 중');
    setText('detail-equipment', hospital.equipment || '보유 장비 정보 확인 중');
  }

  function renderChoiceSummary(hospital) {
    const summaryParts = [
      `${hospital.department} 중심으로 비교하기 좋은 병원입니다.`,
      hospital.region ? `${buildRegionText(hospital)} 생활권에서 찾은 의료기관입니다.` : '',
      hospital.specialistCount > 0 ? `전문의 ${hospital.specialistCount}명 기준 정보를 제공합니다.` : '',
    ].filter(Boolean);

    const compareParts = [
      hospital.reviewCount > 0 ? `리뷰 수 ${formatNumber(hospital.reviewCount)}건` : '',
      hospital.nightOpen ? '야간 진료 여부 확인' : '',
      hospital.saturdayOpen ? '토요일 운영 확인' : '',
      hospital.equipment ? `장비: ${firstToken(hospital.equipment)}` : '',
    ].filter(Boolean);

    const flowParts = [
      hospital.phone ? '방문 전 전화로 접수 가능 여부 확인' : '방문 전 운영 시간 확인',
      hospital.address ? '지도와 주소를 함께 확인하고 이동' : '',
    ].filter(Boolean);

    const cautionParts = [
      '실제 진료 가능 시간은 병원에 다시 확인해 주세요.',
      hospital.sundayOpen ? '일요일 진료는 접수 마감 시간이 다를 수 있습니다.' : '',
    ].filter(Boolean);

    setText('detail-choice-summary', summaryParts.join(' / '));
    setText('detail-choice-compare', compareParts.join(' / ') || '운영 조건과 위치를 먼저 비교해 보세요.');
    setText('detail-choice-flow', flowParts.join(' / '));
    setText('detail-choice-caution', cautionParts.join(' / '));
  }

  function renderDecisionChecklist(hospital) {
    const intro = document.getElementById('detail-decision-intro');
    const target = document.getElementById('detail-decision-checklist');
    if (!target) return;

    if (intro) {
      intro.textContent = `${hospital.name} 방문 전에는 운영 여부, 접수 마감, 진료 범위를 한 번 더 확인하는 것이 좋습니다.`;
    }

    const items = [
      {
        title: '진료 가능 여부 확인',
        body: hospital.phone
          ? `전화 문의로 ${hospital.department} 진료 가능 시간과 접수 마감을 확인하세요.`
          : '방문 전 운영 시간과 접수 가능 여부를 먼저 확인하세요.',
      },
      {
        title: '방문 목적 정리',
        body: `${hospital.department} 상담 목적, 증상 발생 시점, 복용 중인 약을 간단히 정리해 두면 접수가 수월합니다.`,
      },
      {
        title: '이동 동선 확인',
        body: hospital.address
          ? `${buildRegionText(hospital) || '해당 지역'} 주소와 네이버 지도 위치를 함께 확인하세요.`
          : '지도 위치와 실제 주소를 함께 확인하세요.',
      },
      {
        title: '편의 정보 확인',
        body: hospital.parkingCapacity > 0
          ? `차량 방문 시 주차 ${hospital.parkingCapacity}대 정보를 참고하되, 실제 가능 여부는 현장 상황을 확인하세요.`
          : '주차, 엘리베이터, 보호자 동행 가능 여부가 필요하면 사전에 확인하세요.',
      },
    ];

    target.innerHTML = items.map((item) => `
      <li>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.body)}</span>
      </li>
    `).join('');
  }

  function renderSnapshot(hospital) {
    setText('detail-snapshot-summary', `${hospital.department} / ${hospital.type} / ${buildRegionText(hospital) || '지역 정보 확인 중'}`);
    setText('detail-snapshot-operation', buildOperationSummary(hospital));
    setText('detail-snapshot-facility', [
      hospital.equipment ? `장비 ${firstToken(hospital.equipment)}` : '',
      hospital.parkingCapacity > 0 ? `주차 ${hospital.parkingCapacity}대` : '',
      hospital.bedCount > 0 ? `병상 ${hospital.bedCount}개` : '',
    ].filter(Boolean).join(' / ') || '시설 정보 확인 중');
    setText('detail-snapshot-visit', hospital.phone ? '전화 문의 후 방문하면 접수 확인이 더 쉽습니다.' : '운영 시간 확인 후 방문해 주세요.');
  }

  function renderVisitGuide(hospital) {
    setText('detail-primary-services', [
      hospital.department,
      hospital.type,
      hospital.equipment ? firstToken(hospital.equipment) : '',
    ].filter(Boolean).join(' / '));

    setText('detail-visit-targets', [
      `${hospital.department} 진료가 필요한 경우`,
      hospital.saturdayOpen ? '토요일 진료가 필요한 경우' : '',
      hospital.nightOpen ? '퇴근 후 방문이 필요한 경우' : '',
    ].filter(Boolean).join(' / '));

    setText('detail-documents', hospital.reviewCount > 0 ? '신분증 / 기존 검사 결과 / 이전 진료 기록' : '신분증 / 필요한 검사 결과');
    setText('detail-reservation', hospital.phone ? '전화 문의로 접수 가능 여부를 먼저 확인해 보세요.' : '방문 전 운영 시간을 먼저 확인해 주세요.');
    setText('detail-transport', hospital.address || '교통 정보 확인 중');
    setText('detail-accessibility', hospital.parkingCapacity > 0 ? `주차 ${hospital.parkingCapacity}대 기준 이동 편의 확인` : '주차 및 접근성 정보 확인 중');
    setText('detail-checklist', [
      '초진 여부 확인',
      '진료 시간 확인',
      hospital.phone ? '전화 문의 가능' : '',
    ].filter(Boolean).join(' / '));
  }

  function renderSymptomGuide(hospital) {
    setText('detail-symptom-focus', `${hospital.department} 관련 증상 기준으로 먼저 검토해 보세요.`);
    setText('detail-intake-tip', hospital.saturdayOpen ? '토요일 운영 시 접수 마감 시간을 꼭 확인해 주세요.' : '당일 접수 가능 여부를 먼저 확인해 주세요.');
    setText('detail-parking-tip', hospital.parkingCapacity > 0 ? `주차 가능 대수 ${hospital.parkingCapacity}대` : '주차 가능 여부는 방문 전 다시 확인해 주세요.');
    setText('detail-visit-flow', '운영 시간 확인 → 주소/지도 확인 → 전화 문의 후 방문 순서가 안전합니다.');
  }

  function renderComparePoints(hospital) {
    const target = document.getElementById('detail-compare-points');
    if (!target) return;

    const items = [
      hospital.specialistCount > 0 ? `전문의 ${hospital.specialistCount}명` : '',
      hospital.saturdayOpen ? '토요일 진료' : '',
      hospital.sundayOpen ? '일요일 진료' : '',
      hospital.nightOpen ? '야간 진료' : '',
      hospital.hasEmergency ? '응급 진료' : '',
      hospital.region || '',
      hospital.department || '',
    ].filter(Boolean);

    target.innerHTML = items.map((item) => (
      `<span style="display:inline-flex; align-items:center; min-height:34px; padding:8px 12px; border-radius:999px; background:var(--bg-body); border:1px solid var(--border-default); color:var(--text-body);">${escapeHtml(item)}</span>`
    )).join('');
  }

  function renderPublicDigest(hospital) {
    setText('detail-match-summary', hospital.id && String(hospital.id).startsWith('JD') ? '공공 병원 API 기준 병원 코드 연결' : '기본 병원 데이터 기준 상세 정보');
    setText('detail-operation-summary', buildOperationSummary(hospital));
    setText('detail-location-summary', hospital.address || '위치 정보 확인 중');
    setText('detail-equipment-summary', hospital.equipment || '장비 및 시설 정보 확인 중');
  }

  function renderDataQuality(hospital) {
    setText('detail-data-updated', `2026-07-02 기준 페이지 구조와 안내 문구를 점검했습니다. 병원 운영 정보는 변동될 수 있습니다.`);
    setText('detail-verification-note', [
      hospital.phone ? '전화번호' : '',
      hospital.address ? '주소' : '',
      hospital.saturdayOpen || hospital.sundayOpen || hospital.nightOpen ? '운영조건' : '',
      hospital.parkingCapacity > 0 || hospital.parkingFee ? '주차정보' : '',
    ].filter(Boolean).join(' / ') || '운영 시간과 위치 정보');
    setText('detail-medical-note', `${hospital.department} 관련 증상, 진단, 치료, 약물 결정은 이 페이지가 아니라 해당 병원 또는 의료진과 직접 상담해 주세요.`);
  }

  function renderGuideLinks(hospital) {
    const container = document.getElementById('detail-guide-links');
    if (!container) return;

    const items = GUIDE_LINKS[hospital.departmentId] || GUIDE_LINKS[hospital.type?.toLowerCase?.()] || [
      { href: 'guide.html', title: '건강 가이드', description: '관련 건강 가이드를 모아볼 수 있습니다.' },
      { href: 'new-openings.html', title: '신규 개원 병원', description: '최근 개원 병원을 따로 볼 수 있습니다.' },
    ];

    container.innerHTML = items.map((item) => (
      `<a href="${escapeHtml(item.href)}" style="display:flex; flex-direction:column; gap:8px; padding:18px; border:1px solid var(--border-default); border-radius:14px; text-decoration:none; color:inherit; background:var(--bg-body);">
        <strong style="font-size:1rem;">${escapeHtml(item.title)}</strong>
        <span style="color:var(--text-body); line-height:1.6;">${escapeHtml(item.description)}</span>
      </a>`
    )).join('');
  }

  function renderRelatedSearches(hospital) {
    const container = document.getElementById('detail-related-searches');
    if (!container) return;

    const queries = [
      `${hospital.region || '지역'} ${hospital.department}`,
      `${hospital.name} 전화번호`,
      `${hospital.name} 운영시간`,
      hospital.saturdayOpen ? `${hospital.region || '지역'} 토요일 ${hospital.department}` : '',
      hospital.nightOpen ? `${hospital.region || '지역'} 야간 ${hospital.department}` : '',
    ].filter(Boolean);

    container.innerHTML = queries.map((query) => (
      `<a href="index.html?keyword=${encodeURIComponent(query)}#search-results" style="display:flex; flex-direction:column; gap:8px; padding:18px; border:1px solid var(--border-default); border-radius:14px; text-decoration:none; color:inherit; background:var(--bg-body);">
        <strong style="font-size:1rem;">${escapeHtml(query)}</strong>
        <span style="color:var(--text-body); line-height:1.6;">이 조건으로 목록 검색하기</span>
      </a>`
    )).join('');
  }

  function renderReviewNotes(hospital) {
    const container = document.getElementById('detail-review-list');
    if (!container) return;

    const notes = [
      {
        title: '운영 정보 요약',
        body: buildOperationSummary(hospital) || '운영 정보 확인 중입니다.',
      },
      {
        title: '방문 전 확인',
        body: hospital.phone
          ? '전화 문의로 접수 가능 여부와 운영 시간을 먼저 확인해 주세요.'
          : '운영 시간과 위치를 먼저 확인한 뒤 방문해 주세요.',
      },
      {
        title: '교통 및 위치',
        body: hospital.address || '주소 정보 확인 중입니다.',
      },
    ];

    container.innerHTML = notes.map((note) => (
      `<article style="padding:18px; border:1px solid var(--border-default); border-radius:14px; background:var(--bg-body);">
        <h4 style="margin:0 0 10px; color:var(--text-heading);">${escapeHtml(note.title)}</h4>
        <p style="margin:0; color:var(--text-body); line-height:1.7;">${escapeHtml(note.body)}</p>
      </article>`
    )).join('');
  }

  function renderNearbyHospitals(hospital) {
    const container = document.getElementById('detail-nearby-list');
    if (!container) return;

    const hospitalList = getHospitalList();
    if (!Array.isArray(hospitalList) || hospitalList.length === 0) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">비슷한 병원 정보를 준비 중입니다.</p>';
      return;
    }

    const items = hospitalList
      .filter((item) => String(item.id) !== String(hospital.id))
      .filter((item) => {
        if (hospital.district && item.district === hospital.district) return true;
        if (hospital.region && hospital.departmentId && item.region === hospital.region && item.departmentId === hospital.departmentId) return true;
        return false;
      })
      .slice(0, 6);

    if (items.length === 0) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">근처 병원 정보를 준비 중입니다.</p>';
      return;
    }

    container.innerHTML = items.map((item) => (
      `<a href="detail.html?id=${encodeURIComponent(item.id)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem;">${escapeHtml(item.name || '병원 정보')}</strong>
        <span style="color:var(--text-body);">${escapeHtml(item.type || '의료기관')}</span>
        <span style="color:var(--text-body); line-height:1.6;">${escapeHtml(item.address || '주소 정보 확인 중')}</span>
      </a>`
    )).join('');
  }

  async function renderMap(hospital) {
    const container = document.getElementById('map-container');
    if (!container) return;

    if (!(hospital.lat > 0 && hospital.lng > 0)) {
      renderMapFallback(hospital, '좌표 정보가 없어 네이버 지도 링크로 안내합니다.');
      return;
    }

    try {
      const mapKey = getMapKeyCandidates()[0];
      if (!mapKey) {
        renderMapFallback(hospital, '지도 키를 확인할 수 없어 링크로 안내합니다.');
        return;
      }

      await loadNaverMapSdk(mapKey);
      const position = new naver.maps.LatLng(hospital.lat, hospital.lng);
      container.innerHTML = '';

      const map = new naver.maps.Map(container, {
        center: position,
        zoom: 15,
      });

      new naver.maps.Marker({
        position,
        map,
        title: hospital.name,
      });
    } catch (error) {
      console.warn('[detail] map fallback:', error);
      renderMapFallback(hospital, '지도 인증 또는 로딩 문제로 링크 안내로 전환했습니다.');
    }
  }

  function renderMapFallback(hospital, message) {
    const container = document.getElementById('map-container');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px; justify-content:center; align-items:flex-start; height:100%; min-height:340px; padding:24px;">
        <strong style="font-size:1.1rem; color:var(--text-heading);">${escapeHtml(hospital.name || '병원 지도')}</strong>
        <p style="margin:0; color:var(--text-body); line-height:1.7;">${escapeHtml(message || '네이버 지도에서 위치를 확인할 수 있습니다.')}</p>
        <p style="margin:0; color:var(--text-muted); line-height:1.7;">${escapeHtml(hospital.address || '')}</p>
        <a href="https://map.naver.com/v5/search/${encodeURIComponent(hospital.name || hospital.address || '병원')}" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 16px; border-radius:8px; background:var(--primary); color:#fff; text-decoration:none; font-weight:700;">네이버 지도에서 보기</a>
      </div>
    `;
  }

  function setHomepageLinks(url) {
    const row = document.getElementById('detail-homepage-row');
    const link = document.getElementById('detail-homepage-link');
    const button = document.getElementById('detail-homepage-button');
    if (!row || !link || !button) return;

    if (!url) {
      row.style.display = 'none';
      button.style.display = 'none';
      link.removeAttribute('href');
      button.removeAttribute('href');
      return;
    }

    row.style.display = 'flex';
    link.href = url;
    button.href = url;
    button.style.display = 'inline-flex';
  }

  function setQuickLinks(hospital) {
    setAnchorHref('detail-call-link', hospital.phone ? `tel:${String(hospital.phone).replace(/\s+/g, '')}` : '#');
    setAnchorHref('detail-map-link', `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name || hospital.address || '병원')}`);
    setAnchorHref('detail-search-link', `https://search.naver.com/search.naver?query=${encodeURIComponent(`${hospital.name} 운영시간`)}`);

    const hint = document.getElementById('detail-correction-hint');
    if (hint) {
      hint.textContent = `${hospital.name}의 운영시간, 전화번호, 위치 정보가 실제와 다르면 수정 요청을 보내주시면 검토 후 반영합니다.`;
    }
  }

  function setAnchorHref(id, href) {
    const node = document.getElementById(id);
    if (!node) return;
    node.href = href;
  }

  function updateSchema(hospital) {
    const node = document.getElementById('schema-hospital');
    if (!node) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'MedicalOrganization',
      name: hospital.name,
      address: hospital.address,
      telephone: hospital.phone || undefined,
      url: buildCanonicalDetailUrl(hospital.id),
    };

    if (hospital.score > 0 && hospital.reviewCount > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: hospital.score.toFixed(1),
        reviewCount: hospital.reviewCount,
      };
    }

    node.textContent = JSON.stringify(schema);
  }

  function updateMetaDescription(content) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', content);
    }
  }

  function updateCanonical(hospital) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = buildCanonicalDetailUrl(hospital.id);
  }

  function buildCanonicalDetailUrl(id) {
    return `${SITE_ORIGIN}/detail?id=${encodeURIComponent(id)}`;
  }

  function updateSourceSummary(items) {
    const target = document.getElementById('detail-source-summary');
    if (!target) return;
    const uniqueItems = Array.from(new Set((items || []).filter(Boolean)));
    target.textContent = uniqueItems.length > 0 ? uniqueItems.join(' / ') : '데이터 출처 확인 중';
  }

  function getHospitalList() {
    return Array.isArray(window.HOSPITALS) ? window.HOSPITALS : [];
  }

  function getHospitalApi() {
    return typeof window.HospitalAPI === 'object' ? window.HospitalAPI : null;
  }

  function normalizeHours(hours) {
    if (!hours || typeof hours !== 'object') {
      return {
        mon: '',
        tue: '',
        wed: '',
        thu: '',
        fri: '',
        sat: '',
        sun: '',
        holiday: '',
      };
    }

    return {
      mon: hours.mon || '',
      tue: hours.tue || '',
      wed: hours.wed || '',
      thu: hours.thu || '',
      fri: hours.fri || '',
      sat: hours.sat || '',
      sun: hours.sun || '',
      holiday: hours.holiday || '',
    };
  }

  function hasNightHours(hours) {
    return [hours.mon, hours.tue, hours.wed, hours.thu, hours.fri, hours.sat]
      .filter(Boolean)
      .some((value) => {
        const match = String(value).match(/(\d{2}):(\d{2})\s*$/);
        if (!match) return false;
        const hour = Number(match[1]);
        return hour >= 19;
      });
  }

  function buildOperationSummary(hospital) {
    const parts = [];
    if (hospital.saturdayOpen) parts.push('토요일 진료');
    if (hospital.sundayOpen) parts.push('일요일 진료');
    if (hospital.nightOpen) parts.push('야간 진료');
    if (hospital.hasEmergency) parts.push('응급 진료 가능');
    return parts.join(' / ') || '운영 정보 확인 중';
  }

  function buildRegionText(hospital) {
    return [hospital.region, hospital.district, hospital.town].filter(Boolean).join(' ');
  }

  function buildKeywords(hospital) {
    return [hospital.region, hospital.district, hospital.town, hospital.department, hospital.type]
      .filter(Boolean)
      .join(' ');
  }

  function formatOpenDate(value) {
    if (!value) return '개원일 정보 확인 중';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    return String(value);
  }

  function estimateScore(hospital) {
    const specialistCount = toNumber(hospital.specialistCount);
    const base = specialistCount > 0 ? 4.2 : 4.0;
    return Math.min(4.9, base);
  }

  function estimateReviewCount(hospital) {
    const specialistCount = toNumber(hospital.specialistCount);
    if (specialistCount > 0) {
      return specialistCount * 18;
    }
    return 12;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('ko-KR');
  }

  function firstToken(value) {
    return String(value || '').split(',')[0].trim();
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) {
      node.textContent = value;
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getMapKeyCandidates() {
    const stored = getStoredMapKey();
    return Array.from(new Set([stored, ...NAVER_MAP_DEFAULT_KEYS].filter(Boolean)));
  }

  function getStoredMapKey() {
    try {
      return localStorage.getItem(NAVER_MAP_STORAGE_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function loadNaverMapSdk(key) {
    return new Promise((resolve, reject) => {
      if (window.naver?.maps) {
        resolve();
        return;
      }

      const callbackName = '__detailNaverMapLoaded';
      const timeout = window.setTimeout(() => {
        delete window[callbackName];
        reject(new Error('NAVER_MAP_TIMEOUT'));
      }, 6000);

      window[callbackName] = () => {
        window.clearTimeout(timeout);
        delete window[callbackName];
        resolve();
      };

      const script = document.createElement('script');
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(key)}&callback=${callbackName}`;
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        delete window[callbackName];
        reject(new Error('NAVER_MAP_AUTH'));
      };
      document.head.appendChild(script);
    });
  }
})();
