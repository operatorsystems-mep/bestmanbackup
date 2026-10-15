// Vercel serverless function: cheat-sheet sign-up via Resend.
// Needs env vars on the Vercel project: RESEND_API_KEY, RESEND_SEGMENT_ID, RESEND_FROM (e.g. "Best Man Backup <hello@bestmanbackup.com>").
const PDF = 'https://bestmanbackup.com/freebies/best-man-speech-cheat-sheet.pdf';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : (req.body || {});
  const email = String(body['fields[email]'] || body.email || '').trim().toLowerCase();
  if (body.website) return res.redirect(303, '/?signup=ok#cheat-sheet'); // honeypot
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.redirect(303, '/?signup=invalid#cheat-sheet');
  const h = { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' };
  const c = await fetch('https://api.resend.com/contacts', { method: 'POST', headers: h,
    body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: process.env.RESEND_SEGMENT_ID }] }) });
  if (!c.ok && c.status !== 409) return res.redirect(303, '/?signup=error#cheat-sheet');
  await fetch('https://api.resend.com/emails', { method: 'POST', headers: h, body: JSON.stringify({
    from: process.env.RESEND_FROM, to: [email], subject: 'Your free best man speech cheat sheet',
    html: `<p>Thanks for signing up. Here is your one-page speech cheat sheet:</p><p><a href="${PDF}">Download the cheat sheet (PDF)</a></p><p>We'll send a few short best man tips after this. Every email has an unsubscribe link, or reply to this email to be removed.</p><p>Best Man Backup</p>` }) });
  return res.redirect(303, '/?signup=ok#cheat-sheet');
}
