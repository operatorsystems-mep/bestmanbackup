/**
 * Streams a paid kit ZIP after verifying a short-lived HMAC token.
 * Env: STRIPE_SECRET_KEY (used as signing secret; never hard-code).
 */
import fs from 'node:fs';
import path from 'node:path';
import { getKit } from '../lib/kits.mjs';
import { verifyDownloadToken } from '../lib/fulfillment.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method not allowed');
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Download not configured. Email hello@bestmanbackup.com');
    return;
  }

  const verified = verifyDownloadToken(token, secret);
  if (!verified.ok) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end(`<!DOCTYPE html><html lang="en-GB"><body style="font-family:system-ui;padding:2rem">
      <h1>Download link expired or invalid</h1>
      <p>Return to your thank-you page, or email <a href="mailto:hello@bestmanbackup.com">hello@bestmanbackup.com</a>.</p>
    </body></html>`);
    return;
  }

  const kit = getKit(verified.kitId);
  const filePath = path.join(process.cwd(), 'private', 'products', kit.file);
  if (!fs.existsSync(filePath)) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`The ${kit.name} file is not installed yet. Email hello@bestmanbackup.com`);
    return;
  }

  const stat = fs.statSync(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Length', String(stat.size));
  res.setHeader('Content-Disposition', `attachment; filename="${kit.downloadName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  fs.createReadStream(filePath).pipe(res);
}
