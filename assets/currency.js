/**
 * Currency detection + £/$ toggle.
 *
 * Resolution order (first paint, blocking when inlined in <head>):
 *   1. User preference (localStorage / bmb_currency cookie)
 *   2. Server geo hint (bmb_geo cookie from middleware, or data-geo on <html>)
 *   3. Browser locale (en-US → USD)
 *   4. GBP
 *
 * Prices are dual-rendered in the HTML; CSS shows the active currency so there
 * is no layout shift when the attribute is set before first paint.
 */
(function (global) {
  var STORAGE_KEY = 'bmb_currency';
  var COOKIE_PREF = 'bmb_currency';
  var COOKIE_GEO = 'bmb_geo';

  function readCookie(name) {
    try {
      var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : '';
    } catch (e) {
      return '';
    }
  }

  function writeCookie(name, value, maxAgeSeconds) {
    try {
      document.cookie =
        name +
        '=' +
        encodeURIComponent(value) +
        '; Path=/; Max-Age=' +
        String(maxAgeSeconds) +
        '; SameSite=Lax';
    } catch (e) {
      /* ignore */
    }
  }

  function localeSuggestsUsd() {
    try {
      var lang = String(navigator.language || navigator.userLanguage || '').toLowerCase();
      if (lang === 'en-us' || lang.endsWith('-us')) return true;
      var languages = navigator.languages || [];
      for (var i = 0; i < languages.length; i++) {
        var l = String(languages[i] || '').toLowerCase();
        if (l === 'en-us' || l.endsWith('-us')) return true;
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function normalize(value) {
    var v = String(value || '').toUpperCase();
    return v === 'USD' || v === 'GBP' ? v : '';
  }

  function resolveCurrency() {
    var pref = '';
    try {
      pref = normalize(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      pref = '';
    }
    if (!pref) pref = normalize(readCookie(COOKIE_PREF));
    if (pref) return pref;

    var geo =
      normalize(document.documentElement.getAttribute('data-geo') === 'US' ? 'USD' : '') ||
      (readCookie(COOKIE_GEO) === 'US' ? 'USD' : '');
    if (geo) return geo;

    if (localeSuggestsUsd()) return 'USD';
    return 'GBP';
  }

  function applyCurrency(currency, options) {
    var cur = normalize(currency) || 'GBP';
    var root = document.documentElement;
    root.setAttribute('data-currency', cur);
    root.lang = cur === 'USD' ? 'en-US' : 'en-GB';

    if (options && options.persist) {
      try {
        localStorage.setItem(STORAGE_KEY, cur);
      } catch (e) {
        /* ignore */
      }
      writeCookie(COOKIE_PREF, cur, 60 * 60 * 24 * 365);
    }

    document.querySelectorAll('[data-currency-toggle]').forEach(function (btn) {
      var target = normalize(btn.getAttribute('data-currency-toggle'));
      var active = target === cur;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', active);
    });

    // Refresh buy-button labels that carry a price suffix
    if (global.BMB_CHECKOUT && global.BMB_CHECKOUT.products) {
      document.querySelectorAll('[data-product][data-label]').forEach(function (el) {
        var id = el.getAttribute('data-product');
        var aliases = global.BMB_CHECKOUT_ALIASES || {};
        var product = global.BMB_CHECKOUT.products[aliases[id] || id];
        if (!product) return;
        var price = cur === 'USD' ? product.priceUsd : product.priceGbp;
        var base = product.buttonLabel || el.getAttribute('data-label-base') || '';
        if (!base) {
          var raw = el.getAttribute('data-label') || '';
          base = raw.replace(/\s*[·•]\s*[£$][\d.]+$/, '').trim() || product.buttonLabel;
          el.setAttribute('data-label-base', base);
        }
        var label = base + ' · ' + price;
        el.setAttribute('data-label', label);
        if (el.tagName === 'A' || el.tagName === 'BUTTON') {
          // Only rewrite text when it already contained a price marker
          var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (/[£$]\d/.test(text) || el.hasAttribute('data-price-in-label')) {
            el.setAttribute('data-price-in-label', '1');
            el.textContent = label;
          }
          el.setAttribute('aria-label', label);
        }
      });
    }

    try {
      document.dispatchEvent(new CustomEvent('bmb:currency', { detail: { currency: cur } }));
    } catch (e) {
      /* ignore */
    }
    return cur;
  }

  function initToggle() {
    document.querySelectorAll('[data-currency-toggle]').forEach(function (btn) {
      if (btn.getAttribute('data-currency-bound') === '1') return;
      btn.setAttribute('data-currency-bound', '1');
      btn.addEventListener('click', function () {
        var next = normalize(btn.getAttribute('data-currency-toggle')) || 'GBP';
        applyCurrency(next, { persist: true });
        // Re-run checkout link wiring for the new currency
        if (typeof global.BMB_applyCheckout === 'function') {
          global.BMB_applyCheckout();
        }
      });
    });
  }

  var initial = applyCurrency(resolveCurrency(), { persist: false });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggle);
  } else {
    initToggle();
  }

  global.BMB_currency = {
    get: function () {
      return normalize(document.documentElement.getAttribute('data-currency')) || initial;
    },
    set: function (currency) {
      return applyCurrency(currency, { persist: true });
    },
    resolve: resolveCurrency,
  };
})(window);
