/**
 * Vercel Edge Middleware — currency geo hint for Speech Kit dual pricing.
 *
 * Sets bmb_geo from x-vercel-ip-country. Client boot script + assets/currency.js
 * resolve: preference → geo cookie → browser locale → GBP.
 */
import { next } from '@vercel/edge';

export const config = {
  matcher: ['/kits', '/kits/'],
};

function normalizeCurrency(value) {
  const v = String(value || '').toUpperCase();
  return v === 'USD' || v === 'GBP' ? v : '';
}

export default function middleware(request) {
  const pref = normalizeCurrency(request.cookies.get('bmb_currency')?.value);
  const country = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  const currency = pref || (country === 'US' ? 'USD' : 'GBP');

  const response = next();
  response.headers.set('x-bmb-currency', currency);
  response.headers.append('vary', 'X-Vercel-IP-Country, Cookie');

  if (country) {
    response.headers.append(
      'set-cookie',
      `bmb_geo=${encodeURIComponent(country)}; Path=/; Max-Age=86400; SameSite=Lax`
    );
  }

  return response;
}
