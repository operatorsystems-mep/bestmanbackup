// Site analytics, production domain only (review copies, previews and local files are ignored).
// 1) Vercel Web Analytics: counts page views once bestmanbackup.com is served by Vercel and
//    Web Analytics is switched on for the project. On GitHub Pages the script simply 404s.
// 2) GoatCounter: kept only until the Vercel cut-over is confirmed, then delete this block.
(() => {
  if (location.protocol !== 'https:' || location.hostname !== 'bestmanbackup.com') return;

  // Vercel Web Analytics (page views on every plan).
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  const va = document.createElement('script');
  va.defer = true;
  va.src = '/_vercel/insights/script.js';
  document.head.append(va);

  // Etsy buy-link clicks. Vercel custom events only record on a paid plan; on Hobby these calls
  // are ignored harmlessly. GoatCounter click tracking still records them until retired.
  // Static guide links are named here; homepage buy buttons (built by suite.js/site.js) keep
  // their own names. One delegated listener catches links added after this script runs.
  document.querySelectorAll('a[href*="etsy.com/"]').forEach((link, index) => {
    if (!link.dataset.goatcounterClick) link.dataset.goatcounterClick = 'etsy-guide-' + location.pathname.replace(/\//g, '-') + '-' + index;
  });
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href*="etsy.com/"]');
    if (!link) return;
    const listing = (link.href.match(/listing\/(\d+)/) || [])[1] || 'shop';
    try {
      window.va('event', { name: 'etsy_click', data: { page: location.pathname, listing, placement: link.dataset.goatcounterClick || 'etsy-link' } });
    } catch (e) {}
  }, true);

  // GoatCounter (retire after cut-over).
  const gc = document.createElement('script');
  gc.dataset.goatcounter = 'https://bestmanbackup.goatcounter.com/count';
  gc.async = true;
  gc.src = 'https://gc.zgo.at/count.js';
  document.head.append(gc);
})();
