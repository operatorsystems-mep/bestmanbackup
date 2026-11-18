/* Opens the header menu below 1100px. Wide screens keep the links inline. */
(() => {
  const header = document.querySelector('header.header');
  const button = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!header || !button || !nav) return;

  function setOpen(open) {
    header.classList.toggle('nav-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  button.addEventListener('click', () => {
    setOpen(!header.classList.contains('nav-open'));
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });

  const wide = window.matchMedia('(min-width: 1101px)');
  const closeIfWide = () => {
    if (wide.matches) setOpen(false);
  };
  if (wide.addEventListener) wide.addEventListener('change', closeIfWide);
  else wide.addListener(closeIfWide);
})();
