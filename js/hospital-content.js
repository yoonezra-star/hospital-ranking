(() => {
  const DEPARTMENT_PROFILES = {
    general: {
      primaryServices: ['초진 진료과 연결', '입원·수술 전 상담', '영상검사 연계', '만성질환 추적 관리'],
      visitTargets: ['복합 증상으로 여러 진료과 확인이 필요한 경우', '수술 또는 입원 가능 병원을 찾는 경우', '정밀검사 연계가 필요한 경우'],
      documents: ['신분증', '복용 중인 약 목록', '기존 검사 결과지', '진료의뢰서 여부 확인'],
      reservation: '대형 병원급은 접수 대기 시간이 길 수 있어 초진 접수 시간과 진료과 위치를 먼저 확인하는 편이 좋습니다.',
      checklist: ['접수 마감 시간과 점심시간을 먼저 확인하세요.', '검사·수술 상담은 복용약과 과거 병력을 정리해 가면 설명이 빨라집니다.'],
    },
    dental: {
      primaryServices: ['임플란트 상담', '보철·충치 치료', '스케일링·정기검진', '잇몸 치료'],
      visitTargets: ['치통, 잇몸통증, 씹기 불편이 있는 경우', '임플란트·보철 계획을 비교하고 싶은 경우', '정기적인 구강검진이 필요한 경우'],
      documents: ['신분증', '최근 치과 엑스레이 또는 파노라마', '복용약 목록'],
      reservation: '임플란트·보철 상담은 촬영 검사 여부와 상담 가능 시간을 먼저 확인하면 동선이 줄어듭니다.',
      checklist: ['통증 부위와 증상 시작 시점을 메모해 두세요.', '치과 촬영 기록이 있으면 함께 가져가는 편이 좋습니다.'],
    },
    orthopedic: {
      primaryServices: ['관절 통증 진료', '목·허리 통증 진료', '도수·재활 상담', '골절·외상 평가'],
      visitTargets: ['허리·목 통증이 반복되는 경우', '무릎·어깨 통증으로 영상검사가 필요한 경우', '주사·물리치료·재활 치료를 비교하려는 경우'],
      documents: ['신분증', '기존 MRI·X-ray 이미지 또는 판독지', '복용약 목록'],
      reservation: '도수치료나 재활 상담은 치료 가능 시간과 비용 범위를 먼저 물어보는 편이 좋습니다.',
      checklist: ['통증 부위와 악화 동작을 정리해 가세요.', '기존 촬영 기록이 있으면 재검사 여부를 줄일 수 있습니다.'],
    },
    ophthalmology: {
      primaryServices: ['시력 저하 진료', '백내장·라식 상담', '안구건조증 관리', '안저·정밀검사'],
      visitTargets: ['시야 흐림, 눈부심, 안구 불편이 반복되는 경우', '백내장·시력교정 수술 상담이 필요한 경우', '정기적인 안과 검진이 필요한 경우'],
      documents: ['신분증', '기존 안과 검사 결과', '복용약 목록'],
      reservation: '확대검사나 정밀검사 여부에 따라 대기 시간이 길어질 수 있어, 검사 포함 진료인지 먼저 확인하는 편이 좋습니다.',
      checklist: ['렌즈 착용 여부와 기존 안과 수술력을 알려주세요.', '확대검사 예정이면 귀가 이동 시간을 여유 있게 잡는 편이 좋습니다.'],
    },
    dermatology: {
      primaryServices: ['피부염·여드름 진료', '색소·흉터 상담', '두드러기·가려움 진료', '피부질환 추적 관리'],
      visitTargets: ['피부 트러블이 반복되는 경우', '약 처방과 시술 상담을 함께 비교하려는 경우', '피부과 정기 추적이 필요한 경우'],
      documents: ['신분증', '사용 중인 연고·약 목록', '기존 피부과 진료 기록'],
      reservation: '시술 상담과 일반 외래 진료 시간이 구분되는 경우가 많아, 원하는 진료 유형을 먼저 알려주는 편이 좋습니다.',
      checklist: ['사용 중인 화장품·약을 메모해 두세요.', '증상 사진을 남겨두면 진료 설명에 도움이 됩니다.'],
    },
    ent: {
      primaryServices: ['비염·축농증 진료', '목 통증·기침 진료', '중이염·어지럼증 진료', '내시경 검사 상담'],
      visitTargets: ['코막힘, 목통증, 기침이 반복되는 경우', '이명·어지럼증으로 진료가 필요한 경우', '코·목 내시경 가능 병원을 찾는 경우'],
      documents: ['신분증', '기존 처방약 목록', '알레르기 병력 메모'],
      reservation: '비염·감기 성수기에는 대기 시간이 늘 수 있어 오전 접수 가능 여부를 먼저 확인하면 좋습니다.',
      checklist: ['증상 지속 기간과 악화 시간대를 메모하세요.', '알레르기 약 복용 여부를 함께 알려주세요.'],
    },
    pediatric: {
      primaryServices: ['영유아 감기·열 진료', '예방접종 상담', '성장·영양 상담', '소아 만성질환 추적'],
      visitTargets: ['아이의 발열·기침·장염 증상이 있는 경우', '예방접종 전후 상담이 필요한 경우', '성장·식습관 상담이 필요한 경우'],
      documents: ['보호자 신분증', '아이 수첩 또는 예방접종 기록', '복용약 목록'],
      reservation: '소아과는 오전 대기 집중이 많아 접수 마감 시간과 주말 진료 여부를 먼저 확인하는 편이 좋습니다.',
      checklist: ['체온, 증상 시작 시점, 먹은 약을 메모하세요.', '영유아는 탈수 여부를 함께 확인해 주세요.'],
    },
    obgyn: {
      primaryServices: ['여성 건강 검진', '임신·산전 상담', '생리통·질환 진료', '초음파 검사 상담'],
      visitTargets: ['여성 질환 상담이 필요한 경우', '임신 준비·산전 검진 계획이 필요한 경우', '정기 검진 또는 초음파 상담이 필요한 경우'],
      documents: ['신분증', '기존 검사 결과', '복용약 목록'],
      reservation: '검진과 일반 외래 시간대가 분리되는 경우가 있어 원하는 진료 목적을 먼저 알려주는 편이 좋습니다.',
      checklist: ['최근 검사일과 증상 주기를 메모하세요.', '산전 상담은 복용약과 기저질환 정보를 함께 정리해 가세요.'],
    },
    urology: {
      primaryServices: ['배뇨 불편 진료', '결석·전립선 상담', '남성 건강 진료', '초음파·소변검사 연계'],
      visitTargets: ['배뇨통, 빈뇨, 잔뇨감이 있는 경우', '결석·전립선 관련 상담이 필요한 경우', '남성 건강검진 상담을 원할 때'],
      documents: ['신분증', '최근 검사 결과', '복용약 목록'],
      reservation: '소변검사나 초음파가 동반될 수 있어 검사를 포함한 진료인지 먼저 확인하는 편이 좋습니다.',
      checklist: ['증상 시작 시점과 통증 위치를 메모하세요.', '검사 준비가 필요한지 전화로 먼저 확인하세요.'],
    },
    psychiatry: {
      primaryServices: ['우울·불안 상담', '수면장애 진료', '스트레스·공황 상담', '약물 치료 추적'],
      visitTargets: ['수면 문제, 불안, 우울 증상이 지속되는 경우', '상담과 약물 치료를 함께 비교하려는 경우', '정기적인 정신건강 추적이 필요한 경우'],
      documents: ['신분증', '복용약 목록', '기존 상담 또는 진료 기록'],
      reservation: '초진 상담 시간은 길어질 수 있어 예약 가능 여부와 상담 소요 시간을 먼저 확인하는 편이 좋습니다.',
      checklist: ['증상 기간과 일상 영향 정도를 정리해 가세요.', '기존 복용약과 부작용 경험을 함께 메모하세요.'],
    },
    plastic: {
      primaryServices: ['성형외과 상담', '흉터·피부 조직 상담', '기능적 교정 상담', '수술 후 경과 관리'],
      visitTargets: ['상담 중심으로 여러 옵션을 비교하려는 경우', '수술 전후 관리 계획을 확인하려는 경우', '흉터 또는 기능적 교정 상담이 필요한 경우'],
      documents: ['신분증', '기존 수술 기록', '복용약 목록'],
      reservation: '상담과 시술 시간이 분리되는 경우가 많아, 원하는 상담 종류를 미리 알려주는 편이 좋습니다.',
      checklist: ['기대하는 결과와 우려 사항을 메모하세요.', '과거 수술력과 현재 복용약을 정확히 알려주세요.'],
    },
    familymed: {
      primaryServices: ['만성질환 관리', '건강검진 상담', '생활습관 상담', '기본 외래 진료'],
      visitTargets: ['고혈압·당뇨 등 추적 관리가 필요한 경우', '동네 주치의 역할의 진료가 필요한 경우', '검진 결과 상담이 필요한 경우'],
      documents: ['신분증', '검진 결과지', '복용약 목록'],
      reservation: '만성질환 상담은 이전 검사 결과지를 함께 가져가면 설명과 처방 조정이 수월합니다.',
      checklist: ['혈압·혈당 기록이 있으면 함께 가져가세요.', '검진 결과 상담 목적이면 최근 결과지를 지참하세요.'],
    },
    pain: {
      primaryServices: ['통증 주사 상담', '만성 통증 관리', '신경통·근막통 진료', '재활 연계 상담'],
      visitTargets: ['만성 통증으로 일상 생활이 불편한 경우', '주사 치료와 재활 치료를 함께 비교하려는 경우', '통증의학과 초진 상담이 필요한 경우'],
      documents: ['신분증', '기존 MRI·X-ray 결과', '복용약 목록'],
      reservation: '주사 치료나 시술 상담은 촬영 결과 유무에 따라 당일 진행 가능 범위가 달라질 수 있습니다.',
      checklist: ['통증 위치, 강도, 악화 동작을 메모하세요.', '기존 시술력과 반응을 함께 알려주세요.'],
    },
    korean: {
      primaryServices: ['한방 통증 진료', '추나·침 상담', '소화·피로 관리', '체질 상담'],
      visitTargets: ['허리·목·어깨 통증 관리가 필요한 경우', '추나·침 치료 상담을 원할 때', '한방 외래를 비교하려는 경우'],
      documents: ['신분증', '복용약 목록', '기존 검사 결과지'],
      reservation: '추나나 특수 치료는 가능 시간대가 구분되는 경우가 있어 원하는 치료 유형을 먼저 확인하는 편이 좋습니다.',
      checklist: ['통증 위치와 일상 불편을 메모하세요.', '양약 복용 중이면 함께 알려 주세요.'],
    },
    rehab: {
      primaryServices: ['재활치료 상담', '보행·근력 회복 관리', '운동치료 연계', '통증 재활 추적'],
      visitTargets: ['수술 후 회복이 필요한 경우', '만성 통증과 기능 저하가 함께 있는 경우', '재활 프로그램 가능 병원을 찾는 경우'],
      documents: ['신분증', '수술·시술 기록', '기존 영상검사 결과'],
      reservation: '재활치료는 치료 가능 시간과 회차 계획을 먼저 확인하는 편이 좋습니다.',
      checklist: ['수술 또는 시술 날짜를 메모하세요.', '현재 가능한 동작 범위와 통증 정도를 정리해 가세요.'],
    },
  };

  const REGIONAL_LANDING_SECTIONS = [
    { title: '서울 치과 찾기', region: '서울', department: 'dental', description: '임플란트, 보철, 정기검진 중심으로 서울권 치과를 빠르게 비교합니다.', badge: '서울 + 치과' },
    { title: '서울 안과 찾기', region: '서울', department: 'ophthalmology', description: '시력저하, 백내장, 안구건조증 상담 병원을 서울권에서 비교합니다.', badge: '서울 + 안과' },
    { title: '경기 정형외과 찾기', region: '경기', department: 'orthopedic', description: '허리, 무릎, 어깨 통증 진료를 경기권 병원 기준으로 살펴봅니다.', badge: '경기 + 정형외과' },
    { title: '부산 종합병원 찾기', region: '부산', type: 'hospital', description: '입원·검사 연계가 필요한 부산권 병원급 의료기관을 모아 봅니다.', badge: '부산 + 병원급' },
    { title: '대전 피부과 찾기', region: '대전', department: 'dermatology', description: '피부염, 여드름, 색소 상담 병원을 대전 기준으로 빠르게 찾습니다.', badge: '대전 + 피부과' },
    { title: '서울 정신건강의학과 찾기', region: '서울', department: 'psychiatry', description: '우울, 불안, 수면 상담을 서울권 외래 중심으로 비교합니다.', badge: '서울 + 정신건강' },
  ];

  const GUIDE_SPOTLIGHTS = [
    { title: '토요일 진료 병원 모아보기', href: '#quick-access', description: '주말 진료, 야간 진료, 최근 개원 병원을 빠르게 체크할 수 있습니다.', badge: '상황별 탐색' },
    { title: '임플란트 치과 가이드', href: 'guide-implant.html', description: '상담 전 체크포인트, 비용, 촬영 준비를 먼저 정리해 둡니다.', badge: '치과 가이드' },
    { title: '수면내시경 병원 찾기', href: 'guide-endoscopy.html', description: '검사 전 준비, 주의사항, 회복 동선을 정리한 가이드로 연결합니다.', badge: '검사 가이드' },
    { title: '우울·불안 상담 병원 찾기', href: 'guide-depression.html', description: '정신건강의학과 상담 전 준비사항과 초기 질문 포인트를 정리합니다.', badge: '상담 가이드' },
  ];

  const GUIDE_RECOMMENDATIONS = {
    general: [
      { title: '수면내시경 준비 가이드', href: 'guide-endoscopy.html', description: '검사 전 금식, 귀가 동선, 회복 포인트를 먼저 확인합니다.' },
      { title: '당뇨 관리 가이드', href: 'guide-diabetes.html', description: '만성질환 추적 진료 전에 체크할 항목을 정리합니다.' },
    ],
    dental: [
      { title: '임플란트 치과 가이드', href: 'guide-implant.html', description: '상담 전 촬영, 비용, 보철 계획을 확인할 수 있습니다.' },
      { title: '교정 치과 가이드', href: 'guide-ortho.html', description: '교정 상담 전에 기간과 검사 포인트를 정리합니다.' },
    ],
    orthopedic: [
      { title: '정형외과 진료 준비 가이드', href: 'guide-ortho.html', description: '허리, 어깨, 무릎 통증 진료 전에 확인할 내용을 모았습니다.' },
      { title: '비염 아닌 목·통증 외래와 구분하기', href: 'guide-rhinitis.html', description: '호흡기 증상과 근골격계 증상을 구분해 외래를 찾을 때 참고합니다.' },
    ],
    ophthalmology: [
      { title: '라식·라섹 가이드', href: 'guide-lasik.html', description: '시력교정술 전 검사와 회복 포인트를 확인합니다.' },
      { title: '백내장·안과 검사 전 체크', href: 'guide-endoscopy.html', description: '정밀검사 전 준비 흐름을 참고용으로 정리했습니다.' },
    ],
    dermatology: [
      { title: '여드름 피부과 가이드', href: 'guide-acne.html', description: '약 처방과 시술 상담 전에 체크할 기준을 정리합니다.' },
      { title: '피부과 방문 전 체크', href: 'guide-rhinitis.html', description: '증상 기록과 복용약 정리를 위한 참고 가이드입니다.' },
    ],
    ent: [
      { title: '비염·이비인후과 가이드', href: 'guide-rhinitis.html', description: '코막힘, 알레르기, 반복 감기 진료 전에 확인할 포인트를 모았습니다.' },
      { title: '수면내시경 검사 가이드', href: 'guide-endoscopy.html', description: '목·위장 관련 검사 전 준비 흐름을 참고용으로 확인할 수 있습니다.' },
    ],
    pediatric: [
      { title: '소아과 방문 전 체크', href: 'guide-rhinitis.html', description: '발열, 기침, 비염 증상 정리에 도움이 되는 참고 가이드입니다.' },
      { title: '정신건강 상담 준비 가이드', href: 'guide-depression.html', description: '청소년 상담이 필요한 경우 초기 질문 포인트를 참고할 수 있습니다.' },
    ],
    obgyn: [
      { title: '여성 건강 검진 전 체크', href: 'guide-endoscopy.html', description: '검사 전 준비와 귀가 동선을 참고용으로 확인할 수 있습니다.' },
      { title: '우울·불안 상담 가이드', href: 'guide-depression.html', description: '산전·산후 정서 상담을 준비할 때 참고할 수 있습니다.' },
    ],
    urology: [
      { title: '비뇨의학과 방문 가이드', href: 'guide-urology.html', description: '배뇨 불편, 결석, 전립선 진료 전에 체크할 내용을 정리했습니다.' },
      { title: '수면내시경 검사 가이드', href: 'guide-endoscopy.html', description: '검사 동선과 준비 절차를 참고용으로 확인할 수 있습니다.' },
    ],
    psychiatry: [
      { title: '우울·불안 상담 가이드', href: 'guide-depression.html', description: '초진 상담 전에 증상 정리와 질문 포인트를 먼저 확인합니다.' },
      { title: '수면 문제 상담 전 체크', href: 'guide-depression.html', description: '수면장애와 불안 증상 기록에 참고할 수 있습니다.' },
    ],
    plastic: [
      { title: '피부과·성형 상담 전 체크', href: 'guide-acne.html', description: '시술 전 준비사항과 피부 상태 기록에 참고할 수 있습니다.' },
      { title: '라식·안과 수술 회복 가이드', href: 'guide-lasik.html', description: '수술 전후 생활 관리 흐름을 참고용으로 볼 수 있습니다.' },
    ],
    familymed: [
      { title: '당뇨 관리 가이드', href: 'guide-diabetes.html', description: '검진 결과 상담과 만성질환 추적 전 체크할 내용을 정리했습니다.' },
      { title: '비염·감기 외래 가이드', href: 'guide-rhinitis.html', description: '생활 증상 외래를 찾을 때 참고할 수 있는 기본 가이드입니다.' },
    ],
    pain: [
      { title: '정형외과·통증 외래 가이드', href: 'guide-ortho.html', description: '통증 진료 전 촬영 기록과 증상 정리에 참고할 수 있습니다.' },
      { title: '비뇨·통증 증상 구분 가이드', href: 'guide-urology.html', description: '통증 위치에 따라 필요한 외래를 구분할 때 참고용으로 확인합니다.' },
    ],
    korean: [
      { title: '비염 한방 진료 전 체크', href: 'guide-rhinitis.html', description: '한방 외래와 이비인후과 방문 전 참고할 포인트를 정리했습니다.' },
      { title: '통증 외래 준비 가이드', href: 'guide-ortho.html', description: '추나·침 상담 전 증상 정리에 도움이 되는 참고 가이드입니다.' },
    ],
    rehab: [
      { title: '재활 전 정형외과 가이드', href: 'guide-ortho.html', description: '수술 후 재활, 도수치료 상담 전 체크할 항목을 정리했습니다.' },
      { title: '만성질환 회복 관리 가이드', href: 'guide-diabetes.html', description: '회복기 생활관리와 추적 외래에 참고할 수 있습니다.' },
    ],
  };

  function buildHospitalProfile(hospital) {
    const departmentId = hospital?.departmentId || inferDepartmentId(hospital);
    const departmentProfile = DEPARTMENT_PROFILES[departmentId] || DEPARTMENT_PROFILES.general;
    const primaryServices = uniqueList([
      ...(departmentProfile.primaryServices || []),
      ...buildEquipmentHighlights(hospital),
    ]).slice(0, 5);

    const visitTargets = uniqueList([
      ...(departmentProfile.visitTargets || []),
      ...buildOperationalTargets(hospital),
    ]).slice(0, 4);

    const documents = uniqueList([
      ...(departmentProfile.documents || []),
      hospital?.hasEmergency ? '응급·중증 증상 여부 메모' : '',
    ]).slice(0, 4);

    const checklist = uniqueList([
      ...(departmentProfile.checklist || []),
      hospital?.saturdayOpen ? '토요일 진료 여부는 주차·접수 마감 시간과 함께 다시 확인하세요.' : '',
      hospital?.nightOpen ? '야간 진료는 접수 마감이 더 빠를 수 있어 전화 확인이 안전합니다.' : '',
      hospital?.parkingCapacity ? `주차 가능 대수는 약 ${hospital.parkingCapacity}대 기준으로 안내될 수 있습니다.` : '',
    ]).slice(0, 4);

    return {
      primaryServices,
      visitTargets,
      documents,
      reservation: departmentProfile.reservation || '방문 전 접수 가능 시간과 필요한 서류를 먼저 확인하는 편이 좋습니다.',
      transport: buildTransportSummary(hospital),
      accessibility: buildAccessibilitySummary(hospital),
      checklist,
      highlightPoints: uniqueList([
        hospital?.saturdayOpen ? '토요일 진료' : '',
        hospital?.sundayOpen ? '일요일 진료' : '',
        hospital?.nightOpen ? '야간 진료' : '',
        Number(hospital?.specialistCount || 0) > 0 ? `전문의 ${hospital.specialistCount}명` : '',
        hospital?.subway ? '대중교통 접근' : '',
        hospital?.parkingCapacity || hospital?.parkingFee ? '주차 정보 확인 가능' : '',
        hospital?.equipment ? '장비 정보 제공' : '',
      ]).slice(0, 6),
    };
  }

  function getRegionalLandingSections() {
    return REGIONAL_LANDING_SECTIONS.slice();
  }

  function getGuideSpotlights() {
    return GUIDE_SPOTLIGHTS.slice();
  }

  function buildGuideRecommendations(hospital) {
    const departmentId = hospital?.departmentId || inferDepartmentId(hospital);
    const selected = GUIDE_RECOMMENDATIONS[departmentId] || GUIDE_RECOMMENDATIONS.general || [];
    return selected.slice(0, 2);
  }

  function buildEquipmentHighlights(hospital) {
    if (!hospital?.equipment) {
      return [];
    }

    return String(hospital.equipment)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => `${item} 보유`);
  }

  function buildOperationalTargets(hospital) {
    const items = [];
    if (hospital?.saturdayOpen) items.push('평일 내원이 어려워 주말 진료가 필요한 경우');
    if (hospital?.nightOpen) items.push('퇴근 후 외래 진료가 필요한 경우');
    if (hospital?.openDate) items.push('개원 시기와 운영 안정성을 함께 보고 싶은 경우');
    return items;
  }

  function buildTransportSummary(hospital) {
    const parts = [];
    if (hospital?.subway) {
      parts.push(hospital.subway);
    } else if (hospital?.address) {
      parts.push(`${hospital.address} 기준 이동 동선을 먼저 확인하세요.`);
    }

    if (hospital?.parkingCapacity) {
      parts.push(`주차 가능 약 ${hospital.parkingCapacity}대`);
    } else if (hospital?.parkingFee) {
      parts.push(`주차 ${hospital.parkingFee}`);
    }

    return parts.join(' / ') || '대중교통과 주차 동선을 방문 전 함께 확인하는 편이 좋습니다.';
  }

  function buildAccessibilitySummary(hospital) {
    const parts = [];
    if (hospital?.parkingFee) parts.push(`주차 ${hospital.parkingFee}`);
    if (hospital?.area) parts.push(`시설 면적 ${hospital.area}`);
    if (!parts.length) {
      parts.push('엘리베이터, 휠체어 접근, 보호자 대기 공간은 방문 전 병원에 직접 확인하는 편이 안전합니다.');
    }
    return parts.join(' / ');
  }

  function inferDepartmentId(hospital) {
    const type = String(hospital?.type || '');
    const department = String(hospital?.department || '');
    if (type.includes('치과') || department.includes('치과')) return 'dental';
    if (type.includes('한의') || department.includes('한의')) return 'korean';
    if (department.includes('정형')) return 'orthopedic';
    if (department.includes('안과')) return 'ophthalmology';
    if (department.includes('피부')) return 'dermatology';
    if (department.includes('이비인후')) return 'ent';
    if (department.includes('소아')) return 'pediatric';
    if (department.includes('산부인과')) return 'obgyn';
    if (department.includes('비뇨')) return 'urology';
    if (department.includes('정신')) return 'psychiatry';
    if (department.includes('성형')) return 'plastic';
    if (department.includes('가정의학')) return 'familymed';
    if (department.includes('통증')) return 'pain';
    if (department.includes('재활')) return 'rehab';
    return 'general';
  }

  function uniqueList(items) {
    return Array.from(new Set((items || []).filter(Boolean)));
  }

  window.HospitalContent = {
    buildHospitalProfile,
    buildGuideRecommendations,
    getRegionalLandingSections,
    getGuideSpotlights,
  };
})();
