(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  /* ---------- Nav: scrolled state ---------- */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav__toggle');
  const menu = $('#mobile-menu');

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', menu).focus();
  };

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Active section in nav ---------- */
  const navLinks = $$('[data-nav]');
  const sections = $$('[data-section]');
  const setActive = (id) => {
    navLinks.forEach((a) => {
      if (a.dataset.nav === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  // The section whose area crosses a line ~35% down the viewport is "current".
  const pickActive = () => {
    const line = window.innerHeight * 0.35;
    let current = sections[0].id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= line) current = s.id;
    }
    // Snap to last section at the very bottom of the page
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].id;
    }
    setActive(current);
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { pickActive(); ticking = false; }); ticking = true; }
  }, { passive: true });
  pickActive();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal, .tl-item');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Hero counters ---------- */
  if (!reduceMotion) {
    $$('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;
      const start = performance.now() + 1100; // after stats fade in
      el.textContent = '0';
      const tick = (now) => {
        const t = Math.min(Math.max((now - start) / duration, 0), 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Expandable experience card ---------- */
  $$('.expand').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const label = $('.expand__text', btn);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      label.textContent = open ? btn.dataset.less : btn.dataset.more;
    });
  });

  /* ---------- Research card hover light ---------- */
  $$('.paper').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Research network canvas ---------- */
  const canvas = $('.research__net');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, nodes = [], running = false, rafId = 0;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(46, Math.max(18, (w * h) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.8,
        hub: Math.random() < 0.12
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const maxD = 150;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < maxD) {
            ctx.strokeStyle = `rgba(73,169,255,${(1 - d / maxD) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.fillStyle = n.hub ? 'rgba(73,169,255,.9)' : 'rgba(73,169,255,.5)';
        ctx.arc(n.x, n.y, n.hub ? n.r + 1.4 : n.r, 0, Math.PI * 2);
        ctx.fill();
        if (n.hub) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(73,169,255,.18)';
          ctx.arc(n.x, n.y, n.r + 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10;
      }
      draw();
      if (running) rafId = requestAnimationFrame(step);
    };

    build();
    draw();

    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        running = entry.isIntersecting && !document.hidden;
        cancelAnimationFrame(rafId);
        if (running) rafId = requestAnimationFrame(step);
      }).observe(canvas);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); draw(); }, 200);
    });
  }
})();
