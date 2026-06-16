/**
 * 병원랭킹 - 메인 앱 로직
 * 공공데이터 API 연동 버전
 */
document.addEventListener('DOMContentLoaded', () => {
  // ===== 상태 =====
  let currentFilters = { region: 'all', department: 'all', type: 'all' };
  let currentSort = 'score';
  let isSearchActive = false;
  let currentPage = 1;
  let totalCount = 0;
  let allFetchedHospitals = [];
  let isApiAvailable = false;

  // ===== DOM 참조 =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const header          = $('#header');
  const themeToggle     = $('#theme-toggle');
  const mobileMenuBtn   = $('#mobile-menu-btn');
  const navLinks        = $('#nav-links');
  const heroSearch      = $('#hero-search');
  const searchBtn       = $('#search-btn');
  const clearSearchBtn  = $('#clear-search');
  const searchResults   = $('#search-results');
  const searchResultsList = $('#search-results-list');
  const searchQueryDisplay = $('#search-query-display');
  const searchResultCount  = $('#search-result-count');
  const departmentGrid  = $('#department-grid');
  const regionFilter    = $('#region-filter');
  const typeFilter      = $('#type-filter');
  const sortFilter      = $('#sort-filter');
  const rankingList     = $('#ranking-list');
  const rankingCount    = $('#ranking-count');
  const reviewsList     = $('#reviews-list');
  const newHospitalsList = $('#new-hospitals-list');
  const rankingLoader   = $('#ranking-loader');
  const loadMoreBtn     = $('#load-more-btn');
  const dataSourceBadge = $('#data-source-badge');

  // ===== 초기화 =====
  initTheme();
  initHeader();
  initCounters();
  initScrollAnimations();
  renderDepartments();
  populateRegionFilter();
  loadRankingData();      // 비동기 API 호출
  renderReviews();
  renderNewHospitals();
  bindEvents();

  // ═══════════════════════════════════════
  // 테마 (다크모드)
  // ═══════════════════════════════════════
  function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // ═══════════════════════════════════════
  // 헤더 스크롤 효과
  // ═══════════════════════════════════════
  function initHeader() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ═══════════════════════════════════════
  // 숫자 카운터 애니메이션
  // ═══════════════════════════════════════
  function initCounters() {
    const counters = $$('.stat-number[data-target]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString() + (target > 100 ? '+' : '');
    }
    requestAnimationFrame(update);
  }

  // ═══════════════════════════════════════
  // 스크롤 페이드인 애니메이션
  // ═══════════════════════════════════════
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('.fade-up').forEach(el => observer.observe(el));
  }

  function observeNewElements(container) {
    if (!container) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    container.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  }

  // ═══════════════════════════════════════
  // 진료과 카드 렌더링
  // ═══════════════════════════════════════
  function renderDepartments() {
    if (!departmentGrid) return;
    departmentGrid.innerHTML = DEPARTMENTS.map((dept, i) => `
      <div class="dept-card fade-up delay-${i % 4}" data-dept-id="${dept.id}" tabindex="0" role="button" aria-label="${dept.name} 병원 찾기">
        <div class="dept-icon" style="background:${dept.color}15; color:${dept.color};">
          ${dept.icon}
        </div>
        <span class="dept-name">${dept.name}</span>
      </div>
    `).join('');
    observeNewElements(departmentGrid);
  }

  // ═══════════════════════════════════════
  // 지역 필터 채우기
  // ═══════════════════════════════════════
  function populateRegionFilter() {
    if (!regionFilter) return;
    REGIONS.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.name;
      opt.textContent = r.name;
      regionFilter.appendChild(opt);
    });
  }

  // ═══════════════════════════════════════
  // 로딩 / UI 상태 관리
  // ═══════════════════════════════════════
  function showLoading(show) {
    if (rankingLoader) rankingLoader.style.display = show ? 'flex' : 'none';
  }

  function updateLoadMore() {
    if (!loadMoreBtn) return;
    const hasMore = isApiAvailable && (currentPage * 20 < totalCount);
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    loadMoreBtn.textContent = `더보기 (${allFetchedHospitals.length} / ${totalCount.toLocaleString()})`;
  }

  function updateDataBadge(fromMock) {
    if (!dataSourceBadge) return;
    if (fromMock) {
      dataSourceBadge.textContent = '📋 샘플 데이터';
      dataSourceBadge.className = 'data-badge mock';
    } else {
      dataSourceBadge.textContent = '✅ 공공데이터 API 연동';
      dataSourceBadge.className = 'data-badge live';
    }
  }

  // ═══════════════════════════════════════
  // 병원 랭킹 데이터 로드 (API)
  // ═══════════════════════════════════════
  async function loadRankingData(append = false) {
    showLoading(true);

    const params = { page: currentPage, limit: 20 };

    // 필터 적용
    if (currentFilters.region && currentFilters.region !== 'all') {
      params.region = currentFilters.region;
    }
    if (currentFilters.department && currentFilters.department !== 'all') {
      params.department = currentFilters.department;
    }
    if (currentFilters.type && currentFilters.type !== 'all') {
      params.type = currentFilters.type;
    }

    const result = await HospitalAPI.fetchHospitals(params);
    isApiAvailable = !result.fromMock;
    totalCount = result.totalCount;

    if (append) {
      allFetchedHospitals = [...allFetchedHospitals, ...result.hospitals];
    } else {
      allFetchedHospitals = result.hospitals;
    }

    // 클라이언트 정렬
    const sorted = SearchEngine.sortHospitals(allFetchedHospitals, currentSort);
    renderRankingCards(sorted);
    updateDataBadge(result.fromMock);
    
    // 지도 마커 갱신
    if (typeof MapModule !== 'undefined') {
      MapModule.updateMarkers(sorted);
    }

    showLoading(false);
    updateLoadMore();
  }

  // ═══════════════════════════════════════
  // 병원 카드 렌더링
  // ═══════════════════════════════════════
  function renderRankingCards(hospitals) {
    if (!rankingList || !rankingCount) return;

    rankingCount.innerHTML = isApiAvailable
      ? `전국 <strong>${totalCount.toLocaleString()}</strong>개 병원 중 <strong>${hospitals.length}</strong>개 표시`
      : `총 <strong>${hospitals.length}</strong>개 병원 (샘플 데이터)`;

    if (hospitals.length === 0) {
      rankingList.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">
          <p style="font-size:2rem;margin-bottom:12px;">🔍</p>
          <p>조건에 맞는 병원이 없습니다.</p>
          <p style="font-size:var(--fs-sm);">필터를 변경하거나 다른 키워드로 검색해 보세요.</p>
        </div>`;
      return;
    }

    rankingList.innerHTML = hospitals.map((h, i) => buildHospitalCard(h, i + 1)).join('');
    observeNewElements(rankingList);
  }

  function buildHospitalCard(h, rank) {
    const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-default';
    const scorePercent = (h.score / 5) * 100;
    const tags = [];
    if (h.saturdayOpen) tags.push('<span class="tag tag-sat">토요진료</span>');
    if (h.nightOpen)    tags.push('<span class="tag tag-night">야간진료</span>');
    if (h.sundayOpen)   tags.push('<span class="tag tag-sun">일요진료</span>');

    return `
      <article class="hospital-card fade-up" data-hospital-id="${h.id}">
        <div class="rank-badge ${rankClass}">${rank}</div>
        <div class="hospital-info">
          <div class="hospital-name">
            ${escapeHtml(h.name)}
            <span class="hospital-type-tag">${escapeHtml(h.type)}</span>
          </div>
          <div class="hospital-address">📍 ${escapeHtml(h.address)}</div>
          <div class="hospital-meta">
            <div class="meta-item">
              <span class="meta-icon">⭐</span>
              <span class="meta-value">${h.score}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">👨‍⚕️</span>
              <span class="meta-value">${h.specialistCount}</span>
              <span class="meta-label">의사</span>
            </div>
            ${h.phone ? `<div class="meta-item"><span class="meta-icon">📞</span><span class="meta-value">${escapeHtml(h.phone)}</span></div>` : ''}
          </div>
          <div class="score-bar-container">
            <div class="score-bar">
              <div class="score-fill" style="width:${scorePercent}%"></div>
            </div>
            <span class="score-value">${h.score}</span>
          </div>
          ${tags.length ? `<div class="hospital-tags">${tags.join('')}</div>` : ''}
        </div>
      </article>
    `;
  }

  // ═══════════════════════════════════════
  // 후기 렌더링
  // ═══════════════════════════════════════
  function renderReviews() {
    if (!reviewsList) return;
    reviewsList.innerHTML = REVIEWS.map((r, i) => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      return `
        <div class="review-card fade-up delay-${i % 3}">
          <span class="review-quote">"</span>
          <div class="review-header">
            <span class="review-badge">추천</span>
            <span class="review-hospital">${escapeHtml(r.hospital)}</span>
          </div>
          <p class="review-content">${escapeHtml(r.content)}</p>
          <div class="review-stars">${stars}</div>
        </div>
      `;
    }).join('');
    observeNewElements(reviewsList);
  }

  // ═══════════════════════════════════════
  // 신규 개원 타임라인 렌더링
  // ═══════════════════════════════════════
  function renderNewHospitals() {
    if (!newHospitalsList) return;
    newHospitalsList.innerHTML = NEW_HOSPITALS.map((h, i) => `
      <div class="timeline-item fade-up delay-${i % 3}">
        <span class="timeline-date">${formatDate(h.openDate)}</span>
        <div class="timeline-card">
          <div class="timeline-name">${escapeHtml(h.name)} <span class="hospital-type-tag">${escapeHtml(h.department)}</span></div>
          <div class="timeline-addr">📍 ${escapeHtml(h.address)}</div>
        </div>
      </div>
    `).join('');
    observeNewElements(newHospitalsList);
  }

  // ═══════════════════════════════════════
  // 검색 기능 (API 연동)
  // ═══════════════════════════════════════
  async function performSearch() {
    const query = heroSearch.value.trim();
    if (!query) { clearSearch(); return; }

    isSearchActive = true;
    searchResults.classList.add('active');
    searchQueryDisplay.textContent = `"${query}"`;
    searchResultCount.innerHTML = '<span class="spinner-inline"></span> 검색 중...';
    searchResultsList.innerHTML = '';

    // API로 검색
    const result = await HospitalAPI.fetchHospitals({ name: query, limit: 30 });
    const hospitals = result.hospitals;

    searchResultCount.innerHTML = `총 <strong>${result.fromMock ? hospitals.length : result.totalCount.toLocaleString()}</strong>개 결과`;

    if (hospitals.length === 0) {
      searchResultsList.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">
          <p style="font-size:2rem;margin-bottom:12px;">😔</p>
          <p>검색 결과가 없습니다.</p>
          <p style="font-size:var(--fs-sm);">다른 키워드로 검색해 보세요.</p>
        </div>`;
    } else {
      searchResultsList.innerHTML = hospitals.map((h, i) => buildHospitalCard(h, i + 1)).join('');
      observeNewElements(searchResultsList);
      
      // 검색 결과 지도 마커 갱신
      if (typeof MapModule !== 'undefined') {
        MapModule.updateMarkers(hospitals);
      }
    }

    searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearSearch() {
    isSearchActive = false;
    heroSearch.value = '';
    searchResults.classList.remove('active');
  }

  // ═══════════════════════════════════════
  // 이벤트 바인딩
  // ═══════════════════════════════════════
  function bindEvents() {
    // 테마 토글
    themeToggle?.addEventListener('click', toggleTheme);

    // 모바일 메뉴
    mobileMenuBtn?.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // 검색
    searchBtn?.addEventListener('click', performSearch);
    heroSearch?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') performSearch();
    });
    clearSearchBtn?.addEventListener('click', clearSearch);

    // 빠른 필터
    $$('.quick-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        switch (filter) {
          case 'sat':
          case 'night':
          case 'sun':
            // API에서는 지원하지 않으므로 안내
            alert('토요/야간/일요 진료 필터는 상세 API 연동 시 제공됩니다.\n현재는 전체 목록을 표시합니다.');
            break;
          case 'new':
            currentSort = 'newest';
            if (sortFilter) sortFilter.value = 'newest';
            reloadRanking();
            break;
        }
        document.getElementById('ranking')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // 진료과 카드 클릭
    departmentGrid?.addEventListener('click', (e) => {
      const card = e.target.closest('.dept-card');
      if (!card) return;
      currentFilters.department = card.dataset.deptId;
      reloadRanking();
      document.getElementById('ranking')?.scrollIntoView({ behavior: 'smooth' });
    });

    // 병원 카드 클릭 (상세 페이지 이동)
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.hospital-card');
      if (!card) return;
      const hospitalId = card.dataset.hospitalId;
      if (hospitalId) {
        window.location.href = `detail.html?id=${hospitalId}`;
      }
    });

    // 필터 변경
    regionFilter?.addEventListener('change', () => {
      currentFilters.region = regionFilter.value;
      reloadRanking();
    });
    typeFilter?.addEventListener('change', () => {
      currentFilters.type = typeFilter.value;
      reloadRanking();
    });
    sortFilter?.addEventListener('change', () => {
      currentSort = sortFilter.value;
      // 클라이언트 정렬만 수행 (재요청 불필요)
      const sorted = SearchEngine.sortHospitals(allFetchedHospitals, currentSort);
      renderRankingCards(sorted);
    });

    // 더보기 버튼
    loadMoreBtn?.addEventListener('click', () => {
      currentPage++;
      loadRankingData(true); // append mode
    });
  }

  /** 필터 변경 시 1페이지부터 다시 로드 */
  function reloadRanking() {
    currentPage = 1;
    allFetchedHospitals = [];
    loadRankingData(false);
  }

  // ═══════════════════════════════════════
  // 유틸리티
  // ═══════════════════════════════════════
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
