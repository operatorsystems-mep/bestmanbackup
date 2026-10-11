/* Local interactions (tabs). Outbound Etsy links use UTM on the HTML hrefs. Site visit analytics: GoatCounter (bestmanbackup.goatcounter.com) when enabled. Lead-magnet form: inert until MailerLite is approved (placeholder action). No third-party pixels. */
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
