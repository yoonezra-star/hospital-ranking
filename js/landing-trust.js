(() => {
  const noteSection = document.querySelector('.landing-note');
  if (!noteSection || noteSection.dataset.trustMounted === 'true') {
    return;
  }

  const section = document.createElement('section');
  section.className = 'landing-note';
  section.style.marginTop = '28px';
  section.innerHTML = `
    <h3>확인 기준</h3>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
      <div style="padding:16px; border:1px solid var(--border-default); border-radius:14px; background:var(--bg-body);">
        <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">최근 확인일</strong>
        <p style="margin:0; color:var(--text-body); line-height:1.7;">2026-06-20 기준으로 랜딩 구조와 안내 문구를 점검했습니다.</p>
      </div>
      <div style="padding:16px; border:1px solid var(--border-default); border-radius:14px; background:var(--bg-body);">
        <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">이용 방법</strong>
        <p style="margin:0; color:var(--text-body); line-height:1.7;">이 페이지는 비교 기준을 잡는 참고용 화면입니다. 실제 진료 가능 여부, 접수 마감, 비용은 병원에 직접 확인하는 편이 안전합니다.</p>
      </div>
      <div style="padding:16px; border:1px solid var(--border-default); border-radius:14px; background:var(--bg-body);">
        <strong style="display:block; margin-bottom:8px; color:var(--text-heading);">주의 안내</strong>
        <p style="margin:0; color:var(--text-body); line-height:1.7;">증상 악화, 응급 상황, 수술 결정은 이 페이지만으로 판단하지 말고 해당 병원이나 의료진과 직접 상담해 주세요.</p>
      </div>
    </div>
  `;

  noteSection.dataset.trustMounted = 'true';
  noteSection.insertAdjacentElement('afterend', section);
})();
