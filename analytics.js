// Retain GoatCounter on the production domain; ignore review copies and local files.
(() => {
  if (location.protocol !== 'https:' || location.hostname !== 'bestmanbackup.com') return;
  document.querySelectorAll('a[href*="etsy.com/"]').forEach((link, index) => {
    if (!link.dataset.goatcounterClick) link.dataset.goatcounterClick = 'etsy-guide-' + location.pathname.replace(/\//g, '-') + '-' + index;
  });
  const script = document.createElement('script');
  script.dataset.goatcounter = 'https://bestmanbackup.goatcounter.com/count';
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  document.head.append(script);
})();
