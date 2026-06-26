(() => {
  const NAVER_MAP_DEFAULT_KEYS = ['390058kho4', 'rgd9ajy97r'];
  const NAVER_MAP_STORAGE_KEY = 'NAVER_MAP_KEY';
  const FALLBACK_REVIEW_TEXTS = [
    '접수 대기 동선이 비교적 안정적이고 진료 안내가 명확한 편입니다.',
    '의료진 설명이 차분하고 필요한 검사와 다음 단계 안내가 비교적 분명합니다.',
    '위치와 접근성이 좋아 재방문 후기에서 자주 언급되는 병원입니다.',
    '야간 또는 토요일 진료 여부는 방문 전 다시 확인하는 편이 안전합니다.',
  ];
  const detailRuntime = createEmptyDetailRuntime();

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
    resetDetailRuntime();
    document.title = `${hospital.name} 후기, 평점 및 진료 정보 - 병원찾기`;
    updateMetaDescription(
      `${hospital.name}의 위치, 연락처, 진료 정보, 후기 요약을 병원찾기에서 확인하세요.`
    );

    refreshHospitalOverview(hospital);
    setText('detail-emergency', '응급 진료 정보 확인 필요');
    setText('detail-hours-note', '점심시간 및 접수 안내 확인 중...');
    setText('detail-duty-note', '공개 데이터 기반 진료 안내 정보를 정리 중입니다.');
    setText('detail-match-summary', '공공 병원 데이터 매칭 확인 중...');
    setText('detail-operation-summary', '운영 정보를 정리 중입니다.');
    setText('detail-location-summary', '위치 기준 정보를 정리 중입니다.');
    setText('detail-equipment-summary', '장비와 시설 정보를 정리 중입니다.');
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
    let matchMeta = null;

    try {
      let publicYkiho = typeof hospital.id === 'string' && hospital.id.startsWith('JD') ? hospital.id : '';

      if (!publicYkiho && api?.fetchHospitals) {
        const matchedHospital = await findPublicHospitalMatch(hospital, api);
        if (matchedHospital?.hospital) {
          mergePublicHospital(hospital, matchedHospital.hospital);
          publicYkiho = matchedHospital.hospital.id;
          matchMeta = matchedHospital.meta;
          sourceStates.push('기본 병원 API 연동');
          refreshHospitalOverview(hospital);
        } else {
          matchMeta = {
            status: 'fallback',
            summary: '공공 병원 데이터 매칭이 없어 현재 보유 정보 기준으로 노출합니다.',
          };
          sourceStates.push('기본 정보는 보유 데이터 사용');
        }
      } else if (publicYkiho) {
        matchMeta = {
          status: 'direct',
          summary: `공공 병원 고유코드(${publicYkiho})로 직접 조회했습니다.`,
        };
        sourceStates.push('기본 병원 API 연동');
      }

      if (publicYkiho) {
        const [detailResult, equipResult, hoursResult] = await Promise.allSettled([
          fetchJsonWithMeta(`/api/hospital-details?ykiho=${encodeURIComponent(publicYkiho)}`),
          fetchJsonWithMeta(`/api/hospital-equip?ykiho=${encodeURIComponent(publicYkiho)}`),
          fetchJsonWithMeta(buildHospitalHoursUrl(hospital)),
        ]);

        if (detailResult.status === 'fulfilled') {
          detailRuntime.detailData = detailResult.value.data;
          applyDetailData(detailResult.value.data, hospital);
          if (detailResult.value.data?.found === true) {
            sourceStates.push(buildSourceStateLabelSafe('상세 정보 API', detailResult.value.dataSource));
          }
        }

        if (equipResult.status === 'fulfilled') {
          detailRuntime.equipData = equipResult.value.data;
          applyEquipData(equipResult.value.data);
          if (equipResult.value.data?.found === true) {
            sourceStates.push(buildSourceStateLabelSafe('장비 정보 API', equipResult.value.dataSource));
          }
        }

        if (hoursResult.status === 'fulfilled') {
          detailRuntime.hoursData = hoursResult.value.data;
          applyHoursData(hoursResult.value.data, hospital);
          if (hoursResult.value.data?.found === true) {
            sourceStates.push(buildSourceStateLabelSafe('진료시간 API', hoursResult.value.dataSource));
          }
        }
      } else {
        const hoursData = await fetchJsonWithMeta(buildHospitalHoursUrl(hospital));
        detailRuntime.hoursData = hoursData.data;
        applyHoursData(hoursData.data, hospital);
        if (hoursData.data?.found === true) {
          sourceStates.push(buildSourceStateLabelSafe('진료시간 API', hoursData.dataSource));
        }
      }
    } catch (error) {
      console.warn('[detail] public detail enrichment skipped:', error);
      if (!matchMeta) {
        matchMeta = {
          status: 'error',
          summary: '공공데이터 상세 연동 중 오류가 발생해 기본 정보를 우선 표시합니다.',
        };
      }
      sourceStates.push('공공데이터 상세 연동 실패');
    }

    detailRuntime.matchMeta = matchMeta;
    detailRuntime.sourceStates = sourceStates;
    const publicCodeSummary = buildPublicCodeSummarySafe(detailRuntime.detailData, detailRuntime.hoursData);
    if (publicCodeSummary) {
      sourceStates.push(publicCodeSummary);
    }
    updateSourceSummary(sourceStates);
    refreshHospitalOverview(hospital);
    renderPublicDigest(hospital);
  }

  async function hydrateReviews(hospital) {
    renderFallbackReviews(hospital);
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
    let lastError = null;
    try {
      const candidateKeys = getMapKeyCandidates();
      if (candidateKeys.length === 0) {
        return;
      }

      for (const clientId of candidateKeys) {
        try {
          resetNaverMapRuntime();
          await loadNaverMapScript(clientId);
          renderLiveMap(hospital);

          const authOk = await verifyRenderedMap();
          if (authOk) {
            return;
          }

          lastError = new Error(`AUTH_FAIL:${clientId}`);
        } catch (error) {
          lastError = error;
        }
      }
    } catch (error) {
      lastError = error;
    }

    if (lastError) {
      console.warn('[detail] live map skipped:', lastError);
      const message = String(lastError.message || '').startsWith('AUTH_FAIL')
        ? buildDetailMapAuthMessage(getMapKeyCandidates())
        : '실시간 지도를 불러오지 못해 네이버 지도 바로가기로 대체했습니다.';
      renderMapFallback(hospital, message);
    }
  }

  function applyDetailData(detailData, hospital) {
    if (!detailData || detailData.found !== true) {
      return;
    }

    if (detailData.telno && !hospital.phone) {
      hospital.phone = detailData.telno;
    }
    if (detailData.addr && !hospital.address) {
      hospital.address = detailData.addr;
    }
    if (detailData.hospUrl && !hospital.url) {
      hospital.url = detailData.hospUrl;
    }

    if (detailData.hours) {
      renderHours(detailData.hours);
    }

    const parkingItems = Array.isArray(detailData.parkingSummary)
      ? detailData.parkingSummary.filter(Boolean)
      : [];
    if (parkingItems.length === 0) {
      if (detailData.parkXpnsYn) {
        parkingItems.push(detailData.parkXpnsYn === 'Y' ? '유료 주차' : '무료 주차');
      }
      if (detailData.parkQty) {
        parkingItems.push(`주차 가능 대수 ${detailData.parkQty}`);
      }
      if (detailData.parkEtc) {
        parkingItems.push(detailData.parkEtc);
      }
    }
    if (parkingItems.length > 0) {
      setText('detail-parking', parkingItems.join(' / '));
    }

    const emergencyItems = Array.isArray(detailData.emergencySummary)
      ? detailData.emergencySummary.filter(Boolean)
      : [];
    if (emergencyItems.length === 0) {
      if (detailData.emyDayYn === 'Y') emergencyItems.push('주간 응급 진료 가능');
      if (detailData.emyNgtYn === 'Y') emergencyItems.push('야간 응급 진료 가능');
      if (detailData.emyDayTelNo1) emergencyItems.push(`응급 문의 ${detailData.emyDayTelNo1}`);
    }
    if (emergencyItems.length > 0) {
      setText('detail-emergency', emergencyItems.join(' / '));
      hospital.hasEmergency = true;
    }

    const noteItems = Array.isArray(detailData.receptionSummary)
      ? detailData.receptionSummary.filter(Boolean)
      : [];
    if (noteItems.length === 0) {
      if (detailData.rcvWeek) noteItems.push(`평일 접수 ${detailData.rcvWeek}`);
      if (detailData.rcvSat) noteItems.push(`토요일 접수 ${detailData.rcvSat}`);
      if (detailData.lunchWeek) noteItems.push(`점심시간 ${detailData.lunchWeek}`);
    }
    if (noteItems.length > 0) {
      setText('detail-hours-note', noteItems.join(' / '));
    }

    const detailNotes = [];
    if (detailData.ykiho) detailNotes.push(`HIRA 코드 ${detailData.ykiho}`);
    if (detailData.hospUrl || hospital.url) detailNotes.push('공식 홈페이지 정보 확인');
    if (parkingItems.length > 0) detailNotes.push(parkingItems[0]);
    if (detailNotes.length > 0) {
      setText('detail-duty-note', detailNotes.join(' / '));
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

    if (Array.isArray(equipData.topEquipment) && equipData.topEquipment.length > 0) {
      const topSummary = equipData.topEquipment
        .slice(0, 4)
        .map((item) => `${item.name} ${item.count}대`)
        .join(', ');
      setText('detail-equipment-summary', topSummary);
    } else if (Array.isArray(equipData.facilitySummary) && equipData.facilitySummary.length > 0) {
      setText('detail-equipment-summary', equipData.facilitySummary.join(' / '));
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
    if (hoursData.dutyMapimg) {
      hospital.mapImage = hoursData.dutyMapimg;
    }

    if (Array.isArray(hoursData.operationSummary) && hoursData.operationSummary.length > 0) {
      setText('detail-duty-note', hoursData.operationSummary.slice(0, 3).join(' / '));
    } else if (hoursData.dutyInf) {
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
    renderChoiceSummaryCard(hospital);
    renderSupplementaryDetails(hospital);
    renderVisitPlanningDigest(hospital);
    renderSnapshotCard(hospital);
    renderComparePoints(hospital);
    renderGuideRecommendations(hospital);
    renderRelatedSearchLinks(hospital);
    renderRegionalLandingLinks(hospital);
    renderRecommendationCollections(hospital);
    const faqItems = renderHospitalFaqs(hospital);
    renderOperationalExploreLinks(hospital);
    renderTrustDetails(hospital);
    renderSchema(hospital, score, reviewCount);
    renderFaqSchema(faqItems);
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

  function renderChoiceSummaryCard(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital) || buildFallbackHospitalProfile(hospital);
    const detailData = detailRuntime.detailData || {};
    const summaryParts = [];
    const compareParts = [];
    const flowParts = [];
    const cautionParts = [];

    if (Array.isArray(profile.visitTargets) && profile.visitTargets.length > 0) {
      summaryParts.push(profile.visitTargets[0]);
    }
    if (Array.isArray(profile.primaryServices) && profile.primaryServices.length > 0) {
      summaryParts.push(`주요 진료는 ${profile.primaryServices.slice(0, 2).join(', ')} 중심으로 먼저 보면 좋습니다.`);
    }
    if (Number(hospital.specialistCount || 0) > 0) {
      summaryParts.push(`전문의 ${hospital.specialistCount}명 기준으로 비교할 수 있습니다.`);
    }

    if (Number(hospital.score || 0) > 0) compareParts.push(`평점 ${Number(hospital.score).toFixed(1)}`);
    if (Number(hospital.reviewCount || 0) > 0) compareParts.push(`후기 ${Number(hospital.reviewCount).toLocaleString()}개`);
    if (hospital.saturdayOpen) compareParts.push('토요일 진료');
    if (hospital.sundayOpen) compareParts.push('일요일 진료');
    if (hospital.nightOpen) compareParts.push('야간 진료');
    if (hospital.equipment) compareParts.push(`장비 ${String(hospital.equipment).split(',')[0].trim()}`);
    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      compareParts.push(`주차 ${hospital.parkingCapacity}대`);
    } else if (hospital.parkingFee) {
      compareParts.push(`주차 ${hospital.parkingFee}`);
    }

    if (Array.isArray(detailData.receptionSummary) && detailData.receptionSummary.length > 0) {
      flowParts.push(detailData.receptionSummary[0]);
    } else if (profile.reservation) {
      flowParts.push(profile.reservation);
    }
    if (Array.isArray(profile.documents) && profile.documents.length > 0) {
      flowParts.push(`준비서류는 ${profile.documents.slice(0, 2).join(', ')} 순으로 먼저 챙기면 됩니다.`);
    }
    if (profile.transport) {
      flowParts.push(profile.transport);
    } else if (hospital.subway) {
      flowParts.push(hospital.subway);
    }

    if (detailData.lunchWeek) {
      cautionParts.push(`점심시간은 ${detailData.lunchWeek} 기준으로 한 번 더 확인하세요.`);
    }
    if (Array.isArray(detailData.parkingSummary) && detailData.parkingSummary.length > 0) {
      cautionParts.push(detailData.parkingSummary[0]);
    } else if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      cautionParts.push(`주차 가능 대수는 약 ${hospital.parkingCapacity}대 기준입니다.`);
    } else if (hospital.parkingFee) {
      cautionParts.push(`주차 정보는 ${hospital.parkingFee} 기준으로 확인됩니다.`);
    }
    if (Array.isArray(profile.checklist) && profile.checklist.length > 0) {
      cautionParts.push(profile.checklist[0]);
    }
    if (detailRuntime.matchMeta?.summary) {
      cautionParts.push(detailRuntime.matchMeta.summary);
    }

    setText('detail-choice-summary', uniqueStrings(summaryParts).slice(0, 3).join(' / ') || '이 병원이 어떤 상황에 잘 맞는지 정리 중입니다.');
    setText('detail-choice-compare', uniqueStrings(compareParts).slice(0, 4).join(' / ') || '평점, 후기, 운영시간, 장비 정보를 비교 포인트로 정리 중입니다.');
    setText('detail-choice-flow', uniqueStrings(flowParts).slice(0, 3).join(' / ') || '접수, 준비서류, 이동 동선을 기준으로 내원 흐름을 정리 중입니다.');
    setText('detail-choice-caution', uniqueStrings(cautionParts).slice(0, 3).join(' / ') || '방문 전 접수 마감과 운영 시간을 한 번 더 확인하는 편이 좋습니다.');
  }

  function renderSupplementaryDetails(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital) || buildFallbackHospitalProfile(hospital);

    setText('detail-primary-services', formatDetailList(profile.primaryServices, '주요 진료 정보를 준비 중입니다.'));
    setText('detail-visit-targets', formatDetailList(profile.visitTargets, '어떤 상황에 잘 맞는지 정리 중입니다.'));
    setText('detail-documents', formatDetailList(profile.documents, '신분증과 기존 검사 결과를 먼저 챙기는 편이 좋습니다.'));
    setText('detail-reservation', profile.reservation || '방문 전 접수 시간과 필요한 서류를 먼저 확인하세요.');
    setText('detail-transport', profile.transport || '대중교통과 주차 동선을 방문 전에 확인하세요.');
    setText('detail-accessibility', profile.accessibility || '엘리베이터, 주차, 보호자 대기 공간은 병원에 직접 확인하는 편이 안전합니다.');
    setText('detail-checklist', formatDetailList(profile.checklist, '초진 목적과 증상 시작 시점을 메모해 가면 설명이 빨라집니다.'));
  }

  function renderVisitPlanningDigest(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital) || buildFallbackHospitalProfile(hospital);
    const detailData = detailRuntime.detailData || {};
    const symptomParts = [];
    const intakeParts = [];
    const parkingParts = [];
    const flowParts = [];

    if (Array.isArray(profile.visitTargets) && profile.visitTargets.length > 0) {
      symptomParts.push(...profile.visitTargets.slice(0, 2));
    }
    if (Array.isArray(profile.primaryServices) && profile.primaryServices.length > 0) {
      symptomParts.push(`주요 진료는 ${profile.primaryServices.slice(0, 2).join(', ')} 기준으로 먼저 비교하면 좋습니다.`);
    }

    if (Array.isArray(detailData.receptionSummary) && detailData.receptionSummary.length > 0) {
      intakeParts.push(...detailData.receptionSummary.slice(0, 2));
    }
    if (profile.reservation) {
      intakeParts.push(profile.reservation);
    }
    if (detailData.lunchWeek) {
      intakeParts.push(`점심시간은 ${detailData.lunchWeek} 기준으로 한 번 더 확인하세요.`);
    }

    if (Array.isArray(detailData.parkingSummary) && detailData.parkingSummary.length > 0) {
      parkingParts.push(...detailData.parkingSummary.slice(0, 2));
    }
    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      parkingParts.push(`주차 가능 대수는 약 ${hospital.parkingCapacity}대 기준입니다.`);
    } else if (hospital.parkingFee) {
      parkingParts.push(`주차 정보는 ${hospital.parkingFee} 기준으로 확인됩니다.`);
    }
    if (profile.transport) {
      parkingParts.push(profile.transport);
    }

    if (Array.isArray(profile.checklist) && profile.checklist.length > 0) {
      flowParts.push(...profile.checklist.slice(0, 2));
    }
    if (Array.isArray(profile.documents) && profile.documents.length > 0) {
      flowParts.push(`준비물은 ${profile.documents.slice(0, 2).join(', ')}부터 챙기면 수월합니다.`);
    }

    setText('detail-symptom-focus', uniqueStrings(symptomParts).slice(0, 3).join(' / ') || '대표 증상과 진료 목적 기준으로 먼저 비교하는 편이 좋습니다.');
    setText('detail-intake-tip', uniqueStrings(intakeParts).slice(0, 3).join(' / ') || '초진 접수 가능 시간과 필요 서류를 방문 전에 먼저 확인하세요.');
    setText('detail-parking-tip', uniqueStrings(parkingParts).slice(0, 3).join(' / ') || '주차 가능 여부와 대중교통 동선은 병원에 한 번 더 확인하는 편이 안전합니다.');
    setText('detail-visit-flow', uniqueStrings(flowParts).slice(0, 3).join(' / ') || '증상 메모와 기존 검사 결과를 챙기고 접수 마감 시간을 먼저 확인하세요.');
  }

  function renderSnapshotCard(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital) || buildFallbackHospitalProfile(hospital);
    const summaryParts = [];

    if (hospital.department) summaryParts.push(hospital.department);
    if (hospital.type) summaryParts.push(hospital.type);
    if (Number(hospital.specialistCount || 0) > 0) summaryParts.push(`전문의 ${hospital.specialistCount}명`);
    if (profile.primaryServices?.length) summaryParts.push(profile.primaryServices.slice(0, 2).join(', '));

    const visitParts = [];
    if (profile.visitTargets?.length) visitParts.push(profile.visitTargets.slice(0, 2).join(' / '));
    if (profile.checklist?.length) visitParts.push(profile.checklist[0]);

    setText('detail-snapshot-summary', summaryParts.filter(Boolean).join(' / ') || '병원 핵심 비교 포인트를 정리 중입니다.');
    setText('detail-snapshot-operation', buildOperationSummarySafe(hospital, detailRuntime.detailData));
    setText('detail-snapshot-facility', buildEquipmentSummarySafe(hospital, detailRuntime.equipData));
    setText('detail-snapshot-visit', visitParts.filter(Boolean).join(' / ') || '방문 전에 챙길 포인트를 정리 중입니다.');
  }

  function renderGuideRecommendations(hospital) {
    const container = document.getElementById('detail-guide-links');
    if (!container) {
      return;
    }

    const contentApi = getHospitalContent();
    const guides = contentApi?.buildGuideRecommendations?.(hospital) || [];
    if (!guides.length) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">관련 가이드를 준비 중입니다.</p>';
      return;
    }

    container.innerHTML = guides.map((guide) => `
      <a href="${escapeHtml(guide.href)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(guide.title)}</strong>
        <span style="font-size:0.93rem; color:var(--text-body); line-height:1.6;">${escapeHtml(guide.description)}</span>
        <span style="font-size:0.82rem; color:var(--primary); font-weight:600;">가이드 열기</span>
      </a>
    `).join('');
  }

  function renderRelatedSearchLinks(hospital) {
    const container = document.getElementById('detail-related-searches');
    if (!container) {
      return;
    }

    const contentApi = getHospitalContent();
    const links = contentApi?.buildRelatedSearchLinks?.(hospital) || [];
    if (!links.length) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">관련 탐색 링크를 준비 중입니다.</p>';
      return;
    }

    container.innerHTML = links.map((link) => `
      <a href="${escapeHtml(link.href)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(link.title)}</strong>
        <span style="font-size:0.93rem; color:var(--text-body); line-height:1.6;">${escapeHtml(link.description)}</span>
        <span style="font-size:0.82rem; color:var(--primary); font-weight:600;">목록으로 이동</span>
      </a>
    `).join('');
  }

  function renderRegionalLandingLinks(hospital) {
    const container = ensureRegionalLandingContainer();
    if (!container) {
      return;
    }

    const contentApi = getHospitalContent();
    const links = contentApi?.buildRegionalLandingLinks?.(hospital) || [];
    if (!links.length) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">지역별 병원 페이지를 준비 중입니다.</p>';
      return;
    }

    container.innerHTML = links.map((link) => `
      <a href="${escapeHtml(link.href)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(link.title)}</strong>
        <span style="font-size:0.93rem; color:var(--text-body); line-height:1.6;">${escapeHtml(link.description)}</span>
        <span style="font-size:0.82rem; color:var(--primary); font-weight:600;">${escapeHtml(link.badge || '지역 페이지')}</span>
      </a>
    `).join('');
  }

  function renderRecommendationCollections(hospital) {
    const similarContainer = ensureSimilarRecommendationContainer();
    if (similarContainer) {
      const items = buildSimilarHospitalRecommendations(hospital);
      renderRecommendationHospitalCards(
        similarContainer,
        items,
        hospital,
        '같은 진료과 또는 같은 지역에서 비교할 병원을 준비 중입니다.'
      );
    }

    const operationalContainer = ensureOperationalRecommendationContainer();
    if (operationalContainer) {
      const items = buildOperationalPriorityHospitals(hospital);
      renderRecommendationHospitalCards(
        operationalContainer,
        items,
        hospital,
        '토요, 야간, 응급, 주차 기준으로 다시 비교할 병원을 준비 중입니다.'
      );
    }
  }

  function buildSimilarHospitalRecommendations(hospital) {
    const localList = Array.isArray(getHospitalList()) ? getHospitalList() : [];

    return localList
      .filter((item) => String(item.id) !== String(hospital.id))
      .filter((item) => (
        item.departmentId === hospital.departmentId ||
        item.region === hospital.region ||
        item.district === hospital.district
      ))
      .map((item) => {
        let score = 0;
        const reasons = [];

        if (item.departmentId === hospital.departmentId) {
          score += 42;
          reasons.push('같은 진료과');
        }
        if (item.region && item.region === hospital.region) {
          score += 20;
          reasons.push('같은 지역');
        }
        if (item.district && item.district === hospital.district) {
          score += 12;
          reasons.push('같은 생활권');
        }
        if (item.type && item.type === hospital.type) {
          score += 6;
        }
        if (hospital.saturdayOpen && item.saturdayOpen) {
          score += 8;
          reasons.push('토요 진료');
        }
        if (hospital.nightOpen && item.nightOpen) {
          score += 8;
          reasons.push('야간 진료');
        }
        if (hospital.hasEmergency && item.hasEmergency) {
          score += 8;
          reasons.push('응급 대응');
        }

        score += Math.min(Number(item.specialistCount || 0), 8);
        score += Math.min(Number(item.reviewCount || 0) / 80, 6);
        score += Number(item.score || 0);

        return {
          ...item,
          recommendationReason: uniqueStrings(reasons).slice(0, 3).join(' · ') || '같은 권역 병원 비교',
          recommendationScore: score,
        };
      })
      .sort((left, right) => (
        right.recommendationScore - left.recommendationScore ||
        (right.reviewCount || 0) - (left.reviewCount || 0) ||
        (right.specialistCount || 0) - (left.specialistCount || 0)
      ))
      .slice(0, 4);
  }

  function buildOperationalPriorityHospitals(hospital) {
    const localList = Array.isArray(getHospitalList()) ? getHospitalList() : [];
    const targetFlags = [
      hospital.saturdayOpen ? 'saturdayOpen' : '',
      hospital.sundayOpen ? 'sundayOpen' : '',
      hospital.nightOpen ? 'nightOpen' : '',
      hospital.hasEmergency ? 'hasEmergency' : '',
    ].filter(Boolean);

    return localList
      .filter((item) => String(item.id) !== String(hospital.id))
      .filter((item) => item.region === hospital.region || item.departmentId === hospital.departmentId)
      .map((item) => {
        let score = 0;
        const reasons = [];

        if (item.region && item.region === hospital.region) {
          score += 22;
          reasons.push('같은 지역');
        }
        if (item.departmentId === hospital.departmentId) {
          score += 16;
          reasons.push('같은 진료과');
        }
        if (item.district && item.district === hospital.district) {
          score += 8;
        }

        if (targetFlags.length > 0) {
          targetFlags.forEach((flag) => {
            if (item[flag]) {
              score += 16;
              reasons.push(getOperationalReasonLabel(flag));
            }
          });
        } else {
          if (item.saturdayOpen) {
            score += 8;
            reasons.push('토요 진료');
          }
          if (item.nightOpen) {
            score += 8;
            reasons.push('야간 진료');
          }
          if (item.sundayOpen) {
            score += 8;
            reasons.push('일요 진료');
          }
        }

        if (item.hasEmergency) {
          score += 8;
        }
        if (toPositiveNumber(item.parkingCapacity) > 0 || item.parkingFee) {
          score += 6;
          reasons.push('주차 정보');
        }

        score += Math.min(Number(item.specialistCount || 0), 6);
        score += Math.min(Number(item.reviewCount || 0) / 100, 5);
        score += Number(item.score || 0);

        return {
          ...item,
          recommendationReason: uniqueStrings(reasons).slice(0, 3).join(' · ') || '운영 조건 비교',
          recommendationScore: score,
        };
      })
      .sort((left, right) => (
        right.recommendationScore - left.recommendationScore ||
        (right.reviewCount || 0) - (left.reviewCount || 0) ||
        (right.specialistCount || 0) - (left.specialistCount || 0)
      ))
      .slice(0, 4);
  }

  function renderRecommendationHospitalCards(container, items, hospital, emptyMessage) {
    if (!container) {
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = `<p style="margin:0; color:var(--text-muted);">${escapeHtml(emptyMessage)}</p>`;
      return;
    }

    container.innerHTML = items.map((item) => {
      const contentApi = getHospitalContent();
      const profile = contentApi?.buildHospitalProfile?.(item);
      const serviceText = Array.isArray(profile?.primaryServices) && profile.primaryServices.length > 0
        ? profile.primaryServices.slice(0, 2).join(', ')
        : '';
      const badgeItems = buildRecommendationBadgeItems(item);

      return `
        <a href="detail.html?id=${encodeURIComponent(item.id)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
          <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(item.name)}</strong>
          <span style="font-size:0.84rem; color:var(--primary); font-weight:700;">${escapeHtml(item.recommendationReason || '추천 비교')}</span>
          <span style="font-size:0.9rem; color:var(--text-body);">${escapeHtml(item.type || hospital.type || '병원')}</span>
          <span style="font-size:0.92rem; color:var(--text-body); line-height:1.6;">${escapeHtml(item.address || '주소 정보 확인 필요')}</span>
          ${badgeItems.length > 0 ? `<div style="display:flex; flex-wrap:wrap; gap:6px;">${badgeItems.map((badge) => `<span style="display:inline-flex; align-items:center; min-height:24px; padding:3px 9px; border-radius:999px; background:${escapeHtml(badge.background)}; color:${escapeHtml(badge.color)}; font-size:0.74rem; font-weight:700;">${escapeHtml(badge.label)}</span>`).join('')}</div>` : ''}
          ${serviceText ? `<span style="font-size:0.88rem; color:var(--text-body); line-height:1.6;">핵심 진료: ${escapeHtml(serviceText)}</span>` : ''}
          <span style="font-size:0.82rem; color:var(--text-muted);">전문의 ${escapeHtml(String(item.specialistCount || 0))}명 / 리뷰 ${escapeHtml(String(item.reviewCount || 0))}개${buildDistanceLabel(hospital, item)}</span>
        </a>
      `;
    }).join('');
  }

  function buildRecommendationBadgeItems(hospital) {
    const badges = [];

    if (hospital.saturdayOpen) {
      badges.push({ label: '토요 진료', background: '#edf4ee', color: '#46685b' });
    }
    if (hospital.nightOpen) {
      badges.push({ label: '야간 진료', background: '#f0eee8', color: '#6d5d48' });
    }
    if (hospital.sundayOpen) {
      badges.push({ label: '일요 진료', background: '#f6efe3', color: '#9a6d2f' });
    }
    if (hospital.hasEmergency) {
      badges.push({ label: '응급 대응', background: '#fce9e6', color: '#a44737' });
    }
    if (toPositiveNumber(hospital.parkingCapacity) > 0 || hospital.parkingFee) {
      badges.push({ label: '주차 정보', background: '#ece9e2', color: '#564d43' });
    }

    return badges.slice(0, 4);
  }

  function ensureRegionalLandingContainer() {
    const existing = document.getElementById('detail-landing-links');
    if (existing) {
      return existing;
    }

    const relatedContainer = document.getElementById('detail-related-searches');
    const relatedCard = relatedContainer?.closest('.info-card');
    if (!relatedCard || !relatedCard.parentElement) {
      return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'info-card';
    wrapper.innerHTML = `
      <h3>지역 랜딩 페이지</h3>
      <div id="detail-landing-links" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <p style="margin:0; color:var(--text-muted);">같은 지역 기준으로 정리한 랜딩 페이지를 불러오는 중입니다...</p>
      </div>
    `;

    relatedCard.insertAdjacentElement('afterend', wrapper);
    return wrapper.querySelector('#detail-landing-links');
  }

  function renderHospitalFaqs(hospital) {
    const container = ensureHospitalFaqContainer();
    if (!container) {
      return [];
    }

    const contentApi = getHospitalContent();
    const items = contentApi?.buildHospitalFaqs?.(hospital) || [];
    if (!items.length) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">방문 전 자주 묻는 질문을 준비 중입니다.</p>';
      return [];
    }

    container.innerHTML = items.map((item, index) => `
      <details ${index === 0 ? 'open' : ''} style="border:1px solid var(--border-default); border-radius:14px; background:var(--bg-body); padding:16px 18px;">
        <summary style="cursor:pointer; font-weight:700; color:var(--text-heading); line-height:1.5;">${escapeHtml(item.question)}</summary>
        <p style="margin:12px 0 0; color:var(--text-body); line-height:1.75;">${escapeHtml(item.answer)}</p>
      </details>
    `).join('');

    return items;
  }

  function renderOperationalExploreLinks(hospital) {
    const container = ensureOperationalExploreContainer();
    if (!container) {
      return;
    }

    const contentApi = getHospitalContent();
    const links = contentApi?.buildOperationalExploreLinks?.(hospital) || [];
    if (!links.length) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">운영 조건별 추천 탐색을 준비 중입니다.</p>';
      return;
    }

    container.innerHTML = links.map((link) => `
      <a href="${escapeHtml(link.href)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(link.title)}</strong>
        <span style="font-size:0.93rem; color:var(--text-body); line-height:1.6;">${escapeHtml(link.description)}</span>
        <span style="font-size:0.82rem; color:var(--primary); font-weight:600;">${escapeHtml(link.badge || '추천 탐색')}</span>
      </a>
    `).join('');
  }

  function ensureHospitalFaqContainer() {
    const existing = document.getElementById('detail-faq-list');
    if (existing) {
      return existing;
    }

    const landingContainer = document.getElementById('detail-landing-links');
    const anchorCard = landingContainer?.closest('.info-card')
      || document.getElementById('detail-related-searches')?.closest('.info-card');
    if (!anchorCard || !anchorCard.parentElement) {
      return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'info-card';
    wrapper.innerHTML = `
      <h3>병원 방문 FAQ</h3>
      <div id="detail-faq-list" style="display:flex; flex-direction:column; gap:12px;">
        <p style="margin:0; color:var(--text-muted);">병원 방문 전 자주 묻는 질문을 불러오는 중입니다...</p>
      </div>
    `;

    anchorCard.insertAdjacentElement('afterend', wrapper);
    return wrapper.querySelector('#detail-faq-list');
  }

  function ensureOperationalExploreContainer() {
    const existing = document.getElementById('detail-operational-links');
    if (existing) {
      return existing;
    }

    const faqContainer = document.getElementById('detail-faq-list');
    const anchorCard = faqContainer?.closest('.info-card')
      || document.getElementById('detail-landing-links')?.closest('.info-card');
    if (!anchorCard || !anchorCard.parentElement) {
      return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'info-card';
    wrapper.innerHTML = `
      <h3>운영 조건별 추천 탐색</h3>
      <div id="detail-operational-links" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <p style="margin:0; color:var(--text-muted);">토요일 진료, 야간 진료, 주차 정보 기준의 추천 경로를 불러오는 중입니다...</p>
      </div>
    `;

    anchorCard.insertAdjacentElement('afterend', wrapper);
    return wrapper.querySelector('#detail-operational-links');
  }

  function ensureSimilarRecommendationContainer() {
    const existing = document.getElementById('detail-similar-hospital-list');
    if (existing) {
      return existing;
    }

    const nearbyContainer = document.getElementById('detail-nearby-list');
    const anchorCard = nearbyContainer?.closest('.info-card');
    if (!anchorCard || !anchorCard.parentElement) {
      return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'info-card';
    wrapper.innerHTML = `
      <h3>비슷한 조건 병원</h3>
      <div id="detail-similar-hospital-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <p style="margin:0; color:var(--text-muted);">같은 진료과와 같은 지역 기준 추천 병원을 정리 중입니다...</p>
      </div>
    `;

    anchorCard.insertAdjacentElement('afterend', wrapper);
    return wrapper.querySelector('#detail-similar-hospital-list');
  }

  function ensureOperationalRecommendationContainer() {
    const existing = document.getElementById('detail-operational-hospital-list');
    if (existing) {
      return existing;
    }

    const similarContainer = document.getElementById('detail-similar-hospital-list');
    const anchorCard = similarContainer?.closest('.info-card')
      || document.getElementById('detail-nearby-list')?.closest('.info-card');
    if (!anchorCard || !anchorCard.parentElement) {
      return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'info-card';
    wrapper.innerHTML = `
      <h3>운영 조건 비교 병원</h3>
      <div id="detail-operational-hospital-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <p style="margin:0; color:var(--text-muted);">토요, 야간, 응급, 주차 기준 추천 병원을 정리 중입니다...</p>
      </div>
    `;

    anchorCard.insertAdjacentElement('afterend', wrapper);
    return wrapper.querySelector('#detail-operational-hospital-list');
  }

  function renderTrustDetails(hospital) {
    const container = ensureTrustDetailsContainer();
    if (!container) {
      return;
    }

    const regionText = hospital?.region || '해당 지역';
    const departmentText = hospital?.department || hospital?.type || '병원';
    container.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <div style="padding:16px; border:1px solid var(--border-default); border-radius:12px; background:var(--bg-body);">
          <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">데이터 기준</strong>
          <p style="margin:0; color:var(--text-body); line-height:1.7;">이 페이지는 공개 데이터와 병원 안내 기준으로 ${regionText} ${departmentText} 정보를 참고용으로 정리한 화면입니다.</p>
        </div>
        <div style="padding:16px; border:1px solid var(--border-default); border-radius:12px; background:var(--bg-body);">
          <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">운영 확인</strong>
          <p style="margin:0; color:var(--text-body); line-height:1.7;">접수 마감, 검사 포함 여부, 비용, 보호자 동행 필요 여부는 방문 전 병원에 직접 확인하는 편이 안전합니다.</p>
        </div>
        <div style="padding:16px; border:1px solid var(--border-default); border-radius:12px; background:var(--bg-body);">
          <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">수정 요청</strong>
          <p style="margin:0; color:var(--text-body); line-height:1.7;">정보가 다르면 <a href="contact.html" style="color:var(--primary); font-weight:600;">문의하기</a> 또는 <a href="mailto:replyleaders@naver.com" style="color:var(--primary); font-weight:600;">replyleaders@naver.com</a>으로 보내주시면 검토 후 반영합니다.</p>
        </div>
      </div>
      <p style="margin:16px 0 0; color:var(--text-muted); line-height:1.7;">최근 확인일: 2026-06-20 · 자세한 운영 기준은 <a href="about.html" style="color:var(--primary); font-weight:600;">사이트 소개</a>, <a href="editorial-policy.html" style="color:var(--primary); font-weight:600;">콘텐츠 편집 원칙</a>, <a href="ad-policy.html" style="color:var(--primary); font-weight:600;">광고 및 제휴 안내</a>에서 확인할 수 있습니다.</p>
      <p style="margin:8px 0 0; color:var(--text-muted); line-height:1.7;">증상 악화, 응급 상황, 수술 결정은 이 페이지만으로 판단하지 말고 해당 병원이나 의료진과 직접 상담해 주세요.</p>
    `;
  }

  function ensureTrustDetailsContainer() {
    const existing = document.getElementById('detail-trust-details');
    if (existing) {
      return existing;
    }

    const operationalContainer = document.getElementById('detail-operational-links');
    const anchorCard = operationalContainer?.closest('.info-card')
      || document.getElementById('detail-faq-list')?.closest('.info-card');
    if (!anchorCard || !anchorCard.parentElement) {
      return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'info-card';
    wrapper.innerHTML = `
      <h3>이 페이지를 보는 기준</h3>
      <div id="detail-trust-details">
        <p style="margin:0; color:var(--text-muted);">데이터 기준과 운영 확인 방법을 불러오는 중입니다...</p>
      </div>
    `;

    anchorCard.insertAdjacentElement('afterend', wrapper);
    return wrapper.querySelector('#detail-trust-details');
  }

  function buildFallbackHospitalProfile(hospital) {
    const services = [];
    if (hospital.department) services.push(`${hospital.department} 외래`);
    if (hospital.type) services.push(`${hospital.type} 진료`);
    if (hospital.equipment) services.push(String(hospital.equipment).split(',')[0].trim());

    const documents = ['신분증'];
    if (hospital.reviewCount) documents.push('기존 검사 결과 또는 복용약 목록');

    const checklist = ['증상 시작 시점과 현재 불편을 메모해 가세요.'];
    if (hospital.phone) checklist.push('방문 전 접수 가능 시간과 휴진 여부를 전화로 확인하세요.');

    return {
      primaryServices: services,
      visitTargets: ['초진 진료 전 기본 정보를 미리 확인하려는 경우'],
      documents,
      reservation: '초진 접수 가능 시간과 점심시간을 먼저 확인하는 편이 좋습니다.',
      transport: hospital.address || '방문 전 이동 동선을 확인하세요.',
      accessibility: '주차와 병원 건물 편의 시설은 방문 전에 병원에 직접 확인하세요.',
      checklist,
    };
  }

  function formatDetailList(items, emptyMessage) {
    const values = Array.from(new Set((items || []).filter(Boolean)));
    return values.length > 0 ? values.join(' / ') : emptyMessage;
  }

  function renderComparePoints(hospital) {
    const target = document.getElementById('detail-compare-points');
    if (!target) {
      return;
    }

    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital) || buildFallbackHospitalProfile(hospital);
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
    if (hospital.subway) items.push(hospital.subway);
    if (hospital.parkingCapacity) items.push(`주차 ${hospital.parkingCapacity}대`);
    if (hospital.parkingFee && !hospital.parkingCapacity) items.push(`주차 ${hospital.parkingFee}`);
    if (hospital.roomCount) items.push(`진료실 ${hospital.roomCount}개`);
    if (hospital.bedCount) items.push(`병상 ${hospital.bedCount}개`);
    if (Array.isArray(profile.highlightPoints)) items.push(...profile.highlightPoints);

    const uniqueItems = Array.from(new Set(items.filter(Boolean)));
    if (uniqueItems.length === 0) {
      target.innerHTML = '<span style="color:var(--text-muted);">비교 포인트를 준비 중입니다...</span>';
      return;
    }

    target.innerHTML = uniqueItems.map((item) => `
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

    const dynamicSummaries = buildFallbackReviewSummaries(hospital);
    reviewList.innerHTML = dynamicSummaries.map((item, index) => `
      <article class="detail-review-item fade-up" style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; gap:12px; color:var(--text-muted); font-size:0.85rem;">
          <span>병원찾기 note ${index + 1}</span>
          <span>${escapeHtml(item.meta)}</span>
        </div>
        <h4 style="font-size:1.05rem; color:var(--text-heading); font-weight:600;">${escapeHtml(item.title)}</h4>
        <p style="color:var(--text-body); font-size:0.95rem; line-height:1.6;">${escapeHtml(item.body)}</p>
        <div><span class="review-badge" style="background:#64748b; color:#fff;">${escapeHtml(item.badge)}</span></div>
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
    const mapImage = hospital.mapImage
      ? `
        <div style="width:100%; max-width:640px; margin:0 auto 14px; border-radius:10px; overflow:hidden; border:1px solid var(--border-default); background:var(--bg-body);">
          <img src="${escapeHtml(hospital.mapImage)}" alt="${escapeHtml(hospital.name || '병원')} 위치 미리보기" style="display:block; width:100%; height:auto;">
        </div>
      `
      : '';

    container.innerHTML = `
      <div class="map-setup-box" style="padding:20px; text-align:center; border:1px solid var(--border-default); border-radius:8px; background:var(--bg-card); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; height:100%;">
        <span style="font-size:2rem;">📍</span>
        <h3 style="margin:0; color:var(--text-heading);">${escapeHtml(hospital.name || '병원 위치')}</h3>
        <p style="margin:0; color:var(--text-body); line-height:1.6;">${escapeHtml(hospital.address || '주소 정보 없음')}</p>
        ${note}
        ${mapImage}
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

    container.innerHTML = items.map((item) => {
      const contentApi = getHospitalContent();
      const profile = contentApi?.buildHospitalProfile?.(item);
      const serviceText = Array.isArray(profile?.primaryServices) && profile.primaryServices.length
        ? profile.primaryServices.slice(0, 2).join(', ')
        : '';

      return `
      <a href="detail.html?id=${encodeURIComponent(item.id)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(item.name)}</strong>
        <span style="font-size:0.9rem; color:var(--primary); font-weight:600;">${escapeHtml(item.type || hospital.type || '병원')}</span>
        <span style="font-size:0.92rem; color:var(--text-body); line-height:1.5;">${escapeHtml(item.address || '주소 정보 확인 필요')}</span>
        ${serviceText ? `<span style="font-size:0.88rem; color:var(--text-body); line-height:1.5;">주요 진료: ${escapeHtml(serviceText)}</span>` : ''}
        <span style="font-size:0.82rem; color:var(--text-muted);">전문의 ${escapeHtml(String(item.specialistCount || 0))}명 / 리뷰 ${escapeHtml(String(item.reviewCount || 0))}개${buildDistanceLabel(hospital, item)}</span>
      </a>
    `;
    }).join('');
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

  function renderFaqSchema(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    let schemaElement = document.getElementById('schema-hospital-faq');
    if (!schemaElement) {
      schemaElement = document.createElement('script');
      schemaElement.type = 'application/ld+json';
      schemaElement.id = 'schema-hospital-faq';
      document.head.appendChild(schemaElement);
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
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

  function buildSourceStateLabelSafe(label, dataSource) {
    if (dataSource === 'stale-cache') {
      return `${label} (캐시 보강)`;
    }
    return `${label} (실시간)`;
  }

  function buildPublicCodeSummarySafe(detailData, hoursData) {
    const codes = [];
    if (detailData?.ykiho) {
      codes.push(`HIRA ${detailData.ykiho}`);
    }
    if (hoursData?.hpid) {
      codes.push(`NEMC ${hoursData.hpid}`);
    }
    return codes.length > 0 ? `기준 코드 ${codes.join(' / ')}` : '';
  }

  function buildOperationSummarySafe(hospital, detailData) {
    const parts = [];

    if (hospital.saturdayOpen) parts.push('토요일 진료');
    if (hospital.sundayOpen) parts.push('일요일 진료');
    if (hospital.nightOpen) parts.push('야간 진료');
    if (hospital.hasEmergency) parts.push('응급 진료 가능');

    if (Array.isArray(detailData?.receptionSummary) && detailData.receptionSummary.length > 0) {
      parts.push(...detailData.receptionSummary.slice(0, 3));
    } else {
      if (detailData?.rcvWeek) parts.push(`평일 접수 ${detailData.rcvWeek}`);
      if (detailData?.rcvSat) parts.push(`토요일 접수 ${detailData.rcvSat}`);
      if (detailData?.lunchWeek) parts.push(`점심시간 ${detailData.lunchWeek}`);
    }

    if (Array.isArray(detailData?.parkingSummary) && detailData.parkingSummary.length > 0) {
      parts.push(detailData.parkingSummary[0]);
    }

    return parts.length > 0 ? parts.join(' / ') : '운영 요약 정보 확인 필요';
  }

  function buildLocationSummarySafe(hospital, hoursData) {
    const parts = [];
    const regionText = buildRegionText(hospital);
    const coordinateText = buildCoordinateLabel(hospital.lat, hospital.lng);

    if (regionText && !regionText.includes('확인')) {
      parts.push(regionText);
    }
    if (hospital.subway) {
      parts.push(hospital.subway);
    }
    if (hoursData?.matchedSummary) {
      parts.push(hoursData.matchedSummary);
    }
    if (coordinateText) {
      parts.push(coordinateText);
    }
    if (hoursData?.dutyMapimg || hospital.mapImage) {
      parts.push('지도 기준 정보 연동');
    }

    return parts.length > 0 ? parts.join(' / ') : (hospital.address || '위치 기준 정보 확인 필요');
  }

  function buildEquipmentSummarySafe(hospital, equipData) {
    const parts = [];
    const facility = equipData?.facility || {};
    const equipmentItems = Array.isArray(equipData?.topEquipment) && equipData.topEquipment.length > 0
      ? equipData.topEquipment.slice(0, 4).map((item) => `${item.name} ${item.count}대`)
      : Array.isArray(equipData?.equipDetails) && equipData.equipDetails.length > 0
        ? equipData.equipDetails.slice(0, 4).map((item) => `${item.name} ${item.count}대`)
        : Array.isArray(equipData?.equips) && equipData.equips.length > 0
          ? equipData.equips.slice(0, 4)
          : [];

    if (equipmentItems.length > 0) {
      parts.push(equipmentItems.join(', '));
    } else if (hospital.equipment) {
      parts.push(hospital.equipment);
    }

    const roomBedParts = [];
    if (toPositiveNumber(facility.stdSickbdCnt) > 0) roomBedParts.push(`일반 병상 ${facility.stdSickbdCnt}`);
    if (toPositiveNumber(facility.permSbdCnt) > 0) roomBedParts.push(`특수 병상 ${facility.permSbdCnt}`);
    if (roomBedParts.length === 0) {
      if (toPositiveNumber(hospital.roomCount) > 0) roomBedParts.push(`입원실 ${hospital.roomCount}`);
      if (toPositiveNumber(hospital.bedCount) > 0) roomBedParts.push(`병상 ${hospital.bedCount}`);
    }
    if (roomBedParts.length > 0) {
      parts.push(roomBedParts.join(' / '));
    }

    if (facility.totArea) {
      parts.push(`면적 ${facility.totArea}`);
    } else if (hospital.area) {
      parts.push(hospital.area);
    }

    return parts.length > 0 ? parts.join(' / ') : '장비와 시설 정보 확인 필요';
  }

  function renderPublicDigest(hospital) {
    const matchSummary = detailRuntime.matchMeta?.summary
      || '공공 병원 데이터 매칭 정보를 정리 중입니다.';
    const operationSummary = buildOperationSummarySafe(hospital, detailRuntime.detailData);
    const locationSummary = buildLocationSummarySafe(hospital, detailRuntime.hoursData);
    const equipmentSummary = buildEquipmentSummarySafe(hospital, detailRuntime.equipData);

    setText('detail-match-summary', matchSummary);
    setText('detail-operation-summary', operationSummary);
    setText('detail-location-summary', locationSummary);
    setText('detail-equipment-summary', equipmentSummary);
  }

  async function findPublicHospitalMatch(hospital, api) {
    try {
      const response = await api.fetchHospitals({ name: hospital.name, region: hospital.region, limit: 15 });
      if (response?.fromMock) {
        return null;
      }
      const hospitals = Array.isArray(response?.hospitals) ? response.hospitals : [];
      if (hospitals.length === 0) {
        return null;
      }

      const targetName = normalizeCompareText(hospital.name);
      const targetLooseName = normalizeNameText(hospital.name);
      const targetNameTokens = extractTextTokens(hospital.name);
      const targetAddressTokens = extractAddressTokens(hospital.address);

      const scored = hospitals.map((item) => {
        let score = 0;
        const reasons = [];
        const itemName = normalizeCompareText(item.name);
        const itemLooseName = normalizeNameText(item.name);
        const itemNameTokens = extractTextTokens(item.name);
        const itemAddressTokens = extractAddressTokens(item.address);
        const nameOverlap = countTokenOverlap(targetNameTokens, itemNameTokens);
        const addressOverlap = countTokenOverlap(targetAddressTokens, itemAddressTokens);

        if (itemName === targetName) {
          score += 140;
          reasons.push('이름 정확히 일치');
        } else if (itemLooseName === targetLooseName) {
          score += 120;
          reasons.push('이름 정규화 일치');
        } else if ((targetLooseName && itemLooseName.includes(targetLooseName)) || (itemLooseName && targetLooseName.includes(itemLooseName))) {
          score += 80;
          reasons.push('이름 부분 일치');
        } else if (nameOverlap >= 2) {
          score += 55;
          reasons.push(`이름 핵심어 ${nameOverlap}개 일치`);
        }

        if (addressOverlap > 0) {
          score += Math.min(addressOverlap * 12, 36);
          reasons.push(`주소 핵심어 ${addressOverlap}개 일치`);
        }
        if (hospital.region && item.region === hospital.region) {
          score += 20;
          reasons.push('지역 일치');
        }
        if (hospital.district && item.district === hospital.district) {
          score += 18;
          reasons.push('세부 지역 일치');
        }
        if (hospital.type && item.type === hospital.type) {
          score += 10;
          reasons.push('병원 유형 일치');
        }
        if (hospital.departmentId && item.departmentId === hospital.departmentId) {
          score += 8;
          reasons.push('진료 분류 일치');
        }

        return {
          item,
          score,
          reasons,
          addressOverlap,
          exactName: itemName === targetName || itemLooseName === targetLooseName,
        };
      }).sort((left, right) => right.score - left.score);

      const top = scored[0];
      if (!top) {
        return null;
      }

      const confidentMatch =
        (top.exactName && top.score >= 120) ||
        (top.score >= 118 && top.addressOverlap >= 1) ||
        top.score >= 145;

      if (!confidentMatch) {
        return null;
      }

      return {
        hospital: top.item,
        meta: {
          status: 'matched',
          summary: `공공 병원 데이터 매칭 완료 · ${top.reasons.slice(0, 3).join(' / ')}`,
        },
      };
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

  function getOperationalReasonLabel(flag) {
    switch (flag) {
      case 'saturdayOpen':
        return '토요 진료';
      case 'sundayOpen':
        return '일요 진료';
      case 'nightOpen':
        return '야간 진료';
      case 'hasEmergency':
        return '응급 대응';
      default:
        return '운영 조건';
    }
  }

  function uniqueStrings(items) {
    return Array.from(new Set((Array.isArray(items) ? items : []).filter(Boolean)));
  }

  function createEmptyDetailRuntime() {
    return {
      matchMeta: null,
      sourceStates: [],
      detailData: null,
      equipData: null,
      hoursData: null,
    };
  }

  function resetDetailRuntime() {
    Object.assign(detailRuntime, createEmptyDetailRuntime());
  }

  function buildSourceStateLabel(label, dataSource) {
    if (dataSource === 'stale-cache') {
      return `${label} (캐시 보강)`;
    }
    return `${label} (실시간)`;
  }

  function buildOperationSummary(hospital, detailData) {
    const parts = [];

    if (hospital.saturdayOpen) parts.push('토요일 진료');
    if (hospital.sundayOpen) parts.push('일요일 진료');
    if (hospital.nightOpen) parts.push('야간 진료');
    if (hospital.hasEmergency) parts.push('응급 진료 가능');
    if (detailData?.rcvWeek) parts.push(`평일 접수 ${detailData.rcvWeek}`);
    if (detailData?.rcvSat) parts.push(`토요일 접수 ${detailData.rcvSat}`);
    if (detailData?.lunchWeek) parts.push(`점심시간 ${detailData.lunchWeek}`);

    return parts.length > 0 ? parts.join(' / ') : '운영 요약 정보 확인 필요';
  }

  function buildLocationSummary(hospital, hoursData) {
    const parts = [];
    const regionText = buildRegionText(hospital);
    const coordinateText = buildCoordinateLabel(hospital.lat, hospital.lng);

    if (regionText && regionText !== '지역 정보 확인 중') {
      parts.push(regionText);
    }
    if (hospital.subway) {
      parts.push(hospital.subway);
    }
    if (coordinateText) {
      parts.push(coordinateText);
    }
    if (hoursData?.dutyMapimg || hospital.mapImage) {
      parts.push('지도 이미지 연동');
    }

    return parts.length > 0 ? parts.join(' / ') : (hospital.address || '위치 기준 정보 확인 필요');
  }

  function buildEquipmentSummary(hospital, equipData) {
    const parts = [];
    const facility = equipData?.facility || {};
    const equipmentItems = Array.isArray(equipData?.equipDetails) && equipData.equipDetails.length > 0
      ? equipData.equipDetails.slice(0, 4).map((item) => `${item.name} ${item.count}대`)
      : Array.isArray(equipData?.equips) && equipData.equips.length > 0
        ? equipData.equips.slice(0, 4)
        : [];

    if (equipmentItems.length > 0) {
      parts.push(equipmentItems.join(', '));
    } else if (hospital.equipment) {
      parts.push(hospital.equipment);
    }

    const roomBedParts = [];
    if (toPositiveNumber(facility.stdSickbdCnt) > 0) roomBedParts.push(`일반 병상 ${facility.stdSickbdCnt}`);
    if (toPositiveNumber(facility.permSbdCnt) > 0) roomBedParts.push(`특수 병상 ${facility.permSbdCnt}`);
    if (roomBedParts.length === 0) {
      if (toPositiveNumber(hospital.roomCount) > 0) roomBedParts.push(`입원실 ${hospital.roomCount}`);
      if (toPositiveNumber(hospital.bedCount) > 0) roomBedParts.push(`병상 ${hospital.bedCount}`);
    }
    if (roomBedParts.length > 0) {
      parts.push(roomBedParts.join(' / '));
    }

    if (facility.totArea) {
      parts.push(`면적 ${facility.totArea}`);
    } else if (hospital.area) {
      parts.push(hospital.area);
    }

    return parts.length > 0 ? parts.join(' / ') : '장비와 시설 정보 확인 필요';
  }

  function buildFallbackReviewSummaries(hospital) {
    const doctorText = buildDoctorText(hospital);
    const operationSummary = buildOperationSummarySafe(hospital, detailRuntime.detailData);
    const locationSummary = buildLocationSummarySafe(hospital, detailRuntime.hoursData);
    const equipmentSummary = buildEquipmentSummarySafe(hospital, detailRuntime.equipData);

    return [
      {
        title: `${hospital.name} 운영 포인트`,
        body: truncateText(
          operationSummary !== '운영 요약 정보 확인 필요' ? operationSummary : FALLBACK_REVIEW_TEXTS[0],
          120
        ),
        meta: '운영 요약',
        badge: '운영 체크',
      },
      {
        title: `${hospital.name} 방문 동선`,
        body: truncateText(
          locationSummary !== '위치 기준 정보 확인 필요'
            ? `${hospital.address || ''} / ${locationSummary}`
            : FALLBACK_REVIEW_TEXTS[2],
          140
        ),
        meta: '위치 기준',
        badge: '방문 체크',
      },
      {
        title: `${hospital.name} 규모와 장비`,
        body: truncateText(
          `${doctorText} / ${equipmentSummary !== '장비와 시설 정보 확인 필요' ? equipmentSummary : FALLBACK_REVIEW_TEXTS[1]}`,
          140
        ),
        meta: '시설 요약',
        badge: '시설 체크',
      },
    ];
  }

  function buildCoordinateLabel(lat, lng) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng) || parsedLat <= 0 || parsedLng <= 0) {
      return '';
    }
    return `좌표 ${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}`;
  }

  function normalizeCompareText(value) {
    return String(value || '').replace(/\s+/g, '').toLowerCase();
  }

  function normalizeNameText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[^0-9a-zA-Z가-힣]/g, '');
  }

  function extractTextTokens(value) {
    return Array.from(new Set(
      String(value || '')
        .toLowerCase()
        .replace(/[()]/g, ' ')
        .split(/[\s,./-]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
    ));
  }

  function extractAddressTokens(value) {
    return extractTextTokens(
      String(value || '')
        .replace(/\d+층/g, ' ')
        .replace(/\d+호/g, ' ')
        .replace(/[()]/g, ' ')
    ).slice(0, 10);
  }

  function countTokenOverlap(leftTokens, rightTokens) {
    if (!Array.isArray(leftTokens) || !Array.isArray(rightTokens)) {
      return 0;
    }

    const rightSet = new Set(rightTokens);
    return leftTokens.filter((token) => rightSet.has(token)).length;
  }

  function truncateText(value, maxLength) {
    const text = String(value || '').trim();
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 1).trim()}…`;
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

  function getHospitalContent() {
    if (typeof HospitalContent !== 'undefined') {
      return HospitalContent;
    }
    return window.HospitalContent;
  }

  function toPositiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  async function fetchJsonWithMeta(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`);
    }

    return {
      data: await response.json(),
      dataSource: response.headers.get('X-Data-Source') || 'live',
    };
  }

  function getStoredMapKey() {
    try {
      return localStorage.getItem(NAVER_MAP_STORAGE_KEY) || '';
    } catch (error) {
      console.warn('[detail] localStorage unavailable:', error);
      return '';
    }
  }

  function getMapKeyCandidates() {
    const storedKey = getStoredMapKey();
    return Array.from(new Set([storedKey, ...NAVER_MAP_DEFAULT_KEYS].filter(Boolean)));
  }

  function loadNaverMapScript(clientId) {
    return new Promise((resolve, reject) => {
      if (window.naver?.maps) {
        resolve();
        return;
      }

      document
        .querySelectorAll('script[src*="openapi.map.naver.com"], script[src*="oapi.map.naver.com"]')
        .forEach((script) => script.remove());

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
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=geocoder&callback=${callbackName}`;
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeoutId);
        delete window[callbackName];
        reject(new Error('AUTH_FAIL'));
      };

      document.head.appendChild(script);
    });
  }

  function resetNaverMapRuntime() {
    document
      .querySelectorAll('script[src*="openapi.map.naver.com"], script[src*="oapi.map.naver.com"]')
      .forEach((script) => script.remove());
    try {
      delete window.naver;
    } catch (error) {
      window.naver = undefined;
    }
  }

  function verifyRenderedMap() {
    const container = document.getElementById('map-container');
    if (!container) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        const backgroundImage = window.getComputedStyle(container).backgroundImage || '';
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

  function buildDetailMapAuthMessage(candidateKeys) {
    const keyLabel = Array.from(new Set(candidateKeys.filter(Boolean))).join(', ');
    return `네이버 지도 인증이 실패했습니다. Naver Cloud Maps에서 사용 중인 Key ID(${keyLabel})에 https://hospital-ranking.kr 와 https://www.hospital-ranking.kr 를 등록했는지 확인해 주세요.`;
  }
})();

