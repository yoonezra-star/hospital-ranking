document.addEventListener('DOMContentLoaded', () => {
  const REGION_LIST = [
    { code: '11', name: '서울' },
    { code: '26', name: '부산' },
    { code: '27', name: '대구' },
    { code: '28', name: '인천' },
    { code: '29', name: '광주' },
    { code: '30', name: '대전' },
    { code: '31', name: '울산' },
    { code: '36', name: '세종' },
    { code: '41', name: '경기' },
    { code: '42', name: '강원' },
    { code: '43', name: '충북' },
    { code: '44', name: '충남' },
    { code: '45', name: '전북' },
    { code: '46', name: '전남' },
    { code: '47', name: '경북' },
    { code: '48', name: '경남' },
    { code: '50', name: '제주' },
  ];

  const DEPARTMENTS = [
    { id: 'internal', name: '내과', icon: '🩺', color: '#b76e2c' },
    { id: 'orthopedic', name: '정형외과', icon: '🦴', color: '#68867f' },
    { id: 'ophthalmology', name: '안과', icon: '👁️', color: '#a67c52' },
    { id: 'dermatology', name: '피부과', icon: '✨', color: '#85664b' },
    { id: 'dental', name: '치과', icon: '🦷', color: '#3f5f5a' },
    { id: 'ent', name: '이비인후과', icon: '👂', color: '#7c8f8a' },
    { id: 'pediatric', name: '소아청소년과', icon: '🧒', color: '#d0875b' },
    { id: 'obgyn', name: '산부인과', icon: '🌿', color: '#9f7a53' },
    { id: 'urology', name: '비뇨의학과', icon: '💧', color: '#5b746f' },
    { id: 'psychiatry', name: '정신건강의학과', icon: '🧠', color: '#6e7e8a' },
    { id: 'plastic', name: '성형외과', icon: '💎', color: '#b48f64' },
    { id: 'familymed', name: '가정의학과', icon: '🏠', color: '#5f7a6b' },
    { id: 'pain', name: '통증의학과', icon: '💆', color: '#8f785f' },
    { id: 'korean', name: '한의원/한방병원', icon: '🌱', color: '#55725f' },
    { id: 'rehab', name: '재활의학과', icon: '🏃', color: '#6d8474' },
    { id: 'general', name: '종합병원', icon: '🏥', color: '#4e5f69' },
  ];

  const GUIDE_SPOTLIGHTS = [
    { href: 'saturday-clinic.html', title: '토요일 진료 병원 찾기', description: '토요일 운영 여부와 접수 마감 시간을 함께 보세요.', badge: '운영조건' },
    { href: 'night-clinic.html', title: '야간 진료 병원 찾기', description: '퇴근 후 방문 가능한 병원을 빠르게 좁힐 수 있습니다.', badge: '운영조건' },
    { href: 'sunday-clinic.html', title: '일요일 진료 병원 찾기', description: '휴일 외래 수요가 많은 과를 중심으로 정리했습니다.', badge: '운영조건' },
    { href: 'new-openings.html', title: '신규 개원 병원', description: '최근 개원 병원을 따로 살펴볼 수 있습니다.', badge: '개원정보' },
    { href: 'guide-implant.html', title: '임플란트 가이드', description: '치과 방문 전에 체크할 기준을 정리했습니다.', badge: '건강가이드' },
    { href: 'guide-endoscopy.html', title: '내시경 가이드', description: '검사 전 준비와 상담 포인트를 먼저 확인하세요.', badge: '건강가이드' },
  ];

  const REGION_SPOTLIGHTS = [
    { href: 'seoul-dental.html', title: '서울 치과 병원찾기', description: '서울권 치과를 생활권 기준으로 탐색할 수 있습니다.', badge: '지역탐색' },
    { href: 'seoul-ophthalmology.html', title: '서울 안과 병원찾기', description: '시력교정과 백내장 상담 흐름까지 함께 보기 좋습니다.', badge: '지역탐색' },
    { href: 'seoul-pediatric.html', title: '서울 소아과 병원찾기', description: '보호자 수요가 많은 소아과를 빠르게 비교할 수 있습니다.', badge: '지역탐색' },
    { href: 'gyeonggi-dental.html', title: '경기 치과 병원찾기', description: '경기권 치과를 생활권 중심으로 찾을 수 있습니다.', badge: '지역탐색' },
    { href: 'busan-ophthalmology.html', title: '부산 안과 병원찾기', description: '부산 지역 안과 비교용 랜딩 페이지입니다.', badge: '지역탐색' },
    { href: 'daejeon-internal.html', title: '대전 내과 병원찾기', description: '대전권 내과를 진료 목적 기준으로 확인할 수 있습니다.', badge: '지역탐색' },
  ];

  const SEARCH_TOKEN_ALIASES = {
    토요: ['토요', '토요진료', '토요일', '주말진료'],
    토요일: ['토요일', '토요', '토요진료', '주말진료'],
    야간: ['야간', '야간진료', '저녁', '저녁진료'],
    일요: ['일요', '일요진료', '일요일', '휴일진료'],
    일요일: ['일요일', '일요', '일요진료', '휴일진료'],
    주차: ['주차', '주차가능', '주차장'],
    응급: ['응급', '응급실', '응급진료'],
    소아과: ['소아과', '소아청소년과'],
    한방: ['한방', '한의원', '한방병원'],
    의원: ['의원', '클리닉'],
  };

  const state = {
    hospitals: [],
    filteredHospitals: [],
    visibleCount: 12,
    keyword: '',
    departmentId: 'all',
    regionCode: 'all',
    district: 'all',
    town: 'all',
    type: 'all',
    sort: 'score',
    specialFilter: '',
    searchActive: false,
  };

  const searchSuggestionState = {
    items: [],
    activeIndex: -1,
  };

  const NON_EDITORIAL_HOSPITAL_IDS = new Set(['101']);
  const SEARCH_GENERIC_TOKENS = new Set([
    '\uBCD1\uC6D0',
    '\uBCD1\uC758\uC6D0',
    '\uC758\uC6D0',
    '\uD074\uB9AC\uB2C9',
    '\uC9C4\uB8CC',
    '\uAC80\uC0C9',
    '\uCD94\uCC9C',
    '\uCC3E\uAE30',
    '\uADFC\uCC98',
    '\uAC00\uAE4C\uC6B4',
  ]);
  const SUPPLEMENTAL_SEARCH_TOKEN_ALIASES = {
    '\uC18C\uC544\uACFC': ['\uC18C\uC544\uACFC', '\uC18C\uC544\uCCAD\uC18C\uB144\uACFC', '\uC18C\uC544\uCCAD\uC18C\uB144'],
    '\uC18C\uC544': ['\uC18C\uC544', '\uC18C\uC544\uACFC', '\uC18C\uC544\uCCAD\uC18C\uB144\uACFC'],
    '\uC774\uBE44\uC778\uD6C4': ['\uC774\uBE44\uC778\uD6C4', '\uC774\uBE44\uC778\uD6C4\uACFC', '\uC774\uBE44\uC778\uD6C4\uACFC\uC758\uC6D0'],
    '\uC815\uD615': ['\uC815\uD615', '\uC815\uD615\uC678\uACFC'],
    '\uD53C\uBD80': ['\uD53C\uBD80', '\uD53C\uBD80\uACFC'],
    '\uCE58\uACFC': ['\uCE58\uACFC', '\uCE58\uACFC\uC758\uC6D0', '\uCE58\uACFC\uBCD1\uC6D0'],
    '\uB0B4\uACFC': ['\uB0B4\uACFC', '\uB0B4\uACFC\uC758\uC6D0'],
    '\uD55C\uC758\uC6D0': ['\uD55C\uC758\uC6D0', '\uD55C\uBC29', '\uD55C\uBC29\uB0B4\uACFC'],
    '\uD55C\uBC29': ['\uD55C\uBC29', '\uD55C\uC758\uC6D0', '\uD55C\uBC29\uB0B4\uACFC'],
  };
  const KEYWORD_OPERATION_PATTERNS = [
    { label: '\uD1A0\uC694\uC77C \uC9C4\uB8CC', tokens: ['\uD1A0\uC694', '\uD1A0\uC694\uC77C', '\uD1A0\uC694\uC9C4\uB8CC', '\uC8FC\uB9D0'] },
    { label: '\uC57C\uAC04 \uC9C4\uB8CC', tokens: ['\uC57C\uAC04', '\uC57C\uAC04\uC9C4\uB8CC', '\uB2A6\uAC8C', '\uC800\uB141'] },
    { label: '\uC77C\uC694\uC77C \uC9C4\uB8CC', tokens: ['\uC77C\uC694', '\uC77C\uC694\uC77C', '\uC77C\uC694\uC9C4\uB8CC', '\uD734\uC77C'] },
    { label: '\uC8FC\uCC28 \uAC00\uB2A5', tokens: ['\uC8FC\uCC28', '\uC8FC\uCC28\uAC00\uB2A5'] },
  ];

  const $ = (selector) => document.querySelector(selector);
  const ui = {
    header: $('#header'),
    navLinks: $('#nav-links'),
    mobileMenuBtn: $('#mobile-menu-btn'),
    themeToggle: $('#theme-toggle'),
    heroSearch: $('#hero-search'),
    searchSuggestions: $('#search-suggestions'),
    searchBtn: $('#search-btn'),
    clearSearchBtn: $('#clear-search'),
    searchResults: $('#search-results'),
    searchQueryDisplay: $('#search-query-display'),
    searchIntentSummary: $('#search-intent-summary'),
    searchResultCount: $('#search-result-count'),
    searchResultsList: $('#search-results-list'),
    searchRefineBar: $('#search-refine-bar'),
    departmentGrid: $('#department-grid'),
    regionFilter: $('#region-filter'),
    districtFilter: $('#district-filter'),
    townFilter: $('#town-filter'),
    typeFilter: $('#type-filter'),
    sortFilter: $('#sort-filter'),
    heroRegionFilter: $('#hero-region-filter'),
    heroDistrictFilter: $('#hero-district-filter'),
    heroTownFilter: $('#hero-town-filter'),
    heroLocationApply: $('#hero-location-apply'),
    rankingCount: $('#ranking-count'),
    rankingList: $('#ranking-list'),
    rankingLoader: $('#ranking-loader'),
    loadMoreBtn: $('#load-more-btn'),
    reviewsList: $('#reviews-list'),
    newHospitalsList: $('#new-hospitals-list'),
    currentOpenList: $('#current-open-list'),
    saturdayOpenList: $('#saturday-open-list'),
    nightOpenList: $('#night-open-list'),
    recentOpenList: $('#recent-open-list'),
    regionSpotlightList: $('#region-spotlight-list'),
    guideSpotlightList: $('#guide-spotlight-list'),
    dataSourceBadge: $('#data-source-badge'),
    dataSourceNote: $('#data-source-note'),
  };

  function init() {
    applyStaticCopy();
    state.hospitals = loadHospitals();
    initTheme();
    initHeader();
    populateFilters();
    renderDepartmentGrid();
    renderSpotlights();
    bindEvents();
    applyUrlState();
    refreshPage();
    hideSearchSuggestions();
  }

  function applyStaticCopy() {
    document.title = '병원찾기 - 지역별 병원 검색과 진료 정보';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', '지역명과 진료과, 토요일·야간·일요일 운영 조건으로 병원을 찾을 수 있는 병원검색 서비스입니다.');
    }

    const logoText = document.querySelector('.logo .gradient-text');
    if (logoText) logoText.textContent = '병원찾기';

    const navItems = document.querySelectorAll('#nav-links a');
    if (navItems[0]) navItems[0].textContent = '진료과';
    if (navItems[1]) navItems[1].textContent = '병원목록';
    if (navItems[2]) navItems[2].textContent = '후기';
    if (navItems[3]) navItems[3].textContent = '건강 가이드';
    if (navItems[4]) navItems[4].textContent = '지도';

    const heroTitle = document.querySelector('#hero h1');
    if (heroTitle) {
      heroTitle.innerHTML = '지역별 병원 검색<br><span class="gradient-text">사용자 중심 병원찾기</span>';
    }
    const heroSubtitle = document.querySelector('#hero .subtitle');
    if (heroSubtitle) {
      heroSubtitle.textContent = '지역명, 병원명, 진료과, 운영 조건을 함께 입력해 필요한 병원을 빠르게 찾을 수 있습니다.';
    }
    if (ui.heroSearch) {
      ui.heroSearch.placeholder = '예: 서울 치과, 강남 피부과 야간, 송파 소아과 일요일';
    }
    if (ui.searchBtn) ui.searchBtn.textContent = '검색';
    if (ui.clearSearchBtn) ui.clearSearchBtn.textContent = '검색 초기화';

    const helperText = document.querySelector('.search-helper-text');
    if (helperText) {
      helperText.textContent = '지역, 진료과, 운영 조건을 함께 입력하면 더 빠르게 결과를 좁힐 수 있습니다.';
    }

    const statLabels = document.querySelectorAll('.hero-stats .stat-label');
    if (statLabels[0]) statLabels[0].textContent = '등록 병원';
    if (statLabels[1]) statLabels[1].textContent = '광역시도';
    if (statLabels[2]) statLabels[2].textContent = '주요 진료과';

    setTextContent('#search-results .search-results-header h2', '검색 결과');
    setInnerHtml('#search-results .search-results-header h2', '검색 결과: <span id="search-query-display"></span>');

    const quickButtons = document.querySelectorAll('.quick-filter-btn');
    if (quickButtons[0]) quickButtons[0].textContent = '🏢 토요 진료';
    if (quickButtons[1]) quickButtons[1].textContent = '🌙 야간 진료';
    if (quickButtons[2]) quickButtons[2].textContent = '☀️ 일요 진료';
    if (quickButtons[3]) quickButtons[3].textContent = '🆕 신규 개원';

    setSectionCopy('quick-access', '빠른 찾기', '지금 바로 많이 찾는 운영 조건별 병원을 빠르게 살펴볼 수 있습니다.');
    setSectionCopy('ranking', '병원 목록', '지역과 운영 조건, 후기와 전문의 수 등을 기준으로 병원을 탐색할 수 있습니다.');
    setSectionCopy('reviews', '많이 본 병원', '후기 수와 관심도가 높은 병원을 중심으로 먼저 확인해 보세요.');
    setSectionCopy('new-hospitals', '최근 개원 병원', '최신 개원 병원을 날짜순으로 살펴볼 수 있습니다.');
    setSectionCopy('map-section', '지도에서 보기', '현재 목록의 병원을 지도에서 함께 확인할 수 있습니다.');

    const quickHeads = document.querySelectorAll('.quick-access-head h3');
    if (quickHeads[0]) quickHeads[0].textContent = '현재 보기 좋은 병원';
    if (quickHeads[1]) quickHeads[1].textContent = '토요일 진료 병원';
    if (quickHeads[2]) quickHeads[2].textContent = '야간 진료 병원';
    if (quickHeads[3]) quickHeads[3].textContent = '신규 개원 병원';

    const quickSubs = document.querySelectorAll('.quick-access-head span');
    if (quickSubs[0]) quickSubs[0].textContent = '지금 확인';
    if (quickSubs[1]) quickSubs[1].textContent = '주말 방문';
    if (quickSubs[2]) quickSubs[2].textContent = '퇴근 후';
    if (quickSubs[3]) quickSubs[3].textContent = '최신 정보';

    if (ui.dataSourceBadge) ui.dataSourceBadge.textContent = '기본 병원 데이터';
    if (ui.dataSourceNote) ui.dataSourceNote.textContent = '기본 병원 데이터와 공개 가능한 정보를 바탕으로 검색 결과를 구성합니다.';
  }

  function setSectionCopy(sectionId, title, description) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const heading = section.querySelector('.section-header h2');
    const desc = section.querySelector('.section-header .section-desc');
    if (heading) heading.textContent = title;
    if (desc) desc.textContent = description;
  }

  function setTextContent(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function setInnerHtml(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = value;
  }

  function createSearchSuggestion(value, prefix, score = 0) {
    return { value, prefix, score };
  }

  function pushSearchSuggestion(collection, seenValues, value, prefix, score = 0) {
    const trimmedValue = String(value || '').trim();
    if (!trimmedValue) return;

    const dedupeKey = normalizeSearchText(trimmedValue);
    if (!dedupeKey || seenValues.has(dedupeKey)) return;

    seenValues.add(dedupeKey);
    collection.push(createSearchSuggestion(trimmedValue, prefix, score));
  }

  function buildDefaultSearchSuggestions() {
    const shortcutValues = Array.from(document.querySelectorAll('[data-search-example]'))
      .map((button) => button.dataset.searchExample || '')
      .filter(Boolean);

    return shortcutValues.slice(0, 8).map((value, index) => (
      createSearchSuggestion(value, '\uBC14\uB85C \uAC80\uC0C9', 100 - index)
    ));
  }

  function buildSearchSuggestions(query) {
    const trimmedQuery = String(query || '').trim();
    if (!trimmedQuery) {
      return buildDefaultSearchSuggestions();
    }

    const normalizedQuery = normalizeSearchText(trimmedQuery);
    if (!normalizedQuery) {
      return buildDefaultSearchSuggestions();
    }

    const suggestions = [];
    const seenValues = new Set();
    const rankedHospitals = [...state.hospitals].sort(compareByRankingQuality);
    const nameMatches = rankedHospitals
      .filter((item) => normalizeSearchText(item.name).includes(normalizedQuery))
      .slice(0, 6);

    nameMatches.forEach((item, index) => {
      pushSearchSuggestion(suggestions, seenValues, item.name, '\uBCD1\uC6D0\uBA85', 220 - index);
    });

    const contextualMatches = rankedHospitals
      .filter((item) => keywordMatchesHospital(item, trimmedQuery))
      .slice(0, 18);

    contextualMatches.forEach((item, index) => {
      const department = firstToken(item.department || findDepartmentName(item.departmentId) || '');
      const primaryLocality = item.town || item.district || item.region || '';
      const districtLocality = item.district || '';

      if (primaryLocality && department) {
        pushSearchSuggestion(suggestions, seenValues, `${primaryLocality} ${department}`, '\uC0DD\uD65C\uAD8C', 180 - index);
      }

      if (districtLocality && department && districtLocality !== primaryLocality) {
        pushSearchSuggestion(suggestions, seenValues, `${districtLocality} ${department}`, '\uC9C0\uC5ED', 165 - index);
      }

      if (item.nightOpen && department) {
        pushSearchSuggestion(suggestions, seenValues, `\uC57C\uAC04 ${department}`, '\uC6B4\uC601', 145 - index);
      }
      if (item.saturdayOpen && department) {
        pushSearchSuggestion(suggestions, seenValues, `\uD1A0\uC694\uC77C ${department}`, '\uC6B4\uC601', 140 - index);
      }
      if (item.sundayOpen && department) {
        pushSearchSuggestion(suggestions, seenValues, `\uC77C\uC694\uC77C ${department}`, '\uC6B4\uC601', 135 - index);
      }
      if ((item.parkingCapacity > 0 || item.parkingFee) && department) {
        pushSearchSuggestion(suggestions, seenValues, `\uC8FC\uCC28 \uAC00\uB2A5\uD55C ${department}`, '\uD3B8\uC758', 128 - index);
      }
    });

    const fallbackSuggestions = buildDefaultSearchSuggestions()
      .filter((item) => normalizeSearchText(item.value).includes(normalizedQuery));

    fallbackSuggestions.forEach((item, index) => {
      pushSearchSuggestion(suggestions, seenValues, item.value, item.prefix, 90 - index);
    });

    return suggestions
      .sort((left, right) => right.score - left.score || left.value.localeCompare(right.value, 'ko'))
      .slice(0, 8);
  }

  function renderSearchSuggestions() {
    if (!ui.searchSuggestions) return;

    if (searchSuggestionState.items.length === 0) {
      hideSearchSuggestions();
      return;
    }

    ui.searchSuggestions.hidden = false;
    ui.searchSuggestions.innerHTML = searchSuggestionState.items.map((item, index) => `
      <button
        type="button"
        class="search-suggestion-item${index === searchSuggestionState.activeIndex ? ' is-active' : ''}"
        data-suggestion-index="${index}"
      >
        <span class="search-suggestion-prefix">${escapeHtml(item.prefix)}</span>
        <span>${escapeHtml(item.value)}</span>
      </button>
    `).join('');
  }

  function hideSearchSuggestions() {
    searchSuggestionState.items = [];
    searchSuggestionState.activeIndex = -1;
    if (ui.searchSuggestions) {
      ui.searchSuggestions.hidden = true;
      ui.searchSuggestions.innerHTML = '';
    }
  }

  function refreshSearchSuggestions() {
    if (!ui.heroSearch) return;

    searchSuggestionState.items = buildSearchSuggestions(ui.heroSearch.value);
    searchSuggestionState.activeIndex = searchSuggestionState.items.length > 0 ? 0 : -1;
    renderSearchSuggestions();
  }

  function applySearchSuggestion(index, { run = true } = {}) {
    const item = searchSuggestionState.items[index];
    if (!item || !ui.heroSearch) return;

    ui.heroSearch.value = item.value;
    hideSearchSuggestions();

    if (run) {
      runSearch();
    }
  }

  function moveSearchSuggestion(step) {
    if (searchSuggestionState.items.length === 0) {
      refreshSearchSuggestions();
      return;
    }

    const total = searchSuggestionState.items.length;
    const nextIndex = searchSuggestionState.activeIndex < 0
      ? 0
      : (searchSuggestionState.activeIndex + step + total) % total;

    searchSuggestionState.activeIndex = nextIndex;
    renderSearchSuggestions();
  }

  function handleHeroSearchKeydown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSearchSuggestion(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSearchSuggestion(-1);
      return;
    }

    if (event.key === 'Escape') {
      hideSearchSuggestions();
      return;
    }

    if (event.key === 'Enter') {
      if (searchSuggestionState.activeIndex >= 0 && searchSuggestionState.items.length > 0) {
        event.preventDefault();
        applySearchSuggestion(searchSuggestionState.activeIndex);
        return;
      }

      runSearch();
    }
  }

  function loadHospitals() {
    const source = typeof HospitalAPI?.getHospitals === 'function'
      ? HospitalAPI.getHospitals()
      : mergeHospitalLists(
          Array.isArray(window.HOSPITALS)
            ? window.HOSPITALS
            : typeof HOSPITALS !== 'undefined' && Array.isArray(HOSPITALS)
              ? HOSPITALS
              : [],
          Array.isArray(window.NEW_HOSPITALS)
            ? window.NEW_HOSPITALS
            : typeof NEW_HOSPITALS !== 'undefined' && Array.isArray(NEW_HOSPITALS)
              ? NEW_HOSPITALS
          : [],
        );

    return source.map((item) => {
      const address = item.address || item.addr || '';
      const location = parseAddressLocation(address);
      const constLocation = location;
      const region = normalizeRegionName(
        item.region || findRegionName(item.regionCode || item.sidoCd) || location.region || '',
      );
      const departmentId = normalizeDepartmentId(
        item.departmentId || item.dgsbjtCd,
        item.department,
        item.dgsbjtCdNm,
        item.type,
        item.clCdNm,
        item.name,
        item.yadmNm,
      );
      const type = item.type || item.clCdNm || inferHospitalType(item.name || item.yadmNm) || '?섎즺湲곌?';

      item.id = item.id || item.ykiho;
      item.name = item.name || item.yadmNm;
      item.address = address;
      item.phone = item.phone || item.telno || '';
      item.region = region;
      item.regionCode = String(item.regionCode || item.sidoCd || findRegionCode(region) || location.regionCode || '');
      item.district = item.district || item.sgguCdNm || location.district || '';
      item.town = item.town || item.emdongNm || location.town || '';
      item.departmentId = departmentId;
      item.department = findDepartmentName(departmentId, item.department || item.dgsbjtCdNm);
      item.type = type;
      item.openDate = item.openDate || normalizeOpenDate(item.estbDd) || '';
      item.lat = Number(item.lat || item.YPos || item.yPos) || 0;
      item.lng = Number(item.lng || item.XPos || item.xPos) || 0;

      return {
      ...item,
      id: item.id,
      name: item.name || '병원 정보',
      address: item.address || '',
      phone: item.phone || '',
      regionCode: String(item.regionCode || constLocation.regionCode || ''),
      region: item.region || findRegionName(item.regionCode) || constLocation.region || '',
      district: item.district || constLocation.district || '',
      town: item.town || constLocation.town || '',
      departmentId: item.departmentId || '',
      department: findDepartmentName(item.departmentId, item.department),
      type: item.type || inferHospitalType(item.name) || '의료기관',
      score: Number(item.score) || 0,
      reviewCount: Number(item.reviewCount) || 0,
      specialistCount: Number(item.specialistCount) || 0,
      openDate: item.openDate || '',
      lat: Number(item.lat) || 0,
      lng: Number(item.lng) || 0,
      saturdayOpen: Boolean(item.saturdayOpen),
      sundayOpen: Boolean(item.sundayOpen),
      nightOpen: Boolean(item.nightOpen),
      hasEmergency: Boolean(item.hasEmergency),
      hours: item.hours || {},
      parkingCapacity: Number(item.parkingCapacity) || 0,
      parkingFee: item.parkingFee || '',
      equipment: item.equipment || '',
      url: item.url || '',
      };
    });
  }

  function findRegionName(regionCode) {
    return REGION_LIST.find((item) => item.code === String(regionCode || ''))?.name || '';
  }

  function mergeHospitalLists(...groups) {
    const merged = [];
    const seenIds = new Set();

    groups.flat().forEach((item) => {
      const id = String(item?.id ?? '');
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);
      merged.push(item);
    });

    return merged;
  }

  const DEPARTMENT_CODE_TO_ID = {
    '01': 'internal',
    '03': 'psychiatry',
    '04': 'surgery',
    '05': 'orthopedic',
    '06': 'neurosurgery',
    '08': 'plastic',
    '09': 'pain',
    '10': 'obgyn',
    '11': 'pediatric',
    '12': 'ophthalmology',
    '13': 'ent',
    '14': 'dermatology',
    '15': 'urology',
    '21': 'rehab',
    '23': 'familymed',
    '49': 'dental',
    '80': 'korean',
  };

  const REGION_NAME_ALIASES = {
    '\uC11C\uC6B8': '\uC11C\uC6B8',
    '\uC11C\uC6B8\uD2B9\uBCC4\uC2DC': '\uC11C\uC6B8',
    '\uBD80\uC0B0': '\uBD80\uC0B0',
    '\uBD80\uC0B0\uAD11\uC5ED\uC2DC': '\uBD80\uC0B0',
    '\uB300\uAD6C': '\uB300\uAD6C',
    '\uB300\uAD6C\uAD11\uC5ED\uC2DC': '\uB300\uAD6C',
    '\uC778\uCC9C': '\uC778\uCC9C',
    '\uC778\uCC9C\uAD11\uC5ED\uC2DC': '\uC778\uCC9C',
    '\uAD11\uC8FC': '\uAD11\uC8FC',
    '\uAD11\uC8FC\uAD11\uC5ED\uC2DC': '\uAD11\uC8FC',
    '\uB300\uC804': '\uB300\uC804',
    '\uB300\uC804\uAD11\uC5ED\uC2DC': '\uB300\uC804',
    '\uC6B8\uC0B0': '\uC6B8\uC0B0',
    '\uC6B8\uC0B0\uAD11\uC5ED\uC2DC': '\uC6B8\uC0B0',
    '\uC138\uC885': '\uC138\uC885',
    '\uC138\uC885\uD2B9\uBCC4\uC790\uCE58\uC2DC': '\uC138\uC885',
    '\uACBD\uAE30': '\uACBD\uAE30',
    '\uACBD\uAE30\uB3C4': '\uACBD\uAE30',
    '\uAC15\uC6D0': '\uAC15\uC6D0',
    '\uAC15\uC6D0\uD2B9\uBCC4\uC790\uCE58\uB3C4': '\uAC15\uC6D0',
    '\uCDA9\uBD81': '\uCDA9\uBD81',
    '\uCDA9\uCCAD\uBD81\uB3C4': '\uCDA9\uBD81',
    '\uCDA9\uB0A8': '\uCDA9\uB0A8',
    '\uCDA9\uCCAD\uB0A8\uB3C4': '\uCDA9\uB0A8',
    '\uC804\uBD81': '\uC804\uBD81',
    '\uC804\uBD81\uD2B9\uBCC4\uC790\uCE58\uB3C4': '\uC804\uBD81',
    '\uC804\uB0A8': '\uC804\uB0A8',
    '\uC804\uB77C\uB0A8\uB3C4': '\uC804\uB0A8',
    '\uACBD\uBD81': '\uACBD\uBD81',
    '\uACBD\uC0C1\uBD81\uB3C4': '\uACBD\uBD81',
    '\uACBD\uB0A8': '\uACBD\uB0A8',
    '\uACBD\uC0C1\uB0A8\uB3C4': '\uACBD\uB0A8',
    '\uC81C\uC8FC': '\uC81C\uC8FC',
    '\uC81C\uC8FC\uD2B9\uBCC4\uC790\uCE58\uB3C4': '\uC81C\uC8FC',
  };

  const DEPARTMENT_KEYWORD_MATCHERS = [
    { id: 'general', keywords: ['\uC0C1\uAE09\uC885\uD569\uBCD1\uC6D0', '\uC885\uD569\uBCD1\uC6D0'] },
    { id: 'dental', keywords: ['\uCE58\uACFC\uBCD1\uC6D0', '\uCE58\uACFC\uC758\uC6D0', '\uCE58\uACFC'] },
    { id: 'korean', keywords: ['\uD55C\uBC29\uBCD1\uC6D0', '\uD55C\uC758\uC6D0', '\uD55C\uBC29', '\uD55C\uC758'] },
    { id: 'ophthalmology', keywords: ['\uC548\uACFC'] },
    { id: 'dermatology', keywords: ['\uD53C\uBD80\uACFC'] },
    { id: 'orthopedic', keywords: ['\uC815\uD615\uC678\uACFC'] },
    { id: 'pediatric', keywords: ['\uC18C\uC544\uCCAD\uC18C\uB144\uACFC'] },
    { id: 'obgyn', keywords: ['\uC0B0\uBD80\uC778\uACFC'] },
    { id: 'urology', keywords: ['\uBE44\uB1E8\uC758\uD559\uACFC'] },
    { id: 'psychiatry', keywords: ['\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC', '\uC815\uC2E0\uC758\uD559\uACFC'] },
    { id: 'plastic', keywords: ['\uC131\uD615\uC678\uACFC'] },
    { id: 'familymed', keywords: ['\uAC00\uC815\uC758\uD559\uACFC'] },
    { id: 'pain', keywords: ['\uD1B5\uC99D\uC758\uD559\uACFC'] },
    { id: 'rehab', keywords: ['\uC7AC\uD65C\uC758\uD559\uACFC'] },
    { id: 'neurosurgery', keywords: ['\uC2E0\uACBD\uC678\uACFC'] },
    { id: 'surgery', keywords: ['\uC678\uACFC'] },
    { id: 'internal', keywords: ['\uB0B4\uACFC'] },
    { id: 'ent', keywords: ['\uC774\uBE44\uC778\uD6C4\uACFC'] },
  ];

  function inferHospitalType(name) {
    const label = String(name || '');
    if (label.includes('치과의원')) return '치과의원';
    if (label.includes('치과병원')) return '치과병원';
    if (label.includes('한의원')) return '한의원';
    if (label.includes('한방병원')) return '한방병원';
    if (label.includes('병원')) return '병원';
    if (label.includes('의원')) return '의원';
    return '';
  }

  function parseAddressLocation(address) {
    const tokens = String(address || '').trim().split(/\s+/).filter(Boolean);
    const region = normalizeRegionName(tokens[0] || '');
    const district = tokens[1] || '';
    const third = tokens[2] || '';
    const town = /(읍|면|동|가|리)$/.test(third) ? third : '';
    const regionCode = findRegionCode(region);

    return {
      region,
      regionCode,
      district,
      town,
    };
  }

  function findDepartmentName(id, fallback) {
    return DEPARTMENTS.find((item) => item.id === id)?.name || fallback || '진료과 확인 필요';
  }

  function normalizeRegionName(value) {
    const rawValue = String(value || '').trim();
    if (!rawValue) return '';

    const compactValue = rawValue.replace(/\s+/g, '');
    if (REGION_NAME_ALIASES[compactValue]) {
      return REGION_NAME_ALIASES[compactValue];
    }

    const normalized = compactValue.replace(/(\uD2B9\uBCC4\uC2DC|\uAD11\uC5ED\uC2DC|\uD2B9\uBCC4\uC790\uCE58\uC2DC|\uD2B9\uBCC4\uC790\uCE58\uB3C4|\uC790\uCE58\uB3C4|\uB3C4)$/u, '');
    return REGION_NAME_ALIASES[normalized] || normalized;
  }

  function normalizeDepartmentId(primaryValue, ...fallbackValues) {
    const candidates = [primaryValue, ...fallbackValues]
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => value != null && String(value).trim());

    for (const candidate of candidates) {
      const text = String(candidate).trim();
      if (DEPARTMENTS.some((item) => item.id === text)) {
        return text;
      }

      const fromCode = DEPARTMENT_CODE_TO_ID[text];
      if (fromCode) {
        return fromCode;
      }

      const matchedKeyword = DEPARTMENT_KEYWORD_MATCHERS.find(({ keywords }) => (
        keywords.some((keyword) => text.includes(keyword))
      ));
      if (matchedKeyword) {
        return matchedKeyword.id;
      }
    }

    return '';
  }

  function normalizeOpenDate(value) {
    const text = String(value || '').trim();
    if (/^\d{8}$/.test(text)) {
      return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
    }
    return text;
  }

  init();

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
  }

  function updateThemeButton(theme) {
    if (ui.themeToggle) {
      ui.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function initHeader() {
    if (!ui.header) return;
    window.addEventListener('scroll', () => {
      ui.header.classList.toggle('scrolled', window.scrollY > 24);
    });
  }

  function populateFilters() {
    populateRegionSelect(ui.regionFilter, '전국');
    populateRegionSelect(ui.heroRegionFilter, '광역시도 선택');
    populateTypeSelect();
    populateSortSelect();
    syncLocalityFilters();
  }

  function populateRegionSelect(select, allLabel) {
    if (!select) return;
    select.innerHTML = `<option value="all">${allLabel}</option>`;
    REGION_LIST.forEach((region) => {
      const option = document.createElement('option');
      option.value = region.code;
      option.textContent = region.name;
      select.appendChild(option);
    });
  }

  function populateTypeSelect() {
    if (!ui.typeFilter) return;
    ui.typeFilter.innerHTML = `
      <option value="all">병원 구분</option>
      <option value="hospital">종합/병원</option>
      <option value="clinic">의원</option>
      <option value="dental">치과</option>
      <option value="korean">한방</option>
    `;
  }

  function populateSortSelect() {
    if (!ui.sortFilter) return;
    ui.sortFilter.innerHTML = `
      <option value="score">평점순</option>
      <option value="reviews">후기 많은순</option>
      <option value="specialists">전문의 많은순</option>
      <option value="newest">최신 개원순</option>
      <option value="name">이름순</option>
      <option value="saturday_first">토요일 진료 우선</option>
      <option value="night_first">야간 진료 우선</option>
      <option value="sunday_first">일요일 진료 우선</option>
    `;
  }

  function renderDepartmentGrid() {
    if (!ui.departmentGrid) return;
    ui.departmentGrid.innerHTML = DEPARTMENTS.map((department) => `
      <button class="dept-card fade-up visible" type="button" data-department-id="${department.id}">
        <span class="dept-icon" style="background:${department.color}18;color:${department.color};">${department.icon}</span>
        <span class="dept-name">${escapeHtml(department.name)}</span>
      </button>
    `).join('');
  }

  function renderSpotlights() {
    renderLandingCardList(ui.regionSpotlightList, REGION_SPOTLIGHTS);
    renderLandingCardList(ui.guideSpotlightList, GUIDE_SPOTLIGHTS);
  }

  function renderLandingCardList(target, items) {
    if (!target) return;
    target.innerHTML = items.map((item) => `
      <a href="${item.href}" class="landing-card fade-up visible">
        <span class="landing-card-badge">${escapeHtml(item.badge)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="landing-card-footer">
          <span>바로 보기</span>
          <span class="landing-card-count">안내</span>
        </div>
      </a>
    `).join('');
  }

  function bindEvents() {
    ui.themeToggle?.addEventListener('click', toggleTheme);
    ui.mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    ui.searchBtn?.addEventListener('click', runSearch);
    ui.heroSearch?.addEventListener('keydown', handleHeroSearchKeydown);
    ui.heroSearch?.addEventListener('input', refreshSearchSuggestions);
    ui.heroSearch?.addEventListener('focus', refreshSearchSuggestions);
    ui.clearSearchBtn?.addEventListener('click', clearSearch);
    ui.heroLocationApply?.addEventListener('click', applyHeroLocation);
    ui.regionFilter?.addEventListener('change', onRegionChange);
    ui.heroRegionFilter?.addEventListener('change', onHeroRegionChange);
    ui.districtFilter?.addEventListener('change', onDistrictChange);
    ui.heroDistrictFilter?.addEventListener('change', onHeroDistrictChange);
    ui.townFilter?.addEventListener('change', onTownChange);
    ui.heroTownFilter?.addEventListener('change', onHeroTownChange);
    ui.typeFilter?.addEventListener('change', () => {
      state.type = ui.typeFilter.value;
      refreshPage();
    });
    ui.sortFilter?.addEventListener('change', () => {
      state.sort = ui.sortFilter.value;
      refreshPage();
    });
    ui.loadMoreBtn?.addEventListener('click', () => {
      state.visibleCount += 12;
      renderRanking();
    });

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-search-example]');
      if (!button || !ui.heroSearch) return;

      ui.heroSearch.value = button.dataset.searchExample || '';
      runSearch();
    });

    document.querySelectorAll('.quick-filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        state.specialFilter = button.dataset.filter || '';
        state.searchActive = true;
        state.visibleCount = 12;
        refreshPage();
        scrollToSearchResults();
      });
    });

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-refine]');
      if (!button) return;

      if (button.closest('.search-empty-state')) {
        if (ui.heroSearch) ui.heroSearch.value = '';
        state.keyword = '';
      }
      state.specialFilter = button.dataset.refine || '';
      state.searchActive = true;
      state.visibleCount = 12;
      refreshPage();
    });

    ui.departmentGrid?.addEventListener('click', (event) => {
      const target = event.target.closest('[data-department-id]');
      if (!target) return;
      target.blur?.();
      state.departmentId = target.dataset.departmentId || 'all';
      state.visibleCount = 12;
      window.setTimeout(() => {
        window.location.hash = 'ranking-list';
      }, 80);
      refreshPage();
    });

    ui.searchSuggestions?.addEventListener('mousemove', (event) => {
      const target = event.target.closest('[data-suggestion-index]');
      if (!target) return;

      searchSuggestionState.activeIndex = Number(target.dataset.suggestionIndex || -1);
      renderSearchSuggestions();
    });

    ui.searchSuggestions?.addEventListener('click', (event) => {
      const target = event.target.closest('[data-suggestion-index]');
      if (!target) return;

      applySearchSuggestion(Number(target.dataset.suggestionIndex || -1));
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (
        ui.heroSearch?.contains(target)
        || ui.searchSuggestions?.contains(target)
        || target?.closest?.('.search-wrapper')
      ) {
        return;
      }

      hideSearchSuggestions();
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeButton(next);
  }

  function toggleMobileMenu() {
    if (!ui.navLinks) return;
    const isOpen = ui.navLinks.dataset.open === 'true';
    ui.navLinks.dataset.open = isOpen ? 'false' : 'true';
    ui.navLinks.style.display = isOpen ? '' : 'flex';
  }

  function applyUrlState() {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('keyword');
    const region = params.get('region');
    const department = params.get('department');

    if (keyword && ui.heroSearch) {
      ui.heroSearch.value = keyword;
      state.keyword = keyword.trim();
      state.searchActive = true;
    }
    if (region) {
      const regionCode = findRegionCode(region);
      state.regionCode = regionCode || state.regionCode;
      if (ui.regionFilter) ui.regionFilter.value = state.regionCode;
      if (ui.heroRegionFilter) ui.heroRegionFilter.value = state.regionCode;
      syncLocalityFilters();
    }
    if (department) {
      state.departmentId = department;
    }
  }

  function findRegionCode(value) {
    const rawValue = String(value || '').trim();
    const normalizedValue = normalizeRegionName(rawValue);
    const match = REGION_LIST.find((item) => (
      item.code === rawValue
      || item.code === normalizedValue
      || item.name === rawValue
      || item.name === normalizedValue
    ));
    return match?.code || '';
  }

  function onRegionChange() {
    state.regionCode = ui.regionFilter?.value || 'all';
    if (ui.heroRegionFilter) ui.heroRegionFilter.value = state.regionCode;
    state.district = 'all';
    state.town = 'all';
    syncLocalityFilters();
    refreshPage();
  }

  function onHeroRegionChange() {
    state.regionCode = ui.heroRegionFilter?.value || 'all';
    if (ui.regionFilter) ui.regionFilter.value = state.regionCode;
    state.district = 'all';
    state.town = 'all';
    syncLocalityFilters();
  }

  function onDistrictChange() {
    state.district = ui.districtFilter?.value || 'all';
    if (ui.heroDistrictFilter) ui.heroDistrictFilter.value = state.district;
    state.town = 'all';
    syncTownSelects();
    refreshPage();
  }

  function onHeroDistrictChange() {
    state.district = ui.heroDistrictFilter?.value || 'all';
    if (ui.districtFilter) ui.districtFilter.value = state.district;
    state.town = 'all';
    syncTownSelects();
  }

  function onTownChange() {
    state.town = ui.townFilter?.value || 'all';
    if (ui.heroTownFilter) ui.heroTownFilter.value = state.town;
    refreshPage();
  }

  function onHeroTownChange() {
    state.town = ui.heroTownFilter?.value || 'all';
    if (ui.townFilter) ui.townFilter.value = state.town;
  }

  function applyHeroLocation() {
    state.searchActive = true;
    refreshPage();
    scrollToRanking();
  }

  function syncLocalityFilters() {
    syncDistrictSelects();
    syncTownSelects();
  }

  function syncDistrictSelects() {
    const hospitals = state.hospitals.filter((item) => state.regionCode === 'all' || item.regionCode === state.regionCode);
    const districts = uniqueValues(hospitals.map((item) => item.district).filter(Boolean));
    populateLocalitySelect(ui.districtFilter, districts, '시/군/구 선택', state.district);
    populateLocalitySelect(ui.heroDistrictFilter, districts, '시/군/구 선택', state.district);
  }

  function syncTownSelects() {
    const hospitals = state.hospitals.filter((item) => {
      if (state.regionCode !== 'all' && item.regionCode !== state.regionCode) return false;
      if (state.district !== 'all' && item.district !== state.district) return false;
      return true;
    });
    const towns = uniqueValues(hospitals.map((item) => item.town).filter(Boolean));
    populateLocalitySelect(ui.townFilter, towns, '읍/면/동 선택', state.town);
    populateLocalitySelect(ui.heroTownFilter, towns, '읍/면/동 선택', state.town);
  }

  function populateLocalitySelect(select, items, placeholder, value) {
    if (!select) return;
    select.innerHTML = `<option value="all">${placeholder}</option>`;
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });
    select.disabled = items.length === 0;
    select.value = items.includes(value) ? value : 'all';
  }

  function runSearch() {
    state.keyword = ui.heroSearch?.value.trim() || '';
    state.specialFilter = '';
    state.searchActive = true;
    state.visibleCount = 12;
    hideSearchSuggestions();
    refreshPage();
    scrollToSearchResults();
  }

  function clearSearch() {
    if (ui.heroSearch) ui.heroSearch.value = '';
    hideSearchSuggestions();
    state.keyword = '';
    state.specialFilter = '';
    state.searchActive = false;
    state.visibleCount = 12;
    refreshPage();
    ui.searchResults?.classList.remove('active');
  }

  function refreshPage() {
    state.filteredHospitals = buildFilteredHospitals();
    renderRanking();
    renderSearchResults();
    renderQuickAccess();
    renderReviews();
    renderNewHospitals();
    updateMap();
  }

  function buildFilteredHospitals() {
    let hospitals = [...state.hospitals];

    if (state.regionCode !== 'all') {
      hospitals = hospitals.filter((item) => item.regionCode === state.regionCode);
    }
    if (state.district !== 'all') {
      hospitals = hospitals.filter((item) => item.district === state.district);
    }
    if (state.town !== 'all') {
      hospitals = hospitals.filter((item) => item.town === state.town);
    }
    if (state.departmentId !== 'all') {
      hospitals = hospitals.filter((item) => item.departmentId === state.departmentId);
    }
    if (state.type !== 'all') {
      hospitals = hospitals.filter((item) => matchesType(item, state.type));
    }
    if (state.keyword) {
      hospitals = hospitals.filter((item) => keywordMatchesHospital(item, state.keyword));
    }
    if (state.specialFilter) {
      hospitals = hospitals.filter((item) => matchesSpecialFilter(item, state.specialFilter));
    }

    return hospitals.sort(sortHospitals);
  }

  function matchesType(item, type) {
    if (type === 'hospital') {
      return /병원/.test(item.type) || item.departmentId === 'general';
    }
    if (type === 'clinic') {
      return /의원/.test(item.type);
    }
    if (type === 'dental') {
      return item.departmentId === 'dental' || /치과/.test(item.type);
    }
    if (type === 'korean') {
      return item.departmentId === 'korean' || /한/.test(item.type);
    }
    return true;
  }

  function keywordMatchesHospital(item, rawKeyword) {
    const haystack = buildSearchHaystack(item);
    const normalizedKeyword = normalizeSearchText(rawKeyword);
    if (!normalizedKeyword) return true;
    if (haystack.includes(normalizedKeyword)) return true;

    const tokenGroups = buildSearchTokenGroups(normalizedKeyword);
    if (tokenGroups.length === 0) return true;

    return tokenGroups.every((group) => (
      group.some((token) => haystack.includes(token))
    ));
  }

  function buildSearchHaystack(item) {
    return normalizeSearchText([
      item.name,
      item.address,
      item.department,
      item.type,
      item.region,
      item.district,
      item.town,
      item.saturdayOpen ? '토요일 진료 토요진료 토요 주말진료' : '',
      item.sundayOpen ? '일요일 진료 일요진료 일요 휴일진료' : '',
      item.nightOpen ? '야간 진료 야간진료 저녁진료 저녁' : '',
      item.hasEmergency ? '응급 응급실 응급진료' : '',
      item.parkingCapacity > 0 || item.parkingFee ? '주차 가능 주차가능 주차장' : '',
      item.specialistCount > 0 ? '전문의 전문의진료' : '',
    ]
      .filter(Boolean)
      .join(' '));
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function expandSearchTokens(keyword) {
    return Array.from(new Set(buildSearchTokenGroups(keyword).flat()));
  }

  function buildSearchTokenGroups(keyword) {
    const tokens = normalizeSearchText(keyword).split(' ').filter(Boolean);
    const groups = [];

    tokens.forEach((token) => {
      if (SEARCH_GENERIC_TOKENS.has(token)) {
        return;
      }

      const group = [];
      const aliases = SEARCH_TOKEN_ALIASES[token];
      if (aliases?.length) {
        group.push(...aliases);
      }

      const supplementalAliases = SUPPLEMENTAL_SEARCH_TOKEN_ALIASES[token];
      if (supplementalAliases?.length) {
        group.push(...supplementalAliases);
      }

      if (!aliases?.length && !supplementalAliases?.length) {
        group.push(token);
      }

      const normalizedGroup = Array.from(new Set(group.map(normalizeSearchText).filter(Boolean)));
      if (normalizedGroup.length > 0) {
        groups.push(normalizedGroup);
      }
    });

    return groups;
  }

  function matchesSpecialFilter(item, filter) {
    switch (filter) {
      case 'sat':
        return item.saturdayOpen;
      case 'sun':
        return item.sundayOpen;
      case 'night':
        return item.nightOpen;
      case 'new':
      case 'recent':
        return isRecentOpening(item.openDate);
      case 'parking':
        return item.parkingCapacity > 0 || Boolean(item.parkingFee);
      case 'specialist':
        return item.specialistCount > 0;
      case 'emergency':
        return item.hasEmergency;
      default:
        return true;
    }
  }

  function sortHospitals(a, b) {
    switch (state.sort) {
      case 'reviews':
        return (b.reviewCount - a.reviewCount) || compareByRankingQuality(a, b);
      case 'specialists':
        return (b.specialistCount - a.specialistCount) || compareByRankingQuality(a, b);
      case 'newest':
        return (parseDate(b.openDate) - parseDate(a.openDate)) || compareByRankingQuality(a, b);
      case 'name':
        return String(a.name).localeCompare(String(b.name), 'ko');
      case 'saturday_first':
        return Number(b.saturdayOpen) - Number(a.saturdayOpen) || compareByRankingQuality(a, b);
      case 'night_first':
        return Number(b.nightOpen) - Number(a.nightOpen) || compareByRankingQuality(a, b);
      case 'sunday_first':
        return Number(b.sundayOpen) - Number(a.sundayOpen) || compareByRankingQuality(a, b);
      default:
        return compareByRankingQuality(a, b);
    }
  }

  function renderRanking() {
    if (!ui.rankingList) return;

    const visibleHospitals = state.filteredHospitals.slice(0, state.visibleCount);
    ui.rankingList.innerHTML = visibleHospitals.map((item, index) => renderHospitalCard(item, index + 1)).join('');
    if (ui.rankingCount) {
      ui.rankingCount.innerHTML = `총 <strong>${formatNumber(state.filteredHospitals.length)}</strong>개 병원`;
    }
    if (ui.loadMoreBtn) {
      ui.loadMoreBtn.style.display = state.filteredHospitals.length > state.visibleCount ? 'inline-flex' : 'none';
      ui.loadMoreBtn.textContent = '더 보기';
    }
    if (ui.rankingLoader) {
      ui.rankingLoader.style.display = 'none';
    }
  }

  function renderSearchResults() {
    if (!ui.searchResults || !ui.searchResultsList || !ui.searchResultCount) return;

    if (!state.searchActive && !state.keyword && !state.specialFilter) {
      ui.searchResults.classList.remove('active');
      ui.searchResultsList.innerHTML = '';
      ui.searchResultCount.textContent = '';
      return;
    }

    ui.searchResults.classList.add('active');
    const searchQueryDisplay = document.getElementById('search-query-display');
    if (searchQueryDisplay) {
      searchQueryDisplay.textContent = state.keyword || buildSpecialFilterLabel(state.specialFilter) || '검색';
    }
    ui.searchIntentSummary.textContent = buildIntentSummary();
    ui.searchResultCount.innerHTML = `검색 결과 <strong>${formatNumber(state.filteredHospitals.length)}</strong>개`;
    ui.searchResultsList.innerHTML = state.filteredHospitals.length > 0
      ? state.filteredHospitals
        .slice(0, Math.min(state.visibleCount, 24))
        .map((item, index) => renderHospitalCard(item, index + 1))
        .join('')
      : renderSearchEmptyState();
  }

  function buildIntentSummary() {
    const parts = [];
    if (state.regionCode !== 'all') parts.push(findRegionName(state.regionCode));
    if (state.departmentId !== 'all') parts.push(findDepartmentName(state.departmentId));
    getKeywordOperationLabels(state.keyword).forEach((label) => parts.push(label));
    if (state.keyword) parts.push(`키워드 "${state.keyword}"`);
    if (state.specialFilter) parts.push(buildSpecialFilterLabel(state.specialFilter));
    return parts.length > 0 ? `${parts.join(' / ')} 기준 결과입니다.` : '현재 조건에 맞는 병원 결과입니다.';
  }

  function getKeywordOperationLabels(keyword) {
    const normalizedKeyword = normalizeSearchText(keyword);
    if (!normalizedKeyword) return [];

    return KEYWORD_OPERATION_PATTERNS
      .filter(({ tokens }) => tokens.some((token) => normalizedKeyword.includes(normalizeSearchText(token))))
      .map(({ label }) => label);
  }

  function renderSearchEmptyState() {
    const keyword = state.keyword || buildSpecialFilterLabel(state.specialFilter) || '\uAC80\uC0C9\uC5B4';
    const retryQueries = [
      '\uAD50\uD558 \uB0B4\uACFC',
      '\uC6B4\uC815 \uC18C\uC544\uACFC',
      '\uAC15\uB0A8 \uD53C\uBD80\uACFC',
      '\uC57C\uAC04 \uD53C\uBD80\uACFC',
      '\uD1A0\uC694\uC77C \uC815\uD615\uC678\uACFC',
      '\uC8FC\uCC28 \uAC00\uB2A5\uD55C \uCE58\uACFC',
    ];

    return `
      <div class="search-empty-state">
        <div class="search-empty-head">
          <p class="search-empty-icon" aria-hidden="true">\u2315</p>
          <h3>${escapeHtml(keyword)} \uAC80\uC0C9 \uACB0\uACFC\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4</h3>
          <p>\uC9C0\uC5ED\uBA85\uACFC \uC9C4\uB8CC\uACFC\uB97C \uB098\uB220 \uC785\uB825\uD558\uAC70\uB098, \uD1A0\uC694\uC77C\u00B7\uC57C\uAC04\u00B7\uC77C\uC694\uC77C \uAC19\uC740 \uC6B4\uC601\uC870\uAC74\uC744 \uD568\uAED8 \uC785\uB825\uD574 \uBCF4\uC138\uC694.</p>
        </div>
        <div class="search-empty-sections">
          <div class="search-empty-group">
            <h4>\uAC80\uC0C9\uC5B4\uB97C \uC774\uB807\uAC8C \uBC14\uAFC0 \uC218 \uC788\uC5B4\uC694</h4>
            <div class="search-empty-chip-list">
              ${retryQueries.map((query) => `
                <button type="button" class="search-empty-chip" data-search-example="${escapeHtml(query)}">${escapeHtml(query)}</button>
              `).join('')}
            </div>
          </div>
          <div class="search-empty-group">
            <h4>\uBE60\uB978 \uD544\uD130</h4>
            <div class="search-empty-preset-list">
              <button type="button" class="search-empty-preset search-refine-btn" data-refine="sat"><strong>\uD1A0\uC694 \uC9C4\uB8CC</strong><span>\uC8FC\uB9D0 \uBC29\uBB38\uC774 \uD544\uC694\uD560 \uB54C</span></button>
              <button type="button" class="search-empty-preset search-refine-btn" data-refine="night"><strong>\uC57C\uAC04 \uC9C4\uB8CC</strong><span>\uD1F4\uADFC \uD6C4 \uBC29\uBB38\uD560 \uC218 \uC788\uB294 \uBCD1\uC6D0</span></button>
              <button type="button" class="search-empty-preset search-refine-btn" data-refine="parking"><strong>\uC8FC\uCC28 \uAC00\uB2A5</strong><span>\uCC28\uB7C9 \uBC29\uBB38\uC774 \uD3B8\uD55C \uACF3</span></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderHospitalCard(item, rank) {
    const tags = buildTagMarkup(item);
    const statusBadges = buildStatusBadges(item);
    const trustBadges = buildTrustBadges(item);
    const facts = buildHospitalFactsMarkup(item);
    const openDate = item.openDate ? `개원 ${formatDate(item.openDate)}` : '개원일 확인 중';
    const doctors = item.specialistCount > 0 ? `전문의 ${item.specialistCount}명` : '의료진 정보 확인 중';
    const reviews = item.reviewCount > 0 ? `후기 ${formatNumber(item.reviewCount)}건` : '후기 집계 전';

    return `
      <a href="detail.html?id=${encodeURIComponent(item.id)}" class="hospital-card fade-up visible">
        <div class="rank-badge ${rank <= 3 ? `rank-${rank}` : 'rank-default'}">${rank}</div>
        <div class="hospital-info">
          <div class="hospital-name">
            <span>${escapeHtml(item.name)}</span>
            <span class="hospital-type-tag">${escapeHtml(item.type)}</span>
          </div>
          <div class="hospital-address">📍 ${escapeHtml(item.address || '주소 정보 확인 중')}</div>
          <div class="hospital-subinfo">${escapeHtml(doctors)} / ${escapeHtml(openDate)}</div>
          <div class="hospital-status-row hospital-status-row-compact">${statusBadges}</div>
          <div class="hospital-trust-row hospital-trust-row-compact">${trustBadges}</div>
          <p class="hospital-status-summary hospital-status-summary-compact">${escapeHtml(buildHospitalSummary(item))}</p>
          ${facts}
          <div class="hospital-meta">
            <span class="meta-item"><span class="meta-icon">⭐</span><span class="meta-value">${item.score.toFixed(1)}</span></span>
            <span class="meta-item"><span class="meta-icon">📝</span><span class="meta-label">${escapeHtml(reviews)}</span></span>
          </div>
          ${tags ? `<div class="hospital-tags">${tags}</div>` : ''}
        </div>
      </a>
    `;
  }

  function buildStatusBadges(item) {
    const badges = [];
    if (isOpenNow(item)) badges.push('<span class="hospital-status-badge is-open">현재 진료 가능성 높음</span>');
    if (item.saturdayOpen) badges.push('<span class="hospital-status-badge is-today">토요일 진료</span>');
    if (item.nightOpen) badges.push('<span class="hospital-status-badge is-option">야간 진료</span>');
    if (item.sundayOpen) badges.push('<span class="hospital-status-badge is-option">일요일 진료</span>');
    if (badges.length === 0) badges.push('<span class="hospital-status-badge is-closed">운영 정보 확인 필요</span>');
    return badges.join('');
  }

  function buildHospitalFactsMarkup(item) {
    const operation = [
      item.saturdayOpen ? '\uD1A0\uC694' : '',
      item.nightOpen ? '\uC57C\uAC04' : '',
      item.sundayOpen ? '\uC77C\uC694' : '',
    ].filter(Boolean).join(' / ') || '\uC6B4\uC601\uC2DC\uAC04 \uD655\uC778 \uD544\uC694';
    const parking = item.parkingCapacity > 0
      ? `\uC8FC\uCC28 ${formatNumber(item.parkingCapacity)}\uB300${item.parkingFee ? ` \u00B7 ${item.parkingFee}` : ''}`
      : item.parkingFee || '\uD655\uC778 \uD544\uC694';
    const opening = item.openDate
      ? formatDate(item.openDate)
      : '\uD655\uC778 \uD544\uC694';
    const facts = [
      ['\uC804\uD654', item.phone || '\uD655\uC778 \uD544\uC694'],
      ['\uC6B4\uC601', operation],
      ['\uC8FC\uCC28', parking],
      ['\uAC1C\uC6D0', opening],
    ];

    return `
      <dl class="hospital-facts">
        ${facts.map(([label, value]) => `
          <div class="hospital-fact">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>
        `).join('')}
      </dl>
    `;
  }

  function buildTrustBadges(item) {
    const badges = [];
    if (item.reviewCount >= 500) badges.push('<span class="hospital-trust-badge is-high">후기 관심도 높음</span>');
    else if (item.reviewCount >= 100) badges.push('<span class="hospital-trust-badge is-medium">후기 확인 가능</span>');
    else badges.push('<span class="hospital-trust-badge is-basic">기본 정보 중심</span>');

    if (item.specialistCount > 0) badges.push('<span class="hospital-trust-badge is-verified">전문의 정보 있음</span>');
    if (item.parkingCapacity > 0 || item.parkingFee) badges.push('<span class="hospital-trust-badge is-partial">주차 정보 있음</span>');
    return badges.join('');
  }

  function buildTagMarkup(item) {
    const tags = [];
    if (item.saturdayOpen) tags.push('<span class="tag tag-sat">토요일</span>');
    if (item.nightOpen) tags.push('<span class="tag tag-night">야간</span>');
    if (item.sundayOpen) tags.push('<span class="tag tag-sun">일요일</span>');
    if (item.url) tags.push('<span class="tag tag-site">홈페이지</span>');
    return tags.join('');
  }

  function buildHospitalSummary(item) {
    const parts = [
      item.department,
      item.region ? `${item.region} ${item.district || ''}`.trim() : '',
      item.parkingCapacity > 0 ? `주차 ${item.parkingCapacity}대` : '',
      item.equipment ? `장비 ${firstToken(item.equipment)}` : '',
    ].filter(Boolean);
    return parts.join(' / ');
  }

  function pickEditorialItems(items, limit, comparator = compareByRankingQuality) {
    const sortedItems = [...items].sort(comparator);
    const preferred = sortedItems.filter(isEditorialEligible);

    if (preferred.length >= limit) {
      return preferred.slice(0, limit);
    }

    const preferredIds = new Set(preferred.map((item) => String(item.id ?? '')));
    const fallback = sortedItems.filter((item) => {
      const id = String(item.id ?? '');
      return !preferredIds.has(id) && !NON_EDITORIAL_HOSPITAL_IDS.has(id);
    });

    return [...preferred, ...fallback].slice(0, limit);
  }

  function isEditorialEligible(hospital) {
    const id = String(hospital?.id ?? '');
    if (!id || NON_EDITORIAL_HOSPITAL_IDS.has(id)) {
      return false;
    }

    const reviews = Math.max(Number(hospital?.reviewCount || 0), 0);
    const specialists = Math.max(Number(hospital?.specialistCount || 0), 0);
    const infoRichness = getHospitalInfoRichnessScore(hospital);

    if (reviews >= 100) return true;
    if (specialists > 0 && reviews >= 50) return true;
    if (isRecentOpening(hospital?.openDate) && reviews >= 50 && infoRichness >= 5) return true;

    return getRankingScore(hospital) >= 4.45 && reviews >= 60 && infoRichness >= 6;
  }

  function compareByRankingQuality(a, b) {
    const rankingScoreDiff = getRankingScore(b) - getRankingScore(a);
    if (Math.abs(rankingScoreDiff) >= 0.01) {
      return rankingScoreDiff;
    }

    const infoRichnessDiff = getHospitalInfoRichnessScore(b) - getHospitalInfoRichnessScore(a);
    if (infoRichnessDiff !== 0) {
      return infoRichnessDiff;
    }

    const reviewDiff = (b.reviewCount || 0) - (a.reviewCount || 0);
    if (reviewDiff !== 0) {
      return reviewDiff;
    }

    const specialistDiff = (b.specialistCount || 0) - (a.specialistCount || 0);
    if (specialistDiff !== 0) {
      return specialistDiff;
    }

    const typeDiff = getTypePriority(b) - getTypePriority(a);
    if (typeDiff !== 0) {
      return typeDiff;
    }

    return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
  }

  function getRankingScore(hospital) {
    const priorMean = 4.3;
    const priorWeight = 500;
    const numericScore = Number(hospital?.score);
    const score = Number.isFinite(numericScore) && numericScore > 0
      ? numericScore
      : priorMean;
    const reviews = Math.max(Number(hospital?.reviewCount || 0), 0);
    const specialists = Math.max(Number(hospital?.specialistCount || 0), 0);

    const bayesianScore = ((score * reviews) + (priorMean * priorWeight)) / (reviews + priorWeight);
    const reviewVolumeBonus = Math.min(reviews / 1000, 0.2);
    const specialistBonus = Math.min(specialists / 500, 0.25);
    const typeBonus = getTypePriority(hospital) * 0.02;
    const infoRichnessBonus = getHospitalInfoRichnessScore(hospital) * 0.025;

    return bayesianScore + reviewVolumeBonus + specialistBonus + typeBonus + infoRichnessBonus;
  }

  function getHospitalInfoRichnessScore(hospital) {
    const checks = [
      Boolean(hospital?.address),
      Boolean(hospital?.phone),
      Boolean(hospital?.url),
      Boolean(hospital?.region || hospital?.district || hospital?.town),
      Boolean(hospital?.openDate),
      Math.max(Number(hospital?.reviewCount || 0), 0) > 0 || Math.max(Number(hospital?.specialistCount || 0), 0) > 0,
      hasOperationalInfo(hospital),
      hasParkingInfo(hospital)
        || Boolean(hospital?.equipment)
        || Number(hospital?.roomCount || 0) > 0
        || Number(hospital?.bedCount || 0) > 0,
    ];

    return checks.filter(Boolean).length;
  }

  function hasOperationalInfo(hospital) {
    if (!hospital) {
      return false;
    }

    if (hospital.saturdayOpen === true || hospital.saturdayOpen === false) return true;
    if (hospital.sundayOpen === true || hospital.sundayOpen === false) return true;
    if (hospital.nightOpen === true || hospital.nightOpen === false) return true;

    const hours = hospital.hours;
    if (!hours || typeof hours !== 'object') {
      return false;
    }

    return Object.values(hours).some((value) => String(value || '').trim());
  }

  function hasParkingInfo(hospital) {
    return Number(hospital?.parkingCapacity || 0) > 0 || Boolean(hospital?.parkingFee);
  }

  function getTypePriority(hospital) {
    const typeName = String(hospital?.type || '');
    if (hospital?.departmentId === 'general' || typeName.includes('상급종합') || typeName.includes('종합병원')) return 5;
    if (typeName.includes('병원')) return 4;
    if (typeName.includes('치과병원') || typeName.includes('한방병원')) return 3;
    if (typeName.includes('의원')) return 2;
    return 1;
  }

  function renderQuickAccess() {
    renderQuickAccessList(
      ui.currentOpenList,
      pickEditorialItems(state.hospitals.filter(isOpenNow), 4),
      '현재 바로 보기 좋은 병원이 없습니다.'
    );
    renderQuickAccessList(
      ui.saturdayOpenList,
      pickEditorialItems(state.hospitals.filter((item) => item.saturdayOpen), 4),
      '토요일 진료 병원을 준비 중입니다.'
    );
    renderQuickAccessList(
      ui.nightOpenList,
      pickEditorialItems(state.hospitals.filter((item) => item.nightOpen), 4),
      '야간 진료 병원을 준비 중입니다.'
    );
    renderQuickAccessList(
      ui.recentOpenList,
      pickEditorialItems(
        state.hospitals.filter((item) => item.openDate),
        4,
        (a, b) => (parseDate(b.openDate) - parseDate(a.openDate)) || compareByRankingQuality(a, b),
      ),
      '신규 개원 병원을 준비 중입니다.'
    );
  }

  function renderQuickAccessList(target, items, emptyMessage) {
    if (!target) return;
    if (items.length === 0) {
      target.innerHTML = `<p class="quick-access-empty">${escapeHtml(emptyMessage)}</p>`;
      return;
    }

    target.innerHTML = items.map((item) => `
      <a href="detail.html?id=${encodeURIComponent(item.id)}" class="quick-access-item">
        <div class="quick-access-title-row">
          <strong>${escapeHtml(item.name)}</strong>
        </div>
        <p class="quick-access-address">${escapeHtml(item.address || '주소 정보 확인 중')}</p>
        <p class="quick-access-subinfo">${escapeHtml(item.department)} / ${escapeHtml(item.type)}</p>
        <div class="quick-access-meta">
          <span>⭐ ${item.score.toFixed(1)}</span>
          ${item.saturdayOpen ? '<span>토요일</span>' : ''}
          ${item.nightOpen ? '<span>야간</span>' : ''}
          ${item.sundayOpen ? '<span>일요일</span>' : ''}
        </div>
      </a>
    `).join('');
  }

  function renderReviews() {
    if (!ui.reviewsList) return;
    const items = pickEditorialItems(
      state.hospitals,
      6,
      (a, b) => (b.reviewCount - a.reviewCount) || compareByRankingQuality(a, b),
    );
    ui.reviewsList.innerHTML = items.map((item) => `
      <article class="review-card fade-up visible">
        <span class="review-quote">“</span>
        <div class="review-header">
          <span class="review-badge">${escapeHtml(item.department)}</span>
          <strong>${escapeHtml(item.name)}</strong>
        </div>
        <p style="line-height:1.8; color:var(--text-body); margin-bottom:16px;">${escapeHtml(buildReviewSummary(item))}</p>
        <div class="hospital-meta">
          <span class="meta-item"><span class="meta-icon">⭐</span><span class="meta-value">${item.score.toFixed(1)}</span></span>
          <span class="meta-item"><span class="meta-icon">📝</span><span class="meta-label">${formatNumber(item.reviewCount)}건</span></span>
        </div>
      </article>
    `).join('');
  }

  function buildReviewSummary(item) {
    const parts = [
      `${item.department} 중심으로 많이 조회된 병원입니다.`,
      item.saturdayOpen ? '토요일 진료 확인 가능.' : '',
      item.nightOpen ? '야간 진료 조건도 함께 볼 수 있습니다.' : '',
      item.specialistCount > 0 ? `전문의 ${item.specialistCount}명 정보가 있습니다.` : '',
    ].filter(Boolean);
    return parts.join(' ');
  }

  function renderNewHospitals() {
    if (!ui.newHospitalsList) return;
    const items = pickEditorialItems(
      state.hospitals.filter((item) => item.openDate),
      8,
      (a, b) => (parseDate(b.openDate) - parseDate(a.openDate)) || compareByRankingQuality(a, b),
    );

    ui.newHospitalsList.innerHTML = items.map((item) => `
      <article class="timeline-item">
        <div class="timeline-date">${escapeHtml(formatDate(item.openDate))}</div>
        <a href="detail.html?id=${encodeURIComponent(item.id)}" class="timeline-card">
          <div class="timeline-name">${escapeHtml(item.name)}</div>
          <div class="timeline-addr">${escapeHtml(item.address || '주소 정보 확인 중')}</div>
        </a>
      </article>
    `).join('');
  }

  function updateMap() {
    const markers = state.filteredHospitals.slice(0, 40);
    window.AppHospitals = markers;
    if (typeof MapModule?.updateMarkers === 'function') {
      MapModule.updateMarkers(markers);
    }
  }

  function scrollToSearchResults() {
    ui.searchResults?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToRanking() {
    requestAnimationFrame(() => {
      const target = document.getElementById('ranking-list') || document.getElementById('ranking');
      if (!target) return;
      const headerHeight = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72;
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 18);
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top, left: 0, behavior: 'auto' });
      window.setTimeout(() => {
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      }, 0);
    });
  }

  function isOpenNow(item) {
    const now = new Date();
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const key = dayKeys[now.getDay()];
    const value = item.hours?.[key];

    if (typeof value === 'string') {
      const matched = value.match(/(\d{1,2})\D+(\d{2}).*?(\d{1,2})\D+(\d{2})/);
      if (matched) {
        const start = Number(matched[1]) * 60 + Number(matched[2]);
        const end = Number(matched[3]) * 60 + Number(matched[4]);
        const current = now.getHours() * 60 + now.getMinutes();
        return current >= start && current <= end;
      }
    }

    if (key === 'sat') return item.saturdayOpen;
    if (key === 'sun') return item.sundayOpen;
    return true;
  }

  function isRecentOpening(openDate) {
    if (!openDate) return false;
    const openedAt = parseDate(openDate);
    if (!openedAt) return false;
    const now = new Date();
    const days = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 540;
  }

  function parseDate(value) {
    if (!value) return new Date('2000-01-01');
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value);
    if (/^\d{8}$/.test(value)) {
      return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`);
    }
    return new Date(value);
  }

  function formatDate(value) {
    const date = parseDate(value);
    if (Number.isNaN(date.getTime())) return '개원일 확인 중';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function buildSpecialFilterLabel(filter) {
    switch (filter) {
      case 'sat': return '토요일 진료';
      case 'sun': return '일요일 진료';
      case 'night': return '야간 진료';
      case 'new': return '신규 개원';
      case 'recent': return '최근 개원';
      case 'parking': return '주차 가능';
      case 'specialist': return '전문의';
      case 'emergency': return '응급 진료';
      default: return '';
    }
  }

  function uniqueValues(values) {
    return Array.from(new Set(values));
  }

  function firstToken(value) {
    return String(value || '').split(',')[0].trim();
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('ko-KR');
  }

  function findDepartmentNameLegacy(id) {
    return DEPARTMENTS.find((item) => item.id === id)?.name || '진료과';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
});
