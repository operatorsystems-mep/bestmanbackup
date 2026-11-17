/**
 * Best Man Backup — checkout URLs and kit metadata.
 *
 * Paste a Stripe Payment Link into checkoutUrl for each product.
 * Leave checkoutUrl empty ("") to send buy buttons to /kits/#<id> instead.
 * Never point a buy button at a dead or placeholder URL.
 *
 * Swap test links for live Payment Links in this one file when ready.
 * After payment, each link should redirect to:
 *   https://bestmanbackup.com/thank-you/?kit=<speech|duties|playbook|bundle>&session_id={CHECKOUT_SESSION_ID}
 *
 * Server fulfillment also checks the Stripe price IDs in lib/kits.mjs.
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
      priceId: 'price_1UcuNkRKrA7iXAzoBcZbNaOO',
      description:
        'A speech-writing guide, an editable Word workbook, a final-speech document and six large cue cards, in A4 and US Letter. You bring the stories. Digital download.',
      checkoutUrl: 'https://buy.stripe.com/test_8x214pgMc0iq3wrbaI0Fi0g',
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
      priceId: 'price_1UcuNmRKrA7iXAzo8plO4K7b',
      description:
        'A duties handbook, an editable Word planner and a printable planner with 14 planning sections, plus a wedding-day sheet and four pocket carry cards, in A4 and US Letter. Digital download.',
      checkoutUrl: 'https://buy.stripe.com/test_5kQeVfanOfdkc2XemU0Fi0h',
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
      priceId: 'price_1UcuNoRKrA7iXAzosSZztLsF',
      description:
        'Eight stag do games, a groom quiz, challenge cards and the Stag Awards, editable in Word or printable, in UK and US editions. Digital download.',
      checkoutUrl: 'https://buy.stripe.com/test_5kQ14pgMc6GOc2Xa6E0Fi0i',
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
      priceId: 'price_1UcuNqRKrA7iXAzo9Q853mBX',
      description:
        'The Duties Kit, the Stag & Bachelor Party Kit and the Speech Kit in one download, with one starting point across the role, the stag do and the speech.',
      checkoutUrl: 'https://buy.stripe.com/test_aFa7sN1Ric18gjd4Mk0Fi0j',
      kitsPath: '/kits/#bundle',
      buttonLabel: 'Get the Best Man Bundle',
    }),
  }),
});

/* Alias used on the homepage buy button */
window.BMB_CHECKOUT_ALIASES = Object.freeze({ set: 'bundle' });
