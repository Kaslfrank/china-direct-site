(function () {
  'use strict';

  const lightbox = document.getElementById('project-lightbox');
  if (!lightbox) return;

  const triggers = document.querySelectorAll('[data-lightbox-index]');
  const imgEl = lightbox.querySelector('.project-lightbox__img');
  const currentEl = lightbox.querySelector('[data-lightbox-current]');
  const totalEl = lightbox.querySelector('[data-lightbox-total]');
  const prevBtn = lightbox.querySelector('[data-lightbox-prev]');
  const nextBtn = lightbox.querySelector('[data-lightbox-next]');
  const closeEls = lightbox.querySelectorAll('[data-close-lightbox]');

  const images = Array.from(triggers).map((trigger) => ({
    src: trigger.dataset.lightboxSrc || trigger.querySelector('img')?.src || '',
    alt: trigger.dataset.lightboxAlt || trigger.querySelector('img')?.alt || '',
  })).filter((item) => item.src);

  let activeIndex = 0;
  let lastFocus = null;

  function updateSlide() {
    const current = images[activeIndex];
    if (!current || !imgEl) return;

    imgEl.src = current.src;
    imgEl.alt = current.alt;
    if (currentEl) currentEl.textContent = String(activeIndex + 1);
    if (totalEl) totalEl.textContent = String(images.length);
    if (prevBtn) prevBtn.disabled = activeIndex === 0;
    if (nextBtn) nextBtn.disabled = activeIndex === images.length - 1;
  }

  function openLightbox(index) {
    activeIndex = index;
    updateSlide();
    lightbox.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.project-lightbox__close')?.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    imgEl?.removeAttribute('src');
    lastFocus?.focus();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const index = Number(trigger.dataset.lightboxIndex || 0);
      lastFocus = trigger;
      openLightbox(index);
    });
  });

  prevBtn?.addEventListener('click', () => {
    if (activeIndex > 0) {
      activeIndex -= 1;
      updateSlide();
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (activeIndex < images.length - 1) {
      activeIndex += 1;
      updateSlide();
    }
  });

  closeEls.forEach((el) => el.addEventListener('click', closeLightbox));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox.querySelector('.project-lightbox__backdrop')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && activeIndex > 0) {
      activeIndex -= 1;
      updateSlide();
    }
    if (e.key === 'ArrowRight' && activeIndex < images.length - 1) {
      activeIndex += 1;
      updateSlide();
    }
  });
})();
