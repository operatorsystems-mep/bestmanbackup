/**
 * Live free-guide count for Best Man Backup.
 * Bump `count` to 40 when PR #38 (11 extra guides) merges.
 * Do not advertise a higher number than guides that exist on this branch.
 */
(() => {
  const stats = Object.freeze({
    count: 29,
    targetAfterPr38: 40,
  });
  window.BMB_GUIDE_STATS = stats;

  document.querySelectorAll('[data-guide-count]').forEach((el) => {
    el.textContent = String(stats.count);
  });
})();
