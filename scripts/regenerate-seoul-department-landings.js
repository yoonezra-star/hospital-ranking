const fs = require('fs');

const SITE = 'https://hospital-ranking.kr';
const UPDATED = '2026-07-01';
const ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1441018945572157" crossorigin="anonymous"></script>';

const pages = [
  {
    file: 'seoul-internal.html', slug: 'seoul-internal', title: '서울 내과 병원찾기', badge: '서울 내과', keyword: '서울 내과', guide: ['guide-diabetes.html', '만성질환 진료 가이드'],
    description: '서울 내과를 찾을 때 건강검진 상담, 소화기 증상, 혈압·혈당 관리, 야간·토요일 진료 기준을 함께 확인하는 방법입니다.',
    hero: '서울 내과는 감기나 소화기 증상뿐 아니라 건강검진 결과 상담, 고혈압·당뇨 추적, 예방접종, 만성질환 관리까지 방문 목적이 넓습니다. 증상과 검사 목적을 먼저 나누면 병원 목록을 훨씬 빠르게 좁힐 수 있습니다.',
    sections: [
      ['방문 목적 먼저 나누기', ['갑작스러운 복통, 기침, 발열처럼 단기 증상인지 확인합니다.', '건강검진 결과 상담, 혈압·혈당 추적처럼 정기 관리 목적이면 이전 검사지를 준비합니다.', '위내시경, 대장내시경, 초음파 등 검사가 필요한 경우 해당 장비 가능 여부를 확인합니다.']],
      ['서울 생활권에서 볼 기준', ['직장 근처는 평일 점심·퇴근 후 접수 가능 시간이 중요합니다.', '집 근처는 반복 방문과 약 처방 연속성이 장점입니다.', '대형병원 연계가 필요한 경우 의뢰서와 검사 결과 전달 절차를 확인합니다.']],
      ['상담 전에 준비할 것', ['최근 건강검진 결과지와 복용약 목록을 가져갑니다.', '증상 시작일, 식사와의 관련성, 열이나 체중 변화 여부를 적어둡니다.', '만성질환은 집에서 측정한 혈압·혈당 기록이 있으면 도움이 됩니다.']]
    ],
    chips: ['서울 내과 야간', '강남 내과 검진', '송파 내과 토요일', '서울 당뇨 내과'],
    faq: [['내과 방문 전 검사지를 꼭 가져가야 하나요?', '건강검진 결과 상담이나 만성질환 관리는 이전 수치 비교가 중요하므로 가능하면 가져가는 것이 좋습니다.'], ['감기 증상도 내과에서 볼 수 있나요?', '대부분 가능하지만 소아, 귀·코·목 증상이 중심이면 소아청소년과나 이비인후과가 더 적합할 수 있습니다.'], ['야간 내과는 검사도 가능한가요?', '진료는 가능해도 검사실 운영이 끝난 경우가 있으므로 원하는 검사명을 말하고 전화 확인하는 것이 안전합니다.']],
    related: ['guide-diabetes.html','endoscopy-clinic.html','daejeon-internal.html','night-clinic.html']
  },
  {
    file: 'seoul-orthopedic.html', slug: 'seoul-orthopedic', title: '서울 정형외과 병원찾기', badge: '서울 정형외과', keyword: '서울 정형외과', guide: ['guide-ortho.html', '정형외과 방문 가이드'],
    description: '서울 정형외과를 찾을 때 허리, 무릎, 어깨 통증과 영상검사, 물리치료, 도수치료 가능 여부를 확인하는 기준입니다.',
    hero: '정형외과는 통증 부위와 원인에 따라 필요한 검사와 치료가 달라집니다. 서울에서 정형외과를 찾을 때는 가까운 위치만 보지 말고 영상검사, 물리치료, 도수치료, 재활 연계가 필요한지 함께 확인하는 것이 좋습니다.',
    sections: [
      ['통증 부위별로 정리하기', ['허리·목 통증은 저림, 감각저하, 다리 당김 여부를 함께 봅니다.', '어깨·무릎 통증은 특정 동작에서 악화되는지 확인합니다.', '넘어짐이나 외상 후 통증은 골절 가능성을 배제해야 하므로 빠른 진료가 필요할 수 있습니다.']],
      ['비교할 병원 기준', ['X-ray, 초음파, MRI 연계 등 필요한 검사가 가능한지 확인합니다.', '주사치료, 물리치료, 도수치료가 각각 어떤 기준으로 권장되는지 설명을 듣습니다.', '수술이 필요한 경우 상급병원 의뢰 기준을 안내하는지 봅니다.']],
      ['방문 전 준비', ['기존 영상검사 자료가 있으면 가져갑니다.', '통증 점수, 악화 동작, 완화 자세를 메모합니다.', '운동 중 부상이라면 발생 상황과 이후 변화 과정을 정리합니다.']]
    ],
    chips: ['서울 정형외과 도수치료', '허리 통증 병원', '무릎 통증 정형외과', '토요일 정형외과'],
    faq: [['정형외과는 MRI가 꼭 필요한가요?', '모든 통증에 MRI가 필요한 것은 아닙니다. 진찰과 기본 촬영 후 필요성을 판단하는 경우가 많습니다.'], ['도수치료는 정형외과에서 바로 받을 수 있나요?', '병원마다 다르며 의사 진단 후 치료 계획을 세우는지 확인하는 것이 좋습니다.'], ['통증이 심하면 응급실을 가야 하나요?', '외상 후 변형, 걷기 어려움, 마비·감각저하, 극심한 통증은 응급 진료가 필요할 수 있습니다.']],
    related: ['guide-ortho.html','manual-therapy-clinic.html','seoul-rehab.html','seoul-pain.html']
  },
  {
    file: 'seoul-dermatology.html', slug: 'seoul-dermatology', title: '서울 피부과 병원찾기', badge: '서울 피부과', keyword: '서울 피부과', guide: ['guide-acne.html', '피부과 상담 가이드'],
    description: '서울 피부과를 찾을 때 여드름, 흉터, 색소, 피부염, 레이저 상담 목적별로 비교할 기준을 정리했습니다.',
    hero: '피부과는 질환 진료와 미용 시술 목적이 섞이기 쉽습니다. 서울 피부과를 찾을 때는 여드름·피부염 같은 치료 목적과 색소·흉터·레이저 상담 목적을 먼저 나누고, 약 처방과 시술 설명을 구분해서 보는 것이 좋습니다.',
    sections: [
      ['진료 목적 구분', ['여드름, 아토피, 두드러기, 무좀처럼 질환 진료가 필요한지 확인합니다.', '흉터, 색소, 모공, 리프팅처럼 시술 상담이 중심인지 구분합니다.', '급성 알레르기나 심한 부종, 호흡곤란이 있으면 응급 안내가 우선입니다.']],
      ['상담에서 볼 기준', ['피부 상태 평가 후 치료 단계와 예상 기간을 설명하는지 봅니다.', '약물치료와 시술의 장단점, 회복 기간을 구분해 안내하는지 확인합니다.', '비용과 반복 시술 간격, 부작용 가능성을 명확히 듣습니다.']],
      ['준비할 내용', ['사용 중인 화장품, 연고, 복용약을 적어둡니다.', '증상이 심해지는 시기와 최근 사진이 있으면 도움이 됩니다.', '레이저 상담은 중요한 일정 전 회복 기간을 함께 고려합니다.']]
    ],
    chips: ['서울 피부과 야간', '강남 피부과 여드름', '피부과 흉터 상담', '서울 피부과 토요일'],
    faq: [['피부과에서 여드름과 흉터 상담을 같이 받을 수 있나요?', '가능한 경우가 많지만 염증 조절과 흉터 치료는 순서가 다를 수 있어 상담 시 치료 단계를 확인하세요.'], ['레이저 시술 전 무엇을 물어봐야 하나요?', '회복 기간, 부작용, 반복 횟수, 시술 후 자외선 관리와 비용 범위를 확인하는 것이 좋습니다.'], ['야간 피부과는 시술도 가능한가요?', '진료는 가능해도 시술 가능 시간은 별도일 수 있어 원하는 시술명을 말하고 확인해야 합니다.']],
    related: ['guide-acne.html','night-dermatology.html','seoul-dental.html','guide-womens-checkup.html']
  },
  {
    file: 'seoul-ent.html', slug: 'seoul-ent', title: '서울 이비인후과 병원찾기', badge: '서울 이비인후과', keyword: '서울 이비인후과', guide: ['guide-rhinitis.html', '비염 진료 가이드'],
    description: '서울 이비인후과를 찾을 때 비염, 코막힘, 기침, 목 통증, 귀 증상과 검사 가능 여부를 확인하는 기준입니다.',
    hero: '이비인후과는 코, 목, 귀 증상이 반복될 때 빠르게 찾게 되는 진료과입니다. 서울에서 이비인후과를 찾을 때는 감기처럼 보이는 증상인지, 알레르기·비염처럼 반복되는 증상인지, 귀 통증이나 어지럼처럼 검사 확인이 필요한지 구분하면 좋습니다.',
    sections: [
      ['증상별로 나누기', ['코막힘, 재채기, 후비루가 반복되면 비염이나 알레르기 상담을 고려합니다.', '목 통증, 쉰 목소리, 기침이 오래가면 지속 기간과 발열 여부를 정리합니다.', '귀 통증, 먹먹함, 어지럼은 청력검사나 고막 확인 가능 여부를 봅니다.']],
      ['병원 비교 기준', ['비강 내시경, 청력검사 등 필요한 확인이 가능한지 봅니다.', '소아 진료가 필요한 경우 아이 진료 경험과 대기 동선을 확인합니다.', '야간·토요일 진료는 접수 마감 시간이 빠를 수 있어 전화 확인이 필요합니다.']],
      ['방문 전 준비', ['증상이 시작된 날과 악화되는 시간대를 메모합니다.', '복용한 감기약, 항히스타민제, 스프레이 사용 경험을 정리합니다.', '알레르기 병력과 계절성 여부를 함께 알려줍니다.']]
    ],
    chips: ['서울 이비인후과 비염', '서울 이비인후과 야간', '아이 코막힘 병원', '귀 통증 이비인후과'],
    faq: [['감기와 비염은 어떻게 구분하나요?', '발열·몸살이 동반되는 감기는 급성 감염 가능성이 있고, 계절·환경에 따라 반복되면 비염 상담이 필요할 수 있습니다.'], ['아이도 이비인후과에서 볼 수 있나요?', '가능한 병원이 많지만 연령과 증상에 따라 소아청소년과가 더 적합할 수 있어 확인이 필요합니다.'], ['코 내시경은 모든 병원에서 하나요?', '병원마다 장비와 운영 방식이 달라 방문 전 확인하는 것이 좋습니다.']],
    related: ['guide-rhinitis.html','daegu-ent.html','daejeon-ent.html','sunday-pediatric.html']
  },
  {
    file: 'seoul-pediatric.html', slug: 'seoul-pediatric', title: '서울 소아청소년과 병원찾기', badge: '서울 소아청소년과', keyword: '서울 소아과', guide: ['guide-rhinitis.html', '소아 증상 정리 가이드'],
    description: '서울 소아청소년과를 찾을 때 발열, 기침, 비염, 예방접종, 주말 진료 여부를 보호자 관점에서 확인하는 기준입니다.',
    hero: '아이 진료는 증상 자체보다 보호자가 기록해 온 정보가 진료 흐름을 크게 좌우합니다. 서울 소아청소년과를 찾을 때는 발열 기간, 복용약, 식사·수면 변화, 예방접종 일정과 주말 진료 가능 여부를 함께 확인하는 것이 좋습니다.',
    sections: [
      ['보호자가 먼저 기록할 것', ['체온 변화와 해열제 복용 시간을 기록합니다.', '기침, 콧물, 구토, 설사, 발진 등 동반 증상을 함께 적습니다.', '먹는 양, 소변량, 처짐 정도처럼 컨디션 변화를 확인합니다.']],
      ['서울에서 병원 고를 때', ['집 근처 반복 방문이 가능한지, 주말이나 야간 접수가 가능한지 봅니다.', '예방접종과 일반 진료 동선이 분리되어 있는지 확인합니다.', '영유아 진료가 필요한 경우 월령 제한이나 예약제를 확인합니다.']],
      ['응급 신호', ['호흡이 가쁘거나 입술이 파래지는 경우 즉시 응급 안내가 우선입니다.', '의식이 처지거나 탈수 의심, 반복 경련이 있으면 온라인 검색보다 응급 진료가 필요합니다.', '3개월 미만 영아의 발열은 빠른 의료진 상담이 필요합니다.']]
    ],
    chips: ['서울 소아과 일요일', '서울 소아과 야간', '아이 발열 병원', '예방접종 병원'],
    faq: [['소아과 방문 전 체온 기록이 꼭 필요한가요?', '해열제 반응과 발열 기간 판단에 도움이 되므로 가능하면 시간대별로 적어두는 것이 좋습니다.'], ['일요일 소아과는 바로 접수되나요?', '휴일은 대기가 길고 접수 마감이 빠를 수 있어 운영 여부를 먼저 확인해야 합니다.'], ['예방접종과 감기 진료를 같은 날 받을 수 있나요?', '아이 상태와 접종 종류에 따라 달라 의료진 상담이 필요합니다.']],
    related: ['sunday-pediatric.html','vaccination-clinic.html','incheon-pediatric.html','guide-rhinitis.html']
  },
  {
    file: 'seoul-ophthalmology.html', slug: 'seoul-ophthalmology', title: '서울 안과 병원찾기', badge: '서울 안과', keyword: '서울 안과', guide: ['guide-lasik.html', '시력교정 가이드'],
    description: '서울 안과를 찾을 때 시력검사, 안구건조, 백내장, 라식·라섹 상담 목적별로 비교할 기준을 정리했습니다.',
    hero: '안과는 단순 시력검사부터 백내장, 안구건조, 망막 검사, 시력교정술 상담까지 목적이 다양합니다. 서울 안과를 찾을 때는 검사 목적과 회복 일정, 장비 가능 여부, 수술 상담 필요성을 먼저 구분하세요.',
    sections: [
      ['목적별로 찾기', ['시력저하와 안구건조는 기본 검사와 생활습관 상담이 중요합니다.', '백내장 상담은 시야 흐림, 눈부심, 운전 불편 정도를 함께 봅니다.', '라식·라섹 상담은 렌즈 착용 중단 기간과 정밀검사 일정을 확인해야 합니다.']],
      ['병원 비교 기준', ['정밀검사 항목과 결과 설명이 충분한지 봅니다.', '수술 상담은 장점뿐 아니라 부작용과 회복 기간을 함께 설명하는지 확인합니다.', '검사 후 운전 가능 여부와 동행 필요성을 확인합니다.']],
      ['방문 전 준비', ['렌즈 착용자는 검사 전 중단 기간을 병원에 확인합니다.', '기존 안과 진료 기록, 안약 사용 내역, 전신질환 정보를 정리합니다.', '컴퓨터 사용, 야간 운전 등 생활에서 불편한 상황을 구체적으로 적습니다.']]
    ],
    chips: ['서울 안과 백내장', '강남 라식 안과', '서울 안구건조 안과', '서울 안과 토요일'],
    faq: [['라식 상담은 당일 바로 가능한가요?', '정밀검사 전 렌즈 중단 기간이 필요할 수 있어 예약 전에 착용 렌즈 종류를 말하고 확인해야 합니다.'], ['백내장 수술은 언제 결정하나요?', '시력, 생활 불편, 동반 안질환 등을 함께 보고 의료진과 결정해야 합니다.'], ['안과 검사 후 운전해도 되나요?', '산동검사 등 일부 검사는 당일 운전이 어려울 수 있어 검사 내용을 확인하세요.']],
    related: ['guide-lasik.html','guide-cataract.html','gangnam-lasik.html','cataract-clinic.html']
  },
  {
    file: 'seoul-urology.html', slug: 'seoul-urology', title: '서울 비뇨의학과 병원찾기', badge: '서울 비뇨의학과', keyword: '서울 비뇨의학과', guide: ['guide-urology.html', '비뇨의학과 방문 가이드'],
    description: '서울 비뇨의학과를 찾을 때 배뇨 불편, 혈뇨, 요로결석, 전립선, 요실금 상담 기준을 정리했습니다.',
    hero: '비뇨의학과 증상은 말하기 조심스러워 미루기 쉽지만, 혈뇨나 옆구리 통증처럼 빠른 확인이 필요한 경우도 있습니다. 서울 비뇨의학과를 찾을 때는 증상 위치와 시작 시점, 소변 변화, 발열 여부를 먼저 정리하세요.',
    sections: [
      ['증상별 확인', ['소변 볼 때 통증, 빈뇨, 잔뇨감은 시작 시점과 빈도를 적습니다.', '혈뇨나 옆구리 통증은 요로결석, 감염 등 확인이 필요할 수 있습니다.', '요실금이나 야간뇨는 생활에 주는 영향을 함께 기록합니다.']],
      ['비교할 기준', ['소변검사, 초음파, 영상검사 가능 여부를 확인합니다.', '남성 전립선 상담, 여성 배뇨장애 상담 가능 범위를 봅니다.', '통증이 심할 때 당일 검사나 응급 연계가 가능한지 확인합니다.']],
      ['방문 전 준비', ['증상 시작일, 통증 위치, 혈뇨 여부를 메모합니다.', '복용 중인 약, 항생제 사용 이력, 이전 결석 이력을 정리합니다.', '발열, 오한, 구토가 동반되면 빠른 진료가 필요할 수 있습니다.']]
    ],
    chips: ['서울 비뇨의학과', '요로결석 병원', '혈뇨 검사 병원', '서울 요실금 상담'],
    faq: [['혈뇨가 있으면 바로 병원에 가야 하나요?', '일시적일 수도 있지만 반복되거나 통증·발열이 동반되면 빠른 진료가 필요합니다.'], ['비뇨의학과에서 여성 요실금도 상담하나요?', '가능한 병원이 많지만 진료 범위가 다를 수 있어 예약 전 확인하는 것이 좋습니다.'], ['요로결석은 어떤 검사가 필요한가요?', '증상에 따라 소변검사, 초음파, CT 등 검사가 필요할 수 있으며 병원별 가능 장비가 다릅니다.']],
    related: ['guide-urology.html','urinary-stone-clinic.html','guide-incontinence.html','night-clinic.html']
  },
  {
    file: 'seoul-psychiatry.html', slug: 'seoul-psychiatry', title: '서울 정신건강의학과 병원찾기', badge: '서울 정신건강의학과', keyword: '서울 정신건강의학과', guide: ['guide-depression.html', '상담 준비 가이드'],
    description: '서울 정신건강의학과를 찾을 때 우울, 불안, 수면, 공황, 초진 상담 준비와 예약 기준을 정리했습니다.',
    hero: '정신건강의학과 초진은 증상을 “잘 말해야 한다”는 부담이 크지만, 완벽하게 정리할 필요는 없습니다. 서울에서 병원을 찾을 때는 예약 가능 시간, 초진 상담 길이, 약물치료와 상담치료 안내, 재진 주기를 확인하면 시작이 쉬워집니다.',
    sections: [
      ['상담 전 정리할 내용', ['우울감, 불안, 공황, 수면 문제의 시작 시점과 지속 기간을 적습니다.', '식욕, 체중, 집중력, 업무·학업 영향 같은 일상 변화를 함께 봅니다.', '이전 상담 경험, 복용약, 부작용 경험을 정리합니다.']],
      ['병원 비교 기준', ['초진 예약 가능일과 상담 예상 시간을 확인합니다.', '약물치료, 상담치료, 심리검사 가능 범위를 구분해 봅니다.', '재진 주기, 응급 상황 시 연락 방법, 진료 기록 안내를 확인합니다.']],
      ['급한 상황', ['자해 위험, 극심한 불안, 현실 판단 어려움이 있으면 즉시 응급 도움을 요청해야 합니다.', '약을 임의로 중단하지 말고 부작용이 의심되면 의료진과 상담합니다.', '가족이나 보호자 동행이 도움이 되는 경우 미리 동의와 일정을 맞춥니다.']]
    ],
    chips: ['서울 정신건강의학과', '우울 불안 상담', '수면 상담 병원', '공황 상담 병원'],
    faq: [['초진 때 무슨 말을 해야 하나요?', '증상 시작 시점, 가장 힘든 상황, 수면·식욕 변화, 이전 치료 경험 정도만 적어가도 충분히 도움이 됩니다.'], ['상담만 받고 약은 안 먹을 수 있나요?', '치료 방식은 상태에 따라 다르며, 약물치료 필요성은 의료진과 상의해 결정합니다.'], ['정신건강 진료 기록이 걱정됩니다.', '진료 기록과 개인정보는 관련 법에 따라 보호되며, 우려되는 부분은 초진 때 직접 물어보는 것이 좋습니다.']],
    related: ['guide-depression.html','contact.html','about.html','night-clinic.html']
  }
];

function esc(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function list(items) { return items.map(item => `<li>${esc(item)}</li>`).join('\n'); }
function labelFor(href) {
  const labels = {
    'guide-diabetes.html':'만성질환 가이드','endoscopy-clinic.html':'내시경 병원 찾기','daejeon-internal.html':'대전 내과','night-clinic.html':'야간 진료',
    'guide-ortho.html':'정형외과 가이드','manual-therapy-clinic.html':'도수치료 병원','seoul-rehab.html':'서울 재활의학과','seoul-pain.html':'서울 통증의학과',
    'guide-acne.html':'피부과 상담 가이드','night-dermatology.html':'야간 피부과','seoul-dental.html':'서울 치과','guide-womens-checkup.html':'여성검진 가이드',
    'guide-rhinitis.html':'비염 가이드','daegu-ent.html':'대구 이비인후과','daejeon-ent.html':'대전 이비인후과','sunday-pediatric.html':'일요일 소아과',
    'vaccination-clinic.html':'예방접종 병원','incheon-pediatric.html':'인천 소아과',
    'guide-lasik.html':'라식·라섹 가이드','guide-cataract.html':'백내장 가이드','gangnam-lasik.html':'강남 라식 안과','cataract-clinic.html':'백내장 병원',
    'guide-urology.html':'비뇨의학과 가이드','urinary-stone-clinic.html':'요로결석 병원','guide-incontinence.html':'요실금 가이드',
    'guide-depression.html':'우울·불안 상담 가이드','contact.html':'문의하기','about.html':'운영 기준'
  };
  return labels[href] || href.replace(/\.html$/, '').replace(/-/g, ' ');
}
function schemas(page) {
  return [
    {'@context':'https://schema.org','@type':'CollectionPage',name:page.title,url:`${SITE}/${page.slug}`,description:page.description,dateModified:UPDATED,publisher:{'@type':'Organization',name:'병원찾기',url:SITE}},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'병원찾기',item:`${SITE}/`},{'@type':'ListItem',position:2,name:page.title,item:`${SITE}/${page.slug}`}]},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:page.faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ].map(s => `  <script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
}
function render(page) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(page.title)} - 병원찾기</title>
  <meta name="description" content="${esc(page.description)}">
  <link rel="canonical" href="${SITE}/${page.slug}">
  <meta name="robots" content="index,follow">
  <link rel="stylesheet" href="css/style.css?v=12">
  <style>
    .intent-page{max-width:1120px;padding-top:56px}.intent-hero{padding:38px;border:1px solid var(--border-default);border-radius:28px;background:radial-gradient(circle at 88% 10%,rgba(104,134,127,.18),transparent 30%),linear-gradient(135deg,color-mix(in srgb,var(--bg-card) 88%,white 12%),color-mix(in srgb,var(--bg-body) 92%,white 8%));box-shadow:var(--shadow-sm)}.intent-badge{display:inline-flex;padding:8px 14px;border-radius:999px;background:color-mix(in srgb,var(--primary-50) 72%,white 28%);color:var(--primary);font-weight:800}.intent-hero h1{margin:16px 0 14px;font-size:clamp(2.1rem,4vw,3.3rem);letter-spacing:-.04em}.intent-hero p{max-width:820px;color:var(--text-body);line-height:1.85;font-size:1.06rem}.intent-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.intent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:26px}.intent-card,.intent-note,.intent-faq{border:1px solid var(--border-default);border-radius:22px;background:var(--bg-card);box-shadow:var(--shadow-xs);padding:24px}.intent-card h2,.intent-note h2,.intent-faq h2{margin:0 0 13px;font-size:1.24rem}.intent-card ul,.intent-note ul{list-style:disc;margin:0;padding-left:20px;display:grid;gap:9px}.intent-card li,.intent-note li,.intent-faq p{color:var(--text-body);line-height:1.78}.intent-note{margin-top:24px}.intent-chip-row,.intent-link-row{display:flex;flex-wrap:wrap;gap:10px}.intent-chip-row span,.intent-link-row a{display:inline-flex;align-items:center;min-height:40px;padding:8px 13px;border-radius:999px;border:1px solid var(--border-default);background:var(--bg-body);color:var(--text-heading);font-weight:700;text-decoration:none}.intent-faq details{border-top:1px solid var(--border-light);padding:14px 0}.intent-faq details:first-of-type{border-top:0}.intent-faq summary{cursor:pointer;color:var(--text-heading);font-weight:800;line-height:1.55}.intent-faq p{margin:10px 0 0}@media(max-width:768px){.intent-page{padding-top:40px}.intent-hero,.intent-card,.intent-note,.intent-faq{padding:22px 18px}}
  </style>
${schemas(page)}
  ${ADSENSE}
</head>
<body class="light-mode">
  <header class="header" id="header" style="position:static; border-bottom:1px solid var(--border-default);">
    <div class="header-inner">
      <a href="index.html" class="logo"><span class="logo-icon">H</span><span class="gradient-text">병원찾기</span></a>
      <nav class="nav-links"><a href="index.html#search-results">병원목록</a><a href="guide.html">건강가이드</a><a href="about.html">사이트 소개</a><a href="contact.html">문의</a></nav>
    </div>
  </header>
  <main class="container intent-page">
    <section class="intent-hero"><span class="intent-badge">${esc(page.badge)}</span><h1>${esc(page.title)}</h1><p>${esc(page.hero)}</p><div class="intent-actions"><a href="index.html?keyword=${encodeURIComponent(page.keyword)}#search-results" class="btn btn-primary">${esc(page.keyword)} 검색</a><a href="${esc(page.guide[0])}" class="btn btn-outline">${esc(page.guide[1])}</a></div></section>
    <section class="intent-grid">${page.sections.map(([title,items])=>`<article class="intent-card"><h2>${esc(title)}</h2><ul>${list(items)}</ul></article>`).join('\n')}</section>
    <section class="intent-note"><h2>검색 예시</h2><div class="intent-chip-row">${page.chips.map(c=>`<span>${esc(c)}</span>`).join('\n')}</div></section>
    <section class="intent-faq intent-note"><h2>자주 묻는 질문</h2>${page.faq.map(([q,a],i)=>`<details${i===0?' open':''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}</section>
    <section class="intent-note"><h2>함께 보면 좋은 페이지</h2><div class="intent-link-row">${page.related.map(href=>`<a href="${esc(href)}">${esc(labelFor(href))}</a>`).join('\n')}<a href="index.html#search-results">병원 검색하기</a></div></section>
    <section class="intent-note"><h2>의료 정보 안내</h2><ul><li>이 페이지는 병원 선택 전 비교 기준을 정리한 참고용 정보입니다.</li><li>진료 가능 여부, 접수 마감, 비용, 검사 가능 범위는 병원 사정에 따라 달라질 수 있으므로 방문 전 직접 확인해 주세요.</li><li>응급 증상이나 급격한 증상 악화는 온라인 검색보다 119, 응급실, 해당 병원의 직접 안내가 우선입니다.</li><li>정보 정정 요청은 replyleaders@naver.com 으로 접수합니다. 최종 점검일: ${UPDATED}</li></ul></section>
  </main>
  <footer class="footer"><div class="footer-inner"><div class="footer-top"><div class="footer-brand"><div class="logo"><span class="logo-icon">H</span><span class="gradient-text">병원찾기</span></div><p>공공 데이터와 공개 가능한 정보를 바탕으로 병원 탐색에 필요한 참고 정보를 정리합니다.</p></div><div class="footer-links-group"><h4>바로가기</h4><a href="index.html">홈</a><a href="guide.html">건강가이드</a><a href="about.html">사이트 소개</a></div><div class="footer-links-group"><h4>정책</h4><a href="editorial-policy.html">콘텐츠 편집 원칙</a><a href="ad-policy.html">광고 및 제휴 안내</a><a href="privacy.html">개인정보처리방침</a></div></div><div class="footer-bottom"><p>&copy; 2026 병원찾기. 모든 권리 보유.</p><p>본 사이트의 정보는 참고용이며, 실제 진단과 치료 결정은 반드시 해당 병원 또는 의료진과 직접 상담해 주세요.</p></div></div></footer>
</body>
</html>`;
}
for (const page of pages) fs.writeFileSync(page.file, render(page), 'utf8');
console.log(`Generated ${pages.length} Seoul department landing pages`);
