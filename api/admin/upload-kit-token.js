/**
 * Short-lived client token for a private kit ZIP upload.
 *
 * POST /api/admin/upload-kit-token/?name=speech|duties|playbook|bundle
 * Header: x-upload-secret must match KIT_UPLOAD_SECRET (timing-safe).
 *
 * Returns a client token scoped to kits/v2026-11-27/{name}.zip only.
 * The browser or upload script then PUTs the ZIP straight to Blob, so the
 * bytes never pass through this function (the 4.5MB body limit).
 *
 * @vercel/blob 2.9.0 encodes upload constraints in the client token and
 * applies access on the client put. `put` from `@vercel/blob/client` accepts
 * `access: 'private'` and sends `x-vercel-blob-access: private` with that
 * token, including multipart uploads. The read-write token is used only to
 * sign the client token. It is never returned or logged.
 */
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { MAX_UPLOAD_BYTES, secretsMatch } from './upload-kit.js';

export const TOKEN_TTL_MS = 10 * 60 * 1000;

const NAMES = new Set(['speech', 'duties', 'playbook', 'bundle']);

export function kitBlobPath(name) {
  return `kits/v2026-11-27/${name}.zip`;
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(JSON.stringify(payload));
}

export function createHandler({
  generateToken = generateClientTokenFromReadWriteToken,
  now = Date.now,
} = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      send(res, 405, { error: 'method_not_allowed' });
      return;
    }

    const expected = process.env.KIT_UPLOAD_SECRET;
    const provided = req.headers?.['x-upload-secret'];
    if (typeof expected !== 'string' || expected.length === 0 || typeof provided !== 'string' || !secretsMatch(provided, expected)) {
      send(res, 404, { error: 'not_found' });
      return;
    }

    const url = new URL(req.url || '/', 'https://bestmanbackup.com');
    const name = url.searchParams.get('name');
    if (!NAMES.has(name)) {
      send(res, 400, { error: 'bad_name' });
      return;
    }

    const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (typeof readWriteToken !== 'string' || readWriteToken.length === 0) {
      send(res, 503, { error: 'storage_unconfigured' });
      return;
    }

    const pathname = kitBlobPath(name);
    const validUntil = now() + TOKEN_TTL_MS;
    let clientToken;
    try {
      clientToken = await generateToken({
        token: readWriteToken,
        pathname,
        allowedContentTypes: ['application/zip'],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        validUntil,
        allowOverwrite: true,
        addRandomSuffix: false,
      });
    } catch {
      console.error('upload-kit-token failed');
      send(res, 502, { error: 'blob_error' });
      return;
    }

    if (typeof clientToken !== 'string' || !clientToken.startsWith('vercel_blob_client_') || clientToken.includes(readWriteToken)) {
      console.error('upload-kit-token refused an unsafe client token');
      send(res, 502, { error: 'blob_error' });
      return;
    }

    send(res, 200, { pathname, token: clientToken, validUntil });
  };
}

export default createHandler();
