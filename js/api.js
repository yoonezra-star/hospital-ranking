/**
 * 병원랭킹 - 공공데이터 API 클라이언트
 * ─────────────────────────────────────────
 * 건강보험심사평가원 병원정보서비스 API 연동
 * Endpoint: /api/hospitals (Cloudflare Functions 프록시)
 * 원본 API: apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList
 *
 * 로컬 개발 시 프록시가 없으면 직접 호출을 시도하고,
 * 그것도 실패하면 Mock 데이터(data.js)로 폴백합니다.
 */

const HospitalAPI = (() => {
  const API_KEY = '6016d506ccaac7277d8a3492ca0cce1845c6cee2acf054d92ac5cf0ef3049d0d';
  const PROXY_PATH = '/api/hospitals';
  const DIRECT_URL = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

  let proxyAvailable = null; // null = 아직 판별 안 됨

  /* ── 지역 코드 ── */
  const REGION_CODES = {
    '서울': '110000', '부산': '210000', '대구': '220000',
    '인천': '230000', '광주': '240000', '대전': '250000',
    '울산': '260000', '세종': '290000', '경기': '310000',
    '강원': '320000', '충북': '330000', '충남': '340000',
    '전북': '350000', '전남': '360000', '경북': '370000',
    '경남': '380000', '제주': '390000',
  };

  /* ── 진료과 코드 ── */
  const DEPT_CODES = {
    'internal': '01',     'psychiatry': '03',    'surgery': '04',
    'orthopedic': '05',   'neurosurgery': '06',  'plastic': '08',
    'pain': '09',         'obgyn': '10',         'pediatric': '11',
    'ophthalmology': '12','ent': '13',           'dermatology': '14',
    'urology': '15',      'rehab': '21',         'familymed': '23',
    'dental': '49',       'korean': '80',
  };

  /* ── 종별 코드 ── */
  const TYPE_CODES = {
    'superior': '01',       // 상급종합
    'general': '11',        // 종합병원
    'hospital': '21',       // 병원
    'nursing': '28',        // 요양병원
    'clinic': '31',         // 의원
    'dental_hospital': '41',// 치과병원
    'dental_clinic': '51',  // 치과의원
    'korean_hospital': '81',// 한방병원
    'korean_clinic': '91',  // 한의원
  };

  /**
   * 병원 목록 조회 (메인 API)
   * @param {Object} params
   * @param {number} params.page - 페이지 번호 (기본 1)
   * @param {number} params.limit - 페이지 크기 (기본 20)
   * @param {string} params.region - 지역 이름 (예: '서울')
   * @param {string} params.department - 진료과 ID (예: 'internal')
   * @param {string} params.name - 병원명 검색
   * @param {string} params.type - 종별 ('hospital', 'clinic', 'dental', 'korean')
   */
  async function fetchHospitals(params = {}) {
    const query = buildQueryParams(params);

    try {
      const data = await callAPI(query);
      return normalizeResponse(data);
    } catch (error) {
      console.warn('[HospitalAPI] API 호출 실패 → Mock 데이터 사용:', error.message);
      return mockFallback(params);
    }
  }

  /* ── 쿼리 파라미터 구성 ── */
  function buildQueryParams(params) {
    const q = new URLSearchParams();
    q.set('numOfRows', String(params.limit || 20));
    q.set('pageNo', String(params.page || 1));

    if (params.region && REGION_CODES[params.region]) {
      q.set('sidoCd', REGION_CODES[params.region]);
    }
    if (params.department && DEPT_CODES[params.department]) {
      q.set('dgsbjtCd', DEPT_CODES[params.department]);
    }
    if (params.name) {
      q.set('yadmNm', params.name);
    }
    if (params.type) {
      const typeMap = {
        'hospital': ['01', '11', '21'],
        'clinic': ['31'],
        'dental': ['41', '51'],
        'korean': ['81', '91'],
      };
      const codes = typeMap[params.type];
      if (codes && codes.length === 1) {
        q.set('clCd', codes[0]);
      }
    }

    return q;
  }

  /* ── API 호출 (프록시 → 직접 → 에러) ── */
  async function callAPI(queryParams) {
    // 1) 프록시 시도
    if (proxyAvailable !== false) {
      try {
        const res = await fetch(`${PROXY_PATH}?${queryParams}`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          proxyAvailable = true;
          const data = await res.json();
          if (data?.response) return data;
          throw new Error('Invalid proxy response structure');
        } else {
          throw new Error(`Proxy status: ${res.status}`);
        }
      } catch (e) {
        proxyAvailable = false; // 한 번 실패하면 다음 호출부터는 프록시 대기 시간(3초)을 완전히 차단
        console.warn('[HospitalAPI] 프록시 사용 불가 → 직접 호출/폴백 시도:', e.message);
      }
    }

    // 2) 직접 호출 시도 (CORS 허용 시에만 성공)
    try {
      const directParams = new URLSearchParams(queryParams);
      let decodedKey = API_KEY;
      try {
        decodedKey = decodeURIComponent(API_KEY);
      } catch (e) {}
      directParams.set('serviceKey', decodedKey);
      directParams.set('_type', 'json');
      
      const res = await fetch(`${DIRECT_URL}?${directParams}`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.response) return data;
      throw new Error('Invalid direct response structure');
    } catch (e) {
      console.warn('[HospitalAPI] 직접 호출 실패:', e.message);
      throw e; // 최종 Mock 데이터 폴백을 위해 에러 전파
    }
  }

  /* ── 응답 정규화 ── */
  function normalizeResponse(data) {
    const body = data?.response?.body;
    if (!body?.items?.item) {
      // API가 결과 없음을 반환한 경우
      return { hospitals: [], totalCount: 0, page: 1, pageSize: 20, fromMock: false };
    }

    const items = Array.isArray(body.items.item)
      ? body.items.item
      : [body.items.item];

    return {
      hospitals: items.map(normalizeHospital),
      totalCount: body.totalCount || 0,
      page: body.pageNo || 1,
      pageSize: body.numOfRows || 20,
      fromMock: false,
    };
  }

  function normalizeHospital(item) {
    const drCount = parseInt(item.drTotCnt) || 0;
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
      saturdayOpen: false,  // 이 API에서는 제공하지 않음
      sundayOpen: false,
      nightOpen: false,
    };
  }

  /* ── 유틸 ── */
  function fmtDate(d) {
    if (!d) return '';
    const s = String(d);
    return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;
  }

  function calcScore(drCount, typeName) {
    let base = 3.8;
    if (typeName?.includes('상급종합')) base = 4.5;
    else if (typeName?.includes('종합병원')) base = 4.2;
    else if (typeName?.includes('병원')) base = 4.0;
    const bonus = Math.min(drCount * 0.002, 0.5);
    // 동일 병원에 대해 같은 점수를 유지하기 위한 시드 기반 난수
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

  /* ── Mock 폴백 ── */
  function mockFallback(params) {
    let list = typeof HOSPITALS !== 'undefined' ? [...HOSPITALS] : [];

    if (params.name) {
      const q = params.name.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q));
    }
    if (params.region) {
      list = list.filter(h => h.region === params.region);
    }
    if (params.department && params.department !== 'all') {
      list = list.filter(h => h.departmentId === params.department);
    }

    return {
      hospitals: list,
      totalCount: list.length,
      page: 1,
      pageSize: list.length,
      fromMock: true,
    };
  }

  return {
    fetchHospitals,
    REGION_CODES,
    DEPT_CODES,
    TYPE_CODES,
  };
})();
