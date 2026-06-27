/**
 * 癰귣쵐?앾㎕?섎┛ - ?⑤벀??怨쀬뵠??API ?????곷섧?? * ?됰슢??怨??癒?퐣??Cloudflare Pages Functions ?袁⑥쨯??뺤춸 ?????뺣뼄.
 * ?袁⑥쨯??? ?븍뜃???롢늺 筌뤴뫗毓??怨쀬뵠?怨뺤쨮 ??됱읈??띿쓺 ??媛??뺣뼄.
 */

const HospitalAPI = (() => {
  const PROXY_PATH = '/api/hospitals';

  let proxyAvailable = null;

  const REGION_CODES = {
    '??뽰뒻': '110000',
    '?봔??: '210000',
    '????: '220000',
    '?紐꾩퓝': '230000',
    '?용쵐竊?: '240000',
    '????: '250000',
    '?紐꾧텦': '260000',
    '?紐꾩쪒': '290000',
    '野껋럡由?: '310000',
    '揶쏅벡??: '320000',
    '?겸뫖??: '330000',
    '?겸뫖沅?: '340000',
    '?袁⑦꽴': '350000',
    '?袁④텚': '360000',
    '野껋럥??: '370000',
    '野껋럥沅?: '380000',
    '??뽳폒': '390000',
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
      signal: AbortSignal.timeout(17000),
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
    const address = item.addr || '';

    return {
      id: item.ykiho || `h-${Math.random().toString(36).slice(2, 9)}`,
      name: item.yadmNm || '',
      type: item.clCdNm || '',
      address,
      phone: item.telno || '',
      region: item.sidoCdNm || '',
      district: item.sgguCdNm || extractDistrictFromAddress(address),
      town: extractTownFromAddress(address),
      departmentId: guessDepartmentId(item.clCdNm),
      department: item.clCdNm || '',
      lat: parseFloat(item.YPos) || 0,
      lng: parseFloat(item.XPos) || 0,
      openDate: fmtDate(item.estbDd),
      specialistCount: drCount,
      url: item.hospUrl || '',
      score: calcScore(drCount, item.clCdNm),
      reviewCount: calcReviews(drCount),
      saturdayOpen: null,
      sundayOpen: null,
      nightOpen: null,
    };
  }

  function extractDistrictFromAddress(address = '') {
    const tokens = String(address || '').split(/\s+/).filter(Boolean);
    const candidates = tokens.filter((token, index) => index > 0 && /(?:??????$/.test(token));
    return candidates.length > 0 ? candidates[candidates.length - 1] : '';
  }

  function extractTownFromAddress(address = '') {
    const tokens = String(address || '').split(/\s+/).filter(Boolean);
    const match = tokens.find((token) => /(?:??筌???揶쎛|??$/.test(token));
    return match || '';
  }

  function fmtDate(value) {
    if (!value) return '';
    const text = String(value);
    return text.length === 8 ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : text;
  }

  function calcScore(drCount, typeName) {
    let base = 3.8;

    if (typeName?.includes('?怨댄닋?ル굟鍮')) {
      base = 4.5;
    } else if (typeName?.includes('?ル굟鍮癰귣쵐??)) {
      base = 4.2;
    } else if (typeName?.includes('癰귣쵐??)) {
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
    if (typeName.includes('燁살꼵??)) return 'dental';
    if (typeName.includes('??뽰벥') || typeName.includes('??뺢컩')) return 'korean';
    if (typeName.includes('?遺용펶')) return 'general';
    return 'general';
  }

  function mockFallback(params) {
    let list = getMockHospitalPool();

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

  function getMockHospitalPool() {
    const baseHospitals = Array.isArray(typeof HOSPITALS !== 'undefined' ? HOSPITALS : null)
      ? HOSPITALS
      : [];
    const supplementalHospitals = Array.isArray(typeof NEW_HOSPITALS !== 'undefined' ? NEW_HOSPITALS : null)
      ? NEW_HOSPITALS.map(normalizeSupplementalHospital)
      : [];
    const merged = [...baseHospitals, ...supplementalHospitals];
    const seen = new Set();

    return merged.filter((hospital) => {
      const key = [hospital?.name, hospital?.address]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean)
        .join('|');
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function normalizeSupplementalHospital(hospital = {}) {
    const departmentName = String(hospital.department || '').trim();
    const departmentId = String(hospital.departmentId || '').trim() || inferDepartmentIdFromName(departmentName);
    const address = String(hospital.address || '').trim();
    const region = extractRegionFromAddress(address);

    return {
      id: hospital.id || `new-${Math.random().toString(36).slice(2, 9)}`,
      name: String(hospital.name || '').trim(),
      type: inferHospitalTypeFromDepartmentId(departmentId),
      department: departmentName,
      departmentId,
      address,
      region,
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
    };
  }

  function inferDepartmentIdFromName(name = '') {
    const text = String(name || '').trim();
    if (!text) return 'general';

    const entry = Object.entries({
      dental: ['燁살꼵??],
      korean: ['??뽰벥??, '??뺢컩'],
      orthopedic: ['?類μ굨?硫몃궢'],
      ophthalmology: ['??뉖궢'],
      dermatology: ['?????],
      ent: ['????紐낆뜎??],
      pediatric: ['???툡筌???袁㏓궢', '???툡??],
      obgyn: ['?怨??硫몃궢'],
      urology: ['??쑬???묐린??, '??쑬?딀묾怨뚮궢'],
      psychiatry: ['?類ㅻ뻿椰꾨떯而??묐린??, '?類ㅻ뻿??],
      plastic: ['?源딆굨?硫몃궢'],
      neurosurgery: ['?醫됯펾?硫몃궢'],
      familymed: ['揶쎛?類ㅼ벥??녿궢'],
      surgery: ['?硫몃궢'],
      pain: ['???쵄??묐린??, '筌띾뜆????쵄??묐린??],
      rehab: ['?????묐린??],
      internal: ['??용궢'],
      general: ['?ル굟鍮癰귣쵐??, '癰귣쵐??],
    }).find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));

    return entry?.[0] || 'general';
  }

  function inferHospitalTypeFromDepartmentId(departmentId = '') {
    switch (departmentId) {
      case 'dental':
        return '燁살꼵???륁뜚';
      case 'korean':
        return '??뽰벥??;
      case 'general':
        return '?ル굟鍮癰귣쵐??;
      default:
        return '??륁뜚';
    }
  }

  function extractRegionFromAddress(address = '') {
    const text = String(address || '').trim();
    if (text.startsWith('??뽰뒻')) return '??뽰뒻';
    if (text.startsWith('野껋럡由?)) return '野껋럡由?;
    if (text.startsWith('?紐꾩퓝')) return '?紐꾩퓝';
    if (text.startsWith('?봔??)) return '?봔??;
    if (text.startsWith('????)) return '????;
    if (text.startsWith('????)) return '????;
    if (text.startsWith('?용쵐竊?)) return '?용쵐竊?;
    if (text.startsWith('?紐꾧텦')) return '?紐꾧텦';
    if (text.startsWith('?紐꾩쪒')) return '?紐꾩쪒';
    if (text.startsWith('揶쏅벡??)) return '揶쏅벡??;
    if (text.startsWith('?겸뫗猿뚪겫怨룸즲') || text.startsWith('?겸뫖??)) return '?겸뫖??;
    if (text.startsWith('?겸뫗猿??ㅻ즲') || text.startsWith('?겸뫖沅?)) return '?겸뫖沅?;
    if (text.startsWith('?袁⑦꽴') || text.startsWith('?袁⑥뵬?브낮猷?)) return '?袁⑦꽴';
    if (text.startsWith('?袁④텚') || text.startsWith('?袁⑥뵬??ㅻ즲')) return '?袁④텚';
    if (text.startsWith('野껋럥??) || text.startsWith('野껋럩湲썽겫怨룸즲')) return '野껋럥??;
    if (text.startsWith('野껋럥沅?) || text.startsWith('野껋럩湲??ㅻ즲')) return '野껋럥沅?;
    if (text.startsWith('??뽳폒')) return '??뽳폒';
    return '';
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
    const list = getMockHospitalPool().slice(0, display);
    return list.map((hospital, index) => ({
      title: `${hospital.name} ??곸뒠 ?袁㏓┛`,
      description: `${hospital.address} 疫꿸퀣???곗쨮 ?類ｂ봺??獄쎻뫖揆???遺용튋??낅빍?? 筌욊쑬利뷸⑥눘? ?袁⑺뒄, 疫꿸퀡????깆젎 ?類ｋ궖????쥓?ㅵ칰??類ㅼ뵥??????됰뮸??덈뼄.`,
      bloggername: `癰귣쵐?앾㎕?섎┛ note ${index + 1}`,
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
