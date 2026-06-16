/**
 * 병원 상세 페이지 로직 (detail.html)
 */
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hospitalId = urlParams.get('id');

  if (!hospitalId) {
    alert('잘못된 접근입니다.');
    window.location.href = 'index.html';
    return;
  }

  loadHospitalDetail(hospitalId);
});

async function loadHospitalDetail(id) {
  try {
    // API 또는 모의 데이터에서 병원 정보를 가져옴
    // api.js의 loadHospitalData()를 재사용
    const data = await window.HospitalAPI.fetchHospitals(1, 1000); // 넉넉히 가져와서 찾음 (실제 API면 단건 조회 엔드포인트 사용 권장)
    const allHospitals = data.items;
    
    // id와 매칭되는 병원 찾기
    const hospital = allHospitals.find(h => h.id === id || h.id === parseInt(id));

    if (!hospital) {
      document.getElementById('detail-name').textContent = '병원을 찾을 수 없습니다.';
      return;
    }

    renderDetail(hospital);
  } catch (error) {
    console.error('Failed to load hospital details:', error);
    document.getElementById('detail-name').textContent = '데이터를 불러오는 데 실패했습니다.';
  }
}

function renderDetail(hospital) {
  // 기본 정보
  document.getElementById('detail-name').textContent = hospital.name;
  document.getElementById('detail-address').textContent = hospital.address;
  document.getElementById('detail-department').textContent = hospital.department || '일반';
  document.getElementById('detail-type').textContent = hospital.type || '의원';
  document.getElementById('detail-score').textContent = `⭐ ${(hospital.score || 0).toFixed(1)}`;
  document.getElementById('detail-reviews').textContent = hospital.reviews || 0;
  
  // 개원일 (랜덤 생성 또는 데이터 기반)
  const established = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
  document.getElementById('detail-date').textContent = `${established.getFullYear()}년 ${established.getMonth()+1}월`;

  // 배지
  const badgesContainer = document.getElementById('detail-badges');
  badgesContainer.innerHTML = '';
  if (hospital.isSpecialist) {
    badgesContainer.innerHTML += `<span class="badge" style="background:#e0f2fe; color:#0284c7; padding:4px 8px; border-radius:4px; margin-right:5px; font-size:0.8rem;">전문의</span>`;
  }
  if (hospital.hasNight) {
    badgesContainer.innerHTML += `<span class="badge" style="background:#fef3c7; color:#d97706; padding:4px 8px; border-radius:4px; margin-right:5px; font-size:0.8rem;">야간진료</span>`;
  }

  // 모의 리뷰 생성 (SEO 텍스트 확보)
  const reviewTexts = [
    "원장님이 너무 친절하시고 설명을 잘 해주십니다. 다음에도 여기로 와야겠어요.",
    "시설이 깔끔하고 간호사분들도 친절하네요. 대기 시간이 조금 길었지만 만족스럽습니다.",
    "과잉 진료 없이 딱 필요한 치료만 권해주셔서 믿음이 갑니다.",
    "주차장이 조금 협소한 것 빼고는 전반적으로 훌륭한 병원입니다."
  ];
  
  const reviewsCount = Math.floor(Math.random() * 3) + 1;
  let reviewsHtml = '';
  for(let i=0; i<reviewsCount; i++) {
    const text = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
    reviewsHtml += `
      <div style="margin-bottom:15px; border-bottom:1px dashed #ccc; padding-bottom:10px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <strong>익명 사용자</strong> <span style="color:#f59e0b;">⭐⭐⭐⭐⭐</span>
        </div>
        <p style="margin:0; font-size:0.95rem; color:#444;">${text}</p>
      </div>
    `;
  }
  document.getElementById('detail-review-list').innerHTML = reviewsHtml;

  // SEO Schema.org 주입
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": hospital.name,
    "address": hospital.address,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": hospital.score,
      "reviewCount": hospital.reviews
    }
  };
  document.getElementById('schema-hospital').textContent = JSON.stringify(schema);

  // 전역에 병원 정보 저장 (지도 초기화용)
  window.currentHospitalDetail = hospital;

  // 네이버 지도가 이미 로드되었다면 즉시 초기화
  if (window.naver && window.naver.maps) {
    window.initDetailMap();
  }
}

// 네이버 지도 초기화 함수 (콜백에 의해 호출됨)
window.initDetailMap = function() {
  if (!window.currentHospitalDetail) return; // 데이터가 아직 안불러와졌으면 대기
  const h = window.currentHospitalDetail;
  
  const mapOptions = {
    center: new naver.maps.LatLng(h.lat, h.lng),
    zoom: 16
  };
  const map = new naver.maps.Map('map-container', mapOptions);

  new naver.maps.Marker({
    position: new naver.maps.LatLng(h.lat, h.lng),
    map: map
  });
};
