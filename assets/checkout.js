/**
 * Wire every [data-product] buy control to checkout-config.js.
 * Empty checkoutUrl → product section on /kits/. Never leaves a dead href.
 */
(() => {
  const config = window.BMB_CHECKOUT;
  if (!config || !config.products) return;
  const aliases = window.BMB_CHECKOUT_ALIASES || {};

  function resolve(key) {
    const id = aliases[key] || key;
    return config.products[id] || null;
  }

  function isLiveCheckout(url) {
    return typeof url === 'string' && /^https:\/\//i.test(url.trim());
  }

  function applyLink(el, product) {
    const live = isLiveCheckout(product.checkoutUrl);
    const href = live ? product.checkoutUrl.trim() : product.kitsPath;
    el.setAttribute('href', href);
    if (live) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
      const label = el.dataset.label || product.buttonLabel;
      el.setAttribute('aria-label', `${label} (opens in a new tab)`);
      if (el.dataset.goatcounterClick) {
        el.dataset.goatcounterClick = el.dataset.goatcounterClick.replace(/^etsy-/, 'checkout-');
      }
    } else {
      el.removeAttribute('target');
      el.removeAttribute('rel');
      const label = el.dataset.label || product.buttonLabel;
      el.setAttribute('aria-label', label);
      if (el.dataset.goatcounterClick) {
        el.dataset.goatcounterClick = el.dataset.goatcounterClick.replace(/^etsy-/, 'kits-');
      }
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
})();
