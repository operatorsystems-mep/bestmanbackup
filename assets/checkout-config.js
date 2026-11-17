/**
 * Best Man Backup — checkout URLs and kit metadata.
 *
 * Paste a Stripe Payment Link into checkoutUrl for each product when ready.
 * Leave checkoutUrl empty ("") to send buy buttons to /kits/#<id> instead.
 * Never point a buy button at a dead or placeholder URL.
 *
 * Prices below match the last figures committed on this site
 * (preview HTML comment, Oct 2026: £5.99 + £11.99 + £6.98 − £19.99)
 * with the Speech Kit sale price confirmed in BMB operations notes (£6.98).
 */
window.BMB_CHECKOUT = Object.freeze({
  products: Object.freeze({
    speech: Object.freeze({
      id: 'speech',
      name: 'Best Man Speech Kit',
      shortName: 'Speech Kit',
      price: '£6.98',
      currency: 'GBP',
      priceValue: 6.98,
      description:
        'A speech-writing guide, an editable Word workbook, a final-speech document and six large cue cards, in A4 and US Letter. You bring the stories. Digital download.',
      checkoutUrl: '',
      kitsPath: '/kits/#speech',
      buttonLabel: 'Get the Speech Kit',
    }),
    duties: Object.freeze({
      id: 'duties',
      name: 'Best Man Duties Kit',
      shortName: 'Duties Kit',
      price: '£5.99',
      currency: 'GBP',
      priceValue: 5.99,
      description:
        'A duties handbook, an editable Word planner and a printable planner with 14 planning sections, plus a wedding-day sheet and four pocket carry cards, in A4 and US Letter. Digital download.',
      checkoutUrl: '',
      kitsPath: '/kits/#duties',
      buttonLabel: 'Get the Duties Kit',
    }),
    playbook: Object.freeze({
      id: 'playbook',
      name: 'Stag Do & Bachelor Party Playbook',
      shortName: 'Playbook',
      price: '£11.99',
      currency: 'GBP',
      priceValue: 11.99,
      description:
        'Eight stag do games, a groom quiz, challenge cards and the Stag Awards, editable in Word or printable, in UK and US editions. Digital download.',
      checkoutUrl: '',
      kitsPath: '/kits/#playbook',
      buttonLabel: 'Get the Playbook',
    }),
    bundle: Object.freeze({
      id: 'bundle',
      name: 'Best Man Bundle',
      shortName: 'Best Man Bundle',
      price: '£19.99',
      currency: 'GBP',
      priceValue: 19.99,
      description:
        'The Duties Kit, the Stag & Bachelor Party Kit and the Speech Kit in one download, with one starting point across the role, the stag do and the speech.',
      checkoutUrl: '',
      kitsPath: '/kits/#bundle',
      buttonLabel: 'Get the Best Man Bundle',
    }),
  }),
});

/* Alias used on the homepage buy button */
window.BMB_CHECKOUT_ALIASES = Object.freeze({ set: 'bundle' });
