(() => {
  const checklist = document.getElementById('visit-checklist');
  if (!checklist) return;
  const inputs = [...checklist.querySelectorAll('input[type="checkbox"]')];
  const progress = document.getElementById('checklist-progress');
  function updateProgress() {
    progress.textContent = `확인 항목 ${inputs.filter((input) => input.checked).length} / ${inputs.length}`;
  }
  checklist.querySelector('.visit-tools').hidden = false;
  checklist.addEventListener('change', updateProgress);
  document.getElementById('checklist-reset').addEventListener('click', () => {
    inputs.forEach((input) => { input.checked = false; });
    updateProgress();
  });
  document.getElementById('checklist-print').addEventListener('click', () => window.print());
  updateProgress();
})();
