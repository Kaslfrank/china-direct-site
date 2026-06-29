(function () {
  'use strict';

  const header = document.getElementById('header');
  const hero = document.querySelector('.hero');
  const burger = document.querySelector('.header__burger');
  const nav = document.querySelector('.header__nav');
  const lightbox = document.querySelector('.lightbox');

  function updateHeader() {
    if (!header) return;

    const scrolled = window.scrollY > 40;
    header.classList.toggle('header--scrolled', scrolled);

    if (hero) {
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      const inHero = window.scrollY < heroBottom - header.offsetHeight;
      header.classList.toggle('header--hero', inHero);
    }
  }

  function closeNav() {
    burger?.classList.remove('is-open');
    nav?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
  }

  burger?.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('is-open');
    nav?.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const src = item.getAttribute('href');
      if (!lightbox || !src) return;
      lightbox.querySelector('img').src = src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  lightbox?.addEventListener('click', (e) => {
    if (e.target.classList.contains('lightbox') || e.target.tagName === 'BUTTON') {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox?.classList.contains('open')) {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
})();
