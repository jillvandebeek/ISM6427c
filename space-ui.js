/* Shared space visuals: theme switcher and animated starfield. */
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };

  function storage(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  // ---------- Theme ----------
  function applyTheme(choice) {
    var root = document.documentElement;
    if (choice === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', choice);
    storage('kw-theme', choice);
    document.querySelectorAll('[data-theme-choice]').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.themeChoice === choice));
    });
  }

  function initTheme() {
    applyTheme(storage('kw-theme') || 'system');
    document.querySelectorAll('[data-theme-choice]').forEach(function (b) {
      b.addEventListener('click', function () { applyTheme(b.dataset.themeChoice); });
    });
  }

  // ---------- Starfield ----------
  function initStars() {
    var canvas = $('#stars');
    var ctx = canvas.getContext('2d');
    var stars = [], shooting = null, w, h;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(260, Math.floor((w * h) / 5000));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.2, p: Math.random() * Math.PI * 2, s: Math.random() * 0.02 + 0.005 });
      }
    }

    function starColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--star').trim() || '255,255,255';
    }

    function draw() {
      var rgb = starColor();
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.p += s.s;
        var a = reduce ? 0.7 : 0.35 + Math.sin(s.p) * 0.35 + 0.3;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + rgb + ',' + a.toFixed(2) + ')';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) {
        if (!shooting && Math.random() < 0.004) {
          shooting = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.4, vx: 9, vy: 4, life: 1 };
        }
        if (shooting) {
          var g = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - shooting.vx * 10, shooting.y - shooting.vy * 10);
          g.addColorStop(0, 'rgba(' + rgb + ',' + shooting.life + ')');
          g.addColorStop(1, 'rgba(' + rgb + ',0)');
          ctx.strokeStyle = g; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(shooting.x, shooting.y);
          ctx.lineTo(shooting.x - shooting.vx * 10, shooting.y - shooting.vy * 10);
          ctx.stroke();
          shooting.x += shooting.vx; shooting.y += shooting.vy; shooting.life -= 0.015;
          if (shooting.life <= 0) shooting = null;
        }
        requestAnimationFrame(draw);
      }
    }

    resize();
    window.addEventListener('resize', function () { resize(); if (reduce) draw(); });
    draw();
  }

  window.kwUI = { initTheme: initTheme, initStars: initStars };
})();
