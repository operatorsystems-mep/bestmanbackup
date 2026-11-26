import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import { getPayloadFromClientToken } from '@vercel/blob/client';
import { createHandler as createTokenHandler, KIT_BLOB_PATHS, MAX_UPLOAD_BYTES, TOKEN_TTL_MS } from '../../api/admin/upload-kit-token.js';
import { createHandler as createVerifyHandler } from '../../api/admin/verify-kit.js';

const SECRET = 'unit-test-upload-secret';
const READ_WRITE = 'vercel_blob_rw_teststore_unitsecret';

function request({ method = 'POST', url = '/api/admin/upload-kit-token/?name=speech', headers = {} } = {}) {
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

describe('kit client-token route', () => {
  it('allows only the four v2.1 buyer-filename pathnames', () => {
    assert.deepEqual(KIT_BLOB_PATHS, {
      speech: 'kits/v2-2026-11-27/Best-Man-Speech-Kit.zip',
      duties: 'kits/v2-2026-11-27/Best-Man-Duties-Kit.zip',
      playbook: 'kits/v2-2026-11-27/Stag-and-Bachelor-Party-Playbook.zip',
      bundle: 'kits/v2-2026-11-27/The-Best-Man-Set.zip',
    });
  });

  it('returns 404 when the secret is wrong and does not sign a token', async () => {
    let called = false;
    const handler = createTokenHandler({
      generateToken: async () => {
        called = true;
        return 'vercel_blob_client_unused';
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
    const handler = createTokenHandler({
      generateToken: async () => {
        called = true;
        return 'vercel_blob_client_unused';
      },
    });
    await withSecret(async () => {
      const result = await call(handler, request({ url: '/api/admin/upload-kit-token/?name=../secret' }));
      assert.equal(result.status, 400);
      assert.equal(result.json.error, 'bad_name');
    });
    assert.equal(called, false);
  });

  it('returns 405 for the wrong method', async () => {
    let called = false;
    const handler = createTokenHandler({
      generateToken: async () => {
        called = true;
        return 'vercel_blob_client_unused';
      },
    });
    const result = await call(handler, request({ method: 'GET' }));
    assert.equal(result.status, 405);
    assert.equal(result.json.error, 'method_not_allowed');
    assert.equal(result.headers.allow, 'POST');
    assert.equal(called, false);
  });

  it('signs a 10-minute client token for that pathname only', async () => {
    const now = 1_700_000_000_000;
    const calls = [];
    await withSecret(async () => {
      const handler = createTokenHandler({
        now: () => now,
        generateToken: async (options) => {
          calls.push(options);
          return `vercel_blob_client_teststore_${Buffer.from('sig.e30').toString('base64')}`;
        },
      });
      const result = await call(handler, request());
      assert.equal(result.status, 200);
      assert.equal(result.json.pathname, 'kits/v2-2026-11-27/Best-Man-Speech-Kit.zip');
      assert.equal(result.json.validUntil, now + TOKEN_TTL_MS);
      assert.equal(result.json.token.startsWith('vercel_blob_client_'), true);
      assert.equal(result.raw.includes(READ_WRITE), false);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].token, READ_WRITE);
      assert.equal(calls[0].pathname, 'kits/v2-2026-11-27/Best-Man-Speech-Kit.zip');
      assert.deepEqual(calls[0].allowedContentTypes, ['application/zip']);
      assert.equal(calls[0].maximumSizeInBytes, MAX_UPLOAD_BYTES);
      assert.equal(calls[0].maximumSizeInBytes, 60 * 1024 * 1024);
      assert.equal(calls[0].validUntil, now + 10 * 60 * 1000);
      assert.equal(calls[0].allowOverwrite, true);
      assert.equal(calls[0].addRandomSuffix, false);
      assert.equal(calls[0].access, undefined);
    });
  });

  it('uses the installed client-token signer and keeps the read-write token out of the response', async () => {
    const now = 1_700_000_000_000;
    await withSecret(async () => {
      const handler = createTokenHandler({ now: () => now });
      const result = await call(handler, request({ url: '/api/admin/upload-kit-token/?name=bundle' }));
      assert.equal(result.status, 200);
      assert.equal(result.raw.includes(READ_WRITE), false);
      assert.equal(result.raw.includes('unitsecret'), false);
      const payload = getPayloadFromClientToken(result.json.token);
      assert.equal(payload.pathname, 'kits/v2-2026-11-27/The-Best-Man-Set.zip');
      assert.deepEqual(payload.allowedContentTypes, ['application/zip']);
      assert.equal(payload.maximumSizeInBytes, MAX_UPLOAD_BYTES);
      assert.equal(payload.allowOverwrite, true);
      assert.equal(payload.addRandomSuffix, false);
      assert.equal(payload.validUntil, now + TOKEN_TTL_MS);
      assert.equal(payload.token, undefined);
    });
  });
});

describe('kit verify route', () => {
  it('returns 404 when the secret is wrong and does not read the blob', async () => {
    let called = false;
    const handler = createVerifyHandler({
      getBlob: async () => {
        called = true;
        return null;
      },
    });
    const previous = process.env.KIT_UPLOAD_SECRET;
    delete process.env.KIT_UPLOAD_SECRET;
    try {
      const missing = await call(handler, request({
        method: 'GET',
        url: '/api/admin/verify-kit/?name=speech',
      }));
      assert.equal(missing.status, 404);
      process.env.KIT_UPLOAD_SECRET = SECRET;
      const wrong = await call(handler, request({
        method: 'GET',
        url: '/api/admin/verify-kit/?name=speech',
        headers: { 'x-upload-secret': 'wrong' },
      }));
      assert.equal(wrong.status, 404);
      assert.equal(wrong.json.error, 'not_found');
      const absent = await call(handler, request({
        method: 'GET',
        url: '/api/admin/verify-kit/?name=speech',
        headers: { 'x-upload-secret': undefined },
      }));
      assert.equal(absent.status, 404);
      assert.equal(called, false);
    } finally {
      if (previous === undefined) delete process.env.KIT_UPLOAD_SECRET;
      else process.env.KIT_UPLOAD_SECRET = previous;
    }
  });

  it('returns 400 for a bad name', async () => {
    let called = false;
    const handler = createVerifyHandler({
      getBlob: async () => {
        called = true;
        return null;
      },
    });
    await withSecret(async () => {
      const result = await call(handler, request({
        method: 'GET',
        url: '/api/admin/verify-kit/?name=nope',
      }));
      assert.equal(result.status, 400);
      assert.equal(result.json.error, 'bad_name');
    });
    assert.equal(called, false);
  });

  it('returns 405 for the wrong method', async () => {
    let called = false;
    const handler = createVerifyHandler({
      getBlob: async () => {
        called = true;
        return null;
      },
    });
    const result = await call(handler, request({
      method: 'POST',
      url: '/api/admin/verify-kit/?name=speech',
    }));
    assert.equal(result.status, 405);
    assert.equal(result.json.error, 'method_not_allowed');
    assert.equal(result.headers.allow, 'GET');
    assert.equal(called, false);
  });

  it('streams the private blob and returns pathname, size and md5', async () => {
    const bytes = Buffer.from('PK\x03\x04UNIQUE_ZIP_BYTES_NOT_IN_JSON');
    const calls = [];
    const handler = createVerifyHandler({
      getBlob: async (pathname, options) => {
        calls.push({ pathname, options });
        return {
          stream: Readable.toWeb(Readable.from([bytes])),
          blob: { pathname, url: 'https://example.private.blob.vercel-storage.com/secret' },
        };
      },
    });
    await withSecret(async () => {
      const result = await call(handler, request({
        method: 'GET',
        url: '/api/admin/verify-kit/?name=playbook',
      }));
      assert.equal(result.status, 200);
      assert.deepEqual(result.json, {
        pathname: 'kits/v2-2026-11-27/Stag-and-Bachelor-Party-Playbook.zip',
        size: bytes.length,
        md5: createHash('md5').update(bytes).digest('hex'),
      });
      assert.equal(result.raw.includes('UNIQUE_ZIP_BYTES_NOT_IN_JSON'), false);
      assert.equal(result.raw.includes(READ_WRITE), false);
      assert.equal(result.raw.includes('example.private'), false);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].pathname, 'kits/v2-2026-11-27/Stag-and-Bachelor-Party-Playbook.zip');
      assert.equal(calls[0].options.access, 'private');
      assert.equal(calls[0].options.token, READ_WRITE);
      assert.equal(calls[0].options.useCache, false);
    });
  });

  it('does not echo a storage failure', async () => {
    const handler = createVerifyHandler({
      getBlob: async () => {
        throw new Error(`token ${READ_WRITE} rejected`);
      },
    });
    await withSecret(async () => {
      const result = await call(handler, request({
        method: 'GET',
        url: '/api/admin/verify-kit/?name=duties',
      }));
      assert.equal(result.status, 502);
      assert.equal(result.json.error, 'blob_error');
      assert.equal(result.raw.includes(READ_WRITE), false);
    });
  });
});

describe('upload-kit client script', () => {
  it('puts a private multipart zip and never reads the read-write token', () => {
    const source = fs.readFileSync(new URL('../../scripts/upload-kit-client.mjs', import.meta.url), 'utf8');
    assert.match(source, /access:\s*'private'/);
    assert.match(source, /multipart:\s*true/);
    assert.match(source, /contentType:\s*'application\/zip'/);
    assert.match(source, /from '@vercel\/blob\/client'/);
    assert.match(source, /KIT_UPLOAD_SECRET/);
    assert.match(source, /verify-kit/);
    assert.match(source, /kitBlobPath/);
    assert.equal(source.includes('kits/v2026-11-27/'), false);
    assert.equal(source.includes('BLOB_READ_WRITE_TOKEN'), false);
  });
});
