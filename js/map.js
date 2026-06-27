/**
 * 병원찾기 - Naver Maps 연동 모듈
 * ─────────────────────────────────────────
 * 사용자가 입력한 네이버 Client ID를 localStorage에 저장하고
 * Naver Maps SDK를 동적으로 로드하여 병원 위치를 시각화합니다.
 */

const MapModule = (() => {
  let map = null;
  let markers = [];
  let activeInfoWindow = null;
  let isSdkLoaded = false;

  const DEFAULT_KEYS = ['390058kho4', 'rgd9ajy97r'];
  const STORAGE_KEY = 'NAVER_MAP_KEY';

  // 기본 위치 (서울시청)
  const DEFAULT_LAT = 37.5665;
  const DEFAULT_LNG = 126.9780;

  function getStoredMapKey() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[MapModule] localStorage unavailable:', error.message);
      return '';
    }
  }

  function saveMapKey(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      return true;
    } catch (error) {
      console.warn('[MapModule] Failed to store map key:', error.message);
      return false;
    }
  }

  function getMapKeyCandidates() {
    const storedKey = getStoredMapKey();
    return Array.from(new Set([storedKey, ...DEFAULT_KEYS].filter(Boolean)));
  }

  /**
   * 지도 초기화 진입점
   */
  async function init() {
    const candidateKeys = getMapKeyCandidates();
    const container = document.getElementById('map-container');
    if (!container) return;

    if (candidateKeys.length > 0) {
      showMapLoading(true);
      let lastError = null;
      try {
        for (const clientId of candidateKeys) {
          try {
            resetNaverMapRuntime();
            await loadScript(clientId);
            isSdkLoaded = true;
            initMap(container);

            const authOk = await verifyMapReady(container);
            if (!authOk) {
              lastError = new Error(`AUTH_FAIL:${clientId}`);
              isSdkLoaded = false;
              continue;
            }

            saveMapKey(clientId);
            return;
          } catch (error) {
            lastError = error;
            isSdkLoaded = false;
          }
        }

        console.error('[MapModule]', lastError?.message || 'UNKNOWN');
        showMapSetupUI(container, buildMapAuthMessage(candidateKeys));
      } catch (err) {
        console.error('[MapModule]', err.message);
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">네이버 지도 API 로드에 실패했습니다.</div>';
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
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder&callback=__naverMapLoaded`;
      
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
    watchForAuthFailure(container, canvas);

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
  function watchForAuthFailure(container, canvas) {
    const detectAuthFailure = () => {
      const backgroundImage = window.getComputedStyle(canvas).backgroundImage || '';
      if (!backgroundImage.includes('auth_fail')) {
        return false;
      }

      showMapSetupUI(container, buildMapAuthMessage(getMapKeyCandidates()));
      return true;
    };

    if (detectAuthFailure()) {
      return;
    }

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (detectAuthFailure() || attempts >= 10) {
        clearInterval(timer);
      }
    }, 700);
  }
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

  function showMapSetupUI(container, errorMsg) {
    const errorHtml = errorMsg
      ? `<p style="color: #dc2626; font-weight: bold; margin-bottom: 15px; font-size: 0.9rem; line-height: 1.5;">${errorMsg}</p>`
      : '';

    container.innerHTML = `
      <div style="padding: 20px; text-align: center; border: 1px solid var(--border-default); border-radius: 8px; background: var(--bg-card); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
        <span style="font-size: 2rem; display: block; margin-bottom: 10px;">📍</span>
        <h3 style="margin-bottom: 10px;">지도 미리보기 안내</h3>
        ${errorHtml}
        <p style="font-size: 0.86rem; color: var(--text-muted); margin-top: 6px; line-height: 1.6;">
          현재는 병원 목록과 검색 기능을 먼저 이용할 수 있으며, 지도는 외부 네이버 지도에서 확인할 수 있습니다.
        </p>
        <a href="https://map.naver.com/v5/" target="_blank" rel="noopener" style="margin-top:12px; padding:10px 14px; background:var(--primary); color:white; border-radius:6px; text-decoration:none; font-weight:bold;">네이버 지도 열기</a>
      </div>
    `;
  }

  function resetNaverMapRuntime() {
    document
      .querySelectorAll('script[src*="openapi.map.naver.com"], script[src*="oapi.map.naver.com"]')
      .forEach((script) => script.remove());
    delete window.__naverMapLoaded;
    try {
      delete window.naver;
    } catch (error) {
      window.naver = undefined;
    }
  }

  function verifyMapReady(container) {
    const canvas = container?.querySelector('#map-canvas');
    if (!canvas) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        const backgroundImage = window.getComputedStyle(canvas).backgroundImage || '';
        if (backgroundImage.includes('auth_fail')) {
          clearInterval(timer);
          resolve(false);
          return;
        }

        if (attempts >= 8) {
          clearInterval(timer);
          resolve(true);
        }
      }, 700);
    });
  }

  function buildMapAuthMessage(candidateKeys) {
    const keyLabel = Array.from(new Set(candidateKeys.filter(Boolean))).join(', ');
    return `네이버 지도 인증이 실패했습니다. Naver Cloud Maps에서 사용 중인 Key ID(${keyLabel})에 https://hospital-ranking.kr 와 https://www.hospital-ranking.kr 를 등록했는지 확인해 주세요.`;
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

function bootstrapMapModule() {
  if (
    window.location.pathname.includes('detail.html')
    || window.location.search.includes('id=')
  ) {
    return;
  }
  MapModule.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapMapModule);
} else {
  bootstrapMapModule();
}
