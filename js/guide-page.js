function applyGuidePageEnhancements() {
  const path = window.location.pathname.split('/').pop() || '';
  if (!path.startsWith('guide-') || !path.endsWith('.html')) {
    return;
  }

  const article = document.querySelector('main article');
  const heading = article?.querySelector('h1');
  const footerBottom = document.querySelector('.footer-bottom');

  if (article && heading && !article.querySelector('[data-guide-trust-meta]')) {
    const trustMeta = document.createElement('div');
    trustMeta.setAttribute('data-guide-trust-meta', 'true');
    trustMeta.style.margin = '18px 0 28px';
    trustMeta.style.padding = '14px 16px';
    trustMeta.style.border = '1px solid var(--border-default)';
    trustMeta.style.borderRadius = '12px';
    trustMeta.style.background = 'var(--bg-body)';
    trustMeta.style.color = 'var(--text-body)';
    trustMeta.style.lineHeight = '1.7';
    trustMeta.style.fontSize = '0.95rem';
    trustMeta.innerHTML = `
      <strong style="color:var(--text-heading);">최종 검토일:</strong> 2026-06-18<br>
      <strong style="color:var(--text-heading);">문의 및 정정 요청:</strong> <a href="mailto:replyleaders@naver.com" style="color:var(--primary); font-weight:600;">replyleaders@naver.com</a><br>
      <strong style="color:var(--text-heading);">안내:</strong> 본 문서는 참고용 건강 정보이며, 실제 진단과 치료 결정은 반드시 해당 병원 또는 의료진과 직접 상담해 주세요.
    `;
    heading.insertAdjacentElement('afterend', trustMeta);
  }

  if (article && !article.querySelector('[data-guide-trust-note]')) {
    const note = document.createElement('section');
    note.setAttribute('data-guide-trust-note', 'true');
    note.style.marginTop = '36px';
    note.style.padding = '20px';
    note.style.borderRadius = '12px';
    note.style.border = '1px solid var(--border-default)';
    note.style.background = 'var(--bg-body)';
    note.innerHTML = `
      <h2 style="font-size:1.1rem; margin-bottom:10px; color:var(--text-heading);">이 가이드를 볼 때 함께 확인할 점</h2>
      <ul style="padding-left:18px; color:var(--text-body); line-height:1.8; margin:0;">
        <li>병원별 진료 가능 시간, 비용, 장비, 수술 가능 여부는 실제 방문 전 다시 확인해 주세요.</li>
        <li>통증 악화, 출혈, 급성 증상 등 응급 상황은 온라인 정보보다 직접 진료를 우선해 주세요.</li>
        <li>콘텐츠 수정 제안이나 오류 신고는 <a href="mailto:replyleaders@naver.com" style="color:var(--primary); font-weight:600;">replyleaders@naver.com</a> 으로 접수합니다.</li>
      </ul>
    `;
    article.appendChild(note);
  }

  if (footerBottom) {
    footerBottom.innerHTML = `
      <p>&copy; 2026 병원랭킹. All rights reserved.</p>
      <p>운영 문의 및 정보 정정 요청: <a href="mailto:replyleaders@naver.com" style="color:var(--primary); font-weight:600;">replyleaders@naver.com</a></p>
      <p>이 페이지의 정보는 참고용이며, 진단과 치료 결정은 반드시 해당 병원 또는 의료진과 직접 상담해 주세요.</p>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyGuidePageEnhancements);
} else {
  applyGuidePageEnhancements();
}
