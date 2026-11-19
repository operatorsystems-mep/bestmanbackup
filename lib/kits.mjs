/**
 * Shared kit metadata for checkout config (browser) and fulfillment (server).
 *
 * priceIdTest / priceIdLive must never be mixed: fulfillment picks by
 * Stripe Checkout Session `livemode`.
 *
 * Paid ZIPs live in a PRIVATE Vercel Blob store (never in this public git repo).
 *
 * PRICE_ID_LIVE is the only place live Stripe Price IDs are set. When the new
 * live prices exist, replace the string on that product's line and keep
 * assets/checkout-config.js BMB_PRICE_ID_LIVE identical. Payment Link URLs
 * are not stored here. priceValue is what fulfillment expects in amount_total.
 */
export const PRICE_ID_LIVE = Object.freeze({
  speech: 'price_1UcuxdRKrA7iXAzo7Bpifs0D',
  duties: 'price_1UcuxsRKrA7iXAzoTZHCJEQo',
  playbook: 'price_1Ucuy1RKrA7iXAzo80f5IBDs',
  bundle: 'price_1UcuyBRKrA7iXAzolGfl4aQX',
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

/** Expected Stripe price ID for a kit given session.livemode. */
export function priceIdForSession(kit, session) {
  if (!kit) return null;
  return session?.livemode === true ? kit.priceIdLive : kit.priceIdTest;
}
