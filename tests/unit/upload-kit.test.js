import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import { createHandler, MAX_UPLOAD_BYTES, secretsMatch } from '../../api/admin/upload-kit.js';

const SECRET = 'unit-test-upload-secret';

function request({
  method = 'POST',
  url = '/api/admin/upload-kit/?name=speech',
  headers = {},
  body = Buffer.from('PK\x03\x04unit'),
} = {}) {
  const req = Readable.from(body ? [body] : []);
  req.method = method;
  req.url = url;
  req.headers = {
    'content-type': 'application/zip',
    'x-upload-secret': SECRET,
    ...headers,
  };
  return req;
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
  return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null, headers: res.headers };
}

describe('kit upload route', () => {
  it('caps the streamed body at 60MB', () => {
    assert.equal(MAX_UPLOAD_BYTES, 60 * 1024 * 1024);
  });

  it('compares secrets without throwing on different lengths', () => {
    assert.equal(secretsMatch(SECRET, SECRET), true);
    assert.equal(secretsMatch('nope', SECRET), false);
    assert.equal(secretsMatch('x', SECRET), false);
  });

  it('returns 404 when the secret is unset or wrong, and does not store anything', async () => {
    const calls = [];
    const handler = createHandler({ putBlob: async (...args) => calls.push(args) });
    const previous = process.env.KIT_UPLOAD_SECRET;
    delete process.env.KIT_UPLOAD_SECRET;
    try {
      const missing = await call(handler, request());
      assert.equal(missing.status, 404);
      process.env.KIT_UPLOAD_SECRET = SECRET;
      const wrong = await call(handler, request({ headers: { 'x-upload-secret': 'wrong' } }));
      assert.equal(wrong.status, 404);
      const absent = await call(handler, request({ headers: { 'x-upload-secret': undefined } }));
      assert.equal(absent.status, 404);
    } finally {
      if (previous === undefined) delete process.env.KIT_UPLOAD_SECRET;
      else process.env.KIT_UPLOAD_SECRET = previous;
    }
    assert.deepEqual(calls, []);
  });

  it('accepts only POST of a named zip and returns pathname, size and md5', async () => {
    process.env.KIT_UPLOAD_SECRET = SECRET;
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token-for-unit-test';
    const body = Buffer.from('PK\x03\x04speech-bytes');
    const calls = [];
    const handler = createHandler({
      putBlob: async (pathname, payload, options) => {
        calls.push({ pathname, payload, options });
        return { pathname };
      },
    });

    const method = await call(handler, request({ method: 'GET' }));
    assert.equal(method.status, 405);

    const name = await call(handler, request({ url: '/api/admin/upload-kit/?name=../secret' }));
    assert.equal(name.status, 400);

    const type = await call(handler, request({ headers: { 'content-type': 'text/plain' } }));
    assert.equal(type.status, 415);

    const ok = await call(handler, request({ body }));
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.json, {
      pathname: 'kits/v2026-11-27/speech.zip',
      size: body.length,
      md5: createHash('md5').update(body).digest('hex'),
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].pathname, 'kits/v2026-11-27/speech.zip');
    assert.equal(calls[0].options.access, 'private');
    assert.equal(calls[0].options.addRandomSuffix, false);
    assert.equal(calls[0].options.allowOverwrite, true);
    assert.equal(calls[0].options.contentType, 'application/zip');
    assert.equal(calls[0].options.token, 'blob-token-for-unit-test');
    assert.equal(calls[0].options.multipart, false);
    assert.ok(calls[0].payload.equals(body));
  });

  it('rejects a body over the cap before storing it', async () => {
    process.env.KIT_UPLOAD_SECRET = SECRET;
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token-for-unit-test';
    let stored = false;
    const handler = createHandler({
      maxBytes: 8,
      putBlob: async () => {
        stored = true;
        return { pathname: 'unused' };
      },
    });
    const result = await call(handler, request({ body: Buffer.from('0123456789') }));
    assert.equal(result.status, 413);
    assert.equal(stored, false);
  });

  it('does not echo a storage failure', async () => {
    process.env.KIT_UPLOAD_SECRET = SECRET;
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token-for-unit-test';
    const handler = createHandler({
      putBlob: async () => {
        throw new Error('token blob-token-for-unit-test rejected');
      },
    });
    const result = await call(handler, request());
    assert.equal(result.status, 502);
    assert.equal(result.json.error, 'blob_error');
    assert.equal(JSON.stringify(result.json).includes('blob-token-for-unit-test'), false);
  });
});
