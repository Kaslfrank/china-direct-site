(function () {
  'use strict';

  const header = document.getElementById('header');
  const toggle = document.querySelector('.site-header__toggle');
  const nav = document.querySelector('.site-header__nav');
  const hero = document.querySelector('.hero');

  function updateHeader() {
    if (!header) return;

    const scrolled = window.scrollY > 24;
    header.classList.toggle('is-scrolled', scrolled);

    if (hero) {
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      const onHero = window.scrollY < heroBottom - header.offsetHeight;
      header.classList.toggle('is-on-hero', onHero);
    }
  }

  function closeNav() {
    toggle?.classList.remove('is-open');
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }

  toggle?.addEventListener('click', () => {
    const open = toggle.classList.toggle('is-open');
    nav?.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader, { passive: true });
  updateHeader();

  const furnish = document.querySelector('.furnish');
  if (furnish) {
    const defaultCat = 'kitchens';
    const categoryNav = furnish.querySelector('.furnish__index');
    const categories = furnish.querySelectorAll('.furnish__cat');
    const defaultCategory = furnish.querySelector('.furnish__cat[data-cat="kitchens"]');

    function setActiveCat(cat, button) {
      if (!cat) return;

      furnish.dataset.active = cat;
      categories.forEach((item) => {
        item.classList.toggle('is-active', button ? item === button : item === defaultCategory);
      });
    }

    function enterNav() {
      furnish.classList.add('is-nav-active');
    }

    function leaveNav() {
      furnish.classList.remove('is-nav-active');
      setActiveCat(defaultCat, defaultCategory);
    }

    categories.forEach((cat) => {
      cat.addEventListener('mouseenter', () => {
        enterNav();
        setActiveCat(cat.dataset.cat, cat);
      });
      cat.addEventListener('focus', () => {
        enterNav();
        setActiveCat(cat.dataset.cat, cat);
      });
    });

    categoryNav?.addEventListener('mouseleave', leaveNav);

    categoryNav?.addEventListener('focusout', (e) => {
      if (!categoryNav.contains(e.relatedTarget)) {
        leaveNav();
      }
    });
  }

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
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
})();
