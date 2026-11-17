// Site analytics, production domain only (review copies, previews and local files are ignored).
// 1) Vercel Web Analytics: counts page views once bestmanbackup.com is served by Vercel and
//    Web Analytics is switched on for the project.
// 2) GoatCounter: kept only until the Vercel cut-over is confirmed, then delete this block.
(() => {
  if (location.protocol !== 'https:' || location.hostname !== 'bestmanbackup.com') return;

  // Vercel Web Analytics (page views on every plan).
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  const va = document.createElement('script');
  va.defer = true;
  va.src = '/_vercel/insights/script.js';
  document.head.append(va);

  // Kit / checkout buy-link clicks. Vercel custom events only record on a paid plan; on Hobby
  // these calls are ignored harmlessly. GoatCounter click tracking still records them until retired.
  document.querySelectorAll('a[data-product]').forEach((link, index) => {
    if (!link.dataset.goatcounterClick) {
      link.dataset.goatcounterClick =
        'kit-' + (link.dataset.product || 'unknown') + '-' + location.pathname.replace(/\//g, '-') + '-' + index;
    }
  });
  document.addEventListener(
    'click',
    (event) => {
      const link = event.target.closest && event.target.closest('a[data-product]');
      if (!link) return;
      const product = link.dataset.product || 'unknown';
      try {
        window.va('event', {
          name: 'kit_click',
          data: {
            page: location.pathname,
            product,
            placement: link.dataset.goatcounterClick || 'kit-link',
          },
        });
      } catch (e) {}
    },
    true
  );

  // GoatCounter (retire after cut-over).
  const gc = document.createElement('script');
  gc.dataset.goatcounter = 'https://bestmanbackup.goatcounter.com/count';
  gc.async = true;
  gc.src = 'https://gc.zgo.at/count.js';
  document.head.append(gc);
})();
