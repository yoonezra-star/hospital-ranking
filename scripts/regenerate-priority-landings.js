const fs = require('fs');

const SITE = 'https://hospital-ranking.kr';
const UPDATED = '2026-09-26';
const ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1441018945572157" crossorigin="anonymous"></script>';

const pages = [
  {
    file: 'seoul-dental.html',
    slug: 'seoul-dental',
    title: '서울 치과 병원찾기',
    description: '서울에서 치과를 찾을 때 임플란트, 교정, 보철, 정기검진 목적별로 확인할 기준과 방문 전 질문을 정리했습니다.',
    badge: '서울 치과',
    hero: '서울 치과는 거주지와 직장 동선, 반복 방문 가능성, 치료 목적을 함께 봐야 선택이 쉬워집니다. 임플란트나 교정처럼 기간이 긴 진료는 비용만 보지 말고 촬영, 상담, 사후관리 흐름까지 확인하는 편이 안전합니다.',
    searchKeyword: '서울 치과',
    primaryGuide: { href: '/guide-implant', label: '임플란트 상담 가이드' },
    sections: [
      { title: '서울 치과를 고를 때 먼저 나눌 기준', items: ['정기검진과 스케일링처럼 가까운 생활권이 중요한 진료인지 확인합니다.', '임플란트, 보철, 교정처럼 여러 번 방문하는 치료는 직장·집·대중교통 동선을 함께 봅니다.', '야간이나 토요일 진료가 필요한 경우 접수 마감 시간이 실제로 맞는지 전화로 확인합니다.'] },
      { title: '상담 전에 준비하면 좋은 것', items: ['최근 촬영한 파노라마, CT, 이전 치료기록이 있으면 가져갑니다.', '복용 중인 약, 당뇨·고혈압·골다공증 치료 여부를 미리 정리합니다.', '예상 치료 기간, 내원 횟수, 임시치아 가능 여부를 질문 목록에 적어둡니다.'] },
      { title: '비교할 때 놓치기 쉬운 항목', items: ['총비용에 촬영, 임시치아, 보철, 유지관리 비용이 포함되는지 확인합니다.', '발치 후 바로 치료가 가능한지, 뼈이식이 필요한지 설명을 듣습니다.', '치료 후 문제가 생겼을 때 재내원 기준과 연락 방법을 확인합니다.'] }
    ],
    checklistTitle: '서울 치과 검색 예시',
    checklist: ['서울 임플란트', '강남 치과 토요일', '마포 치과 야간', '송파 치과 주차'],
    faq: [
      ['서울 치과는 거리와 비용 중 무엇을 먼저 봐야 하나요?', '반복 방문이 필요한 치료라면 거리와 진료 가능 시간을 먼저 보고, 이후 촬영·치료 계획·비용 설명을 비교하는 것이 좋습니다.'],
      ['임플란트 상담 전 꼭 확인할 것은 무엇인가요?', '잇몸뼈 상태, 뼈이식 필요성, 보철 종류, 총 내원 횟수, 사후관리 기준을 함께 확인하는 것이 좋습니다.'],
      ['토요일 치과는 바로 진료가 가능한가요?', '토요일은 접수 마감이 빠르거나 예약 위주인 경우가 많아 방문 전 전화 확인이 필요합니다.']
    ],
    related: ['guide-implant.html', 'parking-dental.html', 'saturday-implant.html', 'gyeonggi-dental.html']
  },
  {
    file: 'night-clinic.html',
    slug: 'night-clinic',
    title: '야간 진료 병원 찾기 가이드',
    description: '퇴근 후 야간 진료 병원을 찾을 때 마지막 접수 시간, 실제 진료 범위, 응급 여부를 구분하는 기준을 정리했습니다.',
    badge: '야간 진료',
    hero: '야간 진료는 “운영 중” 표시보다 마지막 접수 시간과 실제 가능한 진료 범위가 더 중요합니다. 단순 외래인지, 검사나 처치까지 가능한지, 응급실을 가야 하는 상황인지를 먼저 구분해야 시간을 줄일 수 있습니다.',
    searchKeyword: '야간 진료',
    primaryGuide: { href: '/guide', label: '건강가이드 모음' },
    sections: [
      { title: '야간 병원 검색 전 판단할 것', items: ['증상이 급한지, 다음날 외래로 봐도 되는지 먼저 구분합니다.', '통증, 발열, 호흡곤란, 출혈처럼 악화 가능성이 있으면 응급 안내를 우선 확인합니다.', '검사나 처치가 필요한 경우 야간에 해당 장비와 인력이 운영되는지 확인합니다.'] },
      { title: '전화로 꼭 확인할 항목', items: ['마지막 접수 시간이 진료 종료 시간보다 얼마나 빠른지 확인합니다.', '초진 접수가 가능한지, 예약 환자만 받는지 확인합니다.', '소아, 치과, 피부과, 정형외과처럼 원하는 진료과가 실제 야간에 열려 있는지 확인합니다.'] },
      { title: '방문 동선 체크', items: ['퇴근 후 이동 시간을 고려해 접수 마감 20~30분 전 도착 가능한지 봅니다.', '주차 가능 여부와 야간 출입구 위치를 확인합니다.', '검사 후 귀가가 어려울 수 있으면 보호자 동행이나 대중교통 막차 시간을 확인합니다.'] }
    ],
    checklistTitle: '야간 진료 검색 예시',
    checklist: ['강남 피부과 야간', '서울 정형외과 야간', '소아과 야간 진료', '치과 야간 진료'],
    faq: [
      ['야간 진료와 응급실은 어떻게 구분하나요?', '야간 외래는 비교적 안정적인 증상 상담에 적합하고, 호흡곤란·의식저하·심한 흉통·출혈 등은 응급실이나 119 안내가 우선입니다.'],
      ['지도에 영업 중이면 바로 방문해도 되나요?', '의료기관은 접수 마감이 따로 있을 수 있어 영업 중 표시만 믿지 말고 전화 확인을 권장합니다.'],
      ['야간에 검사가 가능한지도 알 수 있나요?', '검사 가능 여부는 병원별로 달라서 전화로 해당 검사명과 가능 시간을 직접 확인해야 합니다.']
    ],
    verification: {
      title: '오늘 밤 방문 전 3분 확인',
      lead: '야간 운영시간은 진료 종료 시각과 접수 마감 시각이 다를 수 있습니다. 아래 항목을 한 번에 물으면 헛걸음을 줄일 수 있습니다.',
      checks: [
        ['날짜와 도착 시각', '“오늘(방문 날짜) 오후 8시쯤 도착합니다”처럼 날짜와 예상 도착 시각을 함께 말합니다.'],
        ['초진과 접수 마감', '초진 접수가 가능한지, 마지막 접수가 몇 시인지 확인합니다.'],
        ['검사와 처치 범위', '필요한 검사·촬영·수액·처치가 야간에도 가능한지 구체적으로 묻습니다.'],
        ['야간 출입 동선', '야간 출입구, 주차장 운영, 원내 약국 또는 인근 약국 이용 가능 여부를 확인합니다.']
      ],
      callScript: '안녕하세요. 오늘 오후 8시쯤 초진으로 방문하려고 합니다. 현재 증상은 ○○이고, 마지막 접수 시각과 ○○ 검사 또는 처치 가능 여부를 확인하고 싶습니다.',
      caution: '야간 외래 정보는 응급실 수용 가능 여부와 다릅니다. 심한 흉통, 호흡곤란, 의식 변화, 멈추지 않는 출혈처럼 긴급한 증상은 119 또는 응급의료 안내를 우선 이용하세요.'
    },
    related: ['night-dermatology.html', 'saturday-clinic.html', 'sunday-clinic.html', 'guide-ortho.html']
  },
  {
    file: 'saturday-clinic.html',
    slug: 'saturday-clinic',
    title: '토요일 진료 병원 찾기 가이드',
    description: '토요일 병원 방문 전 접수 마감, 오전 진료 여부, 자주 찾는 진료과와 준비물을 확인하는 기준을 정리했습니다.',
    badge: '토요일 진료',
    hero: '토요일 진료는 평일보다 접수 시간이 짧고 대기자가 몰리기 쉽습니다. 특히 소아과, 이비인후과, 치과, 정형외과는 오전 접수 마감이 빠를 수 있어 방문 목적과 시간 확인이 중요합니다.',
    searchKeyword: '토요일 진료',
    primaryGuide: { href: '/guide', label: '진료 준비 가이드' },
    sections: [
      { title: '토요일에 많이 찾는 상황', items: ['평일에 시간을 내기 어려워 정기 진료나 검진을 몰아서 보려는 경우', '아이 발열, 기침, 비염처럼 주말 전에 확인하고 싶은 증상이 있는 경우', '치과 통증, 허리·무릎 통증처럼 월요일까지 기다리기 어려운 경우'] },
      { title: '방문 전 확인할 항목', items: ['토요일은 오전만 진료하는 병원이 많아 접수 마감 시간을 먼저 확인합니다.', '초진 접수와 검사 가능 여부가 평일과 같은지 확인합니다.', '건강검진, 예방접종, 물리치료처럼 별도 예약이 필요한 항목인지 확인합니다.'] },
      { title: '대기 시간을 줄이는 방법', items: ['증상 시작일, 복용약, 이전 검사 결과를 미리 정리합니다.', '가능하면 진료 시작 직후나 접수 마감 전 여유 있게 도착합니다.', '가족 여러 명이 함께 방문하는 경우 각각 필요한 진료과를 미리 나눠 확인합니다.'] }
    ],
    checklistTitle: '토요일 진료 검색 예시',
    checklist: ['토요일 소아과', '토요일 치과', '토요일 정형외과', '토요일 내과'],
    faq: [
      ['토요일 진료 시간은 평일과 같나요?', '대부분 평일보다 짧거나 오전 중심으로 운영되므로 병원별 접수 마감 시간을 직접 확인해야 합니다.'],
      ['토요일에도 검진이나 예방접종이 가능한가요?', '가능한 병원도 있지만 예약제인 경우가 많아 검사명이나 접종명을 말하고 확인하는 것이 좋습니다.'],
      ['토요일에 대기 시간이 긴 이유는 무엇인가요?', '평일 방문이 어려운 이용자가 몰리고 운영 시간이 짧아 대기가 길어질 수 있습니다.']
    ],
    verification: {
      title: '이번 토요일 방문 전 확인 순서',
      lead: '토요일은 오전 진료만 하거나 검사·예방접종·물리치료 접수를 더 일찍 마치는 곳이 있습니다. 방문 목적을 먼저 말하고 항목별로 확인하세요.',
      checks: [
        ['정확한 날짜', '이번 주 토요일의 날짜를 말해 임시 휴진이나 일정 변경이 없는지 확인합니다.'],
        ['초진·재진 구분', '처음 방문인지 재진인지 말하고 각각의 접수 마감 시각을 묻습니다.'],
        ['방문 목적', '일반 진료인지, 예방접종·검진·촬영·물리치료인지 말해 해당 업무가 가능한지 확인합니다.'],
        ['아이 또는 보호자 동행', '소아 진료는 아이의 나이와 증상을, 보호자 동행이 필요한 검사는 귀가 방법까지 함께 확인합니다.']
      ],
      callScript: '안녕하세요. 이번 토요일에 초진으로 방문하려고 합니다. ○○ 진료(또는 검사·예방접종)가 가능한지, 마지막 접수 시각과 예약 필요 여부를 알려주세요.',
      caution: '공공 데이터에 토요일 시간이 표시되어도 임시 휴진, 의료진 일정, 접수 조기 마감은 즉시 반영되지 않을 수 있습니다. 당일 출발 전에 다시 확인하는 것이 안전합니다.'
    },
    related: ['sunday-clinic.html', 'saturday-implant.html', 'sunday-pediatric.html', 'vaccination-clinic.html']
  },
  {
    file: 'sunday-clinic.html',
    slug: 'sunday-clinic',
    title: '일요일 진료 병원 찾기 가이드',
    description: '일요일 병원 방문 전 당일 운영 여부, 접수 마감, 진료과와 검사 가능 범위를 확인하는 실용 기준을 정리했습니다.',
    badge: '일요일 진료',
    hero: '일요일 진료 표시는 해당 날짜의 실제 외래 운영을 보증하지 않습니다. 주말 당직, 공휴일 일정, 의료진 배치에 따라 시간이 달라질 수 있으므로 후보를 찾은 뒤 당일 전화 확인까지 해야 검색이 완료됩니다.',
    searchKeyword: '일요일 진료',
    primaryGuide: { href: '/guide', label: '휴일 진료 준비 가이드' },
    sections: [
      { title: '일요일 검색에서 먼저 구분할 것', items: ['찾는 날짜가 일반 일요일인지 연휴·공휴일과 겹치는지 확인합니다.', '소아과·내과·이비인후과 등 필요한 진료과가 그날 실제 운영되는지 확인합니다.', '가벼운 외래 증상인지 응급 평가가 필요한 상황인지 먼저 구분합니다.'] },
      { title: '방문 전 확인할 항목', items: ['당일 초진 접수 가능 여부와 마지막 접수 시각을 확인합니다.', '검사, 처치, 예방접종, 처방전 발급이 가능한지 방문 목적을 말하고 묻습니다.', '주말 가산 비용, 주차장과 출입구, 주변 약국 운영 여부를 확인합니다.'] },
      { title: '후보가 없을 때 대처', items: ['검색 지역을 인접 시·군·구까지 넓혀 다시 찾습니다.', '병원 공식 안내와 응급의료포털 등 공식 경로를 함께 대조합니다.', '증상이 악화되거나 긴급하면 일반 외래 검색을 중단하고 119 또는 응급실 안내를 따릅니다.'] }
    ],
    checklistTitle: '일요일 진료 검색 예시',
    checklist: ['일요일 소아과', '일요일 내과', '일요일 이비인후과', '일요일 치과'],
    faq: [
      ['일요일 진료 표시가 있으면 바로 방문해도 되나요?', '아닙니다. 해당 날짜의 의료진 일정과 접수 마감이 달라질 수 있어 출발 전 전화 확인이 필요합니다.'],
      ['일요일과 공휴일 운영은 같은가요?', '병원마다 다릅니다. 일요일 운영 병원도 법정공휴일이나 연휴에는 휴진할 수 있으므로 정확한 날짜로 확인해야 합니다.'],
      ['일요일에도 검사와 처방이 가능한가요?', '진료는 가능해도 검사실이나 장비 운영이 제한될 수 있습니다. 필요한 검사명과 처방 가능 여부를 전화로 확인하세요.']
    ],
    verification: {
      title: '일요일 당일 전화 확인 순서',
      lead: '주말 운영은 같은 병원이라도 날짜마다 달라질 수 있습니다. “일요일에 하나요?”보다 방문 날짜와 목적을 구체적으로 말해야 정확한 답을 받을 수 있습니다.',
      checks: [
        ['날짜 확인', '방문하려는 연·월·일을 말하고 정상 진료인지 당직 진료인지 확인합니다.'],
        ['환자 정보', '성인·소아 여부, 아이의 나이, 초진·재진 여부를 먼저 알립니다.'],
        ['진료 범위', '증상과 필요한 진료과를 말하고 검사·처치·처방이 가능한지 묻습니다.'],
        ['대체 기관', '접수가 끝났다면 같은 지역의 이용 가능한 기관이나 공식 안내 경로가 있는지 확인합니다.']
      ],
      callScript: '안녕하세요. 오늘(날짜) 일요일에 ○○ 증상으로 초진 방문하려고 합니다. 해당 진료과가 운영되는지, 마지막 접수 시각과 검사·처방 가능 여부를 확인하고 싶습니다.',
      caution: '검색 결과에 병원이 보이는 것과 오늘 실제 진료를 받을 수 있는 것은 다릅니다. 전화 연결이 되지 않으면 운영을 추정하지 말고 다른 공식 안내 경로와 인근 기관을 확인하세요.'
    },
    related: ['saturday-clinic.html', 'sunday-pediatric.html', 'night-clinic.html', 'guide.html']
  },
  {
    file: 'new-openings.html',
    slug: 'new-openings',
    title: '신규 개원 병원 찾기 가이드',
    description: '새로 개원한 병원을 찾을 때 진료과, 장비, 운영시간, 후기 부족 상황에서 확인할 기준을 정리했습니다.',
    badge: '신규 개원',
    hero: '신규 개원 병원은 시설과 접근성이 장점일 수 있지만 후기와 운영 정보가 충분하지 않을 수 있습니다. 그래서 개원 시점보다 진료과 적합성, 의료진 설명, 검사 가능 범위, 예약 흐름을 함께 보는 것이 좋습니다.',
    searchKeyword: '신규 개원 병원',
    primaryGuide: { href: '/guide', label: '건강가이드 모음' },
    sections: [
      { title: '신규 개원 병원을 볼 때 장점', items: ['새 장비와 쾌적한 대기 공간을 기대할 수 있습니다.', '예약 흐름이 비교적 빠르게 잡히는 경우가 있습니다.', '생활권에 새로 생긴 병원이라 반복 방문 동선이 편할 수 있습니다.'] },
      { title: '후기가 적을 때 확인할 기준', items: ['의료진의 진료과, 주요 진료 항목, 검사 가능 범위를 확인합니다.', '초진 상담에서 진단과 치료 계획을 충분히 설명하는지 봅니다.', '비급여 항목과 추가 비용 설명이 명확한지 확인합니다.'] },
      { title: '방문 전 체크', items: ['개원 초기에는 운영시간이 바뀔 수 있어 전화 확인이 필요합니다.', '지도 등록 주소와 실제 출입구, 주차장이 일치하는지 확인합니다.', '검사 장비나 처치 가능 범위가 아직 준비 중인지 확인합니다.'] }
    ],
    checklistTitle: '신규 개원 검색 예시',
    checklist: ['강남 신규 개원 병원', '신규 개원 치과', '신규 개원 피부과', '새로 생긴 소아과'],
    faq: [
      ['신규 개원 병원은 후기가 적어도 방문해도 되나요?', '후기 수만으로 판단하기보다 진료과 적합성, 설명 방식, 비용 안내, 검사 가능 범위를 직접 확인하는 것이 좋습니다.'],
      ['개원일 정보는 항상 정확한가요?', '공공 데이터나 등록 정보 반영 시점에 차이가 있을 수 있어 실제 운영 여부는 병원에 직접 확인해야 합니다.'],
      ['신규 병원은 비용이 더 저렴한가요?', '병원별 정책과 진료 항목에 따라 다르므로 비용 우위를 단정할 수 없습니다. 상담 시 항목별 비용을 확인하세요.']
    ],
    verification: {
      title: '개원일보다 먼저 확인할 네 가지',
      lead: '공공 데이터의 개설일은 행정상 신고 정보이며 현재 운영 상태, 의료 품질, 시설 완비를 뜻하지 않습니다. 새 병원이라는 이유만으로 추천하거나 우선순위를 높이지 않습니다.',
      checks: [
        ['현재 운영 여부', '기관명과 주소를 대조하고 실제 진료를 시작했는지 확인합니다.'],
        ['진료과와 의료진', '필요한 진료과가 등록되어 있는지와 방문일 담당 의료진 일정을 확인합니다.'],
        ['검사·장비 준비', '원하는 검사나 처치가 현재 가능한지, 외부 의뢰가 필요한지 묻습니다.'],
        ['예약과 비용 안내', '초진 예약 방식, 예상 대기, 비급여 항목과 추가 비용 안내 방식을 확인합니다.']
      ],
      callScript: '안녕하세요. ○○ 진료로 처음 방문하려고 합니다. 현재 정상 진료 중인지, ○○ 검사 또는 처치가 가능한지, 초진 예약과 비용 안내 방법을 확인하고 싶습니다.',
      caution: '개설일은 병원 선택의 품질 점수나 추천 순위가 아닙니다. 후기 수가 적다는 이유만으로 좋고 나쁨을 판단하지 말고 진료 적합성과 설명 내용을 직접 확인하세요.'
    },
    related: ['seoul-dental.html', 'night-clinic.html', 'saturday-clinic.html', 'about.html']
  },
  {
    file: 'manual-therapy-clinic.html',
    slug: 'manual-therapy-clinic',
    title: '도수치료 병원 찾기 가이드',
    description: '도수치료 병원을 찾을 때 통증 위치, 의사 진단, 치료 목표, 반복 방문 가능성과 비용 확인 기준을 정리했습니다.',
    badge: '도수치료 병원',
    hero: '도수치료는 단순히 “마사지처럼 받는 치료”가 아니라, 의사 진단과 기능 평가를 바탕으로 치료 목표를 정해야 합니다. 통증 위치, 악화 동작, 영상검사 이력, 반복 방문 가능성을 함께 정리하면 상담이 훨씬 구체적입니다.',
    searchKeyword: '도수치료 병원',
    primaryGuide: { href: '/guide-manual-therapy', label: '도수치료 상담 가이드' },
    sections: [
      { title: '도수치료 상담 전 구분할 것', items: ['목·허리·어깨·무릎 중 어느 부위가 문제인지 명확히 정리합니다.', '가만히 있을 때 아픈지, 특정 동작에서 아픈지 구분합니다.', '저림, 감각저하, 근력저하가 있으면 반드시 함께 알립니다.'] },
      { title: '병원 비교 기준', items: ['의사 진단 후 치료 계획이 세워지는지 확인합니다.', '도수치료 횟수, 예상 기간, 중간 평가 기준을 설명하는지 봅니다.', '운동교육, 자세 교정, 생활관리 안내가 함께 제공되는지 확인합니다.'] },
      { title: '비용과 일정 확인', items: ['도수치료는 반복 방문이 필요한 경우가 많아 요일과 시간대를 현실적으로 봐야 합니다.', '회당 비용, 예상 횟수, 보험 적용 여부를 상담 시 확인합니다.', '통증이 악화될 때 중단하거나 재평가하는 기준을 물어봅니다.'] }
    ],
    checklistTitle: '도수치료 검색 예시',
    checklist: ['서울 도수치료 병원', '허리 도수치료', '토요일 도수치료', '정형외과 도수치료'],
    faq: [
      ['도수치료는 누구에게나 필요한가요?', '아닙니다. 통증 원인과 상태에 따라 적합하지 않을 수 있어 의사 진단과 평가가 먼저 필요합니다.'],
      ['몇 회 정도 받아야 하나요?', '상태와 목표에 따라 다르므로 초기 상담에서 평가 시점과 예상 횟수를 물어보는 것이 좋습니다.'],
      ['영상검사 자료가 꼭 필요한가요?', '항상 필요한 것은 아니지만 기존 MRI, X-ray, 수술 이력이 있으면 치료 계획을 세우는 데 도움이 됩니다.']
    ],
    related: ['guide-manual-therapy.html', 'seoul-rehab.html', 'seoul-pain.html', 'guide-ortho.html']
  }
];

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function list(items) {
  return items.map((item) => `<li>${esc(item)}</li>`).join('\n');
}

function actionLinks(page) {
  const keyword = encodeURIComponent(page.searchKeyword);
  return `<a href="/?keyword=${keyword}#search-results" class="btn btn-primary">${esc(page.searchKeyword)} 검색</a>\n        <a href="${esc(page.primaryGuide.href)}" class="btn btn-outline">${esc(page.primaryGuide.label)}</a>`;
}

function relatedLinks(page) {
  return page.related.map((href) => `<a href="/${esc(href.replace(/\.html$/, ''))}">${esc(labelFor(href))}</a>`).join('\n');
}

function verificationSection(page) {
  if (!page.verification) return '';
  const checks = page.verification.checks.map(([label, description]) => `<li><strong>${esc(label)}</strong><span>${esc(description)}</span></li>`).join('\n');
  return `<section class="intent-note operation-verification">
      <span class="intent-kicker">방문 전 확인 도구</span>
      <h2>${esc(page.verification.title)}</h2>
      <p class="intent-verification-lead">${esc(page.verification.lead)}</p>
      <ol class="intent-verification-list">${checks}</ol>
      <div class="intent-call-script">
        <strong>전화할 때 그대로 읽어보세요</strong>
        <p>${esc(page.verification.callScript)}</p>
      </div>
      <p class="intent-caution"><strong>주의:</strong> ${esc(page.verification.caution)}</p>
    </section>`;
}

function decisionSteps(page) {
  return [
    `검색어를 '${page.searchKeyword}'처럼 입력해 지역·진료 목적에 맞는 결과부터 확인합니다.`,
    `목록에서는 주소와 진료과를 먼저 보고, ${page.sections[0].items[0].toLowerCase()}`,
    `전화로 '${page.faq[0][0]}'에 대한 답을 확인하고 접수 마감·초진 가능 여부를 함께 기록합니다.`,
    '방문 전 기관명과 주소를 건강보험심사평가원 건강지도에서 다시 대조하고, 변경된 정보는 문의로 알려주세요.'
  ];
}

function labelFor(href) {
  const labels = {
    'guide-implant.html': '임플란트 가이드',
    'parking-dental.html': '주차 가능한 치과',
    'saturday-implant.html': '토요일 임플란트',
    'gyeonggi-dental.html': '경기 치과 찾기',
    'night-dermatology.html': '야간 피부과',
    'saturday-clinic.html': '토요일 진료',
    'sunday-clinic.html': '일요일 진료',
    'guide-ortho.html': '정형외과 가이드',
    'sunday-pediatric.html': '일요일 소아과',
    'vaccination-clinic.html': '예방접종 병원',
    'seoul-dental.html': '서울 치과',
    'night-clinic.html': '야간 진료',
    'about.html': '운영 기준',
    'guide-manual-therapy.html': '도수치료 가이드',
    'seoul-rehab.html': '서울 재활의학과',
    'seoul-pain.html': '서울 통증의학과',
    'guide.html': '건강가이드 모음'
  };
  return labels[href] || href.replace(/\.html$/, '').replace(/-/g, ' ');
}

function schemaFor(page) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: page.title,
      url: `${SITE}/${page.slug}`,
      description: page.description,
      dateModified: UPDATED,
      publisher: { '@type': 'Organization', name: '병원찾기', url: SITE }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '병원찾기', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: page.title, item: `${SITE}/${page.slug}` }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      }))
    }
  ];
}

function render(page) {
  const schemas = schemaFor(page).map((schema) => `  <script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(page.title)} - 병원찾기</title>
  <meta name="description" content="${esc(page.description)}">
  <link rel="canonical" href="${SITE}/${page.slug}">
  <meta name="robots" content="index,follow">
  <link rel="stylesheet" href="css/style.css?v=13">
  <style>
    .intent-howto ol { margin:0; padding-left:22px; display:grid; gap:10px; }
    .intent-howto li { color:var(--text-body); line-height:1.78; }
    .intent-source-note { margin:18px 0 0; padding-top:15px; border-top:1px solid var(--border-light); color:var(--text-muted); line-height:1.75; }
    .intent-kicker { display:block; margin-bottom:8px; color:var(--primary); font-size:.82rem; font-weight:900; letter-spacing:.08em; }
    .intent-verification-lead { margin:0 0 18px; color:var(--text-body); line-height:1.8; }
    .intent-verification-list { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; counter-reset:verify; }
    .intent-verification-list li { counter-increment:verify; display:grid; grid-template-columns:34px 1fr; column-gap:11px; align-items:start; padding:15px; border:1px solid var(--border-light); border-radius:15px; background:var(--bg-body); }
    .intent-verification-list li::before { content:counter(verify); display:grid; place-items:center; width:30px; height:30px; border-radius:50%; background:var(--primary); color:white; font-weight:900; }
    .intent-verification-list strong, .intent-verification-list span { grid-column:2; }
    .intent-verification-list span { margin-top:4px; color:var(--text-body); line-height:1.68; }
    .intent-call-script { margin-top:18px; padding:18px; border-radius:16px; background:color-mix(in srgb, var(--primary-50) 72%, var(--bg-card)); border:1px solid var(--border-default); }
    .intent-call-script p { margin:8px 0 0; color:var(--text-body); line-height:1.78; }
    .intent-caution { margin:16px 0 0; color:var(--text-muted); line-height:1.75; }
    .intent-page { max-width: 1120px; padding-top: 56px; }
    .intent-hero { padding: 38px; border: 1px solid var(--border-default); border-radius: 28px; background: radial-gradient(circle at 88% 10%, rgba(166, 124, 82, .18), transparent 30%), linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 88%, white 12%), color-mix(in srgb, var(--bg-body) 92%, white 8%)); box-shadow: var(--shadow-sm); }
    .intent-badge { display:inline-flex; padding:8px 14px; border-radius:999px; background:color-mix(in srgb, var(--primary-50) 72%, white 28%); color:var(--primary); font-weight:800; }
    .intent-hero h1 { margin:16px 0 14px; font-size:clamp(2.1rem, 4vw, 3.3rem); letter-spacing:-.04em; }
    .intent-hero p { max-width:820px; color:var(--text-body); line-height:1.85; font-size:1.06rem; }
    .intent-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:22px; }
    .intent-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:20px; margin-top:26px; }
    .intent-card, .intent-note, .intent-faq { border:1px solid var(--border-default); border-radius:22px; background:var(--bg-card); box-shadow:var(--shadow-xs); padding:24px; }
    .intent-card h2, .intent-note h2, .intent-faq h2 { margin:0 0 13px; font-size:1.24rem; }
    .intent-card ul, .intent-note ul { list-style:disc; margin:0; padding-left:20px; display:grid; gap:9px; }
    .intent-card li, .intent-note li, .intent-faq p { color:var(--text-body); line-height:1.78; }
    .intent-note { margin-top:24px; }
    .intent-chip-row, .intent-link-row { display:flex; flex-wrap:wrap; gap:10px; }
    .intent-chip-row span, .intent-link-row a { display:inline-flex; align-items:center; min-height:40px; padding:8px 13px; border-radius:999px; border:1px solid var(--border-default); background:var(--bg-body); color:var(--text-heading); font-weight:700; text-decoration:none; }
    .intent-faq details { border-top:1px solid var(--border-light); padding:14px 0; }
    .intent-faq details:first-of-type { border-top:0; }
    .intent-faq summary { cursor:pointer; color:var(--text-heading); font-weight:800; line-height:1.55; }
    .intent-faq p { margin:10px 0 0; }
    @media (max-width: 768px) { .intent-page { padding-top:40px; } .intent-hero, .intent-card, .intent-note, .intent-faq { padding:22px 18px; } .intent-verification-list { grid-template-columns:1fr; } }
  </style>
${schemas}
  ${ADSENSE}
</head>
<body class="light-mode">
  <header class="header" id="header" style="position:static; border-bottom:1px solid var(--border-default);">
    <div class="header-inner">
      <a href="/" class="logo"><span class="logo-icon">H</span><span class="gradient-text">병원찾기</span></a>
      <nav class="nav-links">
        <a href="/#search-results">병원목록</a>
        <a href="/guide">건강가이드</a>
        <a href="/about">사이트 소개</a>
        <a href="/contact">문의</a>
      </nav>
    </div>
  </header>

  <main class="container intent-page">
    <section class="intent-hero">
      <span class="intent-badge">${esc(page.badge)}</span>
      <h1>${esc(page.title)}</h1>
      <p>${esc(page.hero)}</p>
      <div class="intent-actions">
        ${actionLinks(page)}
      </div>
    </section>

    <section class="intent-grid">
      ${page.sections.map((section) => `<article class="intent-card">
        <h2>${esc(section.title)}</h2>
        <ul>${list(section.items)}</ul>
      </article>`).join('\n')}
    </section>

    <section class="intent-note intent-howto">
      <h2>검색 결과를 방문 판단으로 바꾸는 순서</h2>
      <ol>${decisionSteps(page).map((item) => `<li>${esc(item)}</li>`).join('\n')}</ol>
      <p class="intent-source-note">이 페이지는 검색 결과를 대신해 특정 병원을 추천하거나 순위를 보증하지 않습니다. 결과의 운영 상태와 진료 가능 범위는 병원과 공식 기관에서 최종 확인해야 합니다.</p>
    </section>

    ${verificationSection(page)}

    <section class="intent-note">
      <h2>${esc(page.checklistTitle)}</h2>
      <div class="intent-chip-row">
        ${page.checklist.map((item) => `<span>${esc(item)}</span>`).join('\n')}
      </div>
    </section>

    <section class="intent-faq intent-note">
      <h2>자주 묻는 질문</h2>
      ${page.faq.map(([q, a], index) => `<details${index === 0 ? ' open' : ''}>
        <summary>${esc(q)}</summary>
        <p>${esc(a)}</p>
      </details>`).join('\n')}
    </section>

    <section class="intent-note">
      <h2>함께 보면 좋은 페이지</h2>
      <div class="intent-link-row">
        ${relatedLinks(page)}
        <a href="/#search-results">병원 검색하기</a>
      </div>
    </section>

    <section class="intent-note">
      <h2>의료 정보 안내</h2>
      <ul>
        <li>이 페이지는 병원 선택 전 비교 기준을 정리한 참고용 정보입니다.</li>
        <li>진료 가능 여부, 접수 마감, 비용, 검사 가능 범위는 병원 사정에 따라 달라질 수 있으므로 방문 전 직접 확인해 주세요.</li>
        <li>응급 증상이나 급격한 증상 악화는 온라인 검색보다 119, 응급실, 해당 병원의 직접 안내가 우선입니다.</li>
        <li>정보 정정 요청은 replyleaders@naver.com 으로 접수합니다. 최종 점검일: ${UPDATED}</li>
      </ul>
    </section>

    <section class="intent-note">
      <h2>공식 확인 경로</h2>
      <p>이 페이지는 병원 선택 기준을 정리한 참고 자료입니다. 의료기관의 최신 운영 여부와 진료 가능 범위는 방문 전 병원에 확인하고, 기관 정보는 <a href="https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030501000000" rel="external noopener" target="_blank">건강보험심사평가원 건강지도</a>에서도 대조해 주세요.</p>
    </section>
  </main>

  <footer class="footer">
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
        <p>본 사이트의 정보는 참고용이며, 실제 진단과 치료 결정은 반드시 해당 병원 또는 의료진과 직접 상담해 주세요.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

for (const page of pages) {
  fs.writeFileSync(page.file, render(page), 'utf8');
}
console.log(`Generated ${pages.length} priority landing pages`);
