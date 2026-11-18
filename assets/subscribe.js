/**
 * Free checklist signup forms ([data-checklist-form]).
 * Posts to /api/subscribe; never sends email from the browser.
 */
(() => {
  const CHECKLIST_FALLBACK = '/downloads/best-man-checklist.pdf';

  function setStatus(form, message, isError) {
    const status = form.querySelector('[data-checklist-status]');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = isError ? 'error' : message ? 'ok' : '';
  }

  function showSuccess(form, downloadUrl, preview) {
    const success = form.querySelector('[data-checklist-success]');
    const fields = form.querySelector('[data-checklist-fields]');
    const link = form.querySelector('[data-checklist-download]');
    if (link) {
      link.href = downloadUrl || CHECKLIST_FALLBACK;
    }
    if (fields) fields.hidden = true;
    if (success) success.hidden = false;
    if (preview) {
      console.info(
        '[Best Man Backup] Checklist signup preview mode: Resend env vars are not connected. Download still works.'
      );
      const note = form.querySelector('[data-checklist-preview-note]');
      if (note) note.hidden = false;
    }
    setStatus(form, '', false);
  }

  async function onSubmit(event) {
    const form = event.currentTarget;
    event.preventDefault();

    const email = form.querySelector('input[name="email"]');
    const firstName = form.querySelector('input[name="firstName"]');
    const consent = form.querySelector('input[name="consent"]');
    const website = form.querySelector('input[name="website"]');
    const submit = form.querySelector('button[type="submit"]');

    if (!email?.checkValidity()) {
      setStatus(form, 'Please enter a valid email address.', true);
      email?.focus();
      return;
    }
    if (!consent?.checked) {
      setStatus(form, 'Please tick the box to receive the checklist.', true);
      consent?.focus();
      return;
    }

    if (submit) submit.disabled = true;
    setStatus(form, 'Sending…', false);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
          firstName: firstName?.value?.trim() || '',
          consent: true,
          website: website?.value || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const msg =
          data.message ||
          (data.error === 'invalid_email'
            ? 'Please enter a valid email address.'
            : data.error === 'consent_required'
              ? 'Please tick the box to receive the checklist.'
              : 'Something went wrong. Please try again.');
        setStatus(form, msg, true);
        return;
      }
      showSuccess(form, data.downloadUrl || CHECKLIST_FALLBACK, Boolean(data.preview));
    } catch {
      setStatus(form, 'Something went wrong. Please try again.', true);
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  document.querySelectorAll('[data-checklist-form]').forEach((form) => {
    form.addEventListener('submit', onSubmit);
  });
})();
