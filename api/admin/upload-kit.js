/**
 * Temporary admin upload for paid kit ZIPs.
 *
 * POST /api/admin/upload-kit/?name=speech|duties|playbook|bundle
 * Header: x-upload-secret must match KIT_UPLOAD_SECRET (timing-safe).
 * Body: raw application/zip, streamed, capped at 60MB.
 *
 * Writes a private blob at kits/v2026-11-27/{name}.zip in the store
 * selected by BLOB_READ_WRITE_TOKEN (bmb-paid-products). Does not log
 * the secret or the token. Does not change fulfilment paths.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { put } from '@vercel/blob';

export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;

const NAMES = new Set(['speech', 'duties', 'playbook', 'bundle']);

/**
 * The Node.js function receives the raw request stream. This stops any
 * framework body parser from buffering or rejecting the zip first.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

export function secretsMatch(provided, expected) {
  const a = createHash('sha256').update(String(provided), 'utf8').digest();
  const b = createHash('sha256').update(String(expected), 'utf8').digest();
  return timingSafeEqual(a, b);
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(JSON.stringify(payload));
}

function headerValue(headers, name) {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()];
  return typeof value === 'string' ? value : '';
}

async function readCapped(req, maxBytes) {
  const declared = Number(headerValue(req.headers, 'content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { error: 'too_large' };
  }

  const hash = createHash('md5');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > maxBytes) {
      return { error: 'too_large' };
    }
    hash.update(buf);
    chunks.push(buf);
  }
  if (size === 0) return { error: 'empty_body' };
  return { body: Buffer.concat(chunks, size), size, md5: hash.digest('hex') };
}

export function createHandler({ putBlob = put, maxBytes = MAX_UPLOAD_BYTES } = {}) {
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

    const contentType = headerValue(req.headers, 'content-type').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/zip') {
      send(res, 415, { error: 'unsupported_media_type' });
      return;
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (typeof token !== 'string' || token.length === 0) {
      send(res, 503, { error: 'storage_unconfigured' });
      return;
    }

    let uploaded;
    try {
      uploaded = await readCapped(req, maxBytes);
    } catch {
      console.error('upload-kit body failed');
      send(res, 400, { error: 'bad_body' });
      return;
    }
    if (uploaded.error) {
      send(res, uploaded.error === 'too_large' ? 413 : 400, { error: uploaded.error });
      return;
    }

    const pathname = `kits/v2026-11-27/${name}.zip`;
    try {
      const blob = await putBlob(pathname, uploaded.body, {
        access: 'private',
        token,
        contentType: 'application/zip',
        addRandomSuffix: false,
        allowOverwrite: true,
        multipart: uploaded.size >= 5 * 1024 * 1024,
      });
      send(res, 200, {
        pathname: blob.pathname,
        size: uploaded.size,
        md5: uploaded.md5,
      });
    } catch {
      console.error('upload-kit storage failed');
      send(res, 502, { error: 'blob_error' });
    }
  };
}

export default createHandler();
