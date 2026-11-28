/**
 * Serves a free-card PDF after /api/free-cards has set the bmb_card cookie.
 * vercel.json rewrites /cards/:file.pdf here. The files themselves are in cards/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cardFromFilename,
  readCardCookie,
  verifyCardGrant,
} from '../lib/free-cards.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function findPdf(filename) {
  const candidates = [
    path.join(process.cwd(), 'private', 'cards', filename),
    path.join(ROOT, 'private', 'cards', filename),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

export default function handler(req, res, deps = {}) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method not allowed');
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const file = cardFromFilename(url.searchParams.get('file'));
  const secret = deps.secret || process.env.STRIPE_SECRET_KEY;
  const grant = secret ? verifyCardGrant(readCardCookie(req.headers.cookie), secret) : { ok: false };

  if (!file || !grant.ok || grant.cardId !== file.card.id) {
    res.statusCode = 302;
    res.setHeader('Location', '/cards/?download=1#get');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end();
    return;
  }

  let bytes = null;
  if (deps.readFile) {
    const provided = deps.readFile(file.filename);
    if (Buffer.isBuffer(provided)) bytes = provided;
    else if (typeof provided === 'string' && provided) bytes = fs.readFileSync(provided);
  } else {
    const disk = findPdf(file.filename);
    if (disk) bytes = fs.readFileSync(disk);
  }
  if (!bytes) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end('That card is not on the site yet.');
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${file.downloadName}"`);
  res.setHeader('Content-Length', String(bytes.length));
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(bytes);
}
