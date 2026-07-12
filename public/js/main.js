/* ============================================================
   Art by Arianne — main.js
   Handles: hamburger menu, mobile nav, page transitions, lightbox
   ============================================================ */

(function () {
  'use strict';

  /* ── Hamburger / Mobile nav ───────────────────────────────── */
  const burger    = document.querySelector('.nav__burger');
  const mobileNav = document.querySelector('.nav__mobile');

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      const isOpen = burger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      burger.setAttribute('aria-expanded', isOpen);
    });

    /* Close mobile nav when a link is clicked */
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── Active nav link highlighting ────────────────────────── */
  var current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── Page transition (fade-out before navigate) ──────────── */
  document.querySelectorAll('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    /* Skip external, anchor, and mailto links */
    if (!href || href.startsWith('#') || href.startsWith('mailto') ||
        href.startsWith('http') || href.startsWith('//')) return;

    a.addEventListener('click', function (e) {
      e.preventDefault();
      document.body.classList.add('fade-out');
      setTimeout(function () {
        window.location.href = href;
      }, 300);
    });
  });

  /* ── Lightbox ─────────────────────────────────────────────── */
  var lightbox    = document.getElementById('lightbox');
  var lbImg       = document.getElementById('lightbox-img');
  var lbCaption   = document.getElementById('lightbox-caption');
  var lbClose     = document.getElementById('lightbox-close');

  function openLightbox(src, caption) {
    if (!lightbox) return;
    lbImg.src = src;
    lbImg.alt = caption || '';
    if (lbCaption) lbCaption.textContent = caption || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose && lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    /* Clear src after transition so the old image doesn't flash */
    setTimeout(function () { lbImg.src = ''; }, 350);
  }

  /* Wire up all art-image wrappers */
  document.querySelectorAll('.artwork-item__img-wrap').forEach(function (wrap) {
    wrap.addEventListener('click', function () {
      var img     = wrap.querySelector('.artwork-item__img');
      var caption = wrap.closest('.artwork-item')
                        .querySelector('.artwork-item__title')
                        .textContent;
      openLightbox(img.src, caption);
    });
  });

  /* Close triggers */
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });

  /* ── Contact form (static — just prevent default) ──────────── */
  var form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.btn');
      btn.textContent = 'Message sent';
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.6';
      form.reset();
    });
  }

})();
