/**
 * 병원랭킹 - Naver Maps 연동 모듈
 * ─────────────────────────────────────────
 * 사용자가 입력한 네이버 Client ID를 localStorage에 저장하고
 * Naver Maps SDK를 동적으로 로드하여 병원 위치를 시각화합니다.
 */

const MapModule = (() => {
  let map = null;
  let markers = [];
  let activeInfoWindow = null;
  let isSdkLoaded = false;

  const DEFAULT_KEY = 'rgd9ajy97r';
  // 네이버 클라우드 플랫폼에서 발급받은 Client ID (기본값)
  const DEFAULT_KEY = 'rgd9ajy97r'; 

  // 기본 위치 (서울시청)
  const DEFAULT_LAT = 37.5665;
  const DEFAULT_LNG = 126.9780;

  /**
   * 지도 초기화 진입점
   */
  async function init() {
    // localStorage에 저장된 사용자 키를 최우선으로 사용하고, 없으면 기본 키(DEFAULT_KEY)를 사용합니다.
    const savedKey = DEFAULT_KEY;
    const container = document.getElementById('map-container');
    if (!container) return;

    if (savedKey) {
      showMapLoading(true);
      try {
        await loadScript(savedKey);
        isSdkLoaded = true;
        initMap(container);
      } catch (err) {
        console.error('[MapModule]', err.message);
        showMapLoading(false);
        // 오류 유형에 따라 다른 안내 메시지 표시
        if (err.message === 'TIMEOUT' || err.message === 'AUTH_FAIL') {
          container.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">지도를 불러올 수 없습니다.<br>네이버 지도 서비스가 일시적으로 원활하지 않거나, 아직 도메인 등록이 반영되지 않았습니다.</div>';
        } else {
          container.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">네이버 지도 API 로드에 실패했습니다.</div>';
        }
        return;
      } finally {
        showMapLoading(false);
      }
    } else {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">지도를 불러올 수 없습니다.</div>';
    }
  }

  function loadScript(clientId) {
    return new Promise((resolve, reject) => {
      if (window.naver && window.naver.maps) {
        resolve();
        return;
      }

      // 기존 등록된 스크립트가 있다면 삭제
      const oldScripts = document.querySelectorAll('script[src*="openapi.map.naver.com"]');
      oldScripts.forEach(s => s.remove());

      // 5초 타임아웃 (도메인 미등록 등으로 응답 없을 경우)
      const timeout = setTimeout(() => {
        delete window.__naverMapLoaded;
        reject(new Error('TIMEOUT'));
      }, 5000);

      // 비동기 로딩 완료 후 호출될 콜백 함수 지정
      window.__naverMapLoaded = () => {
        clearTimeout(timeout);
        resolve();
        delete window.__naverMapLoaded;
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      // callback 파라미터 필수 추가 (비동기 로드 시)
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder&callback=__naverMapLoaded`;
      
      script.onerror = () => {
        clearTimeout(timeout);
        delete window.__naverMapLoaded;
        reject(new Error('AUTH_FAIL'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * 지도 인스턴스화
   */
  function initMap(container) {
    // 플레이스홀더 내용 비우기
    container.innerHTML = '';
    container.className = 'map-canvas-container';

    // 실제 지도가 그려질 영역 생성
    const canvas = document.createElement('div');
    canvas.id = 'map-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.borderRadius = 'var(--radius-lg)';
    container.appendChild(canvas);

    // 제어 버튼(초기화 등)을 지도 위에 부유시킴
    const controlDiv = document.createElement('div');
    controlDiv.className = 'map-control-overlay';
    controlDiv.innerHTML = `
      <button class="map-overlay-btn btn-my-loc" title="내 위치로 이동">📍 내 위치</button>
    `;
    container.appendChild(controlDiv);

    const mapOptions = {
      center: new naver.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG),
      zoom: 14,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.RIGHT_CENTER
      },
      mapTypeControl: true
    };

    map = new naver.maps.Map(canvas, mapOptions);

    // 이벤트 리스너 바인딩
    controlDiv.querySelector('.btn-my-loc').addEventListener('click', moveToCurrentLocation);

    // 저장되어 있던 병원 목록이 있으면 즉시 마커 표시
    if (window.AppHospitals && window.AppHospitals.length > 0) {
      updateMarkers(window.AppHospitals);
    } else {
      moveToCurrentLocation();
    }
  }

  /**
   * 현재 기기 GPS 위치로 부드럽게 이동
   */
  function moveToCurrentLocation() {
    if (!map) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const locPosition = new naver.maps.LatLng(lat, lng);
          map.panTo(locPosition);
        },
        () => {
          console.warn('Geolocation 권한이 없거나 지원되지 않습니다.');
        }
      );
    }
  }

  /**
   * 로딩 스피너 표시
   */
  function showMapLoading(show) {
    const container = document.getElementById('map-container');
    if (!container) return;
    if (show) {
      container.innerHTML = `
        <div class="map-loader">
          <div class="spinner"></div>
          <p>네이버 지도를 불러오는 중입니다...</p>
        </div>
      `;
    }
  }

  /**
   * 마커 모두 제거
   */
  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    if (activeInfoWindow) {
      activeInfoWindow.close();
      activeInfoWindow = null;
    }
  }

  /**
   * 병원 목록 데이터를 지도 마커로 렌더링
   */
  function updateMarkers(hospitals) {
    // 상위 전역 상태에 임시 백업 (지도가 나중에 로딩될 시점 대비)
    window.AppHospitals = hospitals;

    if (!map || !isSdkLoaded) return;

    clearMarkers();

    const validHospitals = hospitals.filter(h => h.lat > 0 && h.lng > 0);
    if (validHospitals.length === 0) return;

    const bounds = new naver.maps.LatLngBounds();

    validHospitals.forEach((h) => {
      const position = new naver.maps.LatLng(h.lat, h.lng);
      
      // 네이버 마커 생성
      const marker = new naver.maps.Marker({
        position: position,
        map: map,
        title: h.name
      });

      markers.push(marker);

      // 경계 확장을 위해 bounds에 위치 추가
      bounds.extend(position);

      // 인포윈도우 바인딩
      const content = `
        <div class="map-info-window">
          <div class="win-header">
            <span class="win-name">${h.name}</span>
            <span class="win-type">${h.type}</span>
          </div>
          <div class="win-body">
            <div class="win-item"><strong>⭐ 평점:</strong> ${h.score} (${h.reviewCount}개 후기)</div>
            <div class="win-item"><strong>📍 주소:</strong> ${h.address}</div>
            ${h.phone ? `<div class="win-item"><strong>📞 전화:</strong> ${h.phone}</div>` : ''}
            <div class="win-item"><strong>👨‍⚕️ 의사:</strong> 전문의 ${h.specialistCount}명</div>
          </div>
          <div class="win-footer">
            <a href="https://map.naver.com/v5/search/${encodeURIComponent(h.name)}" target="_blank" rel="noopener" class="win-road-btn">📍 길찾기</a>
          </div>
        </div>
      `;

      // 네이버 인포윈도우 생성 (테두리를 없애고 가독성을 높이기 위한 CSS 연동 구조)
      const infowindow = new naver.maps.InfoWindow({
        content: content,
        backgroundColor: "#ffffff",
        borderColor: "#dddddd",
        borderWidth: 1,
        anchorSize: new naver.maps.Size(10, 10),
        anchorColor: "#ffffff",
        disableAnchor: false
      });

      // 마커 클릭 시 인포윈도우 오픈
      naver.maps.Event.addListener(marker, 'click', () => {
        if (activeInfoWindow) activeInfoWindow.close();
        infowindow.open(map, marker);
        activeInfoWindow = infowindow;
      });
    });

    // 모든 마커가 화면에 보일 수 있게 지도 영역 재조정
    map.fitBounds(bounds);

    // 만약 마커가 단 1개이면 너무 과하게 줌인되는 것 방지
    if (validHospitals.length === 1) {
      map.setZoom(14);
    }
  }

  return {
    init,
    updateMarkers
  };
})();

// DOM 로딩 완료 시 지도 연동 실행 (단, 상세 페이지 제외)
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('detail.html') || window.location.search.includes('id=')) {
    return; // 상세 페이지에서는 detail.js가 자체적으로 지도를 로드하므로 중복 로드 방지
  }
  MapModule.init();
});