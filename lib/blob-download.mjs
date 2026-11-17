/**
 * Short-lived signed GET URLs for private Vercel Blob kit ZIPs.
 * Requires BLOB_READ_WRITE_TOKEN (or Vercel OIDC on the deployment).
 */
import { issueSignedToken, presignUrl } from '@vercel/blob';
import { getKit } from './kits.mjs';

const SIGNED_TTL_MS = 15 * 60 * 1000;

export function blobTokenConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * @param {string} kitId
 * @param {{ ttlMs?: number, now?: number, token?: string }} [opts]
 * @returns {Promise<{ ok: true, url: string, expiresAt: number, downloadName: string } | { ok: false, code: string, message: string }>}
 */
export async function createKitDownloadUrl(kitId, opts = {}) {
  const kit = getKit(kitId);
  if (!kit) {
    return { ok: false, code: 'unknown_kit', message: 'Unknown kit.' };
  }

  const token = opts.token || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return {
      ok: false,
      code: 'misconfigured',
      message: 'Download storage is not configured on this server yet.',
    };
  }

  const now = opts.now || Date.now();
  const ttlMs = opts.ttlMs || SIGNED_TTL_MS;
  const validUntil = now + ttlMs;

  try {
    const material = await issueSignedToken({
      pathname: kit.blobPath,
      operations: ['get'],
      validUntil,
      token,
    });
    const { presignedUrl } = await presignUrl(material, {
      operation: 'get',
      pathname: kit.blobPath,
      access: 'private',
      validUntil,
    });
    return {
      ok: true,
      url: presignedUrl,
      expiresAt: validUntil,
      downloadName: kit.downloadName,
      blobPath: kit.blobPath,
    };
  } catch (err) {
    console.error('blob signed URL error', err);
    return {
      ok: false,
      code: 'blob_error',
      message: 'Could not prepare your download link.',
    };
  }
}

export { SIGNED_TTL_MS };
