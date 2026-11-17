/* Homepage purchase links. Buy buttons use data-product; assets/checkout.js
   resolves each one from assets/checkout-config.js (Stripe Payment Link or /kits/). */
const BMB_RELEASE = Object.freeze({
  approved: true,
  products: {
    duties: { ready: true },
    playbook: { ready: true },
    speech: { ready: true },
    set: { ready: true },
  },
});
(() => {
  // GoatCounter is loaded by /analytics.js (production host only).
  if (!BMB_RELEASE.approved) return;
  document.querySelectorAll('[data-review-only]').forEach((node) => node.remove());
  // checkout.js upgrades any leftover <button data-product> placeholders.
})();
