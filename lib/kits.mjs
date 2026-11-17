/**
 * Shared kit metadata for checkout config (browser) and fulfillment (server).
 * Stripe price IDs are test-mode references for session validation.
 */
export const KITS = Object.freeze({
  speech: Object.freeze({
    id: 'speech',
    name: 'Best Man Speech Kit',
    priceValue: 6.98,
    currency: 'gbp',
    priceId: 'price_1UcuNkRKrA7iXAzoBcZbNaOO',
    file: 'speech.zip',
    downloadName: 'Best-Man-Speech-Kit.zip',
  }),
  duties: Object.freeze({
    id: 'duties',
    name: 'Best Man Duties Kit',
    priceValue: 5.99,
    currency: 'gbp',
    priceId: 'price_1UcuNmRKrA7iXAzo8plO4K7b',
    file: 'duties.zip',
    downloadName: 'Best-Man-Duties-Kit.zip',
  }),
  playbook: Object.freeze({
    id: 'playbook',
    name: 'Stag Do & Bachelor Party Playbook',
    priceValue: 11.99,
    currency: 'gbp',
    priceId: 'price_1UcuNoRKrA7iXAzosSZztLsF',
    file: 'playbook.zip',
    downloadName: 'Stag-Do-Bachelor-Party-Playbook.zip',
  }),
  bundle: Object.freeze({
    id: 'bundle',
    name: 'Best Man Bundle',
    priceValue: 19.99,
    currency: 'gbp',
    priceId: 'price_1UcuNqRKrA7iXAzo9Q853mBX',
    file: 'bundle.zip',
    downloadName: 'Best-Man-Bundle.zip',
    includes: Object.freeze(['speech', 'duties', 'playbook']),
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
