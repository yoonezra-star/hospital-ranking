const fs = require('fs');

const SITE = 'https://hospital-ranking.kr';
const TODAY = '2026-07-01';
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

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function cleanUrl(slug) {
  return `${SITE}/${slug}`;
}

function li(items) {
  return items.map((item) => `<li>${esc(item)}</li>`).join('\n');
}

function relatedLinks(guide) {
  return guide.related.map((href) => {
    const found = guides.find((item) => `${item.slug}.html` === href || item.slug === href.replace(/\.html$/, ''));
    const label = found ? found.title : href.replace(/\.html$/, '').replace(/-/g, ' ');
    return `<a href="${esc(href)}">${esc(label)}</a>`;
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
  <link rel="stylesheet" href="css/style.css?v=12">
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
    .guide-content ul, .guide-content ol { list-style: disc; padding-left: 20px; margin: 0; display: grid; gap: 9px; }
    .guide-content ol { list-style: decimal; }
    .guide-content li { color: var(--text-body); line-height: 1.78; }
    .guide-grid-clean { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
    .guide-trust-meta, .guide-safety-note { padding: 18px 20px; border: 1px solid var(--border-default); border-radius: 18px; background: color-mix(in srgb, var(--bg-body) 88%, white 12%); color: var(--text-body); line-height: 1.8; }
    .guide-trust-meta a, .guide-safety-note a, .footer-bottom a { color: var(--primary); font-weight: 800; text-decoration: underline; text-underline-offset: 3px; }
    .guide-safety-note h2 { margin: 0 0 12px; font-size: 1.2rem; }
    .guide-link-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .guide-link-row a { text-decoration: none; border-radius: 12px; }
    @media (max-width: 768px) { .guide-page-wrap { padding-top: 34px; } .guide-hero-clean, .guide-card-clean { padding: 22px 18px; } .guide-title { font-size: 2rem; } }
  </style>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  ${ADSENSE}
</head>`;
}

function header(active = 'guide') {
  return `<header class="header" id="header" style="position:static; border-bottom:1px solid var(--border-default);">
    <div class="header-inner">
      <a href="index.html" class="logo"><span class="logo-icon">H</span><span class="gradient-text">병원찾기</span></a>
      <nav class="nav-links">
        <a href="index.html#search-results">병원목록</a>
        <a href="guide.html"${active === 'guide' ? ' class="active"' : ''}>건강가이드</a>
        <a href="about.html">사이트 소개</a>
        <a href="contact.html">문의</a>
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
          <a href="index.html">홈</a>
          <a href="guide.html">건강가이드</a>
          <a href="about.html">사이트 소개</a>
        </div>
        <div class="footer-links-group">
          <h4>정책</h4>
          <a href="editorial-policy.html">콘텐츠 편집 원칙</a>
          <a href="ad-policy.html">광고 및 제휴 안내</a>
          <a href="privacy.html">개인정보처리방침</a>
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
    about: guide.keywords.map((name) => ({ '@type': 'Thing', name }))
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

        <section class="guide-card-clean">
          <h2>상담 때 물어볼 질문</h2>
          <ol>${li(guide.questions)}</ol>
        </section>

        <section class="guide-safety-note" data-guide-checklist="true">
          <h2>안전 안내</h2>
          <ul>
            <li>진료 가능 시간, 접수 마감, 비용, 검사 가능 여부는 병원 사정에 따라 달라질 수 있으므로 방문 전 직접 확인해 주세요.</li>
            <li>증상 악화, 출혈, 호흡 곤란, 급성 통증, 의식 저하 등 응급 상황은 온라인 검색보다 119 또는 응급실 안내가 우선입니다.</li>
            <li>콘텐츠 오류나 보완 의견은 <a href="mailto:replyleaders@naver.com">replyleaders@naver.com</a>으로 알려주세요.</li>
          </ul>
        </section>

        <section class="guide-card-clean">
          <h2>관련해서 함께 볼 페이지</h2>
          <div class="guide-link-row">
            ${relatedLinks(guide)}
            <a href="guide.html">전체 가이드 보기</a>
            <a href="index.html#search-results">병원 검색하기</a>
          </div>
        </section>
      </div>
    </article>
  </main>
  ${footer()}
  <script src="js/guide-page.js?v=5"></script>
</body>
</html>`;
  fs.writeFileSync(`${guide.slug}.html`, html, 'utf8');
}

function renderIndex() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '병원찾기 건강가이드 모음',
    url: `${SITE}/guide`,
    description: '병원 방문 전에 확인하면 좋은 건강가이드와 진료과별 체크리스트를 모은 페이지입니다.',
    dateModified: TODAY,
    hasPart: guides.map((g) => ({ '@type': 'MedicalWebPage', name: g.title, url: cleanUrl(g.slug) }))
  };
  const cards = guides.map((g) => `<a class="guide-card-link" href="${g.slug}.html">
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
        <span>최종 점검일 ${TODAY}</span>
        <span>16개 가이드</span>
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
    </section>
  </main>
  ${footer()}
  <script src="js/guide-page.js?v=5"></script>
</body>
</html>`;
  fs.writeFileSync('guide.html', html, 'utf8');
}

guides.forEach(renderGuide);
renderIndex();
console.log(`Generated ${guides.length + 1} guide pages`);
