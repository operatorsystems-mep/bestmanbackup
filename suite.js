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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile nav
  const toggle = document.querySelector('.nav-toggle');
  const header = document.querySelector('.header');
  if (toggle && header) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    header.querySelectorAll('nav a').forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  // Scroll reveals (hero fade/rise + section rises). Skip if reduced motion.
  const nodes = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    nodes.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  nodes.forEach((el) => observer.observe(el));
})();
