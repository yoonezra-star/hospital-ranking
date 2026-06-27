(() => {
  const NAVER_MAP_DEFAULT_KEYS = ['390058kho4', 'rgd9ajy97r'];
  const NAVER_MAP_STORAGE_KEY = 'NAVER_MAP_KEY';
  const FALLBACK_REVIEW_TEXTS = [
    '?묒닔 ?湲??숈꽑??鍮꾧탳???덉젙?곸씠怨?吏꾨즺 ?덈궡媛 紐낇솗???몄엯?덈떎.',
    '?섎즺吏??ㅻ챸??李⑤텇?섍퀬 ?꾩슂??寃?ъ? ?ㅼ쓬 ?④퀎 ?덈궡媛 鍮꾧탳??遺꾨챸?⑸땲??',
    '?꾩튂? ?묎렐?깆씠 醫뗭븘 ?щ갑臾??꾧린?먯꽌 ?먯＜ ?멸툒?섎뒗 蹂묒썝?낅땲??',
    '?쇨컙 ?먮뒗 ?좎슂??吏꾨즺 ?щ???諛⑸Ц ???ㅼ떆 ?뺤씤?섎뒗 ?몄씠 ?덉쟾?⑸땲??',
  ];
  const detailRuntime = createEmptyDetailRuntime();

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const hospitalId = params.get('postid') || params.get('id');
    if (!hospitalId) {
      setText('detail-name', '蹂묒썝 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.');
      return;
    }

    normalizeDetailUrl(hospitalId);

    void loadHospitalDetail(hospitalId);
  });

  function normalizeDetailUrl(hospitalId) {
    const expected = `detail.html?postid=${encodeURIComponent(hospitalId)}`;
    const current = `${window.location.pathname.split('/').pop() || 'detail.html'}${window.location.search || ''}`;
    if (current !== expected) {
      window.history.replaceState({}, '', expected);
    }
  }

  async function loadHospitalDetail(id) {
    try {
      const hospital = await resolveHospital(id);
      if (!hospital) {
        setText('detail-name', '蹂묒썝 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.');
        return;
      }

      renderDetail(hospital);
      await hydrateDetail(hospital);
    } catch (error) {
      console.error('[detail] failed to load detail page:', error);
      setText('detail-name', '蹂묒썝 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??');
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
    document.title = `${hospital.name} ?꾧린, ?됱젏 諛?吏꾨즺 ?뺣낫 - 蹂묒썝李얘린`;
    updateMetaDescription(
      `${hospital.name}???꾩튂, ?곕씫泥? 吏꾨즺 ?뺣낫, ?꾧린 ?붿빟??蹂묒썝李얘린?먯꽌 ?뺤씤?섏꽭??`
    );

    refreshHospitalOverview(hospital);
    setText('detail-emergency', '?묎툒 吏꾨즺 ?뺣낫 ?뺤씤 ?꾩슂');
    setText('detail-hours-note', '?먯떖?쒓컙 諛??묒닔 ?덈궡 ?뺤씤 以?..');
    setText('detail-duty-note', '怨듦컻 ?곗씠??湲곕컲 吏꾨즺 ?덈궡 ?뺣낫瑜??뺣━ 以묒엯?덈떎.');
    setText('detail-match-summary', '怨듦났 蹂묒썝 ?곗씠??留ㅼ묶 ?뺤씤 以?..');
    setText('detail-operation-summary', '?댁쁺 ?뺣낫瑜??뺣━ 以묒엯?덈떎.');
    setText('detail-location-summary', '?꾩튂 湲곗? ?뺣낫瑜??뺣━ 以묒엯?덈떎.');
    setText('detail-equipment-summary', '?λ퉬? ?쒖꽕 ?뺣낫瑜??뺣━ 以묒엯?덈떎.');
    updateSourceSummary(['湲곕낯 蹂묒썝 ?뺣낫']);

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
          sourceStates.push('湲곕낯 蹂묒썝 API ?곕룞');
          refreshHospitalOverview(hospital);
        } else {
          matchMeta = {
            status: 'fallback',
            summary: '怨듦났 蹂묒썝 ?곗씠??留ㅼ묶???놁뼱 ?꾩옱 蹂댁쑀 ?뺣낫 湲곗??쇰줈 ?몄텧?⑸땲??',
          };
          sourceStates.push('湲곕낯 ?뺣낫??蹂댁쑀 ?곗씠???ъ슜');
        }
      } else if (publicYkiho) {
        matchMeta = {
          status: 'direct',
          summary: `怨듦났 蹂묒썝 怨좎쑀肄붾뱶(${publicYkiho})濡?吏곸젒 議고쉶?덉뒿?덈떎.`,
        };
        sourceStates.push('湲곕낯 蹂묒썝 API ?곕룞');
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
            sourceStates.push(buildSourceStateLabelSafe('?곸꽭 ?뺣낫 API', detailResult.value.dataSource));
          }
        }

        if (equipResult.status === 'fulfilled') {
          detailRuntime.equipData = equipResult.value.data;
          applyEquipData(equipResult.value.data);
          if (equipResult.value.data?.found === true) {
            sourceStates.push(buildSourceStateLabelSafe('?λ퉬 ?뺣낫 API', equipResult.value.dataSource));
          }
        }

        if (hoursResult.status === 'fulfilled') {
          detailRuntime.hoursData = hoursResult.value.data;
          applyHoursData(hoursResult.value.data, hospital);
          if (hoursResult.value.data?.found === true) {
            sourceStates.push(buildSourceStateLabelSafe('吏꾨즺?쒓컙 API', hoursResult.value.dataSource));
          }
        }
      } else {
        const hoursData = await fetchJsonWithMeta(buildHospitalHoursUrl(hospital));
        detailRuntime.hoursData = hoursData.data;
        applyHoursData(hoursData.data, hospital);
        if (hoursData.data?.found === true) {
          sourceStates.push(buildSourceStateLabelSafe('吏꾨즺?쒓컙 API', hoursData.dataSource));
        }
      }
    } catch (error) {
      console.warn('[detail] public detail enrichment skipped:', error);
      if (!matchMeta) {
        matchMeta = {
          status: 'error',
          summary: '怨듦났?곗씠???곸꽭 ?곕룞 以??ㅻ쪟媛 諛쒖깮??湲곕낯 ?뺣낫瑜??곗꽑 ?쒖떆?⑸땲??',
        };
      }
      sourceStates.push('怨듦났?곗씠???곸꽭 ?곕룞 ?ㅽ뙣');
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
        : '?ㅼ떆媛?吏?꾨? 遺덈윭?ㅼ? 紐삵빐 ?ㅼ씠踰?吏??諛붾줈媛湲곕줈 ?泥댄뻽?듬땲??';
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
        parkingItems.push(detailData.parkXpnsYn === 'Y' ? '?좊즺 二쇱감' : '臾대즺 二쇱감');
      }
      if (detailData.parkQty) {
        parkingItems.push(`二쇱감 媛?????${detailData.parkQty}`);
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
      if (detailData.emyDayYn === 'Y') emergencyItems.push('二쇨컙 ?묎툒 吏꾨즺 媛??);
      if (detailData.emyNgtYn === 'Y') emergencyItems.push('?쇨컙 ?묎툒 吏꾨즺 媛??);
      if (detailData.emyDayTelNo1) emergencyItems.push(`?묎툒 臾몄쓽 ${detailData.emyDayTelNo1}`);
    }
    if (emergencyItems.length > 0) {
      setText('detail-emergency', emergencyItems.join(' / '));
      hospital.hasEmergency = true;
    }

    const noteItems = Array.isArray(detailData.receptionSummary)
      ? detailData.receptionSummary.filter(Boolean)
      : [];
    if (noteItems.length === 0) {
      if (detailData.rcvWeek) noteItems.push(`?됱씪 ?묒닔 ${detailData.rcvWeek}`);
      if (detailData.rcvSat) noteItems.push(`?좎슂???묒닔 ${detailData.rcvSat}`);
      if (detailData.lunchWeek) noteItems.push(`?먯떖?쒓컙 ${detailData.lunchWeek}`);
    }
    if (noteItems.length > 0) {
      setText('detail-hours-note', noteItems.join(' / '));
    }

    const detailNotes = [];
    if (detailData.ykiho) detailNotes.push(`HIRA 肄붾뱶 ${detailData.ykiho}`);
    if (detailData.hospUrl || hospital.url) detailNotes.push('怨듭떇 ?덊럹?댁? ?뺣낫 ?뺤씤');
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
    if (toPositiveNumber(facility.stdSickbdCnt) > 0) roomParts.push(`?쇰컲 蹂묒긽 ${facility.stdSickbdCnt}`);
    if (toPositiveNumber(facility.permSbdCnt) > 0) roomParts.push(`?뱀닔 蹂묒긽 ${facility.permSbdCnt}`);
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
          .map((item) => `${item.name} ${item.count}?`)
          .join(', ')
      );
    } else if (Array.isArray(equipData.equips) && equipData.equips.length > 0) {
      setText('detail-equipment', equipData.equips.slice(0, 10).join(', '));
    }

    if (Array.isArray(equipData.topEquipment) && equipData.topEquipment.length > 0) {
      const topSummary = equipData.topEquipment
        .slice(0, 4)
        .map((item) => `${item.name} ${item.count}?`)
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

    setText('detail-name', hospital.name || '蹂묒썝紐??뺤씤 ?꾩슂');
    setText('detail-type', hospital.type || '蹂묒썝');
    setText('detail-address', hospital.address || '二쇱냼 ?뺣낫 ?놁쓬');
    setText('detail-department', hospital.department || '吏꾨즺怨??뺤씤 ?꾩슂');
    setText('detail-score', `?됱젏 ${score.toFixed(1)}`);
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
      badges.push({ label: '?꾨Ц???댁쁺', background: '#e0f2fe', color: '#0369a1' });
    }
    if (hospital.saturdayOpen) {
      badges.push({ label: '?좎슂??吏꾨즺', background: '#dcfce7', color: '#166534' });
    }
    if (hospital.nightOpen) {
      badges.push({ label: '?쇨컙 吏꾨즺', background: '#fef3c7', color: '#92400e' });
    }
    if (hospital.hasEmergency) {
      badges.push({ label: '?묎툒 吏꾨즺', background: '#fee2e2', color: '#b91c1c' });
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
      ['?붿슂??, hours?.mon || '-'],
      ['?붿슂??, hours?.tue || '-'],
      ['?섏슂??, hours?.wed || '-'],
      ['紐⑹슂??, hours?.thu || '-'],
      ['湲덉슂??, hours?.fri || '-'],
      ['?좎슂??, hours?.sat || '-'],
      ['?쇱슂??, hours?.sun || '誘몄쭊猷?],
      ['怨듯쑕??, hours?.holiday || '誘몄쭊猷?],
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
      if (roomCount > 0) parts.push(`?낆썝??${roomCount}`);
      if (bedCount > 0) parts.push(`蹂묒긽 ${bedCount}`);
      setText('detail-room-bed', parts.join(' / '));
    } else {
      setText('detail-room-bed', '蹂묒긽 ?뺣낫 ?뺤씤 ?꾩슂');
    }

    setText('detail-area', hospital.area || '硫댁쟻 ?뺣낫 ?뺤씤 ?꾩슂');
    setText('detail-equipment', hospital.equipment || '?λ퉬 ?뺣낫 ?뺤씤 ?꾩슂');

    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      parkingParts.push(`二쇱감 媛??${hospital.parkingCapacity}?`);
    }
    if (hospital.parkingFee) {
      parkingParts.push(hospital.parkingFee);
    }
    setText('detail-parking', parkingParts.join(' / ') || '二쇱감 ?뺣낫 ?뺤씤 ?꾩슂');
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
      summaryParts.push(`二쇱슂 吏꾨즺??${profile.primaryServices.slice(0, 2).join(', ')} 以묒떖?쇰줈 癒쇱? 蹂대㈃ 醫뗭뒿?덈떎.`);
    }
    if (Number(hospital.specialistCount || 0) > 0) {
      summaryParts.push(`?꾨Ц??${hospital.specialistCount}紐?湲곗??쇰줈 鍮꾧탳?????덉뒿?덈떎.`);
    }

    if (Number(hospital.score || 0) > 0) compareParts.push(`?됱젏 ${Number(hospital.score).toFixed(1)}`);
    if (Number(hospital.reviewCount || 0) > 0) compareParts.push(`?꾧린 ${Number(hospital.reviewCount).toLocaleString()}媛?);
    if (hospital.saturdayOpen) compareParts.push('?좎슂??吏꾨즺');
    if (hospital.sundayOpen) compareParts.push('?쇱슂??吏꾨즺');
    if (hospital.nightOpen) compareParts.push('?쇨컙 吏꾨즺');
    if (hospital.equipment) compareParts.push(`?λ퉬 ${String(hospital.equipment).split(',')[0].trim()}`);
    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      compareParts.push(`二쇱감 ${hospital.parkingCapacity}?`);
    } else if (hospital.parkingFee) {
      compareParts.push(`二쇱감 ${hospital.parkingFee}`);
    }

    if (Array.isArray(detailData.receptionSummary) && detailData.receptionSummary.length > 0) {
      flowParts.push(detailData.receptionSummary[0]);
    } else if (profile.reservation) {
      flowParts.push(profile.reservation);
    }
    if (Array.isArray(profile.documents) && profile.documents.length > 0) {
      flowParts.push(`以鍮꾩꽌瑜섎뒗 ${profile.documents.slice(0, 2).join(', ')} ?쒖쑝濡?癒쇱? 梨숆린硫??⑸땲??`);
    }
    if (profile.transport) {
      flowParts.push(profile.transport);
    } else if (hospital.subway) {
      flowParts.push(hospital.subway);
    }

    if (detailData.lunchWeek) {
      cautionParts.push(`?먯떖?쒓컙? ${detailData.lunchWeek} 湲곗??쇰줈 ??踰????뺤씤?섏꽭??`);
    }
    if (Array.isArray(detailData.parkingSummary) && detailData.parkingSummary.length > 0) {
      cautionParts.push(detailData.parkingSummary[0]);
    } else if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      cautionParts.push(`二쇱감 媛????섎뒗 ??${hospital.parkingCapacity}? 湲곗??낅땲??`);
    } else if (hospital.parkingFee) {
      cautionParts.push(`二쇱감 ?뺣낫??${hospital.parkingFee} 湲곗??쇰줈 ?뺤씤?⑸땲??`);
    }
    if (Array.isArray(profile.checklist) && profile.checklist.length > 0) {
      cautionParts.push(profile.checklist[0]);
    }
    if (detailRuntime.matchMeta?.summary) {
      cautionParts.push(detailRuntime.matchMeta.summary);
    }

    setText('detail-choice-summary', uniqueStrings(summaryParts).slice(0, 3).join(' / ') || '??蹂묒썝???대뼡 ?곹솴????留욌뒗吏 ?뺣━ 以묒엯?덈떎.');
    setText('detail-choice-compare', uniqueStrings(compareParts).slice(0, 4).join(' / ') || '?됱젏, ?꾧린, ?댁쁺?쒓컙, ?λ퉬 ?뺣낫瑜?鍮꾧탳 ?ъ씤?몃줈 ?뺣━ 以묒엯?덈떎.');
    setText('detail-choice-flow', uniqueStrings(flowParts).slice(0, 3).join(' / ') || '?묒닔, 以鍮꾩꽌瑜? ?대룞 ?숈꽑??湲곗??쇰줈 ?댁썝 ?먮쫫???뺣━ 以묒엯?덈떎.');
    setText('detail-choice-caution', uniqueStrings(cautionParts).slice(0, 3).join(' / ') || '諛⑸Ц ???묒닔 留덇컧怨??댁쁺 ?쒓컙????踰????뺤씤?섎뒗 ?몄씠 醫뗭뒿?덈떎.');
  }

  function renderSupplementaryDetails(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital) || buildFallbackHospitalProfile(hospital);

    setText('detail-primary-services', formatDetailList(profile.primaryServices, '二쇱슂 吏꾨즺 ?뺣낫瑜?以鍮?以묒엯?덈떎.'));
    setText('detail-visit-targets', formatDetailList(profile.visitTargets, '?대뼡 ?곹솴????留욌뒗吏 ?뺣━ 以묒엯?덈떎.'));
    setText('detail-documents', formatDetailList(profile.documents, '?좊텇利앷낵 湲곗〈 寃??寃곌낵瑜?癒쇱? 梨숆린???몄씠 醫뗭뒿?덈떎.'));
    setText('detail-reservation', profile.reservation || '諛⑸Ц ???묒닔 ?쒓컙怨??꾩슂???쒕쪟瑜?癒쇱? ?뺤씤?섏꽭??');
    setText('detail-transport', profile.transport || '?以묎탳?듦낵 二쇱감 ?숈꽑??諛⑸Ц ?꾩뿉 ?뺤씤?섏꽭??');
    setText('detail-accessibility', profile.accessibility || '?섎━踰좎씠?? 二쇱감, 蹂댄샇???湲?怨듦컙? 蹂묒썝??吏곸젒 ?뺤씤?섎뒗 ?몄씠 ?덉쟾?⑸땲??');
    setText('detail-checklist', formatDetailList(profile.checklist, '珥덉쭊 紐⑹쟻怨?利앹긽 ?쒖옉 ?쒖젏??硫붾え??媛硫??ㅻ챸??鍮⑤씪吏묐땲??'));
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
      symptomParts.push(`二쇱슂 吏꾨즺??${profile.primaryServices.slice(0, 2).join(', ')} 湲곗??쇰줈 癒쇱? 鍮꾧탳?섎㈃ 醫뗭뒿?덈떎.`);
    }

    if (Array.isArray(detailData.receptionSummary) && detailData.receptionSummary.length > 0) {
      intakeParts.push(...detailData.receptionSummary.slice(0, 2));
    }
    if (profile.reservation) {
      intakeParts.push(profile.reservation);
    }
    if (detailData.lunchWeek) {
      intakeParts.push(`?먯떖?쒓컙? ${detailData.lunchWeek} 湲곗??쇰줈 ??踰????뺤씤?섏꽭??`);
    }

    if (Array.isArray(detailData.parkingSummary) && detailData.parkingSummary.length > 0) {
      parkingParts.push(...detailData.parkingSummary.slice(0, 2));
    }
    if (toPositiveNumber(hospital.parkingCapacity) > 0) {
      parkingParts.push(`二쇱감 媛????섎뒗 ??${hospital.parkingCapacity}? 湲곗??낅땲??`);
    } else if (hospital.parkingFee) {
      parkingParts.push(`二쇱감 ?뺣낫??${hospital.parkingFee} 湲곗??쇰줈 ?뺤씤?⑸땲??`);
    }
    if (profile.transport) {
      parkingParts.push(profile.transport);
    }

    if (Array.isArray(profile.checklist) && profile.checklist.length > 0) {
      flowParts.push(...profile.checklist.slice(0, 2));
    }
    if (Array.isArray(profile.documents) && profile.documents.length > 0) {
      flowParts.push(`以鍮꾨Ъ? ${profile.documents.slice(0, 2).join(', ')}遺??梨숆린硫??섏썡?⑸땲??`);
    }

    setText('detail-symptom-focus', uniqueStrings(symptomParts).slice(0, 3).join(' / ') || '???利앹긽怨?吏꾨즺 紐⑹쟻 湲곗??쇰줈 癒쇱? 鍮꾧탳?섎뒗 ?몄씠 醫뗭뒿?덈떎.');
    setText('detail-intake-tip', uniqueStrings(intakeParts).slice(0, 3).join(' / ') || '珥덉쭊 ?묒닔 媛???쒓컙怨??꾩슂 ?쒕쪟瑜?諛⑸Ц ?꾩뿉 癒쇱? ?뺤씤?섏꽭??');
    setText('detail-parking-tip', uniqueStrings(parkingParts).slice(0, 3).join(' / ') || '二쇱감 媛???щ?? ?以묎탳???숈꽑? 蹂묒썝????踰????뺤씤?섎뒗 ?몄씠 ?덉쟾?⑸땲??');
    setText('detail-visit-flow', uniqueStrings(flowParts).slice(0, 3).join(' / ') || '利앹긽 硫붾え? 湲곗〈 寃??寃곌낵瑜?梨숆린怨??묒닔 留덇컧 ?쒓컙??癒쇱? ?뺤씤?섏꽭??');
  }

  function renderSnapshotCard(hospital) {
    const contentApi = getHospitalContent();
    const profile = contentApi?.buildHospitalProfile?.(hospital) || buildFallbackHospitalProfile(hospital);
    const summaryParts = [];

    if (hospital.department) summaryParts.push(hospital.department);
    if (hospital.type) summaryParts.push(hospital.type);
    if (Number(hospital.specialistCount || 0) > 0) summaryParts.push(`?꾨Ц??${hospital.specialistCount}紐?);
    if (profile.primaryServices?.length) summaryParts.push(profile.primaryServices.slice(0, 2).join(', '));

    const visitParts = [];
    if (profile.visitTargets?.length) visitParts.push(profile.visitTargets.slice(0, 2).join(' / '));
    if (profile.checklist?.length) visitParts.push(profile.checklist[0]);

    setText('detail-snapshot-summary', summaryParts.filter(Boolean).join(' / ') || '蹂묒썝 ?듭떖 鍮꾧탳 ?ъ씤?몃? ?뺣━ 以묒엯?덈떎.');
    setText('detail-snapshot-operation', buildOperationSummarySafe(hospital, detailRuntime.detailData));
    setText('detail-snapshot-facility', buildEquipmentSummarySafe(hospital, detailRuntime.equipData));
    setText('detail-snapshot-visit', visitParts.filter(Boolean).join(' / ') || '諛⑸Ц ?꾩뿉 梨숆만 ?ъ씤?몃? ?뺣━ 以묒엯?덈떎.');
  }

  function renderGuideRecommendations(hospital) {
    const container = document.getElementById('detail-guide-links');
    if (!container) {
      return;
    }

    const contentApi = getHospitalContent();
    const guides = contentApi?.buildGuideRecommendations?.(hospital) || [];
    if (!guides.length) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">愿??媛?대뱶瑜?以鍮?以묒엯?덈떎.</p>';
      return;
    }

    container.innerHTML = guides.map((guide) => `
      <a href="${escapeHtml(guide.href)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(guide.title)}</strong>
        <span style="font-size:0.93rem; color:var(--text-body); line-height:1.6;">${escapeHtml(guide.description)}</span>
        <span style="font-size:0.82rem; color:var(--primary); font-weight:600;">媛?대뱶 ?닿린</span>
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
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">愿???먯깋 留곹겕瑜?以鍮?以묒엯?덈떎.</p>';
      return;
    }

    container.innerHTML = links.map((link) => `
      <a href="${escapeHtml(link.href)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(link.title)}</strong>
        <span style="font-size:0.93rem; color:var(--text-body); line-height:1.6;">${escapeHtml(link.description)}</span>
        <span style="font-size:0.82rem; color:var(--primary); font-weight:600;">紐⑸줉?쇰줈 ?대룞</span>
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
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">吏??퀎 蹂묒썝 ?섏씠吏瑜?以鍮?以묒엯?덈떎.</p>';
      return;
    }

    container.innerHTML = links.map((link) => `
      <a href="${escapeHtml(link.href)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(link.title)}</strong>
        <span style="font-size:0.93rem; color:var(--text-body); line-height:1.6;">${escapeHtml(link.description)}</span>
        <span style="font-size:0.82rem; color:var(--primary); font-weight:600;">${escapeHtml(link.badge || '吏???섏씠吏')}</span>
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
        '媛숈? 吏꾨즺怨??먮뒗 媛숈? 吏??뿉??鍮꾧탳??蹂묒썝??以鍮?以묒엯?덈떎.'
      );
    }

    const operationalContainer = ensureOperationalRecommendationContainer();
    if (operationalContainer) {
      const items = buildOperationalPriorityHospitals(hospital);
      renderRecommendationHospitalCards(
        operationalContainer,
        items,
        hospital,
        '?좎슂, ?쇨컙, ?묎툒, 二쇱감 湲곗??쇰줈 ?ㅼ떆 鍮꾧탳??蹂묒썝??以鍮?以묒엯?덈떎.'
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
          reasons.push('媛숈? 吏꾨즺怨?);
        }
        if (item.region && item.region === hospital.region) {
          score += 20;
          reasons.push('媛숈? 吏??);
        }
        if (item.district && item.district === hospital.district) {
          score += 12;
          reasons.push('媛숈? ?앺솢沅?);
        }
        if (item.type && item.type === hospital.type) {
          score += 6;
        }
        if (hospital.saturdayOpen && item.saturdayOpen) {
          score += 8;
          reasons.push('?좎슂 吏꾨즺');
        }
        if (hospital.nightOpen && item.nightOpen) {
          score += 8;
          reasons.push('?쇨컙 吏꾨즺');
        }
        if (hospital.hasEmergency && item.hasEmergency) {
          score += 8;
          reasons.push('?묎툒 ???);
        }

        score += Math.min(Number(item.specialistCount || 0), 8);
        score += Math.min(Number(item.reviewCount || 0) / 80, 6);
        score += Number(item.score || 0);

        return {
          ...item,
          recommendationReason: uniqueStrings(reasons).slice(0, 3).join(' 쨌 ') || '媛숈? 沅뚯뿭 蹂묒썝 鍮꾧탳',
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
          reasons.push('媛숈? 吏??);
        }
        if (item.departmentId === hospital.departmentId) {
          score += 16;
          reasons.push('媛숈? 吏꾨즺怨?);
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
            reasons.push('?좎슂 吏꾨즺');
          }
          if (item.nightOpen) {
            score += 8;
            reasons.push('?쇨컙 吏꾨즺');
          }
          if (item.sundayOpen) {
            score += 8;
            reasons.push('?쇱슂 吏꾨즺');
          }
        }

        if (item.hasEmergency) {
          score += 8;
        }
        if (toPositiveNumber(item.parkingCapacity) > 0 || item.parkingFee) {
          score += 6;
          reasons.push('二쇱감 ?뺣낫');
        }

        score += Math.min(Number(item.specialistCount || 0), 6);
        score += Math.min(Number(item.reviewCount || 0) / 100, 5);
        score += Number(item.score || 0);

        return {
          ...item,
          recommendationReason: uniqueStrings(reasons).slice(0, 3).join(' 쨌 ') || '?댁쁺 議곌굔 鍮꾧탳',
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
        <a href="detail.html?postid=${encodeURIComponent(item.id)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
          <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(item.name)}</strong>
          <span style="font-size:0.84rem; color:var(--primary); font-weight:700;">${escapeHtml(item.recommendationReason || '異붿쿇 鍮꾧탳')}</span>
          <span style="font-size:0.9rem; color:var(--text-body);">${escapeHtml(item.type || hospital.type || '蹂묒썝')}</span>
          <span style="font-size:0.92rem; color:var(--text-body); line-height:1.6;">${escapeHtml(item.address || '二쇱냼 ?뺣낫 ?뺤씤 ?꾩슂')}</span>
          ${badgeItems.length > 0 ? `<div style="display:flex; flex-wrap:wrap; gap:6px;">${badgeItems.map((badge) => `<span style="display:inline-flex; align-items:center; min-height:24px; padding:3px 9px; border-radius:999px; background:${escapeHtml(badge.background)}; color:${escapeHtml(badge.color)}; font-size:0.74rem; font-weight:700;">${escapeHtml(badge.label)}</span>`).join('')}</div>` : ''}
          ${serviceText ? `<span style="font-size:0.88rem; color:var(--text-body); line-height:1.6;">?듭떖 吏꾨즺: ${escapeHtml(serviceText)}</span>` : ''}
          <span style="font-size:0.82rem; color:var(--text-muted);">?꾨Ц??${escapeHtml(String(item.specialistCount || 0))}紐?/ 由щ럭 ${escapeHtml(String(item.reviewCount || 0))}媛?{buildDistanceLabel(hospital, item)}</span>
        </a>
      `;
    }).join('');
  }

  function buildRecommendationBadgeItems(hospital) {
    const badges = [];

    if (hospital.saturdayOpen) {
      badges.push({ label: '?좎슂 吏꾨즺', background: '#edf4ee', color: '#46685b' });
    }
    if (hospital.nightOpen) {
      badges.push({ label: '?쇨컙 吏꾨즺', background: '#f0eee8', color: '#6d5d48' });
    }
    if (hospital.sundayOpen) {
      badges.push({ label: '?쇱슂 吏꾨즺', background: '#f6efe3', color: '#9a6d2f' });
    }
    if (hospital.hasEmergency) {
      badges.push({ label: '?묎툒 ???, background: '#fce9e6', color: '#a44737' });
    }
    if (toPositiveNumber(hospital.parkingCapacity) > 0 || hospital.parkingFee) {
      badges.push({ label: '二쇱감 ?뺣낫', background: '#ece9e2', color: '#564d43' });
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
      <h3>吏???쒕뵫 ?섏씠吏</h3>
      <div id="detail-landing-links" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <p style="margin:0; color:var(--text-muted);">媛숈? 吏??湲곗??쇰줈 ?뺣━???쒕뵫 ?섏씠吏瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎...</p>
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
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">諛⑸Ц ???먯＜ 臾삳뒗 吏덈Ц??以鍮?以묒엯?덈떎.</p>';
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
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">?댁쁺 議곌굔蹂?異붿쿇 ?먯깋??以鍮?以묒엯?덈떎.</p>';
      return;
    }

    container.innerHTML = links.map((link) => `
      <a href="${escapeHtml(link.href)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(link.title)}</strong>
        <span style="font-size:0.93rem; color:var(--text-body); line-height:1.6;">${escapeHtml(link.description)}</span>
        <span style="font-size:0.82rem; color:var(--primary); font-weight:600;">${escapeHtml(link.badge || '異붿쿇 ?먯깋')}</span>
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
      <h3>蹂묒썝 諛⑸Ц FAQ</h3>
      <div id="detail-faq-list" style="display:flex; flex-direction:column; gap:12px;">
        <p style="margin:0; color:var(--text-muted);">蹂묒썝 諛⑸Ц ???먯＜ 臾삳뒗 吏덈Ц??遺덈윭?ㅻ뒗 以묒엯?덈떎...</p>
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
      <h3>?댁쁺 議곌굔蹂?異붿쿇 ?먯깋</h3>
      <div id="detail-operational-links" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <p style="margin:0; color:var(--text-muted);">?좎슂??吏꾨즺, ?쇨컙 吏꾨즺, 二쇱감 ?뺣낫 湲곗???異붿쿇 寃쎈줈瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎...</p>
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
      <h3>鍮꾩듂??議곌굔 蹂묒썝</h3>
      <div id="detail-similar-hospital-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <p style="margin:0; color:var(--text-muted);">媛숈? 吏꾨즺怨쇱? 媛숈? 吏??湲곗? 異붿쿇 蹂묒썝???뺣━ 以묒엯?덈떎...</p>
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
      <h3>?댁쁺 議곌굔 鍮꾧탳 蹂묒썝</h3>
      <div id="detail-operational-hospital-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <p style="margin:0; color:var(--text-muted);">?좎슂, ?쇨컙, ?묎툒, 二쇱감 湲곗? 異붿쿇 蹂묒썝???뺣━ 以묒엯?덈떎...</p>
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

    const regionText = hospital?.region || '?대떦 吏??;
    const departmentText = hospital?.department || hospital?.type || '蹂묒썝';
    container.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <div style="padding:16px; border:1px solid var(--border-default); border-radius:12px; background:var(--bg-body);">
          <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">?곗씠??湲곗?</strong>
          <p style="margin:0; color:var(--text-body); line-height:1.7;">???섏씠吏??怨듦컻 ?곗씠?곗? 蹂묒썝 ?덈궡 湲곗??쇰줈 ${regionText} ${departmentText} ?뺣낫瑜?李멸퀬?⑹쑝濡??뺣━???붾㈃?낅땲??</p>
        </div>
        <div style="padding:16px; border:1px solid var(--border-default); border-radius:12px; background:var(--bg-body);">
          <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">?댁쁺 ?뺤씤</strong>
          <p style="margin:0; color:var(--text-body); line-height:1.7;">?묒닔 留덇컧, 寃???ы븿 ?щ?, 鍮꾩슜, 蹂댄샇???숉뻾 ?꾩슂 ?щ???諛⑸Ц ??蹂묒썝??吏곸젒 ?뺤씤?섎뒗 ?몄씠 ?덉쟾?⑸땲??</p>
        </div>
        <div style="padding:16px; border:1px solid var(--border-default); border-radius:12px; background:var(--bg-body);">
          <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">?섏젙 ?붿껌</strong>
          <p style="margin:0; color:var(--text-body); line-height:1.7;">?뺣낫媛 ?ㅻⅤ硫?<a href="contact.html" style="color:var(--primary); font-weight:600;">臾몄쓽?섍린</a> ?먮뒗 <a href="mailto:replyleaders@naver.com" style="color:var(--primary); font-weight:600;">replyleaders@naver.com</a>?쇰줈 蹂대궡二쇱떆硫?寃????諛섏쁺?⑸땲??</p>
        </div>
      </div>
      <p style="margin:16px 0 0; color:var(--text-muted); line-height:1.7;">理쒓렐 ?뺤씤?? 2026-06-26 쨌 ?먯꽭???댁쁺 湲곗?? <a href="about.html" style="color:var(--primary); font-weight:600;">?ъ씠???뚭컻</a>, <a href="editorial-policy.html" style="color:var(--primary); font-weight:600;">肄섑뀗痢??몄쭛 ?먯튃</a>, <a href="ad-policy.html" style="color:var(--primary); font-weight:600;">愿묎퀬 諛??쒗쑕 ?덈궡</a>?먯꽌 ?뺤씤?????덉뒿?덈떎.</p>
      <p style="margin:8px 0 0; color:var(--text-muted); line-height:1.7;">利앹긽 ?낇솕, ?묎툒 ?곹솴, ?섏닠 寃곗젙? ???섏씠吏留뚯쑝濡??먮떒?섏? 留먭퀬 ?대떦 蹂묒썝?대굹 ?섎즺吏꾧낵 吏곸젒 ?곷떞??二쇱꽭??</p>
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
      <h3>???섏씠吏瑜?蹂대뒗 湲곗?</h3>
      <div id="detail-trust-details">
        <p style="margin:0; color:var(--text-muted);">?곗씠??湲곗?怨??댁쁺 ?뺤씤 諛⑸쾿??遺덈윭?ㅻ뒗 以묒엯?덈떎...</p>
      </div>
    `;

    anchorCard.insertAdjacentElement('afterend', wrapper);
    return wrapper.querySelector('#detail-trust-details');
  }

  function buildFallbackHospitalProfile(hospital) {
    const services = [];
    if (hospital.department) services.push(`${hospital.department} ?몃옒`);
    if (hospital.type) services.push(`${hospital.type} 吏꾨즺`);
    if (hospital.equipment) services.push(String(hospital.equipment).split(',')[0].trim());

    const documents = ['?좊텇利?];
    if (hospital.reviewCount) documents.push('湲곗〈 寃??寃곌낵 ?먮뒗 蹂듭슜??紐⑸줉');

    const checklist = ['利앹긽 ?쒖옉 ?쒖젏怨??꾩옱 遺덊렪??硫붾え??媛?몄슂.'];
    if (hospital.phone) checklist.push('諛⑸Ц ???묒닔 媛???쒓컙怨??댁쭊 ?щ?瑜??꾪솕濡??뺤씤?섏꽭??');

    return {
      primaryServices: services,
      visitTargets: ['珥덉쭊 吏꾨즺 ??湲곕낯 ?뺣낫瑜?誘몃━ ?뺤씤?섎젮??寃쎌슦'],
      documents,
      reservation: '珥덉쭊 ?묒닔 媛???쒓컙怨??먯떖?쒓컙??癒쇱? ?뺤씤?섎뒗 ?몄씠 醫뗭뒿?덈떎.',
      transport: hospital.address || '諛⑸Ц ???대룞 ?숈꽑???뺤씤?섏꽭??',
      accessibility: '二쇱감? 蹂묒썝 嫄대Ъ ?몄쓽 ?쒖꽕? 諛⑸Ц ?꾩뿉 蹂묒썝??吏곸젒 ?뺤씤?섏꽭??',
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
    if (Number(hospital.specialistCount || 0) > 0) items.push(`?꾨Ц??${hospital.specialistCount}紐?);
    if (hospital.saturdayOpen) items.push('?좎슂??吏꾨즺');
    if (hospital.sundayOpen) items.push('?쇱슂??吏꾨즺');
    if (hospital.nightOpen) items.push('?쇨컙 吏꾨즺');
    if (hospital.hasEmergency) items.push('?묎툒 吏꾨즺');
    if (hospital.url) items.push('怨듭떇 ?덊럹?댁? ?쒓났');
    if (hospital.department) items.push(hospital.department);
    if (hospital.type) items.push(hospital.type);
    if (hospital.region) items.push(hospital.region);
    if (hospital.subway) items.push(hospital.subway);
    if (hospital.parkingCapacity) items.push(`二쇱감 ${hospital.parkingCapacity}?`);
    if (hospital.parkingFee && !hospital.parkingCapacity) items.push(`二쇱감 ${hospital.parkingFee}`);
    if (hospital.roomCount) items.push(`吏꾨즺??${hospital.roomCount}媛?);
    if (hospital.bedCount) items.push(`蹂묒긽 ${hospital.bedCount}媛?);
    if (Array.isArray(profile.highlightPoints)) items.push(...profile.highlightPoints);

    const uniqueItems = Array.from(new Set(items.filter(Boolean)));
    if (uniqueItems.length === 0) {
      target.innerHTML = '<span style="color:var(--text-muted);">鍮꾧탳 ?ъ씤?몃? 以鍮?以묒엯?덈떎...</span>';
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
          <span>蹂묒썝李얘린 note ${index + 1}</span>
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
          <img src="${escapeHtml(hospital.mapImage)}" alt="${escapeHtml(hospital.name || '蹂묒썝')} ?꾩튂 誘몃━蹂닿린" style="display:block; width:100%; height:auto;">
        </div>
      `
      : '';

    container.innerHTML = `
      <div class="map-setup-box" style="padding:20px; text-align:center; border:1px solid var(--border-default); border-radius:8px; background:var(--bg-card); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; height:100%;">
        <span style="font-size:2rem;">?뱧</span>
        <h3 style="margin:0; color:var(--text-heading);">${escapeHtml(hospital.name || '蹂묒썝 ?꾩튂')}</h3>
        <p style="margin:0; color:var(--text-body); line-height:1.6;">${escapeHtml(hospital.address || '二쇱냼 ?뺣낫 ?놁쓬')}</p>
        ${note}
        ${mapImage}
        <a href="https://map.naver.com/v5/search/${encodeURIComponent(hospital.name || hospital.address || '蹂묒썝')}" target="_blank" rel="noopener" style="padding:10px 14px; background:var(--primary); color:#fff; border-radius:6px; text-decoration:none; font-weight:700;">?ㅼ씠踰?吏?꾩뿉???닿린</a>
      </div>
    `;
  }

  function renderNearbyHospitals(items, hospital) {
    const container = document.getElementById('detail-nearby-list');
    if (!container) {
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<p style="margin:0; color:var(--text-muted);">二쇰? 鍮꾧탳 蹂묒썝 ?뺣낫瑜??꾩쭅 李얠? 紐삵뻽?듬땲??</p>';
      return;
    }

    container.innerHTML = items.map((item) => {
      const contentApi = getHospitalContent();
      const profile = contentApi?.buildHospitalProfile?.(item);
      const serviceText = Array.isArray(profile?.primaryServices) && profile.primaryServices.length
        ? profile.primaryServices.slice(0, 2).join(', ')
        : '';

      return `
      <a href="detail.html?postid=${encodeURIComponent(item.id)}" style="display:flex; flex-direction:column; gap:8px; padding:16px; border:1px solid var(--border-default); border-radius:12px; text-decoration:none; background:var(--bg-body); color:inherit;">
        <strong style="font-size:1rem; color:var(--text-heading);">${escapeHtml(item.name)}</strong>
        <span style="font-size:0.9rem; color:var(--primary); font-weight:600;">${escapeHtml(item.type || hospital.type || '蹂묒썝')}</span>
        <span style="font-size:0.92rem; color:var(--text-body); line-height:1.5;">${escapeHtml(item.address || '二쇱냼 ?뺣낫 ?뺤씤 ?꾩슂')}</span>
        ${serviceText ? `<span style="font-size:0.88rem; color:var(--text-body); line-height:1.5;">二쇱슂 吏꾨즺: ${escapeHtml(serviceText)}</span>` : ''}
        <span style="font-size:0.82rem; color:var(--text-muted);">?꾨Ц??${escapeHtml(String(item.specialistCount || 0))}紐?/ 由щ럭 ${escapeHtml(String(item.reviewCount || 0))}媛?{buildDistanceLabel(hospital, item)}</span>
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
      renderMapFallback(hospital, '醫뚰몴 ?뺣낫媛 ?놁뼱 ?ㅼ씠踰?吏??諛붾줈媛湲곕? ?쒖떆?⑸땲??');
      return;
    }

    window.naver.maps.Service.geocode({ query: hospital.address }, (status, response) => {
      if (status === window.naver.maps.Service.Status.OK && response?.v2?.addresses?.length > 0) {
        const addressItem = response.v2.addresses[0];
        drawMap(Number(addressItem.y), Number(addressItem.x));
        return;
      }

      renderMapFallback(hospital, '二쇱냼 醫뚰몴瑜?李얠? 紐삵빐 ?ㅼ씠踰?吏??諛붾줈媛湲곕? ?쒖떆?⑸땲??');
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
    const correctionLink = document.getElementById('detail-correction-link');
    const correctionHint = document.getElementById('detail-correction-hint');

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
      mapLink.href = `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name || hospital.address || '蹂묒썝')}`;
    }

    if (searchLink) {
      searchLink.href = `https://search.naver.com/search.naver?query=${encodeURIComponent(`${hospital.name || '蹂묒썝'} ?꾧린`)}`;
    }

    if (correctionLink) {
      const subject = `[蹂묒썝李얘린 ?뺤젙 ?붿껌] ${hospital.name || '蹂묒썝'} / ?섏젙 ??ぉ`;
      const body = `${hospital.name || '蹂묒썝紐?}\n?섏씠吏 URL: ${window.location.href}\n?섏젙 ??ぉ:\n洹쇨굅 ?먮즺:\n`;
      correctionLink.href = `mailto:replyleaders@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    if (correctionHint) {
      correctionHint.textContent = `${hospital.name || '??蹂묒썝'}???댁쁺?쒓컙, ?꾪솕踰덊샇, ?꾩튂 ?뺣낫媛 ?ㅼ젣? ?ㅻⅤ硫??섏젙 ?붿껌??蹂대궡二쇱떆硫?寃????諛섏쁺?⑸땲??`;
    }
  }

  function updateSourceSummary(items) {
    const target = document.getElementById('detail-source-summary');
    if (!target) {
      return;
    }

    const uniqueItems = Array.from(new Set((items || []).filter(Boolean)));
    target.textContent = uniqueItems.length > 0 ? uniqueItems.join(' / ') : '怨듦났?곗씠???곕룞 ?곹깭 ?뺤씤 以?;
  }

  function buildSourceStateLabelSafe(label, dataSource) {
    if (dataSource === 'stale-cache') {
      return `${label} (罹먯떆 蹂닿컯)`;
    }
    return `${label} (?ㅼ떆媛?`;
  }

  function buildPublicCodeSummarySafe(detailData, hoursData) {
    const codes = [];
    if (detailData?.ykiho) {
      codes.push(`HIRA ${detailData.ykiho}`);
    }
    if (hoursData?.hpid) {
      codes.push(`NEMC ${hoursData.hpid}`);
    }
    return codes.length > 0 ? `湲곗? 肄붾뱶 ${codes.join(' / ')}` : '';
  }

  function buildOperationSummarySafe(hospital, detailData) {
    const parts = [];

    if (hospital.saturdayOpen) parts.push('?좎슂??吏꾨즺');
    if (hospital.sundayOpen) parts.push('?쇱슂??吏꾨즺');
    if (hospital.nightOpen) parts.push('?쇨컙 吏꾨즺');
    if (hospital.hasEmergency) parts.push('?묎툒 吏꾨즺 媛??);

    if (Array.isArray(detailData?.receptionSummary) && detailData.receptionSummary.length > 0) {
      parts.push(...detailData.receptionSummary.slice(0, 3));
    } else {
      if (detailData?.rcvWeek) parts.push(`?됱씪 ?묒닔 ${detailData.rcvWeek}`);
      if (detailData?.rcvSat) parts.push(`?좎슂???묒닔 ${detailData.rcvSat}`);
      if (detailData?.lunchWeek) parts.push(`?먯떖?쒓컙 ${detailData.lunchWeek}`);
    }

    if (Array.isArray(detailData?.parkingSummary) && detailData.parkingSummary.length > 0) {
      parts.push(detailData.parkingSummary[0]);
    }

    return parts.length > 0 ? parts.join(' / ') : '?댁쁺 ?붿빟 ?뺣낫 ?뺤씤 ?꾩슂';
  }

  function buildLocationSummarySafe(hospital, hoursData) {
    const parts = [];
    const regionText = buildRegionText(hospital);
    const coordinateText = buildCoordinateLabel(hospital.lat, hospital.lng);

    if (regionText && !regionText.includes('?뺤씤')) {
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
      parts.push('吏??湲곗? ?뺣낫 ?곕룞');
    }

    return parts.length > 0 ? parts.join(' / ') : (hospital.address || '?꾩튂 湲곗? ?뺣낫 ?뺤씤 ?꾩슂');
  }

  function buildEquipmentSummarySafe(hospital, equipData) {
    const parts = [];
    const facility = equipData?.facility || {};
    const equipmentItems = Array.isArray(equipData?.topEquipment) && equipData.topEquipment.length > 0
      ? equipData.topEquipment.slice(0, 4).map((item) => `${item.name} ${item.count}?`)
      : Array.isArray(equipData?.equipDetails) && equipData.equipDetails.length > 0
        ? equipData.equipDetails.slice(0, 4).map((item) => `${item.name} ${item.count}?`)
        : Array.isArray(equipData?.equips) && equipData.equips.length > 0
          ? equipData.equips.slice(0, 4)
          : [];

    if (equipmentItems.length > 0) {
      parts.push(equipmentItems.join(', '));
    } else if (hospital.equipment) {
      parts.push(hospital.equipment);
    }

    const roomBedParts = [];
    if (toPositiveNumber(facility.stdSickbdCnt) > 0) roomBedParts.push(`?쇰컲 蹂묒긽 ${facility.stdSickbdCnt}`);
    if (toPositiveNumber(facility.permSbdCnt) > 0) roomBedParts.push(`?뱀닔 蹂묒긽 ${facility.permSbdCnt}`);
    if (roomBedParts.length === 0) {
      if (toPositiveNumber(hospital.roomCount) > 0) roomBedParts.push(`?낆썝??${hospital.roomCount}`);
      if (toPositiveNumber(hospital.bedCount) > 0) roomBedParts.push(`蹂묒긽 ${hospital.bedCount}`);
    }
    if (roomBedParts.length > 0) {
      parts.push(roomBedParts.join(' / '));
    }

    if (facility.totArea) {
      parts.push(`硫댁쟻 ${facility.totArea}`);
    } else if (hospital.area) {
      parts.push(hospital.area);
    }

    return parts.length > 0 ? parts.join(' / ') : '?λ퉬? ?쒖꽕 ?뺣낫 ?뺤씤 ?꾩슂';
  }

  function renderPublicDigest(hospital) {
    const matchSummary = detailRuntime.matchMeta?.summary
      || '怨듦났 蹂묒썝 ?곗씠??留ㅼ묶 ?뺣낫瑜??뺣━ 以묒엯?덈떎.';
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
          reasons.push('?대쫫 ?뺥솗???쇱튂');
        } else if (itemLooseName === targetLooseName) {
          score += 120;
          reasons.push('?대쫫 ?뺢퇋???쇱튂');
        } else if ((targetLooseName && itemLooseName.includes(targetLooseName)) || (itemLooseName && targetLooseName.includes(itemLooseName))) {
          score += 80;
          reasons.push('?대쫫 遺遺??쇱튂');
        } else if (nameOverlap >= 2) {
          score += 55;
          reasons.push(`?대쫫 ?듭떖??${nameOverlap}媛??쇱튂`);
        }

        if (addressOverlap > 0) {
          score += Math.min(addressOverlap * 12, 36);
          reasons.push(`二쇱냼 ?듭떖??${addressOverlap}媛??쇱튂`);
        }
        if (hospital.region && item.region === hospital.region) {
          score += 20;
          reasons.push('吏???쇱튂');
        }
        if (hospital.district && item.district === hospital.district) {
          score += 18;
          reasons.push('?몃? 吏???쇱튂');
        }
        if (hospital.type && item.type === hospital.type) {
          score += 10;
          reasons.push('蹂묒썝 ?좏삎 ?쇱튂');
        }
        if (hospital.departmentId && item.departmentId === hospital.departmentId) {
          score += 8;
          reasons.push('吏꾨즺 遺꾨쪟 ?쇱튂');
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
          summary: `怨듦났 蹂묒썝 ?곗씠??留ㅼ묶 ?꾨즺 쨌 ${top.reasons.slice(0, 3).join(' / ')}`,
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
      parts.push(`?꾨Ц??${hospital.specialistCount}紐?);
    }
    if (toPositiveNumber(hospital.generalDoctorCount) > 0) {
      parts.push(`?쇰컲??${hospital.generalDoctorCount}紐?);
    }
    return parts.join(', ') || '?섎즺吏??뺣낫 ?뺤씤 ?꾩슂';
  }

  function buildOpenDateText(openDate) {
    if (!openDate) {
      return '媛쒖썝???뺣낫 ?놁쓬';
    }

    const date = new Date(openDate);
    if (Number.isNaN(date.getTime())) {
      return String(openDate);
    }

    const years = Math.max(new Date().getFullYear() - date.getFullYear(), 0);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day} (${years}?꾩감)`;
  }

  function buildRegionText(hospital) {
    const parts = [hospital.region, hospital.district].filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : '吏???뺣낫 ?뺤씤 以?;
  }

  function buildDistanceLabel(originHospital, targetHospital) {
    const distanceKm = calculateDistanceKm(originHospital, targetHospital);
    if (distanceKm === null) {
      return '';
    }
    if (distanceKm < 1) {
      return ` / ??${Math.round(distanceKm * 1000)}m`;
    }
    return ` / ??${distanceKm.toFixed(1)}km`;
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
        return '?좎슂 吏꾨즺';
      case 'sundayOpen':
        return '?쇱슂 吏꾨즺';
      case 'nightOpen':
        return '?쇨컙 吏꾨즺';
      case 'hasEmergency':
        return '?묎툒 ???;
      default:
        return '?댁쁺 議곌굔';
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
      return `${label} (罹먯떆 蹂닿컯)`;
    }
    return `${label} (?ㅼ떆媛?`;
  }

  function buildOperationSummary(hospital, detailData) {
    const parts = [];

    if (hospital.saturdayOpen) parts.push('?좎슂??吏꾨즺');
    if (hospital.sundayOpen) parts.push('?쇱슂??吏꾨즺');
    if (hospital.nightOpen) parts.push('?쇨컙 吏꾨즺');
    if (hospital.hasEmergency) parts.push('?묎툒 吏꾨즺 媛??);
    if (detailData?.rcvWeek) parts.push(`?됱씪 ?묒닔 ${detailData.rcvWeek}`);
    if (detailData?.rcvSat) parts.push(`?좎슂???묒닔 ${detailData.rcvSat}`);
    if (detailData?.lunchWeek) parts.push(`?먯떖?쒓컙 ${detailData.lunchWeek}`);

    return parts.length > 0 ? parts.join(' / ') : '?댁쁺 ?붿빟 ?뺣낫 ?뺤씤 ?꾩슂';
  }

  function buildLocationSummary(hospital, hoursData) {
    const parts = [];
    const regionText = buildRegionText(hospital);
    const coordinateText = buildCoordinateLabel(hospital.lat, hospital.lng);

    if (regionText && regionText !== '吏???뺣낫 ?뺤씤 以?) {
      parts.push(regionText);
    }
    if (hospital.subway) {
      parts.push(hospital.subway);
    }
    if (coordinateText) {
      parts.push(coordinateText);
    }
    if (hoursData?.dutyMapimg || hospital.mapImage) {
      parts.push('吏???대?吏 ?곕룞');
    }

    return parts.length > 0 ? parts.join(' / ') : (hospital.address || '?꾩튂 湲곗? ?뺣낫 ?뺤씤 ?꾩슂');
  }

  function buildEquipmentSummary(hospital, equipData) {
    const parts = [];
    const facility = equipData?.facility || {};
    const equipmentItems = Array.isArray(equipData?.equipDetails) && equipData.equipDetails.length > 0
      ? equipData.equipDetails.slice(0, 4).map((item) => `${item.name} ${item.count}?`)
      : Array.isArray(equipData?.equips) && equipData.equips.length > 0
        ? equipData.equips.slice(0, 4)
        : [];

    if (equipmentItems.length > 0) {
      parts.push(equipmentItems.join(', '));
    } else if (hospital.equipment) {
      parts.push(hospital.equipment);
    }

    const roomBedParts = [];
    if (toPositiveNumber(facility.stdSickbdCnt) > 0) roomBedParts.push(`?쇰컲 蹂묒긽 ${facility.stdSickbdCnt}`);
    if (toPositiveNumber(facility.permSbdCnt) > 0) roomBedParts.push(`?뱀닔 蹂묒긽 ${facility.permSbdCnt}`);
    if (roomBedParts.length === 0) {
      if (toPositiveNumber(hospital.roomCount) > 0) roomBedParts.push(`?낆썝??${hospital.roomCount}`);
      if (toPositiveNumber(hospital.bedCount) > 0) roomBedParts.push(`蹂묒긽 ${hospital.bedCount}`);
    }
    if (roomBedParts.length > 0) {
      parts.push(roomBedParts.join(' / '));
    }

    if (facility.totArea) {
      parts.push(`硫댁쟻 ${facility.totArea}`);
    } else if (hospital.area) {
      parts.push(hospital.area);
    }

    return parts.length > 0 ? parts.join(' / ') : '?λ퉬? ?쒖꽕 ?뺣낫 ?뺤씤 ?꾩슂';
  }

  function buildFallbackReviewSummaries(hospital) {
    const doctorText = buildDoctorText(hospital);
    const operationSummary = buildOperationSummarySafe(hospital, detailRuntime.detailData);
    const locationSummary = buildLocationSummarySafe(hospital, detailRuntime.hoursData);
    const equipmentSummary = buildEquipmentSummarySafe(hospital, detailRuntime.equipData);

    return [
      {
        title: `${hospital.name} ?댁쁺 ?ъ씤??,
        body: truncateText(
          operationSummary !== '?댁쁺 ?붿빟 ?뺣낫 ?뺤씤 ?꾩슂' ? operationSummary : FALLBACK_REVIEW_TEXTS[0],
          120
        ),
        meta: '?댁쁺 ?붿빟',
        badge: '?댁쁺 泥댄겕',
      },
      {
        title: `${hospital.name} 諛⑸Ц ?숈꽑`,
        body: truncateText(
          locationSummary !== '?꾩튂 湲곗? ?뺣낫 ?뺤씤 ?꾩슂'
            ? `${hospital.address || ''} / ${locationSummary}`
            : FALLBACK_REVIEW_TEXTS[2],
          140
        ),
        meta: '?꾩튂 湲곗?',
        badge: '諛⑸Ц 泥댄겕',
      },
      {
        title: `${hospital.name} 洹쒕え? ?λ퉬`,
        body: truncateText(
          `${doctorText} / ${equipmentSummary !== '?λ퉬? ?쒖꽕 ?뺣낫 ?뺤씤 ?꾩슂' ? equipmentSummary : FALLBACK_REVIEW_TEXTS[1]}`,
          140
        ),
        meta: '?쒖꽕 ?붿빟',
        badge: '?쒖꽕 泥댄겕',
      },
    ];
  }

  function buildCoordinateLabel(lat, lng) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng) || parsedLat <= 0 || parsedLng <= 0) {
      return '';
    }
    return `醫뚰몴 ${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}`;
  }

  function normalizeCompareText(value) {
    return String(value || '').replace(/\s+/g, '').toLowerCase();
  }

  function normalizeNameText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[^0-9a-zA-Z媛-??/g, '');
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
        .replace(/\d+痢?g, ' ')
        .replace(/\d+??g, ' ')
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
    return `${text.slice(0, maxLength - 1).trim()}??;
  }

  function formatPostDate(postDate) {
    const value = String(postDate || '').trim();
    if (!/^\d{8}$/.test(value)) {
      return '理쒓렐 ?꾧린';
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
    return `?ㅼ씠踰?吏???몄쬆???ㅽ뙣?덉뒿?덈떎. Naver Cloud Maps?먯꽌 ?ъ슜 以묒씤 Key ID(${keyLabel})??https://hospital-ranking.kr ? https://www.hospital-ranking.kr 瑜??깅줉?덈뒗吏 ?뺤씤??二쇱꽭??`;
  }
})();

