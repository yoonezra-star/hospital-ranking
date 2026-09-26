const fs = require('fs');

const SITE = 'https://hospital-ranking.kr';
const TODAY = '2026-09-26';
const SEARCH_GUIDE = { slug: 'guide-hospital-search', title: '지역 병원 검색부터 전화 확인까지', category: '병원 이용 안내', summary: '검색 결과가 없을 때의 대처, 야간·휴일 접수 확인 질문과 인쇄 가능한 방문 체크리스트입니다.' };
const ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1441018945572157" crossorigin="anonymous"></script>';

const guides = [
  {
    slug: 'guide-implant',
    title: '임플란트 치과 상담 전 체크 가이드',
    category: '치과',
    summary: '임플란트 상담 전에 촬영, 잇몸 상태, 보철 계획, 비용 범위를 어떻게 확인하면 좋은지 정리했습니다.',
    keywords: ['임플란트', '치과 상담', '보철 계획', '잇몸 상태'],
    visit: ['치아 상실 후 임플란트, 브릿지, 틀니 중 어떤 선택이 맞을지 비교하고 싶을 때', '발치 예정이거나 이전 치료 이력이 있어 상담 전에 준비할 자료가 필요할 때', '비용만이 아니라 촬영, 수술 가능 여부, 보철 유지관리까지 함께 확인하고 싶을 때'],
    compare: ['CT 또는 파노라마 촬영 여부와 설명 방식', '잇몸뼈 상태, 전신질환, 복용약 확인 절차', '수술 후 내원 주기와 보철 유지관리 안내', '추가 비용이 발생할 수 있는 항목의 사전 설명'],
    prepare: ['최근 치과 치료 기록이나 촬영 자료가 있다면 가져가세요.', '복용 중인 약, 당뇨·고혈압·골다공증 치료 여부를 메모하세요.', '상담 시 총 기간, 내원 횟수, 임시치아 가능 여부를 함께 물어보세요.'],
    questions: ['제 잇몸뼈 상태에서 뼈이식이 필요한가요?', '보철물 종류와 유지관리 방식은 어떻게 다른가요?', '수술 후 통증, 부기, 식사 제한은 어느 정도 예상해야 하나요?'],
    related: ['gyeonggi-dental.html', 'seoul-dental.html', 'parking-dental.html']
  },
  {
    slug: 'guide-endoscopy',
    title: '위·대장 내시경 검사 준비 가이드',
    category: '내과·검진',
    summary: '수면내시경과 일반 내시경을 준비할 때 금식, 약 복용, 보호자 동행, 검사 후 회복 동선을 확인하는 기준입니다.',
    keywords: ['내시경', '수면내시경', '검진', '금식'],
    visit: ['소화불량, 속쓰림, 혈변, 체중 변화 등으로 검사가 필요한지 상담하고 싶을 때', '건강검진에서 위·대장 내시경을 같이 예약하려는 경우', '수면내시경 후 귀가 동선과 보호자 동행 여부를 미리 정해야 할 때'],
    compare: ['금식 시간과 장정결 안내가 명확한지', '수면 여부, 회복실, 귀가 안내가 구체적인지', '조직검사 가능성과 결과 통보 방식', '복용약 중단 여부를 사전에 확인하는 절차'],
    prepare: ['항응고제, 당뇨약, 혈압약 등 복용약 목록을 준비하세요.', '검사 전날 식사와 장정결제 복용 시간을 병원 안내에 맞춰 확인하세요.', '수면내시경 예정이면 운전하지 않고 귀가할 방법을 정해두세요.'],
    questions: ['현재 복용약 중 검사 전에 조절해야 할 약이 있나요?', '조직검사를 하면 결과는 언제, 어떤 방식으로 확인하나요?', '검사 후 바로 식사와 일상생활이 가능한가요?'],
    related: ['endoscopy-clinic.html', 'daejeon-internal.html', 'seoul-internal.html']
  },
  {
    slug: 'guide-depression',
    title: '우울·불안 상담 전 준비 가이드',
    category: '정신건강의학과',
    summary: '초진 상담 전에 증상 기간, 수면, 식욕, 일상 기능 변화, 복용약 정보를 정리하는 방법을 안내합니다.',
    keywords: ['우울', '불안', '상담', '정신건강'],
    visit: ['우울감, 불안, 공황, 수면 문제가 2주 이상 이어질 때', '일상생활, 업무, 학업, 대인관계에 변화가 생겼을 때', '이전 상담 또는 약물치료 경험을 바탕으로 다시 평가받고 싶을 때'],
    compare: ['초진 상담 시간과 예약 방식', '약물치료, 상담치료, 심리검사 가능 범위', '비밀보장과 진료 기록 안내', '재진 주기와 응급 상황 시 연락 방법'],
    prepare: ['증상이 시작된 시점과 악화되는 상황을 간단히 적어두세요.', '수면 시간, 식욕, 체중 변화, 집중력 변화를 함께 메모하세요.', '현재 복용 중인 약과 이전 치료 경험을 정리하세요.'],
    questions: ['현재 증상은 어떤 진료 계획으로 살펴보면 좋을까요?', '약물치료가 필요하다면 예상 기간과 부작용 확인 방법은 무엇인가요?', '상담치료나 심리검사를 병행할 수 있나요?'],
    related: ['seoul-psychiatry.html', 'contact.html', 'about.html']
  },
  {
    slug: 'guide-diabetes',
    title: '당뇨·고혈압 만성질환 진료 준비 가이드',
    category: '내과',
    summary: '검진 결과 상담, 혈당·혈압 기록, 복용약 조정, 합병증 검사를 준비할 때 확인할 항목입니다.',
    keywords: ['당뇨', '고혈압', '만성질환', '내과'],
    visit: ['건강검진에서 혈당, 혈압, 콜레스테롤 이상 소견을 들었을 때', '복용약 조정이나 생활관리 계획을 다시 세우고 싶을 때', '눈, 신장, 말초신경 등 합병증 검사를 문의해야 할 때'],
    compare: ['검사 결과를 쉽게 설명해 주는지', '혈액검사, 소변검사, 심전도 등 추적검사 가능 여부', '약 조정과 생활관리 안내가 함께 이뤄지는지', '정기 추적 진료 주기가 명확한지'],
    prepare: ['최근 건강검진 결과지와 처방전을 가져가세요.', '집에서 측정한 혈압·혈당 기록이 있으면 함께 보여주세요.', '저혈당 증상, 어지러움, 부종, 흉통 등 불편 증상을 메모하세요.'],
    questions: ['현재 수치에서 약 조정이 필요한가요?', '다음 검사까지 어떤 생활습관을 우선 관리해야 하나요?', '합병증 확인을 위해 어떤 검사를 언제 받아야 하나요?'],
    related: ['seoul-internal.html', 'daejeon-internal.html', 'vaccination-clinic.html']
  },
  {
    slug: 'guide-rhinitis',
    title: '비염·반복 감기 이비인후과 방문 가이드',
    category: '이비인후과',
    summary: '코막힘, 재채기, 후비루, 반복 감기 증상을 정리하고 이비인후과 방문 전에 확인할 내용을 모았습니다.',
    keywords: ['비염', '코막힘', '이비인후과', '알레르기'],
    visit: ['코막힘, 재채기, 콧물, 후비루가 반복될 때', '감기처럼 보이지만 특정 계절이나 환경에서 자주 악화될 때', '아이의 수면, 코골이, 입벌림 호흡이 걱정될 때'],
    compare: ['비강 내시경 등 기본 확인 가능 여부', '알레르기 검사와 약물치료 안내', '소아 진료와 성인 진료의 구분', '재발 시 관리 방법을 설명하는지'],
    prepare: ['증상이 심해지는 시간, 장소, 계절을 적어두세요.', '복용했던 감기약, 항히스타민제, 스프레이 사용 경험을 정리하세요.', '발열, 두통, 누런 콧물, 귀 통증 동반 여부도 함께 확인하세요.'],
    questions: ['감기와 알레르기 비염을 어떻게 구분하나요?', '스프레이나 약은 어느 기간까지 사용해야 하나요?', '검사나 추적 진료가 필요한 상황은 무엇인가요?'],
    related: ['seoul-ent.html', 'daegu-ent.html', 'daejeon-ent.html']
  },
  {
    slug: 'guide-urology',
    title: '비뇨의학과 방문 전 증상 정리 가이드',
    category: '비뇨의학과',
    summary: '배뇨 불편, 빈뇨, 혈뇨, 요로결석 의심 증상으로 비뇨의학과를 찾기 전 확인할 내용입니다.',
    keywords: ['비뇨의학과', '배뇨 불편', '혈뇨', '요로결석'],
    visit: ['소변 볼 때 통증, 빈뇨, 잔뇨감, 혈뇨가 있을 때', '옆구리 통증이나 요로결석이 의심될 때', '전립선, 방광, 신장 관련 검사를 상담하고 싶을 때'],
    compare: ['소변검사, 초음파, 영상검사 연계 가능 여부', '남성·여성 배뇨 질환 상담 경험', '검사 전 준비사항 안내', '응급 통증 시 대응 안내'],
    prepare: ['증상 시작 시점과 통증 위치를 적어두세요.', '발열, 오한, 혈뇨, 옆구리 통증 동반 여부를 확인하세요.', '최근 복용약, 항생제 사용 여부, 이전 결석 이력을 정리하세요.'],
    questions: ['소변검사 외에 추가 검사가 필요한가요?', '통증이 심해질 때 바로 방문해야 하는 기준은 무엇인가요?', '재발 예방을 위해 생활에서 조정할 점은 무엇인가요?'],
    related: ['seoul-urology.html', 'urinary-stone-clinic.html', 'night-clinic.html']
  },
  {
    slug: 'guide-lasik',
    title: '라식·라섹 안과 검사 전 체크 가이드',
    category: '안과',
    summary: '시력교정술 상담 전에 각막 두께, 안구건조, 렌즈 중단 기간, 회복 일정을 확인하는 기준입니다.',
    keywords: ['라식', '라섹', '시력교정', '안과'],
    visit: ['라식, 라섹, 렌즈삽입술 중 어떤 방식이 맞는지 상담하고 싶을 때', '안구건조, 각막 두께, 직업상 회복 기간을 함께 고려해야 할 때', '검사 전 렌즈 착용 중단 기간을 확인해야 할 때'],
    compare: ['정밀검사 항목과 결과 설명 방식', '수술 가능 여부를 보수적으로 판단하는지', '회복 기간, 통증, 재수술 가능성 안내', '수술 후 정기검진 일정과 응급 연락 방법'],
    prepare: ['소프트렌즈, 하드렌즈 착용 중단 기간을 병원에 확인하세요.', '안구건조, 알레르기, 이전 안과 수술 이력을 정리하세요.', '수술 후 휴가 가능 기간과 운전 계획을 미리 생각해두세요.'],
    questions: ['제 눈 상태에서 권장하지 않는 수술 방식이 있나요?', '수술 후 건조감과 빛번짐은 어떻게 관리하나요?', '회복 기간 동안 피해야 할 활동은 무엇인가요?'],
    related: ['gangnam-lasik.html', 'lasik-clinic.html', 'seoul-ophthalmology.html']
  },
  {
    slug: 'guide-cataract',
    title: '백내장 검사와 수술 상담 가이드',
    category: '안과',
    summary: '시야 흐림, 눈부심, 인공수정체 선택, 수술 전후 주의사항을 상담할 때 필요한 체크포인트입니다.',
    keywords: ['백내장', '인공수정체', '안과 검사', '수술 상담'],
    visit: ['시야가 뿌옇거나 눈부심, 야간 운전 불편이 늘었을 때', '검진에서 백내장 소견을 듣고 수술 시점을 상담하고 싶을 때', '인공수정체 종류와 비용 차이를 이해하고 싶을 때'],
    compare: ['정밀검사와 시력 변화 설명', '인공수정체 장단점과 비용 안내', '수술 후 내원 일정과 안약 사용 안내', '동반 안질환 확인 절차'],
    prepare: ['기존 안과 진료 기록과 안약 사용 내역을 정리하세요.', '운전, 독서, 컴퓨터 사용 등 중요한 생활 패턴을 알려주세요.', '당뇨, 혈압, 항응고제 복용 여부를 함께 확인하세요.'],
    questions: ['지금 수술이 필요한 단계인가요, 추적 관찰이 가능한가요?', '인공수정체 선택 기준은 무엇인가요?', '수술 후 회복과 일상 복귀는 어느 정도 걸리나요?'],
    related: ['cataract-clinic.html', 'busan-ophthalmology.html', 'incheon-ophthalmology.html']
  },
  {
    slug: 'guide-ortho',
    title: '정형외과·통증 외래 방문 전 체크 가이드',
    category: '정형외과',
    summary: '허리, 목, 어깨, 무릎 통증 진료 전에 통증 위치, 악화 동작, 영상검사 이력을 정리하는 방법입니다.',
    keywords: ['정형외과', '통증', '허리통증', '무릎통증'],
    visit: ['허리, 목, 어깨, 무릎 통증이 반복되거나 움직임을 제한할 때', 'X-ray, MRI 등 영상검사 필요 여부를 상담하고 싶을 때', '주사치료, 물리치료, 도수치료, 재활치료를 비교하고 싶을 때'],
    compare: ['통증 원인 설명과 검사 필요성 안내', '영상검사 결과를 치료 계획과 연결해 설명하는지', '비수술 치료와 수술 의뢰 기준', '치료 후 재발 방지 운동 안내'],
    prepare: ['통증 위치, 시작 시점, 악화되는 동작을 적어두세요.', '기존 MRI, X-ray, 진료 기록이 있으면 가져가세요.', '저림, 감각 저하, 근력 약화가 있는지 함께 확인하세요.'],
    questions: ['영상검사가 꼭 필요한 상황인가요?', '비수술 치료로 어느 정도 기간을 지켜볼 수 있나요?', '집에서 해도 되는 운동과 피해야 할 동작은 무엇인가요?'],
    related: ['gyeonggi-orthopedic.html', 'seoul-orthopedic.html', 'manual-therapy-clinic.html']
  },
  {
    slug: 'guide-manual-therapy',
    title: '도수치료 상담 전 확인 가이드',
    category: '재활·통증',
    summary: '도수치료 상담 전에 통증 위치, 영상검사, 치료 목표, 방문 빈도와 비용 범위를 확인하는 기준입니다.',
    keywords: ['도수치료', '재활', '통증치료', '물리치료'],
    visit: ['목, 허리, 어깨, 골반 통증으로 자세와 움직임 평가가 필요할 때', '수술 후 재활이나 만성 통증 관리 계획을 세우고 싶을 때', '도수치료가 현재 상태에 적절한지 의사 평가를 받고 싶을 때'],
    compare: ['의사 진단과 치료 계획이 먼저 설명되는지', '치료 목표, 횟수, 예상 기간이 구체적인지', '운동교육과 생활 자세 안내가 포함되는지', '통증 악화 시 중단 기준을 안내하는지'],
    prepare: ['통증 위치와 악화 동작을 메모하세요.', '최근 영상검사 자료와 이전 치료 경험을 준비하세요.', '치료받을 수 있는 요일과 방문 빈도를 현실적으로 정리하세요.'],
    questions: ['현재 상태에서 도수치료가 우선인가요?', '몇 회 정도 후 효과를 평가하나요?', '집에서 병행해야 할 운동이나 자세 교정은 무엇인가요?'],
    related: ['manual-therapy-clinic.html', 'seoul-rehab.html', 'seoul-pain.html']
  },
  {
    slug: 'guide-acne',
    title: '여드름·피부과 상담 전 체크 가이드',
    category: '피부과',
    summary: '여드름, 색소, 흉터 상담 전에 증상 기간, 사용 제품, 약 처방 경험, 시술 선택 기준을 정리합니다.',
    keywords: ['여드름', '피부과', '흉터', '색소'],
    visit: ['여드름이 반복되거나 흉터, 색소 침착이 남을 때', '먹는 약, 바르는 약, 레이저 시술 중 무엇이 맞는지 상담하고 싶을 때', '화장품이나 홈케어만으로 조절이 어려울 때'],
    compare: ['피부 상태를 먼저 평가하고 치료 단계를 설명하는지', '약물치료와 시술의 장단점을 구분해 안내하는지', '부작용과 회복 기간 안내', '재발 관리와 생활관리 설명'],
    prepare: ['현재 사용하는 화장품, 연고, 복용약을 적어두세요.', '증상이 심해지는 시기와 생리주기, 스트레스, 식습관 관련성을 메모하세요.', '이전 시술이나 약물치료 경험을 정리하세요.'],
    questions: ['약물치료와 시술 중 어떤 순서가 적절한가요?', '흉터 치료는 어느 정도 기간을 예상해야 하나요?', '치료 중 피해야 할 화장품이나 생활습관이 있나요?'],
    related: ['seoul-dermatology.html', 'night-dermatology.html', 'guide-rhinitis.html']
  },
  {
    slug: 'guide-womens-checkup',
    title: '여성검진·산부인과 상담 전 체크 가이드',
    category: '산부인과',
    summary: '여성검진, 초음파, 자궁경부암 검사, 생리 이상 상담 전에 준비할 정보를 정리했습니다.',
    keywords: ['여성검진', '산부인과', '초음파', '자궁경부암 검사'],
    visit: ['정기 여성검진이나 자궁경부암 검사를 준비할 때', '생리불순, 부정출혈, 골반통, 분비물 변화가 있을 때', '초음파나 호르몬 검사 필요 여부를 상담하고 싶을 때'],
    compare: ['검진 항목과 비용 범위 안내', '여성 의료진 여부와 예약 방식', '초음파, 세포검사, 추가검사 설명', '검사 결과 통보와 재진 안내'],
    prepare: ['마지막 생리 시작일과 주기 변화를 메모하세요.', '복용약, 피임약, 임신 가능성, 기존 질환을 정리하세요.', '이전 검진 결과지가 있으면 함께 가져가세요.'],
    questions: ['현재 증상에서 필요한 검사는 무엇인가요?', '검사 결과는 언제 어떻게 확인하나요?', '추적검사나 재방문이 필요한 기준은 무엇인가요?'],
    related: ['womens-checkup-clinic.html', 'songpa-womens-checkup.html', 'seoul-obgyn.html']
  },
  {
    slug: 'guide-breast-ultrasound',
    title: '유방초음파 상담 전 체크 가이드',
    category: '여성검진',
    summary: '유방초음파 전 멍울, 통증, 검진 이력, 가족력, 추가검사 질문을 정리하는 방법입니다.',
    keywords: ['유방초음파', '유방검진', '멍울', '여성검진'],
    visit: ['유방 멍울, 통증, 분비물 변화가 있거나 정기검진이 필요할 때', '이전 유방촬영 또는 초음파 결과를 비교해야 할 때', '조직검사나 추적검사 필요성을 상담하고 싶을 때'],
    compare: ['유방촬영과 초음파 결과를 함께 설명하는지', '추적검사 주기와 추가검사 기준', '검사 결과 보관과 비교 판독 가능 여부', '검사 전후 안내가 명확한지'],
    prepare: ['멍울 위치, 발견 시점, 통증 여부를 적어두세요.', '이전 유방검진 결과와 가족력을 정리하세요.', '생리주기와 증상 변화가 관련 있는지 메모하세요.'],
    questions: ['추적검사가 필요한 소견인가요?', '유방촬영과 초음파를 함께 해야 하나요?', '조직검사가 필요한 기준은 무엇인가요?'],
    related: ['guide-womens-checkup.html', 'womens-checkup-clinic.html', 'songpa-womens-checkup.html']
  },
  {
    slug: 'guide-incontinence',
    title: '요실금·배뇨장애 상담 전 체크 가이드',
    category: '비뇨의학과·산부인과',
    summary: '요실금, 빈뇨, 야간뇨, 절박뇨 상담 전에 증상 빈도와 생활 영향을 정리하는 기준입니다.',
    keywords: ['요실금', '배뇨장애', '빈뇨', '야간뇨'],
    visit: ['기침, 운동, 웃음 중 소변이 새는 일이 반복될 때', '소변이 자주 마렵거나 참기 어려운 증상이 있을 때', '출산 후 또는 중장년 이후 배뇨 문제가 생활에 영향을 줄 때'],
    compare: ['소변검사와 초음파 등 기본 확인 절차', '운동치료, 약물치료, 시술 상담 범위', '생활습관 조정 안내', '추적 진료와 재평가 기준'],
    prepare: ['하루 배뇨 횟수와 야간뇨 횟수를 2~3일 정도 기록하세요.', '증상이 생기는 상황과 패드 사용 여부를 적어두세요.', '출산 이력, 수술 이력, 복용약을 정리하세요.'],
    questions: ['요실금 유형은 어떻게 구분하나요?', '운동치료나 약물치료로 얼마나 지켜볼 수 있나요?', '추가검사가 필요한 상황은 무엇인가요?'],
    related: ['guide-urology.html', 'seoul-urology.html', 'womens-checkup-clinic.html']
  },
  {
    slug: 'guide-pediatric-dental',
    title: '소아치과 방문 전 보호자 체크 가이드',
    category: '소아치과',
    summary: '아이 충치, 유치 관리, 불소도포, 치과 공포를 줄이기 위해 보호자가 미리 확인할 항목입니다.',
    keywords: ['소아치과', '어린이 치과', '유치', '충치'],
    visit: ['아이의 충치, 치통, 잇몸 부기, 치아 흔들림이 걱정될 때', '불소도포, 실란트, 정기검진을 시작하려는 경우', '치과 방문을 무서워해 진료 환경을 비교하고 싶을 때'],
    compare: ['소아 진료 경험과 설명 방식', '보호자 동반 가능 여부', '예방진료와 치료 계획 안내', '응급 치통이나 외상 대응 안내'],
    prepare: ['아이의 증상 시작 시점과 통증 표현을 메모하세요.', '이전 치과 치료 경험과 무서워하는 상황을 알려주세요.', '복용약, 알레르기, 전신질환 여부를 정리하세요.'],
    questions: ['지금 치료가 필요한 충치인가요, 관찰 가능한가요?', '불소도포나 실란트는 언제부터 고려하면 좋나요?', '아이 치과 공포를 줄이기 위해 어떤 방식으로 진료하나요?'],
    related: ['incheon-pediatric.html', 'sunday-pediatric.html', 'vaccination-clinic.html']
  },
  {
    slug: 'guide-chuna',
    title: '추나·한방 통증 진료 전 체크 가이드',
    category: '한의원·한방병원',
    summary: '추나, 침, 한방 통증 진료를 상담하기 전 통증 위치, 기존 검사, 복용약, 치료 목표를 정리합니다.',
    keywords: ['추나', '한의원', '한방병원', '통증'],
    visit: ['목, 허리, 어깨 통증으로 한방 치료를 상담하고 싶을 때', '추나, 침, 약침 등 치료 방식 차이를 알고 싶을 때', '기존 정형외과 검사 결과를 바탕으로 보완 치료를 고려할 때'],
    compare: ['현재 상태 평가와 치료 적합성 설명', '추나 가능 여부와 치료 빈도 안내', '기존 질환과 복용약 확인', '치료 후 악화 시 대응 기준'],
    prepare: ['통증 위치와 악화되는 동작을 적어두세요.', 'MRI, X-ray 등 기존 검사 자료가 있으면 가져가세요.', '항응고제, 골다공증, 수술 이력 등 안전 관련 정보를 알려주세요.'],
    questions: ['제 상태에서 추나치료가 적절한가요?', '치료 중 피해야 할 운동이나 자세가 있나요?', '통증이 심해질 경우 어떤 기준으로 병원을 다시 찾아야 하나요?'],
    related: ['manual-therapy-clinic.html', 'guide-ortho.html', 'seoul-rehab.html']
  }
];

const OFFICIAL_SOURCES = {
  'guide-implant': [
    { title: '건강보험심사평가원 건강지도', href: 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000', note: '치과 등 의료기관 검색과 기관 정보 확인 경로' },
  ],
  'guide-endoscopy': [
    { title: '국립암센터 대장암 검사 안내', href: 'https://www.cancer.go.kr/lay1/program/S1T211C223/cancer/view.do?cancer_seq=4997&menu_seq=5009', note: '대장내시경과 국가암검진 관련 공식 안내' },
    { title: '국립암센터 국가암검진사업', href: 'https://edu.cancer.go.kr/lay1/S1T553C555/contents.do', note: '검진 주기와 검사 방법 확인' },
  ],
  'guide-depression': [
    { title: '질병관리청 국가건강정보포털', href: 'https://health.kdca.go.kr/', note: '우울증 등 건강정보를 공식 포털에서 다시 확인' },
  ],
  'guide-diabetes': [
    { title: '질병관리청 국가건강정보포털', href: 'https://health.kdca.go.kr/', note: '고혈압·당뇨병 건강정보 확인' },
    { title: '질병관리청 심뇌혈관질환 예방관리', href: 'https://www.kdca.go.kr/kdca/3361/subview.do', note: '고혈압·당뇨병 예방관리 안내' },
  ],
  'guide-rhinitis': [
    { title: '질병관리청 국가건강정보포털', href: 'https://health.kdca.go.kr/', note: '증상과 질환 정보를 공식 포털에서 검색' },
    { title: '영국 국민보건서비스 알레르기 비염 안내', href: 'https://www.nhs.uk/conditions/allergic-rhinitis/', note: '코막힘·재채기 등 주요 증상과 진료 상담 기준 확인' },
  ],
  'guide-urology': [
    { title: '질병관리청 국가건강정보포털', href: 'https://health.kdca.go.kr/', note: '배뇨·요로 관련 건강정보 확인' },
    { title: '미국 국립당뇨·소화기·신장질환연구소 혈뇨 안내', href: 'https://www.niddk.nih.gov/health-information/urologic-diseases/hematuria-blood-urine', note: '혈뇨 확인 과정과 소변검사·영상검사 개요' },
  ],
  'guide-lasik': [
    { title: '미국 국립안연구소 시력교정술 안내', href: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/refractive-errors/surgery-refractive-errors', note: 'LASIK과 굴절교정술의 적응·위험 설명' },
  ],
  'guide-cataract': [
    { title: '미국 국립안연구소 백내장 안내', href: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/cataracts', note: '백내장 증상, 검사, 치료 선택지 확인' },
  ],
  'guide-ortho': [
    { title: '질병관리청 국가건강정보포털', href: 'https://health.kdca.go.kr/', note: '근골격계 증상과 건강정보 확인' },
  ],
  'guide-manual-therapy': [
    { title: '건강보험심사평가원 건강지도', href: 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000', note: '진료과와 의료기관 검색 경로' },
  ],
  'guide-acne': [
    { title: '질병관리청 국가건강정보포털', href: 'https://health.kdca.go.kr/', note: '피부 증상과 질환 정보를 공식 포털에서 검색' },
  ],
  'guide-womens-checkup': [
    { title: '국립암센터 국가암검진사업', href: 'https://edu.cancer.go.kr/lay1/S1T553C555/contents.do', note: '유방암·자궁경부암 등 국가검진 안내' },
  ],
  'guide-breast-ultrasound': [
    { title: '국립암센터 국가암검진사업', href: 'https://edu.cancer.go.kr/lay1/S1T553C555/contents.do', note: '유방검진 항목과 검사 방법 확인' },
  ],
  'guide-incontinence': [
    { title: '질병관리청 국가건강정보포털', href: 'https://health.kdca.go.kr/', note: '배뇨 관련 건강정보 확인' },
    { title: '미국 국립당뇨·소화기·신장질환연구소 요실금 안내', href: 'https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems/treatment', note: '배뇨일지와 방광훈련 등 상담 항목 확인' },
  ],
  'guide-pediatric-dental': [
    { title: '건강보험심사평가원 건강지도', href: 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000', note: '소아 진료기관 검색 경로' },
    { title: '미국 국립치과두개안면연구소 충치 예방 안내', href: 'https://www.nidcr.nih.gov/health-info/tooth-decay/more-info/tooth-decay-process', note: '어린이 충치 진행과 예방 관리 확인' },
    { title: '미국 국립치과두개안면연구소 치아 실란트 안내', href: 'https://www.nidcr.nih.gov/health-info/dental-sealants', note: '어금니 실란트의 목적과 시기 확인' },
  ],
  'guide-chuna': [
    { title: '건강보험심사평가원 건강지도', href: 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000', note: '한방·재활 관련 의료기관 검색 경로' },
  ],
};

const GUIDE_DEEP_DIVES = {
  'guide-implant': {
    title: '치아별 상담 내용을 한 장에 정리하기',
    intro: '임플란트 상담은 수술 가능 여부뿐 아니라 발치, 뼈 상태, 보철, 유지관리까지 단계가 나뉩니다. 병원별 설명을 같은 기준으로 기록해야 비용과 기간을 오해하지 않습니다.',
    records: ['치아 위치와 발치 여부, 통증·염증이 있었던 시점', '파노라마·CT 촬영일과 이전 치과 치료 기록 보유 여부', '당뇨·고혈압·골다공증 치료와 현재 복용약', '씹기 불편, 심미성, 치료 기간 중 가장 우선하는 목표'],
    resultTitle: '견적과 치료계획을 비교할 때',
    results: ['수술, 뼈이식, 임시치아, 보철 비용이 각각 포함됐는지 확인합니다.', '예상 내원 횟수와 수술·보철 완료 시점을 구분해 기록합니다.', '정기검진과 보철물 관리, 문제가 생겼을 때의 보증 범위를 묻습니다.'],
  },
  'guide-endoscopy': {
    title: '검사 예약 전에 정리할 건강정보',
    intro: '내시경 종류와 수면 여부에 따라 금식, 약 조절, 귀가 방법이 달라질 수 있습니다. 병원의 개별 안내를 우선하고 아래 정보를 예약 단계에서 정확히 전달하세요.',
    records: ['위내시경·대장내시경 중 필요한 검사와 검진 또는 증상 평가 목적', '항응고제·당뇨약·혈압약을 포함한 복용약 이름과 복용 시간', '이전 내시경 날짜, 용종 제거·조직검사 여부, 결과지 보유 여부', '수면내시경 경험, 약물 알레르기, 보호자 동행과 귀가 수단'],
    resultTitle: '검사 결과를 받을 때',
    results: ['관찰 결과와 조직검사 시행 여부를 구분해 확인합니다.', '식사·운전·운동 재개 시점과 당일 주의사항을 안내받습니다.', '조직검사 결과 확인일과 다음 검사 권고 시점을 기록합니다.'],
  },
  'guide-depression': {
    title: '초진에서 설명할 변화를 시간순으로 적기',
    intro: '우울감이나 불안 정도만 말하기 어려울 때는 수면, 식사, 집중력, 일상 기능이 언제부터 어떻게 달라졌는지를 시간순으로 정리하면 도움이 됩니다.',
    records: ['증상이 시작된 시점과 악화·완화되는 시간 또는 상황', '잠드는 시간, 중간에 깨는 횟수, 기상 시간의 변화', '식욕·체중·집중력과 업무·학업·대인관계의 변화', '이전 상담·약물 경험, 현재 복용약, 카페인과 음주 패턴'],
    resultTitle: '첫 상담 뒤 확인할 계획',
    results: ['평가, 상담, 약물, 심리검사 중 다음 단계와 목적을 구분합니다.', '약을 처방받았다면 복용법과 관찰할 변화, 문의 방법을 확인합니다.', '다음 예약일과 증상이 급격히 악화될 때 이용할 연락 경로를 기록합니다.'],
  },
  'guide-diabetes': {
    title: '수치와 생활 변화를 함께 기록하기',
    intro: '한 번의 혈압·혈당 수치만으로 경과를 설명하기 어렵습니다. 측정 시간과 식사·복약 상황을 함께 기록하고 최근 검사 결과 원본을 준비하세요.',
    records: ['혈압·혈당을 측정한 날짜와 시간, 식전·식후 여부', '약 이름, 복용 시간, 최근 복용량이 바뀐 시점', '식사·운동 패턴과 어지러움·부종 등 새로 느낀 변화', '최근 건강검진의 혈당·당화혈색소·지질·신장 관련 결과지'],
    resultTitle: '진료 후 관리표 만들기',
    results: ['유지·변경된 약과 복용 시간을 새 목록으로 정리합니다.', '집에서 기록할 수치와 측정 빈도, 목표 범위를 확인합니다.', '다음 혈액·소변검사 항목과 예약 시점을 달력에 표시합니다.'],
  },
  'guide-lasik': {
    title: '정밀검사 전에 생활 조건 정리하기',
    intro: '시력교정술은 검사 결과뿐 아니라 직업, 운전, 화면 사용, 회복에 쓸 수 있는 기간을 함께 고려합니다. 특정 수술법을 미리 정하기보다 생활 조건을 먼저 전달하세요.',
    records: ['안경·소프트렌즈·하드렌즈 종류와 렌즈를 중단한 날짜', '안구건조·알레르기·야간 눈부심과 이전 안과 치료 이력', '운전, 야간근무, 화면 작업, 운동처럼 중요한 일상 활동', '회복을 위해 확보할 수 있는 휴가와 수술 후 이동 방법'],
    resultTitle: '검사 결과 설명을 들을 때',
    results: ['각막·건조증 등 검사 결과와 수술 가능 판단의 근거를 묻습니다.', '가능한 방법별 기대 범위, 제한, 회복 차이를 같은 기준으로 기록합니다.', '수술 후 안약, 보호장비, 정기검진과 응급 연락 방법을 확인합니다.'],
  },
  'guide-ortho': {
    title: '통증 위치와 기능 제한을 구분해 기록하기',
    intro: '통증 점수만 적기보다 어떤 동작을 할 수 없게 됐는지, 저림이나 힘 빠짐이 동반되는지를 함께 기록하면 검사와 치료 상담에 도움이 됩니다.',
    records: ['통증이 시작된 날짜와 다친 계기 또는 반복 동작 여부', '목·허리·어깨·무릎 등 정확한 위치와 퍼지는 방향', '걷기, 계단, 앉기, 수면 중 제한되는 활동과 지속 시간', '저림·감각 변화·근력 저하와 기존 X-ray·MRI 검사일'],
    resultTitle: '검사와 치료 설명을 정리할 때',
    results: ['검사가 필요한 이유와 결과가 치료계획에 미치는 영향을 묻습니다.', '약·주사·물리치료·재활의 목표와 평가 시점을 구분합니다.', '피해야 할 동작과 가능한 운동, 다시 진료받을 변화 기준을 확인합니다.'],
  },
  'guide-acne': {
    title: '피부 변화와 사용 제품 기록하기',
    intro: '여드름·피부염·색소 상담에서는 증상 기간과 사용한 제품, 이전 치료 반응이 중요합니다. 사진을 남길 때는 같은 조명과 비슷한 각도를 사용하면 변화를 설명하기 쉽습니다.',
    records: ['처음 시작한 시점과 얼굴·몸에서 심한 부위', '생리주기, 마스크, 면도, 화장품 변경과 악화 시점의 관계', '사용 중인 세안제·화장품·연고·복용약 이름과 사용 기간', '이전 압출·레이저·약물치료와 좋아지거나 불편했던 점'],
    resultTitle: '치료계획을 받은 뒤',
    results: ['먹는 약, 바르는 약, 시술의 목적과 사용 순서를 구분합니다.', '건조·자극 등 관찰할 반응과 제품 중단 여부를 확인합니다.', '사진으로 경과를 비교할 시점과 다음 진료 전에 지킬 관리법을 기록합니다.'],
  },
  'guide-womens-checkup': {
    title: '상담 전에 날짜와 변화를 기록하는 법',
    intro: '여성검진은 정기검진인지 증상 상담인지에 따라 확인할 항목이 달라집니다. 기억에 의존하기보다 아래 내용을 날짜와 함께 적어 가면 상담 목적을 전달하기 쉽습니다.',
    records: ['마지막 생리 시작일, 평소 주기, 최근 주기 변화', '출혈이 평소와 달랐던 날짜와 지속 기간, 양의 변화', '골반통이나 불편감의 위치, 시작 시점, 반복되는 상황', '이전 자궁경부세포검사·초음파의 검사일과 결과지를 받은 기관'],
    resultTitle: '검사 뒤 확인할 항목',
    results: ['받은 검사의 정확한 이름과 검사 목적을 기록합니다.', '결과를 확인하는 날짜와 방식, 재방문 필요 여부를 묻습니다.', '추적검사가 필요하다면 다음 검사 시점과 그 전에 관찰할 변화를 적습니다.'],
  },
  'guide-breast-ultrasound': {
    title: '멍울과 통증 위치를 설명하는 기록법',
    intro: '유방 증상은 좌우 위치와 처음 발견한 시점, 이전 검사와의 비교가 중요합니다. 진단을 추정하기보다 의료진에게 전달할 관찰 내용을 구체적으로 정리하세요.',
    records: ['왼쪽·오른쪽 중 어느 쪽인지와 유두를 기준으로 한 대략적인 위치', '처음 발견한 날짜와 크기·통증이 달라졌다고 느낀 시점', '피부나 유두의 변화, 분비물 여부와 관찰한 날짜', '이전 유방촬영·초음파 검사일, 검사 기관, 결과지 보유 여부'],
    resultTitle: '결과 설명을 들을 때',
    results: ['이번 검사가 유방촬영인지 초음파인지 정확한 검사명을 확인합니다.', '이전 영상과 비교했는지, 추가검사 또는 추적관찰이 필요한지 묻습니다.', '결과지와 영상 사본을 받을 수 있는 방법을 확인해 다음 방문에 활용합니다.'],
  },
  'guide-pediatric-dental': {
    title: '아이 치아 상태와 생활습관 기록',
    intro: '아이의 치통 표현은 일정하지 않을 수 있으므로 보호자가 관찰한 식사·수면·양치 변화를 함께 전달하는 것이 좋습니다.',
    records: ['아이가 가리키는 치아 위치와 아프다고 말한 날짜·시간대', '찬 음식, 단 음식, 씹을 때처럼 불편을 보인 상황', '밤중 통증, 잇몸 부기, 치아 외상 여부와 발생 시점', '하루 양치 횟수, 불소치약 사용 여부, 간식과 음료 섭취 습관'],
    resultTitle: '치료계획을 받은 뒤',
    results: ['치아별로 치료·관찰·예방관리 항목을 나누어 기록합니다.', '불소도포나 실란트가 권해졌다면 목적과 다음 확인 시점을 묻습니다.', '아이에게 설명할 표현과 다음 방문 전에 연습할 행동을 의료진과 상의합니다.'],
  },
  'guide-incontinence': {
    title: '2~3일 배뇨일지에 적을 내용',
    intro: '배뇨일지는 소변을 본 시간과 누출 상황을 객관적으로 전달하는 도구입니다. 평소 생활을 과도하게 바꾸지 말고 기록 가능한 범위에서 작성하세요.',
    records: ['소변을 본 시각과 야간에 깬 횟수', '갑자기 마려웠는지, 기침·운동 중 샜는지 등 당시 상황', '누출 정도와 패드 또는 속옷 교체 여부', '마신 음료의 종류와 대략적인 시간, 복용약 변경 여부'],
    resultTitle: '상담 후 계획 구분하기',
    results: ['생활조정, 운동, 약물, 검사 중 먼저 시행할 항목을 구분합니다.', '효과를 다시 평가할 기간과 같은 방식으로 기록할 항목을 확인합니다.', '증상이 달라지거나 새로 생겼을 때 예약을 앞당길 기준을 묻습니다.'],
  },
  'guide-urology': {
    title: '배뇨 증상을 구체적으로 설명하는 법',
    intro: '빈뇨·통증·혈뇨·옆구리 통증은 확인 과정이 서로 다를 수 있습니다. 색이나 통증만으로 원인을 단정하지 말고 시간 순서와 동반 증상을 기록하세요.',
    records: ['증상이 시작된 날짜와 갑자기 시작했는지 서서히 변했는지', '배뇨 횟수, 야간뇨, 잔뇨감, 소변 줄기 변화', '소변 색 변화가 보인 시각과 반복 여부, 가능한 경우 복용약 정보', '옆구리·아랫배·사타구니 통증의 위치와 발열·오한 동반 여부'],
    resultTitle: '검사 안내를 받을 때',
    results: ['소변검사, 혈액검사, 초음파·CT 등 안내받은 검사의 목적을 구분합니다.', '검사 전 금식이나 소변 참기 같은 준비가 필요한지 확인합니다.', '결과 확인일과 통증 또는 배뇨 곤란이 심해질 때의 연락 방법을 기록합니다.'],
  },
  'guide-cataract': {
    title: '시력 변화가 생활에 미치는 영향 기록',
    intro: '백내장 상담에서는 검사 수치와 함께 실제 생활에서 무엇이 불편한지 설명하는 것이 도움이 됩니다. 양쪽 눈의 차이와 상황별 불편을 구분해 적어보세요.',
    records: ['낮과 밤 중 언제 흐림이나 눈부심이 심한지', '운전, 독서, 계단 이용, 화면 보기 중 불편한 활동', '안경 도수를 최근 자주 바꿨는지와 마지막 검사 시점', '사용 중인 안약, 당뇨 등 기존 질환, 이전 안과 수술 이력'],
    resultTitle: '수술 상담 결과 정리',
    results: ['즉시 치료가 필요한지 추적관찰이 가능한지 의료진 설명을 기록합니다.', '인공수정체 선택 시 기대 범위와 제한, 비용 항목을 구분해 확인합니다.', '수술 전후 안약, 내원 일정, 운전과 일상 복귀 안내를 문서로 받습니다.'],
  },
  'guide-rhinitis': {
    title: '코 증상과 환경을 함께 기록하기',
    intro: '비염 증상은 계절, 장소, 수면환경, 동물 접촉 등과 함께 달라질 수 있습니다. 감기라고 단정하기보다 반복 양상을 기록해 진료 때 보여주세요.',
    records: ['코막힘·재채기·콧물·눈 가려움이 심한 시간대', '집, 직장, 야외 등 증상이 심해지는 장소와 계절', '발열, 목 통증, 얼굴 통증, 귀 불편처럼 함께 나타난 증상', '사용한 비강 스프레이·항히스타민제 이름과 사용 기간'],
    resultTitle: '관리계획을 받을 때',
    results: ['처방약과 비강 스프레이의 사용 순서와 기간을 확인합니다.', '피해야 할 환경 요인과 현실적으로 조정할 생활 항목을 구분합니다.', '증상이 조절되지 않을 때 재진 시점과 추가검사 필요 여부를 묻습니다.'],
  },
  'guide-manual-therapy': {
    title: '치료 목표를 측정 가능한 말로 바꾸기',
    intro: '통증이 줄었으면 좋겠다는 표현만으로는 경과를 비교하기 어렵습니다. 일상에서 제한된 동작과 치료 후 다시 확인할 기준을 구체적으로 정리하세요.',
    records: ['앉기, 걷기, 계단, 수면처럼 통증 때문에 제한된 활동', '통증 위치와 저림·근력저하 여부, 악화되는 자세', '기존 영상검사와 주사·약·물리치료 경험 및 반응', '치료 전후 비교할 동작과 현실적으로 가능한 방문 빈도'],
    resultTitle: '치료계획을 비교할 때',
    results: ['의사 진단, 도수치료, 운동교육의 역할을 각각 확인합니다.', '예상 횟수보다 먼저 중간 평가 시점과 중단·변경 기준을 묻습니다.', '회당 비용과 추가 치료 항목, 집에서 수행할 운동 안내를 구분해 기록합니다.'],
  },
  'guide-chuna': {
    title: '한방 통증 상담에 가져갈 기록',
    intro: '추나·침·약침 등 명칭만으로 치료를 선택하지 말고 현재 상태 평가, 기존 진료, 복용약과 치료 목표를 먼저 전달하세요.',
    records: ['통증이 시작된 계기와 위치, 움직일 때 달라지는 양상', 'MRI·X-ray 결과와 정형외과·재활의학과 진료 이력', '항응고제, 골다공증 치료제 등 현재 복용약과 수술 이력', '추나·침 등 이전 한방치료 경험과 치료 뒤 나타난 변화'],
    resultTitle: '횟수와 비용을 확인할 때',
    results: ['권한 치료별 목적과 현재 상태에 적용하는 이유를 묻습니다.', '건강보험 적용 여부, 연간 인정 횟수, 본인부담 항목을 확인합니다.', '통증 악화나 새로운 저림·근력 변화가 생길 때 재평가 기준을 기록합니다.'],
  },
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function cleanUrl(slug) {
  return `${SITE}/${slug}`;
}

function li(items) {
  return items.map((item) => `<li>${esc(item)}</li>`).join('\n');
}

function deepDiveSection(guide) {
  const detail = GUIDE_DEEP_DIVES[guide.slug];
  if (!detail) return '';
  return `<section class="guide-card-clean guide-deep-dive">
          <h2>${esc(detail.title)}</h2>
          <p>${esc(detail.intro)}</p>
          <div class="guide-deep-grid">
            <div>
              <h3>진료 전에 적어갈 내용</h3>
              <ul>${li(detail.records)}</ul>
            </div>
            <div>
              <h3>${esc(detail.resultTitle)}</h3>
              <ul>${li(detail.results)}</ul>
            </div>
          </div>
        </section>`;
}

function relatedLinks(guide) {
  return guide.related.map((href) => {
    const found = guides.find((item) => `${item.slug}.html` === href || item.slug === href.replace(/\.html$/, ''));
    const pageTitle = fs.existsSync(href) ? fs.readFileSync(href, 'utf8').match(/<title>([^<]+)<\/title>/i)?.[1] : '';
    const label = found ? found.title : (pageTitle || '관련 병원 안내').replace(/\s*-\s*병원찾기$/, '');
    return `<a href="/${esc(href.replace(/^\//, '').replace(/\.html$/, ''))}">${esc(label)}</a>`;
  }).join('\n');
}

function commonHead({ title, description, canonical, schema }) {
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} - 병원찾기</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index,follow">
  <link rel="stylesheet" href="css/style.css?v=13">
  <style>
    .guide-page-wrap { max-width: 1040px; padding-top: 48px; }
    .guide-hero-clean { padding: 34px; border: 1px solid var(--border-default); border-radius: 26px; background: radial-gradient(circle at 88% 8%, rgba(104, 134, 127, 0.18), transparent 28%), linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 88%, white 12%), color-mix(in srgb, var(--bg-body) 90%, white 10%)); box-shadow: var(--shadow-sm); }
    .guide-kicker { color: var(--primary); font-weight: 800; margin: 0 0 10px; letter-spacing: -0.02em; }
    .guide-title { font-size: clamp(2rem, 4vw, 3.2rem); margin: 0 0 16px; color: var(--text-heading); line-height: 1.22; letter-spacing: -0.04em; }
    .guide-summary { max-width: 760px; color: var(--text-body); line-height: 1.85; font-size: 1.05rem; margin: 0; }
    .guide-badges { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
    .guide-badges span, .guide-link-row a { display: inline-flex; align-items: center; min-height: 38px; padding: 8px 13px; border-radius: 999px; border: 1px solid var(--border-default); background: color-mix(in srgb, var(--bg-card) 88%, white 12%); color: var(--text-heading); font-size: .92rem; font-weight: 700; }
    .guide-content { display: grid; gap: 22px; margin-top: 28px; }
    .guide-card-clean { padding: 26px; border: 1px solid var(--border-default); border-radius: 22px; background: var(--bg-card); box-shadow: var(--shadow-xs); }
    .guide-card-clean h2 { margin: 0 0 14px; font-size: 1.35rem; color: var(--text-heading); }
    .guide-card-clean p { color: var(--text-body); line-height: 1.82; margin: 0; }
    .guide-deep-dive > p { margin-bottom: 18px; }
    .guide-deep-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .guide-deep-grid > div { padding: 18px; border: 1px solid var(--border-default); border-radius: 16px; background: var(--bg-body); }
    .guide-deep-grid h3 { margin: 0 0 12px; font-size: 1.05rem; color: var(--text-heading); }
    .guide-plan-note { margin-top: 16px !important; padding-top: 14px; border-top: 1px solid var(--border-default); color: var(--text-muted) !important; }
    .guide-content ul, .guide-content ol { list-style: disc; padding-left: 20px; margin: 0; display: grid; gap: 9px; }
    .guide-content ol { list-style: decimal; }
    .guide-content li { color: var(--text-body); line-height: 1.78; }
    .guide-grid-clean { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
    .guide-trust-meta, .guide-safety-note { padding: 18px 20px; border: 1px solid var(--border-default); border-radius: 18px; background: color-mix(in srgb, var(--bg-body) 88%, white 12%); color: var(--text-body); line-height: 1.8; }
    .guide-source-card { background: color-mix(in srgb, var(--bg-card) 92%, var(--primary-50) 8%); }
    .guide-source-intro { margin: 0 0 14px; color: var(--text-body); line-height: 1.8; }
    .guide-source-list { list-style: none !important; padding: 0 !important; margin: 0; display: grid; gap: 12px; }
    .guide-source-list li { display: grid; gap: 3px; padding: 12px 14px; border: 1px solid var(--border-default); border-radius: 12px; background: var(--bg-card); }
    .guide-source-list a { color: var(--primary); font-weight: 800; text-decoration: underline; text-underline-offset: 3px; }
    .guide-source-list span { color: var(--text-muted); font-size: .92rem; line-height: 1.6; }
    .guide-trust-meta a, .guide-safety-note a, .footer-bottom a { color: var(--primary); font-weight: 800; text-decoration: underline; text-underline-offset: 3px; }
    .guide-safety-note h2 { margin: 0 0 12px; font-size: 1.2rem; }
    .guide-link-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .guide-link-row a { text-decoration: none; border-radius: 12px; }
    @media (max-width: 768px) { .guide-page-wrap { padding-top: 34px; } .guide-hero-clean, .guide-card-clean { padding: 22px 18px; } .guide-title { font-size: 2rem; } .guide-deep-grid { grid-template-columns: 1fr; } }
  </style>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  ${ADSENSE}
</head>`;
}

function header(active = 'guide') {
  return `<header class="header" id="header" style="position:static; border-bottom:1px solid var(--border-default);">
    <div class="header-inner">
      <a href="/" class="logo"><span class="logo-icon">H</span><span class="gradient-text">병원찾기</span></a>
      <nav class="nav-links">
        <a href="/#search-results">병원목록</a>
        <a href="/guide"${active === 'guide' ? ' class="active"' : ''}>건강가이드</a>
        <a href="/about">사이트 소개</a>
        <a href="/contact">문의</a>
      </nav>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="logo"><span class="logo-icon">H</span><span class="gradient-text">병원찾기</span></div>
          <p>공공 데이터와 공개 가능한 정보를 바탕으로 병원 탐색에 필요한 참고 정보를 정리합니다.</p>
        </div>
        <div class="footer-links-group">
          <h4>바로가기</h4>
          <a href="/">홈</a>
          <a href="/guide">건강가이드</a>
          <a href="/about">사이트 소개</a>
        </div>
        <div class="footer-links-group">
          <h4>정책</h4>
          <a href="/editorial-policy">콘텐츠 편집 원칙</a>
          <a href="/data-policy">병원 데이터 출처 안내</a>
          <a href="/ad-policy">광고 및 제휴 안내</a>
          <a href="/privacy">개인정보처리방침</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 병원찾기. 모든 권리 보유.</p>
        <p>운영 문의 및 정보 정정 요청: <a href="mailto:replyleaders@naver.com">replyleaders@naver.com</a></p>
        <p>본 사이트의 정보는 참고용이며, 실제 진단과 치료 결정은 반드시 해당 병원 또는 의료진과 직접 상담해 주세요.</p>
      </div>
    </div>
  </footer>`;
}

function renderGuide(guide) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: guide.title,
    url: cleanUrl(guide.slug),
    description: guide.summary,
    dateModified: TODAY,
    publisher: { '@type': 'Organization', name: '병원찾기', url: SITE },
    about: guide.keywords.map((name) => ({ '@type': 'Thing', name })),
    citation: (OFFICIAL_SOURCES[guide.slug] || []).map((source) => source.href),
  };

  const html = `<!DOCTYPE html>
<html lang="ko">
${commonHead({ title: guide.title, description: guide.summary, canonical: cleanUrl(guide.slug), schema })}
<body class="light-mode">
  ${header()}
  <main class="container section-padding guide-page-wrap">
    <article>
      <section class="guide-hero-clean">
        <p class="guide-kicker">${esc(guide.category)} 방문 준비</p>
        <h1 class="guide-title">${esc(guide.title)}</h1>
        <p class="guide-summary">${esc(guide.summary)} 병원찾기의 건강가이드는 특정 병원을 홍보하기보다 방문 전 사용자가 스스로 질문을 정리할 수 있도록 돕는 참고 자료입니다.</p>
        <div class="guide-badges">
          <span>최종 점검일 ${TODAY}</span>
          <span>참고용 건강 정보</span>
          <span>정정 요청 replyleaders@naver.com</span>
        </div>
      </section>

      <div class="guide-content">
        <section class="guide-trust-meta" data-guide-trust-meta="true">
          <strong>정보 성격:</strong> 이 문서는 병원 방문 전 준비와 비교 기준을 돕는 참고 자료입니다. 진단, 처방, 수술 여부 판단은 반드시 의료진과 직접 상담해 주세요.
        </section>

        <section class="guide-grid-clean">
          <div class="guide-card-clean">
            <h2>이럴 때 읽어보세요</h2>
            <ul>${li(guide.visit)}</ul>
          </div>
          <div class="guide-card-clean">
            <h2>비교할 기준</h2>
            <ul>${li(guide.compare)}</ul>
          </div>
        </section>

        <section class="guide-card-clean">
          <h2>방문 전에 준비하면 좋은 것</h2>
          <ul>${li(guide.prepare)}</ul>
        </section>

        ${deepDiveSection(guide)}

        <section class="guide-card-clean">
          <h2>상담 때 물어볼 질문</h2>
          <ol>${li(guide.questions)}</ol>
        </section>

        <section class="guide-card-clean guide-visit-plan">
          <h2>방문 준비 순서</h2>
          <ol>
            <li><strong>방문 목적 정리:</strong> ${esc(guide.visit[0])}</li>
            <li><strong>자료 준비:</strong> ${esc(guide.prepare[0])}</li>
            <li><strong>예약 전 확인:</strong> ${esc(guide.compare[0])}을 포함해 진료 가능 여부, 접수 마감, 예상 비용을 전화로 확인하세요.</li>
            <li><strong>상담 기록:</strong> ${esc(guide.questions[0])}을 메모하고, 답변과 다음 방문 시점을 확인하세요.</li>
          </ol>
          <p class="guide-plan-note">검색 결과에 표시되는 주소·전화번호·운영 정보는 변동될 수 있습니다. 예약 전 병원에 직접 확인하고, 본인에게 필요한 검사와 치료 여부는 의료진의 설명을 기준으로 판단하세요.</p>
        </section>

        <section class="guide-safety-note" data-guide-checklist="true">
          <h2>안전 안내</h2>
          <ul>
            <li>진료 가능 시간, 접수 마감, 비용, 검사 가능 여부는 병원 사정에 따라 달라질 수 있으므로 방문 전 직접 확인해 주세요.</li>
            <li>증상 악화, 출혈, 호흡 곤란, 급성 통증, 의식 저하 등 응급 상황은 온라인 검색보다 119 또는 응급실 안내가 우선입니다.</li>
            <li>콘텐츠 오류나 보완 의견은 <a href="mailto:replyleaders@naver.com">replyleaders@naver.com</a>으로 알려주세요.</li>
          </ul>
        </section>

        <section class="guide-card-clean guide-source-card">
          <h2>공식 참고 자료</h2>
          <p class="guide-source-intro">아래 링크는 이 글의 내용을 대신해 진단하거나 치료를 결정하는 자료가 아닙니다. 최신 내용과 개인에게 적용되는 범위는 의료진 또는 해당 기관에 직접 확인하세요.</p>
          <ul class="guide-source-list">
            ${(OFFICIAL_SOURCES[guide.slug] || []).map((source) => `<li><a href="${esc(source.href)}" rel="external noopener" target="_blank">${esc(source.title)}</a><span>${esc(source.note)}</span></li>`).join('')}
          </ul>
        </section>

        <section class="guide-card-clean">
          <h2>관련해서 함께 볼 페이지</h2>
          <div class="guide-link-row">
            ${relatedLinks(guide)}
            <a href="/guide">전체 가이드 보기</a>
            <a href="/#search-results">병원 검색하기</a>
          </div>
        </section>
      </div>
    </article>
  </main>
  ${footer()}
  <script src="js/guide-page.js?v=6"></script>
</body>
</html>`;
  fs.writeFileSync(`${guide.slug}.html`, html.replace(/[ \t]+$/gm, ''), 'utf8');
}

function renderIndex() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '병원찾기 건강가이드 모음',
    url: `${SITE}/guide`,
    description: '병원 방문 전에 확인하면 좋은 건강가이드와 진료과별 체크리스트를 모은 페이지입니다.',
    dateModified: TODAY,
    hasPart: [SEARCH_GUIDE, ...guides].map((g) => ({ '@type': 'WebPage', name: g.title, url: cleanUrl(g.slug) }))
  };
  const cards = [SEARCH_GUIDE, ...guides].map((g) => `<a class="guide-card-link" href="/${g.slug}">
      <div class="guide-card-body">
        <span class="guide-category">${esc(g.category)}</span>
        <h2>${esc(g.title)}</h2>
        <p>${esc(g.summary)}</p>
      </div>
    </a>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="ko">
${commonHead({ title: '건강가이드 모음', description: '임플란트, 내시경, 우울·불안 상담, 비염, 당뇨, 라식·라섹 등 병원 방문 전에 확인하면 좋은 건강가이드 모음입니다.', canonical: `${SITE}/guide`, schema })}
<body class="light-mode">
  ${header()}
  <main class="container section-padding guide-page-wrap">
    <section class="guide-hero-clean">
      <p class="guide-kicker">건강가이드 모음</p>
      <h1 class="guide-title">병원 방문 전에 먼저 읽어보면 좋은 체크리스트</h1>
      <p class="guide-summary">진료과와 증상별로 방문 전 준비할 내용, 상담 때 물어볼 질문, 병원 비교 기준을 정리했습니다. 모든 정보는 참고용이며 실제 진단과 치료 결정은 의료진 상담이 우선입니다.</p>
      <div class="guide-badges">
        <span>목록 수정일 ${TODAY}</span>
        <span>${guides.length + 1}개 가이드</span>
        <span>광고 공간 없음</span>
      </div>
    </section>
    <section class="guide-content">
      <section class="guide-grid-clean">${cards}</section>
      <section class="guide-safety-note" data-guide-checklist="true">
        <h2>이 가이드를 볼 때 기억할 점</h2>
        <ul>
          <li>병원찾기는 특정 병원의 진료 결과나 만족도를 보장하지 않습니다.</li>
          <li>접수 시간, 진료 가능 여부, 검사 비용은 반드시 방문 전 병원에 직접 확인해 주세요.</li>
          <li>응급 증상은 검색보다 119, 응급실, 해당 병원 안내가 우선입니다.</li>
        </ul>
      </section>
      <section class="guide-card-clean guide-source-card">
        <h2>공식 참고 자료</h2>
        <p class="guide-source-intro">병원찾기의 안내를 대신해 진단하거나 치료를 결정하는 자료가 아닙니다. 최신 내용과 개인에게 적용되는 범위는 의료진 또는 해당 기관에 직접 확인하세요.</p>
        <ul class="guide-source-list"><li><a href="https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000" rel="external noopener" target="_blank">건강보험심사평가원 건강지도</a><span>의료기관 검색과 기관 정보 확인 경로</span></li></ul>
      </section>
    </section>
  </main>
  ${footer()}
  <script src="js/guide-page.js?v=6"></script>
</body>
</html>`;
  fs.writeFileSync('guide.html', html.replace(/[ \t]+$/gm, ''), 'utf8');
}

guides.forEach(renderGuide);
renderIndex();
console.log(`Generated ${guides.length + 1} guide pages`);
