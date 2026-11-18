/**
 * Shared kit metadata for checkout config (browser) and fulfillment (server).
 *
 * priceIdTest / priceIdLive must never be mixed: fulfillment picks by
 * Stripe Checkout Session `livemode`.
 *
 * Speech Kit: new GBP + USD catalogue (£14.99 / $17.99). Stripe Price IDs and
 * Payment Links are placeholders until Sean pastes the real values.
 *
 * Other kits keep the live catalogue (Duties £5.99, Playbook £11.99, Bundle £19.99).
 *
 * Paid ZIPs live in a PRIVATE Vercel Blob store (never in this public git repo).
 */
export const KITS = Object.freeze({
  speech: Object.freeze({
    id: 'speech',
    name: 'Best Man Speech Kit',
    priceValue: 14.99,
    priceValueGbp: 14.99,
    priceValueUsd: 17.99,
    currency: 'gbp',
    // TODO(Sean): replace with real Stripe Price IDs for Speech Kit live launch
    priceIdTest: 'price_TODO_SPEECH_TEST_GBP',
    priceIdLive: 'price_TODO_SPEECH_LIVE_GBP',
    priceIdTestUsd: 'price_TODO_SPEECH_TEST_USD',
    priceIdLiveUsd: 'price_TODO_SPEECH_LIVE_USD',
    blobPath: 'kits/speech.zip',
    downloadName: 'Best-Man-Speech-Kit.zip',
    sources: Object.freeze(['Best_Man_Speech_Kit_Customer_Download_vC1.zip']),
  }),
  duties: Object.freeze({
    id: 'duties',
    name: 'Best Man Duties Kit',
    priceValue: 5.99,
    priceValueGbp: 5.99,
    currency: 'gbp',
    priceIdTest: 'price_1UcuNmRKrA7iXAzo8plO4K7b',
    priceIdLive: 'price_1UcuxsRKrA7iXAzoTZHCJEQo',
    priceIdTestUsd: '',
    priceIdLiveUsd: '',
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
    priceValue: 11.99,
    priceValueGbp: 11.99,
    currency: 'gbp',
    priceIdTest: 'price_1UcuNoRKrA7iXAzosSZztLsF',
    priceIdLive: 'price_1Ucuy1RKrA7iXAzo80f5IBDs',
    priceIdTestUsd: '',
    priceIdLiveUsd: '',
    blobPath: 'kits/playbook.zip',
    downloadName: 'Stag-Do-Bachelor-Party-Playbook.zip',
    sources: Object.freeze(['BMB_Stag_Do_Playbook_v0.4.2.zip']),
  }),
  bundle: Object.freeze({
    id: 'bundle',
    name: 'Best Man Bundle',
    priceValue: 19.99,
    priceValueGbp: 19.99,
    currency: 'gbp',
    priceIdTest: 'price_1UcuNqRKrA7iXAzo9Q853mBX',
    priceIdLive: 'price_1UcuyBRKrA7iXAzolGfl4aQX',
    priceIdTestUsd: '',
    priceIdLiveUsd: '',
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

/** Former Speech Kit Stripe Price IDs — must not fulfill after the live price change. */
export const LEGACY_SPEECH_PRICE_IDS = Object.freeze([
  'price_1UcuNkRKrA7iXAzoBcZbNaOO',
  'price_1UcuxdRKrA7iXAzo7Bpifs0D',
]);

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

/** Expected Stripe price ID for a kit given session.livemode (GBP catalogue). */
export function priceIdForSession(kit, session) {
  if (!kit) return null;
  return session?.livemode === true ? kit.priceIdLive : kit.priceIdTest;
}

/** Optional USD Stripe price ID for a kit given session.livemode. */
export function priceIdUsdForSession(kit, session) {
  if (!kit) return null;
  const id = session?.livemode === true ? kit.priceIdLiveUsd : kit.priceIdTestUsd;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

/**
 * Accepted price IDs for a kit/session (GBP always; USD when configured).
 * @returns {{ id: string, currency: 'gbp' | 'usd', amountMinor: number }[]}
 */
export function acceptedPricesForSession(kit, session) {
  if (!kit) return [];
  const out = [];
  const gbpId = priceIdForSession(kit, session);
  const gbpAmount = Math.round((kit.priceValueGbp ?? kit.priceValue) * 100);
  if (gbpId) out.push({ id: gbpId, currency: 'gbp', amountMinor: gbpAmount });
  const usdId = priceIdUsdForSession(kit, session);
  if (usdId) {
    const usdAmount = Math.round((kit.priceValueUsd ?? kit.priceValue) * 100);
    out.push({ id: usdId, currency: 'usd', amountMinor: usdAmount });
  }
  return out;
}
