const fs = require('fs');

const SITE = 'https://hospital-ranking.kr';
const UPDATED = '2026-07-01';
const ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1441018945572157" crossorigin="anonymous"></script>';

const pages = [
  {
    file: 'busan-dental.html', slug: 'busan-dental', title: '부산 치과 병원찾기', badge: '부산 치과', keyword: '부산 치과', guide: ['guide-implant.html', '임플란트 상담 가이드'],
    description: '부산 치과를 찾을 때 임플란트, 보철, 충치 치료, 주말 진료와 이동 동선을 함께 확인하는 기준입니다.',
    hero: '부산은 생활권이 넓고 이동 시간이 병원 선택에 큰 영향을 줍니다. 치과는 반복 방문이 잦기 때문에 서면, 해운대, 동래, 사하처럼 생활 동선과 치료 목적을 함께 놓고 비교하는 것이 좋습니다.',
    sections: [
      ['부산 치과 검색 기준', ['임플란트·보철처럼 여러 번 방문하는 치료는 집이나 직장 동선을 먼저 봅니다.', '정기검진과 스케일링은 가까운 생활권과 토요일 진료 여부가 중요합니다.', '통증이 있으면 당일 진료 가능 여부와 촬영 가능 여부를 먼저 확인합니다.']],
      ['상담 전 준비', ['기존 치과 촬영 자료나 치료 기록이 있으면 가져갑니다.', '복용약, 당뇨·고혈압·골다공증 치료 여부를 미리 정리합니다.', '총 치료 기간, 내원 횟수, 임시치아 가능 여부를 질문 목록에 적어둡니다.']],
      ['비용 확인 포인트', ['촬영, 발치, 뼈이식, 임시치아, 보철 비용이 구분되어 설명되는지 확인합니다.', '사후관리와 재내원 기준을 상담 때 함께 물어봅니다.', '부산권 이동이 부담되면 가까운 지점 연계나 예약 시간대를 확인합니다.']]
    ],
    chips: ['부산 임플란트', '부산 치과 토요일', '해운대 치과', '서면 치과'],
    faq: [['부산 치과는 지역을 어떻게 좁히면 좋나요?', '반복 방문이 필요한 치료라면 생활권과 대중교통 동선을 먼저 보고, 이후 촬영·비용·치료 계획을 비교하는 것이 좋습니다.'], ['임플란트 상담 전 무엇을 물어봐야 하나요?', '뼈이식 필요성, 총 내원 횟수, 보철 종류, 사후관리 기준을 확인하세요.'], ['토요일 치과는 바로 진료가 가능한가요?', '토요일은 예약 위주이거나 접수 마감이 빠를 수 있어 방문 전 전화 확인이 필요합니다.']],
    related: ['guide-implant.html','saturday-implant.html','parking-dental.html','gyeonggi-dental.html']
  },
  {
    file: 'busan-ophthalmology.html', slug: 'busan-ophthalmology', title: '부산 안과 병원찾기', badge: '부산 안과', keyword: '부산 안과', guide: ['guide-cataract.html', '백내장 상담 가이드'],
    description: '부산 안과를 찾을 때 시력검사, 안구건조, 백내장, 라식·라섹 상담과 검사 후 이동 동선을 확인하는 기준입니다.',
    hero: '부산 안과는 시력검사부터 백내장, 안구건조, 시력교정술 상담까지 목적이 다양합니다. 검사 후 운전이 어려울 수 있는 경우도 있어 병원 위치와 귀가 동선까지 함께 보는 것이 좋습니다.',
    sections: [
      ['검사 목적 먼저 나누기', ['시력저하와 안구건조는 기본 검사와 생활습관 상담이 중심입니다.', '백내장 상담은 눈부심, 야간 운전 불편, 시야 흐림 정도를 정리합니다.', '라식·라섹 상담은 렌즈 착용 중단 기간과 정밀검사 일정을 확인합니다.']],
      ['부산권 이동 체크', ['검사 후 산동검사를 하면 운전이 어려울 수 있어 귀가 방법을 준비합니다.', '해운대·서면 등 이동 시간이 길면 예약 시간과 대기 시간을 함께 고려합니다.', '보호자 동행이 필요한 검사인지 미리 확인합니다.']],
      ['상담 때 물어볼 것', ['검사 결과가 어떤 질환 가능성과 연결되는지 설명을 듣습니다.', '수술 상담은 회복 기간, 부작용, 재검 일정까지 확인합니다.', '기존 안약 사용 내역과 전신질환 정보를 알려줍니다.']]
    ],
    chips: ['부산 안과 백내장', '부산 안구건조 안과', '부산 라식 상담', '부산 안과 토요일'],
    faq: [['안과 검사 후 운전해도 되나요?', '산동검사 등 일부 검사는 당일 운전이 어려울 수 있으므로 검사 전 확인하세요.'], ['백내장 상담은 바로 수술 결정인가요?', '아닙니다. 생활 불편, 시력, 동반 질환을 종합해 의료진과 결정합니다.'], ['렌즈를 끼고 라식 검사를 받을 수 있나요?', '렌즈 종류에 따라 중단 기간이 필요할 수 있어 예약 전 확인이 필요합니다.']],
    related: ['guide-cataract.html','guide-lasik.html','cataract-clinic.html','gangnam-lasik.html']
  },
  {
    file: 'gyeonggi-dental.html', slug: 'gyeonggi-dental', title: '경기 치과 병원찾기', badge: '경기 치과', keyword: '경기 치과', guide: ['guide-implant.html', '임플란트 상담 가이드'],
    description: '경기 치과를 찾을 때 생활권, 주차, 임플란트·교정·보철 상담, 주말 방문 가능성을 확인하는 기준입니다.',
    hero: '경기 지역은 도시 간 이동 시간이 길어 가까운 생활권과 주차 조건이 치과 선택에 큰 영향을 줍니다. 임플란트, 교정, 보철처럼 반복 방문이 필요한 치료는 거리와 예약 가능 시간을 먼저 보는 것이 좋습니다.',
    sections: [
      ['경기권에서 먼저 볼 기준', ['집 근처, 직장 근처, 자녀 학교 근처 중 반복 방문이 쉬운 위치를 정합니다.', '차량 이동이 많다면 주차 가능 여부와 진료 후 이동 시간을 확인합니다.', '야간·토요일 진료가 필요한 경우 접수 마감 시간을 직접 확인합니다.']],
      ['치료 목적별 체크', ['임플란트는 촬영, 잇몸뼈 상태, 뼈이식 필요성을 확인합니다.', '교정은 기간, 월 방문 횟수, 응급 내원 기준을 확인합니다.', '보철은 재료, 유지관리, 임시치아 가능 여부를 물어봅니다.']],
      ['상담 준비물', ['기존 촬영 자료와 치료 기록을 가져갑니다.', '복용약과 전신질환 정보를 정리합니다.', '예산 범위와 원하는 치료 시기를 미리 생각해 둡니다.']]
    ],
    chips: ['경기 임플란트', '수원 치과', '분당 치과', '경기 치과 주차'],
    faq: [['경기 치과는 가까운 곳이 가장 좋은가요?', '반복 방문 치료라면 가까운 위치가 중요하지만, 촬영·치료 계획·비용 설명도 함께 비교해야 합니다.'], ['주차 가능한 치과를 찾는 게 중요한가요?', '경기권은 차량 이동이 많아 치료 후 귀가 동선과 주차 가능 여부가 실제 편의에 큰 영향을 줄 수 있습니다.'], ['교정 상담은 무엇을 확인해야 하나요?', '총 기간, 월 방문 횟수, 장치 종류, 응급 내원 기준을 확인하세요.']],
    related: ['guide-implant.html','parking-dental.html','seoul-dental.html','saturday-implant.html']
  },
  {
    file: 'gyeonggi-orthopedic.html', slug: 'gyeonggi-orthopedic', title: '경기 정형외과 병원찾기', badge: '경기 정형외과', keyword: '경기 정형외과', guide: ['guide-ortho.html', '정형외과 방문 가이드'],
    description: '경기 정형외과를 찾을 때 허리·무릎·어깨 통증, 영상검사, 도수치료, 재활 동선을 확인하는 기준입니다.',
    hero: '경기권 정형외과는 생활권과 이동 거리 차이가 커서 통증 부위와 치료 빈도를 함께 고려해야 합니다. 물리치료나 도수치료처럼 반복 방문이 필요한 경우 가까운 병원과 치료 가능 시간을 먼저 확인하세요.',
    sections: [
      ['통증 부위 정리', ['허리·목 통증은 저림이나 감각 저하가 있는지 확인합니다.', '무릎·어깨 통증은 악화 동작과 외상 여부를 적어둡니다.', '넘어짐 이후 통증은 골절 가능성을 배제해야 하므로 빠른 진료가 필요할 수 있습니다.']],
      ['검사와 치료 기준', ['X-ray, 초음파, MRI 연계 가능 여부를 확인합니다.', '물리치료, 도수치료, 주사치료가 어떤 기준으로 권장되는지 설명을 듣습니다.', '수술이나 상급병원 의뢰가 필요한 기준을 확인합니다.']],
      ['경기권 방문 동선', ['반복 치료가 필요하면 주차와 대중교통 접근성을 함께 봅니다.', '퇴근 후 방문하려면 접수 마감 시간을 확인합니다.', '기존 영상 자료가 있으면 재촬영을 줄이는 데 도움이 될 수 있습니다.']]
    ],
    chips: ['경기 정형외과', '수원 정형외과', '분당 도수치료', '경기 허리통증 병원'],
    faq: [['정형외과는 MRI가 꼭 필요한가요?', '모든 통증에 필요한 것은 아니며 진찰과 기본 촬영 후 필요성을 판단하는 경우가 많습니다.'], ['도수치료 병원은 어떻게 고르나요?', '의사 진단 후 치료 목표와 평가 기준을 설명하는지 확인하세요.'], ['통증이 심하면 응급실을 가야 하나요?', '외상 후 변형, 마비, 감각저하, 극심한 통증은 응급 진료가 필요할 수 있습니다.']],
    related: ['guide-ortho.html','manual-therapy-clinic.html','seoul-orthopedic.html','seoul-rehab.html']
  },
  {
    file: 'incheon-ophthalmology.html', slug: 'incheon-ophthalmology', title: '인천 안과 병원찾기', badge: '인천 안과', keyword: '인천 안과', guide: ['guide-lasik.html', '시력교정 가이드'],
    description: '인천 안과를 찾을 때 시력검사, 안구건조, 백내장, 라식·라섹 상담과 검사 후 귀가 동선을 확인하는 기준입니다.',
    hero: '인천 안과는 생활권과 서울권 이동을 함께 고려하는 경우가 많습니다. 단순 시력검사인지, 백내장·망막 확인인지, 라식·라섹 상담인지 목적을 나누면 병원을 더 빠르게 좁힐 수 있습니다.',
    sections: [
      ['방문 목적 나누기', ['시력저하와 안구건조는 기본 검사와 생활습관 상담이 중심입니다.', '백내장 상담은 눈부심, 시야 흐림, 야간 운전 불편 정도를 정리합니다.', '라식·라섹 검사는 렌즈 중단 기간과 정밀검사 일정을 확인합니다.']],
      ['인천권 이동 체크', ['검사 후 산동검사를 하면 운전이 어려울 수 있어 귀가 방법을 생각합니다.', '서울권 병원과 비교할 경우 반복 방문 가능성을 현실적으로 봅니다.', '토요일 검사 가능 여부와 대기 시간을 확인합니다.']],
      ['상담 준비', ['기존 안약 사용 내역과 전신질환 정보를 정리합니다.', '렌즈 착용자는 렌즈 종류와 착용 기간을 알려줍니다.', '수술 상담은 회복 기간과 업무 복귀 일정을 함께 확인합니다.']]
    ],
    chips: ['인천 안과', '인천 백내장 안과', '인천 라식 상담', '인천 안과 토요일'],
    faq: [['라식 검사는 당일 가능한가요?', '렌즈 착용 여부에 따라 중단 기간이 필요할 수 있어 예약 전 확인해야 합니다.'], ['안과 검사 후 운전 가능한가요?', '산동검사 등은 운전이 어려울 수 있어 검사 종류를 확인하세요.'], ['백내장은 바로 수술해야 하나요?', '생활 불편과 검사 결과에 따라 의료진과 결정해야 합니다.']],
    related: ['guide-lasik.html','guide-cataract.html','busan-ophthalmology.html','cataract-clinic.html']
  },
  {
    file: 'incheon-pediatric.html', slug: 'incheon-pediatric', title: '인천 소아과 병원찾기', badge: '인천 소아과', keyword: '인천 소아과', guide: ['guide-rhinitis.html', '소아 증상 정리 가이드'],
    description: '인천 소아과를 찾을 때 발열, 기침, 비염, 예방접종, 주말 진료 가능성을 보호자 관점에서 확인하는 기준입니다.',
    hero: '아이 진료는 보호자가 기록한 정보가 중요합니다. 인천 소아과를 찾을 때는 발열 기간, 해열제 복용 시간, 식사와 수면 변화, 예방접종 일정, 주말 진료 가능 여부를 함께 확인하세요.',
    sections: [
      ['보호자 기록', ['체온 변화와 해열제 복용 시간을 적습니다.', '기침, 콧물, 구토, 설사, 발진 등 동반 증상을 기록합니다.', '먹는 양, 소변량, 처짐 정도를 함께 봅니다.']],
      ['인천권 병원 선택', ['집과 어린이집·학교 동선을 고려해 반복 방문이 쉬운지 봅니다.', '일요일이나 야간 진료가 필요한 경우 접수 마감 시간을 확인합니다.', '예방접종은 예약제인지, 일반 진료와 동선이 분리되는지 확인합니다.']],
      ['응급 신호', ['호흡이 가쁘거나 입술이 파래지면 응급 안내가 우선입니다.', '의식 저하, 반복 경련, 탈수 의심은 빠른 진료가 필요합니다.', '3개월 미만 영아 발열은 의료진 상담을 서두르는 것이 좋습니다.']]
    ],
    chips: ['인천 소아과', '인천 소아과 일요일', '인천 예방접종 병원', '아이 발열 병원'],
    faq: [['소아과 방문 전 무엇을 적어가야 하나요?', '체온, 해열제 시간, 먹는 양, 소변량, 동반 증상을 적으면 도움이 됩니다.'], ['예방접종은 예약이 필요한가요?', '병원마다 달라 접종명과 아이 월령을 말하고 확인하는 것이 좋습니다.'], ['일요일 소아과는 대기가 긴가요?', '휴일은 대기가 길 수 있어 접수 마감과 예약 여부를 미리 확인해야 합니다.']],
    related: ['sunday-pediatric.html','vaccination-clinic.html','seoul-pediatric.html','guide-rhinitis.html']
  },
  {
    file: 'daejeon-internal.html', slug: 'daejeon-internal', title: '대전 내과 병원찾기', badge: '대전 내과', keyword: '대전 내과', guide: ['guide-diabetes.html', '만성질환 진료 가이드'],
    description: '대전 내과를 찾을 때 건강검진 결과 상담, 소화기 증상, 혈압·혈당 관리, 내시경 검사 가능 여부를 확인하는 기준입니다.',
    hero: '대전 내과는 건강검진 상담, 소화기 증상, 감기, 만성질환 관리처럼 방문 목적이 넓습니다. 둔산, 유성, 서구 등 생활권을 기준으로 접근성과 검사 가능 여부를 함께 확인하면 선택이 쉬워집니다.',
    sections: [
      ['방문 목적 나누기', ['감기, 발열, 복통처럼 단기 증상인지 확인합니다.', '혈압·혈당·콜레스테롤 추적처럼 정기 관리가 필요한지 봅니다.', '내시경, 초음파, 혈액검사 등 검사 가능 여부를 확인합니다.']],
      ['대전 생활권 체크', ['직장 근처는 점심시간과 퇴근 후 접수 가능 시간이 중요합니다.', '집 근처는 반복 방문과 처방 연속성이 장점입니다.', '검사 후 귀가 동선과 보호자 필요 여부를 확인합니다.']],
      ['방문 전 준비', ['건강검진 결과지와 처방전을 가져갑니다.', '증상 시작일과 식사 관련성을 적어둡니다.', '집에서 잰 혈압·혈당 기록이 있으면 도움이 됩니다.']]
    ],
    chips: ['대전 내과', '대전 건강검진 내과', '대전 내시경 병원', '대전 당뇨 내과'],
    faq: [['내과 방문 전 검진 결과지가 필요한가요?', '결과 상담이나 만성질환 관리는 이전 수치 비교가 중요해 가져가는 것이 좋습니다.'], ['대전 내과에서 내시경도 가능한가요?', '병원마다 장비와 예약 방식이 달라 검사명을 말하고 확인해야 합니다.'], ['야간 내과는 검사도 되나요?', '진료는 가능해도 검사실 운영이 끝난 경우가 있어 전화 확인이 필요합니다.']],
    related: ['guide-diabetes.html','endoscopy-clinic.html','seoul-internal.html','night-clinic.html']
  },
  {
    file: 'daejeon-ent.html', slug: 'daejeon-ent', title: '대전 이비인후과 병원찾기', badge: '대전 이비인후과', keyword: '대전 이비인후과', guide: ['guide-rhinitis.html', '비염 진료 가이드'],
    description: '대전 이비인후과를 찾을 때 비염, 코막힘, 기침, 목 통증, 귀 증상과 검사 가능 여부를 확인하는 기준입니다.',
    hero: '대전 이비인후과는 반복 비염, 감기 증상, 귀 통증, 목 불편으로 자주 찾게 됩니다. 증상 기간과 악화 환경을 정리하고, 내시경이나 청력검사 가능 여부를 함께 확인하세요.',
    sections: [
      ['증상별 정리', ['코막힘, 재채기, 후비루가 반복되면 비염 상담을 고려합니다.', '목 통증과 기침이 오래가면 지속 기간과 발열 여부를 적습니다.', '귀 통증, 먹먹함, 어지럼은 고막 확인과 청력검사 가능 여부를 봅니다.']],
      ['대전권 병원 선택', ['둔산·유성 등 생활권과 대기 시간을 함께 봅니다.', '소아 진료가 필요하면 아이 진료 가능 여부를 확인합니다.', '토요일·야간 접수 마감 시간을 전화로 확인합니다.']],
      ['방문 전 준비', ['복용한 감기약, 항히스타민제, 스프레이 사용 경험을 정리합니다.', '알레르기 병력과 계절성 여부를 알려줍니다.', '증상이 심해지는 시간대와 장소를 적어둡니다.']]
    ],
    chips: ['대전 이비인후과', '대전 비염 병원', '대전 목통증 병원', '대전 이비인후과 토요일'],
    faq: [['감기와 비염은 어떻게 구분하나요?', '발열·몸살이 동반되면 급성 감염 가능성이 있고, 계절·환경에 따라 반복되면 비염 상담이 필요할 수 있습니다.'], ['귀가 먹먹하면 바로 이비인후과를 가야 하나요?', '통증, 어지럼, 청력저하가 동반되면 빠르게 확인하는 것이 좋습니다.'], ['소아도 이비인후과에서 볼 수 있나요?', '가능한 병원이 많지만 아이 연령과 증상에 따라 확인이 필요합니다.']],
    related: ['guide-rhinitis.html','daegu-ent.html','seoul-ent.html','sunday-pediatric.html']
  },
  {
    file: 'daegu-ent.html', slug: 'daegu-ent', title: '대구 이비인후과 병원찾기', badge: '대구 이비인후과', keyword: '대구 이비인후과', guide: ['guide-rhinitis.html', '비염 진료 가이드'],
    description: '대구 이비인후과를 찾을 때 비염, 기침, 목 통증, 귀 증상과 토요일 진료 가능 여부를 확인하는 기준입니다.',
    hero: '대구 이비인후과는 비염, 감기, 목 통증, 귀 증상으로 반복 방문하는 경우가 많습니다. 생활권과 접수 시간을 먼저 보고, 필요한 검사가 가능한지 확인하면 병원 선택이 쉬워집니다.',
    sections: [
      ['증상 구분', ['반복 코막힘과 재채기는 비염·알레르기 상담을 고려합니다.', '목 통증과 쉰 목소리가 오래가면 지속 기간을 정리합니다.', '귀 통증이나 어지럼은 검사 가능 여부를 확인합니다.']],
      ['대구 생활권 체크', ['수성구, 중구, 달서구 등 생활 동선과 주차 가능 여부를 봅니다.', '토요일 진료는 접수 마감이 빠를 수 있어 전화 확인이 필요합니다.', '아이 진료가 필요하면 소아 진료 가능 여부를 확인합니다.']],
      ['준비할 내용', ['복용한 감기약과 알레르기 약을 적어둡니다.', '증상이 심해지는 계절, 장소, 시간대를 정리합니다.', '발열, 두통, 귀 통증 동반 여부를 함께 알려줍니다.']]
    ],
    chips: ['대구 이비인후과', '대구 비염 병원', '대구 목통증 병원', '대구 이비인후과 토요일'],
    faq: [['비염은 꾸준히 치료해야 하나요?', '증상 패턴과 원인에 따라 다르므로 의료진과 약물·생활관리 계획을 세우는 것이 좋습니다.'], ['대구 이비인후과 토요일 진료는 많은가요?', '병원마다 다르며 접수 마감이 빠를 수 있어 방문 전 확인이 필요합니다.'], ['귀 통증이 있으면 어떤 검사를 하나요?', '고막 확인, 청력검사 등은 병원 장비에 따라 달라질 수 있습니다.']],
    related: ['guide-rhinitis.html','daejeon-ent.html','seoul-ent.html','saturday-clinic.html']
  }
];

function esc(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function list(items) { return items.map(item => `<li>${esc(item)}</li>`).join('\n'); }
function labelFor(href) {
  const labels = {
    'guide-implant.html':'임플란트 가이드','saturday-implant.html':'토요일 임플란트','parking-dental.html':'주차 가능한 치과','gyeonggi-dental.html':'경기 치과',
    'guide-cataract.html':'백내장 가이드','guide-lasik.html':'라식·라섹 가이드','cataract-clinic.html':'백내장 병원','gangnam-lasik.html':'강남 라식 안과',
    'seoul-dental.html':'서울 치과','guide-ortho.html':'정형외과 가이드','manual-therapy-clinic.html':'도수치료 병원','seoul-orthopedic.html':'서울 정형외과','seoul-rehab.html':'서울 재활의학과',
    'busan-ophthalmology.html':'부산 안과','sunday-pediatric.html':'일요일 소아과','vaccination-clinic.html':'예방접종 병원','seoul-pediatric.html':'서울 소아과','guide-rhinitis.html':'비염 가이드',
    'guide-diabetes.html':'만성질환 가이드','endoscopy-clinic.html':'내시경 병원','seoul-internal.html':'서울 내과','night-clinic.html':'야간 진료',
    'daegu-ent.html':'대구 이비인후과','seoul-ent.html':'서울 이비인후과','daejeon-ent.html':'대전 이비인후과','saturday-clinic.html':'토요일 진료'
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
  <link rel="stylesheet" href="css/style.css?v=11">
  <style>
    .intent-page{max-width:1120px;padding-top:56px}.intent-hero{padding:38px;border:1px solid var(--border-default);border-radius:28px;background:radial-gradient(circle at 88% 10%,rgba(166,124,82,.18),transparent 30%),linear-gradient(135deg,color-mix(in srgb,var(--bg-card) 88%,white 12%),color-mix(in srgb,var(--bg-body) 92%,white 8%));box-shadow:var(--shadow-sm)}.intent-badge{display:inline-flex;padding:8px 14px;border-radius:999px;background:color-mix(in srgb,var(--primary-50) 72%,white 28%);color:var(--primary);font-weight:800}.intent-hero h1{margin:16px 0 14px;font-size:clamp(2.1rem,4vw,3.3rem);letter-spacing:-.04em}.intent-hero p{max-width:820px;color:var(--text-body);line-height:1.85;font-size:1.06rem}.intent-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.intent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:26px}.intent-card,.intent-note,.intent-faq{border:1px solid var(--border-default);border-radius:22px;background:var(--bg-card);box-shadow:var(--shadow-xs);padding:24px}.intent-card h2,.intent-note h2,.intent-faq h2{margin:0 0 13px;font-size:1.24rem}.intent-card ul,.intent-note ul{list-style:disc;margin:0;padding-left:20px;display:grid;gap:9px}.intent-card li,.intent-note li,.intent-faq p{color:var(--text-body);line-height:1.78}.intent-note{margin-top:24px}.intent-chip-row,.intent-link-row{display:flex;flex-wrap:wrap;gap:10px}.intent-chip-row span,.intent-link-row a{display:inline-flex;align-items:center;min-height:40px;padding:8px 13px;border-radius:999px;border:1px solid var(--border-default);background:var(--bg-body);color:var(--text-heading);font-weight:700;text-decoration:none}.intent-faq details{border-top:1px solid var(--border-light);padding:14px 0}.intent-faq details:first-of-type{border-top:0}.intent-faq summary{cursor:pointer;color:var(--text-heading);font-weight:800;line-height:1.55}.intent-faq p{margin:10px 0 0}@media(max-width:768px){.intent-page{padding-top:40px}.intent-hero,.intent-card,.intent-note,.intent-faq{padding:22px 18px}}
  </style>
${schemas(page)}
  ${ADSENSE}
</head>
<body class="light-mode">
  <header class="header" id="header" style="position:static; border-bottom:1px solid var(--border-default);"><div class="header-inner"><a href="index.html" class="logo"><span class="logo-icon">H</span><span class="gradient-text">병원찾기</span></a><nav class="nav-links"><a href="index.html#search-results">병원목록</a><a href="guide.html">건강가이드</a><a href="about.html">사이트 소개</a><a href="contact.html">문의</a></nav></div></header>
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
console.log(`Generated ${pages.length} regional landing pages`);
