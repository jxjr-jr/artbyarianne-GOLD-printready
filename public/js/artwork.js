/* ============================================================
   Art by Arianne — artwork.js
   Per-artwork viewer for the Paintings detail pages.
   Handles: thumbnail swap, desktop hover-magnify, and a
   fullscreen zoom/pan viewer with mouse-wheel zoom, drag-to-pan,
   double-click zoom, and touch pinch-to-zoom + one-finger pan.
   Pure vanilla JS — no dependencies.
   ============================================================ */

(function () {
  'use strict';

  var gallery = document.querySelector('[data-viewer]');
  if (!gallery) return;

  var mainWrap = gallery.querySelector('.artwork-detail__main');
  var mainImg  = document.getElementById('viewer-main');
  var thumbs   = Array.prototype.slice.call(
    gallery.querySelectorAll('.artwork-detail__thumb')
  );

  /* ── Thumbnail swap ───────────────────────────────────────── */
  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var full = thumb.getAttribute('data-full');
      if (!full) return;
      mainImg.style.transform = '';           /* reset any hover-zoom */
      mainImg.src = full;
      mainImg.alt = thumb.getAttribute('data-alt') || '';
      thumbs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-current', 'false');
      });
      thumb.classList.add('is-active');
      thumb.setAttribute('aria-current', 'true');
    });
  });

  /* ── Desktop hover-magnify on the inline main image ───────── */
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && mainWrap && mainImg) {
    mainWrap.addEventListener('mousemove', function (e) {
      var r = mainWrap.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * 100;
      var y = ((e.clientY - r.top) / r.height) * 100;
      mainImg.style.transformOrigin = x + '% ' + y + '%';
      mainImg.style.transform = 'scale(2.1)';
    });
    mainWrap.addEventListener('mouseleave', function () {
      mainImg.style.transform = '';
    });
  }

  /* ============================================================
     Fullscreen zoom / pan viewer
     ============================================================ */
  var overlay = document.createElement('div');
  overlay.className = 'viewer';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Full screen artwork viewer');
  overlay.innerHTML =
      '<button type="button" class="viewer__close" aria-label="Close viewer">'
    +   '<svg viewBox="0 0 24 24" aria-hidden="true">'
    +     '<line x1="18" y1="6" x2="6" y2="18"></line>'
    +     '<line x1="6" y1="6" x2="18" y2="18"></line>'
    +   '</svg>'
    + '</button>'
    + '<div class="viewer__canvas">'
    +   '<img class="viewer__img" alt="" />'
    + '</div>'
    + '<p class="viewer__hint">Scroll or pinch to zoom &middot; drag to pan &middot; double-click to reset</p>';
  document.body.appendChild(overlay);

  var canvas   = overlay.querySelector('.viewer__canvas');
  var vImg     = overlay.querySelector('.viewer__img');
  var closeBtn = overlay.querySelector('.viewer__close');

  var MIN = 1, MAX = 6;
  var scale = 1, tx = 0, ty = 0;      /* current transform state */
  var baseW = 0, baseH = 0;           /* rendered image size at scale 1 */

  function apply() {
    vImg.style.transform =
      'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
  }

  function clampPan() {
    var cw = canvas.clientWidth;
    var ch = canvas.clientHeight;
    var maxX = Math.max(0, (baseW * scale - cw) / 2);
    var maxY = Math.max(0, (baseH * scale - ch) / 2);
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
  }

  function measure() {
    /* offset size is the layout (scale-1) size, unaffected by transform */
    baseW = vImg.offsetWidth;
    baseH = vImg.offsetHeight;
  }

  function reset() {
    scale = 1; tx = 0; ty = 0;
    apply();
  }

  /* Zoom toward a point (px,py measured from canvas centre) */
  function zoomTo(nextScale, px, py) {
    nextScale = Math.min(MAX, Math.max(MIN, nextScale));
    var ratio = nextScale / scale;
    tx = px - ratio * (px - tx);
    ty = py - ratio * (py - ty);
    scale = nextScale;
    if (scale <= MIN) { tx = 0; ty = 0; }
    clampPan();
    apply();
  }

  function openViewer(src, alt) {
    vImg.src = src;
    vImg.alt = alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    scale = 1; tx = 0; ty = 0;
    /* wait for the image to lay out before measuring */
    if (vImg.complete) { measure(); apply(); }
    else { vImg.onload = function () { measure(); apply(); }; }
    closeBtn.focus();
  }

  function closeViewer() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { vImg.src = ''; reset(); }, 300);
  }

  /* ── Open triggers (inline main image) ────────────────────── */
  if (mainWrap) {
    mainWrap.addEventListener('click', function () {
      openViewer(mainImg.src, mainImg.alt);
    });
    mainWrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openViewer(mainImg.src, mainImg.alt);
      }
    });
  }

  /* ── Close triggers ───────────────────────────────────────── */
  closeBtn.addEventListener('click', closeViewer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeViewer();
  });

  /* ── Wheel zoom (desktop) ─────────────────────────────────── */
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left - rect.width / 2;
    var py = e.clientY - rect.top - rect.height / 2;
    var factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
    zoomTo(scale * factor, px, py);
  }, { passive: false });

  /* ── Double-click: toggle zoom ────────────────────────────── */
  canvas.addEventListener('dblclick', function (e) {
    if (scale > 1) { reset(); return; }
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left - rect.width / 2;
    var py = e.clientY - rect.top - rect.height / 2;
    zoomTo(2.6, px, py);
  });

  /* ── Pointer events: drag-to-pan + pinch-to-zoom ──────────── */
  var pointers = new Map();
  var lastMid  = null;
  var lastDist = 0;
  var moved    = false;

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      lastDist = dist(pts[0], pts[1]);
      lastMid  = mid(pts[0], pts[1]);
    }
    if (scale > 1) canvas.classList.add('is-panning');
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    var prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      /* Pinch to zoom toward the midpoint */
      var pts  = Array.from(pointers.values());
      var d    = dist(pts[0], pts[1]);
      var m    = mid(pts[0], pts[1]);
      var rect = canvas.getBoundingClientRect();
      var px   = m.x - rect.left - rect.width / 2;
      var py   = m.y - rect.top - rect.height / 2;
      if (lastDist > 0) zoomTo(scale * (d / lastDist), px, py);
      /* pan with the midpoint drift */
      tx += m.x - lastMid.x;
      ty += m.y - lastMid.y;
      clampPan();
      apply();
      lastDist = d;
      lastMid  = m;
      moved = true;
    } else if (pointers.size === 1 && scale > 1) {
      /* Single-pointer pan */
      tx += e.clientX - prev.x;
      ty += e.clientY - prev.y;
      clampPan();
      apply();
      moved = true;
    }
  });

  function endPointer(e) {
    if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
    if (pointers.size < 2) { lastDist = 0; lastMid = null; }
    if (pointers.size === 0) {
      canvas.classList.remove('is-panning');
      /* Tap on the backdrop (no drag, not zoomed) closes the viewer */
      if (!moved && scale <= 1 && e.target !== vImg) closeViewer();
    }
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  /* Clicking the dark area (not the image) closes when not zoomed */
  canvas.addEventListener('click', function (e) {
    if (e.target === canvas && scale <= 1) closeViewer();
  });

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function mid(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  /* Re-measure if the window resizes while open */
  window.addEventListener('resize', function () {
    if (overlay.classList.contains('open')) { measure(); clampPan(); apply(); }
  });

})();
