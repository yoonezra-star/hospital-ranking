(() => {
  const NAVER_MAP_DEFAULT_KEY = 'rgd9ajy97r';
  const NAVER_MAP_STORAGE_KEY = 'NAVER_MAP_KEY';
  const FALLBACK_REVIEW_TEXTS = [
    '접수 대기 동선이 비교적 안정적이고 진료 안내가 명확한 편입니다.',
    '의료진 설명이 차분하고 필요한 검사와 다음 단계 안내가 비교적 분명합니다.',
    '위치와 접근성이 좋아 재방문 후기에서 자주 언급되는 병원입니다.',
    '야간 또는 토요일 진료 여부는 방문 전 다시 확인하는 편이 안전합니다.',
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const hospitalId = new URLSearchParams(window.location.search).get('id');
    if (!hospitalId) {
      setText('detail-name', '병원 정보를 찾을 수 없습니다.');
      return;
    }

    void loadHospitalDetail(hospitalId);
  });

  async function loadHospitalDetail(id) {
    try {
      const hospital = await resolveHospital(id);
      if (!hospital) {
        setText('detail-name', '병원 정보를 찾을 수 없습니다.');
        return;
      }

      renderDetail(hospital);
      await hydrateDetail(hospital);
    } catch (error) {
      console.error('[detail] failed to load detail page:', error);
      setText('detail-name', '병원 정보를 불러오지 못했습니다.');
    }
  }

  async function resolveHospital(id) {
    const api = getHospitalApi();
    if (typeof id === 'string' && id.startsWith('JD') && api?.fetchHospitals) {
      const response = await api.fetchHospitals({ ykiho: id, limit: 1 });
      return response?.hospitals?.[0] || null;
    }

    const hospitalList = getHospitalList();
    if (Array.isArray(hospitalList)) {
      return hospitalList.find((hospital) => String(hospital.id) === String(id)) || null;
    }

    return null;
  }

  function renderDetail(hospital) {
    window.currentHospitalDetail = hospital;
    document.title = `${hospital.name} 후기, 평점 및 진료 정보 - 병원찾기`;
    updateMetaDescription(
      `${hospital.name}의 위치, 연락처, 진료 정보, 후기 요약을 병원찾기에서 확인하세요.`
    );

    refreshHospitalOverview(hospital);
    setText('detail-emergency', '응급 진료 정보 확인 필요');
    setText('detail-hours-note', '점심시간 및 접수 안내 확인 중...');
    setText('detail-duty-note', '공개 데이터 기반 진료 안내 정보를 정리 중입니다.');
    updateSourceSummary(['기본 병원 정보']);

    const subwayWrapper = document.getElementById('detail-subway-wrapper');
    if (subwayWrapper) {
      subwayWrapper.style.display = hospital.subway ? 'flex' : 'none';
    }
    setText('detail-subway', hospital.subway || '');

    renderHours(hospital.hours || null);
    renderFacilitySummary(hospital);
    renderComparePoints(hospital);
    renderFallbackReviews(hospital);
    renderMapFallback(hospital);
  }

  async function hydrateDetail(hospital) {
    await hydratePublicData(hospital);
    await Promise.allSettled([
      hydrateReviews(hospital),
      hydrateNearbyHospitals(hospital),
      hydrateMap(hospital),
    ]);
  }

  async function hydratePublicData(hospital) {
    const api = getHospitalApi();
    const sourceStates = [];

    try {
      let publicYkiho = typeof hospital.id === 'string' && hospital.id.startsWith('JD') ? hospital.id : '';

      if (!publicYkiho && api?.fetchHospitals) {
        const matchedHospital = await findPublicHospitalMatch(hospital, api);
        if (matchedHospital) {
          mergePublicHospital(hospital, matchedHospital);
          publicYkiho = matchedHospital.id;
          sourceStates.push('기본 병원 API 연동');
          refreshHospitalOverview(hospital);
        } else {
          sourceStates.push('기본 정보는 보유 데이터 사용');
        }
      } else if (publicYkiho) {
        sourceStates.push('기본 병원 API 연동');
      }

      if (publicYkiho) {
        const [detailResult, equipResult, hoursResult] = await Promise.allSettled([
          fetchJson(`/api/hospital-details?ykiho=${encodeURIComponent(publicYkiho)}`),
          fetchJson(`/api/hospital-equip?ykiho=${encodeURIComponent(publicYkiho)}`),
          fetchJson(buildHospitalHoursUrl(hospital)),
        ]);

        if (detailResult.status === 'fulfilled') {
          applyDetailData(detailResult.value, hospital);
          if (detailResult.value?.found === true) {
            sourceStates.push('상세 정보 API');
          }
        }

        if (equipResult.status === 'fulfilled') {
          applyEquipData(equipResult.value);
          if (equipResult.value?.found === true) {
            sourceStates.push('장비 정보 API');
          }
        }

        if (hoursResult.status === 'fulfilled') {
          applyHoursData(hoursResult.value, hospital);
          if (hoursResult.value?.found === true) {
            sourceStates.push('진료시간 API');
          }
        }
      } else {
        const hoursData = await fetchJson(buildHospitalHoursUrl(hospital));
        applyHoursData(hoursData, hospital);
        if (hoursData?.found === true) {
          sourceStates.push('진료시간 API');
        }
      }
    } catch (error) {
      console.warn('[detail] public detail enrichment skipped:', error);
      sourceStates.push('공공데이터 상세 연동 실패');
    }

    updateSourceSummary(sourceStates);
    refreshHospitalOverview(hospital);
  }

  async function hydrateReviews(hospital) {
    const api = getHospitalApi();
    if (!api?.fetchNaverSearch) {
      return;
    }

    try {
      const items = await api.fetchNaverSearch(`${hospital.name} 후기`, 'blog', 5);
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      if (items.some((item) => item && Object.prototype.hasOwnProperty.call(item, 'query'))) {
        return;
      }

      const reviewList = document.getElementById('detail-review-list');
      if (!reviewList) {
        return;
      }

      reviewList.innerHTML = items.slice(0, 5).map((item) => {
        const title = stripTags(item.title || `${hospital.name} 후기`);
        const description = stripTags(item.description || '리뷰 요약을 확인해 보세요.');
        const author = item.bloggername || '네이버 블로그';
        const date = formatPostDate(item.postdate);
        const link = item.link || `https://search.naver.com/search.naver?query=${encodeURIComponent(`${hospital.name} 후기`)}`;

        return `
          <a href="${escapeHtml(link)}" target="_blank" rel="noopener" class="detail-review-item fade-up" style="text-decoration:none; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; gap:12px; color:var(--text-muted); font-size:0.85rem;">
              <span>${escapeHtml(author)}</span>
              <span>${escapeHtml(date)}</span>
            </div>
            <h4 style="font-size:1.05rem; color:var(--text-heading); font-weight:600;">${escapeHtml(title)}</h4>
            <p style="color:var(--text-body); font-size:0.95rem; line-height:1.6;">${escapeHtml(description)}</p>
            <div><span class="review-badge" style="background:#03C75A; color:#fff;">네이버 블로그</span></div>
          </a>
        `;
      }).join('');
    } catch (error) {
      console.warn('[detail] failed to hydrate reviews:', error);
    }
  }

  async function hydrateNearbyHospitals(hospital) {
    const container = document.getElementById('detail-nearby-list');
    const api = getHospitalApi();
    if (!container || !api?.fetchHospitals) {
      return;
    }

    try {
      let candidates = [];

      if (Number.isFinite(Number(hospital.lng)) && Number(hospital.lng) > 0 &&
          Number.isFinite(Number(hospital.lat)) && Number(hospital.lat) > 0) {
        const nearby = await api.fetchHospitals({
          xPos: Number(hospital.lng),
          yPos: Number(hospital.lat),
          radius: 3000,
          limit: 12,
        });
        candidates = Array.isArray(nearby?.hospitals) ? nearby.hospitals : [];
      }

      if (candidates.length === 0) {
        const localList = getHospitalList();
        candidates = Array.isArray(localList) ? localList : [];
      }

      const filtered = candidates
        .filter((item) => String(item.id) !== String(hospital.id))
        .sort((a, b) => {
          if (a.departmentId === hospital.departmentId && b.departmentId !== hospital.departmentId) return -1;
          if (a.departmentId !== hospital.departmentId && b.departmentId === hospital.departmentId) return 1;
          return (b.specialistCount || 0) - (a.specialistCount || 0);
        })
        .slice(0, 6);

      renderNearbyHospitals(filtered, hospital);
    } catch (error) {
      console.warn('[detail] nearby hospitals skipped:', error);
      renderNearbyHospitals([], hospital);
    }
  }

  async function hydrateMap(hospital) {
    try {
      const clientId = getStoredMapKey() || NAVER_MAP_DEFAULT_KEY;
      if (!clientId) {
        return;
      }

      await loadNaverMapScript(clientId);
      renderLiveMap(hospital);
    } catch (error) {
      console.warn('[detail] live map skipped:', error);
      const message = error.message === 'AUTH_FAIL'
        ? '네이버 지도 인증이 실패해 지도 영역 대신 네이버 지도 바로가기를 표시합니다.'
        : '실시간 지도를 불러오지 못해 네이버 지도 바로가기로 대체했습니다.';
      renderMapFallback(hospital, message);
    }
  }

  function applyDetailData(detailData, hospital) {
    if (!detailData || detailData.found !== true) {
      return;
    }

    if (detailData.hours) {
      renderHours(detailData.hours);
    }

    const parkingItems = [];
    if (detailData.parkXpnsYn) {
      parkingItems.push(detailData.parkXpnsYn === 'Y' ? '유료 주차' : '무료 주차');
    }
    if (detailData.parkQty) {
      parkingItems.push(`주차 가능 대수 ${detailData.parkQty}`);
    }
    if (detailData.parkEtc) {
      parkingItems.push(detailData.parkEtc);
    }
    if (parkingItems.length > 0) {
      setText('detail-parking', parkingItems.join(' / '));
    }

    const emergencyItems = [];
    if (detailData.emyDayYn === 'Y') emergencyItems.push('주간 응급 진료 가능');
    if (detailData.emyNgtYn === 'Y') emergencyItems.push('야간 응급 진료 가능');
    if (detailData.emyDayTelNo1) emergencyItems.push(`응급 문의 ${detailData.emyDayTelNo1}`);
    if (emergencyItems.length > 0) {
      setText('detail-emergency', emergencyItems.join(' / '));
      hospital.hasEmergency = true;
    }

    const noteItems = [];
    if (detailData.rcvWeek) noteItems.push(`평일 접수 ${detailData.rcvWeek}`);
    if (detailData.rcvSat) noteItems.push(`토요일 접수 ${detailData.rcvSat}`);
    if (detailData.lunchWeek) noteItems.push(`점심시간 ${detailData.lunchWeek}`);
    if (noteItems.length > 0) {
      setText('detail-hours-note', noteItems.join(' / '));
    }

    updateOperationalBadges(detailData.hours, detailData);
  }

  function applyEquipData(equipData) {
    if (!equipData || equipData.found !== true) {
      return;
    }

    const facility = equipData.facility || {};
    const roomParts = [];
    if (toPositiveNumber(facility.stdSickbdCnt) > 0) roomParts.push(`일반 병상 ${facility.stdSickbdCnt}`);
    if (toPositiveNumber(facility.permSbdCnt) > 0) roomParts.push(`특수 병상 ${facility.permSbdCnt}`);
    if (roomParts.length > 0) {
      setText('detail-room-bed', roomParts.join(' / '));
    }

    if (facility.totArea) {
      setText('detail-area', String(facility.totArea));
    }

    if (Array.isArray(equipData.equipDetails) && equipData.equipDetails.length > 0) {
      setText(
        'detail-equipment',
        equipData.equipDetails
          .slice(0, 10)
          .map((item) => `${item.name} ${item.count}대`)
          .join(', ')
      );
    } else if (Array.isArray(equipData.equips) && equipData.equips.length > 0) {
      setText('detail-equipment', equipData.equips.slice(0, 10).join(', '));
    }
  }

  function applyHoursData(hoursData, hospital) {
    if (!hoursData || hoursData.found !== true) {
      return;
    }

    if (hoursData.hours) {
      renderHours(hoursData.hours);
    }

    if (hoursData.dutyTel1) {
      hospital.phone = hoursData.dutyTel1;
    }
    if (hoursData.dutyAddr) {
      hospital.address = hoursData.dutyAddr;
    }
    if ((!hospital.lat || !hospital.lng) && hoursData.wgs84Lat && hoursData.wgs84Lon) {
      hospital.lat = Number(hoursData.wgs84Lat);
      hospital.lng = Number(hoursData.wgs84Lon);
    }

    if (hoursData.dutyInf) {
      setText('detail-duty-note', hoursData.dutyInf);
    }

    updateOperationalBadges(hoursData.hours);
  }

  function refreshHospitalOverview(hospital) {
    const score = Number(hospital.score || 0);
    const reviewCount = Number(hospital.reviewCount || hospital.reviews || 0);

    setText('detail-name', hospital.name || '병원명 확인 필요');
    setText('detail-type', hospital.type || '병원');
    setText('detail-address', hospital.address || '주소 정보 없음');
    setText('detail-department', hospital.department || '진료과 확인 필요');
    setText('detail-score', `평점 ${score.toFixed(1)}`);
    setText('detail-reviews', formatNumber(reviewCount));
    setText('detail-phone', hospital.phone || '-');
    setText('detail-doctor', buildDoctorText(hospital));
    setText('detail-date', buildOpenDateText(hospital.openDate));
    setText('detail-region', buildRegionText(hospital));
    setHomepageLink(hospital.url || '');
    setQuickLinks(hospital);
    renderBadges(hospital);
    renderComparePoints(hospital);
    renderSchema(hospital, score, reviewCount);
  }

  function renderBadges(hospital) {
    const badges = [];
    if (Number(hospital.specialistCount || 0) > 0) {
      badges.push({ label: '전문의 운영', background: '#e0f2fe', color: '#0369a1' });
    }
    if (hospital.saturdayOpen) {
      badges.push({ label: '토요일 진료', background: '#dcfce7', color: '#166534' });
    }
    if (hospital.nightOpen) {
      badges.push({ label: '야간 진료', background: '#fef3c7', color: '#92400e' });
    }
    if (hospital.hasEmergency) {
      badges.push({ label: '응급 진료', background: '#fee2e2', color: '#b91c1c' });
    }
    if (hospital.type) {
      badges.push({ label: hospital.type, background: '#e2e8f0', color: '#334155' });
    }

    const container = document.getElementById('detail-badges');
    if (!container) {
      return;
    }

    container.innerHTML = badges.map((badge) => `
      <span class="badge" style="background:${badge.background}; color:${badge.color}; padding:4px 10px; border-radius:999px; margin-right:6px; font-size:0.8rem;">
        ${escapeHtml(badge.label)}
      </span>
    `).join('');
  }

  function renderHours(hours) {
    const target = document.getElementById('detail-hours');
    if (!target) {
      return;
    }

    const rows = [
      ['월요일', hours?.mon || '-'],
      ['화요일', hours?.tue || '-'],
      ['수요일', hours?.wed || '-'],
      ['목요일', hours?.thu || '-'],
      ['금요일', hours?.fri || '-'],
      ['토요일', hours?.sat || '-'],
      ['일요일', hours?.sun || '미진료'],
      ['공휴일', hours?.holiday || '미진료'],
    ];

    target.innerHTML = rows.map(([label, value]) => `
      <li><span class="info-label">${escapeHtml(label)}</span><span>${escapeHtml(String(value))}</span></li>
    `).join('');
  }

  function renderFacilitySummary(hospital) {
    const roomCount = toPositiveNumber(hospital.roomCount);
    const bedCount = toPositiveNumber(hospital.bedCount);
    const parkingParts = [];

    if (roomCount > 0 || bedCount > 0) {
      const parts = [];
      if (roomCount > 0) parts.push(`입원실 ${roomCount}`);
      if (bedCount > 0) parts.push(`병상 ${bedCount}`);
      setText('detail-room-bed', parts.join(' / '));
    } else {
      setText('detail-room-bed', '병상 정보 확인 필요');
    }

    setText('detail-area', hospital.area || '면적 정보 확인 필요');
    setText('detail-equipment', hospital.equipment || '장비 정보 확인 필요');

    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      parkingParts.push(`주차 가능 ${hospital.parkingCapacity}대`);
    }
    if (hospital.parkingFee) {
      parkingParts.push(hospital.parkingFee);
    }
    setText('detail-parking', parkingParts.join(' / ') || '주차 정보 확인 필요');
  }

  function renderComparePoints(hospital) {
    const target = document.getElementById('detail-compare-points');
    if (!target) {
      return;
    }

    const items = [];
    if (Number(hospital.specialistCount || 0) > 0) items.push(`전문의 ${hospital.specialistCount}명`);
    if (hospital.saturdayOpen) items.push('토요일 진료');
    if (hospital.sundayOpen) items.push('일요일 진료');
    if (hospital.nightOpen) items.push('야간 진료');
    if (hospital.hasEmergency) items.push('응급 진료');
    if (hospital.url) items.push('공식 홈페이지 제공');
    if (hospital.department) items.push(hospital.department);
    if (hospital.type) items.push(hospital.type);
    if (hospital.region) items.push(hospital.region);

    if (items.length === 0) {
      target.innerHTML = '<span style="color:var(--text-muted);">비교 포인트를 준비 중입니다...</span>';
      return;
    }

    target.innerHTML = items.map((item) => `
      <span style="display:inline-flex; align-items:center; padding:8px 12px; border-radius:999px; background:var(--bg-body); color:var(--text-heading); border:1px solid var(--border-default); font-size:0.9rem; font-weight:600;">
        ${escapeHtml(item)}
      </span>
    `).join('');
  }

  function renderFallbackReviews(hospital) {
    const reviewList = document.getElementById('detail-review-list');
    if (!reviewList) {
      return;
    }

    reviewList.innerHTML = FALLBACK_REVIEW_TEXTS.map((text, index) => `
      <article class="detail-review-item fade-up" style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; gap:12px; color:var(--text-muted); font-size:0.85rem;">
          <span>병원찾기 note ${index + 1}</span>
          <span>summary</span>
        </div>
        <h4 style="font-size:1.05rem; color:var(--text-heading); font-weight:600;">${escapeHtml(hospital.name)} 방문 요약</h4>
        <p style="color:var(--text-body); font-size:0.95rem; line-height:1.6;">${escapeHtml(text)}</p>
        <div><span class="review-badge" style="background:#64748b; color:#fff;">요약 리뷰</span></div>
      </article>
    `).join('');
  }

  function renderMapFallback(hospital, message = '') {
    const container = document.getElementById('map-container');
    if (!container) {
      return;
    }

    const note = message
      ? `<p style="margin:0 0 12px; color:#b91c1c; font-size:0.92rem; line-height:1.5;">${escapeHtml(message)}</p>`
      : '';

    container.innerHTML = `
      <div class="map-setup-box" style="padding:20px; text-align:center; border:1px solid var(--border-default); border-radius:8px; background:var(--bg-card); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; height:100%;">
        <span style="font-size:2rem;">📍</span>
        <h3 style="margin:0; color:var(--text-heading);">${escapeHtml(hospital.name || '병원 위치')}</h3>
        <p style="margin:0; color:var(--text-body); line-height:1.6;">${escapeHtml(hospital.address || '주소 정보 없음')}</p>
        ${note}
        <a href="https://map.naver.com/v5/search/${encodeURIComponent(hospital.name || hospital.address || '병원')}" target="_blank" rel="noopener" style="padding:10px 14px; background:var(--primary); color:#fff; border-radius:6px; text-decoration:none; font-weight:700;">네이버 지도에서 열기</a>
      </div>
    `;
  }

  function renderNearbyHospitals(items, hospital) {
    const container = document.getElementById('detail-nearby-list');
    if (!container) {
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">주변 비교 병원 정보를 아직 찾지 못했습니다.</p>';
      return;
    }

    container.innerHTML = items.map((item) => `
      <a href="detail.html?id=${encodeURIComponent(item.id)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(item.name)}</strong>
        <span style="font-size:0.9rem; color:var(--primary); font-weight:600;">${escapeHtml(item.type || hospital.type || '병원')}</span>
        <span style="font-size:0.92rem; color:var(--text-body); line-height:1.5;">${escapeHtml(item.address || '주소 정보 확인 필요')}</span>
        <span style="font-size:0.82rem; color:var(--text-muted);">전문의 ${escapeHtml(String(item.specialistCount || 0))}명 / 리뷰 ${escapeHtml(String(item.reviewCount || 0))}개${buildDistanceLabel(hospital, item)}</span>
      </a>
    `).join('');
  }

  function updateOperationalBadges(hours, detailData = null) {
    const hospital = window.currentHospitalDetail;
    if (!hospital || !hours) {
      return;
    }

    hospital.saturdayOpen = typeof hours.sat === 'string' && hours.sat.includes(':');
    hospital.sundayOpen = typeof hours.sun === 'string' && hours.sun.includes(':');
    hospital.nightOpen = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].some((key) => {
      const value = hours[key];
      if (typeof value !== 'string' || !value.includes('~')) return false;
      const end = value.split('~')[1]?.trim() || '';
      return end >= '18:30';
    });

    if (detailData && (detailData.emyDayYn === 'Y' || detailData.emyNgtYn === 'Y')) {
      hospital.hasEmergency = true;
    }
  }

  function renderLiveMap(hospital) {
    const container = document.getElementById('map-container');
    if (!container || !window.naver?.maps) {
      return;
    }

    const drawMap = (lat, lng) => {
      const center = new window.naver.maps.LatLng(lat, lng);
      const map = new window.naver.maps.Map(container, { center, zoom: 16 });
      new window.naver.maps.Marker({ position: center, map });
    };

    const lat = Number(hospital.lat);
    const lng = Number(hospital.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat > 0 && lng > 0) {
      drawMap(lat, lng);
      return;
    }

    if (!hospital.address || !window.naver.maps.Service?.geocode) {
      renderMapFallback(hospital, '좌표 정보가 없어 네이버 지도 바로가기를 표시합니다.');
      return;
    }

    window.naver.maps.Service.geocode({ query: hospital.address }, (status, response) => {
      if (status === window.naver.maps.Service.Status.OK && response?.v2?.addresses?.length > 0) {
        const addressItem = response.v2.addresses[0];
        drawMap(Number(addressItem.y), Number(addressItem.x));
        return;
      }

      renderMapFallback(hospital, '주소 좌표를 찾지 못해 네이버 지도 바로가기를 표시합니다.');
    });
  }

  function renderSchema(hospital, score, reviewCount) {
    const schemaElement = document.getElementById('schema-hospital');
    if (!schemaElement) {
      return;
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'MedicalOrganization',
      name: hospital.name,
      address: hospital.address,
      telephone: hospital.phone || undefined,
      url: hospital.url || undefined,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: score.toFixed(1),
        reviewCount,
      },
    };

    schemaElement.textContent = JSON.stringify(schema);
  }

  function setQuickLinks(hospital) {
    const phoneLink = document.getElementById('detail-call-link');
    const homepageButton = document.getElementById('detail-homepage-button');
    const mapLink = document.getElementById('detail-map-link');
    const searchLink = document.getElementById('detail-search-link');

    if (phoneLink) {
      if (hospital.phone) {
        phoneLink.href = `tel:${String(hospital.phone).replace(/\s+/g, '')}`;
        phoneLink.style.pointerEvents = 'auto';
        phoneLink.style.opacity = '1';
      } else {
        phoneLink.href = '#';
        phoneLink.style.pointerEvents = 'none';
        phoneLink.style.opacity = '0.55';
      }
    }

    if (homepageButton) {
      if (hospital.url) {
        homepageButton.href = hospital.url;
        homepageButton.style.display = 'inline-flex';
      } else {
        homepageButton.removeAttribute('href');
        homepageButton.style.display = 'none';
      }
    }

    if (mapLink) {
      mapLink.href = `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name || hospital.address || '병원')}`;
    }

    if (searchLink) {
      searchLink.href = `https://search.naver.com/search.naver?query=${encodeURIComponent(`${hospital.name || '병원'} 후기`)}`;
    }
  }

  function updateSourceSummary(items) {
    const target = document.getElementById('detail-source-summary');
    if (!target) {
      return;
    }

    const uniqueItems = Array.from(new Set((items || []).filter(Boolean)));
    target.textContent = uniqueItems.length > 0 ? uniqueItems.join(' / ') : '공공데이터 연동 상태 확인 중';
  }

  async function findPublicHospitalMatch(hospital, api) {
    try {
      const response = await api.fetchHospitals({ name: hospital.name, limit: 10 });
      if (response?.fromMock) {
        return null;
      }
      const hospitals = Array.isArray(response?.hospitals) ? response.hospitals : [];
      if (hospitals.length === 0) {
        return null;
      }

      const targetName = normalizeCompareText(hospital.name);
      const targetAddress = normalizeCompareText(hospital.address);

      const scored = hospitals.map((item) => {
        let score = 0;
        if (normalizeCompareText(item.name) === targetName) score += 100;
        if (targetAddress && normalizeCompareText(item.address).includes(targetAddress)) score += 30;
        if (hospital.region && item.region === hospital.region) score += 15;
        if (hospital.type && item.type === hospital.type) score += 10;
        return { item, score };
      }).sort((left, right) => right.score - left.score);

      return scored[0]?.score >= 100 ? scored[0].item : null;
    } catch (error) {
      console.warn('[detail] public hospital match failed:', error);
      return null;
    }
  }

  function mergePublicHospital(hospital, matchedHospital) {
    hospital.publicYkiho = matchedHospital.id;
    hospital.type = matchedHospital.type || hospital.type;
    hospital.address = matchedHospital.address || hospital.address;
    hospital.phone = matchedHospital.phone || hospital.phone;
    hospital.region = matchedHospital.region || hospital.region;
    hospital.district = matchedHospital.district || hospital.district;
    hospital.department = matchedHospital.department || hospital.department;
    hospital.departmentId = matchedHospital.departmentId || hospital.departmentId;
    hospital.lat = matchedHospital.lat || hospital.lat;
    hospital.lng = matchedHospital.lng || hospital.lng;
    hospital.url = matchedHospital.url || hospital.url;
    hospital.openDate = matchedHospital.openDate || hospital.openDate;
    hospital.specialistCount = Math.max(Number(hospital.specialistCount || 0), Number(matchedHospital.specialistCount || 0));
    hospital.reviewCount = Math.max(Number(hospital.reviewCount || 0), Number(matchedHospital.reviewCount || 0));
    hospital.score = Math.max(Number(hospital.score || 0), Number(matchedHospital.score || 0));
  }

  function buildHospitalHoursUrl(hospital) {
    const params = new URLSearchParams({
      name: hospital.name || '',
    });

    if (hospital.address) {
      params.set('address', hospital.address);
    }
    if (hospital.region) {
      params.set('region', hospital.region);
    }

    return `/api/hospital-hours?${params.toString()}`;
  }

  function updateMetaDescription(content) {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', content);
    }
  }

  function buildDoctorText(hospital) {
    const parts = [];
    if (toPositiveNumber(hospital.specialistCount) > 0) {
      parts.push(`전문의 ${hospital.specialistCount}명`);
    }
    if (toPositiveNumber(hospital.generalDoctorCount) > 0) {
      parts.push(`일반의 ${hospital.generalDoctorCount}명`);
    }
    return parts.join(', ') || '의료진 정보 확인 필요';
  }

  function buildOpenDateText(openDate) {
    if (!openDate) {
      return '개원일 정보 없음';
    }

    const date = new Date(openDate);
    if (Number.isNaN(date.getTime())) {
      return String(openDate);
    }

    const years = Math.max(new Date().getFullYear() - date.getFullYear(), 0);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day} (${years}년차)`;
  }

  function buildRegionText(hospital) {
    const parts = [hospital.region, hospital.district].filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : '지역 정보 확인 중';
  }

  function buildDistanceLabel(originHospital, targetHospital) {
    const distanceKm = calculateDistanceKm(originHospital, targetHospital);
    if (distanceKm === null) {
      return '';
    }
    if (distanceKm < 1) {
      return ` / 약 ${Math.round(distanceKm * 1000)}m`;
    }
    return ` / 약 ${distanceKm.toFixed(1)}km`;
  }

  function calculateDistanceKm(originHospital, targetHospital) {
    const lat1 = Number(originHospital?.lat);
    const lng1 = Number(originHospital?.lng);
    const lat2 = Number(targetHospital?.lat);
    const lng2 = Number(targetHospital?.lng);

    if (![lat1, lng1, lat2, lng2].every((value) => Number.isFinite(value) && value > 0)) {
      return null;
    }

    const toRadians = (degree) => (degree * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function normalizeCompareText(value) {
    return String(value || '').replace(/\s+/g, '').toLowerCase();
  }

  function formatPostDate(postDate) {
    const value = String(postDate || '').trim();
    if (!/^\d{8}$/.test(value)) {
      return '최근 후기';
    }
    return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
  }

  function stripTags(text) {
    return String(text || '').replace(/<[^>]*>/g, '').trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function setHomepageLink(url) {
    const row = document.getElementById('detail-homepage-row');
    const link = document.getElementById('detail-homepage-link');
    if (!row || !link) {
      return;
    }

    if (!url) {
      row.style.display = 'none';
      link.removeAttribute('href');
      return;
    }

    row.style.display = 'flex';
    link.href = url;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('ko-KR');
  }

  function getHospitalApi() {
    if (typeof HospitalAPI !== 'undefined') {
      return HospitalAPI;
    }
    return window.HospitalAPI;
  }

  function getHospitalList() {
    if (typeof HOSPITALS !== 'undefined') {
      return HOSPITALS;
    }
    return window.HOSPITALS;
  }

  function toPositiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`);
    }
    return response.json();
  }

  function getStoredMapKey() {
    try {
      return localStorage.getItem(NAVER_MAP_STORAGE_KEY) || '';
    } catch (error) {
      console.warn('[detail] localStorage unavailable:', error);
      return '';
    }
  }

  function loadNaverMapScript(clientId) {
    return new Promise((resolve, reject) => {
      if (window.naver?.maps) {
        resolve();
        return;
      }

      document.querySelectorAll('script[src*="openapi.map.naver.com"]').forEach((script) => script.remove());

      const callbackName = '__detailNaverMapLoaded';
      const timeoutId = window.setTimeout(() => {
        delete window[callbackName];
        reject(new Error('TIMEOUT'));
      }, 5000);

      window[callbackName] = () => {
        window.clearTimeout(timeoutId);
        delete window[callbackName];
        resolve();
      };

      const script = document.createElement('script');
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${encodeURIComponent(clientId)}&submodules=geocoder&callback=${callbackName}`;
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeoutId);
        delete window[callbackName];
        reject(new Error('AUTH_FAIL'));
      };

      document.head.appendChild(script);
    });
  }
})();
