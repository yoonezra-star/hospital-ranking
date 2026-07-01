function applyGuidePageEnhancements() {
  const path = window.location.pathname.split('/').pop() || '';
  if (!path.startsWith('guide-') || !path.endsWith('.html')) return;

  document.querySelectorAll('.ad-slot, .ad-placeholder').forEach((node) => {
    const slot = node.classList.contains('ad-slot') ? node : node.closest('.ad-slot');
    (slot || node).remove();
  });

  const article = document.querySelector('main article');
  const heading = article?.querySelector('h1');
  const footerBottom = document.querySelector('.footer-bottom');

  if (article && heading && !article.querySelector('[data-guide-trust-meta]')) {
    const trustMeta = document.createElement('div');
    trustMeta.setAttribute('data-guide-trust-meta', 'true');
    trustMeta.className = 'guide-trust-meta';
    trustMeta.innerHTML = `
      <strong>최종 점검일:</strong> 2026-07-01<br>
      <strong>정보 성격:</strong> 병원 방문 전 준비를 돕는 참고용 건강 정보입니다.<br>
      <strong>정정 요청:</strong> <a href="mailto:replyleaders@naver.com">replyleaders@naver.com</a>
    `;
    heading.insertAdjacentElement('afterend', trustMeta);
  }

  if (article && !article.querySelector('[data-guide-checklist]')) {
    const checklist = document.createElement('section');
    checklist.setAttribute('data-guide-checklist', 'true');
    checklist.className = 'guide-safety-note';
    checklist.innerHTML = `
      <h2>방문 전 다시 확인하세요</h2>
      <ul>
        <li>진료 가능 시간, 접수 마감, 비용, 검사 가능 여부는 병원 사정에 따라 달라질 수 있습니다.</li>
        <li>증상 악화, 출혈, 호흡 곤란, 급성 통증 등 응급 상황은 온라인 정보보다 직접 진료와 응급 안내가 우선입니다.</li>
        <li>이 문서는 진단서, 처방전, 의료 자문을 대신하지 않습니다.</li>
      </ul>
    `;
    article.appendChild(checklist);
  }

  if (footerBottom) {
    footerBottom.innerHTML = `
      <p>&copy; 2026 병원찾기. 모든 권리 보유.</p>
      <p>운영 문의 및 정보 정정 요청: <a href="mailto:replyleaders@naver.com">replyleaders@naver.com</a></p>
      <p>본 사이트의 정보는 참고용이며, 실제 진단과 치료 결정은 반드시 해당 병원 또는 의료진과 직접 상담해 주세요.</p>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyGuidePageEnhancements);
} else {
  applyGuidePageEnhancements();
}
