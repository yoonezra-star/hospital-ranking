/**
 * 병원찾기 - 안정형 데이터 접근 모듈
 * 로컬 데이터(HOSPITALS)를 기본으로 사용하고, 필요할 때만 프록시 API를 시도합니다.
 */

const HospitalAPI = (() => {
  const PROXY_PATH = '/api/hospitals';

  const REGION_LABELS = {
    '11': '서울',
    '26': '부산',
    '27': '대구',
    '28': '인천',
    '29': '광주',
    '30': '대전',
    '31': '울산',
    '36': '세종',
    '41': '경기',
    '42': '강원',
    '43': '충북',
    '44': '충남',
    '45': '전북',
    '46': '전남',
    '47': '경북',
    '48': '경남',
    '50': '제주',
  };

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

  const DEPARTMENT_ID_TO_NAME = {
    internal: '\uB0B4\uACFC',
    psychiatry: '\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC',
    surgery: '\uC678\uACFC',
    orthopedic: '\uC815\uD615\uC678\uACFC',
    neurosurgery: '\uC2E0\uACBD\uC678\uACFC',
    plastic: '\uC131\uD615\uC678\uACFC',
    pain: '\uD1B5\uC99D\uC758\uD559\uACFC',
    obgyn: '\uC0B0\uBD80\uC778\uACFC',
    pediatric: '\uC18C\uC544\uCCAD\uC18C\uB144\uACFC',
    ophthalmology: '\uC548\uACFC',
    ent: '\uC774\uBE44\uC778\uD6C4\uACFC',
    dermatology: '\uD53C\uBD80\uACFC',
    urology: '\uBE44\uB1E8\uC758\uD559\uACFC',
    rehab: '\uC7AC\uD65C\uC758\uD559\uACFC',
    familymed: '\uAC00\uC815\uC758\uD559\uACFC',
    dental: '\uCE58\uACFC',
    korean: '\uD55C\uC758\uC6D0',
    general: '\uC885\uD569\uBCD1\uC6D0',
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

  const TYPE_GROUPS = {
    hospital: ['상급종합병원', '종합병원', '병원'],
    clinic: ['의원'],
    dental: ['치과병원', '치과의원'],
    korean: ['한방병원', '한의원'],
  };

  let proxyReachable = null;

  function getHospitals() {
    const primary = Array.isArray(window.HOSPITALS)
      ? window.HOSPITALS
      : typeof HOSPITALS !== 'undefined' && Array.isArray(HOSPITALS)
        ? HOSPITALS
        : [];

    const supplemental = Array.isArray(window.NEW_HOSPITALS)
      ? window.NEW_HOSPITALS
      : typeof NEW_HOSPITALS !== 'undefined' && Array.isArray(NEW_HOSPITALS)
        ? NEW_HOSPITALS
        : [];

    return mergeHospitalLists(primary, supplemental);
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

  function normalizeHospital(item) {
    const address = item.address || item.addr || '';
    const location = parseAddressLocation(address);
    const region = normalizeRegionName(
      item.region || REGION_LABELS[String(item.regionCode || item.sidoCd || '')] || location.region || '',
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
    const type = item.type || item.clCdNm || inferHospitalType(item.name || item.yadmNm);

    return {
      ...item,
      id: item.id || item.ykiho,
      name: item.name || item.yadmNm || '',
      type,
      address,
      phone: item.phone || item.telno || '',
      region,
      regionCode: String(item.regionCode || item.sidoCd || findRegionCodeByName(region) || location.regionCode || ''),
      district: item.district || item.sgguCdNm || location.district || '',
      town: item.town || item.emdongNm || location.town || '',
      departmentId,
      department: findDepartmentName(departmentId, item.department || item.dgsbjtCdNm || item.clCdNm || ''),
      lat: Number(item.lat || item.YPos || item.yPos) || 0,
      lng: Number(item.lng || item.XPos || item.xPos) || 0,
      openDate: item.openDate || normalizeOpenDate(item.estbDd) || '',
      specialistCount: Number(item.specialistCount) || 0,
      reviewCount: Number(item.reviewCount) || 0,
      score: Number(item.score) || 0,
      saturdayOpen: Boolean(item.saturdayOpen),
      sundayOpen: Boolean(item.sundayOpen),
      nightOpen: Boolean(item.nightOpen),
      hasEmergency: Boolean(item.hasEmergency),
    };
  }

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
    const regionCode = findRegionCodeByName(region);

    return {
      region,
      regionCode,
      district,
      town,
    };
  }

  function findRegionCodeByName(regionName) {
    const target = normalizeRegionName(regionName);
    return Object.entries(REGION_LABELS).find(([, label]) => target.startsWith(label))?.[0] || '';
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
      if (Object.values(DEPARTMENT_CODE_TO_ID).includes(text)) {
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

  function findDepartmentName(id, fallback = '') {
    return DEPARTMENT_ID_TO_NAME[id] || fallback || '';
  }

  function matchesRegion(hospital, region) {
    if (!region || region === 'all') return true;
    const target = normalizeRegionName(region) || String(region).trim();
    return hospital.region === target || hospital.regionCode === target;
  }

  function matchesDepartment(hospital, department) {
    if (!department || department === 'all') return true;
    const target = normalizeDepartmentId(department, department);
    return hospital.departmentId === target;
  }

  function matchesType(hospital, type) {
    if (!type || type === 'all') return true;
    const groups = TYPE_GROUPS[type];
    if (!groups) return true;
    return groups.some((label) => String(hospital.type || '').includes(label));
  }

  function matchesName(hospital, name) {
    if (!name) return true;
    const needle = String(name).trim().toLowerCase();
    return [
      hospital.name,
      hospital.address,
      hospital.department,
      hospital.region,
      hospital.district,
      hospital.town,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  }

  function distanceMeters(lat1, lng1, lat2, lng2) {
    const toRad = (value) => value * (Math.PI / 180);
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  function applyLocalFilters(params = {}) {
    let hospitals = getHospitals().map(normalizeHospital);

    if (params.ykiho != null) {
      hospitals = hospitals.filter((item) => String(item.id) === String(params.ykiho));
    }
    if (params.id != null) {
      hospitals = hospitals.filter((item) => String(item.id) === String(params.id));
    }
    if (params.region != null) {
      hospitals = hospitals.filter((item) => matchesRegion(item, params.region));
    }
    if (params.department != null || params.dgsbjtCd != null) {
      hospitals = hospitals.filter((item) => matchesDepartment(item, params.department || params.dgsbjtCd));
    }
    if (params.type != null) {
      hospitals = hospitals.filter((item) => matchesType(item, params.type));
    }
    if (params.name != null || params.yadmNm != null) {
      hospitals = hospitals.filter((item) => matchesName(item, params.name || params.yadmNm));
    }
    if (params.xPos && params.yPos && params.radius) {
      const originLng = Number(params.xPos);
      const originLat = Number(params.yPos);
      const radius = Number(params.radius);
      hospitals = hospitals.filter((item) => {
        if (!(item.lat > 0 && item.lng > 0)) return false;
        return distanceMeters(originLat, originLng, item.lat, item.lng) <= radius;
      });
    }

    const page = Math.max(1, Number(params.page || params.pageNo || 1) || 1);
    const pageSize = Math.max(1, Number(params.limit || params.numOfRows || 20) || 20);
    const start = (page - 1) * pageSize;

    return {
      hospitals: hospitals.slice(start, start + pageSize),
      totalCount: hospitals.length,
      page,
      pageSize,
      fromMock: true,
    };
  }

  async function fetchProxy(params = {}) {
    if (proxyReachable === false) {
      throw new Error('Proxy unavailable');
    }

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value == null || value === '') return;
      query.set(key, String(value));
    });

    const response = await fetch(`${PROXY_PATH}?${query.toString()}`, {
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      proxyReachable = false;
      throw new Error(`Proxy status ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.hospitals)
      ? payload.hospitals
      : Array.isArray(payload?.response?.body?.items?.item)
        ? payload.response.body.items.item
        : [];

    proxyReachable = true;

    return {
      hospitals: items.map(normalizeHospital),
      totalCount: Number(payload?.totalCount || payload?.response?.body?.totalCount || items.length || 0),
      page: Number(payload?.page || params.page || 1),
      pageSize: Number(payload?.pageSize || params.limit || 20),
      fromMock: false,
    };
  }

  async function fetchHospitals(params = {}) {
    const localResult = applyLocalFilters(params);
    if (params.preferMock === true) {
      return localResult;
    }

    try {
      const proxyResult = await fetchProxy(params);
      if (Array.isArray(proxyResult.hospitals) && proxyResult.hospitals.length > 0) {
        return proxyResult;
      }
    } catch (error) {
      console.warn('[HospitalAPI] proxy fallback to local data:', error.message);
    }

    return localResult;
  }

  return {
    fetchHospitals,
    getHospitals: () => getHospitals().map(normalizeHospital),
    isProxyReachable: () => proxyReachable,
  };
})();

window.HospitalAPI = HospitalAPI;
