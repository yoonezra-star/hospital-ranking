/**
 * 병원찾기 - 검색/필터 모듈
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

  const DISTRICT_ALIASES = {
    강남: { region: '서울', district: '강남구' },
    강남구: { region: '서울', district: '강남구' },
    서초: { region: '서울', district: '서초구' },
    서초구: { region: '서울', district: '서초구' },
    송파: { region: '서울', district: '송파구' },
    송파구: { region: '서울', district: '송파구' },
    마포: { region: '서울', district: '마포구' },
    마포구: { region: '서울', district: '마포구' },
    종로: { region: '서울', district: '종로구' },
    종로구: { region: '서울', district: '종로구' },
    중구: { region: '서울', district: '중구' },
    서대문: { region: '서울', district: '서대문구' },
    서대문구: { region: '서울', district: '서대문구' },
    성동: { region: '서울', district: '성동구' },
    성동구: { region: '서울', district: '성동구' },
    영등포: { region: '서울', district: '영등포구' },
    영등포구: { region: '서울', district: '영등포구' },
    강서: { region: '서울', district: '강서구' },
    강서구: { region: '서울', district: '강서구' },
    여의도: { region: '서울', district: '영등포구' },
    잠실: { region: '서울', district: '송파구' },
    압구정: { region: '서울', district: '강남구' },
    논현: { region: '서울', district: '강남구' },
    파주: { region: '경기', district: '파주시' },
    파주시: { region: '경기', district: '파주시' },
    성남: { region: '경기', district: '성남시' },
    성남시: { region: '경기', district: '성남시' },
    분당: { region: '경기', district: '분당구' },
    분당구: { region: '경기', district: '분당구' },
    고양: { region: '경기', district: '고양시' },
    고양시: { region: '경기', district: '고양시' },
    수원: { region: '경기', district: '수원시' },
    수원시: { region: '경기', district: '수원시' },
    용인: { region: '경기', district: '용인시' },
    용인시: { region: '경기', district: '용인시' },
    화성: { region: '경기', district: '화성시' },
    화성시: { region: '경기', district: '화성시' },
    일산: { region: '경기', district: '일산동구' },
    일산동구: { region: '경기', district: '일산동구' },
    일산서구: { region: '경기', district: '일산서구' },
    해운대: { region: '부산', district: '해운대구' },
    해운대구: { region: '부산', district: '해운대구' },
    남동: { region: '인천', district: '남동구' },
    남동구: { region: '인천', district: '남동구' },
    연수: { region: '인천', district: '연수구' },
    연수구: { region: '인천', district: '연수구' },
    둔산: { region: '대전', district: '서구' },
  };

  const LOCALITY_ALIASES = {
    교하: {
      region: '경기',
      district: '파주시',
      label: '파주 교하 생활권',
      keywords: ['교하', '동패동', '문발동', '와동동', '목동동', '야당동', '다율동', '산남동'],
    },
    운정: {
      region: '경기',
      district: '파주시',
      label: '파주 운정 생활권',
      keywords: ['운정', '동패동', '목동동', '야당동', '다율동', '산내동'],
    },
    판교: {
      region: '경기',
      district: '분당구',
      label: '성남 판교 생활권',
      keywords: ['판교', '판교역', '판교역로', '삼평동', '백현동', '운중동', '대장동'],
    },
    판교역: {
      region: '경기',
      district: '분당구',
      label: '성남 판교 생활권',
      keywords: ['판교', '판교역', '판교역로', '삼평동', '백현동', '운중동', '대장동'],
    },
    정자: {
      region: '경기',
      district: '분당구',
      label: '성남 정자 생활권',
      keywords: ['정자', '정자동', '금곡동', '백현동'],
    },
    정자동: {
      region: '경기',
      district: '분당구',
      label: '성남 정자 생활권',
      keywords: ['정자', '정자동', '금곡동', '백현동'],
    },
    서현: {
      region: '경기',
      district: '분당구',
      label: '성남 서현 생활권',
      keywords: ['서현', '서현동', '이매동', '수내동'],
    },
    야탑: {
      region: '경기',
      district: '분당구',
      label: '성남 야탑 생활권',
      keywords: ['야탑', '야탑동', '이매동'],
    },
    수내: {
      region: '경기',
      district: '분당구',
      label: '성남 수내 생활권',
      keywords: ['수내', '수내동', '정자동', '서현동'],
    },
    미금: {
      region: '경기',
      district: '분당구',
      label: '성남 미금 생활권',
      keywords: ['미금', '금곡동', '구미동', '정자동'],
    },
    광교: {
      region: '경기',
      district: '',
      label: '광교 생활권',
      keywords: ['광교', '이의동', '원천동', '하동', '상현동'],
    },
    동탄: {
      region: '경기',
      district: '화성시',
      label: '화성 동탄 생활권',
      keywords: ['동탄', '반송동', '석우동', '청계동', '영천동', '산척동', '오산동'],
    },
    잠실: {
      region: '서울',
      district: '송파구',
      label: '서울 잠실 생활권',
      keywords: ['잠실', '신천동', '송파동', '방이동'],
    },
    문정: {
      region: '서울',
      district: '송파구',
      label: '서울 문정 생활권',
      keywords: ['문정', '문정동', '장지동', '가락동'],
    },
    압구정: {
      region: '서울',
      district: '강남구',
      label: '서울 압구정 생활권',
      keywords: ['압구정', '압구정동', '신사동'],
    },
    청담: {
      region: '서울',
      district: '강남구',
      label: '서울 청담 생활권',
      keywords: ['청담', '청담동', '삼성동'],
    },
    역삼: {
      region: '서울',
      district: '강남구',
      label: '서울 역삼 생활권',
      keywords: ['역삼', '역삼동', '테헤란로', '선릉로'],
    },
    대치: {
      region: '서울',
      district: '강남구',
      label: '서울 대치 생활권',
      keywords: ['대치', '대치동', '도곡동'],
    },
    여의도: {
      region: '서울',
      district: '영등포구',
      label: '서울 여의도 생활권',
      keywords: ['여의도', '여의도동', '영등포구'],
    },
    홍대: {
      region: '서울',
      district: '마포구',
      label: '서울 홍대 생활권',
      keywords: ['홍대', '홍대입구', '서교동', '동교동', '연남동', '합정동', '상수동'],
    },
    홍대입구: {
      region: '서울',
      district: '마포구',
      label: '서울 홍대 생활권',
      keywords: ['홍대', '홍대입구', '서교동', '동교동', '연남동', '합정동', '상수동'],
    },
    합정: {
      region: '서울',
      district: '마포구',
      label: '서울 합정 생활권',
      keywords: ['합정', '합정동', '서교동', '망원동', '상수동'],
    },
    상암: {
      region: '서울',
      district: '마포구',
      label: '서울 상암 생활권',
      keywords: ['상암', '상암동', '성산동'],
    },
    해운대: {
      region: '부산',
      district: '해운대구',
      label: '부산 해운대 생활권',
      keywords: ['해운대', '우동', '중동', '좌동', '재송동'],
    },
    센텀: {
      region: '부산',
      district: '해운대구',
      label: '부산 센텀 생활권',
      keywords: ['센텀', '우동', '재송동'],
    },
    송도: {
      region: '인천',
      district: '연수구',
      label: '인천 송도 생활권',
      keywords: ['송도', '송도동', '연수구'],
    },
    구월: {
      region: '인천',
      district: '남동구',
      label: '인천 구월 생활권',
      keywords: ['구월', '구월동', '남동구'],
    },
    둔산: {
      region: '대전',
      district: '서구',
      label: '대전 둔산 생활권',
      keywords: ['둔산', '둔산동', '탄방동', '월평동'],
    },
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
    한의원진료: 'korean',
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
    늦게: 'nightOpen',
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

  const FEATURE_ALIASES = {
    주차: 'parkingAvailable',
    주차가능: 'parkingAvailable',
    주차가능한: 'parkingAvailable',
    전문의: 'specialistOnly',
    전문의병원: 'specialistOnly',
    전문의있는: 'specialistOnly',
    신규: 'recentOpen',
    최근: 'recentOpen',
    개원: 'recentOpen',
    최근개원: 'recentOpen',
    응급: 'hasEmergency',
    응급진료: 'hasEmergency',
    응급실: 'hasEmergency',
  };

  const FEATURE_LABELS = {
    parkingAvailable: '주차 가능',
    specialistOnly: '전문의',
    recentOpen: '최근 개원',
    hasEmergency: '응급 진료',
  };

  const IGNORE_KEYWORDS = new Set(['병원', '의원', '진료', '검색', '찾기', '가능', '가능한', '있는']);

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
      district: '',
      locality: '',
      department: '',
      keywordTokens: [],
      keywordText: '',
      saturdayOpen: false,
      sundayOpen: false,
      nightOpen: false,
      parkingAvailable: false,
      specialistOnly: false,
      recentOpen: false,
      hasEmergency: false,
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

      const localityIntent = resolveLocalityIntent(normalized);
      if (!intent.locality && localityIntent) {
        intent.locality = localityIntent.label || normalized;
        if (!intent.region && localityIntent.region) {
          intent.region = localityIntent.region;
        }
        if (!intent.district && localityIntent.district) {
          intent.district = localityIntent.district;
        }
        return;
      }

      const districtIntent = resolveDistrictIntent(normalized);
      if (!intent.district && districtIntent) {
        intent.district = districtIntent.district;
        if (!intent.region && districtIntent.region) {
          intent.region = districtIntent.region;
        }
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

      const featureKey = FEATURE_ALIASES[normalized];
      if (featureKey) {
        intent[featureKey] = true;
        return;
      }

      if (IGNORE_KEYWORDS.has(normalized)) {
        return;
      }

      intent.keywordTokens.push(token);
    });

    intent.keywordText = intent.keywordTokens.join(' ').trim();
    intent.isStructured = Boolean(
      intent.region ||
      intent.district ||
      intent.locality ||
      intent.department ||
      intent.saturdayOpen ||
      intent.sundayOpen ||
      intent.nightOpen ||
      intent.parkingAvailable ||
      intent.specialistOnly ||
      intent.recentOpen ||
      intent.hasEmergency
    );

    return intent;
  }

  function buildSearchSummary(intent) {
    if (!intent) {
      return '';
    }

    const parts = [];
    if (intent.region) parts.push(intent.region);
    if (intent.district) parts.push(intent.district);
    if (intent.locality && intent.locality !== intent.district) parts.push(intent.locality);
    if (intent.department) parts.push(getDepartmentLabel(intent.department));
    if (intent.saturdayOpen) parts.push(OPERATION_LABELS.saturdayOpen);
    if (intent.sundayOpen) parts.push(OPERATION_LABELS.sundayOpen);
    if (intent.nightOpen) parts.push(OPERATION_LABELS.nightOpen);
    if (intent.parkingAvailable) parts.push(FEATURE_LABELS.parkingAvailable);
    if (intent.specialistOnly) parts.push(FEATURE_LABELS.specialistOnly);
    if (intent.recentOpen) parts.push(FEATURE_LABELS.recentOpen);
    if (intent.hasEmergency) parts.push(FEATURE_LABELS.hasEmergency);
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
    if (filters.district) {
      result = result.filter((hospital) => matchesDistrict(hospital, filters.district));
    }
    if (filters.town) {
      result = result.filter((hospital) => matchesTown(hospital, filters.town));
    }
    if (filters.locality) {
      result = result.filter((hospital) => matchesLocality(hospital, filters.locality));
    }

    if (filters.department && filters.department !== 'all') {
      result = result.filter((hospital) => hospital.departmentId === filters.department);
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter((hospital) => {
        switch (filters.type) {
          case 'hospital':
            return hospital.type === '종합병원' || hospital.type === '병원';
          case 'clinic':
            return hospital.type === '의원';
          case 'dental':
            return String(hospital.type || '').includes('치과');
          case 'korean':
            return String(hospital.type || '').includes('한의') || String(hospital.type || '').includes('한방');
          default:
            return true;
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
    if (filters.parkingAvailable) {
      result = result.filter((hospital) => hasParkingInfo(hospital));
    }
    if (filters.specialistOnly) {
      result = result.filter((hospital) => Number(hospital.specialistCount || 0) > 0);
    }
    if (filters.recentOpen) {
      result = result.filter((hospital) => isRecentOpenDate(hospital.openDate));
    }
    if (filters.hasEmergency) {
      result = result.filter((hospital) => hospital.hasEmergency === true);
    }

    return result;
  }

  function sortHospitals(hospitals, sortBy = 'score') {
    const sorted = [...hospitals];
    switch (sortBy) {
      case 'score':
        return sorted.sort(compareByRankingQuality);
      case 'open_now':
        return sorted.sort((a, b) => comparePriorityFlags(
          sortIsHospitalOpenNow(b),
          sortIsHospitalOpenNow(a),
          a,
          b
        ));
      case 'today_available':
        return sorted.sort((a, b) => comparePriorityFlags(
          sortIsAvailableToday(b),
          sortIsAvailableToday(a),
          a,
          b
        ));
      case 'saturday_first':
        return sorted.sort((a, b) => comparePriorityFlags(
          b.saturdayOpen === true,
          a.saturdayOpen === true,
          a,
          b
        ));
      case 'night_first':
        return sorted.sort((a, b) => comparePriorityFlags(
          b.nightOpen === true,
          a.nightOpen === true,
          a,
          b
        ));
      case 'sunday_first':
        return sorted.sort((a, b) => comparePriorityFlags(
          b.sundayOpen === true,
          a.sundayOpen === true,
          a,
          b
        ));
      case 'emergency_first':
        return sorted.sort((a, b) => comparePriorityFlags(
          b.hasEmergency === true,
          a.hasEmergency === true,
          a,
          b
        ));
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
      district: filters.district || resolvedIntent.district || '',
      town: filters.town || '',
      locality: filters.locality || resolvedIntent.locality || '',
      department: filters.department && filters.department !== 'all'
        ? filters.department
        : (resolvedIntent.department || filters.department),
      saturdayOpen: Boolean(filters.saturdayOpen || resolvedIntent.saturdayOpen),
      sundayOpen: Boolean(filters.sundayOpen || resolvedIntent.sundayOpen),
      nightOpen: Boolean(filters.nightOpen || resolvedIntent.nightOpen),
      parkingAvailable: Boolean(filters.parkingAvailable || resolvedIntent.parkingAvailable),
      specialistOnly: Boolean(filters.specialistOnly || resolvedIntent.specialistOnly),
      recentOpen: Boolean(filters.recentOpen || resolvedIntent.recentOpen),
      hasEmergency: Boolean(filters.hasEmergency || resolvedIntent.hasEmergency),
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
      hospital?.town,
      hospital?.phone,
      hospital?.subway,
      hospital?.equipment,
      hasParkingInfo(hospital) ? '주차 가능' : '',
      Number(hospital?.specialistCount || 0) > 0 ? '전문의' : '',
      hospital?.hasEmergency === true ? '응급 진료' : '',
      isRecentOpenDate(hospital?.openDate) ? '최근 개원' : '',
      hospital?.saturdayOpen ? '토요일 진료' : '',
      hospital?.sundayOpen ? '일요일 진료' : '',
      hospital?.nightOpen ? '야간 진료' : '',
    ].filter(Boolean).join(' '));
  }

  function hasParkingInfo(hospital) {
    return Number(hospital?.parkingCapacity || 0) > 0 || Boolean(hospital?.parkingFee);
  }

  function isRecentOpenDate(openDate) {
    const date = new Date(openDate || '');
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 365 * 3;
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

  function comparePriorityFlags(leftPriority, rightPriority, leftHospital, rightHospital) {
    if (leftPriority !== rightPriority) {
      return Number(leftPriority) - Number(rightPriority);
    }

    return compareByRankingQuality(leftHospital, rightHospital);
  }

  function sortIsHospitalOpenNow(hospital, now = new Date()) {
    const day = now.getDay();
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    const hoursValue = sortGetHoursByDay(hospital?.hours, day);
    const parsedRange = sortParseOperatingRange(hoursValue);

    if (parsedRange) {
      return currentMinutes >= parsedRange.start && currentMinutes <= parsedRange.end;
    }

    return sortIsLikelyOpenByFlags(hospital, day, currentMinutes);
  }

  function sortIsAvailableToday(hospital, now = new Date()) {
    const day = now.getDay();

    if (day === 0) return Boolean(hospital?.sundayOpen);
    if (day === 6) return Boolean(hospital?.saturdayOpen);

    return true;
  }

  function sortGetHoursByDay(hours, day) {
    if (!hours) return '';

    if (day === 0) return hours.sun || hours.holiday || '';
    if (day === 6) return hours.sat || '';

    return [hours.mon, hours.tue, hours.wed, hours.thu, hours.fri][day - 1] || '';
  }

  function sortParseOperatingRange(hoursValue) {
    if (!hoursValue || sortIsClosedHoursText(hoursValue)) return null;

    const matches = String(hoursValue).match(/(\d{1,2}):(\d{2})/g);
    if (!matches || matches.length < 2) return null;

    const start = sortParseTimeText(matches[0]);
    const end = sortParseTimeText(matches[matches.length - 1]);
    if (start === null || end === null) return null;

    return { start, end };
  }

  function sortParseTimeText(value) {
    const match = String(value).match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;

    return (Number(match[1]) * 60) + Number(match[2]);
  }

  function sortIsClosedHoursText(hoursValue) {
    const text = String(hoursValue || '').trim().toLowerCase();
    return !text || ['휴진', '미진료', '운영안함', '없음', '-', 'closed'].some((keyword) => text.includes(keyword));
  }

  function sortIsLikelyOpenByFlags(hospital, day, currentMinutes) {
    const weekdayStart = 9 * 60;
    const weekdayEnd = 18 * 60;
    const nightEnd = 21 * 60;
    const weekendEnd = 13 * 60;

    if (day === 0) {
      return Boolean(hospital?.sundayOpen) && currentMinutes >= weekdayStart && currentMinutes <= weekendEnd;
    }

    if (day === 6) {
      return Boolean(hospital?.saturdayOpen) && currentMinutes >= weekdayStart && currentMinutes <= weekendEnd;
    }

    if (currentMinutes < weekdayStart || currentMinutes > nightEnd) {
      return false;
    }

    if (currentMinutes <= weekdayEnd) {
      return true;
    }

    return Boolean(hospital?.nightOpen);
  }

  function resolveDistrictIntent(token = '') {
    if (DISTRICT_ALIASES[token]) {
      return DISTRICT_ALIASES[token];
    }

    if (/[가-힣]+(구|군|시|동)$/.test(token)) {
      return { region: '', district: token };
    }

    return null;
  }

  function matchesDistrict(hospital, district = '') {
    if (!district) {
      return true;
    }

    const districtText = String(district).trim();
    const hospitalDistrict = String(hospital?.district || '').trim();
    const address = String(hospital?.address || '').trim();

    return hospitalDistrict.includes(districtText) || address.includes(districtText);
  }

  function matchesTown(hospital, town = '') {
    if (!town) {
      return true;
    }

    const townText = String(town).trim();
    const hospitalTown = String(hospital?.town || '').trim();
    const address = String(hospital?.address || '').trim();
    return hospitalTown.includes(townText) || address.includes(townText);
  }

  function resolveLocalityIntent(token = '') {
    return LOCALITY_ALIASES[token] || null;
  }

  function matchesLocality(hospital, locality = '') {
    const localityText = String(locality || '').trim();
    if (!localityText) {
      return true;
    }

    const localityEntry = Object.values(LOCALITY_ALIASES).find((entry) => entry.label === localityText);
    if (!localityEntry) {
      return true;
    }

    const regionText = String(hospital?.region || '').trim();
    const districtText = String(hospital?.district || '').trim();
    const townText = String(hospital?.town || '').trim();
    const addressText = String(hospital?.address || '').trim();
    const nameText = String(hospital?.name || '').trim();
    const subwayText = String(hospital?.subway || '').trim();

    if (localityEntry.region && regionText && regionText !== localityEntry.region) {
      return false;
    }

    if (localityEntry.district) {
      const districtMatched = districtText.includes(localityEntry.district) || addressText.includes(localityEntry.district);
      if (!districtMatched) {
        return false;
      }
    }

    return (localityEntry.keywords || []).some((keyword) => (
      nameText.includes(keyword) ||
      districtText.includes(keyword) ||
      townText.includes(keyword) ||
      addressText.includes(keyword) ||
      subwayText.includes(keyword)
    ));
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
    const infoRichnessBonus = getHospitalInfoRichnessScore(hospital) * 0.025;

    return bayesianScore + specialistBonus + typeBonus + infoRichnessBonus;
  }

  function getHospitalInfoRichnessScore(hospital) {
    const checks = [
      Boolean(hospital?.address),
      Boolean(hospital?.phone),
      Boolean(hospital?.url),
      Boolean(hospital?.subway || hospital?.region || hospital?.district),
      Boolean(hospital?.openDate),
      Number(hospital?.reviewCount || 0) > 0 || Number(hospital?.specialistCount || 0) > 0,
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

    return Object.values(hours).some((value) => {
      const text = String(value || '').trim();
      return text && !sortIsClosedHoursText(text);
    });
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
