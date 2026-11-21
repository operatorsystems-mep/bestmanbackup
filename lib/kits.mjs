/**
 * Shared kit metadata for checkout config (browser) and fulfillment (server).
 *
 * priceIdTest / priceIdLive must never be mixed: fulfillment picks by
 * Stripe Checkout Session `livemode`.
 *
 * Paid ZIPs live in a PRIVATE Vercel Blob store (never in this public git repo).
 *
 * PRICE_ID_LIVE is the current live Stripe Price ID for each kit. Keep it
 * identical to BMB_PRICE_ID_LIVE in assets/checkout-config.js. Payment Link
 * URLs are not stored here.
 *
 * PRICE_ID_LIVE_PREVIOUS lists live Price IDs from the previous Payment Links.
 * Fulfilment still accepts those IDs, at the amount those links charged, so a
 * checkout started before the price change can download. priceValue is the
 * amount the current live price must charge.
 */
export const PRICE_ID_LIVE = Object.freeze({
  speech: 'price_1UeLlORKrA7iXAzo7cMXh5od',
  duties: 'price_1UeLm0RKrA7iXAzoIFHfSgyP',
  playbook: 'price_1UeLmURKrA7iXAzo4HNzSZcM',
  bundle: 'price_1UcuyBRKrA7iXAzolGfl4aQX',
});

export const PRICE_ID_LIVE_PREVIOUS = Object.freeze({
  speech: Object.freeze([
    Object.freeze({ id: 'price_1UcuxdRKrA7iXAzo7Bpifs0D', amount: 698 }),
  ]),
  duties: Object.freeze([
    Object.freeze({ id: 'price_1UcuxsRKrA7iXAzoTZHCJEQo', amount: 599 }),
  ]),
  playbook: Object.freeze([
    Object.freeze({ id: 'price_1Ucuy1RKrA7iXAzo80f5IBDs', amount: 1199 }),
  ]),
});

export const KITS = Object.freeze({
  speech: Object.freeze({
    id: 'speech',
    name: 'Best Man Speech Kit',
    priceValue: 14.99,
    currency: 'gbp',
    priceIdTest: 'price_1UcuNkRKrA7iXAzoBcZbNaOO',
    priceIdLive: PRICE_ID_LIVE.speech,
    blobPath: 'kits/speech.zip',
    downloadName: 'Best-Man-Speech-Kit.zip',
    sources: Object.freeze(['Best_Man_Speech_Kit_Customer_Download_vC1.zip']),
  }),
  duties: Object.freeze({
    id: 'duties',
    name: 'Best Man Duties Kit',
    priceValue: 9.99,
    currency: 'gbp',
    priceIdTest: 'price_1UcuNmRKrA7iXAzo8plO4K7b',
    priceIdLive: PRICE_ID_LIVE.duties,
    blobPath: 'kits/duties.zip',
    downloadName: 'Best-Man-Duties-Kit.zip',
    sources: Object.freeze([
      'Best_Man_Duties_Kit_A4.zip',
      'Best_Man_Duties_Kit_US_Letter.zip',
      'Best_Man_Duties_Kit_Editable_Files.zip',
    ]),
  }),
  playbook: Object.freeze({
    id: 'playbook',
    name: 'Stag Do & Bachelor Party Playbook',
    priceValue: 9.99,
    currency: 'gbp',
    priceIdTest: 'price_1UcuNoRKrA7iXAzosSZztLsF',
    priceIdLive: PRICE_ID_LIVE.playbook,
    blobPath: 'kits/playbook.zip',
    downloadName: 'Stag-Do-Bachelor-Party-Playbook.zip',
    sources: Object.freeze(['BMB_Stag_Do_Playbook_v0.4.2.zip']),
  }),
  bundle: Object.freeze({
    id: 'bundle',
    name: 'Best Man Bundle',
    priceValue: 19.99,
    currency: 'gbp',
    priceIdTest: 'price_1UcuNqRKrA7iXAzo9Q853mBX',
    priceIdLive: PRICE_ID_LIVE.bundle,
    blobPath: 'kits/bundle.zip',
    downloadName: 'Best-Man-Bundle.zip',
    includes: Object.freeze(['speech', 'duties', 'playbook']),
    sources: Object.freeze([
      'Best_Man_Speech_Kit_Customer_Download_vC1.zip',
      'Best_Man_Duties_Kit_A4.zip',
      'Best_Man_Duties_Kit_US_Letter.zip',
      'Best_Man_Duties_Kit_Editable_Files.zip',
      'BMB_Stag_Do_Playbook_v0.4.2.zip',
    ]),
  }),
});

export function normalizeKitId(raw) {
  if (!raw) return null;
  const id = String(raw).trim().toLowerCase();
  if (id === 'set') return 'bundle';
  return KITS[id] ? id : null;
}

export function getKit(raw) {
  const id = normalizeKitId(raw);
  return id ? KITS[id] : null;
}

/** Current Stripe price ID for a kit given session.livemode. */
export function priceIdForSession(kit, session) {
  if (!kit) return null;
  return session?.livemode === true ? kit.priceIdLive : kit.priceIdTest;
}

/** Price IDs fulfilment will accept for this session mode. */
export function priceIdsForSession(kit, session) {
  if (!kit) return [];
  if (session?.livemode === true) {
    const previous = PRICE_ID_LIVE_PREVIOUS[kit.id] || [];
    return [kit.priceIdLive, ...previous.map((entry) => entry.id)];
  }
  return kit.priceIdTest ? [kit.priceIdTest] : [];
}

/** Minor-unit amount that price ID must have charged. */
export function expectedAmountForPrice(kit, priceId) {
  const previous = (PRICE_ID_LIVE_PREVIOUS[kit.id] || []).find((entry) => entry.id === priceId);
  if (previous) return previous.amount;
  return Math.round(kit.priceValue * 100);
}
