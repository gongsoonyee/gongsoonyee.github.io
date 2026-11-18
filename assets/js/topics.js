(function () {
  'use strict';
  const sections = [...document.querySelectorAll('.topics-topic')];
  const links = [...document.querySelectorAll('.topics-nav a')];
  function highlight(id) { links.forEach(link => { if (link.hash === '#' + id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); }
  function reveal() {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    const section = target.closest('.topics-topic');
    if (section) { section.open = true; highlight(section.id); requestAnimationFrame(() => target.scrollIntoView({block:'start'})); }
  }
  // Native details remain usable without JavaScript. On mobile start with the first theme.
  if (matchMedia('(max-width: 767px)').matches) sections.forEach((section, index) => { section.open = index === 0; });
  links.forEach(link => link.addEventListener('click', () => { const target = document.getElementById(link.hash.slice(1)); if (target) { target.open = true; highlight(target.id); } }));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top-b.boundingClientRect.top); if (visible[0]) highlight(visible[0].target.id); }, {rootMargin:'-100px 0px -50% 0px'});
    sections.forEach(section => observer.observe(section));
  }
  addEventListener('hashchange', reveal);
  highlight(sections[0]?.id); reveal();
})();
