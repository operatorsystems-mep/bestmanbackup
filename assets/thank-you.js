/**
 * Post-checkout thank-you UI. Fulfillment API contract unchanged.
 * Kit copy and guide links come from existing site product/guide pages.
 */
(() => {
  const TAGLINE = "You've Got His Back, We've Got Yours.";

  const KITS = {
    speech: {
      id: 'speech',
      name: 'Best Man Speech Kit',
      price: '£14.99',
      contents: [
        'A speech-writing guide',
        'An editable Word workbook',
        'A final-speech document',
        'Six large cue cards',
        'A4 and US Letter',
      ],
      steps: [
        {
          title: 'How to write a best man speech',
          href: '/guides/how-to-write-a-best-man-speech/',
          blurb: 'Shape your stories into a clear structure before you open the workbook.',
        },
        {
          title: 'How long should a best man speech be?',
          href: '/guides/how-long-should-a-best-man-speech-be/',
          blurb: 'Set a realistic timing target for the room and the running order.',
        },
        {
          title: 'How to end a best man speech',
          href: '/guides/how-to-end-a-best-man-speech/',
          blurb: 'Land the toast cleanly once the draft is in place.',
        },
      ],
    },
    duties: {
      id: 'duties',
      name: 'Best Man Duties Kit',
      price: '£9.99',
      contents: [
        'A duties handbook',
        'An editable Word planner',
        'A printable planner with 14 planning sections',
        'A wedding-day sheet',
        'Four pocket carry cards',
        'A4 and US Letter',
      ],
      steps: [
        {
          title: 'Best man duties checklist',
          href: '/guides/best-man-duties-checklist/',
          blurb: 'See the full role before you fill in the planner.',
        },
        {
          title: 'What does the best man pay for?',
          href: '/guides/what-does-the-best-man-pay-for/',
          blurb: 'Align money expectations with the couple early.',
        },
        {
          title: 'What does the best man do on the wedding day?',
          href: '/guides/what-does-the-best-man-do-on-the-wedding-day/',
          blurb: 'Use this alongside the wedding-day sheet.',
        },
      ],
    },
    playbook: {
      id: 'playbook',
      name: 'Stag Do & Bachelor Party Playbook',
      price: '£9.99',
      contents: [
        'Eight stag do games',
        'A groom quiz',
        'Challenge cards and the Stag Awards',
        'Editable in Word or printable',
        'UK and US editions',
      ],
      steps: [
        {
          title: 'How to plan a stag do',
          href: '/guides/how-to-plan-a-stag-do/',
          blurb: 'Set the shape of the night before you open the games pack.',
        },
        {
          title: 'Stag do games',
          href: '/guides/stag-do-games/',
          blurb: 'Match the free guide ideas to the Playbook games.',
        },
        {
          title: 'Stag do budget',
          href: '/guides/stag-do-budget/',
          blurb: 'Budgets and guest payments sit in the Duties Kit; this guide helps you plan.',
        },
      ],
    },
    bundle: {
      id: 'bundle',
      name: 'Best Man Bundle',
      price: '£19.99',
      contents: [
        'The Speech Kit',
        'The Duties Kit',
        'The Stag Do & Bachelor Party Playbook',
        'One starting point across the speech, the duties and the stag do',
      ],
      steps: [
        {
          title: 'Best man duties checklist',
          href: '/guides/best-man-duties-checklist/',
          blurb: 'Start with the role, then open Start Here in the Bundle.',
        },
        {
          title: 'How to plan a stag do',
          href: '/guides/how-to-plan-a-stag-do/',
          blurb: 'Plan the night alongside the party kit files.',
        },
        {
          title: 'How to write a best man speech',
          href: '/guides/how-to-write-a-best-man-speech/',
          blurb: 'Begin the speech while the duties plan is underway.',
        },
      ],
    },
  };

  const aliases = { set: 'bundle' };

  const els = {
    eyebrow: document.getElementById('ty-eyebrow'),
    tagline: document.getElementById('ty-tagline'),
    title: document.getElementById('ty-title'),
    product: document.getElementById('ty-product'),
    status: document.getElementById('ty-status'),
    download: document.getElementById('ty-download'),
    downloadBtn: document.getElementById('ty-download-btn'),
    downloadNote: document.getElementById('ty-download-note'),
    contentsPanel: document.getElementById('ty-contents-panel'),
    contentsList: document.getElementById('ty-contents'),
    stepsPanel: document.getElementById('ty-steps-panel'),
    stepsList: document.getElementById('ty-steps'),
    reassurePanel: document.getElementById('ty-reassure-panel'),
    upsell: document.getElementById('ty-upsell'),
    share: document.getElementById('ty-share'),
    errorActions: document.getElementById('ty-error-actions'),
  };

  function setEyebrow(label) {
    if (!els.eyebrow) return;
    els.eyebrow.innerHTML = `<span></span> ${label}`;
  }

  function kitFromParam(raw) {
    const id = aliases[String(raw || '').toLowerCase()] || String(raw || '').toLowerCase();
    return KITS[id] || null;
  }

  function show(el, on) {
    if (!el) return;
    el.classList.toggle('ty-hidden', !on);
  }

  function setState(state, message) {
    els.status.dataset.state = state;
    els.status.textContent = message;
  }

  function fillKitChrome(kit) {
    if (!kit) {
      els.product.textContent = '';
      show(els.product, false);
      return;
    }
    els.product.textContent = kit.name;
    show(els.product, true);
    els.contentsList.innerHTML = kit.contents.map((item) => `<li>${item}</li>`).join('');
    els.stepsList.innerHTML = kit.steps
      .map(
        (step) =>
          `<li><a href="${step.href}">${step.title}</a><p>${step.blurb}</p></li>`
      )
      .join('');
  }

  function renderChecking(kit) {
    setEyebrow('CONFIRMING');
    els.title.textContent = 'Confirming your order';
    setState('checking', 'Checking your payment…');
    show(els.download, false);
    show(els.contentsPanel, false);
    show(els.stepsPanel, false);
    show(els.reassurePanel, false);
    show(els.upsell, false);
    show(els.share, false);
    show(els.errorActions, false);
    fillKitChrome(kit);
  }

  function renderMissing() {
    setEyebrow('ORDER HELP');
    els.title.textContent = 'We need your order link';
    els.product.textContent = '';
    show(els.product, false);
    setState(
      'missing',
      'Missing kit or session. If you have just paid, use the link from Stripe, or email hello@bestmanbackup.com.'
    );
    show(els.download, false);
    show(els.contentsPanel, false);
    show(els.stepsPanel, false);
    show(els.reassurePanel, false);
    show(els.upsell, false);
    show(els.share, false);
    show(els.errorActions, true);
    els.errorActions.innerHTML =
      'Need help? Email <a href="mailto:hello@bestmanbackup.com">hello@bestmanbackup.com</a> with your order time.';
  }

  function renderError(kit, message) {
    setEyebrow('ORDER HELP');
    els.title.textContent = 'We could not verify this purchase';
    fillKitChrome(kit);
    setState('error', message || 'We could not verify this purchase.');
    show(els.download, false);
    show(els.contentsPanel, Boolean(kit));
    show(els.stepsPanel, false);
    show(els.reassurePanel, false);
    show(els.upsell, false);
    show(els.share, false);
    show(els.errorActions, true);
    els.errorActions.innerHTML =
      'Need help? Email <a href="mailto:hello@bestmanbackup.com">hello@bestmanbackup.com</a>.';
  }

  function renderSuccess(kit, downloadUrl) {
    setEyebrow('ORDER CONFIRMED');
    els.title.textContent = "You're all set";
    fillKitChrome(kit);
    setState(
      'success',
      `Your payment for the ${kit.name} is confirmed. Download your files and keep the ZIP somewhere safe.`
    );
    els.downloadBtn.href = downloadUrl;
    els.downloadBtn.setAttribute('download', '');
    els.downloadNote.textContent = 'This download link expires in about 15 minutes. Open Start Here first.';
    show(els.download, true);
    show(els.contentsPanel, true);
    show(els.stepsPanel, true);
    show(els.reassurePanel, true);
    show(els.errorActions, false);

    if (kit.id === 'bundle') {
      show(els.upsell, false);
      show(els.share, true);
    } else {
      show(els.share, false);
      show(els.upsell, true);
      const bundleBtn = els.upsell.querySelector('[data-product="bundle"]');
      if (bundleBtn && window.BMB_CHECKOUT?.products?.bundle) {
        // checkout.js may have already run; re-apply host-aware URL.
        const liveHost =
          location.hostname === 'bestmanbackup.com' || location.hostname === 'www.bestmanbackup.com';
        const product = window.BMB_CHECKOUT.products.bundle;
        const url = (liveHost ? product.checkoutUrlLive : product.checkoutUrlTest || '').trim();
        bundleBtn.href = url || product.kitsPath;
      }
    }

    document.querySelectorAll('.ty-reveal').forEach((node) => {
      node.classList.remove('ty-reveal');
      void node.offsetWidth;
      node.classList.add('ty-reveal');
    });
  }

  if (els.tagline) els.tagline.textContent = TAGLINE;

  const params = new URLSearchParams(location.search);
  const kitParam = params.get('kit');
  const sessionId = params.get('session_id');
  const kit = kitFromParam(kitParam);

  if (!kitParam || !sessionId) {
    renderMissing();
    return;
  }

  renderChecking(kit);

  fetch('/api/fulfillment/?kit=' + encodeURIComponent(kitParam) + '&session_id=' + encodeURIComponent(sessionId), {
    headers: { Accept: 'application/json' },
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        renderError(kit, data.message || 'We could not verify this purchase.');
        return;
      }
      const resolved = kitFromParam(data.kit) || kit || {
        id: data.kit || 'speech',
        name: data.name || 'Best Man Backup kit',
        contents: [],
        steps: [],
      };
      if (!resolved.contents?.length && kit) {
        renderSuccess(kit, data.downloadUrl);
        return;
      }
      renderSuccess(resolved, data.downloadUrl);
    })
    .catch(() => {
      renderError(kit, 'Something went wrong verifying your payment.');
    });
})();
