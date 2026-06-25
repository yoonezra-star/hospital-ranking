document.addEventListener('DOMContentLoaded', () => {
  const state = {
    currentFilters: { region: 'all', department: 'all', type: 'all' },
    currentSort: 'score',
    currentPage: 1,
    totalCount: 0,
    allFetchedHospitals: [],
    isApiAvailable: false,
    isSearchActive: false,
    detailSummaryCache: new Map(),
    detailSummaryInflight: new Map(),
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
    clearSearchBtn: $('#clear-search'),
    searchResults: $('#search-results'),
    searchResultsList: $('#search-results-list'),
    searchQueryDisplay: $('#search-query-display'),
    searchIntentSummary: $('#search-intent-summary'),
    searchRefineBar: $('#search-refine-bar'),
    searchResultCount: $('#search-result-count'),
    departmentGrid: $('#department-grid'),
    regionFilter: $('#region-filter'),
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
    if (!ui.regionFilter || typeof REGIONS === 'undefined') return;

    REGIONS.forEach((region) => {
      const option = document.createElement('option');
      option.value = region.name;
      option.textContent = region.name;
      ui.regionFilter.appendChild(option);
    });

    syncFilterControls();
  }

  function showLoading(show) {
    if (!ui.rankingLoader) return;
    ui.rankingLoader.style.display = show ? 'flex' : 'none';
  }

  function updateLoadMore() {
    if (!ui.loadMoreBtn) return;

    const hasMore = state.isApiAvailable && (state.currentPage * 20 < state.totalCount);
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
      limit: 20,
      preferMock: true,
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

    state.isApiAvailable = !result.fromMock;
    state.totalCount = result.totalCount;
    state.allFetchedHospitals = append
      ? [...state.allFetchedHospitals, ...mergedHospitals]
      : mergedHospitals;

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
      void hydrateHospitalCardDetails(hospitals, ui.rankingList, 12);
      return;
    }

    ui.rankingList.classList.remove('ranking-group-list');
    ui.rankingCount.innerHTML = state.isApiAvailable
      ? `전국 <strong>${state.totalCount.toLocaleString()}</strong>개 병원 중 <strong>${hospitals.length}</strong>개 표시`
      : `총 <strong>${hospitals.length}</strong>개 병원 (샘플 데이터)`;
    ui.rankingList.innerHTML = hospitals.map((hospital, index) => buildHospitalCard(hospital, index + 1)).join('');
    observeNewElements(ui.rankingList);
    void hydrateHospitalCardDetails(hospitals, ui.rankingList, 12);
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
    const highlightItems = buildHospitalHighlightItems(hospital);
    const dataSummary = buildHospitalDataSummary(hospital);
    const evidenceSummary = buildHospitalEvidenceSummary(hospital);

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
          ${subinfo ? `<div class="hospital-subinfo">${subinfo}</div>` : ''}
          <div class="hospital-highlights" data-hospital-highlights${highlightItems.length ? '' : ' hidden'}>
            ${highlightItems.map((item) => `<span class="hospital-highlight">${escapeHtml(item)}</span>`).join('')}
          </div>
          ${featureNote ? `<p class="hospital-feature-note">${escapeHtml(featureNote)}</p>` : ''}
          ${focusNote ? `<p class="hospital-focus-note">${escapeHtml(focusNote)}</p>` : ''}
          ${visitPrepNote ? `<p class="hospital-visit-prep">${escapeHtml(visitPrepNote)}</p>` : ''}
          <p class="hospital-data-summary${dataSummary ? '' : ' is-pending'}" data-hospital-summary>${escapeHtml(dataSummary || '주차, 접수, 운영 정보를 불러오는 중입니다.')}</p>
          ${evidenceSummary ? `<p class="hospital-evidence-summary">${escapeHtml(evidenceSummary)}</p>` : ''}
          <div class="hospital-meta">
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

  function buildHospitalEvidenceSummary(hospital) {
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
    if (hospital.equipment) {
      parts.push(`장비 ${String(hospital.equipment).split(',')[0].trim()}`);
    }
    if (hospital.openDate) {
      parts.push(`개원 ${formatDate(hospital.openDate)}`);
    }

    return uniqueStrings(parts).slice(0, 4).join(' / ');
  }

  async function renderReviews() {
    if (!ui.reviewsList) return;

    ui.reviewsList.innerHTML = '<div class="map-loader"><div class="spinner"></div><p>리뷰 데이터를 불러오는 중입니다...</p></div>';

    const keywords = [
      '임플란트 후기',
      '수면내시경 후기',
      '백내장 수술 후기',
      '안수치료 후기',
      '라식 수술 후기',
    ];
    const selectedKeyword = keywords[Math.floor(Math.random() * keywords.length)];

    if (ui.reviewsTitle) {
      ui.reviewsTitle.textContent = `실시간 ${selectedKeyword.replace(' 후기', '')} 리뷰 후기`;
    }

    const items = await HospitalAPI.fetchNaverSearch(selectedKeyword, 'blog', 6);

    if (items.length === 0) {
      ui.reviewsList.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">리뷰를 불러오지 못했습니다.</p>';
      return;
    }

    ui.reviewsList.innerHTML = items.map((item, index) => {
      const title = stripHtml(item.title || '');
      const description = stripHtml(item.description || '');
      const date = formatNaverDate(item.postdate);

      return `
        <a href="${item.link}" target="_blank" rel="noopener" class="review-card fade-up delay-${index % 3}" style="text-decoration:none; display:flex; flex-direction:column; cursor:pointer;">
          <div class="review-header" style="margin-bottom:10px;">
            <span class="review-badge" style="background:#03C75A; color:white;">네이버 블로그</span>
            <span class="review-hospital" style="font-size:0.85rem; color:var(--text-muted);">${escapeHtml(item.bloggername || '')}</span>
            <span style="margin-left:auto; font-size:0.8rem; color:var(--text-muted);">${date}</span>
          </div>
          <h3 style="font-size:1rem; margin-bottom:8px; color:var(--text-heading); font-weight:600; line-height:1.4;">${escapeHtml(title)}</h3>
          <p class="review-content" style="flex-grow:1; -webkit-line-clamp:3;">${escapeHtml(description)}</p>
        </a>
      `;
    }).join('');

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
    const liveOpenHospitals = hospitals
      .filter((hospital) => isHospitalOpenNow(hospital))
      .sort(compareFeaturedHospitals)
      .slice(0, 4);
    const currentOpen = liveOpenHospitals.length
      ? liveOpenHospitals
      : hospitals
        .filter((hospital) => isAvailableToday(hospital))
        .sort(compareFeaturedHospitals)
        .slice(0, 4);
    const saturdayOpen = hospitals
      .filter((hospital) => hospital.saturdayOpen)
      .sort(compareFeaturedHospitals)
      .slice(0, 4);
    const nightOpen = hospitals
      .filter((hospital) => hospital.nightOpen)
      .sort(compareFeaturedHospitals)
      .slice(0, 4);
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
      12
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
    const fallbackHospitals = Array.isArray(HOSPITALS) ? HOSPITALS : [];
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
      (right.score || 0) - (left.score || 0) ||
      (right.reviewCount || 0) - (left.reviewCount || 0) ||
      (right.specialistCount || 0) - (left.specialistCount || 0) ||
      String(left.name || '').localeCompare(String(right.name || ''), 'ko')
    );
  }

  function hasKnownOperationalData(hospital) {
    if (!hospital) return false;
    if (hospital.saturdayOpen === true || hospital.saturdayOpen === false) return true;
    if (hospital.sundayOpen === true || hospital.sundayOpen === false) return true;
    if (hospital.nightOpen === true || hospital.nightOpen === false) return true;
    return Boolean(hospital.hours);
  }

  function buildQuickAccessCard(hospital) {
    const href = hospital.id ? `detail.html?id=${encodeURIComponent(hospital.id)}` : '#';
    const type = hospital.department || hospital.type || '병원';
    const meta = [];
    const subinfo = buildHospitalSubinfo(hospital);
    const featureNote = buildHospitalFeatureNote(hospital);
    const highlightItems = buildHospitalHighlightItems(hospital);
    const dataSummary = buildHospitalDataSummary(hospital);

    if (hospital.score) meta.push(`평점 ${hospital.score}`);
    if (hospital.reviewCount) meta.push(`리뷰 ${Number(hospital.reviewCount).toLocaleString()}개`);
    if (hospital.specialistCount) meta.push(`전문의 ${Number(hospital.specialistCount).toLocaleString()}명`);
    if (hospital.phone) meta.push(hospital.phone);

    return `
      <a class="quick-access-item fade-up" href="${href}" data-hospital-id="${escapeHtml(hospital.id)}">
        <div class="quick-access-title-row">
          <strong>${escapeHtml(hospital.name)}</strong>
          <span class="hospital-type-tag">${escapeHtml(type)}</span>
        </div>
        <p class="quick-access-address">${escapeHtml(hospital.address || '주소 확인 필요')}</p>
        ${subinfo ? `<div class="quick-access-subinfo">${subinfo}</div>` : ''}
        <div class="hospital-highlights quick-access-highlights" data-hospital-highlights${highlightItems.length ? '' : ' hidden'}>
          ${highlightItems.map((item) => `<span class="hospital-highlight">${escapeHtml(item)}</span>`).join('')}
        </div>
        ${featureNote ? `<p class="hospital-feature-note">${escapeHtml(featureNote)}</p>` : ''}
        <p class="hospital-data-summary quick-access-summary${dataSummary ? '' : ' is-pending'}" data-hospital-summary>${escapeHtml(dataSummary || '주차, 접수, 운영 정보를 불러오는 중입니다.')}</p>
        <div class="quick-access-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
      </a>
    `;
  }

  function buildRecentOpenCard(hospital) {
    const highlightItems = buildHospitalHighlightItems(hospital);
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
    renderSearchIntentSummary(intent);
    setSearchRefineState(intent);

    if (ui.searchQueryDisplay) {
      ui.searchQueryDisplay.textContent = `"${query}"`;
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
      void hydrateHospitalCardDetails(hospitals, ui.searchResultsList, 8);
    }

    syncListingQuery(query);
    ui.searchResults?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function searchHospitalsByIntent(query, intent) {
    const localSource = dedupeHospitals(getFeaturedHospitalsSource());
    const localResults = typeof SearchEngine !== 'undefined'
      ? SearchEngine.query(localSource, { searchText: query, sortBy: state.currentSort, intent })
      : localSource;

    if (localResults.length > 0) {
      return { hospitals: localResults, source: 'local' };
    }

    const apiParams = buildSearchApiParams(intent);
    let remoteHospitals = [];

    if (apiParams) {
      const remoteResult = await HospitalAPI.fetchHospitals(apiParams);
      remoteHospitals = mergeHospitalsWithFallback(remoteResult.hospitals);
    }

    const combined = dedupeHospitals([...localResults, ...remoteHospitals]);
    const hospitals = typeof SearchEngine !== 'undefined'
      ? SearchEngine.query(combined, { searchText: query, sortBy: state.currentSort, intent })
      : combined;

    return { hospitals, source: 'remote' };
  }

  function buildSearchApiParams(intent) {
    if (!intent) {
      return null;
    }

    const params = { limit: 40 };

    if (intent.region) {
      params.region = intent.region;
    }
    if (intent.department) {
      params.department = intent.department;
    }
    if (intent.keywordText) {
      params.name = intent.keywordText;
    }

    if (!params.region && !params.department && !params.name) {
      return null;
    }

    return params;
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
      if (event.key === 'Enter') {
        void performSearch();
      }
    });

    ui.clearSearchBtn?.addEventListener('click', clearSearch);

    $$('.search-helper-chip').forEach((button) => {
      button.addEventListener('click', () => {
        const example = button.dataset.searchExample || '';
        if (ui.heroSearch) {
          ui.heroSearch.value = example;
        }
        void performSearch();
      });
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
      reloadRanking();
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
    void loadRankingData(false);
  }

  function applyLandingPreset(card) {
    state.currentFilters.region = card.dataset.landingRegion || 'all';
    state.currentFilters.department = card.dataset.landingDepartment || 'all';
    state.currentFilters.type = card.dataset.landingType || 'all';
    state.currentSort = 'score';

    if (ui.regionFilter) ui.regionFilter.value = state.currentFilters.region;
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
    const fallbackHospitals = Array.isArray(HOSPITALS) ? HOSPITALS : [];
    const fallbackByKey = new Map(fallbackHospitals.map((hospital) => [buildHospitalKey(hospital), hospital]));

    return (Array.isArray(hospitals) ? hospitals : []).map((hospital) => (
      mergeHospitalWithFallback(hospital, fallbackByKey.get(buildHospitalKey(hospital)))
    ));
  }

  function mergeHospitalWithFallback(hospital, fallback) {
    return {
      ...fallback,
      ...hospital,
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

  async function hydrateHospitalCardDetails(hospitals, container, limit = 12) {
    if (!container || !Array.isArray(hospitals) || hospitals.length === 0) {
      return;
    }

    const targets = hospitals
      .filter((hospital) => isHydratableHospital(hospital))
      .slice(0, limit);

    await Promise.allSettled(targets.map(async (hospital) => {
      const detailData = await fetchHospitalDetailSummary(hospital.id);
      if (!detailData?.found) {
        return;
      }
      applyHospitalDetailSummary(container, hospital, detailData);
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

  function applyHospitalDetailSummary(container, hospital, detailData) {
    const cards = getHospitalCards(container, hospital.id);
    if (!cards.length) {
      return;
    }

    const highlightItems = buildHospitalHighlightItems(hospital, detailData);
    const summaryText = buildHospitalDataSummary(hospital, detailData);
    const evidenceText = buildHospitalEvidenceSummary(hospital);

    cards.forEach((card) => {
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

      const evidenceNode = card.querySelector('.hospital-evidence-summary');
      if (evidenceNode && evidenceText) {
        evidenceNode.textContent = evidenceText;
      }
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
    const department = params.get('department');
    const type = params.get('type');
    const sort = params.get('sort');
    const keyword = params.get('keyword');

    if (region && validRegions.has(region)) {
      state.currentFilters.region = region;
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
    if (ui.typeFilter) ui.typeFilter.value = state.currentFilters.type;
    if (ui.sortFilter) ui.sortFilter.value = state.currentSort;
  }

  function syncListingQuery(keyword = '') {
    const params = new URLSearchParams();
    if (state.currentFilters.region !== 'all') params.set('region', state.currentFilters.region);
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

