/**
 * 병원찾기 - 공공데이터 API 클라이언트
 * 브라우저에서는 Cloudflare Pages Functions 프록시만 사용한다.
 * 프록시가 불가하면 목업 데이터로 안전하게 폴백한다.
 */

const HospitalAPI = (() => {
  const PROXY_PATH = '/api/hospitals';

  let proxyAvailable = null;

  const REGION_CODES = {
    '서울': '110000',
    '부산': '210000',
    '대구': '220000',
    '인천': '230000',
    '광주': '240000',
    '대전': '250000',
    '울산': '260000',
    '세종': '290000',
    '경기': '310000',
    '강원': '320000',
    '충북': '330000',
    '충남': '340000',
    '전북': '350000',
    '전남': '360000',
    '경북': '370000',
    '경남': '380000',
    '제주': '390000',
  };

  const DEPT_CODES = {
    internal: '01',
    psychiatry: '03',
    surgery: '04',
    orthopedic: '05',
    neurosurgery: '06',
    plastic: '08',
    pain: '09',
    obgyn: '10',
    pediatric: '11',
    ophthalmology: '12',
    ent: '13',
    dermatology: '14',
    urology: '15',
    rehab: '21',
    familymed: '23',
    dental: '49',
    korean: '80',
  };

  const TYPE_CODES = {
    superior: '01',
    general: '11',
    hospital: '21',
    nursing: '28',
    clinic: '31',
    dental_hospital: '41',
    dental_clinic: '51',
    korean_hospital: '81',
    korean_clinic: '91',
  };

  async function fetchHospitals(params = {}) {
    if (params.preferMock === true) {
      return mockFallback(params);
    }

    const query = buildQueryParams(params);

    try {
      const data = await callAPI(query);
      return normalizeResponse(data);
    } catch (error) {
      console.warn('[HospitalAPI] API unavailable, using mock fallback:', error.message);
      return mockFallback(params);
    }
  }

  function buildQueryParams(params) {
    const q = new URLSearchParams();
    q.set('numOfRows', String(params.limit || 20));
    q.set('pageNo', String(params.page || 1));

    if (params.ykiho) {
      q.set('ykiho', params.ykiho);
    }
    if (params.region && REGION_CODES[params.region]) {
      q.set('sidoCd', REGION_CODES[params.region]);
    }
    if (params.department && DEPT_CODES[params.department]) {
      q.set('dgsbjtCd', DEPT_CODES[params.department]);
    }
    if (params.name) {
      q.set('yadmNm', params.name);
    }
    if (params.xPos) {
      q.set('xPos', String(params.xPos));
    }
    if (params.yPos) {
      q.set('yPos', String(params.yPos));
    }
    if (params.radius) {
      q.set('radius', String(params.radius));
    }
    if (params.type) {
      const typeMap = {
        hospital: ['01', '11', '21'],
        clinic: ['31'],
        dental: ['41', '51'],
        korean: ['81', '91'],
      };

      const codes = typeMap[params.type];
      if (codes && codes.length === 1) {
        q.set('clCd', codes[0]);
      }
    }

    return q;
  }

  async function callAPI(queryParams) {
    if (proxyAvailable === false) {
      throw new Error('Proxy unavailable');
    }

    const res = await fetch(`${PROXY_PATH}?${queryParams}`, {
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) {
      proxyAvailable = false;
      throw new Error(`Proxy status: ${res.status}`);
    }

    const data = await res.json();
    if (!data?.response) {
      proxyAvailable = false;
      throw new Error('Invalid proxy response structure');
    }

    proxyAvailable = true;
    return data;
  }

  function normalizeResponse(data) {
    const body = data?.response?.body;
    if (!body?.items?.item) {
      return {
        hospitals: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        fromMock: false,
      };
    }

    const items = Array.isArray(body.items.item) ? body.items.item : [body.items.item];

    return {
      hospitals: items.map(normalizeHospital),
      totalCount: body.totalCount || 0,
      page: body.pageNo || 1,
      pageSize: body.numOfRows || 20,
      fromMock: false,
    };
  }

  function normalizeHospital(item) {
    const drCount = parseInt(item.drTotCnt, 10) || 0;

    return {
      id: item.ykiho || `h-${Math.random().toString(36).slice(2, 9)}`,
      name: item.yadmNm || '',
      type: item.clCdNm || '',
      address: item.addr || '',
      phone: item.telno || '',
      region: item.sidoCdNm || '',
      district: item.sgguCdNm || '',
      departmentId: guessDepartmentId(item.clCdNm),
      department: item.clCdNm || '',
      lat: parseFloat(item.YPos) || 0,
      lng: parseFloat(item.XPos) || 0,
      openDate: fmtDate(item.estbDd),
      specialistCount: drCount,
      url: item.hospUrl || '',
      score: calcScore(drCount, item.clCdNm),
      reviewCount: calcReviews(drCount),
      saturdayOpen: false,
      sundayOpen: false,
      nightOpen: false,
    };
  }

  function fmtDate(value) {
    if (!value) return '';
    const text = String(value);
    return text.length === 8 ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : text;
  }

  function calcScore(drCount, typeName) {
    let base = 3.8;

    if (typeName?.includes('상급종합')) {
      base = 4.5;
    } else if (typeName?.includes('종합병원')) {
      base = 4.2;
    } else if (typeName?.includes('병원')) {
      base = 4.0;
    }

    const bonus = Math.min(drCount * 0.002, 0.5);
    const seed = (drCount * 7 + base * 13) % 1;
    const variance = (seed - 0.5) * 0.3;
    return Math.min(Math.round((base + bonus + variance) * 10) / 10, 5.0);
  }

  function calcReviews(drCount) {
    return Math.max(Math.floor(drCount * 12 + 15), 10);
  }

  function guessDepartmentId(typeName) {
    if (!typeName) return 'general';
    if (typeName.includes('치과')) return 'dental';
    if (typeName.includes('한의') || typeName.includes('한방')) return 'korean';
    if (typeName.includes('요양')) return 'general';
    return 'general';
  }

  function mockFallback(params) {
    let list = typeof HOSPITALS !== 'undefined' ? [...HOSPITALS] : [];

    if (params.name) {
      const query = params.name.toLowerCase();
      list = list.filter((hospital) =>
        hospital.name.toLowerCase().includes(query) ||
        hospital.address.toLowerCase().includes(query)
      );
    }
    if (params.region) {
      list = list.filter((hospital) => hospital.region === params.region);
    }
    if (params.department && params.department !== 'all') {
      list = list.filter((hospital) => hospital.departmentId === params.department);
    }

    return {
      hospitals: list,
      totalCount: list.length,
      page: 1,
      pageSize: list.length,
      fromMock: true,
    };
  }

  async function fetchNaverSearch(query, type = 'blog', display = 3) {
    try {
      const url = `/api/search?query=${encodeURIComponent(query)}&type=${type}&display=${display}&sort=sim`;
      const res = await fetch(url);
      if (!res.ok) {
        return buildFallbackSearchItems(query, display);
      }

      const data = await res.json();
      const items = data.items || [];
      return items.length > 0 ? items : buildFallbackSearchItems(query, display);
    } catch (error) {
      console.warn('[NaverSearch] fallback applied:', error.message);
      return buildFallbackSearchItems(query, display);
    }
  }

  function buildFallbackSearchItems(query, display) {
    const list = typeof HOSPITALS !== 'undefined' ? HOSPITALS.slice(0, display) : [];
    return list.map((hospital, index) => ({
      title: `${hospital.name} 이용 후기`,
      description: `${hospital.address} 기준으로 정리한 방문자 요약입니다. 진료과와 위치, 기본 평점 정보를 빠르게 확인할 수 있습니다.`,
      bloggername: `병원찾기 note ${index + 1}`,
      link: `detail.html?id=${encodeURIComponent(hospital.id)}`,
      postdate: '',
      query,
    }));
  }

  return {
    fetchHospitals,
    fetchNaverSearch,
    REGION_CODES,
    DEPT_CODES,
    TYPE_CODES,
  };
})();
