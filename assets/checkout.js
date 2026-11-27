/**
 * Wire every [data-product] buy control to checkout-config.js.
 * Production host (bestmanbackup.com / www) → live Payment Links.
 * Preview / localhost / other hosts → test Payment Links.
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

  function checkoutUrlFor(product) {
    const live = isProductionHost(location.hostname);
    const url = live ? product.checkoutUrlLive : product.checkoutUrlTest;
    return typeof url === 'string' ? url.trim() : '';
  }

  function resolve(key) {
    const id = aliases[key] || key;
    return config.products[id] || null;
  }

  function isHttpCheckout(url) {
    return typeof url === 'string' && /^https:\/\//i.test(url);
  }

  const PAGE_NAME = {
    speech: 'The Speech Kit',
    duties: 'The Duties Kit',
    playbook: 'The Stag Playbook',
    bundle: 'The Best Man Set',
  };

  function visibleLabel(el, product) {
    const shown = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return shown || PAGE_NAME[product.id] || '';
  }

  function applyLink(el, product) {
    const url = checkoutUrlFor(product);
    const live = isHttpCheckout(url);
    const href = live ? url : product.kitsPath;
    el.setAttribute('href', href);
    el.removeAttribute('target');
    el.removeAttribute('rel');
    const label = visibleLabel(el, product);
    if (label) el.setAttribute('aria-label', label);
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
  }

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

  document.querySelectorAll('[data-price]').forEach((node) => {
    const product = resolve(node.getAttribute('data-price'));
    if (product && product.price) node.textContent = product.price;
  });

  function pounds(label) {
    const amount = Number(String(label || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(amount) ? amount : null;
  }

  document.querySelectorAll('[data-save]').forEach((node) => {
    const parts = ['speech', 'duties', 'playbook'].map((id) => pounds(resolve(id) && resolve(id).price));
    const set = pounds(resolve('bundle') && resolve('bundle').price);
    if (parts.some((amount) => amount == null) || set == null) return;
    const worth = parts.reduce((sum, amount) => sum + amount, 0);
    const save = Math.round((worth - set) * 100) / 100;
    node.textContent = `£${save.toFixed(2)}`;
  });

  const allLive = Object.values(config.products).every((p) => isHttpCheckout(checkoutUrlFor(p)));
  if (allLive) {
    document.querySelectorAll('[data-checkout-pending="all"]').forEach((node) => {
      node.hidden = true;
    });
  }
})();
