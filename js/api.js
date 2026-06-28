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
    const location = parseAddressLocation(item.address);

    return {
      ...item,
      id: item.id,
      name: item.name || '',
      type: item.type || inferHospitalType(item.name),
      address: item.address || '',
      phone: item.phone || '',
      region: item.region || REGION_LABELS[String(item.regionCode || '')] || location.region || '',
      regionCode: String(item.regionCode || location.regionCode || ''),
      district: item.district || location.district || '',
      town: item.town || location.town || '',
      departmentId: item.departmentId || '',
      department: item.department || '',
      lat: Number(item.lat) || 0,
      lng: Number(item.lng) || 0,
      openDate: item.openDate || '',
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
    const region = tokens[0] || '';
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
    const target = String(regionName || '');
    return Object.entries(REGION_LABELS).find(([, label]) => target.startsWith(label))?.[0] || '';
  }

  function matchesRegion(hospital, region) {
    if (!region || region === 'all') return true;
    const target = String(region).trim();
    return hospital.region === target || hospital.regionCode === target;
  }

  function matchesDepartment(hospital, department) {
    if (!department || department === 'all') return true;
    const target = DEPARTMENT_CODE_TO_ID[String(department)] || String(department);
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
