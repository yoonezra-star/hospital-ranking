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
    '?쒖슱 移섍낵',
    '媛뺣궓 移섍낵',
    '媛뺣궓 ?쇰?怨??쇨컙',
    '?쒖큹 ?뺥삎?멸낵',
    '?≫뙆 ?뚯븘怨?,
    '?≫뙆 ?뚯븘怨??쇱슂??,
    '遺꾨떦 ?닿낵',
    '留덊룷 移섍낵 二쇱감',
    '?ъ쓽???듭쬆?섑븰怨?,
    '?쒖슱 ?ы솢?섑븰怨?,
    '寃쎄린 ?뺥삎?멸낵 ?좎슂??,
    '?쇨컙 ?쇰?怨?,
    '?좎슂???뺥삎?멸낵',
    '?쇱슂???뚯븘怨?,
    '?묎툒 吏꾨즺 蹂묒썝',
    '二쇱감 媛?ν븳 移섍낵',
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
      ui.themeToggle.textContent = theme === 'dark' ? '?截? : '?뙔';
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
    if (!counters.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      counters.forEach((counter) => animateCounter(counter));
      return;
    }

    const hasEnteredViewport = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        hasEnteredViewport.add(entry.target);
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach((counter) => {
      const rect = counter.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const isVisibleOnLoad = rect.top < viewportHeight && rect.bottom > 0;

      if (isVisibleOnLoad) {
        hasEnteredViewport.add(counter);
        animateCounter(counter);
        return;
      }

      observer.observe(counter);
    });

    window.setTimeout(() => {
      counters.forEach((counter) => {
        if (hasEnteredViewport.has(counter)) return;
        counter.textContent = Number(counter.dataset.target || '0').toLocaleString();
      });
    }, 2200);
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
      <div class="dept-card fade-up delay-${index % 4}" data-dept-id="${department.id}" tabindex="0" role="button" aria-label="${escapeHtml(department.name)} 蹂묒썝 李얘린">
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
      select.innerHTML = '<option value="all">??援?援??좏깮</option>';
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
      select.innerHTML = '<option value="all">??硫????좏깮</option>';
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
    ui.loadMoreBtn.textContent = `?붾낫湲?(${state.allFetchedHospitals.length} / ${state.totalCount.toLocaleString()})`;
  }

  function updateDataBadge(fromMock) {
    if (!ui.dataSourceBadge) return;

    if (fromMock) {
      ui.dataSourceBadge.textContent = '蹂닿컯 ?곗씠???쒖떆';
      ui.dataSourceBadge.className = 'data-badge mock';
      if (ui.dataSourceNote) {
        ui.dataSourceNote.textContent = '?ㅼ떆媛?怨듦났 API媛 吏?곕릺硫?寃?섑븳 蹂닿컯 ?곗씠?곗? ?붿빟 ?뺣낫瑜?癒쇱? 蹂댁뿬以띾땲??';
      }
      return;
    }

    ui.dataSourceBadge.textContent = '怨듦났?곗씠???ㅼ떆媛??곕룞';
    ui.dataSourceBadge.className = 'data-badge live';
    if (ui.dataSourceNote) {
      ui.dataSourceNote.textContent = '嫄닿컯蹂댄뿕?ъ궗?됯?????怨듦났 API ?묐떟???곗꽑 諛섏쁺??蹂묒썝 紐⑸줉??蹂댁뿬二쇨퀬 ?덉뒿?덈떎.';
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
            <span class="landing-card-badge">${escapeHtml(section.badge || '吏??퀎 ?먯깋')}</span>
            <h3>${escapeHtml(section.title)}</h3>
            <p>${escapeHtml(section.description)}</p>
            <div class="landing-card-footer">
              <span>?꾪꽣瑜??곸슜??蹂묒썝 紐⑸줉?쇰줈 諛붾줈 ?대룞</span>
              <span class="landing-card-count">${count.toLocaleString()}怨?/span>
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
          <span class="landing-card-badge">${escapeHtml(section.badge || '諛붾줈媛湲?)}</span>
          <h3>${escapeHtml(section.title)}</h3>
          <p>${escapeHtml(section.description)}</p>
          <div class="landing-card-footer">
            <span>媛?대뱶 ?먮뒗 鍮좊Ⅸ ?먯깋 ?뱀뀡?쇰줈 ?대룞</span>
            <span class="landing-card-count">?닿린</span>
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
      ui.rankingCount.innerHTML = '議곌굔??留욌뒗 蹂묒썝??李얠? 紐삵뻽?듬땲??';
      ui.rankingList.classList.remove('ranking-group-list');
      ui.rankingList.innerHTML = buildEmptyState('議곌굔??留욌뒗 蹂묒썝???놁뒿?덈떎.', '?꾪꽣瑜?諛붽씀嫄곕굹 ?ㅻⅨ ?ㅼ썙?쒕줈 ?ㅼ떆 寃?됲빐蹂댁꽭??');
      return;
    }

    if (shouldRenderGroupedRanking()) {
      renderGroupedRankingCards(hospitals);
      void hydrateHospitalCardDetails(hospitals, ui.rankingList, 18);
      return;
    }

    ui.rankingList.classList.remove('ranking-group-list');
    ui.rankingCount.innerHTML = state.isApiAvailable
      ? `?꾧뎅 <strong>${state.totalCount.toLocaleString()}</strong>媛?蹂묒썝 以?<strong>${hospitals.length}</strong>媛??쒖떆`
      : `珥?<strong>${hospitals.length}</strong>媛?蹂묒썝 (?섑뵆 ?곗씠??`;
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
        title: '醫낇빀蹂묒썝쨌蹂묒썝',
        description: '蹂묒썝湲??댁긽 ?섎즺湲곌? 以묒떖 ?뺣젹',
        items: hospitals.filter((hospital) => getRankingGroup(hospital) === 'hospital').slice(0, 8),
      },
      {
        key: 'clinic',
        title: '?섏썝',
        description: '?숇꽕?섏썝怨??꾨Ц ?대━??,
        items: hospitals.filter((hospital) => getRankingGroup(hospital) === 'clinic').slice(0, 8),
      },
      {
        key: 'dental',
        title: '移섍낵',
        description: '移섍낵?섏썝 諛?移섍낵蹂묒썝',
        items: hospitals.filter((hospital) => getRankingGroup(hospital) === 'dental').slice(0, 8),
      },
      {
        key: 'korean',
        title: '?쒖쓽?먃룻븳諛⑸퀝??,
        description: '?쒕갑 吏꾨즺 湲곌?',
        items: hospitals.filter((hospital) => getRankingGroup(hospital) === 'korean').slice(0, 8),
      },
    ].filter((group) => group.items.length > 0);

    ui.rankingList.classList.add('ranking-group-list');
    ui.rankingCount.innerHTML = `蹂묒썝湲됰퀎 ?뱀뀡 <strong>${groups.length}</strong>媛?/ ?꾩껜 <strong>${hospitals.length}</strong>怨?;
    ui.rankingList.innerHTML = groups.map((group) => `
      <section class="ranking-group fade-up" data-ranking-group="${group.key}">
        <div class="ranking-group-header">
          <div>
            <h3>${group.title}</h3>
            <p>${group.description}</p>
          </div>
          <span class="ranking-group-count">${group.items.length}怨?/span>
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

    if (departmentId === 'dental' || type.includes('移섍낵')) return 'dental';
    if (departmentId === 'korean' || type.includes('?쒖쓽') || type.includes('?쒕갑')) return 'korean';
    if (type === '?섏썝') return 'clinic';
    if (type.includes('蹂묒썝') || type.includes('醫낇빀') || departmentId === 'general') return 'hospital';
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

    if (hospital.saturdayOpen) tags.push('<span class="tag tag-sat">?좎슂??吏꾨즺</span>');
    if (hospital.nightOpen) tags.push('<span class="tag tag-night">?쇨컙 吏꾨즺</span>');
    if (hospital.sundayOpen) tags.push('<span class="tag tag-sun">?쇱슂??吏꾨즺</span>');
    if (hospital.url) tags.push('<span class="tag tag-site">怨듭떇 ?덊럹?댁?</span>');
    if (!hasKnownOperationalData(hospital)) tags.push('<span class="tag tag-pending">?댁쁺?쒓컙 ?뺤씤 以?/span>');

    return `
      <article class="hospital-card fade-up" data-hospital-id="${escapeHtml(hospital.id)}">
        <div class="rank-badge ${rankClass}">${rank}</div>
        <div class="hospital-info">
          <div class="hospital-name">
            ${escapeHtml(hospital.name)}
            <span class="hospital-type-tag">${escapeHtml(hospital.type)}</span>
          </div>
          <div class="hospital-address">二쇱냼 ${escapeHtml(hospital.address)}</div>
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
          <p class="hospital-data-summary${dataSummary ? '' : ' is-pending'}" data-hospital-summary>${escapeHtml(dataSummary || '二쇱감, ?묒닔, ?댁쁺 ?뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.')}</p>
          ${decisionSummary ? `<p class="hospital-decision-summary">${escapeHtml(decisionSummary)}</p>` : ''}
          ${evidenceSummary ? `<p class="hospital-evidence-summary">${escapeHtml(evidenceSummary)}</p>` : ''}
          <div class="hospital-meta" data-hospital-meta>
            <div class="meta-item">
              <span class="meta-icon">?됱젏</span>
              <span class="meta-value">${escapeHtml(hospital.score)}</span>
            </div>
            ${hospital.reviewCount ? `<div class="meta-item"><span class="meta-icon">由щ럭</span><span class="meta-value">${escapeHtml(Number(hospital.reviewCount).toLocaleString())}</span><span class="meta-label">媛?/span></div>` : ''}
            <div class="meta-item">
              <span class="meta-icon">?꾨Ц??/span>
              <span class="meta-value">${escapeHtml(hospital.specialistCount || 0)}</span>
              <span class="meta-label">紐?/span>
            </div>
            ${hospital.phone ? `<div class="meta-item"><span class="meta-icon">?꾪솕</span><span class="meta-value">${escapeHtml(hospital.phone)}</span></div>` : ''}
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
    if (hospital.openDate) bits.push(`媛쒖썝 ${formatDate(hospital.openDate)}`);
    if (hospital.url) bits.push('怨듭떇 ?덊럹?댁?');
    return bits.map((bit) => escapeHtml(bit)).join(' 쨌 ');
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
    if (hospital.equipment) items.push(`二쇱슂 ?λ퉬 ${String(hospital.equipment).split(',')[0].trim()}`);
    if (toPositiveNumber(hospital.bedCount) > 0) items.push(`蹂묒긽 ${hospital.bedCount}媛?);
    if (Array.isArray(detailData?.emergencySummary) && detailData.emergencySummary.length > 0) {
      items.push('?묎툒 ?덈궡');
    } else if (hospital.hasEmergency) {
      items.push('?묎툒 吏꾨즺');
    }
    if (hospital.openDate && isRecentHospital(hospital.openDate)) {
      items.push('理쒓렐 媛쒖썝');
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
      if (hospital.saturdayOpen) parts.push('?좎슂??吏꾨즺');
      if (hospital.nightOpen) parts.push('?쇨컙 吏꾨즺');
      if (hospital.sundayOpen) parts.push('?쇱슂??吏꾨즺');
      if (hospital.subway) parts.push(hospital.subway);
      if (hospital.equipment) parts.push(`二쇱슂 ?λ퉬 ${String(hospital.equipment).split(',')[0].trim()}`);
      if (toPositiveNumber(hospital.bedCount) > 0) parts.push(`蹂묒긽 ${hospital.bedCount}媛?);
      if (Array.isArray(profile?.primaryServices) && profile.primaryServices.length > 0) {
        parts.push(`二쇱슂 ${profile.primaryServices[0]}`);
      }
      if (!hasKnownOperationalData(hospital)) parts.push('?댁쁺?쒓컙 怨듦났?곗씠???뺤씤 以?);
    }

    return uniqueStrings(parts).slice(0, 3).join(' / ');
  }

  function getHospitalParkingLabel(hospital, detailData) {
    if (Array.isArray(detailData?.parkingSummary) && detailData.parkingSummary.length > 0) {
      return detailData.parkingSummary[0];
    }
    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      return `二쇱감 媛??${hospital.parkingCapacity}?`;
    }
    if (hospital.parkingFee) {
      return `${hospital.parkingFee} 二쇱감`;
    }
    return '';
  }

  function buildHospitalFeatureNote(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    if (!profile?.primaryServices?.length) {
      return '';
    }

    return `二쇱슂 吏꾨즺: ${profile.primaryServices.slice(0, 3).join(', ')}`;
  }

  function buildHospitalFocusNote(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    if (!profile?.visitTargets?.length) {
      return '';
    }

    return `異붿쿇 ?곹솴: ${profile.visitTargets.slice(0, 2).join(', ')}`;
  }

  function buildHospitalVisitPrepNote(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    if (!profile) {
      return '';
    }

    const documents = Array.isArray(profile.documents) ? profile.documents.slice(0, 3) : [];
    if (documents.length > 0) {
      return `諛⑸Ц 以鍮? ${documents.join(', ')}`;
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
      items.push({ label: '?묒닔', value: receptionText });
    }

    if (documentItems.length > 0) {
      items.push({ label: '以鍮?, value: documentItems.join(', ') });
    }

    if (parkingText) transportItems.push(parkingText);
    if (profile?.transport) {
      transportItems.push(profile.transport);
    } else if (hospital.subway) {
      transportItems.push(hospital.subway);
    } else if (hospital.address) {
      transportItems.push(`${hospital.address} 湲곗? ?숈꽑???뺤씤?대낫?몄슂.`);
    }

    if (transportItems.length > 0) {
      items.push({
        label: '?대룞',
        value: uniqueStrings(transportItems).slice(0, 2).join(' / '),
      });
    }

    if (
      items.length < 3
      && (hospital.equipment || toPositiveNumber(hospital.bedCount) > 0 || hospital.area)
    ) {
      const facilityParts = [];
      if (hospital.equipment) facilityParts.push(String(hospital.equipment).split(',')[0].trim());
      if (toPositiveNumber(hospital.bedCount) > 0) facilityParts.push(`蹂묒긽 ${hospital.bedCount}媛?);
      if (hospital.area) facilityParts.push(`硫댁쟻 ${hospital.area}`);
      items.push({ label: '?쒖꽕', value: uniqueStrings(facilityParts).slice(0, 3).join(' / ') });
    }

    if (items.length < 3 && Array.isArray(profile?.visitTargets) && profile.visitTargets.length > 0) {
      items.push({ label: '異붿쿇', value: profile.visitTargets[0] });
    }

    return items.slice(0, 3);
  }

  function buildHospitalFactItems(hospital, detailData) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital);
    const parkingText = getHospitalParkingLabel(hospital, detailData);
    const operationItems = [];

    if (hospital.saturdayOpen) operationItems.push('?좎슂??);
    if (hospital.sundayOpen) operationItems.push('?쇱슂??);
    if (hospital.nightOpen) operationItems.push('?쇨컙');
    if (hospital.hasEmergency) operationItems.push('?묎툒');

    const facilityItems = [];
    if (parkingText) facilityItems.push(parkingText);
    if (hospital.subway) facilityItems.push(hospital.subway);
    if (hospital.equipment) facilityItems.push(`?λ퉬 ${String(hospital.equipment).split(',')[0].trim()}`);
    if (toPositiveNumber(hospital.roomCount) > 0) facilityItems.push(`吏꾨즺??${hospital.roomCount}媛?);
    if (toPositiveNumber(hospital.bedCount) > 0) facilityItems.push(`蹂묒긽 ${hospital.bedCount}媛?);
    if (hospital.area) facilityItems.push(`硫댁쟻 ${hospital.area}`);

    const items = [
      {
        label: '?듭떖 吏꾨즺',
        value: Array.isArray(profile?.primaryServices) && profile.primaryServices.length > 0
          ? profile.primaryServices.slice(0, 2).join(', ')
          : (hospital.department || hospital.type || '吏꾨즺 ?뺣낫 ?뺤씤 ?꾩슂'),
      },
      {
        label: '諛⑸Ц 以鍮?,
        value: Array.isArray(profile?.documents) && profile.documents.length > 0
          ? profile.documents.slice(0, 2).join(', ')
          : '?좊텇利? 湲곗〈 寃??寃곌낵',
      },
      {
        label: '?댁쁺쨌?쒖꽕',
        value: uniqueStrings([...operationItems, ...facilityItems]).slice(0, 2).join(' / ')
          || '?댁쁺 ?뺣낫 ?뺤씤 以?,
      },
    ];

    return items.filter((item) => item.value);
  }

  function buildHospitalStatusItems(hospital, now = new Date()) {
    const items = [];
    const hoursValue = getHoursByDay(hospital.hours, now.getDay());
    const hasTodaySchedule = Boolean(parseOperatingRange(hoursValue));

    if (isHospitalOpenNow(hospital, now)) {
      items.push({ label: '?꾩옱 吏꾨즺以?, className: 'is-open' });
    } else if (hasTodaySchedule || isAvailableToday(hospital, now)) {
      items.push({ label: '?ㅻ뒛 媛??, className: 'is-today' });
    } else if (hasKnownOperationalData(hospital)) {
      items.push({ label: '?ㅻ뒛 留덇컧', className: 'is-closed' });
    } else {
      items.push({ label: '?댁쁺 ?뺤씤以?, className: 'is-pending' });
    }

    if (hospital.saturdayOpen) items.push({ label: '?좎슂', className: 'is-option' });
    if (hospital.nightOpen) items.push({ label: '?쇨컙', className: 'is-option' });
    if (hospital.sundayOpen) items.push({ label: '?쇱슂', className: 'is-option' });

    return items.slice(0, 4);
  }

  function buildHospitalStatusSummary(hospital, now = new Date()) {
    const hoursValue = getHoursByDay(hospital.hours, now.getDay());
    const hasTodaySchedule = Boolean(parseOperatingRange(hoursValue));

    if (hasTodaySchedule) {
      return isHospitalOpenNow(hospital, now)
        ? `?ㅻ뒛 ${hoursValue} 湲곗? 吏꾨즺 以묒엯?덈떎.`
        : `?ㅻ뒛 ?댁쁺 ?쒓컙 ${hoursValue} 湲곗??쇰줈 ?뺤씤?덉뒿?덈떎.`;
    }

    if (isAvailableToday(hospital, now)) {
      if (now.getDay() === 6 && hospital.saturdayOpen) return '?ㅻ뒛 ?좎슂??吏꾨즺 蹂묒썝?쇰줈 遺꾨쪟?⑸땲??';
      if (now.getDay() === 0 && hospital.sundayOpen) return '?ㅻ뒛 ?쇱슂??吏꾨즺 蹂묒썝?쇰줈 遺꾨쪟?⑸땲??';
      if (hospital.nightOpen) return '?ㅻ뒛 ?쇨컙 吏꾨즺 媛??蹂묒썝?쇰줈 遺꾨쪟?⑸땲??';
      return '?ㅻ뒛 吏꾨즺 媛???щ?瑜?怨듦컻 ?곗씠??湲곗??쇰줈 ?뺤씤?덉뒿?덈떎.';
    }

    return hasKnownOperationalData(hospital)
      ? '?ㅻ뒛 ?댁쁺 ?뺣낫???뺤씤?섏?留??꾩옱 吏꾨즺 ?쒓컙? ?꾨떃?덈떎.'
      : '?댁쁺 ?쒓컙 怨듦났?곗씠?곕? ?뺤씤?섎뒗 以묒엯?덈떎.';
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
      return { label: '?뺣낫 異⑹떎???믪쓬', className: 'is-high' };
    }
    if (score >= 5) {
      return { label: '?뺣낫 異⑹떎??蹂댄넻', className: 'is-medium' };
    }
    return { label: '湲곕낯 ?뺣낫 以묒떖', className: 'is-basic' };
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
      return { label: '?댁쁺?쒓컙 ?곸꽭 ?뺤씤', className: 'is-verified' };
    }
    if (hasConfirmedOperation) {
      return { label: '?댁쁺?쒓컙 ?뺤씤', className: 'is-verified' };
    }
    if (hasOperationSignals) {
      return { label: '?댁쁺 ?쇰? ?뺤씤', className: 'is-partial' };
    }
    return { label: '?댁쁺 ?뺤씤以?, className: 'is-pending' };
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
      parts.push(`?꾨Ц??${hospital.specialistCount}紐?);
    }
    if (hospital.subway) {
      parts.push(hospital.subway);
    }
    if (toPositiveNumber(hospital.roomCount) > 0) {
      parts.push(`吏꾨즺??${hospital.roomCount}媛?);
    }
    if (toPositiveNumber(hospital.bedCount) > 0) {
      parts.push(`蹂묒긽 ${hospital.bedCount}媛?);
    }
    if (hospital.area) {
      parts.push(`硫댁쟻 ${hospital.area}`);
    }
    if (hospital.equipment) {
      parts.push(`?λ퉬 ${String(hospital.equipment).split(',')[0].trim()}`);
    }
    if (Array.isArray(detailData?.receptionSummary) && detailData.receptionSummary.length > 0) {
      parts.push(detailData.receptionSummary[0]);
    }
    if (Array.isArray(detailData?.parkingSummary) && detailData.parkingSummary.length > 0) {
      parts.push(detailData.parkingSummary[0]);
    }
    if (hospital.openDate) {
      parts.push(`媛쒖썝 ${formatDate(hospital.openDate)}`);
    }

    return uniqueStrings(parts).slice(0, 4).join(' / ');
  }

  function buildHospitalDecisionSummary(hospital, detailData) {
    const parts = [];

    if (hospital.region || hospital.district) {
      parts.push([hospital.region, hospital.district].filter(Boolean).join(' 쨌 '));
    }

    if (hospital.subway) {
      parts.push(hospital.subway);
    }

    if (hospital.openDate) {
      const openYear = new Date(hospital.openDate).getFullYear();
      if (Number.isFinite(openYear)) {
        parts.push(`${openYear}??媛쒖썝`);
      }
    }

    if (Number(hospital.specialistCount || 0) > 0) {
      parts.push(`?꾨Ц??${hospital.specialistCount}紐?);
    }

    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      parts.push(`二쇱감 ${hospital.parkingCapacity}?`);
    } else if (hospital.parkingFee) {
      parts.push(`${hospital.parkingFee} 二쇱감`);
    } else if (Array.isArray(detailData?.parkingSummary) && detailData.parkingSummary.length > 0) {
      parts.push(detailData.parkingSummary[0]);
    }

    if (hospital.nightOpen) {
      parts.push('?쇨컙 吏꾨즺');
    } else if (hospital.saturdayOpen) {
      parts.push('?좎슂 吏꾨즺');
    } else if (hospital.sundayOpen) {
      parts.push('?쇱슂 吏꾨즺');
    }

    if (Array.isArray(detailData?.emergencySummary) && detailData.emergencySummary.length > 0) {
      parts.push(detailData.emergencySummary[0]);
    }

    return uniqueStrings(parts).slice(0, 4).join(' 쨌 ');
  }

  function buildHospitalMetaItems(hospital) {
    const items = [];
    if (hospital.score) items.push(`?됱젏 ${hospital.score}`);
    if (hospital.reviewCount) items.push(`由щ럭 ${Number(hospital.reviewCount).toLocaleString()}媛?);
    if (hospital.specialistCount) items.push(`?꾨Ц??${Number(hospital.specialistCount).toLocaleString()}紐?);
    if (hospital.phone) items.push(hospital.phone);
    if (hospital.url) items.push('怨듭떇 ?덊럹?댁?');
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
      if (text.startsWith('?됱젏 ')) {
        return `<div class="meta-item"><span class="meta-icon">?됱젏</span><span class="meta-value">${escapeHtml(text.replace('?됱젏 ', ''))}</span></div>`;
      }
      if (text.startsWith('由щ럭 ')) {
        return `<div class="meta-item"><span class="meta-icon">由щ럭</span><span class="meta-value">${escapeHtml(text.replace('由щ럭 ', '').replace('媛?, ''))}</span><span class="meta-label">媛?/span></div>`;
      }
      if (text.startsWith('?꾨Ц??')) {
        return `<div class="meta-item"><span class="meta-icon">?꾨Ц??/span><span class="meta-value">${escapeHtml(text.replace('?꾨Ц??', '').replace('紐?, ''))}</span><span class="meta-label">紐?/span></div>`;
      }
      if (text === '怨듭떇 ?덊럹?댁?') {
        return `<div class="meta-item"><span class="meta-icon">?덊럹?댁?</span><span class="meta-value">${escapeHtml(text)}</span></div>`;
      }
      return `<div class="meta-item"><span class="meta-icon">?꾪솕</span><span class="meta-value">${escapeHtml(text)}</span></div>`;
    }).join('');
  }

  function getDepartmentNameById(departmentId) {
    const items = typeof DEPARTMENTS !== 'undefined' ? DEPARTMENTS : [];
    return items.find((item) => item.id === departmentId)?.name || '';
  }

  function getTypeReviewLabel(type) {
    const labelMap = {
      hospital: '蹂묒썝',
      clinic: '?섏썝',
      dental: '移섍낵',
      korean: '?쒖쓽??,
    };
    return labelMap[type] || '';
  }

  function buildReviewSearchContext() {
    const rawQuery = String(ui.heroSearch?.value || '').trim();
    if (state.isSearchActive && rawQuery) {
      const normalizedQuery = rawQuery.replace(/\s*?꾧린$/u, '').trim();
      return {
        query: `${normalizedQuery || rawQuery} ?꾧린`,
        title: `?ㅼ떆媛?${normalizedQuery || rawQuery} 愿???꾧린`,
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
        query: `${region} ${departmentName} ?꾧린`,
        title: `?ㅼ떆媛?${region} ${departmentName} ?꾧린`,
      };
    }

    if (region && typeName) {
      return {
        query: `${region} ${typeName} ?꾧린`,
        title: `?ㅼ떆媛?${region} ${typeName} ?꾧린`,
      };
    }

    if (departmentName) {
      return {
        query: `${departmentName} ?꾧린`,
        title: `?ㅼ떆媛?${departmentName} ?꾧린`,
      };
    }

    if (region) {
      return {
        query: `${region} 蹂묒썝 ?꾧린`,
        title: `?ㅼ떆媛?${region} 蹂묒썝 ?꾧린`,
      };
    }

    const fallbackContexts = [
      { query: '蹂묒썝 ?꾧린', title: '?ㅼ떆媛?蹂묒썝 ?꾧린' },
      { query: '吏꾨즺 ?꾧린', title: '?ㅼ떆媛?吏꾨즺 ?꾧린' },
      { query: '?댁썝 ?꾧린', title: '?ㅼ떆媛??댁썝 ?꾧린' },
      { query: '寃吏??꾧린', title: '?ㅼ떆媛?寃吏??꾧린' },
      { query: '?섏닠 ?곷떞 ?꾧린', title: '?ㅼ떆媛??섏닠 ?곷떞 ?꾧린' },
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
        badge: '鍮꾧탳 湲곗?',
        title: focusLabel ? `${focusLabel} 鍮꾧탳??臾댁뾿遺??蹂쇨퉴?` : '蹂묒썝 鍮꾧탳??臾댁뾿遺??蹂쇨퉴?',
        body: `${focusLabel || '蹂묒썝 ?좏깮'}?먯꽌???됱젏 ?섎굹蹂대떎 ?꾧린 ?? ?댁쁺?쒓컙, ?꾨Ц???? 二쇱감 媛???щ?瑜??④퍡 蹂대뒗 ?몄씠 ?덉쟾?⑸땲?? 泥?鍮꾧탳??紐⑸줉?먯꽌 ?섍퀬, 理쒖쥌 ?먮떒? ?곸꽭?섏씠吏?먯꽌 ?묒닔쨌以鍮꾩꽌瑜샕룹쐞移??뺣낫瑜??ㅼ떆 ?뺤씤?섏꽭??`,
        href: compareHref,
        cta: '紐⑸줉?먯꽌 鍮꾧탳?섍린',
      },
      {
        badge: '?댁쁺 ?뺤씤',
        title: '?좎슂쨌?쇨컙 吏꾨즺???대뼸寃??뺤씤?좉퉴?',
        body: '?좎슂?? ?쇨컙, ?쇱슂??吏꾨즺??蹂묒썝 ?좏깮 ?댁쑀媛 ?섍린 ?쎌?留??묒닔 留덇컧 ?쒓컙? ??鍮좊? ???덉뒿?덈떎. ?댁쁺 諛곗???鍮좊Ⅸ ?꾪꽣濡??곌퀬, ?ㅼ젣 ?댁썝 ?꾩뿉???곸꽭?섏씠吏 ?댁쁺 ?붿빟怨??꾪솕 臾몄쓽瑜??④퍡 蹂대뒗 ?먮쫫??醫뗭뒿?덈떎.',
        href: 'guide.html',
        cta: '?댁슜 媛?대뱶 蹂닿린',
      },
      {
        badge: '以鍮??쒕쪟',
        title: '珥덉쭊 ?꾩뿉 臾댁뾿??梨숆린硫?醫뗭쓣源?',
        body: '?좊텇利? 蹂듭슜 以묒씤 ??紐⑸줉, 湲곗〈 寃??寃곌낵泥섎읆 湲곕낯 以鍮꾨Ъ? 吏꾨즺怨쇱? ?곴??놁씠 ?먯＜ ?꾩슂?⑸땲?? ?섏닠 ?곷떞?대굹 ?곸긽寃?ш? ?덉긽?섎㈃ ?곸꽭?섏씠吏 以鍮꾩꽌瑜섏? ?λ퉬 ?뺣낫瑜?媛숈씠 ?뺤씤?섎뒗 ?몄씠 醫뗭뒿?덈떎.',
        href: 'about.html',
        cta: '?댁쁺 湲곗? 蹂닿린',
      },
      {
        badge: '?곗씠???댁꽍',
        title: '怨듦났?곗씠?곗? 蹂닿컯 ?뺣낫???대뼸寃??쎌뼱???좉퉴?',
        body: '???ъ씠?몃뒗 怨듦났 蹂묒썝 ?곗씠?곗? 怨듦컻 媛?ν븳 蹂닿컯 ?뺣낫瑜??④퍡 ?뺣━?⑸땲?? 怨듦났 API 吏???쒖뿉???먯깋? 媛?ν븯吏留? 理쒖쥌 諛⑸Ц 寃곗젙? 蹂묒썝 怨좎?? 吏곸젒 臾몄쓽瑜?湲곗??쇰줈 ?ㅼ떆 ?뺤씤?섎뒗 履쎌씠 ?덉쟾?⑸땲??',
        href: 'editorial-policy.html',
        cta: '?몄쭛 ?먯튃 蹂닿린',
      },
      {
        badge: '?꾧린 ?댁꽍',
        title: reviewContext?.title ? `${reviewContext.title}???대뼸寃??쒖슜?좉퉴?` : '?꾧린 ?뺣낫???대뼸寃??쒖슜?좉퉴?',
        body: '?꾧린??蹂묒썝??遺꾩쐞湲곗? ?湲?寃쏀뿕???뚯븙?섎뒗 李멸퀬 ?먮즺濡쒕뒗 ?좎슜?섏?留? 吏꾨즺 ?곹빀???먯껜瑜???좏븯吏???딆뒿?덈떎. ?꾧린 ?댁슜? ?꾩옱 寃???섎룄? ?④퍡 ?쎄퀬, 利앹긽쨌嫄곕━쨌?댁쁺 議곌굔??癒쇱? 留욎텛???몄씠 醫뗭뒿?덈떎.',
        href: compareHref,
        cta: '?꾩옱 議곌굔 ?ㅼ떆 蹂닿린',
      },
      {
        badge: '?뺤젙 ?붿껌',
        title: '?뺣낫媛 ?ㅻⅤ硫??대뼸寃??섏젙 ?붿껌?좉퉴?',
        body: '?댁쁺?쒓컙, ?꾪솕踰덊샇, 吏꾨즺怨? ?꾩튂 ?뺣낫媛 ?ㅼ젣? ?ㅻⅤ硫?臾몄쓽 ?섏씠吏???대찓?쇰줈 諛붾줈 ?뺤젙 ?붿껌??蹂대궪 ???덉뒿?덈떎. 理쒖떊?깃낵 ?뺤젙 媛?μ꽦??遺꾨챸???뺣낫 援ъ“?쇱닔濡?諛⑸Ц?먭? ???좊ː?섍린 ?쎌뒿?덈떎.',
        href: 'contact.html',
        cta: '臾몄쓽?섍린',
      },
    ];
  }

  async function renderReviews() {
    if (!ui.reviewsList) return;

    ui.reviewsList.innerHTML = '<div class="map-loader"><div class="spinner"></div><p>由щ럭 ?곗씠?곕? 遺덈윭?ㅻ뒗 以묒엯?덈떎...</p></div>';
    const reviewContext = buildReviewSearchContext();

    if (ui.reviewsTitle) {
      ui.reviewsTitle.textContent = reviewContext.title.replace('?ㅼ떆媛?', '').replace('?꾧린', '?좏깮 媛?대뱶').trim();
    }

    const cards = buildReviewGuideCards(reviewContext);
    ui.reviewsList.innerHTML = cards.map((item, index) => `
      <a href="${escapeHtml(item.href)}" class="review-card fade-up delay-${index % 3}" style="text-decoration:none; display:flex; flex-direction:column; cursor:pointer;">
        <div class="review-header" style="margin-bottom:10px;">
          <span class="review-badge" style="background:#46685b; color:white;">${escapeHtml(item.badge)}</span>
          <span class="review-hospital" style="font-size:0.85rem; color:var(--text-muted);">蹂묒썝李얘린 ?먮낯 媛?대뱶</span>
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
          <div class="timeline-addr">?뱧 ${escapeHtml(hospital.address)}</div>
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
      '?꾩옱 吏꾨즺以묒쑝濡??쒖떆??蹂묒썝???놁뒿?덈떎.',
      buildQuickAccessCard
    );
    renderQuickAccessList(
      ui.saturdayOpenList,
      saturdayOpen,
      '?좎슂??吏꾨즺 蹂묒썝 ?뺣낫瑜?以鍮?以묒엯?덈떎.',
      buildQuickAccessCard
    );
    renderQuickAccessList(
      ui.nightOpenList,
      nightOpen,
      '?쇨컙 吏꾨즺 蹂묒썝 ?뺣낫瑜?以鍮?以묒엯?덈떎.',
      buildQuickAccessCard
    );
    renderQuickAccessList(
      ui.recentOpenList,
      recentOpen,
      '理쒓렐 媛쒖썝 蹂묒썝 ?뺣낫瑜?以鍮?以묒엯?덈떎.',
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

    if (typeName.includes('?곴툒醫낇빀')) return 5;
    if (typeName.includes('醫낇빀蹂묒썝')) return 4;
    if (typeName === '蹂묒썝') return 3;
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
    const href = hospital.id ? `detail.html?postid=${encodeURIComponent(hospital.id)}` : '#';
    const type = hospital.department || hospital.type || '蹂묒썝';
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
        <p class="quick-access-address">${escapeHtml(hospital.address || '二쇱냼 ?뺤씤 ?꾩슂')}</p>
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
        <p class="hospital-data-summary quick-access-summary${dataSummary ? '' : ' is-pending'}" data-hospital-summary>${escapeHtml(dataSummary || '二쇱감, ?묒닔, ?댁쁺 ?뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.')}</p>
        <div class="quick-access-meta" data-hospital-meta>${renderHospitalMetaItems(meta, true)}</div>
      </a>
    `;
  }

  function buildRecentOpenCard(hospital) {
    const highlightItems = buildHospitalHighlightItems(hospital);
    const insightItems = buildHospitalInsightItems(hospital);
    const dataSummary = buildHospitalDataSummary(hospital);
    const type = hospital.department || hospital.type || '蹂묒썝';
    const openDate = hospital.openDate ? `媛쒖썝 ${formatDate(hospital.openDate)}` : '媛쒖썝???뺤씤 ?꾩슂';
    const address = hospital.address || '二쇱냼 ?뺤씤 ?꾩슂';
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
        <p class="hospital-data-summary quick-access-summary${dataSummary ? '' : ' is-pending'}" data-hospital-summary>${escapeHtml(dataSummary || '二쇱감, ?묒닔, ?댁쁺 ?뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.')}</p>
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
    return !text || ['誘몄쭊猷?, '?댁쭊', '?대Т', '?놁쓬', '-', 'closed'].some((keyword) => text.includes(keyword));
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
      ui.searchResultCount.innerHTML = '<span class="spinner-inline"></span> 寃??以?..';
    }
    if (ui.searchResultCount) {
      ui.searchResultCount.innerHTML = '<span class="spinner-inline"></span> 寃??以?..';
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
      ? ' 쨌 ?댁쁺?쒓컙 ?뺤씤 蹂묒썝 湲곗?'
      : '';

    if (ui.searchResultCount) {
      ui.searchResultCount.innerHTML = `珥?<strong>${hospitals.length.toLocaleString()}</strong>媛?寃곌낵${summary ? ` 쨌 ${escapeHtml(summary)}` : ''}${operationNotice}`;
    }

    if (ui.searchResultCount) {
      const resultNotice = intent && (intent.saturdayOpen || intent.sundayOpen || intent.nightOpen)
        ? ' 쨌 ?댁쁺?쒓컙 ?뺤씤 蹂묒썝 湲곗?'
        : '';
      ui.searchResultCount.innerHTML = `珥?<strong>${hospitals.length.toLocaleString()}</strong>媛?寃곌낵${summary ? ` 쨌 ${escapeHtml(summary)}` : ''}${resultNotice}`;
    }

    if (!ui.searchResultsList) return;

    if (hospitals.length === 0) {
      const description = summary
        ? `${summary}${operationNotice ? ' 議곌굔? ?댁쁺?쒓컙???뺤씤??蹂묒썝 湲곗??쇰줈 癒쇱? 蹂댁뿬以띾땲??' : ' 議곌굔'}??留욌뒗 蹂묒썝???꾩쭅 李얠? 紐삵뻽?듬땲?? ?ㅻⅨ 吏??씠??吏꾨즺怨?議고빀?쇰줈 ?ㅼ떆 寃?됲빐蹂댁꽭??`
        : '?ㅻⅨ ?ㅼ썙?쒕줈 ?ㅼ떆 寃?됲빐蹂댁꽭??';
      ui.searchResultsList.innerHTML = buildEmptyState('寃??寃곌낵媛 ?놁뒿?덈떎.', description);
    } else {
      ui.searchResultsList.innerHTML = hospitals.map((hospital, index) => buildHospitalCard(hospital, index + 1)).join('');
      observeNewElements(ui.searchResultsList);
      updateMapHospitals(hospitals);
      void hydrateHospitalCardDetails(hospitals, ui.searchResultsList, 12);
    }

    if (hospitals.length === 0 && ui.searchResultsList) {
      const emptyDescription = summary
        ? `${summary}${operationNotice ? ' 議곌굔???댁쁺?쒓컙 ?뺤씤 蹂묒썝 湲곗??쇰줈 癒쇱? 蹂댁뿬?쒕졇吏留? : ' 議곌굔??留욌뒗'} 蹂묒썝???꾩쭅 李얠? 紐삵뻽?듬땲?? ?ㅻⅨ 吏??씠??吏꾨즺怨?議고빀?쇰줈 ?ㅼ떆 寃?됲빐蹂댁꽭??`
        : '?ㅻⅨ ?ㅼ썙?쒕줈 ?ㅼ떆 寃?됲빐蹂댁꽭??';
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
      '?좎슂??,
      '?쇨컙',
      '?쇱슂??,
      '二쇱감',
      '媛??,
      '?꾨Ц??,
      '?묎툒',
      '?좉퇋',
      '媛쒖썝',
    ].filter(Boolean));

    return tokens.find((token) => !blocked.has(token)) || '';
  }

  function shouldUseKeywordAsHospitalName(intent) {
    const keywordText = String(intent?.keywordText || '').trim();
    if (!keywordText) {
      return false;
    }

    const facilityTerms = ['蹂묒썝', '?섏썝', '移섍낵', '?쒖쓽??, '?대━??, '硫붾뵒而?, '?쇳꽣'];
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
      sat: '?좎슂??,
      night: '?쇨컙',
      sun: '?쇱슂??,
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
      sat: '?좎슂??,
      night: '?쇨컙',
      sun: '?쇱슂??,
      parking: '二쇱감',
      specialist: '?꾨Ц??,
      recent: '理쒓렐 媛쒖썝',
      emergency: '?묎툒',
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
        <span class="search-suggestion-prefix">異붿쿇</span>
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
    if (intent?.region) chips.push(`吏??${intent.region}`);
    if (intent?.department && typeof SearchEngine !== 'undefined') {
      chips.push(`吏꾨즺怨?${SearchEngine.getDepartmentLabel(intent.department)}`);
    }
    if (intent?.saturdayOpen) chips.push('?좎슂??吏꾨즺');
    if (intent?.sundayOpen) chips.push('?쇱슂??吏꾨즺');
    if (intent?.nightOpen) chips.push('?쇨컙 吏꾨즺');
    if (intent?.parkingAvailable) chips.push('二쇱감 媛??);
    if (intent?.specialistOnly) chips.push('?꾨Ц??);
    if (intent?.recentOpen) chips.push('理쒓렐 媛쒖썝');
    if (intent?.hasEmergency) chips.push('?묎툒 吏꾨즺');
    if (intent?.keywordText) chips.push(`?ㅼ썙??${intent.keywordText}`);

    ui.searchIntentSummary.innerHTML = chips.length > 0
      ? chips.map((chip) => `<span class="search-intent-chip">${escapeHtml(chip)}</span>`).join('')
      : '<span class="search-intent-chip">蹂묒썝紐? 吏?? 吏꾨즺怨?湲곗??쇰줈 寃??以?/span>';
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
        const guideHref = tag.dataset.guideHref || '';
        if (guideHref) {
          return;
        }

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
        window.location.href = `detail.html?postid=${hospitalId}`;
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
        <p style="font-size:2rem;margin-bottom:12px;">?뵊</p>
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
          <p class="search-empty-icon">?뵊</p>
          <h3>寃??寃곌낵媛 ?놁뒿?덈떎.</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="search-empty-sections">
          <div class="search-empty-group">
            <h4>?ㅼ떆 寃?됲빐蹂닿린</h4>
            <div class="search-empty-chip-list">
              ${suggestions.map((query) => `
                <button type="button" class="search-empty-chip" data-search-query="${escapeHtml(query)}">${escapeHtml(query)}</button>
              `).join('')}
            </div>
          </div>
          <div class="search-empty-group">
            <h4>諛붾줈 紐⑸줉 蹂닿린</h4>
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
      suggestions.push(`${region} ${departmentLabel} ?좎슂??);
      suggestions.push(`${region} ${departmentLabel} ?쇨컙`);
    } else if (region) {
      suggestions.push(`${region} 移섍낵`);
      suggestions.push(`${region} ?뺥삎?멸낵`);
      suggestions.push(`${region} ?덇낵`);
    } else if (departmentLabel) {
      suggestions.push(`?쒖슱 ${departmentLabel}`);
      suggestions.push(`寃쎄린 ${departmentLabel}`);
      suggestions.push(`遺??${departmentLabel}`);
    }

    suggestions.push('?쒖슱 移섍낵');
    suggestions.push('寃쎄린 ?뺥삎?멸낵 ?좎슂??);
    suggestions.push('?쒖슱 ?뚯븘怨??쇱슂??);

    return Array.from(new Set(suggestions.filter(Boolean))).slice(0, 6);
  }

  function buildSearchFallbackPresets(intent) {
    const department = intent?.department || 'all';
    const region = intent?.region || 'all';
    const departmentLabel = department !== 'all' && typeof SearchEngine !== 'undefined'
      ? SearchEngine.getDepartmentLabel(department)
      : '蹂묒썝';

    const presets = [];

    if (department !== 'all') {
      presets.push({
        title: `?쒖슱 ${departmentLabel} 紐⑸줉`,
        description: '?쒖슱 沅뚯뿭?먯꽌 癒쇱? ?볤쾶 鍮꾧탳?⑸땲??',
        region: '?쒖슱',
        department,
      });
      presets.push({
        title: `寃쎄린 ${departmentLabel} 紐⑸줉`,
        description: '寃쎄린 沅뚯뿭 蹂묒썝???④퍡 鍮꾧탳?⑸땲??',
        region: '寃쎄린',
        department,
      });
    }

    if (region !== 'all') {
      presets.push({
        title: `${region} 移섍낵 紐⑸줉`,
        description: `${region}?먯꽌 留롮씠 李얜뒗 移섍낵遺???뺤씤?⑸땲??`,
        region,
        department: 'dental',
      });
      presets.push({
        title: `${region} ?뺥삎?멸낵 紐⑸줉`,
        description: `${region} ?뺥삎?멸낵 蹂묒썝??諛붾줈 遊낅땲??`,
        region,
        department: 'orthopedic',
      });
    }

    presets.push({
      title: '?꾩껜 蹂묒썝 紐⑸줉',
      description: '議곌굔???怨??꾩껜 紐⑸줉?먯꽌 ?ㅼ떆 ?먯깋?⑸땲??',
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
    const candidates = tokens.filter((token, index) => index > 0 && /(?:??援?援?$/.test(token));
    return candidates.length > 0 ? candidates[candidates.length - 1] : '';
  }

  function extractTownFromAddress(address = '') {
    const tokens = String(address || '').split(/\s+/).filter(Boolean);
    const match = tokens.find((token) => /(?:??硫???媛|由?$/.test(token));
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
    if (value.includes('移섍낵')) return 'dental';
    if (value.includes('?쒖쓽??) || value.includes('?쒕갑')) return 'korean';
    if (value.includes('?뺥삎?멸낵')) return 'orthopedic';
    if (value.includes('?덇낵')) return 'ophthalmology';
    if (value.includes('?쇰?怨?)) return 'dermatology';
    if (value.includes('?대퉬?명썑怨?)) return 'ent';
    if (value.includes('?뚯븘泥?냼?꾧낵') || value.includes('?뚯븘怨?)) return 'pediatric';
    if (value.includes('?곕??멸낵')) return 'obgyn';
    if (value.includes('鍮꾨눊?섑븰怨?) || value.includes('鍮꾨눊湲곌낵')) return 'urology';
    if (value.includes('?뺤떊嫄닿컯?섑븰怨?) || value.includes('?뺤떊怨?)) return 'psychiatry';
    if (value.includes('?깊삎?멸낵')) return 'plastic';
    if (value.includes('?좉꼍?멸낵')) return 'neurosurgery';
    if (value.includes('媛?뺤쓽?숆낵')) return 'familymed';
    if (value.includes('?멸낵')) return 'surgery';
    if (value.includes('?듭쬆?섑븰怨?) || value.includes('留덉랬?듭쬆?섑븰怨?)) return 'pain';
    if (value.includes('?ы솢?섑븰怨?)) return 'rehab';
    if (value.includes('?닿낵')) return 'internal';
    return 'general';
  }

  function inferHospitalTypeFromDepartment(departmentId = '') {
    if (departmentId === 'dental') return '移섍낵?섏썝';
    if (departmentId === 'korean') return '?쒖쓽??;
    if (departmentId === 'general') return '醫낇빀蹂묒썝';
    return '?섏썝';
  }

  function extractRegionFromAddress(address = '') {
    const text = String(address || '').trim();
    if (text.startsWith('?쒖슱')) return '?쒖슱';
    if (text.startsWith('寃쎄린')) return '寃쎄린';
    if (text.startsWith('?몄쿇')) return '?몄쿇';
    if (text.startsWith('遺??)) return '遺??;
    if (text.startsWith('?援?)) return '?援?;
    if (text.startsWith('???)) return '???;
    if (text.startsWith('愿묒＜')) return '愿묒＜';
    if (text.startsWith('?몄궛')) return '?몄궛';
    if (text.startsWith('?몄쥌')) return '?몄쥌';
    if (text.startsWith('媛뺤썝')) return '媛뺤썝';
    if (text.startsWith('異⑹껌遺곷룄') || text.startsWith('異⑸턿')) return '異⑸턿';
    if (text.startsWith('異⑹껌?⑤룄') || text.startsWith('異⑸궓')) return '異⑸궓';
    if (text.startsWith('?꾨턿') || text.startsWith('?꾨씪遺곷룄')) return '?꾨턿';
    if (text.startsWith('?꾨궓') || text.startsWith('?꾨씪?⑤룄')) return '?꾨궓';
    if (text.startsWith('寃쎈턿') || text.startsWith('寃쎌긽遺곷룄')) return '寃쎈턿';
    if (text.startsWith('寃쎈궓') || text.startsWith('寃쎌긽?⑤룄')) return '寃쎈궓';
    if (text.startsWith('?쒖＜')) return '?쒖＜';
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
      hospital.parkingFee = detailData.parkXpnsYn === 'Y' ? '?좊즺' : '臾대즺';
    }
    if (Array.isArray(equipData?.topEquipment) && equipData.topEquipment.length > 0) {
      hospital.equipment = equipData.topEquipment
        .slice(0, 3)
        .map((item) => `${item.name} ${item.count}?`)
        .join(', ');
    } else if (Array.isArray(equipData?.equipDetails) && equipData.equipDetails.length > 0) {
      hospital.equipment = equipData.equipDetails
        .slice(0, 3)
        .map((item) => `${item.name} ${item.count}?`)
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
          ? `二쇱냼 ${hospital.address}`
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

