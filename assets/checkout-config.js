/**
 * Best Man Backup — checkout URLs and kit metadata (one file).
 *
 * Speech Kit: new £14.99 / $17.99 catalogue. Stripe Price IDs and Payment Links
 * below are clearly named PLACEHOLDERS — Sean will paste the real values.
 *
 * Other kits: unchanged live GBP catalogue and checkout links.
 *
 * assets/checkout.js picks Live only on bestmanbackup.com / www;
 * Preview, localhost and other hosts keep Test links. Currency from
 * html[data-currency] selects GBP vs USD Payment Links when present.
 *
 * After payment, each Payment Link must redirect to:
 *   https://bestmanbackup.com/thank-you/?kit=<speech|duties|playbook|bundle>&session_id={CHECKOUT_SESSION_ID}
 */
window.BMB_CHECKOUT = Object.freeze({
  products: Object.freeze({
    speech: Object.freeze({
      id: 'speech',
      name: 'Best Man Speech Kit',
      shortName: 'Speech Kit',
      priceGbp: '£14.99',
      priceUsd: '$17.99',
      price: '£14.99',
      currency: 'GBP',
      priceValue: 14.99,
      priceValueGbp: 14.99,
      priceValueUsd: 17.99,
      // TODO(Sean): replace PLACEHOLDER Stripe Price IDs
      priceIdTest: 'price_TODO_SPEECH_TEST_GBP',
      priceIdLive: 'price_TODO_SPEECH_LIVE_GBP',
      priceIdTestUsd: 'price_TODO_SPEECH_TEST_USD',
      priceIdLiveUsd: 'price_TODO_SPEECH_LIVE_USD',
      description:
        'A speech-writing guide, an editable Word workbook, a final-speech document and six large cue cards, in A4 and US Letter. You bring the stories. Digital download.',
      // TODO(Sean): replace PLACEHOLDER Payment Links
      checkoutUrlTest: 'https://buy.stripe.com/test_TODO_SPEECH_GBP',
      checkoutUrlLive: 'https://buy.stripe.com/TODO_SPEECH_LIVE_GBP',
      checkoutUrlTestUsd: 'https://buy.stripe.com/test_TODO_SPEECH_USD',
      checkoutUrlLiveUsd: 'https://buy.stripe.com/TODO_SPEECH_LIVE_USD',
      kitsPath: '/kits/#speech',
      buttonLabel: 'Get the Speech Kit',
    }),
    duties: Object.freeze({
      id: 'duties',
      name: 'Best Man Duties Kit',
      shortName: 'Duties Kit',
      priceGbp: '£5.99',
      price: '£5.99',
      currency: 'GBP',
      priceValue: 5.99,
      priceIdTest: 'price_1UcuNmRKrA7iXAzo8plO4K7b',
      priceIdLive: 'price_1UcuxsRKrA7iXAzoTZHCJEQo',
      description:
        'A duties handbook, an editable Word planner and a printable planner with 14 planning sections, plus a wedding-day sheet and four pocket carry cards, in A4 and US Letter. Digital download.',
      checkoutUrlTest: 'https://buy.stripe.com/test_5kQeVfanOfdkc2XemU0Fi0h',
      checkoutUrlLive: 'https://buy.stripe.com/cNicN7anOe9g1oj92A0Fi01',
      checkoutUrlTestUsd: '',
      checkoutUrlLiveUsd: '',
      kitsPath: '/kits/#duties',
      buttonLabel: 'Get the Duties Kit',
    }),
    playbook: Object.freeze({
      id: 'playbook',
      name: 'Stag Do & Bachelor Party Playbook',
      shortName: 'Playbook',
      priceGbp: '£11.99',
      price: '£11.99',
      currency: 'GBP',
      priceValue: 11.99,
      priceIdTest: 'price_1UcuNoRKrA7iXAzosSZztLsF',
      priceIdLive: 'price_1Ucuy1RKrA7iXAzo80f5IBDs',
      description:
        'Eight stag do games, a groom quiz, challenge cards and the Stag Awards, editable in Word or printable, in UK and US editions. Digital download.',
      checkoutUrlTest: 'https://buy.stripe.com/test_5kQ14pgMc6GOc2Xa6E0Fi0i',
      checkoutUrlLive: 'https://buy.stripe.com/4gM14p67y9T07MH5Qo0Fi02',
      checkoutUrlTestUsd: '',
      checkoutUrlLiveUsd: '',
      kitsPath: '/kits/#playbook',
      buttonLabel: 'Get the Playbook',
    }),
    bundle: Object.freeze({
      id: 'bundle',
      name: 'Best Man Bundle',
      shortName: 'Best Man Bundle',
      priceGbp: '£19.99',
      price: '£19.99',
      currency: 'GBP',
      priceValue: 19.99,
      priceIdTest: 'price_1UcuNqRKrA7iXAzo9Q853mBX',
      priceIdLive: 'price_1UcuyBRKrA7iXAzolGfl4aQX',
      description:
        'The Duties Kit, the Stag & Bachelor Party Kit and the Speech Kit in one download, with one starting point across the role, the stag do and the speech.',
      checkoutUrlTest: 'https://buy.stripe.com/test_aFa7sN1Ric18gjd4Mk0Fi0j',
      checkoutUrlLive: 'https://buy.stripe.com/dRmbJ3brSe9g7MHbaI0Fi03',
      checkoutUrlTestUsd: '',
      checkoutUrlLiveUsd: '',
      kitsPath: '/kits/#bundle',
      buttonLabel: 'Get the Best Man Bundle',
    }),
  }),
});

/* Alias used on the homepage buy button */
window.BMB_CHECKOUT_ALIASES = Object.freeze({ set: 'bundle' });
