/**
 * Upload one kit ZIP with a short-lived client token, then verify it.
 *
 *   KIT_UPLOAD_SECRET=... node scripts/upload-kit-client.mjs <name> <file> <baseUrl>
 *
 * name is speech, duties, playbook or bundle. The secret is read from
 * KIT_UPLOAD_SECRET and is never printed. Bytes go to the private Blob
 * store with a multipart put (access: 'private'); they do not pass through
 * the upload function. Prints the verify-kit JSON on stdout.
 */
import { readFile } from 'node:fs/promises';
import { put } from '@vercel/blob/client';

const NAMES = new Set(['speech', 'duties', 'playbook', 'bundle']);

function usage() {
  console.error('Usage: KIT_UPLOAD_SECRET=... node scripts/upload-kit-client.mjs <speech|duties|playbook|bundle> <file> <baseUrl>');
  process.exit(1);
}

function endpoint(root, route, name) {
  const url = new URL(`/api/admin/${route}/`, root);
  url.searchParams.set('name', name);
  return url;
}

async function main() {
  const [name, filePath, baseUrl, extra] = process.argv.slice(2);
  const secret = process.env.KIT_UPLOAD_SECRET;
  if (extra !== undefined || !NAMES.has(name) || !filePath || !baseUrl || typeof secret !== 'string' || secret.length === 0) {
    usage();
  }

  let root;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('bad protocol');
    root = parsed.origin;
  } catch {
    console.error('base URL must be http(s)');
    process.exit(1);
  }

  const pathname = `kits/v2026-11-27/${name}.zip`;
  const headers = { 'x-upload-secret': secret };

  let tokenResponse;
  try {
    tokenResponse = await fetch(endpoint(root, 'upload-kit-token', name), {
      method: 'POST',
      headers,
      redirect: 'manual',
    });
  } catch {
    console.error('token request failed');
    process.exit(1);
  }
  if (tokenResponse.status >= 300 && tokenResponse.status < 400) {
    console.error('token request failed: redirect');
    process.exit(1);
  }

  let tokenJson = null;
  try {
    tokenJson = await tokenResponse.json();
  } catch {
    tokenJson = null;
  }
  const clientToken = tokenJson?.token;
  if (!tokenResponse.ok || tokenJson?.pathname !== pathname || typeof clientToken !== 'string' || !clientToken.startsWith('vercel_blob_client_')) {
    console.error(`token request failed: ${tokenResponse.status}`);
    process.exit(1);
  }

  let body;
  try {
    body = await readFile(filePath);
  } catch {
    console.error('could not read file');
    process.exit(1);
  }

  try {
    await put(pathname, body, {
      access: 'private',
      token: clientToken,
      multipart: true,
      contentType: 'application/zip',
    });
  } catch {
    console.error('upload failed');
    process.exit(1);
  }

  let verifyResponse;
  try {
    verifyResponse = await fetch(endpoint(root, 'verify-kit', name), {
      method: 'GET',
      headers,
      redirect: 'manual',
    });
  } catch {
    console.error('verify request failed');
    process.exit(1);
  }

  const verifyText = await verifyResponse.text();
  process.stdout.write(verifyText.endsWith('\n') ? verifyText : `${verifyText}\n`);
  if (!verifyResponse.ok) process.exit(1);
}

await main();
