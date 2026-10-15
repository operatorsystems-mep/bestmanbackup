/* Local interactions (tabs). Outbound Etsy links use UTM on the HTML hrefs. Site visit analytics: GoatCounter (bestmanbackup.goatcounter.com) when enabled. Bundle card and cheat-sheet sign-up are controlled by BMB_CONFIG below. No third-party pixels. */
(() => {
 const tabs = [...document.querySelectorAll('[role="tab"]')];
 function activate(tab, focus = false) {
   tabs.forEach(item => {
     const selected = item === tab;
     item.setAttribute('aria-selected', String(selected));
     item.tabIndex = selected ? 0 : -1;
     document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
   });
   if (focus) tab.focus();
 }
 tabs.forEach((tab, index) => {
   tab.addEventListener('click', () => activate(tab));
   tab.addEventListener('keydown', event => {
     let next;
     if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
     if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
     if (event.key === 'Home') next = 0;
     if (event.key === 'End') next = tabs.length - 1;
     if (next !== undefined) { event.preventDefault(); activate(tabs[next], true); }
   });
 });
})();

/* ===== SITE CONFIG: the only lines to edit ===== */
const BMB_CONFIG = {
  bundleUrl: 'https://www.etsy.com/listing/4593235340',                          
  signupEnabled: false,                   // CHEAT-SHEET SIGN-UP FLAG: true shows the section, but only once signupAction and privacyUrl are both real.
  signupAction: 'MAILERLITE_FORM_ACTION', // SIGN-UP ENDPOINT: paste the MailerLite embedded form action URL here.
  privacyUrl: ''                          // PRIVACY NOTICE URL: must point to a real privacy page before the sign-up can show.
};
/* ================================================ */

// The Best Man Set: hidden until a listing URL exists.
(() => {
 const url = BMB_CONFIG.bundleUrl.trim();
 if (!/^https:\/\/www\.etsy\.com\//.test(url)) return;
 const sep = url.includes('?') ? '&' : '?';
 document.querySelectorAll('[data-bundle-link]').forEach(a => { a.href = url + sep + 'utm_source=site&utm_medium=card&utm_campaign=bundle'; });
 document.querySelectorAll('[data-bundle]').forEach(el => { el.hidden = false; });
})();

// Cheat-sheet sign-up: hidden until enabled with a real endpoint and privacy notice.
(() => {
 const action = BMB_CONFIG.signupAction.trim();
 const privacy = BMB_CONFIG.privacyUrl.trim();
 const ready = BMB_CONFIG.signupEnabled && /^https:\/\//.test(action) && !action.includes('MAILERLITE_FORM_ACTION') && privacy !== '';
 const form = document.querySelector('[data-lead-form]');
 if (!ready || !form) return;
 form.setAttribute('action', action);
 document.querySelectorAll('[data-privacy-link]').forEach(a => { a.href = privacy; });
 document.querySelectorAll('[data-signup]').forEach(el => { el.hidden = false; });
})();

// Lead-magnet form: do nothing while the MailerLite action is still a placeholder.
(() => {
 const form = document.querySelector('[data-lead-form]');
 if (!form) return;
 form.addEventListener('submit', event => {
   const status = form.querySelector('.lead-status');
   const email = form.querySelector('input[type="email"]');
   if (!email.checkValidity()) { event.preventDefault(); status.textContent = 'Please enter a valid email address.'; email.focus(); return; }
   if (form.getAttribute('action').includes('MAILERLITE_FORM_ACTION')) { event.preventDefault(); status.textContent = 'The cheat sheet is almost ready. Sign-up opens soon.'; }
 });
})();
