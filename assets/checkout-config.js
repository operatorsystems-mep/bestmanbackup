/**
 * Best Man Backup — checkout URLs and kit metadata (one file).
 *
 * Each product has GBP and USD display prices, plus checkout URL slots
 * for test/live × GBP/USD. assets/checkout.js picks:
 *   - Live host (bestmanbackup.com / www) → live links
 *   - Preview / localhost → test links
 *   - Currency from html[data-currency] (set by middleware + currency.js)
 *
 * USD live Payment Links are empty until Sean creates them (TODO below).
 * On preview, missing USD test links fall back to GBP test links.
 *
 * After payment, each Payment Link must redirect to:
 *   https://bestmanbackup.com/thank-you/?kit=<speech|duties|playbook|bundle>&session_id={CHECKOUT_SESSION_ID}
 *
 * Server fulfillment matches Stripe price IDs by session.livemode
 * (test vs live) in lib/kits.mjs — never mix modes.
 */
window.BMB_CHECKOUT = Object.freeze({
  currencies: Object.freeze({
    GBP: Object.freeze({ code: 'GBP', symbol: '£', locale: 'en-GB' }),
    USD: Object.freeze({ code: 'USD', symbol: '$', locale: 'en-US' }),
  }),
  products: Object.freeze({
    speech: Object.freeze({
      id: 'speech',
      name: 'Best Man Speech Kit',
      shortName: 'Speech Kit',
      priceGbp: '£14.99',
      priceUsd: '$17.99',
      priceValueGbp: 14.99,
      priceValueUsd: 17.99,
      // Legacy aliases (GBP) for older callers
      price: '£14.99',
      currency: 'GBP',
      priceValue: 14.99,
      priceIdTest: 'price_1UcuNkRKrA7iXAzoBcZbNaOO',
      priceIdLive: 'price_1UcuxdRKrA7iXAzo7Bpifs0D',
      // TODO(Sean): create USD Stripe Prices + Payment Links, then fill IDs/URLs
      priceIdTestUsd: '',
      priceIdLiveUsd: '',
      description:
        'A speech-writing guide, an editable Word workbook, a final-speech document and six large cue cards, in A4 and US Letter. You bring the stories. Digital download.',
      checkoutUrlTest: 'https://buy.stripe.com/test_8x214pgMc0iq3wrbaI0Fi0g',
      checkoutUrlLive: 'https://buy.stripe.com/9B67sN9jK1muc2X3Ig0Fi00',
      checkoutUrlTestUsd: '', // TODO(Sean): Stripe TEST Payment Link — Speech Kit USD $17.99
      checkoutUrlLiveUsd: '', // TODO(Sean): Stripe LIVE Payment Link — Speech Kit USD $17.99
      kitsPath: '/kits/#speech',
      buttonLabel: 'Get the Speech Kit',
    }),
    duties: Object.freeze({
      id: 'duties',
      name: 'Best Man Duties Kit',
      shortName: 'Duties Kit',
      priceGbp: '£9.99',
      priceUsd: '$11.99',
      priceValueGbp: 9.99,
      priceValueUsd: 11.99,
      price: '£9.99',
      currency: 'GBP',
      priceValue: 9.99,
      priceIdTest: 'price_1UcuNmRKrA7iXAzo8plO4K7b',
      priceIdLive: 'price_1UcuxsRKrA7iXAzoTZHCJEQo',
      priceIdTestUsd: '',
      priceIdLiveUsd: '',
      description:
        'A duties handbook, an editable Word planner and a printable planner with 14 planning sections, plus a wedding-day sheet and four pocket carry cards, in A4 and US Letter. Digital download.',
      checkoutUrlTest: 'https://buy.stripe.com/test_5kQeVfanOfdkc2XemU0Fi0h',
      checkoutUrlLive: 'https://buy.stripe.com/cNicN7anOe9g1oj92A0Fi01',
      checkoutUrlTestUsd: '', // TODO(Sean): Stripe TEST Payment Link — Duties Kit USD $11.99
      checkoutUrlLiveUsd: '', // TODO(Sean): Stripe LIVE Payment Link — Duties Kit USD $11.99
      kitsPath: '/kits/#duties',
      buttonLabel: 'Get the Duties Kit',
    }),
    playbook: Object.freeze({
      id: 'playbook',
      name: 'Stag Do & Bachelor Party Playbook',
      shortName: 'Playbook',
      priceGbp: '£9.99',
      priceUsd: '$11.99',
      priceValueGbp: 9.99,
      priceValueUsd: 11.99,
      price: '£9.99',
      currency: 'GBP',
      priceValue: 9.99,
      priceIdTest: 'price_1UcuNoRKrA7iXAzosSZztLsF',
      priceIdLive: 'price_1Ucuy1RKrA7iXAzo80f5IBDs',
      priceIdTestUsd: '',
      priceIdLiveUsd: '',
      description:
        'Eight stag do / bachelor party games, a groom quiz, challenge cards and the Stag Awards, editable in Word or printable, in UK and US editions. Digital download.',
      checkoutUrlTest: 'https://buy.stripe.com/test_5kQ14pgMc6GOc2Xa6E0Fi0i',
      checkoutUrlLive: 'https://buy.stripe.com/4gM14p67y9T07MH5Qo0Fi02',
      checkoutUrlTestUsd: '', // TODO(Sean): Stripe TEST Payment Link — Playbook USD $11.99
      checkoutUrlLiveUsd: '', // TODO(Sean): Stripe LIVE Payment Link — Playbook USD $11.99
      kitsPath: '/kits/#playbook',
      buttonLabel: 'Get the Playbook',
    }),
    bundle: Object.freeze({
      id: 'bundle',
      name: 'Best Man Bundle',
      shortName: 'Best Man Bundle',
      priceGbp: '£19.99',
      priceUsd: '$24.99',
      priceValueGbp: 19.99,
      priceValueUsd: 24.99,
      price: '£19.99',
      currency: 'GBP',
      priceValue: 19.99,
      priceIdTest: 'price_1UcuNqRKrA7iXAzo9Q853mBX',
      priceIdLive: 'price_1UcuyBRKrA7iXAzolGfl4aQX',
      priceIdTestUsd: '',
      priceIdLiveUsd: '',
      description:
        'The Duties Kit, the Stag Do & Bachelor Party Playbook and the Speech Kit in one download, with one starting point across the role, the night and the speech.',
      checkoutUrlTest: 'https://buy.stripe.com/test_aFa7sN1Ric18gjd4Mk0Fi0j',
      checkoutUrlLive: 'https://buy.stripe.com/dRmbJ3brSe9g7MHbaI0Fi03',
      checkoutUrlTestUsd: '', // TODO(Sean): Stripe TEST Payment Link — Bundle USD $24.99
      checkoutUrlLiveUsd: '', // TODO(Sean): Stripe LIVE Payment Link — Bundle USD $24.99
      kitsPath: '/kits/#bundle',
      buttonLabel: 'Get the Best Man Bundle',
    }),
  }),
});

/* Alias used on the homepage buy button */
window.BMB_CHECKOUT_ALIASES = Object.freeze({ set: 'bundle' });
