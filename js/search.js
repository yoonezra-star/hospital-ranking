/**
 * 병원찾기 - 검색 및 필터 모듈
 */

const SearchEngine = (() => {
  let debounceTimer = null;

  const REGION_ALIASES = {
    서울: '서울',
    서울시: '서울',
    서울특별시: '서울',
    경기: '경기',
    경기도: '경기',
    인천: '인천',
    인천시: '인천',
    인천광역시: '인천',
    부산: '부산',
    부산시: '부산',
    부산광역시: '부산',
    대전: '대전',
    대전시: '대전',
    대전광역시: '대전',
    대구: '대구',
    대구시: '대구',
    대구광역시: '대구',
    광주: '광주',
    광주시: '광주',
    광주광역시: '광주',
    울산: '울산',
    울산시: '울산',
    울산광역시: '울산',
    세종: '세종',
    세종시: '세종',
    세종특별자치시: '세종',
    강원: '강원',
    강원도: '강원',
    충북: '충북',
    충청북도: '충북',
    충남: '충남',
    충청남도: '충남',
    전북: '전북',
    전라북도: '전북',
    전남: '전남',
    전라남도: '전남',
    경북: '경북',
    경상북도: '경북',
    경남: '경남',
    경상남도: '경남',
    제주: '제주',
    제주도: '제주',
    제주특별자치도: '제주',
  };

  const DEPARTMENT_ALIASES = {
    내과: 'internal',
    일반내과: 'internal',
    정형외과: 'orthopedic',
    안과: 'ophthalmology',
    피부과: 'dermatology',
    치과: 'dental',
    이비인후과: 'ent',
    소아과: 'pediatric',
    소아청소년과: 'pediatric',
    산부인과: 'obgyn',
    비뇨의학과: 'urology',
    비뇨기과: 'urology',
    정신건강의학과: 'psychiatry',
    정신과: 'psychiatry',
    성형외과: 'plastic',
    신경외과: 'neurosurgery',
    가정의학과: 'familymed',
    외과: 'surgery',
    통증의학과: 'pain',
    마취통증의학과: 'pain',
    통증클리닉: 'pain',
    한의원: 'korean',
    한방병원: 'korean',
    한방: 'korean',
    재활의학과: 'rehab',
    재활: 'rehab',
    종합병원: 'general',
  };

  const OPERATION_ALIASES = {
    토요: 'saturdayOpen',
    토요일: 'saturdayOpen',
    토요진료: 'saturdayOpen',
    토요일진료: 'saturdayOpen',
    주말: 'saturdayOpen',
    야간: 'nightOpen',
    야간진료: 'nightOpen',
    퇴근후: 'nightOpen',
    일요: 'sundayOpen',
    일요일: 'sundayOpen',
    일요진료: 'sundayOpen',
    일요일진료: 'sundayOpen',
  };

  const OPERATION_LABELS = {
    saturdayOpen: '토요일 진료',
    sundayOpen: '일요일 진료',
    nightOpen: '야간 진료',
  };

  const IGNORE_KEYWORDS = new Set(['병원', '의원', '진료', '검색', '찾기']);

  function debounce(fn, delay = 300) {
    return (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fn(...args), delay);
    };
  }

  function parseSearchIntent(query = '') {
    const tokens = tokenizeQuery(query);
    const intent = {
      originalQuery: String(query || '').trim(),
      region: '',
      department: '',
      keywordTokens: [],
      keywordText: '',
      saturdayOpen: false,
      sundayOpen: false,
      nightOpen: false,
    };

    tokens.forEach((token) => {
      const normalized = normalizeToken(token);
      if (!normalized) {
        return;
      }

      if (!intent.region && REGION_ALIASES[normalized]) {
        intent.region = REGION_ALIASES[normalized];
        return;
      }

      if (!intent.department && DEPARTMENT_ALIASES[normalized]) {
        intent.department = DEPARTMENT_ALIASES[normalized];
        return;
      }

      const operationKey = OPERATION_ALIASES[normalized];
      if (operationKey) {
        intent[operationKey] = true;
        return;
      }

      if (IGNORE_KEYWORDS.has(normalized)) {
        return;
      }

      intent.keywordTokens.push(token);
    });

    intent.keywordText = intent.keywordTokens.join(' ').trim();
    intent.isStructured = Boolean(
      intent.region || intent.department || intent.saturdayOpen || intent.sundayOpen || intent.nightOpen
    );

    return intent;
  }

  function buildSearchSummary(intent) {
    if (!intent) {
      return '';
    }

    const parts = [];
    if (intent.region) parts.push(intent.region);
    if (intent.department) parts.push(getDepartmentLabel(intent.department));
    if (intent.saturdayOpen) parts.push(OPERATION_LABELS.saturdayOpen);
    if (intent.sundayOpen) parts.push(OPERATION_LABELS.sundayOpen);
    if (intent.nightOpen) parts.push(OPERATION_LABELS.nightOpen);
    if (intent.keywordText) parts.push(`키워드 ${intent.keywordText}`);
    return parts.join(' · ');
  }

  function searchHospitals(query, hospitals, intent = parseSearchIntent(query)) {
    const keywordTokens = Array.isArray(intent?.keywordTokens) ? intent.keywordTokens : tokenizeQuery(query);
    if (!keywordTokens.length) {
      return hospitals;
    }

    const normalizedTokens = keywordTokens.map(normalizeText).filter(Boolean);
    if (!normalizedTokens.length) {
      return hospitals;
    }

    return hospitals.filter((hospital) => {
      const haystack = buildSearchableHaystack(hospital);
      return normalizedTokens.every((token) => haystack.includes(token));
    });
  }

  function filterHospitals(hospitals, filters = {}) {
    let result = [...hospitals];

    if (filters.region && filters.region !== 'all') {
      result = result.filter((hospital) => (
        hospital.region === filters.region || String(hospital.regionCode || '') === String(filters.region)
      ));
    }

    if (filters.department && filters.department !== 'all') {
      result = result.filter((hospital) => hospital.departmentId === filters.department);
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter((hospital) => {
        switch (filters.type) {
          case 'hospital': return hospital.type === '종합병원' || hospital.type === '병원';
          case 'clinic': return hospital.type === '의원';
          case 'dental': return String(hospital.type || '').includes('치과');
          case 'korean': return String(hospital.type || '').includes('한의') || String(hospital.type || '').includes('한방');
          default: return true;
        }
      });
    }

    if (filters.saturdayOpen) {
      result = result.filter((hospital) => hospital.saturdayOpen === true);
    }
    if (filters.sundayOpen) {
      result = result.filter((hospital) => hospital.sundayOpen === true);
    }
    if (filters.nightOpen) {
      result = result.filter((hospital) => hospital.nightOpen === true);
    }

    return result;
  }

  function sortHospitals(hospitals, sortBy = 'score') {
    const sorted = [...hospitals];
    switch (sortBy) {
      case 'score':
        return sorted.sort(compareByRankingQuality);
      case 'reviews':
        return sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      case 'specialists':
        return sorted.sort((a, b) => (b.specialistCount || 0) - (a.specialistCount || 0));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.openDate || 0) - new Date(a.openDate || 0));
      case 'name':
        return sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));
      default:
        return sorted;
    }
  }

  function query(hospitals, { searchText = '', filters = {}, sortBy = 'score', intent = null } = {}) {
    const resolvedIntent = intent || parseSearchIntent(searchText);
    const mergedFilters = {
      ...filters,
      region: filters.region && filters.region !== 'all' ? filters.region : (resolvedIntent.region || filters.region),
      department: filters.department && filters.department !== 'all'
        ? filters.department
        : (resolvedIntent.department || filters.department),
      saturdayOpen: Boolean(filters.saturdayOpen || resolvedIntent.saturdayOpen),
      sundayOpen: Boolean(filters.sundayOpen || resolvedIntent.sundayOpen),
      nightOpen: Boolean(filters.nightOpen || resolvedIntent.nightOpen),
    };

    let result = searchHospitals(searchText, hospitals, resolvedIntent);
    result = filterHospitals(result, mergedFilters);
    result = sortHospitals(result, sortBy);
    return result;
  }

  function getDepartmentLabel(departmentId = '') {
    if (typeof DEPARTMENTS !== 'undefined' && Array.isArray(DEPARTMENTS)) {
      const match = DEPARTMENTS.find((department) => department.id === departmentId);
      if (match?.name) {
        return match.name;
      }
    }
    return departmentId;
  }

  function buildSearchableHaystack(hospital) {
    return normalizeText([
      hospital?.name,
      hospital?.address,
      hospital?.department,
      hospital?.type,
      hospital?.region,
      hospital?.district,
      hospital?.phone,
    ].filter(Boolean).join(' '));
  }

  function tokenizeQuery(query = '') {
    return String(query || '')
      .split(/[\s,/#]+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function normalizeToken(token = '') {
    return String(token || '').replace(/[^\p{L}\p{N}]/gu, '').trim();
  }

  function normalizeText(value = '') {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\p{L}\p{N}]/gu, '');
  }

  function compareByRankingQuality(a, b) {
    const rankingScoreDiff = getRankingScore(b) - getRankingScore(a);
    if (Math.abs(rankingScoreDiff) >= 0.01) {
      return rankingScoreDiff;
    }

    const reviewDiff = (b.reviewCount || 0) - (a.reviewCount || 0);
    if (reviewDiff !== 0) {
      return reviewDiff;
    }

    const specialistDiff = (b.specialistCount || 0) - (a.specialistCount || 0);
    if (specialistDiff !== 0) {
      return specialistDiff;
    }

    const typeDiff = getTypePriority(b.type) - getTypePriority(a.type);
    if (typeDiff !== 0) {
      return typeDiff;
    }

    return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
  }

  function getRankingScore(hospital) {
    const score = hospital.score || 0;
    const reviews = Math.max(hospital.reviewCount || 0, 0);
    const specialists = Math.max(hospital.specialistCount || 0, 0);
    const priorMean = 4.3;
    const priorWeight = 500;

    const bayesianScore = ((score * reviews) + (priorMean * priorWeight)) / (reviews + priorWeight);
    const specialistBonus = Math.min(specialists / 500, 0.25);
    const typeBonus = getTypePriority(hospital.type) * 0.02;

    return bayesianScore + specialistBonus + typeBonus;
  }

  function getTypePriority(typeName = '') {
    if (String(typeName).includes('상급종합')) return 5;
    if (String(typeName).includes('종합병원')) return 4;
    if (typeName === '병원') return 3;
    if (String(typeName).includes('치과병원') || String(typeName).includes('한방병원')) return 2;
    if (String(typeName).includes('의원')) return 1;
    return 0;
  }

  return {
    debounce,
    parseSearchIntent,
    buildSearchSummary,
    searchHospitals,
    filterHospitals,
    sortHospitals,
    query,
    getDepartmentLabel,
  };
})();

globalThis.SearchEngine = SearchEngine;
