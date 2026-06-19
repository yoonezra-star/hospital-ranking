/**
 * 병원찾기 - 검색 및 필터 모듈
 */

const SearchEngine = (() => {
  let debounceTimer = null;

  /**
   * 디바운스 유틸리티
   */
  function debounce(fn, delay = 300) {
    return (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * 병원 텍스트 검색 (이름, 주소, 진료과)
   */
  function searchHospitals(query, hospitals) {
    if (!query || query.trim().length === 0) return hospitals;
    const q = query.toLowerCase().trim();
    return hospitals.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      h.department.toLowerCase().includes(q) ||
      h.type.toLowerCase().includes(q)
    );
  }

  /**
   * 필터 적용
   */
  function filterHospitals(hospitals, filters = {}) {
    let result = [...hospitals];

    if (filters.region && filters.region !== 'all') {
      result = result.filter(h => h.regionCode === filters.region);
    }

    if (filters.department && filters.department !== 'all') {
      result = result.filter(h => h.departmentId === filters.department);
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter(h => {
        switch (filters.type) {
          case 'hospital': return h.type === '종합병원' || h.type === '병원';
          case 'clinic':   return h.type === '의원';
          case 'dental':   return h.type.includes('치과');
          case 'korean':   return h.type.includes('한의') || h.type.includes('한방');
          default: return true;
        }
      });
    }

    if (filters.saturdayOpen) {
      result = result.filter(h => h.saturdayOpen);
    }
    if (filters.sundayOpen) {
      result = result.filter(h => h.sundayOpen);
    }
    if (filters.nightOpen) {
      result = result.filter(h => h.nightOpen);
    }

    return result;
  }

  /**
   * 정렬
   */
  function sortHospitals(hospitals, sortBy = 'score') {
    const sorted = [...hospitals];
    switch (sortBy) {
      case 'score':
        return sorted.sort(compareByRankingQuality);
      case 'reviews':
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      case 'specialists':
        return sorted.sort((a, b) => b.specialistCount - a.specialistCount);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.openDate) - new Date(a.openDate));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      default:
        return sorted;
    }
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

    return a.name.localeCompare(b.name, 'ko');
  }

  function getRankingScore(hospital) {
    const score = hospital.score || 0;
    const reviews = Math.max(hospital.reviewCount || 0, 0);
    const specialists = Math.max(hospital.specialistCount || 0, 0);
    const priorMean = 4.3;
    const priorWeight = 500;

    // Review count가 적은 병원은 과도하게 상위에 오르지 않도록 보정한다.
    const bayesianScore = ((score * reviews) + (priorMean * priorWeight)) / (reviews + priorWeight);
    const specialistBonus = Math.min(specialists / 500, 0.25);
    const typeBonus = getTypePriority(hospital.type) * 0.02;

    return bayesianScore + specialistBonus + typeBonus;
  }

  function getTypePriority(typeName = '') {
    if (typeName.includes('상급종합')) return 5;
    if (typeName.includes('종합병원')) return 4;
    if (typeName === '병원') return 3;
    if (typeName.includes('치과병원') || typeName.includes('한방병원')) return 2;
    if (typeName.includes('의원')) return 1;
    return 0;
  }

  /**
   * 검색 + 필터 + 정렬 파이프라인
   */
  function query(hospitals, { searchText = '', filters = {}, sortBy = 'score' } = {}) {
    let result = searchHospitals(searchText, hospitals);
    result = filterHospitals(result, filters);
    result = sortHospitals(result, sortBy);
    return result;
  }

  return { debounce, searchHospitals, filterHospitals, sortHospitals, query };
})();

globalThis.SearchEngine = SearchEngine;
