(() => {
  const grid = document.querySelector('[data-card-grid]');
  const note = document.querySelector('[data-paper-note]');
  const blocked = document.querySelector('[data-download-note]');
  if (blocked && new URLSearchParams(location.search).get('download') === '1') blocked.hidden = false;
  if (!grid) return;

  function applyRegion(region) {
    if (!region || !Array.isArray(region.order)) return;
    if (note && region.note) note.textContent = region.note;
    for (const id of region.order) {
      const form = grid.querySelector(`form[data-card="${id}"]`);
      if (form) grid.appendChild(form);
    }
    for (const spec of region.cards || []) {
      const form = grid.querySelector(`form[data-card="${spec.id}"]`);
      if (!form) continue;
      const fieldset = form.querySelector('fieldset');
      for (const format of spec.formats || []) {
        const input = form.querySelector(`input[name="format"][value="${format.id}"]`);
        if (input && fieldset) fieldset.appendChild(input.closest('label'));
      }
      const selected = form.querySelector(`input[name="format"][value="${spec.defaultFormat}"]`);
      if (selected) selected.checked = true;
    }
  }

  fetch('/api/free-cards/', { headers: { Accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : null))
    .then(applyRegion)
    .catch(() => {});

  document.querySelectorAll('form[data-card]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = form.querySelector('[data-status]');
      const button = form.querySelector('button');
      const format = form.querySelector('input[name="format"]:checked');
      button.disabled = true;
      status.textContent = 'Saving your email…';
      try {
        const res = await fetch('/api/free-cards/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: form.email.value,
            card: form.dataset.card,
            format: format ? format.value : '',
            consent: form.consent.checked ? 'yes' : '',
            company: form.company.value,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.downloadUrl) {
          status.textContent = data.message || 'Something went wrong. Email hello@bestmanbackup.com and we will send the card.';
          button.disabled = false;
          return;
        }
        status.textContent = '';
        const link = document.createElement('a');
        link.className = 'btn';
        link.href = data.downloadUrl;
        link.textContent = 'Download your card';
        status.appendChild(link);
        link.click();
      } catch {
        status.textContent = 'Something went wrong. Email hello@bestmanbackup.com and we will send the card.';
        button.disabled = false;
      }
    });
  });
})();
