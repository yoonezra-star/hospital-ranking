function applyGuidePageEnhancements() {
  const path = window.location.pathname.split('/').pop() || '';
  if (!path.startsWith('guide-') || !path.endsWith('.html')) {
    return;
  }

  const article = document.querySelector('main article');
  const heading = article?.querySelector('h1');
  const footerBottom = document.querySelector('.footer-bottom');

  if (article && heading) {
    const trustMeta = article.querySelector('[data-guide-trust-meta]') || document.createElement('div');
    trustMeta.setAttribute('data-guide-trust-meta', 'true');
    trustMeta.style.margin = '18px 0 28px';
    trustMeta.style.padding = '16px 18px';
    trustMeta.style.border = '1px solid var(--border-default)';
    trustMeta.style.borderRadius = '14px';
    trustMeta.style.background = 'color-mix(in srgb, var(--bg-body) 90%, white 10%)';
    trustMeta.style.color = 'var(--text-body)';
    trustMeta.style.lineHeight = '1.8';
    trustMeta.style.fontSize = '0.96rem';
    trustMeta.innerHTML = `
      <strong style="color:var(--text-heading);">최종 검토일:</strong> 2026-06-20<br>
      <strong style="color:var(--text-heading);">문의 및 정정 요청:</strong> <a href="mailto:replyleaders@naver.com" style="color:var(--primary); font-weight:700;">replyleaders@naver.com</a><br>
      <strong style="color:var(--text-heading);">안내:</strong> 본 문서는 참고용 건강 정보이며, 실제 진단과 치료 결정은 반드시 해당 병원 또는 의료진과 직접 상담해 주세요.
    `;
    if (!trustMeta.parentElement) {
      heading.insertAdjacentElement('afterend', trustMeta);
    }
  }

  if (article) {
    const checklist = article.querySelector('[data-guide-trust-note]') || article.querySelector('[data-guide-checklist]') || document.createElement('section');
    checklist.setAttribute('data-guide-checklist', 'true');
    checklist.style.marginTop = '36px';
    checklist.style.padding = '22px';
    checklist.style.borderRadius = '14px';
    checklist.style.border = '1px solid var(--border-default)';
    checklist.style.background = 'var(--bg-body)';
    checklist.innerHTML = `
      <h2 style="font-size:1.15rem; margin-bottom:10px; color:var(--text-heading);">병원 방문 전 확인할 점</h2>
      <ul style="padding-left:18px; color:var(--text-body); line-height:1.85; margin:0; display:flex; flex-direction:column; gap:8px;">
        <li>병원별 진료 가능 시간, 비용, 장비, 검사 가능 여부는 실제 방문 전에 다시 확인해 주세요.</li>
        <li>증상 악화, 출혈, 호흡 곤란, 갑작스러운 고열 같은 응급 상황은 온라인 정보보다 직접 진료가 우선입니다.</li>
        <li>콘텐츠 보완 제안이나 오류 제보는 <a href="mailto:replyleaders@naver.com" style="color:var(--primary); font-weight:700;">replyleaders@naver.com</a>으로 접수합니다.</li>
      </ul>
    `;
    if (!checklist.parentElement) {
      article.appendChild(checklist);
    }
  }

  if (article && !article.querySelector('[data-guide-method-note]')) {
    const methodNote = document.createElement('section');
    methodNote.setAttribute('data-guide-method-note', 'true');
    methodNote.style.marginTop = '18px';
    methodNote.style.padding = '20px';
    methodNote.style.borderRadius = '14px';
    methodNote.style.border = '1px solid var(--border-default)';
    methodNote.style.background = 'var(--bg-card)';
    methodNote.innerHTML = `
      <h2 style="font-size:1.1rem; margin-bottom:10px; color:var(--text-heading);">이 문서의 성격</h2>
      <p style="margin:0; color:var(--text-body); line-height:1.8;">
        병원찾기 가이드는 병원 홍보용 광고 문서가 아니라, 병원 선택 전에 맥락을 이해하기 쉽게 정리한 참고 콘텐츠입니다.
        운영 기준과 정정 절차는 <a href="about.html" style="color:var(--primary); font-weight:700;">사이트 소개</a>에서 확인할 수 있습니다.
      </p>
    `;
    article.appendChild(methodNote);
  }

  if (footerBottom) {
    footerBottom.innerHTML = `
      <p>&copy; 2026 병원찾기. 모든 권리 보유.</p>
      <p>운영 문의 및 정보 정정 요청: <a href="mailto:replyleaders@naver.com" style="color:var(--primary); font-weight:600;">replyleaders@naver.com</a></p>
      <p>본 페이지의 정보는 참고용이며, 실제 진단과 치료 결정은 반드시 해당 병원 또는 의료진과 직접 상담해 주세요.</p>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyGuidePageEnhancements);
} else {
  applyGuidePageEnhancements();
}
