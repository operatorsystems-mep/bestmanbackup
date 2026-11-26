import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import { createHandler } from '../../api/admin/verify-kit.js';

const SECRET = 'unit-test-upload-secret';
const READ_WRITE = 'vercel_blob_rw_teststore_unitsecret';

function request({ method = 'GET', url = '/api/admin/verify-kit/?name=speech', headers = {} } = {}) {
  return {
    method,
    url,
    headers: {
      'x-upload-secret': SECRET,
      ...headers,
    },
  };
}

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(payload) {
      this.body = payload || '';
    },
  };
}

async function call(handler, req) {
  const res = response();
  await handler(req, res);
  return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null, headers: res.headers, raw: res.body };
}

function withSecret(fn) {
  const previousSecret = process.env.KIT_UPLOAD_SECRET;
  const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
  process.env.KIT_UPLOAD_SECRET = SECRET;
  process.env.BLOB_READ_WRITE_TOKEN = READ_WRITE;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (previousSecret === undefined) delete process.env.KIT_UPLOAD_SECRET;
      else process.env.KIT_UPLOAD_SECRET = previousSecret;
      if (previousToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
      else process.env.BLOB_READ_WRITE_TOKEN = previousToken;
    });
}

describe('kit verify route', () => {
  it('returns 404 when the secret is missing or wrong and does not read the blob', async () => {
    let called = false;
    const handler = createHandler({
      getBlob: async () => {
        called = true;
        return null;
      },
    });
    const previous = process.env.KIT_UPLOAD_SECRET;
    delete process.env.KIT_UPLOAD_SECRET;
    try {
      const missing = await call(handler, request());
      assert.equal(missing.status, 404);
      process.env.KIT_UPLOAD_SECRET = SECRET;
      const wrong = await call(handler, request({ headers: { 'x-upload-secret': 'wrong' } }));
      assert.equal(wrong.status, 404);
      assert.equal(wrong.json.error, 'not_found');
      const absent = await call(handler, request({ headers: { 'x-upload-secret': undefined } }));
      assert.equal(absent.status, 404);
      assert.equal(called, false);
    } finally {
      if (previous === undefined) delete process.env.KIT_UPLOAD_SECRET;
      else process.env.KIT_UPLOAD_SECRET = previous;
    }
  });

  it('returns 400 for a bad name', async () => {
    let called = false;
    const handler = createHandler({
      getBlob: async () => {
        called = true;
        return null;
      },
    });
    await withSecret(async () => {
      const result = await call(handler, request({ url: '/api/admin/verify-kit/?name=nope' }));
      assert.equal(result.status, 400);
      assert.equal(result.json.error, 'bad_name');
    });
    assert.equal(called, false);
  });

  it('returns 405 for the wrong method', async () => {
    let called = false;
    const handler = createHandler({
      getBlob: async () => {
        called = true;
        return null;
      },
    });
    const result = await call(handler, request({ method: 'POST' }));
    assert.equal(result.status, 405);
    assert.equal(result.json.error, 'method_not_allowed');
    assert.equal(result.headers.allow, 'GET');
    assert.equal(called, false);
  });

  it('streams the private blob and returns pathname, size and md5', async () => {
    const bytes = Buffer.from('PK\x03\x04UNIQUE_ZIP_BYTES_NOT_IN_JSON');
    const calls = [];
    const handler = createHandler({
      getBlob: async (pathname, options) => {
        calls.push({ pathname, options });
        return {
          stream: Readable.toWeb(Readable.from([bytes])),
          blob: { pathname, url: 'https://example.private.blob.vercel-storage.com/secret' },
        };
      },
    });
    await withSecret(async () => {
      const result = await call(handler, request({ url: '/api/admin/verify-kit/?name=playbook' }));
      assert.equal(result.status, 200);
      assert.deepEqual(result.json, {
        pathname: 'kits/v2026-11-27/playbook.zip',
        size: bytes.length,
        md5: createHash('md5').update(bytes).digest('hex'),
      });
      assert.equal(result.raw.includes('UNIQUE_ZIP_BYTES_NOT_IN_JSON'), false);
      assert.equal(result.raw.includes(READ_WRITE), false);
      assert.equal(result.raw.includes('example.private'), false);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].pathname, 'kits/v2026-11-27/playbook.zip');
      assert.equal(calls[0].options.access, 'private');
      assert.equal(calls[0].options.token, READ_WRITE);
      assert.equal(calls[0].options.useCache, false);
    });
  });

  it('does not echo a storage failure', async () => {
    const handler = createHandler({
      getBlob: async () => {
        throw new Error(`token ${READ_WRITE} rejected`);
      },
    });
    await withSecret(async () => {
      const result = await call(handler, request({ url: '/api/admin/verify-kit/?name=duties' }));
      assert.equal(result.status, 502);
      assert.equal(result.json.error, 'blob_error');
      assert.equal(result.raw.includes(READ_WRITE), false);
    });
  });
});
