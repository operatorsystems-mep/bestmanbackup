/**
 * Best Man Backup — checkout URLs and kit metadata (one file).
 *
 * Each product has checkoutUrlTest and checkoutUrlLive.
 * assets/checkout.js picks Live only on bestmanbackup.com / www;
 * Preview, localhost and other hosts keep Test links.
 *
 * After payment, each Payment Link must redirect to:
 *   https://bestmanbackup.com/thank-you/?kit=<speech|duties|playbook|bundle>&session_id={CHECKOUT_SESSION_ID}
 *
 * Server fulfillment matches Stripe price IDs by session.livemode
 * (test vs live) in lib/kits.mjs — never mix modes.
 *
 * BMB_PRICE_ID_LIVE is the current live Price ID map in this file. Keep it
 * identical to PRICE_ID_LIVE in lib/kits.mjs. Payment Link URLs stay below.
 */
const BMB_PRICE_ID_LIVE = Object.freeze({
  speech: 'price_1UeLlORKrA7iXAzo7cMXh5od',
  duties: 'price_1UeLm0RKrA7iXAzoIFHfSgyP',
  playbook: 'price_1UeLmURKrA7iXAzo4HNzSZcM',
  bundle: 'price_1UcuyBRKrA7iXAzolGfl4aQX',
});

window.BMB_CHECKOUT = Object.freeze({
  products: Object.freeze({
    speech: Object.freeze({
      id: 'speech',
      name: 'Best Man Speech Kit',
      shortName: 'Speech Kit',
      price: '£14.99',
      currency: 'GBP',
      priceValue: 14.99,
      priceIdTest: 'price_1UcuNkRKrA7iXAzoBcZbNaOO',
      priceIdLive: BMB_PRICE_ID_LIVE.speech,
      description:
        'A speech-writing guide, an editable Word workbook, a final-speech document and six large cue cards, in A4 and US Letter. You bring the stories. Digital download.',
      checkoutUrlTest: 'https://buy.stripe.com/test_8x214pgMc0iq3wrbaI0Fi0g',
      checkoutUrlLive: 'https://buy.stripe.com/8x214p9jK0iqff9diQ0Fi04',
      kitsPath: '/kits/#speech',
      buttonLabel: 'Get the Speech Kit',
    }),
    duties: Object.freeze({
      id: 'duties',
      name: 'Best Man Duties Kit',
      shortName: 'Duties Kit',
      price: '£9.99',
      currency: 'GBP',
      priceValue: 9.99,
      priceIdTest: 'price_1UcuNmRKrA7iXAzo8plO4K7b',
      priceIdLive: BMB_PRICE_ID_LIVE.duties,
      description:
        'A duties handbook, an editable Word planner and a printable planner with 14 planning sections, plus a wedding-day sheet and four pocket carry cards, in A4 and US Letter. Digital download.',
      checkoutUrlTest: 'https://buy.stripe.com/test_5kQeVfanOfdkc2XemU0Fi0h',
      checkoutUrlLive: 'https://buy.stripe.com/6oU3cx2VmaX4d71gv20Fi05',
      kitsPath: '/kits/#duties',
      buttonLabel: 'Get the Duties Kit',
    }),
    playbook: Object.freeze({
      id: 'playbook',
      name: 'Stag Do & Bachelor Party Playbook',
      shortName: 'Playbook',
      price: '£9.99',
      currency: 'GBP',
      priceValue: 9.99,
      priceIdTest: 'price_1UcuNoRKrA7iXAzosSZztLsF',
      priceIdLive: BMB_PRICE_ID_LIVE.playbook,
      description:
        'Eight stag do games, a groom quiz, challenge cards and the Stag Awards, editable in Word or printable, in UK and US editions. Digital download.',
      checkoutUrlTest: 'https://buy.stripe.com/test_5kQ14pgMc6GOc2Xa6E0Fi0i',
      checkoutUrlLive: 'https://buy.stripe.com/5kQ3cxgMce9geb52Ec0Fi06',
      kitsPath: '/kits/#playbook',
      buttonLabel: 'Get the Playbook',
    }),
    bundle: Object.freeze({
      id: 'bundle',
      name: 'The Best Man Set',
      shortName: 'The Best Man Set',
      price: '£19.99',
      currency: 'GBP',
      priceValue: 19.99,
      priceIdTest: 'price_1UcuNqRKrA7iXAzo9Q853mBX',
      priceIdLive: BMB_PRICE_ID_LIVE.bundle,
      description:
        'The Speech Kit, the Duties Kit and the Stag Do & Bachelor Party Playbook in one download. Worth £34.97 separately.',
      checkoutUrlTest: 'https://buy.stripe.com/test_aFa7sN1Ric18gjd4Mk0Fi0j',
      checkoutUrlLive: 'https://buy.stripe.com/dRmbJ3brSe9g7MHbaI0Fi03',
      kitsPath: '/kits/#bundle',
      buttonLabel: 'Get The Best Man Set',
    }),
  }),
});

/* Alias used on the homepage buy button */
window.BMB_CHECKOUT_ALIASES = Object.freeze({ set: 'bundle' });
