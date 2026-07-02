/**
 * 병원찾기 - Mock 데이터
 * ─────────────────────────────────────────────────
 * 공공데이터 API 연동 전 샘플 데이터입니다.
 * 
 * [향후 API 전환 방법]
 * 1. 공공데이터포털(data.go.kr) 회원가입 → "병원정보서비스" 활용 신청
 * 2. 인증키 발급 후 Cloudflare Workers에 프록시 함수 배포
 *    - endpoint: /api/hospitals
 *    - 원본 API: apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList
 * 3. 이 파일의 HOSPITALS 배열을 fetch('/api/hospitals') 호출로 교체
 * 4. 응답 필드 매핑:
 *    - yadmNm → name (병원명)
 *    - addr → address (주소)
 *    - clCdNm → type (종별)
 *    - dgsbjtCdNm → department (진료과)
 *    - telno → phone (전화번호)
 *    - XPos → lng, YPos → lat (좌표)
 *    - estbDd → openDate (개설일)
 * ─────────────────────────────────────────────────
 */

const DEPARTMENTS = [
  { id: 'internal',      name: '내과',          icon: '🫀', color: '#EF4444' },
  { id: 'orthopedic',    name: '정형외과',      icon: '🦴', color: '#06B6D4' },
  { id: 'ophthalmology', name: '안과',          icon: '👁️', color: '#F59E0B' },
  { id: 'dermatology',   name: '피부과',        icon: '✨', color: '#A855F7' },
  { id: 'dental',        name: '치과',          icon: '🦷', color: '#14B8A6' },
  { id: 'ent',           name: '이비인후과',     icon: '👂', color: '#6366F1' },
  { id: 'pediatric',     name: '소아청소년과',   icon: '👶', color: '#EC4899' },
  { id: 'obgyn',         name: '산부인과',      icon: '🤰', color: '#F472B6' },
  { id: 'urology',       name: '비뇨의학과',    icon: '💊', color: '#2DD4BF' },
  { id: 'psychiatry',    name: '정신건강의학과', icon: '🧠', color: '#818CF8' },
  { id: 'plastic',       name: '성형외과',      icon: '💎', color: '#C084FC' },
  { id: 'neurosurgery',  name: '신경외과',      icon: '🔬', color: '#38BDF8' },
  { id: 'familymed',     name: '가정의학과',    icon: '🏠', color: '#4ADE80' },
  { id: 'surgery',       name: '외과',          icon: '🏥', color: '#F87171' },
  { id: 'pain',          name: '통증의학과',    icon: '💉', color: '#A78BFA' },
  { id: 'korean',        name: '한의원',        icon: '🍃', color: '#22C55E' },
  { id: 'rehab',         name: '재활의학과',    icon: '🏃', color: '#0EA5E9' },
  { id: 'general',       name: '종합병원',      icon: '🏛️', color: '#64748B' },
];

const REGIONS = [
  { code: '11', name: '서울', fullName: '서울특별시' },
  { code: '41', name: '경기', fullName: '경기도' },
  { code: '28', name: '인천', fullName: '인천광역시' },
  { code: '26', name: '부산', fullName: '부산광역시' },
  { code: '30', name: '대전', fullName: '대전광역시' },
  { code: '27', name: '대구', fullName: '대구광역시' },
  { code: '31', name: '울산', fullName: '울산광역시' },
  { code: '36', name: '세종', fullName: '세종특별자치시' },
  { code: '29', name: '광주', fullName: '광주광역시' },
  { code: '42', name: '강원', fullName: '강원특별자치도' },
  { code: '43', name: '충북', fullName: '충청북도' },
  { code: '44', name: '충남', fullName: '충청남도' },
  { code: '47', name: '경북', fullName: '경상북도' },
  { code: '48', name: '경남', fullName: '경상남도' },
  { code: '52', name: '전북', fullName: '전북특별자치도' },
  { code: '46', name: '전남', fullName: '전라남도' },
  { code: '50', name: '제주', fullName: '제주특별자치도' },
];

const HOSPITALS = [
  {
    id: 101, name: '김흥진치과의원', type: '치과의원', department: '치과',
    departmentId: 'dental', address: '대전광역시 동구 동대전로 81, 5층 (대동) 대동오거리 하나은행건물 5층',
    region: '대전', regionCode: '30', phone: '042-635-2882',
    score: 4.1, reviewCount: 48, specialistCount: 0, generalDoctorCount: 1,
    openDate: '2005-05-27', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 36.3314, lng: 127.4439,
    subway: '대전1호선 대동역 39M',
    hours: {
      mon: '09시 00분 ~ 13시 00분', tue: '09시 00분 ~ 13시 00분', wed: '09시 00분 ~ 13시 00분',
      thu: '09시 00분 ~ 13시 00분', fri: '09시 00분 ~ 18시 00분', sat: '09시 00분 ~ 13시 00분',
      sun: '휴진', holiday: '휴진'
    },
    area: '전용 170㎡', roomCount: 0, bedCount: 0, equipment: '콘빔CT 1대',
    parkingCapacity: 10, parkingFee: '무료'
  },
  {
    id: 1, name: '서울대학교병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '서울특별시 종로구 대학로 101',
    region: '서울', regionCode: '11', phone: '02-2072-2114',
    score: 4.8, reviewCount: 2847, specialistCount: 312,
    openDate: '1978-01-01', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.5796, lng: 126.9990
  },
  {
    id: 2, name: '삼성서울병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '서울특별시 강남구 일원로 81',
    region: '서울', regionCode: '11', phone: '02-3410-2114',
    score: 4.7, reviewCount: 2231, specialistCount: 287,
    openDate: '1994-11-09', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.4881, lng: 127.0855
  },
  {
    id: 3, name: '서울아산병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '서울특별시 송파구 올림픽로43길 88',
    region: '서울', regionCode: '11', phone: '02-3010-3114',
    score: 4.8, reviewCount: 3102, specialistCount: 341,
    openDate: '1989-06-16', saturdayOpen: true, sundayOpen: false, nightOpen: true,
    lat: 37.5270, lng: 127.1082
  },
  {
    id: 4, name: '연세세브란스병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '서울특별시 서대문구 연세로 50-1',
    region: '서울', regionCode: '11', phone: '02-2228-0114',
    score: 4.7, reviewCount: 1987, specialistCount: 256,
    openDate: '1957-01-01', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.5622, lng: 126.9410
  },
  {
    id: 5, name: '강남밝은세상안과', type: '의원', department: '안과',
    departmentId: 'ophthalmology', address: '서울특별시 강남구 테헤란로 130',
    region: '서울', regionCode: '11', phone: '02-3430-3300',
    score: 4.6, reviewCount: 892, specialistCount: 8,
    openDate: '2005-03-15', saturdayOpen: true, sundayOpen: false, nightOpen: true,
    lat: 37.5006, lng: 127.0365
  },
  {
    id: 6, name: '미소들치과', type: '치과의원', department: '치과',
    departmentId: 'dental', address: '서울특별시 마포구 양화로 45',
    region: '서울', regionCode: '11', phone: '02-332-2875',
    score: 4.5, reviewCount: 654, specialistCount: 4,
    openDate: '2010-08-20', saturdayOpen: true, sundayOpen: true, nightOpen: true,
    lat: 37.5531, lng: 126.9196, parkingCapacity: 24, parkingFee: '건물 주차'
  },
  {
    id: 7, name: '분당서울대학교병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '경기도 성남시 분당구 구미로 173번길 82',
    region: '경기', regionCode: '41', phone: '031-787-7114',
    score: 4.6, reviewCount: 1654, specialistCount: 198,
    openDate: '2003-05-30', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.3520, lng: 127.1232
  },
  {
    id: 8, name: '관절힐링정형외과', type: '의원', department: '정형외과',
    departmentId: 'orthopedic', address: '서울특별시 서초구 서초대로 398',
    region: '서울', regionCode: '11', phone: '02-591-3377',
    score: 4.4, reviewCount: 432, specialistCount: 3,
    openDate: '2015-06-01', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.4934, lng: 127.0137
  },
  {
    id: 9, name: '아름다운피부과', type: '의원', department: '피부과',
    departmentId: 'dermatology', address: '서울특별시 강남구 논현로 848',
    region: '서울', regionCode: '11', phone: '02-544-5765',
    score: 4.3, reviewCount: 567, specialistCount: 5,
    openDate: '2012-11-10', saturdayOpen: true, sundayOpen: false, nightOpen: true,
    lat: 37.5119, lng: 127.0228
  },
  {
    id: 10, name: '부산대학교병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '부산광역시 서구 구덕로 179',
    region: '부산', regionCode: '26', phone: '051-240-7000',
    score: 4.5, reviewCount: 1234, specialistCount: 178,
    openDate: '1955-09-01', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 35.1049, lng: 129.0170
  },
  {
    id: 11, name: '해운대백병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '부산광역시 해운대구 해운대로 875',
    region: '부산', regionCode: '26', phone: '051-797-0100',
    score: 4.3, reviewCount: 876, specialistCount: 145,
    openDate: '2010-03-01', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 35.1718, lng: 129.1760
  },
  {
    id: 12, name: '서울좋은이비인후과', type: '의원', department: '이비인후과',
    departmentId: 'ent', address: '서울특별시 중구 을지로 66',
    region: '서울', regionCode: '11', phone: '02-2267-0030',
    score: 4.4, reviewCount: 321, specialistCount: 3,
    openDate: '2018-09-01', saturdayOpen: true, sundayOpen: false, nightOpen: true,
    lat: 37.5660, lng: 126.9916
  },
  {
    id: 13, name: '함소아한의원 강남점', type: '한의원', department: '한의원',
    departmentId: 'korean', address: '서울특별시 강남구 봉은사로 215',
    region: '서울', regionCode: '11', phone: '02-514-8275',
    score: 4.5, reviewCount: 478, specialistCount: 6,
    openDate: '2008-04-15', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.5103, lng: 127.0407
  },
  {
    id: 14, name: '맑은마음 정신건강의학과', type: '의원', department: '정신건강의학과',
    departmentId: 'psychiatry', address: '서울특별시 서초구 강남대로 359',
    region: '서울', regionCode: '11', phone: '02-533-3511',
    score: 4.6, reviewCount: 289, specialistCount: 4,
    openDate: '2016-02-20', saturdayOpen: true, sundayOpen: false, nightOpen: true,
    lat: 37.4969, lng: 127.0286
  },
  {
    id: 15, name: '인천세종병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '인천광역시 남동구 남동대로 812번길 10',
    region: '인천', regionCode: '28', phone: '032-240-8000',
    score: 4.2, reviewCount: 765, specialistCount: 132,
    openDate: '1993-07-12', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.4436, lng: 126.7310
  },
  {
    id: 16, name: '수원윌스기념병원', type: '병원', department: '정형외과',
    departmentId: 'orthopedic', address: '경기도 수원시 팔달구 우만동 573-2',
    region: '경기', regionCode: '41', phone: '031-228-7200',
    score: 4.4, reviewCount: 543, specialistCount: 18,
    openDate: '2004-05-10', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.2764, lng: 127.0285
  },
  {
    id: 17, name: '더봄소아청소년과', type: '의원', department: '소아청소년과',
    departmentId: 'pediatric', address: '서울특별시 송파구 올림픽로 289',
    region: '서울', regionCode: '11', phone: '02-421-5500',
    score: 4.7, reviewCount: 398, specialistCount: 4,
    openDate: '2019-03-04', saturdayOpen: true, sundayOpen: true, nightOpen: false,
    lat: 37.5142, lng: 127.1060
  },
  {
    id: 18, name: '대전을지대학교병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '대전광역시 서구 둔산서로 95',
    region: '대전', regionCode: '30', phone: '042-611-3000',
    score: 4.3, reviewCount: 987, specialistCount: 156,
    openDate: '1998-05-11', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 35.8542, lng: 126.8893
  },
  {
    id: 19, name: '새빛성형외과', type: '의원', department: '성형외과',
    departmentId: 'plastic', address: '서울특별시 강남구 압구정로 343',
    region: '서울', regionCode: '11', phone: '02-515-7772',
    score: 4.5, reviewCount: 623, specialistCount: 5,
    openDate: '2011-09-25', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.5257, lng: 127.0354
  },
  {
    id: 20, name: '온누리가정의학과', type: '의원', department: '가정의학과',
    departmentId: 'familymed', address: '경기도 고양시 일산동구 정발산로 43',
    region: '경기', regionCode: '41', phone: '031-901-0500',
    score: 4.2, reviewCount: 234, specialistCount: 3,
    openDate: '2017-06-12', saturdayOpen: true, sundayOpen: false, nightOpen: true,
    lat: 37.6584, lng: 126.7690
  },
  {
    id: 21, name: '연세산부인과', type: '의원', department: '산부인과',
    departmentId: 'obgyn', address: '서울특별시 강서구 공항대로 591',
    region: '서울', regionCode: '11', phone: '02-2063-0707',
    score: 4.4, reviewCount: 312, specialistCount: 4,
    openDate: '2013-04-08', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.5583, lng: 126.8371
  },
  {
    id: 22, name: '제주한라병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '제주특별자치도 제주시 도령로 65',
    region: '제주', regionCode: '50', phone: '064-740-5000',
    score: 4.1, reviewCount: 543, specialistCount: 98,
    openDate: '1972-10-01', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 33.4890, lng: 126.4833
  },
  {
    id: 23, name: '광주기독병원', type: '종합병원', department: '종합병원',
    departmentId: 'general', address: '광주광역시 남구 양림로 37',
    region: '광주', regionCode: '29', phone: '062-650-5000',
    score: 4.2, reviewCount: 678, specialistCount: 112,
    openDate: '1905-11-01', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 35.1410, lng: 126.9120
  },
  {
    id: 24, name: '바른통증의학과', type: '의원', department: '통증의학과',
    departmentId: 'pain', address: '서울특별시 영등포구 여의대로 108',
    region: '서울', regionCode: '11', phone: '02-780-8700',
    score: 4.3, reviewCount: 198, specialistCount: 3,
    openDate: '2020-01-15', saturdayOpen: true, sundayOpen: false, nightOpen: true,
    lat: 37.5255, lng: 126.9254
  },
  {
    id: 25, name: '척시원재활의학과', type: '의원', department: '재활의학과',
    departmentId: 'rehab', address: '서울특별시 성동구 왕십리로 410',
    region: '서울', regionCode: '11', phone: '02-2290-0090',
    score: 4.1, reviewCount: 156, specialistCount: 3,
    openDate: '2021-08-01', saturdayOpen: true, sundayOpen: false, nightOpen: false,
    lat: 37.5614, lng: 127.0378
  },
];



const NEW_HOSPITALS = [
  { id: 1001, name: '판교디지털내과의원',       type: '의원',     address: '경기도 성남시 분당구 판교역로 230',      openDate: '2026-06-15', department: '내과', departmentId: 'internal', score: 4.4, reviewCount: 86, specialistCount: 2, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 32, parkingFee: '건물 주차' },
  { id: 1002, name: '서초리더스365의원',        type: '의원',     address: '서울특별시 서초구 서초대로 262',        openDate: '2026-06-12', department: '가정의학과', departmentId: 'familymed', score: 4.3, reviewCount: 73, specialistCount: 1, saturdayOpen: true,  sundayOpen: true,  nightOpen: true,  parkingCapacity: 20, parkingFee: '건물 주차' },
  { id: 1003, name: '일산밝은안과의원',         type: '의원',     address: '경기도 고양시 일산서구 일산로 512',     openDate: '2026-06-10', department: '안과', departmentId: 'ophthalmology', score: 4.5, reviewCount: 88, specialistCount: 2, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 26, parkingFee: '건물 주차' },
  { id: 1004, name: '해운대좋은치과의원',       type: '치과의원', address: '부산광역시 해운대구 해운대로 623',      openDate: '2026-06-08', department: '치과', departmentId: 'dental', score: 4.4, reviewCount: 94, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 38, parkingFee: '건물 주차' },
  { id: 1005, name: '연세밝은미래소아청소년과', type: '의원',     address: '서울특별시 송파구 잠실로 195',          openDate: '2026-06-06', department: '소아청소년과', departmentId: 'pediatric', score: 4.5, reviewCount: 79, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 24, parkingFee: '건물 주차' },
  { id: 1006, name: '대전온정형외과의원',       type: '의원',     address: '대전광역시 유성구 대학로 99',           openDate: '2026-06-04', department: '정형외과', departmentId: 'orthopedic', score: 4.2, reviewCount: 61, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 18, parkingFee: '무료' },
  { id: 1007, name: '인천마음숲정신건강의학과', type: '의원',     address: '인천광역시 남동구 구월로 131',         openDate: '2026-06-02', department: '정신건강의학과', departmentId: 'psychiatry', score: 4.4, reviewCount: 57, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 16, parkingFee: '건물 주차' },
  { id: 1008, name: '강남뉴페이스성형외과',     type: '의원',     address: '서울특별시 강남구 논현로 831',          openDate: '2026-05-30', department: '성형외과', departmentId: 'plastic', score: 4.3, reviewCount: 82, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 22, parkingFee: '건물 주차' },
  { id: 1009, name: '교하하나의원',             type: '의원',     address: '경기도 파주시 동패동 1695-1',           openDate: '2001-08-01', department: '내과, 소아청소년과, 신경외과, 외과, 정형외과', departmentId: 'internal', score: 4.2, reviewCount: 164, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: false, parkingCapacity: 18, parkingFee: '무료' },
  { id: 1010, name: '교하본정형외과의원',       type: '의원',     address: '경기도 파주시 동패동 1694-2',           openDate: '2011-12-01', department: '정형외과', departmentId: 'orthopedic', score: 4.3, reviewCount: 138, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: false, parkingCapacity: 24, parkingFee: '무료' },
  { id: 1011, name: '교하굿모닝치과의원',       type: '치과의원', address: '경기도 파주시 와동동 1302-5',           openDate: '2010-07-01', department: '치과', departmentId: 'dental', score: 4.3, reviewCount: 121, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: false, parkingCapacity: 28, parkingFee: '건물 주차' },
  { id: 1012, name: '교하연세이비인후과의원',   type: '의원',     address: '경기도 파주시 동패동 1694-3',           openDate: '2006-09-01', department: '이비인후과', departmentId: 'ent', score: 4.2, reviewCount: 118, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: false, parkingCapacity: 20, parkingFee: '무료' },
  { id: 1013, name: '분당바른정형외과의원',     type: '의원',     address: '경기도 성남시 분당구 서현로 192',        openDate: '2018-03-12', department: '정형외과', departmentId: 'orthopedic', score: 4.4, reviewCount: 176, specialistCount: 2, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 40, parkingFee: '건물 주차' },
  { id: 1014, name: '운정아이소아청소년과의원', type: '의원',     address: '경기도 파주시 목동동 939-3',           openDate: '2017-05-18', department: '소아청소년과', departmentId: 'pediatric', score: 4.5, reviewCount: 152, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 26, parkingFee: '건물 주차' },
  { id: 1015, name: '송도밝은안과의원',         type: '의원',     address: '인천광역시 연수구 송도동 29-13',         openDate: '2016-08-22', department: '안과', departmentId: 'ophthalmology', score: 4.4, reviewCount: 168, specialistCount: 2, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 34, parkingFee: '건물 주차' },
  { id: 1016, name: '정자연세내과의원',         type: '의원',     address: '경기도 성남시 분당구 정자동 15-3',       openDate: '2014-04-09', department: '내과', departmentId: 'internal', score: 4.3, reviewCount: 144, specialistCount: 2, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 22, parkingFee: '건물 주차' },
  { id: 1017, name: '야탑튼튼정형외과의원',     type: '의원',     address: '경기도 성남시 분당구 야탑동 367-5',       openDate: '2015-10-21', department: '정형외과', departmentId: 'orthopedic', score: 4.3, reviewCount: 158, specialistCount: 2, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 30, parkingFee: '건물 주차' },
  { id: 1018, name: '센텀푸른안과의원',         type: '의원',     address: '부산광역시 해운대구 우동 1519',           openDate: '2017-02-14', department: '안과', departmentId: 'ophthalmology', score: 4.4, reviewCount: 149, specialistCount: 2, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 36, parkingFee: '건물 주차' },
  { id: 1019, name: '청라아이봄소아청소년과의원', type: '의원',   address: '인천광역시 서구 청라동 157-12',         openDate: '2018-11-05', department: '소아청소년과', departmentId: 'pediatric', score: 4.5, reviewCount: 163, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 28, parkingFee: '건물 주차' },
  { id: 1020, name: '홍대서울치과의원',         type: '치과의원', address: '서울특별시 마포구 서교동 358-92',       openDate: '2016-05-16', department: '치과', departmentId: 'dental', score: 4.4, reviewCount: 171, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 18, parkingFee: '건물 주차' },
  { id: 1021, name: '잠실서울산부인과의원',     type: '의원',     address: '서울특별시 송파구 올림픽로 269',         openDate: '2019-02-11', department: '산부인과', departmentId: 'obgyn', score: 4.4, reviewCount: 132, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 30, parkingFee: '건물 주차' },
  { id: 1022, name: '강남맑은비뇨의학과의원',   type: '의원',     address: '서울특별시 강남구 테헤란로 121',        openDate: '2018-06-18', department: '비뇨의학과', departmentId: 'urology', score: 4.3, reviewCount: 119, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 24, parkingFee: '건물 주차' },
  { id: 1023, name: '서현바른재활의학과의원',   type: '의원',     address: '경기도 성남시 분당구 서현동 248-5',      openDate: '2017-09-04', department: '재활의학과', departmentId: 'rehab', score: 4.2, reviewCount: 111, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 20, parkingFee: '건물 주차' },
  { id: 1024, name: '송파마음정신건강의학과의원', type: '의원',   address: '서울특별시 송파구 송파대로 286',         openDate: '2020-01-13', department: '정신건강의학과', departmentId: 'psychiatry', score: 4.5, reviewCount: 107, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 18, parkingFee: '건물 주차' },
  { id: 1025, name: '마포숨편한이비인후과의원', type: '의원',     address: '서울특별시 마포구 월드컵북로 23',         openDate: '2019-08-20', department: '이비인후과', departmentId: 'ent', score: 4.3, reviewCount: 126, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 14, parkingFee: '건물 주차' },
  { id: 1026, name: '동탄온가정의학과의원',     type: '의원',     address: '경기도 화성시 동탄대로 537',            openDate: '2021-03-15', department: '가정의학과', departmentId: 'familymed', score: 4.2, reviewCount: 98, specialistCount: 1, saturdayOpen: true,  sundayOpen: true,  nightOpen: true,  parkingCapacity: 32, parkingFee: '건물 주차' },
  { id: 1027, name: '광교참피부과의원',         type: '의원',     address: '경기도 수원시 영통구 광교중앙로 170',    openDate: '2018-04-03', department: '피부과', departmentId: 'dermatology', score: 4.3, reviewCount: 142, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 28, parkingFee: '건물 주차' },
  { id: 1028, name: '센텀바른치과의원',         type: '치과의원', address: '부산광역시 해운대구 센텀남대로 35',      openDate: '2019-07-22', department: '치과', departmentId: 'dental', score: 4.4, reviewCount: 133, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 34, parkingFee: '건물 주차' },
  { id: 1029, name: '대전새봄내과의원',         type: '의원',     address: '대전광역시 서구 둔산로 128',            openDate: '2018-10-08', department: '내과', departmentId: 'internal', score: 4.3, reviewCount: 129, specialistCount: 2, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 24, parkingFee: '건물 주차' },
  { id: 1030, name: '운정맑은피부과의원',       type: '의원',     address: '경기도 파주시 목동동 939-7',           openDate: '2020-06-01', department: '피부과', departmentId: 'dermatology', score: 4.2, reviewCount: 104, specialistCount: 1, saturdayOpen: true,  sundayOpen: false, nightOpen: true,  parkingCapacity: 20, parkingFee: '건물 주차' },
];

// 통계 데이터
const STATS = {
  totalHospitals: 56,
  totalRegions: 7,
  totalDepartments: 16,
};

window.DEPARTMENTS = DEPARTMENTS;
window.HOSPITALS = HOSPITALS;
window.NEW_HOSPITALS = NEW_HOSPITALS;
window.STATS = STATS;
