/**
 * Confirm a private kit ZIP after a client upload.
 *
 * GET /api/admin/verify-kit/?name=speech|duties|playbook|bundle
 * Header: x-upload-secret must match KIT_UPLOAD_SECRET (timing-safe).
 *
 * Reads the v2.1 private object for that name (the buyer filename under
 * kits/v2-2026-11-27/), hashes the body while streaming, and returns
 * {pathname, size, md5}. The bytes and the read-write token are never
 * returned or logged.
 */
import { createHash } from 'node:crypto';
import { get } from '@vercel/blob';
import { MAX_UPLOAD_BYTES, kitBlobPath, secretsMatch } from './upload-kit-token.js';

const NAMES = new Set(['speech', 'duties', 'playbook', 'bundle']);

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(JSON.stringify(payload));
}

async function digestStream(stream, maxBytes) {
  const hash = createHash('md5');
  let size = 0;
  const iterator = stream[Symbol.asyncIterator]();
  try {
    while (true) {
      const { done, value } = await iterator.next();
      if (done) break;
      const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
      size += buf.length;
      if (size > maxBytes) return { error: 'too_large' };
      hash.update(buf);
    }
  } finally {
    if (typeof iterator.return === 'function') await iterator.return();
  }
  return { size, md5: hash.digest('hex') };
}

export function createHandler({ getBlob = get, maxBytes = MAX_UPLOAD_BYTES } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
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

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (typeof token !== 'string' || token.length === 0) {
      send(res, 503, { error: 'storage_unconfigured' });
      return;
    }

    const pathname = kitBlobPath(name);
    let result;
    try {
      result = await getBlob(pathname, { access: 'private', token, useCache: false });
    } catch {
      console.error('verify-kit storage failed');
      send(res, 502, { error: 'blob_error' });
      return;
    }
    if (!result?.stream) {
      send(res, 404, { error: 'missing_blob' });
      return;
    }

    let digested;
    try {
      digested = await digestStream(result.stream, maxBytes);
    } catch {
      console.error('verify-kit read failed');
      send(res, 502, { error: 'blob_error' });
      return;
    }
    if (digested.error) {
      send(res, 413, { error: digested.error });
      return;
    }

    const body = {
      pathname: typeof result.blob?.pathname === 'string' ? result.blob.pathname : pathname,
      size: digested.size,
      md5: digested.md5,
    };
    if (JSON.stringify(body).includes(token)) {
      console.error('verify-kit refused to return the read-write token');
      send(res, 502, { error: 'blob_error' });
      return;
    }
    send(res, 200, body);
  };
}

export default createHandler();
