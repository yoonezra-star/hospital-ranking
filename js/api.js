/**
 * 蹂묒썝李얘린 - 怨듦났?곗씠??API ?대씪?댁뼵?? * 釉뚮씪?곗??먯꽌??Cloudflare Pages Functions ?꾨줉?쒕쭔 ?ъ슜?쒕떎.
 * ?꾨줉?쒓? 遺덇??섎㈃ 紐⑹뾽 ?곗씠?곕줈 ?덉쟾?섍쾶 ?대갚?쒕떎.
 */

const HospitalAPI = (() => {
  const PROXY_PATH = '/api/hospitals';

  let proxyAvailable = null;

  const REGION_CODES = {
    '?쒖슱': '110000',
    '遺??: '210000',
    '?援?: '220000',
    '?몄쿇': '230000',
    '愿묒＜': '240000',
    '???: '250000',
    '?몄궛': '260000',
    '?몄쥌': '290000',
    '寃쎄린': '310000',
    '媛뺤썝': '320000',
    '異⑸턿': '330000',
    '異⑸궓': '340000',
    '?꾨턿': '350000',
    '?꾨궓': '360000',
    '寃쎈턿': '370000',
    '寃쎈궓': '380000',
    '?쒖＜': '390000',
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
    const candidates = tokens.filter((token, index) => index > 0 && /(?:??援?援?$/.test(token));
    return candidates.length > 0 ? candidates[candidates.length - 1] : '';
  }

  function extractTownFromAddress(address = '') {
    const tokens = String(address || '').split(/\s+/).filter(Boolean);
    const match = tokens.find((token) => /(?:??硫???媛|由?$/.test(token));
    return match || '';
  }

  function fmtDate(value) {
    if (!value) return '';
    const text = String(value);
    return text.length === 8 ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : text;
  }

  function calcScore(drCount, typeName) {
    let base = 3.8;

    if (typeName?.includes('?곴툒醫낇빀')) {
      base = 4.5;
    } else if (typeName?.includes('醫낇빀蹂묒썝')) {
      base = 4.2;
    } else if (typeName?.includes('蹂묒썝')) {
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
    if (typeName.includes('移섍낵')) return 'dental';
    if (typeName.includes('?쒖쓽') || typeName.includes('?쒕갑')) return 'korean';
    if (typeName.includes('?붿뼇')) return 'general';
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
      dental: ['移섍낵'],
      korean: ['?쒖쓽??, '?쒕갑'],
      orthopedic: ['?뺥삎?멸낵'],
      ophthalmology: ['?덇낵'],
      dermatology: ['?쇰?怨?],
      ent: ['?대퉬?명썑怨?],
      pediatric: ['?뚯븘泥?냼?꾧낵', '?뚯븘怨?],
      obgyn: ['?곕??멸낵'],
      urology: ['鍮꾨눊?섑븰怨?, '鍮꾨눊湲곌낵'],
      psychiatry: ['?뺤떊嫄닿컯?섑븰怨?, '?뺤떊怨?],
      plastic: ['?깊삎?멸낵'],
      neurosurgery: ['?좉꼍?멸낵'],
      familymed: ['媛?뺤쓽?숆낵'],
      surgery: ['?멸낵'],
      pain: ['?듭쬆?섑븰怨?, '留덉랬?듭쬆?섑븰怨?],
      rehab: ['?ы솢?섑븰怨?],
      internal: ['?닿낵'],
      general: ['醫낇빀蹂묒썝', '蹂묒썝'],
    }).find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));

    return entry?.[0] || 'general';
  }

  function inferHospitalTypeFromDepartmentId(departmentId = '') {
    switch (departmentId) {
      case 'dental':
        return '移섍낵?섏썝';
      case 'korean':
        return '?쒖쓽??;
      case 'general':
        return '醫낇빀蹂묒썝';
      default:
        return '?섏썝';
    }
  }

  function extractRegionFromAddress(address = '') {
    const text = String(address || '').trim();
    if (text.startsWith('?쒖슱')) return '?쒖슱';
    if (text.startsWith('寃쎄린')) return '寃쎄린';
    if (text.startsWith('?몄쿇')) return '?몄쿇';
    if (text.startsWith('遺??)) return '遺??;
    if (text.startsWith('?援?)) return '?援?;
    if (text.startsWith('???)) return '???;
    if (text.startsWith('愿묒＜')) return '愿묒＜';
    if (text.startsWith('?몄궛')) return '?몄궛';
    if (text.startsWith('?몄쥌')) return '?몄쥌';
    if (text.startsWith('媛뺤썝')) return '媛뺤썝';
    if (text.startsWith('異⑹껌遺곷룄') || text.startsWith('異⑸턿')) return '異⑸턿';
    if (text.startsWith('異⑹껌?⑤룄') || text.startsWith('異⑸궓')) return '異⑸궓';
    if (text.startsWith('?꾨턿') || text.startsWith('?꾨씪遺곷룄')) return '?꾨턿';
    if (text.startsWith('?꾨궓') || text.startsWith('?꾨씪?⑤룄')) return '?꾨궓';
    if (text.startsWith('寃쎈턿') || text.startsWith('寃쎌긽遺곷룄')) return '寃쎈턿';
    if (text.startsWith('寃쎈궓') || text.startsWith('寃쎌긽?⑤룄')) return '寃쎈궓';
    if (text.startsWith('?쒖＜')) return '?쒖＜';
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
      title: `${hospital.name} ?댁슜 ?꾧린`,
      description: `${hospital.address} 湲곗??쇰줈 ?뺣━??諛⑸Ц???붿빟?낅땲?? 吏꾨즺怨쇱? ?꾩튂, 湲곕낯 ?됱젏 ?뺣낫瑜?鍮좊Ⅴ寃??뺤씤?????덉뒿?덈떎.`,
      bloggername: `蹂묒썝李얘린 note ${index + 1}`,
      link: `detail.html?postid=${encodeURIComponent(hospital.id)}`,
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
