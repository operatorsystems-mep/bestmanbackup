/**
 * Wire every [data-product] buy control to checkout-config.js.
 * Empty checkoutUrl → product section on /kits/. Never leaves a dead href.
 * Live Stripe Payment Links open in the same tab so the thank-you redirect returns here.
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
    el.removeAttribute('target');
    el.removeAttribute('rel');
    const label = el.dataset.label || product.buttonLabel;
    el.setAttribute('aria-label', label);
    if (el.dataset.goatcounterClick) {
      el.dataset.goatcounterClick = el.dataset.goatcounterClick
        .replace(/^etsy-/, live ? 'checkout-' : 'kits-')
        .replace(/^kits-/, live ? 'checkout-' : 'kits-');
    }

    // Hide "checkout opening shortly" notes once a live URL exists for this product.
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

  // Page-level pending banner when every product has a live checkout URL.
  const allLive = Object.values(config.products).every((p) => isLiveCheckout(p.checkoutUrl));
  if (allLive) {
    document.querySelectorAll('[data-checkout-pending="all"]').forEach((node) => {
      node.hidden = true;
    });
  }
})();
