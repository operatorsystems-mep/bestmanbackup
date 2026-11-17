/**
 * Shared kit metadata for checkout config (browser) and fulfillment (server).
 * Stripe price IDs are test-mode references for session validation.
 *
 * Paid ZIPs live in a PRIVATE Vercel Blob store (never in this public git repo).
 * Pathnames below are Blob object keys under that store.
 */
export const KITS = Object.freeze({
  speech: Object.freeze({
    id: 'speech',
    name: 'Best Man Speech Kit',
    priceValue: 6.98,
    currency: 'gbp',
    priceId: 'price_1UcuNkRKrA7iXAzoBcZbNaOO',
    blobPath: 'kits/speech.zip',
    downloadName: 'Best-Man-Speech-Kit.zip',
    sources: Object.freeze(['Best_Man_Speech_Kit_Customer_Download_vC1.zip']),
  }),
  duties: Object.freeze({
    id: 'duties',
    name: 'Best Man Duties Kit',
    priceValue: 5.99,
    currency: 'gbp',
    priceId: 'price_1UcuNmRKrA7iXAzo8plO4K7b',
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
    currency: 'gbp',
    priceId: 'price_1UcuNoRKrA7iXAzosSZztLsF',
    blobPath: 'kits/playbook.zip',
    downloadName: 'Stag-Do-Bachelor-Party-Playbook.zip',
    sources: Object.freeze(['BMB_Stag_Do_Playbook_v0.4.2.zip']),
  }),
  bundle: Object.freeze({
    id: 'bundle',
    name: 'Best Man Bundle',
    priceValue: 19.99,
    currency: 'gbp',
    priceId: 'price_1UcuNqRKrA7iXAzo9Q853mBX',
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
