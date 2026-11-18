/**
 * Wire every [data-product] buy control to checkout-config.js.
 * Production host (bestmanbackup.com / www) → live Payment Links.
 * Preview / localhost / other hosts → test Payment Links.
 * Currency from html[data-currency] (GBP default; USD when set).
 *
 * USD live links are empty until Sean creates them. On preview, missing USD
 * test links fall back to the existing GBP test links (noted in UI).
 * Empty URL → product section on /kits/. Never leaves a dead href.
 */
(() => {
  const config = window.BMB_CHECKOUT;
  if (!config || !config.products) return;
  const aliases = window.BMB_CHECKOUT_ALIASES || {};

  function isProductionHost(hostname) {
    const host = String(hostname || '').toLowerCase();
    return host === 'bestmanbackup.com' || host === 'www.bestmanbackup.com';
  }

  function activeCurrency() {
    const fromDom = String(document.documentElement.getAttribute('data-currency') || '').toUpperCase();
    if (fromDom === 'USD' || fromDom === 'GBP') return fromDom;
    if (window.BMB_currency && typeof window.BMB_currency.get === 'function') {
      const cur = window.BMB_currency.get();
      if (cur === 'USD' || cur === 'GBP') return cur;
    }
    return 'GBP';
  }

  function checkoutUrlFor(product, currency) {
    const live = isProductionHost(location.hostname);
    const usd = currency === 'USD';
    let url = '';
    if (usd) {
      url = live ? product.checkoutUrlLiveUsd : product.checkoutUrlTestUsd;
      // Preview fallback: use GBP test links when USD test slots are empty.
      if (!live && !(typeof url === 'string' && url.trim())) {
        url = product.checkoutUrlTest;
      }
      // Production: never fall back USD→GBP live silently (would charge wrong currency).
      // Leave empty so the kits path is used until Sean fills live USD links.
    } else {
      url = live ? product.checkoutUrlLive : product.checkoutUrlTest;
    }
    return typeof url === 'string' ? url.trim() : '';
  }

  function resolve(key) {
    const id = aliases[key] || key;
    return config.products[id] || null;
  }

  function isHttpCheckout(url) {
    return typeof url === 'string' && /^https:\/\//i.test(url);
  }

  function applyLink(el, product) {
    const currency = activeCurrency();
    const url = checkoutUrlFor(product, currency);
    const live = isHttpCheckout(url);
    const href = live ? url : product.kitsPath;
    el.setAttribute('href', href);
    el.removeAttribute('target');
    el.removeAttribute('rel');
    el.dataset.checkoutCurrency = currency;

    const price = currency === 'USD' ? product.priceUsd : product.priceGbp;
    const visible = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const label = visible || el.dataset.label || `${product.buttonLabel} · ${price}`;
    el.setAttribute('aria-label', label);
    if (el.dataset.goatcounterClick) {
      el.dataset.goatcounterClick = el.dataset.goatcounterClick
        .replace(/^etsy-/, live ? 'checkout-' : 'kits-')
        .replace(/^kits-/, live ? 'checkout-' : 'kits-');
    }

    if (live) {
      document.querySelectorAll(`[data-checkout-pending="${product.id}"]`).forEach((node) => {
        node.hidden = true;
      });
    }

    // Preview note when USD is shown but USD test Payment Link is still empty
    if (currency === 'USD' && !isProductionHost(location.hostname)) {
      const hasUsdTest = typeof product.checkoutUrlTestUsd === 'string' && product.checkoutUrlTestUsd.trim();
      document.querySelectorAll('[data-usd-checkout-fallback]').forEach((node) => {
        node.hidden = !!hasUsdTest;
      });
    }
  }

  function applyAll() {
    document.querySelectorAll('[data-product]').forEach((el) => {
      const product = resolve(el.dataset.product);
      if (!product) return;
      if (el.tagName === 'A') {
        applyLink(el, product);
        return;
      }
      if (el.tagName === 'BUTTON') {
        const link = document.createElement('a');
        link.className = el.className;
        link.textContent = el.dataset.label || product.buttonLabel;
        link.dataset.product = product.id;
        if (el.dataset.placement) link.dataset.placement = el.dataset.placement;
        if (el.dataset.label) link.dataset.label = el.dataset.label;
        applyLink(link, product);
        el.replaceWith(link);
      }
    });

    const currency = activeCurrency();
    const allLive = Object.values(config.products).every((p) =>
      isHttpCheckout(checkoutUrlFor(p, currency))
    );
    if (allLive) {
      document.querySelectorAll('[data-checkout-pending="all"]').forEach((node) => {
        node.hidden = true;
      });
    }
  }

  applyAll();
  window.BMB_applyCheckout = applyAll;
  document.addEventListener('bmb:currency', applyAll);
})();
