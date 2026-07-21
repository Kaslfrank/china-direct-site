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

  const galleryEl = document.getElementById('project-gallery');
  if (galleryEl) {
    const galleryTitle = galleryEl.querySelector('.project-gallery__title');
    const galleryLocation = galleryEl.querySelector('.project-gallery__location');
    const galleryImg = galleryEl.querySelector('.project-gallery__img');
    const galleryCurrent = galleryEl.querySelector('[data-gallery-current]');
    const galleryTotal = galleryEl.querySelector('[data-gallery-total]');
    const prevBtn = galleryEl.querySelector('[data-gallery-prev]');
    const nextBtn = galleryEl.querySelector('[data-gallery-next]');
    const closeEls = galleryEl.querySelectorAll('[data-close-gallery]');
    const projectItems = document.querySelectorAll('.projects__item[data-project]');

    let activeImages = [];
    let activeIndex = 0;
    let activeTitle = '';
    let lastFocus = null;

    function buildImageList(item) {
      const id = item.dataset.project;
      const numberedCount = Math.min(11, Number(item.dataset.galleryCount || 0));
      const images = ['cover.jpg'];
      for (let i = 1; i <= numberedCount; i += 1) {
        images.push(`${String(i).padStart(2, '0')}.jpg`);
      }
      return images.map((file) => `assets/projects/project-${id}/${file}`);
    }

    function updateGallerySlide() {
      if (!activeImages.length) return;
      const src = activeImages[activeIndex];
      galleryImg.src = src;
      galleryImg.alt = `${activeTitle} — фото ${activeIndex + 1}`;
      galleryCurrent.textContent = String(activeIndex + 1);
      galleryTotal.textContent = String(activeImages.length);
      prevBtn.disabled = activeIndex === 0;
      nextBtn.disabled = activeIndex === activeImages.length - 1;
    }

    function openGallery(item) {
      const titleEl = item.querySelector('.projects__location');
      const locationEl = item.querySelector('.projects__detail');
      activeTitle = titleEl?.textContent?.trim() || '';
      const location = locationEl?.textContent?.trim() || '';
      activeImages = buildImageList(item);
      activeIndex = 0;

      galleryTitle.textContent = activeTitle;
      galleryLocation.textContent = location;
      updateGallerySlide();

      galleryEl.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => galleryEl.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      galleryEl.querySelector('.project-gallery__close')?.focus();
    }

    function closeGallery() {
      galleryEl.classList.remove('is-open');
      galleryEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      galleryImg.removeAttribute('src');
      lastFocus?.focus();
    }

    function showNext() {
      if (activeIndex < activeImages.length - 1) {
        activeIndex += 1;
        updateGallerySlide();
      }
    }

    function showPrev() {
      if (activeIndex > 0) {
        activeIndex -= 1;
        updateGallerySlide();
      }
    }

    projectItems.forEach((item) => {
      const openBtn = item.querySelector('[data-open-project]');
      const media = item.querySelector('.projects__media');

      openBtn?.addEventListener('click', () => {
        lastFocus = openBtn;
        openGallery(item);
      });

      media?.addEventListener('click', () => {
        lastFocus = media;
        openGallery(item);
      });

      media?.setAttribute('role', 'button');
      media?.setAttribute('tabindex', '0');
      media?.setAttribute('aria-label', `Смотреть проект: ${item.querySelector('.projects__location')?.textContent?.trim() || ''}`);
      media?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          lastFocus = media;
          openGallery(item);
        }
      });
    });

    nextBtn?.addEventListener('click', showNext);
    prevBtn?.addEventListener('click', showPrev);
    closeEls.forEach((el) => el.addEventListener('click', closeGallery));

    document.addEventListener('keydown', (e) => {
      if (!galleryEl.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    });
  }

  const contactModal = document.getElementById('contact-modal');
  if (contactModal) {
    const contactDialog = contactModal.querySelector('.contact-modal__dialog');
    const contactCloseEls = contactModal.querySelectorAll('[data-close-contact]');
    const contactTriggers = document.querySelectorAll('[data-open-contact]');
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    let contactLastFocus = null;

    function getFocusableElements(container) {
      return Array.from(container.querySelectorAll(focusableSelector)).filter((el) => {
        return el.offsetParent !== null || el === document.activeElement;
      });
    }

    function trapContactFocus(e) {
      if (!contactModal.classList.contains('is-open') || e.key !== 'Tab' || !contactDialog) return;

      const focusable = getFocusableElements(contactDialog);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function openContactModal(trigger) {
      contactLastFocus = trigger;
      contactModal.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => contactModal.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      contactModal.querySelector('.contact-modal__close')?.focus();
    }

    function closeContactModal() {
      contactModal.classList.remove('is-open');
      contactModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      contactLastFocus?.focus();
    }

    contactTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => openContactModal(trigger));
    });

    contactCloseEls.forEach((el) => {
      el.addEventListener('click', closeContactModal);
    });

    contactDialog?.addEventListener('keydown', trapContactFocus);

    document.addEventListener('keydown', (e) => {
      if (!contactModal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeContactModal();
    });
  }

  function initFaqAccordion() {
    const faqItems = Array.from(document.querySelectorAll('.faq__item'));
    if (!faqItems.length) return;

    const faqTriggers = faqItems.map((item) => item.querySelector('.faq__trigger'));
    const panelTransitionMs = 600;
    const hideTimers = new WeakMap();

    function scheduleHidden(item, panel) {
      if (!panel) return;
      const existing = hideTimers.get(panel);
      if (existing) window.clearTimeout(existing);
      hideTimers.set(
        panel,
        window.setTimeout(() => {
          hideTimers.delete(panel);
          if (!item.classList.contains('is-open')) {
            panel.setAttribute('hidden', '');
          }
        }, panelTransitionMs)
      );
    }

    function closeFaqItem(item) {
      const trigger = item.querySelector('.faq__trigger');
      const panel = item.querySelector('.faq__panel');
      if (!item.classList.contains('is-open')) return;

      item.classList.remove('is-open');
      trigger?.setAttribute('aria-expanded', 'false');
      scheduleHidden(item, panel);
    }

    function openFaqItem(item) {
      const trigger = item.querySelector('.faq__trigger');
      const panel = item.querySelector('.faq__panel');
      if (!panel) return;

      const pendingHide = hideTimers.get(panel);
      if (pendingHide) {
        window.clearTimeout(pendingHide);
        hideTimers.delete(panel);
      }

      panel.removeAttribute('hidden');
      void panel.offsetHeight;
      item.classList.add('is-open');
      trigger?.setAttribute('aria-expanded', 'true');
    }

    function toggleFaqItem(item) {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains('is-open')) {
          closeFaqItem(other);
        }
      });

      if (isOpen) {
        closeFaqItem(item);
      } else {
        openFaqItem(item);
      }
    }

    faqItems.forEach((item) => {
      const trigger = item.querySelector('.faq__trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => toggleFaqItem(item));

      trigger.addEventListener('keydown', (e) => {
        const index = faqTriggers.indexOf(trigger);
        if (index === -1) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          faqTriggers[(index + 1) % faqTriggers.length]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          faqTriggers[(index - 1 + faqTriggers.length) % faqTriggers.length]?.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          faqTriggers[0]?.focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          faqTriggers[faqTriggers.length - 1]?.focus();
        }
      });
    });

    if (location.hash === '#faq') {
      document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaqAccordion);
  } else {
    initFaqAccordion();
  }
})();
