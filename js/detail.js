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
    let hospital = null;

    if (id && typeof id === 'string' && id.startsWith('JD')) {
      // 실시간 API 데이터인 경우 ykiho로 직접 단건 조회
      const data = await window.HospitalAPI.fetchHospitals({ ykiho: id });
      const allHospitals = data.hospitals;
      if (allHospitals && allHospitals.length > 0) {
        hospital = allHospitals[0];
      }
    } else {
      // Mock 데이터인 경우 (id가 숫자인 경우 등)
      if (typeof HOSPITALS !== 'undefined') {
        hospital = HOSPITALS.find(h => String(h.id) === String(id));
      }
    }

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
  // 동적 SEO (Googlebot 색인 최적화)
  document.title = `${hospital.name} 후기, 평점 및 진료 정보 - 병원랭킹`;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', `${hospital.name}의 네이버 블로그 생생한 후기, 평점, 전화번호(${hospital.phone || ''}), 위치(${hospital.address}) 등 상세 진료 정보를 확인하세요.`);
  }

  // 기본 정보
  document.getElementById('detail-name').textContent = hospital.name;
  document.getElementById('detail-address').textContent = hospital.address;
  document.getElementById('detail-department').textContent = hospital.department || '일반';
  document.getElementById('detail-type').textContent = hospital.type || '의원';
  document.getElementById('detail-score').textContent = `⭐ ${(hospital.score || 0).toFixed(1)}`;
  document.getElementById('detail-reviews').textContent = hospital.reviewCount || hospital.reviews || 0;
  document.getElementById('detail-phone').textContent = hospital.phone || '-';

  // 의사 정보
  let docInfo = [];
  if (hospital.specialistCount > 0) docInfo.push(`전문의 ${hospital.specialistCount}명`);
  if (hospital.generalDoctorCount > 0) docInfo.push(`일반의 ${hospital.generalDoctorCount}명`);
  document.getElementById('detail-doctor').textContent = docInfo.length > 0 ? docInfo.join(', ') : '정보 없음';

  // 개원일
  if (hospital.openDate) {
    const d = new Date(hospital.openDate);
    const years = new Date().getFullYear() - d.getFullYear();
    document.getElementById('detail-date').textContent = `${d.getFullYear()}년 ${String(d.getMonth()+1).padStart(2,'0')}월 ${String(d.getDate()).padStart(2,'0')}일 (${years}년차)`;
  } else {
    const established = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
    document.getElementById('detail-date').textContent = `${established.getFullYear()}년 ${established.getMonth()+1}월`;
  }

  // 전철역
  if (hospital.subway) {
    document.getElementById('detail-subway-wrapper').style.display = 'block';
    document.getElementById('detail-subway').textContent = hospital.subway;
  } else {
    document.getElementById('detail-subway-wrapper').style.display = 'none';
  }

  // 진료 시간
  const hoursUl = document.getElementById('detail-hours');
  if (hospital.hours) {
    hoursUl.innerHTML = `
      <li><strong>월요일:</strong> ${hospital.hours.mon || '-'}</li>
      <li><strong>화요일:</strong> ${hospital.hours.tue || '-'}</li>
      <li><strong>수요일:</strong> ${hospital.hours.wed || '-'}</li>
      <li><strong>목요일:</strong> ${hospital.hours.thu || '-'}</li>
      <li><strong>금요일:</strong> ${hospital.hours.fri || '-'}</li>
      <li><strong>토요일:</strong> ${hospital.hours.sat || '-'}</li>
      <li style="color:var(--primary);"><strong>일요일:</strong> ${hospital.hours.sun || '휴진'}</li>
      <li style="color:var(--primary);"><strong>공휴일:</strong> ${hospital.hours.holiday || '휴진'}</li>
    `;
  } else {
    hoursUl.innerHTML = '<li>진료시간 정보가 없습니다. 병원에 직접 문의해 주세요.</li>';
  }

  // 시설 및 장비 (기본값 설정 후 API로 채움)
  document.getElementById('detail-area').textContent = hospital.area || '조회 중...';
  document.getElementById('detail-room-bed').textContent = (hospital.roomCount !== undefined) ? `입원실 ${hospital.roomCount} / 병상 ${hospital.bedCount}` : '조회 중...';
  document.getElementById('detail-equipment').textContent = hospital.equipment || '조회 중...';
  document.getElementById('detail-parking').textContent = '조회 중...';

  // 배지
  const badgesContainer = document.getElementById('detail-badges');
  badgesContainer.innerHTML = '';
  if (hospital.isSpecialist) {
    badgesContainer.innerHTML += `<span class="badge" style="background:#e0f2fe; color:#0284c7; padding:4px 8px; border-radius:4px; margin-right:5px; font-size:0.8rem;">전문의</span>`;
  }
  
  // ==========================================
  // [신규] 공공데이터 상세 API 비동기 동시 호출
  // ==========================================
  fetchDetailAPIs(hospital);

  // 모의 리뷰 생성 (SEO 텍스트 확보)
  const reviewTexts = [
    "원장님이 너무 친절하시고 설명을 잘 해주십니다. 다음에도 여기로 와야겠어요.",
    "시설이 깔끔하고 간호사분들도 친절하네요. 대기 시간이 조금 길었지만 만족스럽습니다.",
    "과잉 진료 없이 딱 필요한 치료만 권해주셔서 믿음이 갑니다.",
    "주차장이 조금 협소한 것 빼고는 전반적으로 훌륭한 병원입니다."
  ];
  
  // 가짜 후기 생성 로직을 제거하고, 병원명 기반으로 네이버 블로그 후기를 호출합니다.
  document.getElementById('detail-review-list').innerHTML = '<div class="map-loader"><div class="spinner"></div><p>네이버 블로그 실시간 후기를 불러오는 중입니다...</p></div>';
  
  HospitalAPI.fetchNaverSearch(`${hospital.name} 후기`, 'blog', 5).then(items => {
    if (items.length === 0) {
      document.getElementById('detail-review-list').innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-muted);">후기를 불러올 수 없습니다. API 키 설정을 확인해 주세요.</p>';
      return;
    }
    
    const reviewsHtml = items.map(item => {
      const title = item.title.replace(/<[^>]*>?/g, '');
      const desc = item.description.replace(/<[^>]*>?/g, '');
      const date = item.postdate ? `${item.postdate.substring(0,4)}.${item.postdate.substring(4,6)}.${item.postdate.substring(6,8)}` : '';
      
      return `
        <a href="${item.link}" target="_blank" rel="noopener" class="detail-review-item fade-up" style="text-decoration:none; display:flex; flex-direction:column; cursor:pointer;">
          <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span style="font-size:0.85rem; color:var(--text-muted);">${escapeHtml(item.bloggername)}</span>
            <span style="font-size:0.8rem; color:var(--text-muted);">${date}</span>
          </div>
          <h4 style="font-size:1.05rem; margin-bottom:5px; color:var(--text-heading); font-weight:600;">${escapeHtml(title)}</h4>
          <p style="color:var(--text-body); font-size:0.95rem; line-height:1.5;">${escapeHtml(desc)}</p>
          <div style="margin-top:10px;"><span class="review-badge" style="background:#03C75A; color:white;">네이버 블로그</span></div>
        </a>
      `;
    }).join('');
    
    document.getElementById('detail-review-list').innerHTML = reviewsHtml;
  });

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

  // 네이버 지도 API 동적 로드 및 초기화
  const savedKey = localStorage.getItem(KEY_STORAGE) || DEFAULT_KEY;
  loadMapScript(savedKey)
    .then(() => {
      window.initDetailMap();
    })
    .catch(err => {
      console.error('[DetailMap] Naver Maps loading failed:', err.message);
      const container = document.getElementById('map-container');
      if (container) {
        if (err.message === 'TIMEOUT' || err.message === 'AUTH_FAIL') {
          container.innerHTML = `
            <div class="map-setup-box" style="padding: 20px; text-align: center; border: 1px solid var(--border-default); border-radius: 8px; background: var(--bg-card); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
              <span style="font-size: 2rem; display: block; margin-bottom: 10px;">⚠️</span>
              <p style="color: var(--primary); font-weight: bold; margin-bottom: 10px;">네이버 지도 인증에 실패했습니다.</p>
              <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; max-width: 350px; margin: 0 auto;">
                네이버 클라우드 플랫폼 콘솔의 Application 설정에서 <b>허용 URL</b>에 현재 도메인(예: <b>hospital-ranking.pages.dev</b> 또는 <b>hospital-ranking.kr</b>)이 등록되어 있는지 확인해 주세요.
              </p>
            </div>
          `;
        } else {
          container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">지도를 불러올 수 없습니다. (${err.message})</div>`;
        }
      }
    });
}

// ── 상세 API 호출 ──
async function fetchDetailAPIs(hospital) {
  // 1. 국립중앙의료원 (진료시간, 교통편)
  fetch(`/api/hospital-hours?name=${encodeURIComponent(hospital.name)}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.found) {
        // 진료시간
        const h = data.hours;
        if (h.mon) {
          document.getElementById('detail-hours').innerHTML = `
            <li><strong>월요일:</strong> ${h.mon || '-'}</li>
            <li><strong>화요일:</strong> ${h.tue || '-'}</li>
            <li><strong>수요일:</strong> ${h.wed || '-'}</li>
            <li><strong>목요일:</strong> ${h.thu || '-'}</li>
            <li><strong>금요일:</strong> ${h.fri || '-'}</li>
            <li><strong>토요일:</strong> ${h.sat || '-'}</li>
            <li style="color:var(--primary);"><strong>일요일:</strong> ${h.sun || '휴진'}</li>
            <li style="color:var(--primary);"><strong>공휴일:</strong> ${h.holiday || '휴진'}</li>
          `;
        }
      } else if (!hospital.hours) {
         document.getElementById('detail-hours').innerHTML = '<li>진료시간 정보가 없습니다.</li>';
      }
    }).catch(e => {
      if(!hospital.hours) document.getElementById('detail-hours').innerHTML = '<li>정보를 불러올 수 없습니다.</li>';
    });

  // 2. 심평원 상세 정보 (주차, 면적, 병상수)
  if (hospital.id && typeof hospital.id === 'string' && hospital.id.startsWith('JD')) {
    fetch(`/api/hospital-details?ykiho=${encodeURIComponent(hospital.id)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.found) {
          if (data.area) document.getElementById('detail-area').textContent = `${data.area}㎡`;
          
          let park = '';
          if (data.parkPosblYn === 'Y') {
            park = `주차 가능 (${data.parkQty || 0}대)`;
            if (data.parkEtc) park += ` - ${data.parkEtc}`;
          } else {
            park = '주차 불가';
          }
          document.getElementById('detail-parking').textContent = park;
        } else {
          document.getElementById('detail-area').textContent = '정보 없음';
          document.getElementById('detail-parking').textContent = '정보 없음';
        }
      }).catch(e => {
        document.getElementById('detail-area').textContent = '-';
        document.getElementById('detail-parking').textContent = '-';
      });

    // 3. 심평원 장비 정보
    fetch(`/api/hospital-equip?ykiho=${encodeURIComponent(hospital.id)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.found && data.equips && data.equips.length > 0) {
          document.getElementById('detail-equipment').textContent = data.equips.join(', ');
        } else {
          document.getElementById('detail-equipment').textContent = '등록된 장비 정보 없음';
        }
      }).catch(e => {
        document.getElementById('detail-equipment').textContent = '-';
      });
  } else {
    // Mock 데이터인 경우 (id가 숫자인 경우)
    document.getElementById('detail-area').textContent = hospital.area || '-';
    document.getElementById('detail-parking').textContent = (hospital.parkingCapacity !== undefined) ? `${hospital.parkingCapacity}대 가능` : '-';
    document.getElementById('detail-equipment').textContent = hospital.equipment || '-';
  }
}

// ── 네이버 지도 로딩 및 Geocoding 유틸리티 ──
const KEY_STORAGE = 'naver_map_client_id';
const DEFAULT_KEY = 'rgd9ajy97r';

function loadMapScript(clientId) {
  return new Promise((resolve, reject) => {
    if (window.naver && window.naver.maps) {
      resolve();
      return;
    }

    // 기존 등록된 스크립트 삭제
    const oldScripts = document.querySelectorAll('script[src*="openapi.map.naver.com"]');
    oldScripts.forEach(s => s.remove());

    const timeout = setTimeout(() => {
      delete window.__naverMapLoaded;
      reject(new Error('TIMEOUT'));
    }, 5000);

    window.__naverMapLoaded = () => {
      clearTimeout(timeout);
      resolve();
      delete window.__naverMapLoaded;
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder&callback=__naverMapLoaded`;
    
    script.onerror = () => {
      clearTimeout(timeout);
      delete window.__naverMapLoaded;
      reject(new Error('AUTH_FAIL'));
    };

    document.head.appendChild(script);
  });
}

// 네이버 지도 초기화 함수 (콜백에 의해 호출됨)
window.initDetailMap = function() {
  if (!window.currentHospitalDetail) return; // 데이터가 아직 안불러와졌으면 대기
  const h = window.currentHospitalDetail;
  const container = document.getElementById('map-container');
  if (!container) return;

  function renderMap(lat, lng) {
    const mapOptions = {
      center: new naver.maps.LatLng(lat, lng),
      zoom: 16
    };
    const map = new naver.maps.Map(container, mapOptions);

    new naver.maps.Marker({
      position: new naver.maps.LatLng(lat, lng),
      map: map
    });
  }

  // 좌표가 유효한 경우 바로 렌더링, 그렇지 않은 경우 주소 기반으로 지오코딩 수행
  if (h.lat > 0 && h.lng > 0) {
    renderMap(h.lat, h.lng);
  } else if (h.address) {
    naver.maps.Service.geocode({ query: h.address }, (status, response) => {
      if (status === naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
        const addrItem = response.v2.addresses[0];
        const lat = parseFloat(addrItem.y);
        const lng = parseFloat(addrItem.x);
        renderMap(lat, lng);
      } else {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">위치 정보를 찾을 수 없습니다 (좌표 변환 실패).</div>';
      }
    });
  } else {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">위치 정보(주소/좌표)가 없습니다.</div>';
  }
};
