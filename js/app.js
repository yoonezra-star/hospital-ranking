document.addEventListener('DOMContentLoaded', () => {
  const state = {
    currentFilters: { region: 'all', district: 'all', town: 'all', department: 'all', type: 'all' },
    currentSort: 'score',
    currentPage: 1,
    totalCount: 0,
    allFetchedHospitals: [],
    isApiAvailable: false,
    isSearchActive: false,
    detailSummaryCache: new Map(),
    detailSummaryInflight: new Map(),
    equipSummaryCache: new Map(),
    equipSummaryInflight: new Map(),
    searchSuggestions: [],
    activeSearchSuggestionIndex: -1,
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const ui = {
    header: $('#header'),
    themeToggle: $('#theme-toggle'),
    mobileMenuBtn: $('#mobile-menu-btn'),
    navLinks: $('#nav-links'),
    heroSearch: $('#hero-search'),
    searchBtn: $('#search-btn'),
    searchSuggestionList: $('#search-suggestions'),
    clearSearchBtn: $('#clear-search'),
    searchResults: $('#search-results'),
    searchResultsList: $('#search-results-list'),
    searchQueryDisplay: $('#search-query-display'),
    searchIntentSummary: $('#search-intent-summary'),
    searchRefineBar: $('#search-refine-bar'),
    searchResultCount: $('#search-result-count'),
    departmentGrid: $('#department-grid'),
    regionFilter: $('#region-filter'),
    districtFilter: $('#district-filter'),
    townFilter: $('#town-filter'),
    heroRegionFilter: $('#hero-region-filter'),
    heroDistrictFilter: $('#hero-district-filter'),
    heroTownFilter: $('#hero-town-filter'),
    heroLocationApply: $('#hero-location-apply'),
    typeFilter: $('#type-filter'),
    sortFilter: $('#sort-filter'),
    rankingList: $('#ranking-list'),
    rankingCount: $('#ranking-count'),
    rankingLoader: $('#ranking-loader'),
    reviewsList: $('#reviews-list'),
    newHospitalsList: $('#new-hospitals-list'),
    currentOpenList: $('#current-open-list'),
    saturdayOpenList: $('#saturday-open-list'),
    nightOpenList: $('#night-open-list'),
    recentOpenList: $('#recent-open-list'),
    regionSpotlightList: $('#region-spotlight-list'),
    guideSpotlightList: $('#guide-spotlight-list'),
    loadMoreBtn: $('#load-more-btn'),
    dataSourceBadge: $('#data-source-badge'),
    dataSourceNote: $('#data-source-note'),
    reviewsTitle: $('#reviews h2'),
  };

  const SEARCH_AUTOCOMPLETE_ITEMS = [
    '서울 치과',
    '강남 치과',
    '강남 피부과 야간',
    '서초 정형외과',
    '송파 소아과',
    '송파 소아과 일요일',
    '분당 내과',
    '마포 치과 주차',
    '여의도 통증의학과',
    '서울 재활의학과',
    '경기 정형외과 토요일',
    '야간 피부과',
    '토요일 정형외과',
    '일요일 소아과',
    '응급 진료 병원',
    '주차 가능한 치과',
  ];

  applyInitialRouteState();

  initTheme();
  initHeader();
  initCounters();
  initScrollAnimations();
  renderDepartments();
  populateRegionFilter();
  void loadRankingData();
  void renderReviews();
  renderNewHospitals();
  renderQuickAccess();
  renderLandingSections();
  bindEvents();
  triggerInitialKeywordSearch();

  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || 'light';

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    updateThemeIcon(nextTheme);
  }

  function updateThemeIcon(theme) {
    if (ui.themeToggle) {
      ui.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function initHeader() {
    if (!ui.header) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;

      requestAnimationFrame(() => {
        ui.header.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
      });

      ticking = true;
    });
  }

  function initCounters() {
    const counters = $$('.stat-number[data-target]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach((counter) => observer.observe(counter));
  }

  function animateCounter(element) {
    const target = parseInt(element.dataset.target || '0', 10);
    const duration = 1600;
    const startedAt = performance.now();

    function step(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(target * eased);

      element.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
        return;
      }

      element.textContent = `${target.toLocaleString()}${target > 100 ? '+' : ''}`;
    }

    requestAnimationFrame(step);
  }

  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    $$('.fade-up').forEach((element) => observer.observe(element));
  }

  function observeNewElements(container) {
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    container.querySelectorAll('.fade-up').forEach((element) => observer.observe(element));
  }

  function renderDepartments() {
    if (!ui.departmentGrid || typeof DEPARTMENTS === 'undefined') return;

    ui.departmentGrid.innerHTML = DEPARTMENTS.map((department, index) => `
      <div class="dept-card fade-up delay-${index % 4}" data-dept-id="${department.id}" tabindex="0" role="button" aria-label="${escapeHtml(department.name)} 병원 찾기">
        <div class="dept-icon" style="background:${department.color}15; color:${department.color};">
          ${department.icon}
        </div>
        <span class="dept-name">${escapeHtml(department.name)}</span>
      </div>
    `).join('');

    observeNewElements(ui.departmentGrid);
  }

  function populateRegionFilter() {
    if (typeof REGIONS === 'undefined') return;

    [ui.regionFilter, ui.heroRegionFilter].filter(Boolean).forEach((select) => {
      REGIONS.forEach((region) => {
        const option = document.createElement('option');
        option.value = region.name;
        option.textContent = region.name;
        select.appendChild(option);
      });
    });

    syncFilterControls();
  }

  function populateDistrictFilter() {
    if (!ui.districtFilter && !ui.heroDistrictFilter) return;

    const districts = getFilterSourceHospitals()
      .filter((hospital) => state.currentFilters.region === 'all' || hospital.region === state.currentFilters.region)
      .map((hospital) => String(hospital.district || '').trim())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .sort((left, right) => left.localeCompare(right, 'ko'));

    [ui.districtFilter, ui.heroDistrictFilter].filter(Boolean).forEach((select) => {
      select.innerHTML = '<option value="all">시/군/구 선택</option>';
      districts.forEach((district) => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        select.appendChild(option);
      });
    });

    const enabled = state.currentFilters.region !== 'all' && districts.length > 0;
    [ui.districtFilter, ui.heroDistrictFilter].filter(Boolean).forEach((select) => {
      select.disabled = !enabled;
    });
    if (!enabled) {
      if (state.currentFilters.region === 'all') {
        state.currentFilters.district = 'all';
      }
    } else if (!districts.includes(state.currentFilters.district) && state.allFetchedHospitals.length > 0) {
      state.currentFilters.district = 'all';
    }

    [ui.districtFilter, ui.heroDistrictFilter].filter(Boolean).forEach((select) => {
      select.value = districts.includes(state.currentFilters.district) ? state.currentFilters.district : 'all';
    });
  }

  function populateTownFilter() {
    if (!ui.townFilter && !ui.heroTownFilter) return;

    const towns = getFilterSourceHospitals()
      .filter((hospital) => state.currentFilters.region === 'all' || hospital.region === state.currentFilters.region)
      .filter((hospital) => state.currentFilters.district === 'all' || hospital.district === state.currentFilters.district)
      .map((hospital) => String(hospital.town || '').trim())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .sort((left, right) => left.localeCompare(right, 'ko'));

    [ui.townFilter, ui.heroTownFilter].filter(Boolean).forEach((select) => {
      select.innerHTML = '<option value="all">읍/면/동 선택</option>';
      towns.forEach((town) => {
        const option = document.createElement('option');
        option.value = town;
        option.textContent = town;
        select.appendChild(option);
      });
    });

    const enabled = state.currentFilters.region !== 'all' && state.currentFilters.district !== 'all' && towns.length > 0;
    [ui.townFilter, ui.heroTownFilter].filter(Boolean).forEach((select) => {
      select.disabled = !enabled;
    });
    if (!enabled) {
      if (state.currentFilters.district === 'all') {
        state.currentFilters.town = 'all';
      }
    } else if (!towns.includes(state.currentFilters.town) && state.allFetchedHospitals.length > 0) {
      state.currentFilters.town = 'all';
    }

    [ui.townFilter, ui.heroTownFilter].filter(Boolean).forEach((select) => {
      select.value = towns.includes(state.currentFilters.town) ? state.currentFilters.town : 'all';
    });
  }

  function showLoading(show) {
    if (!ui.rankingLoader) return;
    ui.rankingLoader.style.display = show ? 'flex' : 'none';
  }

  function updateLoadMore() {
    if (!ui.loadMoreBtn) return;

    const hasLocationDrilldown = state.currentFilters.district !== 'all' || state.currentFilters.town !== 'all';
    const hasMore = !hasLocationDrilldown && state.isApiAvailable && (state.currentPage * 20 < state.totalCount);
    ui.loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    ui.loadMoreBtn.textContent = `더보기 (${state.allFetchedHospitals.length} / ${state.totalCount.toLocaleString()})`;
  }

  function updateDataBadge(fromMock) {
    if (!ui.dataSourceBadge) return;

    if (fromMock) {
      ui.dataSourceBadge.textContent = '보강 데이터 표시';
      ui.dataSourceBadge.className = 'data-badge mock';
      if (ui.dataSourceNote) {
        ui.dataSourceNote.textContent = '실시간 공공 API가 지연되면 검수한 보강 데이터와 요약 정보를 먼저 보여줍니다.';
      }
      return;
    }

    ui.dataSourceBadge.textContent = '공공데이터 실시간 연동';
    ui.dataSourceBadge.className = 'data-badge live';
    if (ui.dataSourceNote) {
      ui.dataSourceNote.textContent = '건강보험심사평가원 등 공공 API 응답을 우선 반영해 병원 목록을 보여주고 있습니다.';
    }
  }

  async function loadRankingData(append = false) {
    showLoading(true);

    const params = {
      page: state.currentPage,
      limit: state.currentFilters.district !== 'all' || state.currentFilters.town !== 'all' ? 200 : 20,
    };

    if (state.currentFilters.region !== 'all') {
      params.region = state.currentFilters.region;
    }
    if (state.currentFilters.department !== 'all') {
      params.department = state.currentFilters.department;
    }
    if (state.currentFilters.type !== 'all') {
      params.type = state.currentFilters.type;
    }

    const result = await HospitalAPI.fetchHospitals(params);
    const mergedHospitals = mergeHospitalsWithFallback(result.hospitals);
    const filteredHospitals = typeof SearchEngine !== 'undefined'
      ? SearchEngine.filterHospitals(mergedHospitals, state.currentFilters)
      : mergedHospitals;

    state.isApiAvailable = !result.fromMock;
    state.totalCount = filteredHospitals.length;
    state.allFetchedHospitals = append
      ? [...state.allFetchedHospitals, ...filteredHospitals]
      : filteredHospitals;

    populateDistrictFilter();
    populateTownFilter();

    const sortedHospitals = typeof SearchEngine !== 'undefined'
      ? SearchEngine.sortHospitals(state.allFetchedHospitals, state.currentSort)
      : [...state.allFetchedHospitals];
    renderRankingCards(sortedHospitals);
    renderQuickAccess();
    renderLandingSections();
    updateDataBadge(result.fromMock);
    updateMapHospitals(sortedHospitals);
    showLoading(false);
    updateLoadMore();
    syncListingQuery();
  }

  function renderLandingSections() {
    const contentApi = getHospitalContent();
    const hospitals = getFeaturedHospitalsSource();

    if (ui.regionSpotlightList) {
      const sections = contentApi?.getRegionalLandingSections?.() || [];
      ui.regionSpotlightList.innerHTML = sections.map((section, index) => {
        const count = countLandingMatches(hospitals, section);
        return `
          <button
            type="button"
            class="landing-card fade-up delay-${index % 3}"
            data-landing-region="${escapeHtml(section.region || '')}"
            data-landing-department="${escapeHtml(section.department || '')}"
            data-landing-type="${escapeHtml(section.type || '')}"
          >
            <span class="landing-card-badge">${escapeHtml(section.badge || '지역별 탐색')}</span>
            <h3>${escapeHtml(section.title)}</h3>
            <p>${escapeHtml(section.description)}</p>
            <div class="landing-card-footer">
              <span>필터를 적용해 병원 목록으로 바로 이동</span>
              <span class="landing-card-count">${count.toLocaleString()}곳</span>
            </div>
          </button>
        `;
      }).join('');
      observeNewElements(ui.regionSpotlightList);
    }

    if (ui.guideSpotlightList) {
      const sections = contentApi?.getGuideSpotlights?.() || [];
      ui.guideSpotlightList.innerHTML = sections.map((section, index) => `
        <a href="${escapeHtml(section.href || '#')}" class="landing-card fade-up delay-${index % 3}">
          <span class="landing-card-badge">${escapeHtml(section.badge || '바로가기')}</span>
          <h3>${escapeHtml(section.title)}</h3>
          <p>${escapeHtml(section.description)}</p>
          <div class="landing-card-footer">
            <span>가이드 또는 빠른 탐색 섹션으로 이동</span>
            <span class="landing-card-count">열기</span>
          </div>
        </a>
      `).join('');
      observeNewElements(ui.guideSpotlightList);
    }
  }

  function countLandingMatches(hospitals, section) {
    return hospitals.filter((hospital) => {
      if (section.region && hospital.region !== section.region) {
        return false;
      }
      if (section.department && hospital.departmentId !== section.department) {
        return false;
      }
      if (section.type && statefulRankingGroup(hospital) !== section.type) {
        return false;
      }
      return true;
    }).length;
  }

  function renderRankingCards(hospitals) {
    if (!ui.rankingList || !ui.rankingCount) return;

    if (hospitals.length === 0) {
      ui.rankingCount.innerHTML = '조건에 맞는 병원을 찾지 못했습니다.';
      ui.rankingList.classList.remove('ranking-group-list');
      ui.rankingList.innerHTML = buildEmptyState('조건에 맞는 병원이 없습니다.', '필터를 바꾸거나 다른 키워드로 다시 검색해보세요.');
      return;
    }

    if (shouldRenderGroupedRanking()) {
      renderGroupedRankingCards(hospitals);
      void hydrateHospitalCardDetails(hospitals, ui.rankingList, 18);
      return;
    }

    ui.rankingList.classList.remove('ranking-group-list');
    ui.rankingCount.innerHTML = state.isApiAvailable
      ? `전국 <strong>${state.totalCount.toLocaleString()}</strong>개 병원 중 <strong>${hospitals.length}</strong>개 표시`
      : `총 <strong>${hospitals.length}</strong>개 병원 (샘플 데이터)`;
    ui.rankingList.innerHTML = hospitals.map((hospital, index) => buildHospitalCard(hospital, index + 1)).join('');
    observeNewElements(ui.rankingList);
    void hydrateHospitalCardDetails(hospitals, ui.rankingList, 18);
  }

  function shouldRenderGroupedRanking() {
    return state.currentSort === 'score' && state.currentFilters.type === 'all';
  }

  function renderGroupedRankingCards(hospitals) {
    const groups = [
      {
        key: 'hospital',
        title: '종합병원·병원',
        description: '병원급 이상 의료기관 중심 정렬',
        items: hospitals.filter((hospital) => getRankingGroup(hospital) === 'hospital').slice(0, 8),
      },
      {
        key: 'clinic',
        title: '의원',
        description: '동네의원과 전문 클리닉',
        items: hospitals.filter((hospital) => getRankingGroup(hospital) === 'clinic').slice(0, 8),
      },
      {
        key: 'dental',
        title: '치과',
        description: '치과의원 및 치과병원',
        items: hospitals.filter((hospital) => getRankingGroup(hospital) === 'dental').slice(0, 8),
      },
      {
        key: 'korean',
        title: '한의원·한방병원',
        description: '한방 진료 기관',
        items: hospitals.filter((hospital) => getRankingGroup(hospital) === 'korean').slice(0, 8),
      },
    ].filter((group) => group.items.length > 0);

    ui.rankingList.classList.add('ranking-group-list');
    ui.rankingCount.innerHTML = `병원급별 섹션 <strong>${groups.length}</strong>개 / 전체 <strong>${hospitals.length}</strong>곳`;
    ui.rankingList.innerHTML = groups.map((group) => `
      <section class="ranking-group fade-up" data-ranking-group="${group.key}">
        <div class="ranking-group-header">
          <div>
            <h3>${group.title}</h3>
            <p>${group.description}</p>
          </div>
          <span class="ranking-group-count">${group.items.length}곳</span>
        </div>
        <div class="ranking-group-grid">
          ${group.items.map((hospital, index) => buildHospitalCard(hospital, index + 1)).join('')}
        </div>
      </section>
    `).join('');

    observeNewElements(ui.rankingList);
  }

  function getRankingGroup(hospital) {
    const type = hospital.type || '';
    const departmentId = hospital.departmentId || '';

    if (departmentId === 'dental' || type.includes('치과')) return 'dental';
    if (departmentId === 'korean' || type.includes('한의') || type.includes('한방')) return 'korean';
    if (type === '의원') return 'clinic';
    if (type.includes('병원') || type.includes('종합') || departmentId === 'general') return 'hospital';
    return 'clinic';
  }

  function statefulRankingGroup(hospital) {
    return getRankingGroup(hospital);
  }

  function buildHospitalCard(hospital, rank) {
    const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-default';
    const scorePercent = Math.max(0, Math.min(100, ((hospital.score || 0) / 5) * 100));
    const tags = [];
    const subinfo = buildHospitalSubinfo(hospital);
    const featureNote = buildHospitalFeatureNote(hospital);
    const focusNote = buildHospitalFocusNote(hospital);
    const visitPrepNote = buildHospitalVisitPrepNote(hospital);
    const insightItems = buildHospitalInsightItems(hospital);
    const highlightItems = buildHospitalHighlightItems(hospital);
    const factItems = buildHospitalFactItems(hospital);
    const statusItems = buildHospitalStatusItems(hospital);
    const statusSummary = buildHospitalStatusSummary(hospital);
    const trustBadges = buildHospitalTrustBadges(hospital);
    const dataSummary = buildHospitalDataSummary(hospital);
    const evidenceSummary = buildHospitalEvidenceSummary(hospital);
    const decisionSummary = buildHospitalDecisionSummary(hospital);

    if (hospital.saturdayOpen) tags.push('<span class="tag tag-sat">토요일 진료</span>');
    if (hospital.nightOpen) tags.push('<span class="tag tag-night">야간 진료</span>');
    if (hospital.sundayOpen) tags.push('<span class="tag tag-sun">일요일 진료</span>');
    if (hospital.url) tags.push('<span class="tag tag-site">공식 홈페이지</span>');
    if (!hasKnownOperationalData(hospital)) tags.push('<span class="tag tag-pending">운영시간 확인 중</span>');

    return `
      <article class="hospital-card fade-up" data-hospital-id="${escapeHtml(hospital.id)}">
        <div class="rank-badge ${rankClass}">${rank}</div>
        <div class="hospital-info">
          <div class="hospital-name">
            ${escapeHtml(hospital.name)}
            <span class="hospital-type-tag">${escapeHtml(hospital.type)}</span>
          </div>
          <div class="hospital-address">주소 ${escapeHtml(hospital.address)}</div>
          ${subinfo ? `<div class="hospital-subinfo" data-hospital-subinfo>${subinfo}</div>` : ''}
          <div class="hospital-trust-row" data-hospital-trust>${renderHospitalTrustBadges(trustBadges)}</div>
          <div class="hospital-status-row" data-hospital-status>${renderHospitalStatusBadges(statusItems)}</div>
          <p class="hospital-status-summary" data-hospital-status-summary>${escapeHtml(statusSummary)}</p>
          <div class="hospital-highlights" data-hospital-highlights${highlightItems.length ? '' : ' hidden'}>
            ${highlightItems.map((item) => `<span class="hospital-highlight">${escapeHtml(item)}</span>`).join('')}
          </div>
          <div class="hospital-fact-grid" data-hospital-facts>${renderHospitalFactGrid(factItems)}</div>
          ${featureNote ? `<p class="hospital-feature-note">${escapeHtml(featureNote)}</p>` : ''}
          ${focusNote ? `<p class="hospital-focus-note">${escapeHtml(focusNote)}</p>` : ''}
          ${visitPrepNote ? `<p class="hospital-visit-prep">${escapeHtml(visitPrepNote)}</p>` : ''}
          <div class="hospital-insight-list" data-hospital-insights${insightItems.length ? '' : ' hidden'}>${renderHospitalInsightList(insightItems)}</div>
          <p class="hospital-data-summary${dataSummary ? '' : ' is-pending'}" data-hospital-summary>${escapeHtml(dataSummary || '주차, 접수, 운영 정보를 불러오는 중입니다.')}</p>
          ${decisionSummary ? `<p class="hospital-decision-summary">${escapeHtml(decisionSummary)}</p>` : ''}
          ${evidenceSummary ? `<p class="hospital-evidence-summary">${escapeHtml(evidenceSummary)}</p>` : ''}
          <div class="hospital-meta" data-hospital-meta>
            <div class="meta-item">
              <span class="meta-icon">평점</span>
              <span class="meta-value">${escapeHtml(hospital.score)}</span>
            </div>
            ${hospital.reviewCount ? `<div class="meta-item"><span class="meta-icon">리뷰</span><span class="meta-value">${escapeHtml(Number(hospital.reviewCount).toLocaleString())}</span><span class="meta-label">개</span></div>` : ''}
            <div class="meta-item">
              <span class="meta-icon">전문의</span>
              <span class="meta-value">${escapeHtml(hospital.specialistCount || 0)}</span>
              <span class="meta-label">명</span>
            </div>
            ${hospital.phone ? `<div class="meta-item"><span class="meta-icon">전화</span><span class="meta-value">${escapeHtml(hospital.phone)}</span></div>` : ''}
          </div>
          <div class="score-bar-container">
            <div class="score-bar">
              <div class="score-fill" style="width:${scorePercent}%"></div>
            </div>
            <span class="score-value">${escapeHtml(hospital.score)}</span>
          </div>
          ${tags.length ? `<div class="hospital-tags">${tags.join('')}</div>` : ''}
        </div>
      </article>
    `;
  }

  function buildHospitalSubinfo(hospital) {
    const bits = [];
    const location = [hospital.region, hospital.district].filter(Boolean).join(' / ');
    if (location) bits.push(location);
    if (hospital.openDate) bits.push(`개원 ${formatDate(hospital.openDate)}`);
    if (hospital.url) bits.push('공식 홈페이지');
    return bits.map((bit) => escapeHtml(bit)).join(' · ');
  }

  function buildHospitalHighlightItems(hospital, detailData) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    const items = [];
    const parkingText = getHospitalParkingLabel(hospital, detailData);

    if (Array.isArray(profile?.highlightPoints) && profile.highlightPoints.length > 0) {
      items.push(...profile.highlightPoints.slice(0, 2));
    }
    if (hospital.subway) items.push(hospital.subway);
    if (parkingText) items.push(parkingText);
    if (hospital.equipment) items.push(`주요 장비 ${String(hospital.equipment).split(',')[0].trim()}`);
    if (toPositiveNumber(hospital.bedCount) > 0) items.push(`병상 ${hospital.bedCount}개`);
    if (Array.isArray(detailData?.emergencySummary) && detailData.emergencySummary.length > 0) {
      items.push('응급 안내');
    } else if (hospital.hasEmergency) {
      items.push('응급 진료');
    }
    if (hospital.openDate && isRecentHospital(hospital.openDate)) {
      items.push('최근 개원');
    }

    return uniqueStrings(items).slice(0, 4);
  }

  function buildHospitalDataSummary(hospital, detailData) {
    const parts = [];
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);

    if (Array.isArray(detailData?.receptionSummary) && detailData.receptionSummary.length > 0) {
      parts.push(...detailData.receptionSummary.slice(0, 2));
    }

    const parkingText = getHospitalParkingLabel(hospital, detailData);
    if (parkingText) parts.push(parkingText);

    if (Array.isArray(detailData?.emergencySummary) && detailData.emergencySummary.length > 0) {
      parts.push(detailData.emergencySummary[0]);
    }

    if (parts.length === 0) {
      if (hospital.saturdayOpen) parts.push('토요일 진료');
      if (hospital.nightOpen) parts.push('야간 진료');
      if (hospital.sundayOpen) parts.push('일요일 진료');
      if (hospital.subway) parts.push(hospital.subway);
      if (hospital.equipment) parts.push(`주요 장비 ${String(hospital.equipment).split(',')[0].trim()}`);
      if (toPositiveNumber(hospital.bedCount) > 0) parts.push(`병상 ${hospital.bedCount}개`);
      if (Array.isArray(profile?.primaryServices) && profile.primaryServices.length > 0) {
        parts.push(`주요 ${profile.primaryServices[0]}`);
      }
      if (!hasKnownOperationalData(hospital)) parts.push('운영시간 공공데이터 확인 중');
    }

    return uniqueStrings(parts).slice(0, 3).join(' / ');
  }

  function getHospitalParkingLabel(hospital, detailData) {
    if (Array.isArray(detailData?.parkingSummary) && detailData.parkingSummary.length > 0) {
      return detailData.parkingSummary[0];
    }
    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      return `주차 가능 ${hospital.parkingCapacity}대`;
    }
    if (hospital.parkingFee) {
      return `${hospital.parkingFee} 주차`;
    }
    return '';
  }

  function buildHospitalFeatureNote(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    if (!profile?.primaryServices?.length) {
      return '';
    }

    return `주요 진료: ${profile.primaryServices.slice(0, 3).join(', ')}`;
  }

  function buildHospitalFocusNote(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    if (!profile?.visitTargets?.length) {
      return '';
    }

    return `추천 상황: ${profile.visitTargets.slice(0, 2).join(', ')}`;
  }

  function buildHospitalVisitPrepNote(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    if (!profile) {
      return '';
    }

    const documents = Array.isArray(profile.documents) ? profile.documents.slice(0, 3) : [];
    if (documents.length > 0) {
      return `방문 준비: ${documents.join(', ')}`;
    }

    if (profile.reservation) {
      return profile.reservation;
    }

    return '';
  }

  function buildHospitalInsightItems(hospital, detailData) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    const items = [];
    const receptionText = Array.isArray(detailData?.receptionSummary) && detailData.receptionSummary.length > 0
      ? detailData.receptionSummary[0]
      : profile?.reservation;
    const documentItems = Array.isArray(profile?.documents)
      ? uniqueStrings(profile.documents).slice(0, 2)
      : [];
    const transportItems = [];
    const parkingText = getHospitalParkingLabel(hospital, detailData);

    if (receptionText) {
      items.push({ label: '접수', value: receptionText });
    }

    if (documentItems.length > 0) {
      items.push({ label: '준비', value: documentItems.join(', ') });
    }

    if (parkingText) transportItems.push(parkingText);
    if (profile?.transport) {
      transportItems.push(profile.transport);
    } else if (hospital.subway) {
      transportItems.push(hospital.subway);
    } else if (hospital.address) {
      transportItems.push(`${hospital.address} 기준 동선을 확인해보세요.`);
    }

    if (transportItems.length > 0) {
      items.push({
        label: '이동',
        value: uniqueStrings(transportItems).slice(0, 2).join(' / '),
      });
    }

    if (
      items.length < 3
      && (hospital.equipment || toPositiveNumber(hospital.bedCount) > 0 || hospital.area)
    ) {
      const facilityParts = [];
      if (hospital.equipment) facilityParts.push(String(hospital.equipment).split(',')[0].trim());
      if (toPositiveNumber(hospital.bedCount) > 0) facilityParts.push(`병상 ${hospital.bedCount}개`);
      if (hospital.area) facilityParts.push(`면적 ${hospital.area}`);
      items.push({ label: '시설', value: uniqueStrings(facilityParts).slice(0, 3).join(' / ') });
    }

    if (items.length < 3 && Array.isArray(profile?.visitTargets) && profile.visitTargets.length > 0) {
      items.push({ label: '추천', value: profile.visitTargets[0] });
    }

    return items.slice(0, 3);
  }

  function buildHospitalFactItems(hospital, detailData) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    const parkingText = getHospitalParkingLabel(hospital, detailData);
    const operationItems = [];

    if (hospital.saturdayOpen) operationItems.push('토요일');
    if (hospital.sundayOpen) operationItems.push('일요일');
    if (hospital.nightOpen) operationItems.push('야간');
    if (hospital.hasEmergency) operationItems.push('응급');

    const facilityItems = [];
    if (parkingText) facilityItems.push(parkingText);
    if (hospital.subway) facilityItems.push(hospital.subway);
    if (hospital.equipment) facilityItems.push(`장비 ${String(hospital.equipment).split(',')[0].trim()}`);
    if (toPositiveNumber(hospital.roomCount) > 0) facilityItems.push(`진료실 ${hospital.roomCount}개`);
    if (toPositiveNumber(hospital.bedCount) > 0) facilityItems.push(`병상 ${hospital.bedCount}개`);
    if (hospital.area) facilityItems.push(`면적 ${hospital.area}`);

    const items = [
      {
        label: '핵심 진료',
        value: Array.isArray(profile?.primaryServices) && profile.primaryServices.length > 0
          ? profile.primaryServices.slice(0, 2).join(', ')
          : (hospital.department || hospital.type || '진료 정보 확인 필요'),
      },
      {
        label: '방문 준비',
        value: Array.isArray(profile?.documents) && profile.documents.length > 0
          ? profile.documents.slice(0, 2).join(', ')
          : '신분증, 기존 검사 결과',
      },
      {
        label: '운영·시설',
        value: uniqueStrings([...operationItems, ...facilityItems]).slice(0, 2).join(' / ')
          || '운영 정보 확인 중',
      },
    ];

    return items.filter((item) => item.value);
  }

  function buildHospitalStatusItems(hospital, now = new Date()) {
    const items = [];
    const hoursValue = getHoursByDay(hospital.hours, now.getDay());
    const hasTodaySchedule = Boolean(parseOperatingRange(hoursValue));

    if (isHospitalOpenNow(hospital, now)) {
      items.push({ label: '현재 진료중', className: 'is-open' });
    } else if (hasTodaySchedule || isAvailableToday(hospital, now)) {
      items.push({ label: '오늘 가능', className: 'is-today' });
    } else if (hasKnownOperationalData(hospital)) {
      items.push({ label: '오늘 마감', className: 'is-closed' });
    } else {
      items.push({ label: '운영 확인중', className: 'is-pending' });
    }

    if (hospital.saturdayOpen) items.push({ label: '토요', className: 'is-option' });
    if (hospital.nightOpen) items.push({ label: '야간', className: 'is-option' });
    if (hospital.sundayOpen) items.push({ label: '일요', className: 'is-option' });

    return items.slice(0, 4);
  }

  function buildHospitalStatusSummary(hospital, now = new Date()) {
    const hoursValue = getHoursByDay(hospital.hours, now.getDay());
    const hasTodaySchedule = Boolean(parseOperatingRange(hoursValue));

    if (hasTodaySchedule) {
      return isHospitalOpenNow(hospital, now)
        ? `오늘 ${hoursValue} 기준 진료 중입니다.`
        : `오늘 운영 시간 ${hoursValue} 기준으로 확인했습니다.`;
    }

    if (isAvailableToday(hospital, now)) {
      if (now.getDay() === 6 && hospital.saturdayOpen) return '오늘 토요일 진료 병원으로 분류됩니다.';
      if (now.getDay() === 0 && hospital.sundayOpen) return '오늘 일요일 진료 병원으로 분류됩니다.';
      if (hospital.nightOpen) return '오늘 야간 진료 가능 병원으로 분류됩니다.';
      return '오늘 진료 가능 여부를 공개 데이터 기준으로 확인했습니다.';
    }

    return hasKnownOperationalData(hospital)
      ? '오늘 운영 정보는 확인되지만 현재 진료 시간은 아닙니다.'
      : '운영 시간 공공데이터를 확인하는 중입니다.';
  }

  function buildHospitalTrustBadges(hospital, detailData) {
    const completeness = buildHospitalCompletenessBadge(hospital, detailData);
    const operation = buildHospitalOperationBadge(hospital, detailData);
    return [completeness, operation].filter(Boolean);
  }

  function buildHospitalCompletenessBadge(hospital, detailData) {
    const checks = [
      Boolean(hospital?.address),
      Boolean(hospital?.phone),
      Boolean(hospital?.url),
      Boolean(hospital?.subway || hospital?.region || hospital?.district),
      Boolean(hospital?.openDate),
      Number(hospital?.reviewCount || 0) > 0 || Number(hospital?.specialistCount || 0) > 0,
      hasKnownOperationalData(hospital) || hasDetailedHours(detailData),
      Boolean(getHospitalParkingLabel(hospital, detailData))
        || Boolean(hospital?.equipment)
        || toPositiveNumber(hospital?.roomCount) > 0
        || toPositiveNumber(hospital?.bedCount) > 0,
    ];
    const score = checks.filter(Boolean).length;

    if (score >= 7) {
      return { label: '정보 충실도 높음', className: 'is-high' };
    }
    if (score >= 5) {
      return { label: '정보 충실도 보통', className: 'is-medium' };
    }
    return { label: '기본 정보 중심', className: 'is-basic' };
  }

  function buildHospitalOperationBadge(hospital, detailData) {
    const hasDetailedOperation = hasDetailedHours(detailData);
    const hasConfirmedOperation = hasKnownOperationalData(hospital) || hasDetailedOperation;
    const hasOperationSignals = hasConfirmedOperation
      || hospital?.saturdayOpen
      || hospital?.sundayOpen
      || hospital?.nightOpen
      || (Array.isArray(detailData?.receptionSummary) && detailData.receptionSummary.length > 0);

    if (hasDetailedOperation) {
      return { label: '운영시간 상세 확인', className: 'is-verified' };
    }
    if (hasConfirmedOperation) {
      return { label: '운영시간 확인', className: 'is-verified' };
    }
    if (hasOperationSignals) {
      return { label: '운영 일부 확인', className: 'is-partial' };
    }
    return { label: '운영 확인중', className: 'is-pending' };
  }

  function hasDetailedHours(detailData) {
    const hours = detailData?.hours;
    if (!hours || typeof hours !== 'object') {
      return false;
    }

    return Object.values(hours).some((value) => {
      const text = String(value || '').trim();
      return text && !isClosedHoursText(text);
    });
  }

  function renderHospitalTrustBadges(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    return items.map((item) => `
      <span class="hospital-trust-badge ${escapeHtml(item.className || '')}">${escapeHtml(item.label)}</span>
    `).join('');
  }

  function renderHospitalStatusBadges(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    return items.map((item) => `
      <span class="hospital-status-badge ${escapeHtml(item.className || '')}">${escapeHtml(item.label)}</span>
    `).join('');
  }

  function renderHospitalFactGrid(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    return items.map((item) => `
      <div class="hospital-fact-item">
        <span class="hospital-fact-label">${escapeHtml(item.label)}</span>
        <strong class="hospital-fact-value">${escapeHtml(item.value)}</strong>
      </div>
    `).join('');
  }

  function renderHospitalInsightList(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    return items.map((item) => `
      <div class="hospital-insight-item">
        <span class="hospital-insight-label">${escapeHtml(item.label)}</span>
        <span class="hospital-insight-value">${escapeHtml(item.value)}</span>
      </div>
    `).join('');
  }

  function buildHospitalEvidenceSummary(hospital, detailData) {
    const parts = [];

    if (Number(hospital.specialistCount || 0) > 0) {
      parts.push(`전문의 ${hospital.specialistCount}명`);
    }
    if (hospital.subway) {
      parts.push(hospital.subway);
    }
    if (toPositiveNumber(hospital.roomCount) > 0) {
      parts.push(`진료실 ${hospital.roomCount}개`);
    }
    if (toPositiveNumber(hospital.bedCount) > 0) {
      parts.push(`병상 ${hospital.bedCount}개`);
    }
    if (hospital.area) {
      parts.push(`면적 ${hospital.area}`);
    }
    if (hospital.equipment) {
      parts.push(`장비 ${String(hospital.equipment).split(',')[0].trim()}`);
    }
    if (Array.isArray(detailData?.receptionSummary) && detailData.receptionSummary.length > 0) {
      parts.push(detailData.receptionSummary[0]);
    }
    if (Array.isArray(detailData?.parkingSummary) && detailData.parkingSummary.length > 0) {
      parts.push(detailData.parkingSummary[0]);
    }
    if (hospital.openDate) {
      parts.push(`개원 ${formatDate(hospital.openDate)}`);
    }

    return uniqueStrings(parts).slice(0, 4).join(' / ');
  }

  function buildHospitalDecisionSummary(hospital, detailData) {
    const parts = [];

    if (hospital.region || hospital.district) {
      parts.push([hospital.region, hospital.district].filter(Boolean).join(' · '));
    }

    if (hospital.subway) {
      parts.push(hospital.subway);
    }

    if (hospital.openDate) {
      const openYear = new Date(hospital.openDate).getFullYear();
      if (Number.isFinite(openYear)) {
        parts.push(`${openYear}년 개원`);
      }
    }

    if (Number(hospital.specialistCount || 0) > 0) {
      parts.push(`전문의 ${hospital.specialistCount}명`);
    }

    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      parts.push(`주차 ${hospital.parkingCapacity}대`);
    } else if (hospital.parkingFee) {
      parts.push(`${hospital.parkingFee} 주차`);
    } else if (Array.isArray(detailData?.parkingSummary) && detailData.parkingSummary.length > 0) {
      parts.push(detailData.parkingSummary[0]);
    }

    if (hospital.nightOpen) {
      parts.push('야간 진료');
    } else if (hospital.saturdayOpen) {
      parts.push('토요 진료');
    } else if (hospital.sundayOpen) {
      parts.push('일요 진료');
    }

    if (Array.isArray(detailData?.emergencySummary) && detailData.emergencySummary.length > 0) {
      parts.push(detailData.emergencySummary[0]);
    }

    return uniqueStrings(parts).slice(0, 4).join(' · ');
  }

  function buildHospitalMetaItems(hospital) {
    const items = [];
    if (hospital.score) items.push(`평점 ${hospital.score}`);
    if (hospital.reviewCount) items.push(`리뷰 ${Number(hospital.reviewCount).toLocaleString()}개`);
    if (hospital.specialistCount) items.push(`전문의 ${Number(hospital.specialistCount).toLocaleString()}명`);
    if (hospital.phone) items.push(hospital.phone);
    if (hospital.url) items.push('공식 홈페이지');
    return items;
  }

  function renderHospitalMetaItems(items, compact = false) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    if (compact) {
      return items.map((item) => `<span>${escapeHtml(item)}</span>`).join('');
    }

    return items.map((item) => {
      const text = String(item);
      if (text.startsWith('평점 ')) {
        return `<div class="meta-item"><span class="meta-icon">평점</span><span class="meta-value">${escapeHtml(text.replace('평점 ', ''))}</span></div>`;
      }
      if (text.startsWith('리뷰 ')) {
        return `<div class="meta-item"><span class="meta-icon">리뷰</span><span class="meta-value">${escapeHtml(text.replace('리뷰 ', '').replace('개', ''))}</span><span class="meta-label">개</span></div>`;
      }
      if (text.startsWith('전문의 ')) {
        return `<div class="meta-item"><span class="meta-icon">전문의</span><span class="meta-value">${escapeHtml(text.replace('전문의 ', '').replace('명', ''))}</span><span class="meta-label">명</span></div>`;
      }
      if (text === '공식 홈페이지') {
        return `<div class="meta-item"><span class="meta-icon">홈페이지</span><span class="meta-value">${escapeHtml(text)}</span></div>`;
      }
      return `<div class="meta-item"><span class="meta-icon">전화</span><span class="meta-value">${escapeHtml(text)}</span></div>`;
    }).join('');
  }

  function getDepartmentNameById(departmentId) {
    const items = typeof DEPARTMENTS !== 'undefined' ? DEPARTMENTS : [];
    return items.find((item) => item.id === departmentId)?.name || '';
  }

  function getTypeReviewLabel(type) {
    const labelMap = {
      hospital: '병원',
      clinic: '의원',
      dental: '치과',
      korean: '한의원',
    };
    return labelMap[type] || '';
  }

  function buildReviewSearchContext() {
    const rawQuery = String(ui.heroSearch?.value || '').trim();
    if (state.isSearchActive && rawQuery) {
      const normalizedQuery = rawQuery.replace(/\s*후기$/u, '').trim();
      return {
        query: `${normalizedQuery || rawQuery} 후기`,
        title: `실시간 ${normalizedQuery || rawQuery} 관련 후기`,
      };
    }

    const region = state.currentFilters.region !== 'all' ? state.currentFilters.region : '';
    const departmentName = state.currentFilters.department !== 'all'
      ? getDepartmentNameById(state.currentFilters.department)
      : '';
    const typeName = state.currentFilters.type !== 'all'
      ? getTypeReviewLabel(state.currentFilters.type)
      : '';

    if (region && departmentName) {
      return {
        query: `${region} ${departmentName} 후기`,
        title: `실시간 ${region} ${departmentName} 후기`,
      };
    }

    if (region && typeName) {
      return {
        query: `${region} ${typeName} 후기`,
        title: `실시간 ${region} ${typeName} 후기`,
      };
    }

    if (departmentName) {
      return {
        query: `${departmentName} 후기`,
        title: `실시간 ${departmentName} 후기`,
      };
    }

    if (region) {
      return {
        query: `${region} 병원 후기`,
        title: `실시간 ${region} 병원 후기`,
      };
    }

    const fallbackContexts = [
      { query: '병원 후기', title: '실시간 병원 후기' },
      { query: '진료 후기', title: '실시간 진료 후기' },
      { query: '내원 후기', title: '실시간 내원 후기' },
      { query: '검진 후기', title: '실시간 검진 후기' },
      { query: '수술 상담 후기', title: '실시간 수술 상담 후기' },
    ];

    return fallbackContexts[new Date().getDate() % fallbackContexts.length];
  }

  function buildListingHref({ region = '', department = '', type = '', keyword = '' } = {}) {
    const params = new URLSearchParams();
    if (region && region !== 'all') params.set('region', region);
    if (department && department !== 'all') params.set('department', department);
    if (type && type !== 'all') params.set('type', type);
    if (keyword) params.set('keyword', keyword);
    const query = params.toString();
    return query ? `index.html?${query}#ranking` : 'index.html#ranking';
  }

  function buildReviewGuideCards(reviewContext) {
    const rawQuery = String(ui.heroSearch?.value || '').trim();
    const region = state.currentFilters.region !== 'all' ? state.currentFilters.region : '';
    const department = state.currentFilters.department !== 'all' ? getDepartmentNameById(state.currentFilters.department) : '';
    const typeName = state.currentFilters.type !== 'all' ? getTypeReviewLabel(state.currentFilters.type) : '';
    const focusLabel = rawQuery || [region, department || typeName].filter(Boolean).join(' ');
    const compareHref = buildListingHref({
      region: state.currentFilters.region,
      department: state.currentFilters.department,
      type: state.currentFilters.type,
      keyword: state.isSearchActive ? rawQuery : '',
    });

    return [
      {
        badge: '비교 기준',
        title: focusLabel ? `${focusLabel} 비교는 무엇부터 볼까?` : '병원 비교는 무엇부터 볼까?',
        body: `${focusLabel || '병원 선택'}에서는 평점 하나보다 후기 수, 운영시간, 전문의 수, 주차 가능 여부를 함께 보는 편이 안전합니다. 첫 비교는 목록에서 하고, 최종 판단은 상세페이지에서 접수·준비서류·위치 정보를 다시 확인하세요.`,
        href: compareHref,
        cta: '목록에서 비교하기',
      },
      {
        badge: '운영 확인',
        title: '토요·야간 진료는 어떻게 확인할까?',
        body: '토요일, 야간, 일요일 진료는 병원 선택 이유가 되기 쉽지만 접수 마감 시간은 더 빠를 수 있습니다. 운영 배지는 빠른 필터로 쓰고, 실제 내원 전에는 상세페이지 운영 요약과 전화 문의를 함께 보는 흐름이 좋습니다.',
        href: 'guide.html',
        cta: '이용 가이드 보기',
      },
      {
        badge: '준비 서류',
        title: '초진 전에 무엇을 챙기면 좋을까?',
        body: '신분증, 복용 중인 약 목록, 기존 검사 결과처럼 기본 준비물은 진료과와 상관없이 자주 필요합니다. 수술 상담이나 영상검사가 예상되면 상세페이지 준비서류와 장비 정보를 같이 확인하는 편이 좋습니다.',
        href: 'about.html',
        cta: '운영 기준 보기',
      },
      {
        badge: '데이터 해석',
        title: '공공데이터와 보강 정보는 어떻게 읽어야 할까?',
        body: '이 사이트는 공공 병원 데이터와 공개 가능한 보강 정보를 함께 정리합니다. 공공 API 지연 시에도 탐색은 가능하지만, 최종 방문 결정은 병원 고지와 직접 문의를 기준으로 다시 확인하는 쪽이 안전합니다.',
        href: 'editorial-policy.html',
        cta: '편집 원칙 보기',
      },
      {
        badge: '후기 해석',
        title: reviewContext?.title ? `${reviewContext.title}는 어떻게 활용할까?` : '후기 정보는 어떻게 활용할까?',
        body: '후기는 병원의 분위기와 대기 경험을 파악하는 참고 자료로는 유용하지만, 진료 적합성 자체를 대신하지는 않습니다. 후기 내용은 현재 검색 의도와 함께 읽고, 증상·거리·운영 조건을 먼저 맞추는 편이 좋습니다.',
        href: compareHref,
        cta: '현재 조건 다시 보기',
      },
      {
        badge: '정정 요청',
        title: '정보가 다르면 어떻게 수정 요청할까?',
        body: '운영시간, 전화번호, 진료과, 위치 정보가 실제와 다르면 문의 페이지나 이메일로 바로 정정 요청을 보낼 수 있습니다. 최신성과 정정 가능성이 분명한 정보 구조일수록 방문자가 더 신뢰하기 쉽습니다.',
        href: 'contact.html',
        cta: '문의하기',
      },
    ];
  }

  async function renderReviews() {
    if (!ui.reviewsList) return;

    ui.reviewsList.innerHTML = '<div class="map-loader"><div class="spinner"></div><p>리뷰 데이터를 불러오는 중입니다...</p></div>';
    const reviewContext = buildReviewSearchContext();

    if (ui.reviewsTitle) {
      ui.reviewsTitle.textContent = reviewContext.title.replace('실시간 ', '').replace('후기', '선택 가이드').trim();
    }

    const cards = buildReviewGuideCards(reviewContext);
    ui.reviewsList.innerHTML = cards.map((item, index) => `
      <a href="${escapeHtml(item.href)}" class="review-card fade-up delay-${index % 3}" style="text-decoration:none; display:flex; flex-direction:column; cursor:pointer;">
        <div class="review-header" style="margin-bottom:10px;">
          <span class="review-badge" style="background:#46685b; color:white;">${escapeHtml(item.badge)}</span>
          <span class="review-hospital" style="font-size:0.85rem; color:var(--text-muted);">병원찾기 원본 가이드</span>
        </div>
        <h3 style="font-size:1rem; margin-bottom:8px; color:var(--text-heading); font-weight:600; line-height:1.4;">${escapeHtml(item.title)}</h3>
        <p class="review-content" style="flex-grow:1; -webkit-line-clamp:4;">${escapeHtml(item.body)}</p>
        <span style="margin-top:14px; color:var(--primary); font-size:0.9rem; font-weight:700;">${escapeHtml(item.cta)}</span>
      </a>
    `).join('');

    observeNewElements(ui.reviewsList);
  }

  function renderNewHospitals() {
    if (!ui.newHospitalsList || typeof NEW_HOSPITALS === 'undefined') return;

    ui.newHospitalsList.innerHTML = NEW_HOSPITALS.map((hospital, index) => `
      <div class="timeline-item fade-up delay-${index % 3}">
        <span class="timeline-date">${formatDate(hospital.openDate)}</span>
        <div class="timeline-card">
          <div class="timeline-name">${escapeHtml(hospital.name)} <span class="hospital-type-tag">${escapeHtml(hospital.department)}</span></div>
          <div class="timeline-addr">📍 ${escapeHtml(hospital.address)}</div>
        </div>
      </div>
    `).join('');

    observeNewElements(ui.newHospitalsList);
  }

  function renderQuickAccess() {
    if (!ui.currentOpenList || !ui.saturdayOpenList || !ui.nightOpenList || !ui.recentOpenList) return;

    const hospitals = getFeaturedHospitalsSource();
    const representativeHospitals = getRepresentativeHospitals(hospitals);
    const liveOpenHospitals = selectOperationalFeaturedHospitals(
      representativeHospitals,
      hospitals,
      (hospital) => isHospitalOpenNow(hospital)
    );
    const currentOpen = liveOpenHospitals.length
      ? liveOpenHospitals
      : selectOperationalFeaturedHospitals(
        representativeHospitals,
        hospitals,
        (hospital) => isAvailableToday(hospital)
      );
    const saturdayOpen = selectOperationalFeaturedHospitals(
      representativeHospitals,
      hospitals,
      (hospital) => hospital.saturdayOpen
    );
    const nightOpen = selectOperationalFeaturedHospitals(
      representativeHospitals,
      hospitals,
      (hospital) => hospital.nightOpen
    );
    const recentOpen = getRecentOpenHospitals(hospitals).slice(0, 4);

    renderQuickAccessList(
      ui.currentOpenList,
      currentOpen,
      '현재 진료중으로 표시할 병원이 없습니다.',
      buildQuickAccessCard
    );
    renderQuickAccessList(
      ui.saturdayOpenList,
      saturdayOpen,
      '토요일 진료 병원 정보를 준비 중입니다.',
      buildQuickAccessCard
    );
    renderQuickAccessList(
      ui.nightOpenList,
      nightOpen,
      '야간 진료 병원 정보를 준비 중입니다.',
      buildQuickAccessCard
    );
    renderQuickAccessList(
      ui.recentOpenList,
      recentOpen,
      '최근 개원 병원 정보를 준비 중입니다.',
      buildRecentOpenCard
    );

    const quickAccessSection = document.getElementById('quick-access');
    void hydrateHospitalCardDetails(
      dedupeHospitals([...currentOpen, ...saturdayOpen, ...nightOpen, ...recentOpen]),
      quickAccessSection,
      18
    );
  }

  function renderQuickAccessList(container, hospitals, emptyMessage, renderer) {
    if (!container) return;

    if (!hospitals.length) {
      container.innerHTML = `<p class="quick-access-empty">${escapeHtml(emptyMessage)}</p>`;
      return;
    }

    container.innerHTML = hospitals.map((hospital) => renderer(hospital)).join('');
    observeNewElements(container);
  }

  function getFeaturedHospitalsSource() {
    const fallbackHospitals = getStaticHospitalPool();
    if (!state.allFetchedHospitals.length) {
      return fallbackHospitals.slice();
    }

    const merged = mergeHospitalsWithFallback(state.allFetchedHospitals);

    const mergedKeys = new Set(merged.map((hospital) => buildHospitalKey(hospital)));
    const extras = fallbackHospitals.filter((hospital) => !mergedKeys.has(buildHospitalKey(hospital)));
    return [...merged, ...extras];
  }

  function getRecentOpenHospitals(hospitals) {
    const recentSeed = Array.isArray(NEW_HOSPITALS) ? NEW_HOSPITALS : [];
    const merged = dedupeHospitals([...recentSeed, ...hospitals]);
    return merged
      .filter((hospital) => hospital.openDate)
      .sort((left, right) => new Date(right.openDate) - new Date(left.openDate));
  }

  function getRepresentativeHospitals(hospitals) {
    const sorted = dedupeHospitals(hospitals).sort(compareFeaturedHospitals);
    const curated = sorted.filter((hospital) => getFeaturedHospitalTier(hospital) >= 1);
    if (curated.length >= 8) {
      return curated;
    }

    const secondary = sorted.filter((hospital) => getFeaturedHospitalTier(hospital) >= 0.5);
    return dedupeHospitals([...curated, ...secondary, ...sorted]);
  }

  function selectOperationalFeaturedHospitals(preferredHospitals, fallbackHospitals, predicate) {
    const preferred = preferredHospitals
      .filter((hospital) => predicate(hospital))
      .sort(compareFeaturedHospitals)
      .slice(0, 4);

    if (preferred.length >= 4) {
      return preferred;
    }

    const fallback = fallbackHospitals
      .filter((hospital) => predicate(hospital))
      .sort(compareFeaturedHospitals)
      .slice(0, 4);

    return preferred.length > 0 ? preferred : fallback;
  }

  function dedupeHospitals(hospitals) {
    const seen = new Set();
    return hospitals.filter((hospital) => {
      const key = buildHospitalKey(hospital);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function buildHospitalKey(hospital) {
    return [hospital?.name, hospital?.address]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
      .join('|');
  }

  function compareFeaturedHospitals(left, right) {
    return (
      getFeaturedHospitalTier(right) - getFeaturedHospitalTier(left) ||
      getHospitalInfoRichnessScore(right) - getHospitalInfoRichnessScore(left) ||
      (right.score || 0) - (left.score || 0) ||
      (right.reviewCount || 0) - (left.reviewCount || 0) ||
      (right.specialistCount || 0) - (left.specialistCount || 0) ||
      String(left.name || '').localeCompare(String(right.name || ''), 'ko')
    );
  }

  function getFeaturedHospitalTier(hospital) {
    const typeName = String(hospital?.type || '');
    const score = Number(hospital?.score || 0);
    const reviewCount = Number(hospital?.reviewCount || 0);
    const specialistCount = Number(hospital?.specialistCount || 0);

    if (typeName.includes('상급종합')) return 5;
    if (typeName.includes('종합병원')) return 4;
    if (typeName === '병원') return 3;
    if (specialistCount >= 10) return 2.5;
    if (specialistCount >= 5 || reviewCount >= 500) return 2;
    if (reviewCount >= 250 && score >= 4.4) return 1.5;
    if (reviewCount >= 150 && score >= 4.2) return 1;
    if (reviewCount >= 80 && score >= 4.0) return 0.5;
    return 0;
  }

  function hasKnownOperationalData(hospital) {
    if (!hospital) return false;
    if (hospital.saturdayOpen === true || hospital.saturdayOpen === false) return true;
    if (hospital.sundayOpen === true || hospital.sundayOpen === false) return true;
    if (hospital.nightOpen === true || hospital.nightOpen === false) return true;
    return Boolean(hospital.hours);
  }

  function getHospitalInfoRichnessScore(hospital) {
    const checks = [
      Boolean(hospital?.address),
      Boolean(hospital?.phone),
      Boolean(hospital?.url),
      Boolean(hospital?.subway || hospital?.region || hospital?.district),
      Boolean(hospital?.openDate),
      Number(hospital?.reviewCount || 0) > 0 || Number(hospital?.specialistCount || 0) > 0,
      hasKnownOperationalData(hospital),
      Number(hospital?.parkingCapacity || 0) > 0
        || Boolean(hospital?.parkingFee)
        || Boolean(hospital?.equipment)
        || Number(hospital?.roomCount || 0) > 0
        || Number(hospital?.bedCount || 0) > 0,
    ];

    return checks.filter(Boolean).length;
  }

  function buildQuickAccessCard(hospital) {
    const href = hospital.id ? `detail.html?id=${encodeURIComponent(hospital.id)}` : '#';
    const type = hospital.department || hospital.type || '병원';
    const meta = buildHospitalMetaItems(hospital);
    const subinfo = buildHospitalSubinfo(hospital);
    const featureNote = buildHospitalFeatureNote(hospital);
    const insightItems = buildHospitalInsightItems(hospital);
    const highlightItems = buildHospitalHighlightItems(hospital);
    const factItems = buildHospitalFactItems(hospital);
    const statusItems = buildHospitalStatusItems(hospital);
    const statusSummary = buildHospitalStatusSummary(hospital);
    const trustBadges = buildHospitalTrustBadges(hospital);
    const dataSummary = buildHospitalDataSummary(hospital);

    return `
      <a class="quick-access-item fade-up" href="${href}" data-hospital-id="${escapeHtml(hospital.id)}">
        <div class="quick-access-title-row">
          <strong>${escapeHtml(hospital.name)}</strong>
          <span class="hospital-type-tag">${escapeHtml(type)}</span>
        </div>
        <p class="quick-access-address">${escapeHtml(hospital.address || '주소 확인 필요')}</p>
        ${subinfo ? `<div class="quick-access-subinfo" data-hospital-subinfo>${subinfo}</div>` : ''}
        <div class="hospital-trust-row hospital-trust-row-compact" data-hospital-trust>${renderHospitalTrustBadges(trustBadges)}</div>
        <div class="hospital-status-row hospital-status-row-compact" data-hospital-status>${renderHospitalStatusBadges(statusItems)}</div>
        <p class="hospital-status-summary hospital-status-summary-compact" data-hospital-status-summary>${escapeHtml(statusSummary)}</p>
        <div class="hospital-highlights quick-access-highlights" data-hospital-highlights${highlightItems.length ? '' : ' hidden'}>
          ${highlightItems.map((item) => `<span class="hospital-highlight">${escapeHtml(item)}</span>`).join('')}
        </div>
        <div class="hospital-fact-grid hospital-fact-grid-compact" data-hospital-facts>${renderHospitalFactGrid(factItems)}</div>
        ${featureNote ? `<p class="hospital-feature-note">${escapeHtml(featureNote)}</p>` : ''}
        <div class="hospital-insight-list hospital-insight-list-compact" data-hospital-insights${insightItems.length ? '' : ' hidden'}>${renderHospitalInsightList(insightItems)}</div>
        <p class="hospital-data-summary quick-access-summary${dataSummary ? '' : ' is-pending'}" data-hospital-summary>${escapeHtml(dataSummary || '주차, 접수, 운영 정보를 불러오는 중입니다.')}</p>
        <div class="quick-access-meta" data-hospital-meta>${renderHospitalMetaItems(meta, true)}</div>
      </a>
    `;
  }

  function buildRecentOpenCard(hospital) {
    const highlightItems = buildHospitalHighlightItems(hospital);
    const insightItems = buildHospitalInsightItems(hospital);
    const dataSummary = buildHospitalDataSummary(hospital);
    const type = hospital.department || hospital.type || '병원';
    const openDate = hospital.openDate ? `개원 ${formatDate(hospital.openDate)}` : '개원일 확인 필요';
    const address = hospital.address || '주소 확인 필요';
    const location = [hospital.region, hospital.district].filter(Boolean).join(' / ');

    return `
      <div class="quick-access-item fade-up" data-hospital-id="${escapeHtml(hospital.id)}">
        <div class="quick-access-title-row">
          <strong>${escapeHtml(hospital.name)}</strong>
          <span class="hospital-type-tag">${escapeHtml(type)}</span>
        </div>
        <p class="quick-access-address">${escapeHtml(address)}</p>
        ${location ? `<div class="quick-access-subinfo">${escapeHtml(location)}</div>` : ''}
        <div class="hospital-highlights quick-access-highlights" data-hospital-highlights${highlightItems.length ? '' : ' hidden'}>
          ${highlightItems.map((item) => `<span class="hospital-highlight">${escapeHtml(item)}</span>`).join('')}
        </div>
        <div class="hospital-insight-list hospital-insight-list-compact" data-hospital-insights${insightItems.length ? '' : ' hidden'}>${renderHospitalInsightList(insightItems)}</div>
        <p class="hospital-data-summary quick-access-summary${dataSummary ? '' : ' is-pending'}" data-hospital-summary>${escapeHtml(dataSummary || '주차, 접수, 운영 정보를 불러오는 중입니다.')}</p>
        <div class="quick-access-meta">
          <span>${escapeHtml(openDate)}</span>
        </div>
      </div>
    `;
  }

  function isHospitalOpenNow(hospital, now = new Date()) {
    const day = now.getDay();
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    const hoursValue = getHoursByDay(hospital.hours, day);
    const parsedRange = parseOperatingRange(hoursValue);

    if (parsedRange) {
      return currentMinutes >= parsedRange.start && currentMinutes <= parsedRange.end;
    }

    return isLikelyOpenByFlags(hospital, day, currentMinutes);
  }

  function getHoursByDay(hours, day) {
    if (!hours) return '';

    if (day === 0) return hours.sun || hours.holiday || '';
    if (day === 6) return hours.sat || '';

    return [hours.mon, hours.tue, hours.wed, hours.thu, hours.fri][day - 1] || '';
  }

  function parseOperatingRange(hoursValue) {
    if (!hoursValue || isClosedHoursText(hoursValue)) return null;

    const matches = String(hoursValue).match(/(\d{1,2}):(\d{2})/g);
    if (!matches || matches.length < 2) return null;

    const start = parseTimeText(matches[0]);
    const end = parseTimeText(matches[matches.length - 1]);
    if (start === null || end === null) return null;

    return { start, end };
  }

  function parseTimeText(value) {
    const match = String(value).match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;

    return (Number(match[1]) * 60) + Number(match[2]);
  }

  function isClosedHoursText(hoursValue) {
    const text = String(hoursValue || '').trim().toLowerCase();
    return !text || ['미진료', '휴진', '휴무', '없음', '-', 'closed'].some((keyword) => text.includes(keyword));
  }

  function isLikelyOpenByFlags(hospital, day, currentMinutes) {
    const weekdayStart = 9 * 60;
    const weekdayEnd = 18 * 60;
    const nightEnd = 21 * 60;
    const weekendEnd = 13 * 60;

    if (day === 0) {
      return Boolean(hospital.sundayOpen) && currentMinutes >= weekdayStart && currentMinutes <= weekendEnd;
    }

    if (day === 6) {
      return Boolean(hospital.saturdayOpen) && currentMinutes >= weekdayStart && currentMinutes <= weekendEnd;
    }

    if (currentMinutes < weekdayStart || currentMinutes > nightEnd) {
      return false;
    }

    if (currentMinutes <= weekdayEnd) {
      return true;
    }

    return Boolean(hospital.nightOpen);
  }

  function isAvailableToday(hospital, now = new Date()) {
    const day = now.getDay();

    if (day === 0) return Boolean(hospital.sundayOpen);
    if (day === 6) return Boolean(hospital.saturdayOpen);

    return true;
  }

  async function performSearch() {
    const query = ui.heroSearch?.value.trim() || '';
    if (!query) {
      clearSearch();
      return;
    }

    const intent = typeof SearchEngine !== 'undefined'
      ? SearchEngine.parseSearchIntent(query)
      : null;

    state.isSearchActive = true;
    ui.searchResults?.classList.add('active');
    void renderReviews();
    renderSearchIntentSummary(intent);
    setSearchRefineState(intent);

    if (ui.searchQueryDisplay) {
      ui.searchQueryDisplay.textContent = `"${query}"`;
    }
    if (ui.searchResultCount) {
      ui.searchResultCount.innerHTML = '<span class="spinner-inline"></span> 검색 중...';
    }
    if (ui.searchResultCount) {
      ui.searchResultCount.innerHTML = '<span class="spinner-inline"></span> 검색 중...';
    }
    if (ui.searchResultsList) {
      ui.searchResultsList.innerHTML = '';
    }

    const result = await searchHospitalsByIntent(query, intent);
    const hospitals = result.hospitals;
    const summary = typeof SearchEngine !== 'undefined'
      ? SearchEngine.buildSearchSummary(intent)
      : '';
    const operationNotice = intent && (intent.saturdayOpen || intent.sundayOpen || intent.nightOpen)
      ? ' · 운영시간 확인 병원 기준'
      : '';

    if (ui.searchResultCount) {
      ui.searchResultCount.innerHTML = `총 <strong>${hospitals.length.toLocaleString()}</strong>개 결과${summary ? ` · ${escapeHtml(summary)}` : ''}${operationNotice}`;
    }

    if (ui.searchResultCount) {
      const resultNotice = intent && (intent.saturdayOpen || intent.sundayOpen || intent.nightOpen)
        ? ' · 운영시간 확인 병원 기준'
        : '';
      ui.searchResultCount.innerHTML = `총 <strong>${hospitals.length.toLocaleString()}</strong>개 결과${summary ? ` · ${escapeHtml(summary)}` : ''}${resultNotice}`;
    }

    if (!ui.searchResultsList) return;

    if (hospitals.length === 0) {
      const description = summary
        ? `${summary}${operationNotice ? ' 조건은 운영시간이 확인된 병원 기준으로 먼저 보여줍니다.' : ' 조건'}에 맞는 병원을 아직 찾지 못했습니다. 다른 지역이나 진료과 조합으로 다시 검색해보세요.`
        : '다른 키워드로 다시 검색해보세요.';
      ui.searchResultsList.innerHTML = buildEmptyState('검색 결과가 없습니다.', description);
    } else {
      ui.searchResultsList.innerHTML = hospitals.map((hospital, index) => buildHospitalCard(hospital, index + 1)).join('');
      observeNewElements(ui.searchResultsList);
      updateMapHospitals(hospitals);
      void hydrateHospitalCardDetails(hospitals, ui.searchResultsList, 12);
    }

    if (hospitals.length === 0 && ui.searchResultsList) {
      const emptyDescription = summary
        ? `${summary}${operationNotice ? ' 조건의 운영시간 확인 병원 기준으로 먼저 보여드렸지만' : ' 조건에 맞는'} 병원을 아직 찾지 못했습니다. 다른 지역이나 진료과 조합으로 다시 검색해보세요.`
        : '다른 키워드로 다시 검색해보세요.';
      ui.searchResultsList.innerHTML = buildSearchEmptyState(emptyDescription, intent);
    }

    syncListingQuery(query);
    ui.searchResults?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function searchHospitalsByIntent(query, intent) {
    const localSource = dedupeHospitals(getFeaturedHospitalsSource());
    const apiParams = buildSearchApiParams(intent);
    let remoteHospitals = [];

    if (apiParams) {
      const remoteResult = await HospitalAPI.fetchHospitals(apiParams);
      remoteHospitals = mergeHospitalsWithFallback(remoteResult.hospitals);
    }

    const combined = dedupeHospitals([...localSource, ...remoteHospitals]);
    let hospitals = typeof SearchEngine !== 'undefined'
      ? SearchEngine.query(combined, { searchText: query, sortBy: state.currentSort, intent })
      : combined;

    if (!hospitals.length && typeof SearchEngine !== 'undefined') {
      const relaxedIntent = buildRelaxedSearchIntent(intent);
      if (relaxedIntent) {
        hospitals = SearchEngine.query(combined, {
          searchText: '',
          sortBy: state.currentSort,
          intent: relaxedIntent,
        });
      }
    }

    if (!hospitals.length && typeof SearchEngine !== 'undefined') {
      const areaFallbackIntent = buildAreaFallbackIntent(intent);
      if (areaFallbackIntent) {
        hospitals = SearchEngine.query(combined, {
          searchText: '',
          sortBy: state.currentSort,
          intent: areaFallbackIntent,
        });
      }
    }

    return {
      hospitals,
      source: remoteHospitals.length > 0 ? 'remote+local' : 'local',
    };
  }

  function buildSearchApiParams(intent) {
    if (!intent) {
      return null;
    }

    const params = { limit: resolveSearchApiLimit(intent) };

    if (intent.region) {
      params.region = intent.region;
    }
    if (intent.department) {
      params.department = intent.department;
    }
    const searchApiName = buildSearchApiName(intent);
    if (searchApiName) {
      params.name = searchApiName;
    }

    if (!params.region && !params.department && !params.name) {
      return null;
    }

    return params;
  }

  function resolveSearchApiLimit(intent) {
    if (!intent) {
      return 40;
    }

    if (shouldUseKeywordAsHospitalName(intent)) {
      return 120;
    }

    if (intent.department && (intent.region || intent.district || intent.locality)) {
      return 120;
    }

    if (intent.region || intent.department) {
      return 80;
    }

    return 60;
  }

  function buildSearchApiName(intent) {
    if (shouldUseKeywordAsHospitalName(intent)) {
      return String(intent?.keywordText || '').trim();
    }

    if (!(intent?.district || intent?.locality)) {
      return '';
    }

    const tokens = String(intent?.originalQuery || '')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (!tokens.length) {
      return '';
    }

    const departmentLabel = intent?.department ? getDepartmentNameById(intent.department) : '';
    const blocked = new Set([
      String(intent?.region || '').trim(),
      String(intent?.district || '').trim(),
      String(intent?.locality || '').trim(),
      String(departmentLabel || '').trim(),
      '토요일',
      '야간',
      '일요일',
      '주차',
      '가능',
      '전문의',
      '응급',
      '신규',
      '개원',
    ].filter(Boolean));

    return tokens.find((token) => !blocked.has(token)) || '';
  }

  function shouldUseKeywordAsHospitalName(intent) {
    const keywordText = String(intent?.keywordText || '').trim();
    if (!keywordText) {
      return false;
    }

    const facilityTerms = ['병원', '의원', '치과', '한의원', '클리닉', '메디컬', '센터'];
    if (facilityTerms.some((term) => keywordText.includes(term))) {
      return true;
    }

    if (!intent?.region && !intent?.department) {
      return keywordText.length >= 2;
    }

    const tokens = keywordText.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2 && keywordText.length >= 5) {
      return true;
    }

    return keywordText.length >= 4 && Boolean(intent?.region || intent?.district || intent?.locality);
  }

  function buildRelaxedSearchIntent(intent) {
    if (!intent?.isStructured) {
      return null;
    }

    return {
      ...intent,
      originalQuery: '',
      keywordTokens: [],
      keywordText: '',
    };
  }

  function buildAreaFallbackIntent(intent) {
    if (!intent?.isStructured || !intent?.department) {
      return null;
    }

    if (!(intent.locality || intent.district || intent.region)) {
      return null;
    }

    return {
      ...intent,
      department: '',
      keywordTokens: [],
      keywordText: '',
    };
  }

  function buildQuickFilterQuery(currentQuery, filter) {
    const labelMap = {
      sat: '토요일',
      night: '야간',
      sun: '일요일',
    };

    const nextLabel = labelMap[filter] || '';
    const current = String(currentQuery || '').trim();
    if (!nextLabel) {
      return current;
    }
    if (!current) {
      return nextLabel;
    }
    if (current.includes(nextLabel)) {
      return current;
    }
    return `${current} ${nextLabel}`.trim();
  }

  function buildQuickRefineQuery(currentQuery, filter) {
    const labelMap = {
      sat: '토요일',
      night: '야간',
      sun: '일요일',
      parking: '주차',
      specialist: '전문의',
      recent: '최근 개원',
      emergency: '응급',
    };

    const nextLabel = labelMap[filter] || '';
    const current = String(currentQuery || '').trim();
    if (!nextLabel) {
      return current;
    }
    if (!current) {
      return nextLabel;
    }
    if (current.includes(nextLabel)) {
      return current;
    }
    return `${current} ${nextLabel}`.trim();
  }

  function updateSearchSuggestions(query) {
    const suggestions = buildSearchSuggestions(query);
    state.searchSuggestions = suggestions;
    state.activeSearchSuggestionIndex = suggestions.length > 0 ? 0 : -1;
    renderSearchSuggestions();
  }

  function buildSearchSuggestions(query = '') {
    const normalizedQuery = normalizeSuggestionText(query);
    const source = uniqueStrings(SEARCH_AUTOCOMPLETE_ITEMS);

    if (!normalizedQuery) {
      return source.slice(0, 6);
    }

    return source
      .map((item) => ({ item, score: scoreSearchSuggestion(item, normalizedQuery) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.item.localeCompare(right.item, 'ko'))
      .slice(0, 8)
      .map((entry) => entry.item);
  }

  function scoreSearchSuggestion(item, normalizedQuery) {
    const normalizedItem = normalizeSuggestionText(item);
    const originalQuery = String(normalizedQuery || '').trim();
    if (!normalizedItem || !originalQuery) {
      return 0;
    }

    if (normalizedItem === originalQuery) {
      return 200;
    }

    if (normalizedItem.startsWith(originalQuery)) {
      return 120;
    }

    if (normalizedItem.includes(originalQuery)) {
      return 90;
    }

    const queryTokens = originalQuery.split(/\s+/).filter(Boolean);
    const normalizedItemTokens = normalizedItem.split(/\s+/).filter(Boolean);
    const tokenMatches = queryTokens.filter((token) => normalizedItemTokens.some((part) => part.includes(token))).length;
    return tokenMatches > 0 ? tokenMatches * 25 : 0;
  }

  function renderSearchSuggestions() {
    if (!ui.searchSuggestionList) {
      return;
    }

    if (!state.searchSuggestions.length) {
      ui.searchSuggestionList.hidden = true;
      ui.searchSuggestionList.innerHTML = '';
      return;
    }

    ui.searchSuggestionList.hidden = false;
    ui.searchSuggestionList.innerHTML = state.searchSuggestions.map((suggestion, index) => `
      <button
        type="button"
        class="search-suggestion-item${index === state.activeSearchSuggestionIndex ? ' is-active' : ''}"
        data-search-suggestion="${escapeHtml(suggestion)}"
      >
        <span class="search-suggestion-prefix">추천</span>
        <strong>${escapeHtml(suggestion)}</strong>
      </button>
    `).join('');
  }

  function moveSearchSuggestionFocus(direction) {
    if (!state.searchSuggestions.length) {
      return;
    }

    const total = state.searchSuggestions.length;
    const currentIndex = state.activeSearchSuggestionIndex < 0 ? 0 : state.activeSearchSuggestionIndex;
    state.activeSearchSuggestionIndex = (currentIndex + direction + total) % total;
    renderSearchSuggestions();
  }

  function selectSearchSuggestion(suggestion) {
    const nextValue = String(suggestion || '').trim();
    if (!nextValue) {
      return;
    }

    if (ui.heroSearch) {
      ui.heroSearch.value = nextValue;
      ui.heroSearch.focus();
    }

    closeSearchSuggestions();
    void performSearch();
  }

  function closeSearchSuggestions() {
    state.searchSuggestions = [];
    state.activeSearchSuggestionIndex = -1;

    if (ui.searchSuggestionList) {
      ui.searchSuggestionList.hidden = true;
      ui.searchSuggestionList.innerHTML = '';
    }
  }

  function normalizeSuggestionText(value = '') {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function renderSearchIntentSummary(intent) {
    if (!ui.searchIntentSummary) {
      return;
    }

    const chips = [];
    if (intent?.region) chips.push(`지역 ${intent.region}`);
    if (intent?.department && typeof SearchEngine !== 'undefined') {
      chips.push(`진료과 ${SearchEngine.getDepartmentLabel(intent.department)}`);
    }
    if (intent?.saturdayOpen) chips.push('토요일 진료');
    if (intent?.sundayOpen) chips.push('일요일 진료');
    if (intent?.nightOpen) chips.push('야간 진료');
    if (intent?.parkingAvailable) chips.push('주차 가능');
    if (intent?.specialistOnly) chips.push('전문의');
    if (intent?.recentOpen) chips.push('최근 개원');
    if (intent?.hasEmergency) chips.push('응급 진료');
    if (intent?.keywordText) chips.push(`키워드 ${intent.keywordText}`);

    ui.searchIntentSummary.innerHTML = chips.length > 0
      ? chips.map((chip) => `<span class="search-intent-chip">${escapeHtml(chip)}</span>`).join('')
      : '<span class="search-intent-chip">병원명, 지역, 진료과 기준으로 검색 중</span>';
  }

  function setSearchRefineState(intent) {
    if (!ui.searchRefineBar) {
      return;
    }

    const activeMap = {
      sat: Boolean(intent?.saturdayOpen),
      night: Boolean(intent?.nightOpen),
      sun: Boolean(intent?.sundayOpen),
      parking: Boolean(intent?.parkingAvailable),
      specialist: Boolean(intent?.specialistOnly),
      recent: Boolean(intent?.recentOpen),
      emergency: Boolean(intent?.hasEmergency),
    };

    ui.searchRefineBar.querySelectorAll('.search-refine-btn').forEach((button) => {
      const isActive = Boolean(activeMap[button.dataset.refine || '']);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function clearSearch() {
    state.isSearchActive = false;
    if (ui.heroSearch) ui.heroSearch.value = '';
    closeSearchSuggestions();
    ui.searchResults?.classList.remove('active');
    if (ui.searchIntentSummary) {
      ui.searchIntentSummary.innerHTML = '';
    }
    setSearchRefineState(null);
    updateMapHospitals(
      typeof SearchEngine !== 'undefined'
        ? SearchEngine.sortHospitals(state.allFetchedHospitals, state.currentSort)
        : [...state.allFetchedHospitals]
    );
    void renderReviews();
    syncListingQuery();
  }

  function bindEvents() {
    ui.themeToggle?.addEventListener('click', toggleTheme);

    ui.mobileMenuBtn?.addEventListener('click', () => {
      ui.navLinks?.classList.toggle('open');
    });

    ui.navLinks?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => ui.navLinks?.classList.remove('open'));
    });

    ui.searchBtn?.addEventListener('click', () => {
      void performSearch();
    });

    ui.heroSearch?.addEventListener('keyup', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Escape') {
        return;
      }

      if (event.key === 'Enter') {
        const activeSuggestion = state.searchSuggestions[state.activeSearchSuggestionIndex];
        if (activeSuggestion) {
          selectSearchSuggestion(activeSuggestion);
          return;
        }

        void performSearch();
        closeSearchSuggestions();
        return;
      }

      updateSearchSuggestions(ui.heroSearch?.value || '');
    });

    ui.heroSearch?.addEventListener('keydown', (event) => {
      if (!state.searchSuggestions.length) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveSearchSuggestionFocus(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveSearchSuggestionFocus(-1);
      } else if (event.key === 'Escape') {
        closeSearchSuggestions();
      }
    });

    ui.heroSearch?.addEventListener('focus', () => {
      updateSearchSuggestions(ui.heroSearch?.value || '');
    });

    ui.heroSearch?.addEventListener('blur', () => {
      window.setTimeout(() => {
        closeSearchSuggestions();
      }, 120);
    });

    ui.clearSearchBtn?.addEventListener('click', clearSearch);

    $$('[data-search-example]').forEach((button) => {
      button.addEventListener('click', () => {
        const example = button.dataset.searchExample || '';
        selectSearchSuggestion(example);
      });
    });

    ui.searchSuggestionList?.addEventListener('mousedown', (event) => {
      const button = event.target.closest('[data-search-suggestion]');
      if (!button) {
        return;
      }

      event.preventDefault();
      selectSearchSuggestion(button.dataset.searchSuggestion || '');
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.search-wrapper')) {
        closeSearchSuggestions();
      }
    });

    $$('.quick-filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        if (filter === 'new') {
          state.currentSort = 'newest';
          if (ui.sortFilter) ui.sortFilter.value = 'newest';
          reloadRanking();
          $('#ranking')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }

        if (!ui.heroSearch) {
          return;
        }

        const nextQuery = buildQuickFilterQuery(ui.heroSearch.value, filter);
        ui.heroSearch.value = nextQuery;
        void performSearch();
        $('#search-results')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    $$('.search-refine-btn').forEach((button) => {
      button.addEventListener('click', () => {
        if (!ui.heroSearch) {
          return;
        }

        const filter = button.dataset.refine || '';
        const nextQuery = buildQuickRefineQuery(ui.heroSearch.value, filter);
        ui.heroSearch.value = nextQuery;
        void performSearch();
      });
    });

    ui.departmentGrid?.addEventListener('click', (event) => {
      const card = event.target.closest('.dept-card');
      if (!card) return;

      state.currentFilters.department = card.dataset.deptId || 'all';
      reloadRanking();
      $('#ranking')?.scrollIntoView({ behavior: 'smooth' });
    });

    ui.departmentGrid?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;

      const card = event.target.closest('.dept-card');
      if (!card) return;

      event.preventDefault();
      state.currentFilters.department = card.dataset.deptId || 'all';
      reloadRanking();
      $('#ranking')?.scrollIntoView({ behavior: 'smooth' });
    });

    $$('.theme-tag').forEach((tag) => {
      tag.addEventListener('click', (event) => {
        event.preventDefault();
        const keyword = tag.dataset.keyword || '';
        if (ui.heroSearch) {
          ui.heroSearch.value = keyword;
        } else {
          return;
        }
        void performSearch();
      });
    });

    document.addEventListener('click', (event) => {
      const suggestionButton = event.target.closest('.search-empty-chip[data-search-query]');
      if (suggestionButton) {
        event.preventDefault();
        if (ui.heroSearch) {
          ui.heroSearch.value = suggestionButton.dataset.searchQuery || '';
          void performSearch();
        }
        return;
      }

      const presetButton = event.target.closest('.search-empty-preset[data-preset-region]');
      if (presetButton) {
        event.preventDefault();
        state.currentFilters.region = presetButton.dataset.presetRegion || 'all';
        state.currentFilters.department = presetButton.dataset.presetDepartment || 'all';
        state.currentFilters.type = presetButton.dataset.presetType || 'all';
        state.currentSort = 'score';

        if (ui.regionFilter) ui.regionFilter.value = state.currentFilters.region;
        if (ui.typeFilter) ui.typeFilter.value = state.currentFilters.type;
        if (ui.sortFilter) ui.sortFilter.value = 'score';

        clearSearch();
        reloadRanking();
        $('#ranking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const landingCard = event.target.closest('.landing-card[data-landing-region]');
      if (landingCard) {
        event.preventDefault();
        applyLandingPreset(landingCard);
        return;
      }

      const card = event.target.closest('.hospital-card');
      if (!card) return;

      const hospitalId = card.dataset.hospitalId;
      if (hospitalId) {
        window.location.href = `detail.html?id=${hospitalId}`;
      }
    });

    ui.regionFilter?.addEventListener('change', () => {
      state.currentFilters.region = ui.regionFilter.value;
      state.currentFilters.district = 'all';
      state.currentFilters.town = 'all';
      populateDistrictFilter();
      populateTownFilter();
      reloadRanking();
    });

    ui.districtFilter?.addEventListener('change', () => {
      state.currentFilters.district = ui.districtFilter.value;
      state.currentFilters.town = 'all';
      populateTownFilter();
      reloadRanking();
    });

    ui.townFilter?.addEventListener('change', () => {
      state.currentFilters.town = ui.townFilter.value;
      reloadRanking();
    });

    ui.heroRegionFilter?.addEventListener('change', () => {
      state.currentFilters.region = ui.heroRegionFilter.value;
      state.currentFilters.district = 'all';
      state.currentFilters.town = 'all';
      populateDistrictFilter();
      populateTownFilter();
    });

    ui.heroDistrictFilter?.addEventListener('change', () => {
      state.currentFilters.district = ui.heroDistrictFilter.value;
      state.currentFilters.town = 'all';
      populateTownFilter();
    });

    ui.heroTownFilter?.addEventListener('change', () => {
      state.currentFilters.town = ui.heroTownFilter.value;
    });

    ui.heroLocationApply?.addEventListener('click', () => {
      applyHeroLocationFilters();
    });

    ui.typeFilter?.addEventListener('change', () => {
      state.currentFilters.type = ui.typeFilter.value;
      reloadRanking();
    });

    ui.sortFilter?.addEventListener('change', () => {
      state.currentSort = ui.sortFilter.value;
      const sortedHospitals = typeof SearchEngine !== 'undefined'
        ? SearchEngine.sortHospitals(state.allFetchedHospitals, state.currentSort)
        : [...state.allFetchedHospitals];
      renderRankingCards(sortedHospitals);
      updateMapHospitals(sortedHospitals);
    });

    ui.loadMoreBtn?.addEventListener('click', () => {
      state.currentPage += 1;
      void loadRankingData(true);
    });
  }

  function reloadRanking() {
    state.currentPage = 1;
    state.allFetchedHospitals = [];
    void renderReviews();
    void loadRankingData(false);
  }

  function applyHeroLocationFilters() {
    if (ui.heroSearch) {
      ui.heroSearch.value = '';
    }
    clearSearch();
    reloadRanking();
    $('#ranking')?.scrollIntoView({ behavior: 'smooth' });
  }

  function applyLandingPreset(card) {
    state.currentFilters.region = card.dataset.landingRegion || 'all';
    state.currentFilters.district = 'all';
    state.currentFilters.town = 'all';
    state.currentFilters.department = card.dataset.landingDepartment || 'all';
    state.currentFilters.type = card.dataset.landingType || 'all';
    state.currentSort = 'score';

    if (ui.regionFilter) ui.regionFilter.value = state.currentFilters.region;
    if (ui.heroRegionFilter) ui.heroRegionFilter.value = state.currentFilters.region;
    populateDistrictFilter();
    populateTownFilter();
    if (ui.typeFilter) ui.typeFilter.value = state.currentFilters.type;
    if (ui.sortFilter) ui.sortFilter.value = 'score';

    clearSearch();
    reloadRanking();
    $('#ranking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateMapHospitals(hospitals) {
    if (typeof MapModule !== 'undefined') {
      MapModule.updateMarkers(hospitals);
    }
  }

  function buildEmptyState(title, description) {
    return `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">
        <p style="font-size:2rem;margin-bottom:12px;">🔎</p>
        <p>${escapeHtml(title)}</p>
        <p style="font-size:var(--fs-sm);">${escapeHtml(description)}</p>
      </div>
    `;
  }

  function buildSearchEmptyState(description, intent) {
    const suggestions = buildSearchSuggestionQueries(intent);
    const presets = buildSearchFallbackPresets(intent);

    return `
      <div class="search-empty-state">
        <div class="search-empty-head">
          <p class="search-empty-icon">🔎</p>
          <h3>검색 결과가 없습니다.</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="search-empty-sections">
          <div class="search-empty-group">
            <h4>다시 검색해보기</h4>
            <div class="search-empty-chip-list">
              ${suggestions.map((query) => `
                <button type="button" class="search-empty-chip" data-search-query="${escapeHtml(query)}">${escapeHtml(query)}</button>
              `).join('')}
            </div>
          </div>
          <div class="search-empty-group">
            <h4>바로 목록 보기</h4>
            <div class="search-empty-preset-list">
              ${presets.map((preset) => `
                <button
                  type="button"
                  class="search-empty-preset"
                  data-preset-region="${escapeHtml(preset.region || 'all')}"
                  data-preset-department="${escapeHtml(preset.department || 'all')}"
                  data-preset-type="${escapeHtml(preset.type || 'all')}"
                >
                  <strong>${escapeHtml(preset.title)}</strong>
                  <span>${escapeHtml(preset.description)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function buildSearchSuggestionQueries(intent) {
    const suggestions = [];
    const departmentLabel = intent?.department && typeof SearchEngine !== 'undefined'
      ? SearchEngine.getDepartmentLabel(intent.department)
      : '';
    const region = intent?.region || '';

    if (region && departmentLabel) {
      suggestions.push(`${region} ${departmentLabel}`);
      suggestions.push(`${region} ${departmentLabel} 토요일`);
      suggestions.push(`${region} ${departmentLabel} 야간`);
    } else if (region) {
      suggestions.push(`${region} 치과`);
      suggestions.push(`${region} 정형외과`);
      suggestions.push(`${region} 안과`);
    } else if (departmentLabel) {
      suggestions.push(`서울 ${departmentLabel}`);
      suggestions.push(`경기 ${departmentLabel}`);
      suggestions.push(`부산 ${departmentLabel}`);
    }

    suggestions.push('서울 치과');
    suggestions.push('경기 정형외과 토요일');
    suggestions.push('서울 소아과 일요일');

    return Array.from(new Set(suggestions.filter(Boolean))).slice(0, 6);
  }

  function buildSearchFallbackPresets(intent) {
    const department = intent?.department || 'all';
    const region = intent?.region || 'all';
    const departmentLabel = department !== 'all' && typeof SearchEngine !== 'undefined'
      ? SearchEngine.getDepartmentLabel(department)
      : '병원';

    const presets = [];

    if (department !== 'all') {
      presets.push({
        title: `서울 ${departmentLabel} 목록`,
        description: '서울 권역에서 먼저 넓게 비교합니다.',
        region: '서울',
        department,
      });
      presets.push({
        title: `경기 ${departmentLabel} 목록`,
        description: '경기 권역 병원을 함께 비교합니다.',
        region: '경기',
        department,
      });
    }

    if (region !== 'all') {
      presets.push({
        title: `${region} 치과 목록`,
        description: `${region}에서 많이 찾는 치과부터 확인합니다.`,
        region,
        department: 'dental',
      });
      presets.push({
        title: `${region} 정형외과 목록`,
        description: `${region} 정형외과 병원을 바로 봅니다.`,
        region,
        department: 'orthopedic',
      });
    }

    presets.push({
      title: '전체 병원 목록',
      description: '조건을 풀고 전체 목록에서 다시 탐색합니다.',
      region: 'all',
      department: 'all',
      type: 'all',
    });

    return presets.slice(0, 4);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  }

  function formatNaverDate(dateText) {
    if (!dateText || dateText.length !== 8) return '';
    return `${dateText.slice(0, 4)}.${dateText.slice(4, 6)}.${dateText.slice(6, 8)}`;
  }

  function stripHtml(value) {
    return String(value || '').replace(/<[^>]*>/g, '');
  }

  function mergeHospitalsWithFallback(hospitals) {
    const fallbackHospitals = getStaticHospitalPool();
    const fallbackByKey = new Map(fallbackHospitals.map((hospital) => [buildHospitalKey(hospital), hospital]));

    return (Array.isArray(hospitals) ? hospitals : []).map((hospital) => (
      mergeHospitalWithFallback(hospital, fallbackByKey.get(buildHospitalKey(hospital)))
    ));
  }

  function mergeHospitalWithFallback(hospital, fallback) {
    const resolvedAddress = hospital.address || fallback?.address || '';
    return {
      ...fallback,
      ...hospital,
      district: hospital.district || fallback?.district || extractDistrictFromAddress(resolvedAddress),
      town: hospital.town || fallback?.town || extractTownFromAddress(resolvedAddress),
      hours: hospital.hours || fallback?.hours,
      saturdayOpen: resolveOperationalValue(hospital.saturdayOpen, fallback?.saturdayOpen),
      sundayOpen: resolveOperationalValue(hospital.sundayOpen, fallback?.sundayOpen),
      nightOpen: resolveOperationalValue(hospital.nightOpen, fallback?.nightOpen),
      openDate: hospital.openDate || fallback?.openDate || '',
      subway: hospital.subway || fallback?.subway || '',
      parkingCapacity: hospital.parkingCapacity || fallback?.parkingCapacity || 0,
      parkingFee: hospital.parkingFee || fallback?.parkingFee || '',
      equipment: hospital.equipment || fallback?.equipment || '',
      roomCount: hospital.roomCount || fallback?.roomCount || 0,
      bedCount: hospital.bedCount || fallback?.bedCount || 0,
      area: hospital.area || fallback?.area || '',
    };
  }

  function resolveOperationalValue(primary, fallback) {
    if (primary === true || primary === false) return primary;
    if (fallback === true || fallback === false) return fallback;
    return null;
  }

  function extractDistrictFromAddress(address = '') {
    const tokens = String(address || '').split(/\s+/).filter(Boolean);
    const candidates = tokens.filter((token, index) => index > 0 && /(?:시|군|구)$/.test(token));
    return candidates.length > 0 ? candidates[candidates.length - 1] : '';
  }

  function extractTownFromAddress(address = '') {
    const tokens = String(address || '').split(/\s+/).filter(Boolean);
    const match = tokens.find((token) => /(?:읍|면|동|가|리)$/.test(token));
    return match || '';
  }

  function getStaticHospitalPool() {
    const baseHospitals = Array.isArray(typeof HOSPITALS !== 'undefined' ? HOSPITALS : null)
      ? HOSPITALS
      : [];
    const supplementalHospitals = Array.isArray(typeof NEW_HOSPITALS !== 'undefined' ? NEW_HOSPITALS : null)
      ? NEW_HOSPITALS.map(normalizeSupplementalHospital)
      : [];

    return dedupeHospitals([...baseHospitals, ...supplementalHospitals]);
  }

  function normalizeSupplementalHospital(hospital = {}) {
    const address = String(hospital.address || '').trim();
    const department = String(hospital.department || '').trim();
    const departmentId = String(hospital.departmentId || '').trim() || inferDepartmentIdFromText(department);

    return {
      id: hospital.id || `new-${Math.random().toString(36).slice(2, 9)}`,
      name: String(hospital.name || '').trim(),
      type: inferHospitalTypeFromDepartment(departmentId),
      department,
      departmentId,
      address,
      region: extractRegionFromAddress(address),
      district: extractDistrictFromAddress(address),
      town: extractTownFromAddress(address),
      phone: String(hospital.phone || '').trim(),
      score: Number(hospital.score || 0) || 4.1,
      reviewCount: Number(hospital.reviewCount || 0) || 0,
      specialistCount: Number(hospital.specialistCount || 0) || 0,
      openDate: String(hospital.openDate || '').trim(),
      saturdayOpen: hospital.saturdayOpen ?? null,
      sundayOpen: hospital.sundayOpen ?? null,
      nightOpen: hospital.nightOpen ?? null,
      lat: Number(hospital.lat || 0) || 0,
      lng: Number(hospital.lng || 0) || 0,
      subway: String(hospital.subway || '').trim(),
      parkingCapacity: Number(hospital.parkingCapacity || 0) || 0,
      parkingFee: String(hospital.parkingFee || '').trim(),
      equipment: String(hospital.equipment || '').trim(),
      roomCount: Number(hospital.roomCount || 0) || 0,
      bedCount: Number(hospital.bedCount || 0) || 0,
      area: String(hospital.area || '').trim(),
    };
  }

  function inferDepartmentIdFromText(text = '') {
    const value = String(text || '').trim();
    if (!value) return 'general';
    if (value.includes('치과')) return 'dental';
    if (value.includes('한의원') || value.includes('한방')) return 'korean';
    if (value.includes('정형외과')) return 'orthopedic';
    if (value.includes('안과')) return 'ophthalmology';
    if (value.includes('피부과')) return 'dermatology';
    if (value.includes('이비인후과')) return 'ent';
    if (value.includes('소아청소년과') || value.includes('소아과')) return 'pediatric';
    if (value.includes('산부인과')) return 'obgyn';
    if (value.includes('비뇨의학과') || value.includes('비뇨기과')) return 'urology';
    if (value.includes('정신건강의학과') || value.includes('정신과')) return 'psychiatry';
    if (value.includes('성형외과')) return 'plastic';
    if (value.includes('신경외과')) return 'neurosurgery';
    if (value.includes('가정의학과')) return 'familymed';
    if (value.includes('외과')) return 'surgery';
    if (value.includes('통증의학과') || value.includes('마취통증의학과')) return 'pain';
    if (value.includes('재활의학과')) return 'rehab';
    if (value.includes('내과')) return 'internal';
    return 'general';
  }

  function inferHospitalTypeFromDepartment(departmentId = '') {
    if (departmentId === 'dental') return '치과의원';
    if (departmentId === 'korean') return '한의원';
    if (departmentId === 'general') return '종합병원';
    return '의원';
  }

  function extractRegionFromAddress(address = '') {
    const text = String(address || '').trim();
    if (text.startsWith('서울')) return '서울';
    if (text.startsWith('경기')) return '경기';
    if (text.startsWith('인천')) return '인천';
    if (text.startsWith('부산')) return '부산';
    if (text.startsWith('대구')) return '대구';
    if (text.startsWith('대전')) return '대전';
    if (text.startsWith('광주')) return '광주';
    if (text.startsWith('울산')) return '울산';
    if (text.startsWith('세종')) return '세종';
    if (text.startsWith('강원')) return '강원';
    if (text.startsWith('충청북도') || text.startsWith('충북')) return '충북';
    if (text.startsWith('충청남도') || text.startsWith('충남')) return '충남';
    if (text.startsWith('전북') || text.startsWith('전라북도')) return '전북';
    if (text.startsWith('전남') || text.startsWith('전라남도')) return '전남';
    if (text.startsWith('경북') || text.startsWith('경상북도')) return '경북';
    if (text.startsWith('경남') || text.startsWith('경상남도')) return '경남';
    if (text.startsWith('제주')) return '제주';
    return '';
  }

  function getFilterSourceHospitals() {
    const fetched = Array.isArray(state.allFetchedHospitals) ? state.allFetchedHospitals : [];
    const fallback = getStaticHospitalPool();
    const combined = mergeHospitalsWithFallback([...fetched, ...fallback]);
    const seen = new Set();
    return combined.filter((hospital) => {
      const key = buildHospitalKey(hospital);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async function hydrateHospitalCardDetails(hospitals, container, limit = 12) {
    if (!container || !Array.isArray(hospitals) || hospitals.length === 0) {
      return;
    }

    const targets = hospitals
      .filter((hospital) => isHydratableHospital(hospital))
      .slice(0, limit);

    await Promise.allSettled(targets.map(async (hospital) => {
      const [detailData, equipData] = await Promise.all([
        fetchHospitalDetailSummary(hospital.id),
        fetchHospitalEquipSummary(hospital.id),
      ]);

      if (!detailData?.found && !equipData?.found) {
        return;
      }
      applyHospitalDetailSummary(container, hospital, detailData, equipData);
    }));
  }

  function isHydratableHospital(hospital) {
    return typeof hospital?.id === 'string' && hospital.id.startsWith('JD');
  }

  async function fetchHospitalDetailSummary(hospitalId) {
    if (state.detailSummaryCache.has(hospitalId)) {
      return state.detailSummaryCache.get(hospitalId);
    }

    if (state.detailSummaryInflight.has(hospitalId)) {
      return state.detailSummaryInflight.get(hospitalId);
    }

    const request = fetch(`/api/hospital-details?ykiho=${encodeURIComponent(hospitalId)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        state.detailSummaryCache.set(hospitalId, data);
        state.detailSummaryInflight.delete(hospitalId);
        return data;
      })
      .catch((error) => {
        state.detailSummaryInflight.delete(hospitalId);
        console.warn('[app] failed to hydrate hospital detail summary:', hospitalId, error);
        return null;
      });

    state.detailSummaryInflight.set(hospitalId, request);
    return request;
  }

  async function fetchHospitalEquipSummary(hospitalId) {
    if (state.equipSummaryCache.has(hospitalId)) {
      return state.equipSummaryCache.get(hospitalId);
    }

    if (state.equipSummaryInflight.has(hospitalId)) {
      return state.equipSummaryInflight.get(hospitalId);
    }

    const request = fetch(`/api/hospital-equip?ykiho=${encodeURIComponent(hospitalId)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        state.equipSummaryCache.set(hospitalId, data);
        state.equipSummaryInflight.delete(hospitalId);
        return data;
      })
      .catch((error) => {
        state.equipSummaryInflight.delete(hospitalId);
        console.warn('[app] failed to hydrate hospital equipment summary:', hospitalId, error);
        return null;
      });

    state.equipSummaryInflight.set(hospitalId, request);
    return request;
  }

  function applyHospitalDetailSummary(container, hospital, detailData, equipData = null) {
    const cards = getHospitalCards(container, hospital.id);
    if (!cards.length) {
      return;
    }

    if (detailData?.addr) {
      hospital.address = detailData.addr;
      hospital.district = hospital.district || extractDistrictFromAddress(detailData.addr);
      hospital.town = hospital.town || extractTownFromAddress(detailData.addr);
    }
    if (detailData?.telno) {
      hospital.phone = detailData.telno;
    }
    if (detailData?.hospUrl) {
      hospital.url = detailData.hospUrl;
    }
    if (detailData?.parkQty) {
      hospital.parkingCapacity = Number(detailData.parkQty) || hospital.parkingCapacity || 0;
    }
    if (detailData?.parkXpnsYn) {
      hospital.parkingFee = detailData.parkXpnsYn === 'Y' ? '유료' : '무료';
    }
    if (Array.isArray(equipData?.topEquipment) && equipData.topEquipment.length > 0) {
      hospital.equipment = equipData.topEquipment
        .slice(0, 3)
        .map((item) => `${item.name} ${item.count}대`)
        .join(', ');
    } else if (Array.isArray(equipData?.equipDetails) && equipData.equipDetails.length > 0) {
      hospital.equipment = equipData.equipDetails
        .slice(0, 3)
        .map((item) => `${item.name} ${item.count}대`)
        .join(', ');
    } else if (Array.isArray(equipData?.equips) && equipData.equips.length > 0 && !hospital.equipment) {
      hospital.equipment = equipData.equips.slice(0, 3).join(', ');
    }
    if (equipData?.facility) {
      const standardBeds = Number(equipData.facility.stdSickbdCnt || 0);
      const specialBeds = Number(equipData.facility.permSbdCnt || 0);
      const totalBeds = standardBeds + specialBeds;
      if (totalBeds > 0) {
        hospital.bedCount = totalBeds;
      }
      if (equipData.facility.totArea) {
        hospital.area = String(equipData.facility.totArea);
      }
    }
    if (detailData?.hours && !hospital.hours) {
      hospital.hours = detailData.hours;
    }
    if (detailData?.emyDayYn === 'Y' || detailData?.emyNgtYn === 'Y') {
      hospital.hasEmergency = true;
    }
    if (detailData?.hours) {
      updateHospitalOperationalState(hospital, detailData.hours);
    }

    const highlightItems = buildHospitalHighlightItems(hospital, detailData);
    const factItems = buildHospitalFactItems(hospital, detailData);
    const statusItems = buildHospitalStatusItems(hospital);
    const statusSummary = buildHospitalStatusSummary(hospital);
    const trustBadges = buildHospitalTrustBadges(hospital, detailData);
    const summaryText = buildHospitalDataSummary(hospital, detailData);
    const evidenceText = buildHospitalEvidenceSummary(hospital, detailData);
    const decisionText = buildHospitalDecisionSummary(hospital, detailData);
    const insightItems = buildHospitalInsightItems(hospital, detailData);
    const subinfoText = buildHospitalSubinfo(hospital);
    const metaItems = buildHospitalMetaItems(hospital);

    cards.forEach((card) => {
      const addressNode = card.querySelector('.hospital-address, .quick-access-address');
      if (addressNode && hospital.address) {
        addressNode.textContent = addressNode.classList.contains('hospital-address')
          ? `주소 ${hospital.address}`
          : hospital.address;
      }

      const subinfoNode = card.querySelector('[data-hospital-subinfo]');
      if (subinfoNode && subinfoText) {
        subinfoNode.innerHTML = subinfoText;
      }

      const highlightNode = card.querySelector('[data-hospital-highlights]');
      if (highlightNode) {
        if (highlightItems.length > 0) {
          highlightNode.hidden = false;
          highlightNode.innerHTML = highlightItems
            .map((item) => `<span class="hospital-highlight">${escapeHtml(item)}</span>`)
            .join('');
        } else {
          highlightNode.hidden = true;
          highlightNode.innerHTML = '';
        }
      }

      const summaryNode = card.querySelector('[data-hospital-summary]');
      if (summaryNode && summaryText) {
        summaryNode.textContent = summaryText;
        summaryNode.classList.remove('is-pending');
      }

      const factsNode = card.querySelector('[data-hospital-facts]');
      if (factsNode) {
        factsNode.innerHTML = renderHospitalFactGrid(factItems);
      }

      const insightNode = card.querySelector('[data-hospital-insights]');
      if (insightNode) {
        if (insightItems.length > 0) {
          insightNode.hidden = false;
          insightNode.innerHTML = renderHospitalInsightList(insightItems);
        } else {
          insightNode.hidden = true;
          insightNode.innerHTML = '';
        }
      }

      const statusNode = card.querySelector('[data-hospital-status]');
      if (statusNode) {
        statusNode.innerHTML = renderHospitalStatusBadges(statusItems);
      }

      const trustNode = card.querySelector('[data-hospital-trust]');
      if (trustNode) {
        trustNode.innerHTML = renderHospitalTrustBadges(trustBadges);
      }

      const statusSummaryNode = card.querySelector('[data-hospital-status-summary]');
      if (statusSummaryNode) {
        statusSummaryNode.textContent = statusSummary;
      }

      const evidenceNode = card.querySelector('.hospital-evidence-summary');
      if (evidenceNode && evidenceText) {
        evidenceNode.textContent = evidenceText;
      }

      const decisionNode = card.querySelector('.hospital-decision-summary');
      if (decisionNode && decisionText) {
        decisionNode.textContent = decisionText;
      }

      const metaNode = card.querySelector('[data-hospital-meta]');
      if (metaNode && metaItems.length > 0) {
        metaNode.innerHTML = renderHospitalMetaItems(metaItems, metaNode.classList.contains('quick-access-meta'));
      }
    });
  }

  function updateHospitalOperationalState(hospital, hours) {
    if (!hospital || !hours) {
      return;
    }

    hospital.saturdayOpen = typeof hours.sat === 'string' && hours.sat.includes(':');
    hospital.sundayOpen = typeof hours.sun === 'string' && hours.sun.includes(':');
    hospital.nightOpen = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].some((key) => {
      const value = hours[key];
      if (typeof value !== 'string' || !value.includes('~')) return false;
      const end = value.split('~')[1]?.trim() || '';
      return end >= '18:30';
    });
  }

  function getHospitalCards(container, hospitalId) {
    const escapedId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(String(hospitalId))
      : String(hospitalId).replace(/"/g, '\\"');

    return Array.from(container.querySelectorAll(`[data-hospital-id="${escapedId}"]`));
  }

  function isRecentHospital(openDate) {
    const date = new Date(openDate);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 365 * 3;
  }

  function uniqueStrings(items) {
    return Array.from(new Set((Array.isArray(items) ? items : []).filter(Boolean)));
  }

  function toPositiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function getHospitalContent() {
    if (typeof HospitalContent !== 'undefined') {
      return HospitalContent;
    }
    return window.HospitalContent;
  }

  function applyInitialRouteState() {
    const params = new URLSearchParams(window.location.search);
    const validDepartments = new Set((typeof DEPARTMENTS !== 'undefined' ? DEPARTMENTS : []).map((item) => item.id));
    const validRegions = new Set((typeof REGIONS !== 'undefined' ? REGIONS : []).map((item) => item.name));
    const validTypes = new Set(['all', 'hospital', 'clinic', 'dental', 'korean']);
    const validSorts = new Set(['score', 'reviews', 'specialists', 'newest', 'name']);

    const region = params.get('region');
    const district = params.get('district');
    const town = params.get('town');
    const department = params.get('department');
    const type = params.get('type');
    const sort = params.get('sort');
    const keyword = params.get('keyword');

    if (region && validRegions.has(region)) {
      state.currentFilters.region = region;
    }
    if (district) {
      state.currentFilters.district = district;
    }
    if (town) {
      state.currentFilters.town = town;
    }
    if (department && validDepartments.has(department)) {
      state.currentFilters.department = department;
    }
    if (type && validTypes.has(type)) {
      state.currentFilters.type = type;
    }
    if (sort && validSorts.has(sort)) {
      state.currentSort = sort;
    }
    if (keyword && ui.heroSearch) {
      ui.heroSearch.value = keyword;
    }
  }

  function syncFilterControls() {
    if (ui.regionFilter) ui.regionFilter.value = state.currentFilters.region;
    if (ui.heroRegionFilter) ui.heroRegionFilter.value = state.currentFilters.region;
    populateDistrictFilter();
    populateTownFilter();
    if (ui.typeFilter) ui.typeFilter.value = state.currentFilters.type;
    if (ui.sortFilter) ui.sortFilter.value = state.currentSort;
  }

  function syncListingQuery(keyword = '') {
    const params = new URLSearchParams();
    if (state.currentFilters.region !== 'all') params.set('region', state.currentFilters.region);
    if (state.currentFilters.district !== 'all') params.set('district', state.currentFilters.district);
    if (state.currentFilters.town !== 'all') params.set('town', state.currentFilters.town);
    if (state.currentFilters.department !== 'all') params.set('department', state.currentFilters.department);
    if (state.currentFilters.type !== 'all') params.set('type', state.currentFilters.type);
    if (state.currentSort !== 'score') params.set('sort', state.currentSort);
    if (keyword) params.set('keyword', keyword);

    const basePath = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    const hash = keyword ? '#search-results' : (params.toString() ? '#ranking' : '');
    const nextUrl = `${basePath}${hash}`;
    window.history.replaceState({}, '', nextUrl);
  }

  function triggerInitialKeywordSearch() {
    const keyword = new URLSearchParams(window.location.search).get('keyword');
    if (!keyword) {
      return;
    }
    void performSearch();
  }
});

