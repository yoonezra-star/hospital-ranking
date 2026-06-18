document.addEventListener('DOMContentLoaded', () => {
  const state = {
    currentFilters: { region: 'all', department: 'all', type: 'all' },
    currentSort: 'score',
    currentPage: 1,
    totalCount: 0,
    allFetchedHospitals: [],
    isApiAvailable: false,
    isSearchActive: false,
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
    loadMoreBtn: $('#load-more-btn'),
    dataSourceBadge: $('#data-source-badge'),
    reviewsTitle: $('#reviews h2'),
  };

  initTheme();
  initHeader();
  initCounters();
  initScrollAnimations();
  renderDepartments();
  populateRegionFilter();
  void loadRankingData();
  void renderReviews();
  renderNewHospitals();
  bindEvents();

  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

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
      ui.dataSourceBadge.textContent = '샘플 데이터';
      ui.dataSourceBadge.className = 'data-badge mock';
      return;
    }

    ui.dataSourceBadge.textContent = '공공데이터 API 연동';
    ui.dataSourceBadge.className = 'data-badge live';
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

    state.isApiAvailable = !result.fromMock;
    state.totalCount = result.totalCount;
    state.allFetchedHospitals = append
      ? [...state.allFetchedHospitals, ...result.hospitals]
      : result.hospitals;

    const sortedHospitals = SearchEngine.sortHospitals(state.allFetchedHospitals, state.currentSort);
    renderRankingCards(sortedHospitals);
    updateDataBadge(result.fromMock);
    updateMapHospitals(sortedHospitals);
    showLoading(false);
    updateLoadMore();
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
      return;
    }

    ui.rankingList.classList.remove('ranking-group-list');
    ui.rankingCount.innerHTML = state.isApiAvailable
      ? `전국 <strong>${state.totalCount.toLocaleString()}</strong>개 병원 중 <strong>${hospitals.length}</strong>개 표시`
      : `총 <strong>${hospitals.length}</strong>개 병원 (샘플 데이터)`;
    ui.rankingList.innerHTML = hospitals.map((hospital, index) => buildHospitalCard(hospital, index + 1)).join('');
    observeNewElements(ui.rankingList);
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

  function buildHospitalCard(hospital, rank) {
    const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-default';
    const scorePercent = Math.max(0, Math.min(100, ((hospital.score || 0) / 5) * 100));
    const tags = [];

    if (hospital.saturdayOpen) tags.push('<span class="tag tag-sat">토요일진료</span>');
    if (hospital.nightOpen) tags.push('<span class="tag tag-night">야간진료</span>');
    if (hospital.sundayOpen) tags.push('<span class="tag tag-sun">일요일진료</span>');

    return `
      <article class="hospital-card fade-up" data-hospital-id="${escapeHtml(hospital.id)}">
        <div class="rank-badge ${rankClass}">${rank}</div>
        <div class="hospital-info">
          <div class="hospital-name">
            ${escapeHtml(hospital.name)}
            <span class="hospital-type-tag">${escapeHtml(hospital.type)}</span>
          </div>
          <div class="hospital-address">📍 ${escapeHtml(hospital.address)}</div>
          <div class="hospital-meta">
            <div class="meta-item">
              <span class="meta-icon">⭐</span>
              <span class="meta-value">${escapeHtml(hospital.score)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">👨‍⚕️</span>
              <span class="meta-value">${escapeHtml(hospital.specialistCount || 0)}</span>
              <span class="meta-label">전문의</span>
            </div>
            ${hospital.phone ? `<div class="meta-item"><span class="meta-icon">☎️</span><span class="meta-value">${escapeHtml(hospital.phone)}</span></div>` : ''}
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

  async function performSearch() {
    const query = ui.heroSearch?.value.trim() || '';
    if (!query) {
      clearSearch();
      return;
    }

    state.isSearchActive = true;
    ui.searchResults?.classList.add('active');

    if (ui.searchQueryDisplay) {
      ui.searchQueryDisplay.textContent = `"${query}"`;
    }
    if (ui.searchResultCount) {
      ui.searchResultCount.innerHTML = '<span class="spinner-inline"></span> 검색 중...';
    }
    if (ui.searchResultsList) {
      ui.searchResultsList.innerHTML = '';
    }

    const result = await HospitalAPI.fetchHospitals({ name: query, limit: 30, preferMock: true });
    const hospitals = result.hospitals;

    if (ui.searchResultCount) {
      ui.searchResultCount.innerHTML = `총 <strong>${result.fromMock ? hospitals.length : result.totalCount.toLocaleString()}</strong>개 결과`;
    }

    if (!ui.searchResultsList) return;

    if (hospitals.length === 0) {
      ui.searchResultsList.innerHTML = buildEmptyState('검색 결과가 없습니다.', '다른 키워드로 다시 검색해보세요.');
    } else {
      ui.searchResultsList.innerHTML = hospitals.map((hospital, index) => buildHospitalCard(hospital, index + 1)).join('');
      observeNewElements(ui.searchResultsList);
      updateMapHospitals(hospitals);
    }

    ui.searchResults?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearSearch() {
    state.isSearchActive = false;
    if (ui.heroSearch) ui.heroSearch.value = '';
    ui.searchResults?.classList.remove('active');
    updateMapHospitals(SearchEngine.sortHospitals(state.allFetchedHospitals, state.currentSort));
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

    $$('.quick-filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        if (filter === 'new') {
          state.currentSort = 'newest';
          if (ui.sortFilter) ui.sortFilter.value = 'newest';
          reloadRanking();
        } else {
          alert('토요일, 야간, 일요일 진료 필터는 상세 운영시간 API 연동 후 강화할 예정입니다.');
        }

        $('#ranking')?.scrollIntoView({ behavior: 'smooth' });
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
        }
        void performSearch();
      });
    });

    document.addEventListener('click', (event) => {
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
      const sortedHospitals = SearchEngine.sortHospitals(state.allFetchedHospitals, state.currentSort);
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

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }
});
