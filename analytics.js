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
  // are ignored harmlessly. GoatCounter click tracking below still records them until retired.
  document.querySelectorAll('a[href*="etsy.com/"]').forEach((link, index) => {
    const name = 'etsy-guide-' + location.pathname.replace(/\//g, '-') + '-' + index;
    if (!link.dataset.goatcounterClick) link.dataset.goatcounterClick = name;
    link.addEventListener('click', () => {
      try { window.va('event', { name: 'etsy_click', data: { page: location.pathname, link: index } }); } catch (e) {}
    });
  });

  // GoatCounter (retire after cut-over).
  const gc = document.createElement('script');
  gc.dataset.goatcounter = 'https://bestmanbackup.goatcounter.com/count';
  gc.async = true;
  gc.src = 'https://gc.zgo.at/count.js';
  document.head.append(gc);
})();
