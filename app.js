/* Kosmisch Weetje: a 5-question quiz that returns a personal NASA fact. */
(function () {
  'use strict';

  // ---------- Config ----------
  var NASA_API = 'https://api.nasa.gov';
  var IMAGES_API = 'https://images-api.nasa.gov';
  // APOD moved to the NASA Science WordPress API in Sept 2026. On Netlify we call it
  // through a same-origin proxy (see netlify.toml); elsewhere we fall back to the direct URL.
  var APOD_PROXY = '/api/apod/';
  var APOD_DIRECT = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic/';
  var APOD_FIRST_DAY = '1995-06-16';
  var DEMO_KEY = 'DEMO_KEY';
  var EARTH_KM_PER_DAY = 29.78 * 86400; // Earth's mean orbital speed

  // ---------- Content ----------
  // Every answer awards points to one or more cosmic matches.
  var MATCHES = {
    moon: {
      name: 'De Maan', emoji: '🌕', color: '#c9cbe0', query: 'Apollo moon surface astronaut',
      tagline: 'Trouw, rustgevend en altijd dichtbij. Net als jij.',
      facts: [
        'De Maan schuift elk jaar zo\'n 3,8 centimeter van de Aarde weg. Dat meten wetenschappers met laserstralen op spiegels die de Apollo-astronauten op de Maan achterlieten.',
        'Tussen 1969 en 1972 hebben twaalf mensen op de Maan gelopen, tijdens zes Apollo-landingen.',
        'Er is geen wind op de Maan, dus de voetafdrukken van de Apollo-astronauten kunnen er nog miljoenen jaren liggen.'
      ]
    },
    mars: {
      name: 'Mars', emoji: '🔴', color: '#e0653a', query: 'Mars surface rover',
      tagline: 'Avontuurlijk, stoer en klaar voor de volgende grote stap.',
      facts: [
        'Olympus Mons op Mars is de hoogste vulkaan van het zonnestelsel: ongeveer 22 kilometer hoog, zo\'n 2,5 keer de Mount Everest.',
        'Op Mars is een zonsondergang blauwachtig. Het fijne stof in de lucht verstrooit het blauwe licht rond de zon.',
        'Een dag op Mars heet een "sol" en duurt 24 uur en 39 minuten. Je zou er dus elke dag een beetje langer kunnen uitslapen.'
      ]
    },
    jupiter: {
      name: 'Jupiter', emoji: '🟠', color: '#d99a5b', query: 'Jupiter Juno',
      tagline: 'Een natuurlijke leider met een enorme persoonlijkheid.',
      facts: [
        'De Grote Rode Vlek op Jupiter is een storm die groter is dan de Aarde en die al sinds minstens 1830 wordt waargenomen.',
        'Jupiter draait het snelst van alle planeten: een dag duurt er ongeveer 10 uur.',
        'Er passen ongeveer 1.300 Aardes in Jupiter.'
      ]
    },
    saturn: {
      name: 'Saturnus', emoji: '🪐', color: '#e5c07b', query: 'Saturn rings Cassini',
      tagline: 'Stijlvol, creatief en onmogelijk om niet naar te kijken.',
      facts: [
        'Saturnus heeft een lagere dichtheid dan water. In een (onmogelijk) grote badkuip zou de planeet blijven drijven.',
        'De ringen van Saturnus zijn honderdduizenden kilometers breed, maar meestal maar zo\'n 10 meter dik.',
        'Saturnus heeft meer dan 270 bekende manen, meer dan elke andere planeet.'
      ]
    },
    sun: {
      name: 'De Zon', emoji: '☀️', color: '#ffb52e', query: 'Sun solar flare SDO',
      tagline: 'Warm, energiek en het middelpunt van elk gezelschap.',
      facts: [
        'Zonlicht doet er ruim 8 minuten over om de Aarde te bereiken. Je ziet de Zon dus altijd zoals ze 8 minuten geleden was.',
        'De Zon bevat ongeveer 99,8% van alle massa in ons zonnestelsel.',
        'NASA\'s Parker Solar Probe is het snelste door mensen gemaakte object ooit: hij haalde zo\'n 692.000 km/u bij zijn scheervlucht langs de Zon.'
      ]
    },
    europa: {
      name: 'Europa', emoji: '🧊', color: '#8fd3ff', query: 'Europa moon ice',
      tagline: 'Koel aan de buitenkant, maar vol verrassingen vanbinnen.',
      facts: [
        'Onder de ijskorst van Jupiters maan Europa zit waarschijnlijk een oceaan met ongeveer twee keer zoveel water als alle oceanen op Aarde samen.',
        'NASA\'s Europa Clipper werd in oktober 2024 gelanceerd en komt in 2030 aan bij Jupiter om te onderzoeken of Europa leven zou kunnen herbergen.',
        'Europa is iets kleiner dan onze eigen Maan, maar heeft misschien meer vloeibaar water dan de Aarde.'
      ]
    },
    voyager: {
      name: 'Voyager 1', emoji: '🛰️', color: '#7aa7ff', query: 'Voyager spacecraft',
      tagline: 'Een eeuwige ontdekkingsreiziger die nooit stopt.',
      facts: [
        'Voyager 1 werd in 1977 gelanceerd en is het verst verwijderde door mensen gemaakte object. In 2012 verliet hij als eerste de heliosfeer, de bel van de Zon.',
        'Een radiosignaal van Voyager 1 doet er bijna een volle dag over om de Aarde te bereiken.',
        'Aan boord van beide Voyagers zit een gouden plaat met groeten in 55 talen, geluiden van de Aarde en muziek, voor wie hem ooit vindt.'
      ]
    },
    blackhole: {
      name: 'Een zwart gat', emoji: '🕳️', color: '#a46bff', query: 'black hole',
      tagline: 'Mysterieus, diepzinnig en met een onweerstaanbare aantrekkingskracht.',
      facts: [
        'In het centrum van de Melkweg zit Sagittarius A*, een zwart gat dat ongeveer 4 miljoen keer zo zwaar is als de Zon.',
        'In 2019 werd de allereerste foto van een zwart gat gepubliceerd: het monster in sterrenstelsel M87, 6,5 miljard keer zo zwaar als de Zon.',
        'Bij een zwart gat is de zwaartekracht zo sterk dat zelfs licht niet kan ontsnappen. Daarom zie je alleen de gloeiende ring van materie eromheen.'
      ]
    }
  };

  var COLORS = [
    { id: 'rood', label: 'Rood', hex: '#ff4d4d', pts: { mars: 2 }, query: 'Mars surface',
      fact: 'Mars is rood door ijzeroxide (roest) in het stof en de rotsen op het oppervlak.' },
    { id: 'oranje', label: 'Oranje', hex: '#ff9a3c', pts: { jupiter: 2 }, query: 'Titan Cassini',
      fact: 'Saturnus\' maan Titan zit verstopt onder een dikke oranje nevel. Het is de enige maan met een echte, dikke atmosfeer.' },
    { id: 'geel', label: 'Geel', hex: '#ffd84d', pts: { sun: 2 }, query: 'Io volcano Jupiter',
      fact: 'Jupiters maan Io is geel door zwavel. Het is de meest vulkanisch actieve plek van het hele zonnestelsel.' },
    { id: 'groen', label: 'Groen', hex: '#3ee08f', pts: { europa: 2 }, query: 'aurora space station',
      fact: 'Groen noorderlicht ontstaat wanneer deeltjes van de Zon zuurstofatomen hoog in onze atmosfeer laten oplichten. Astronauten in het ISS kijken er van bovenaf op neer.' },
    { id: 'blauw', label: 'Blauw', hex: '#3f8cff', pts: { voyager: 2 }, query: 'Earth from space',
      fact: 'In 1990 fotografeerde Voyager 1 de Aarde vanaf zo\'n 6 miljard kilometer: de beroemde "Pale Blue Dot", een stipje kleiner dan één pixel.' },
    { id: 'paars', label: 'Paars', hex: '#a35cff', pts: { blackhole: 2 }, query: 'Pillars of Creation',
      fact: 'De "Pillars of Creation" in de Arendnevel zijn wolken van gas en stof waarin nieuwe sterren geboren worden. De hoogste zuil is ongeveer 4 lichtjaar hoog.' },
    { id: 'roze', label: 'Roze', hex: '#ff6ec7', pts: { saturn: 2 }, query: 'exoplanet',
      fact: 'Er bestaat een roze planeet! De gasreus GJ 504 b gloeit magenta omdat hij nog heet is van zijn ontstaan.' },
    { id: 'zwart', label: 'Zwart', hex: '#1a1a2e', pts: { blackhole: 1, voyager: 1 }, query: 'Hubble Ultra Deep Field',
      fact: 'In het Hubble Ultra Deep Field, een piepklein stukje "lege" zwarte hemel, staan ongeveer 10.000 sterrenstelsels.' }
  ];

  var DESTINATIONS = [
    { id: 'moon', emoji: '🌕', label: 'De Maan', sub: 'Ons dichtstbijzijnde doel', pts: { moon: 3 },
      trip: 'De Apollo-astronauten deden er ongeveer 3 dagen over om de Maan te bereiken.', distance: '384.400 km' },
    { id: 'mars', emoji: '🔴', label: 'Mars', sub: 'De rode planeet', pts: { mars: 3 },
      trip: 'Een reis naar Mars duurt ongeveer 7 maanden. NASA\'s Perseverance-rover deed er zo\'n 7 maanden over.', distance: 'gemiddeld ca. 225 miljoen km' },
    { id: 'jupiter', emoji: '🟠', label: 'Jupiter', sub: 'Reus met 95+ manen', pts: { jupiter: 2, europa: 1 },
      trip: 'Ruimtesonde Juno werd in 2011 gelanceerd en kwam in 2016 aan bij Jupiter: een reis van bijna 5 jaar.', distance: 'gemiddeld ca. 780 miljoen km van de Zon' },
    { id: 'saturn', emoji: '🪐', label: 'Saturnus', sub: 'Ringen kijken', pts: { saturn: 3 },
      trip: 'Cassini vertrok in 1997 en kwam pas in 2004 aan bij Saturnus: bijna 7 jaar onderweg.', distance: 'gemiddeld ca. 1,4 miljard km van de Zon' },
    { id: 'sun', emoji: '☀️', label: 'Richting de Zon', sub: 'Heet, heter, heetst', pts: { sun: 3 },
      trip: 'Parker Solar Probe vloog in december 2024 op slechts 6,1 miljoen km langs het oppervlak van de Zon, dichterbij dan ooit.', distance: 'ca. 150 miljoen km' },
    { id: 'beyond', emoji: '🌌', label: 'Voorbij het zonnestelsel', sub: 'Naar de sterren', pts: { voyager: 2, blackhole: 1 },
      trip: 'Met de snelheid van Voyager 1 (zo\'n 17 km per seconde) zou je ongeveer 75.000 jaar nodig hebben om de afstand naar de dichtstbijzijnde ster, Proxima Centauri, af te leggen.', distance: '4,24 lichtjaar tot Proxima Centauri' }
  ];

  var ROLES = [
    { id: 'astronaut', emoji: '👩‍🚀', label: 'Astronaut', sub: 'Ik wil zelf de ruimte in', pts: { moon: 2, mars: 2 },
      fact: 'In gewichtloosheid rekt je ruggengraat uit: astronauten in het ISS worden tijdelijk tot zo\'n 5 cm langer.' },
    { id: 'scientist', emoji: '🔬', label: 'Wetenschapper', sub: 'Ik wil alles begrijpen', pts: { europa: 2, blackhole: 1 },
      fact: 'Aan boord van het internationale ruimtestation ISS zijn al meer dan 3.000 wetenschappelijke experimenten uitgevoerd.' },
    { id: 'engineer', emoji: '🛠️', label: 'Ingenieur', sub: 'Ik bouw de raket', pts: { voyager: 2, sun: 1 },
      fact: 'De computers van Voyager hebben maar zo\'n 69 kilobyte geheugen, minder dan één foto op je telefoon, en werken al sinds 1977.' },
    { id: 'lead', emoji: '🎧', label: 'Missieleider', sub: 'Ik hou alles in goede banen', pts: { jupiter: 2, saturn: 1 },
      fact: 'Mission Control in Houston leidt al sinds 1965 bemande NASA-vluchten, te beginnen met Gemini 4.' },
    { id: 'artist', emoji: '📷', label: 'Ruimtefotograaf', sub: 'Ik leg het heelal vast', pts: { saturn: 2, blackhole: 1 },
      fact: 'De hoofdspiegel van de James Webb-ruimtetelescoop is 6,5 meter breed en bestaat uit 18 zeshoekige segmenten met een laagje goud.' }
  ];

  var FASCINATIONS = [
    { id: 'asteroids', emoji: '☄️', label: 'Planetoïden', sub: 'Rotsen die langs de Aarde razen', pts: { mars: 1, jupiter: 1 } },
    { id: 'sun', emoji: '🌞', label: 'Zonnestormen', sub: 'Uitbarstingen op de Zon', pts: { sun: 2 } },
    { id: 'earth', emoji: '🌍', label: 'Onze Aarde', sub: 'Zoals NASA haar vandaag ziet', pts: { moon: 2 } },
    { id: 'deep', emoji: '🌌', label: 'Zwarte gaten & sterrenstelsels', sub: 'Het diepe heelal', pts: { blackhole: 2 } }
  ];

  var PLANETS = [
    { name: 'Mercurius', emoji: '☿️', days: 87.97 },
    { name: 'Venus', emoji: '♀️', days: 224.70 },
    { name: 'Mars', emoji: '🔴', days: 686.98 },
    { name: 'Jupiter', emoji: '🟠', days: 4332.59 },
    { name: 'Saturnus', emoji: '🪐', days: 10759.22 },
    { name: 'Neptunus', emoji: '🔵', days: 60190 }
  ];

  var QUESTIONS = [
    { key: 'birth', type: 'date', title: 'Wanneer ben je geboren?', hint: 'Zo zoeken we de ruimtefoto en de planetoïde van jouw geboortedag op.' },
    { key: 'color', type: 'color', title: 'Wat is je lievelingskleur?', hint: 'Elke kleur heeft een plek in het heelal.' },
    { key: 'dest', type: 'choice', options: DESTINATIONS, title: 'Je krijgt een gratis ruimtereis. Waar ga je heen?', hint: 'Kies je droombestemming.' },
    { key: 'role', type: 'choice', options: ROLES, title: 'Welke rol pak jij op een NASA-missie?', hint: 'Iedereen is nodig om een raket te lanceren.' },
    { key: 'fasc', type: 'choice', options: FASCINATIONS, title: 'Wat maakt je het nieuwsgierigst?', hint: 'Hierover halen we live data op bij NASA.' }
  ];

  // ---------- State ----------
  var state = { step: 0, name: '', answers: {}, match: null, factIndex: 0 };

  // ---------- Helpers ----------
  var $ = function (sel) { return document.querySelector(sel); };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(url) {
    return /^https:\/\//i.test(url || '') ? url : '';
  }

  function storage(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  function apiKey() { return storage('kw-api-key') || DEMO_KEY; }

  function nf(n, digits) {
    return Number(n).toLocaleString('nl-BE', { maximumFractionDigits: digits || 0, minimumFractionDigits: digits || 0 });
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function todayIso() { return iso(new Date()); }

  function formatDate(s) {
    return parseIso(s).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function ageInfo(birth) {
    var b = parseIso(birth), now = new Date();
    var days = Math.floor((now - b) / 86400000);
    var years = now.getFullYear() - b.getFullYear();
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) years--;
    return { days: days, years: years };
  }

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function ApiError(message, status) { this.message = message; this.status = status; }

  function fetchJson(url) {
    return fetch(url).then(function (res) {
      var type = res.headers.get('content-type') || '';
      if (res.status === 429) throw new ApiError('rate', 429);
      if (res.status === 403) throw new ApiError('key', 403);
      if (!res.ok) throw new ApiError('HTTP ' + res.status, res.status);
      if (type.indexOf('json') === -1) throw new ApiError('Geen JSON', res.status);
      return res.json();
    });
  }

  function nasa(path, params) {
    var q = new URLSearchParams(params || {});
    q.set('api_key', apiKey());
    return fetchJson(NASA_API + path + '?' + q.toString());
  }

  function errorText(err) {
    if (err && err.status === 429) {
      return 'NASA zegt dat de limiet van deze sleutel bereikt is. ' +
        (apiKey() === DEMO_KEY ? 'De DEMO_KEY is gedeeld en snel op; voeg via 🔑 gratis je eigen sleutel toe.' : 'Probeer het over een uurtje opnieuw.');
    }
    if (err && err.status === 403) return 'Deze API-sleutel wordt niet geaccepteerd. Controleer hem via 🔑.';
    return 'Deze data kon niet geladen worden. Probeer het later opnieuw.';
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

  // ---------- API key dialog ----------
  function updateKeyStatus() {
    var own = apiKey() !== DEMO_KEY;
    var el = $('#key-status');
    el.textContent = own ? 'EIGEN' : 'DEMO';
    el.classList.toggle('is-own', own);
  }

  function initKeyDialog() {
    var dialog = $('#key-dialog');
    var input = $('#key-input');
    $('#key-btn').addEventListener('click', function () {
      input.value = apiKey() === DEMO_KEY ? '' : apiKey();
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
      input.focus();
    });
    $('#key-form').addEventListener('submit', function (e) {
      var v = input.value.trim();
      if (v && !/^[A-Za-z0-9_]{8,64}$/.test(v)) {
        e.preventDefault();
        toast('Dat lijkt geen geldige NASA-sleutel (alleen letters en cijfers).');
        return;
      }
      storage('kw-api-key', v && v !== DEMO_KEY ? v : null);
      updateKeyStatus();
      toast(v ? '🔑 Eigen sleutel opgeslagen.' : 'De DEMO_KEY wordt gebruikt.');
    });
    $('#key-reset').addEventListener('click', function () {
      storage('kw-api-key', null);
      updateKeyStatus();
      dialog.close();
      toast('De DEMO_KEY wordt gebruikt.');
    });
    updateKeyStatus();
  }

  // ---------- Screens ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('is-active', s.id === id); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Quiz ----------
  function renderChoice(q, current) {
    return '<div class="options" role="radiogroup">' + q.options.map(function (o) {
      var id = q.key + '-' + o.id;
      return '<div class="option"><input type="radio" name="' + q.key + '" id="' + id + '" value="' + o.id + '"' +
        (current === o.id ? ' checked' : '') + '><label for="' + id + '">' +
        '<span class="opt-emoji" aria-hidden="true">' + o.emoji + '</span>' +
        '<span class="opt-title">' + esc(o.label) + '</span>' +
        '<span class="opt-sub">' + esc(o.sub) + '</span></label></div>';
    }).join('') + '</div>';
  }

  function renderColor(q, current) {
    return '<div class="options swatches" role="radiogroup">' + COLORS.map(function (c) {
      var id = 'color-' + c.id;
      return '<div class="option"><input type="radio" name="color" id="' + id + '" value="' + c.id + '"' +
        (current === c.id ? ' checked' : '') + '><label for="' + id + '">' +
        '<span class="swatch-dot" style="--dot:' + c.hex + '" aria-hidden="true"></span>' +
        '<span class="opt-title">' + esc(c.label) + '</span></label></div>';
    }).join('') + '</div>';
  }

  function renderDate(q, current) {
    return '<div class="date-wrap"><label for="birth-input" class="visually-hidden">Geboortedatum</label>' +
      '<input type="date" id="birth-input" name="birth" min="1900-01-01" max="' + todayIso() + '" value="' + (current || '') + '" required>' +
      '<p class="age-preview" id="age-preview"></p></div>';
  }

  function updateAgePreview() {
    var input = $('#birth-input');
    var out = $('#age-preview');
    if (!input || !out) return;
    var v = input.value;
    if (!v || v > todayIso() || v < '1900-01-01') { out.textContent = ''; return; }
    var a = ageInfo(v);
    out.textContent = '🌍 Je bent al ' + nf(a.days) + ' dagen op reis rond de Zon!';
  }

  function renderQuestion() {
    var q = QUESTIONS[state.step];
    var current = state.answers[q.key];
    var total = QUESTIONS.length;
    var pct = (state.step / total) * 100;
    $('#progress-fill').style.width = pct + '%';
    $('#progress-rocket').style.left = 'calc(' + pct + '% - ' + (pct / 100 * 30) + 'px)';
    $('#step-label').textContent = 'Vraag ' + (state.step + 1) + ' van ' + total;
    var title = q.title;
    if (state.step === 0 && state.name) title = state.name + ', wanneer ben je geboren?';
    $('#q-title').textContent = title;
    $('#q-hint').textContent = q.hint;
    $('#q-error').hidden = true;
    $('#back-btn').textContent = state.step === 0 ? '← Start' : '← Terug';
    $('#next-btn').textContent = state.step === total - 1 ? '🚀 Lanceer!' : 'Volgende →';

    var body = $('#q-body');
    if (q.type === 'date') body.innerHTML = renderDate(q, current);
    else if (q.type === 'color') body.innerHTML = renderColor(q, current);
    else body.innerHTML = renderChoice(q, current);

    if (q.type === 'date') {
      var input = $('#birth-input');
      input.addEventListener('input', updateAgePreview);
      updateAgePreview();
    } else {
      // Picking an option moves on automatically, for a snappy feel.
      body.querySelectorAll('input[type="radio"]').forEach(function (r) {
        r.addEventListener('change', function () {
          clearTimeout(renderQuestion.auto);
          renderQuestion.auto = setTimeout(next, 380);
        });
      });
    }
    $('#q-title').focus({ preventScroll: true });
  }

  function readAnswer() {
    var q = QUESTIONS[state.step];
    if (q.type === 'date') {
      var v = $('#birth-input').value;
      if (!v) return 'Kies je geboortedatum.';
      if (v > todayIso()) return 'Die datum ligt in de toekomst. Ben je een tijdreiziger? 😉';
      if (v < '1900-01-01') return 'Kies een datum vanaf 1900.';
      state.answers.birth = v;
      return null;
    }
    var picked = document.querySelector('input[name="' + q.key + '"]:checked');
    if (!picked) return 'Kies een antwoord om verder te gaan.';
    state.answers[q.key] = picked.value;
    return null;
  }

  function next() {
    var err = readAnswer();
    if (err) {
      var el = $('#q-error');
      el.textContent = err;
      el.hidden = false;
      return;
    }
    if (state.step < QUESTIONS.length - 1) {
      state.step++;
      renderQuestion();
    } else {
      launch();
    }
  }

  function back() {
    clearTimeout(renderQuestion.auto);
    if (state.step === 0) { show('screen-intro'); return; }
    state.step--;
    renderQuestion();
  }

  // ---------- Matching ----------
  function find(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  function computeMatch() {
    var a = state.answers;
    var scores = {};
    Object.keys(MATCHES).forEach(function (k) { scores[k] = 0; });
    var reasons = [];

    function add(pts, reason) {
      Object.keys(pts).forEach(function (k) { scores[k] += pts[k]; });
      reasons.push(reason);
    }

    var age = ageInfo(a.birth).years;
    var agePts = age < 13 ? { moon: 1 } : age < 25 ? { mars: 1 } : age < 45 ? { europa: 1 } : age < 65 ? { saturn: 1 } : { voyager: 1 };
    add(agePts, 'Leeftijd ' + age + ' jaar → ' + MATCHES[Object.keys(agePts)[0]].name);

    var color = find(COLORS, a.color);
    add(color.pts, 'Lievelingskleur ' + color.label.toLowerCase() + ' → ' + Object.keys(color.pts).map(function (k) { return MATCHES[k].name; }).join(' & '));

    [['dest', DESTINATIONS, 'Bestemming'], ['role', ROLES, 'Rol'], ['fasc', FASCINATIONS, 'Nieuwsgierig naar']].forEach(function (row) {
      var o = find(row[1], a[row[0]]);
      add(o.pts, row[2] + ': ' + o.label + ' → ' + Object.keys(o.pts).map(function (k) { return MATCHES[k].name; }).join(' & '));
    });

    // Highest score wins; ties are broken by a stable hash of the birthday so the result feels personal.
    var keys = Object.keys(scores);
    var best = Math.max.apply(null, keys.map(function (k) { return scores[k]; }));
    var top = keys.filter(function (k) { return scores[k] === best; });
    var winner = top[hash(a.birth + a.color) % top.length];
    return { key: winner, score: best, reasons: reasons };
  }

  // ---------- Launch sequence ----------
  function launch() {
    show('screen-launch');
    var msgs = ['Contact maken met NASA…', 'Sterrenkaarten laden…', 'Koers berekenen…'];
    var n = 3;
    var launchEl = document.querySelector('.launch');
    launchEl.classList.remove('lift');
    $('#countdown').textContent = n;
    $('#launch-msg').textContent = msgs[0];
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tick = setInterval(function () {
      n--;
      if (n > 0) {
        $('#countdown').textContent = n;
        $('#launch-msg').textContent = msgs[3 - n];
      } else {
        clearInterval(tick);
        $('#countdown').textContent = 'Lift-off!';
        launchEl.classList.add('lift');
        setTimeout(showResult, reduce ? 0 : 700);
      }
    }, reduce ? 250 : 700);
  }

  // ---------- Result ----------
  function showResult() {
    var m = computeMatch();
    state.match = m;
    var match = MATCHES[m.key];
    state.factIndex = hash(state.answers.birth) % match.facts.length;

    $('#match-card').style.setProperty('--match-color', match.color);
    $('#match-eyebrow').textContent = state.name ? state.name + ', jouw kosmische match is' : 'Jouw kosmische match is';
    $('#match-title').textContent = match.name + ' ' + match.emoji;
    $('#match-tagline').textContent = match.tagline;
    $('#match-fact').textContent = match.facts[state.factIndex];
    $('#match-emoji').textContent = match.emoji;
    $('#match-emoji').hidden = false;
    var img = $('#match-img');
    img.hidden = true;
    img.removeAttribute('src');
    $('#why-list').innerHTML = m.reasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');

    show('screen-result');
    storage('kw-last', JSON.stringify({ name: state.name, answers: state.answers }));

    searchImages(match.query).then(function (items) {
      var pick = items[hash(state.answers.birth) % items.length];
      if (!pick) return;
      img.onload = function () { img.hidden = false; $('#match-emoji').hidden = true; };
      img.alt = pick.title;
      img.src = pick.thumb;
    }).catch(function () { /* the emoji stays as visual */ });

    renderApod();
    renderAge();
    renderAsteroid();
    renderColorCard();
    renderTrip();
    renderRole();
    renderLive();
  }

  function cardLoading(el, kicker, title) {
    el.innerHTML = '<p class="card-kicker">' + esc(kicker) + '</p><h4>' + esc(title) + '</h4>' +
      '<div class="skeleton tall"></div><div class="skeleton"></div><div class="skeleton" style="width:60%"></div>';
  }

  function cardError(el, kicker, title, err) {
    el.innerHTML = '<p class="card-kicker">' + esc(kicker) + '</p><h4>' + esc(title) + '</h4>' +
      '<p class="error-msg">' + esc(errorText(err)) + '</p>';
  }

  // APOD: picture of the day on your birthday (or your first birthday after APOD started).
  function apodDateFor(birth) {
    if (birth >= APOD_FIRST_DAY) return { date: birth, exact: true };
    var b = parseIso(birth);
    var year = 1995;
    var candidate;
    do {
      candidate = new Date(year, b.getMonth(), b.getDate());
      if (candidate.getMonth() !== b.getMonth()) candidate = new Date(year, b.getMonth() + 1, 0); // 29 Feb
      year++;
    } while (iso(candidate) < APOD_FIRST_DAY);
    return { date: iso(candidate), exact: false };
  }

  function fetchApod(date) {
    var id = date.slice(2, 4) + date.slice(5, 7) + date.slice(8, 10);
    var key = '?api_key=' + encodeURIComponent(apiKey());
    return fetchJson(APOD_PROXY + id + key).catch(function () {
      return fetchJson(APOD_DIRECT + id + key);
    }).then(function (data) {
      var d = Array.isArray(data) ? data[0] : data;
      if (!d || !d.title) throw new ApiError('Geen APOD', 404);
      return d;
    });
  }

  function cleanText(s) {
    return String(s || '').replace(/^\s*Explanation:\s*/i, '').replace(/^\s*(Image\s+)?Credit\s*(&|and)?\s*(Copyright)?:\s*/i, '').trim();
  }

  function renderApod() {
    var el = $('#card-apod');
    var target = apodDateFor(state.answers.birth);
    cardLoading(el, 'Astronomy Picture of the Day', 'De ruimtefoto van jouw dag');
    fetchApod(target.date).then(function (d) {
      var intro = target.exact
        ? 'Op de dag dat jij geboren werd (' + formatDate(target.date) + ') koos NASA deze foto:'
        : 'APOD bestaat sinds juni 1995. Op je eerste verjaardag daarna, ' + formatDate(target.date) + ', toonde NASA deze foto:';
      var image = safeUrl(d.hdurl);
      var link = safeUrl(d.permalink) || safeUrl(d.url);
      var credit = cleanText(d.copyright || d.credit);
      el.innerHTML =
        '<p class="card-kicker">Astronomy Picture of the Day</p>' +
        '<div class="apod">' +
          (image ? '<a href="' + esc(link || image) + '" target="_blank" rel="noopener"><img src="' + esc(image) + '" alt="' + esc(d.alt && !/^See Explanation/i.test(d.alt) ? d.alt : d.title) + '" loading="lazy"></a>'
                 : '<div class="big">🎬</div>') +
          '<div><h4>' + esc(d.title) + '</h4>' +
          '<p>' + esc(intro) + '</p>' +
          '<div class="explain">' + esc(cleanText(d.explanation)) + '</div>' +
          (credit ? '<p class="source">📷 ' + esc(credit) + '</p>' : '') +
          (link ? '<p class="source"><a href="' + esc(link) + '" target="_blank" rel="noopener">Bekijk op NASA Science →</a></p>' : '') +
          '<p class="source">Tekst van NASA (Engels).</p></div>' +
        '</div>';
    }).catch(function (err) { cardError(el, 'Astronomy Picture of the Day', 'De ruimtefoto van jouw dag', err); });
  }

  function renderAge() {
    var el = $('#card-age');
    var a = ageInfo(state.answers.birth);
    var km = a.days * EARTH_KM_PER_DAY;
    var rows = PLANETS.map(function (p) {
      var yrs = a.days / p.days;
      return '<li><span>' + p.emoji + ' ' + p.name + '</span><strong>' + nf(yrs, yrs < 10 ? 1 : 0) + ' jaar</strong></li>';
    }).join('');
    el.innerHTML =
      '<p class="card-kicker">Jouw leeftijd in het zonnestelsel</p>' +
      '<h4>Op Aarde ben je ' + a.years + ', maar…</h4>' +
      '<ul class="planet-ages">' + rows + '</ul>' +
      '<p class="source">Je hebt al ongeveer <b>' + nf(km / 1e9, 1) + ' miljard km</b> rond de Zon gereisd, aan 107.000 km/u.</p>';
  }

  function renderAsteroid() {
    var el = $('#card-asteroid');
    var date = state.answers.birth;
    cardLoading(el, 'Asteroids · NeoWs', 'Jouw geboorte-planetoïde');
    nasa('/neo/rest/v1/feed', { start_date: date, end_date: date }).then(function (data) {
      var list = (data.near_earth_objects && data.near_earth_objects[date]) || [];
      if (!list.length) {
        el.innerHTML = '<p class="card-kicker">Asteroids · NeoWs</p><h4>Jouw geboorte-planetoïde</h4>' +
          '<p>Op jouw geboortedag heeft NASA geen planetoïde geregistreerd die dicht langs de Aarde scheerde. Een rustige dag in de ruimte!</p>';
        return;
      }
      list.sort(function (x, y) {
        return +x.close_approach_data[0].miss_distance.kilometers - +y.close_approach_data[0].miss_distance.kilometers;
      });
      var neo = list[0];
      var ca = neo.close_approach_data[0];
      var lunar = +ca.miss_distance.lunar;
      var dia = neo.estimated_diameter.meters;
      var size = (dia.estimated_diameter_min + dia.estimated_diameter_max) / 2;
      var hazardous = list.filter(function (n) { return n.is_potentially_hazardous_asteroid; }).length;
      el.innerHTML =
        '<p class="card-kicker">Asteroids · NeoWs</p>' +
        '<h4>☄️ ' + esc(neo.name.replace(/[()]/g, '')) + '</h4>' +
        '<p>Op de dag dat jij geboren werd, scheerden er <b>' + list.length + '</b> planetoïden langs de Aarde. Deze kwam het dichtstbij:</p>' +
        '<div class="stat-row">' +
          '<div class="stat"><b>' + nf(+ca.miss_distance.kilometers / 1e6, 1) + ' mln km</b><span>' + nf(lunar, 1) + '× de afstand tot de Maan</span></div>' +
          '<div class="stat"><b>' + nf(size) + ' m</b><span>geschatte doorsnede</span></div>' +
          '<div class="stat"><b>' + nf(+ca.relative_velocity.kilometers_per_hour) + '</b><span>km/u</span></div>' +
        '</div>' +
        (hazardous ? '<p><span class="pill warn">' + hazardous + ' als "potentieel gevaarlijk" geclassificeerd</span></p>' : '') +
        (safeUrl(neo.nasa_jpl_url) ? '<p class="source"><a href="' + esc(neo.nasa_jpl_url) + '" target="_blank" rel="noopener">Bekijk de baan bij NASA JPL →</a></p>' : '');
    }).catch(function (err) { cardError(el, 'Asteroids · NeoWs', 'Jouw geboorte-planetoïde', err); });
  }

  function searchImages(query) {
    var q = new URLSearchParams({ q: query, media_type: 'image', page_size: '30' });
    return fetchJson(IMAGES_API + '/search?' + q.toString()).then(function (data) {
      return ((data.collection && data.collection.items) || []).map(function (it) {
        var meta = (it.data && it.data[0]) || {};
        var link = (it.links || []).filter(function (l) { return l.render === 'image' || /\.(jpe?g|png)$/i.test(l.href || ''); })[0];
        return {
          title: meta.title || 'NASA-beeld',
          description: meta.description || '',
          date: meta.date_created || '',
          id: meta.nasa_id,
          thumb: link ? safeUrl(link.href) : ''
        };
      }).filter(function (x) { return x.thumb && x.id; });
    });
  }

  function imageCard(el, kicker, title, text, query) {
    cardLoading(el, kicker, title);
    searchImages(query).then(function (items) {
      var pick = items.length ? items[Math.floor(Math.random() * items.length)] : null;
      el.innerHTML =
        '<p class="card-kicker">' + esc(kicker) + '</p><h4>' + esc(title) + '</h4>' +
        (pick ? '<a href="https://images.nasa.gov/details/' + encodeURIComponent(pick.id) + '" target="_blank" rel="noopener">' +
          '<img class="thumb" src="' + esc(pick.thumb) + '" alt="' + esc(pick.title) + '" loading="lazy"></a>' : '') +
        '<p>' + esc(text) + '</p>' +
        (pick ? '<p class="source">🖼️ ' + esc(pick.title) + ' · NASA Image Library</p>' : '');
    }).catch(function () {
      el.innerHTML = '<p class="card-kicker">' + esc(kicker) + '</p><h4>' + esc(title) + '</h4><p>' + esc(text) + '</p>';
    });
  }

  function renderColorCard() {
    var c = find(COLORS, state.answers.color);
    imageCard($('#card-color'), 'Jouw kleur in de ruimte', c.label + ' in het heelal', c.fact, c.query);
  }

  function renderTrip() {
    var d = find(DESTINATIONS, state.answers.dest);
    var el = $('#card-trip');
    el.innerHTML =
      '<p class="card-kicker">Jouw droomreis</p>' +
      '<h4>' + d.emoji + ' ' + esc(d.label) + '</h4>' +
      '<div class="stat-row"><div class="stat"><b>' + esc(d.distance) + '</b><span>afstand</span></div></div>' +
      '<p>' + esc(d.trip) + '</p>';
  }

  function renderRole() {
    var r = find(ROLES, state.answers.role);
    imageCard($('#card-role'), 'Jouw rol op de missie', r.emoji + ' ' + r.label, r.fact,
      { astronaut: 'astronaut spacewalk', scientist: 'space station experiment', engineer: 'NASA engineers spacecraft', lead: 'Mission Control Houston', artist: 'James Webb Space Telescope image' }[r.id]);
  }

  // Live data based on the last question.
  function renderLive() {
    var el = $('#card-live');
    var f = state.answers.fasc;
    if (f === 'asteroids') return liveAsteroids(el);
    if (f === 'sun') return liveFlares(el);
    if (f === 'earth') return liveEarth(el);
    return liveDeep(el);
  }

  function liveAsteroids(el) {
    var kicker = 'Live · NeoWs';
    var title = 'Planetoïden die vandaag langs de Aarde vliegen';
    cardLoading(el, kicker, title);
    var today = todayIso();
    nasa('/neo/rest/v1/feed', { start_date: today, end_date: today }).then(function (data) {
      var list = (data.near_earth_objects && data.near_earth_objects[today]) || [];
      if (!list.length) throw new ApiError('Leeg', 404);
      var byDist = list.slice().sort(function (x, y) { return +x.close_approach_data[0].miss_distance.lunar - +y.close_approach_data[0].miss_distance.lunar; });
      var bySize = list.slice().sort(function (x, y) { return y.estimated_diameter.meters.estimated_diameter_max - x.estimated_diameter.meters.estimated_diameter_max; });
      var hazardous = list.filter(function (n) { return n.is_potentially_hazardous_asteroid; }).length;
      var close = byDist[0], big = bySize[0];
      el.innerHTML =
        '<p class="card-kicker">' + kicker + '</p><h4>☄️ ' + title + '</h4>' +
        '<div class="stat-row">' +
          '<div class="stat"><b>' + list.length + '</b><span>planetoïden vandaag</span></div>' +
          '<div class="stat"><b>' + hazardous + '</b><span>"potentieel gevaarlijk"</span></div>' +
          '<div class="stat"><b>' + nf(+close.close_approach_data[0].miss_distance.lunar, 1) + '×</b><span>maanafstand: dichtstbij (' + esc(close.name.replace(/[()]/g, '')) + ')</span></div>' +
          '<div class="stat"><b>~' + nf(big.estimated_diameter.meters.estimated_diameter_max) + ' m</b><span>grootste (' + esc(big.name.replace(/[()]/g, '')) + ')</span></div>' +
        '</div>' +
        '<p>Geen paniek: "potentieel gevaarlijk" betekent alleen dat een planetoïde groot is en een baan heeft die in de buurt van de Aarde komt. NASA houdt ze allemaal nauwlettend in de gaten.</p>';
    }).catch(function (err) { cardError(el, kicker, title, err); });
  }

  function liveFlares(el) {
    var kicker = 'Live · DONKI';
    var title = 'Zonnevlammen van de afgelopen 30 dagen';
    cardLoading(el, kicker, title);
    var end = new Date();
    var start = new Date(end.getTime() - 30 * 86400000);
    nasa('/DONKI/FLR', { startDate: iso(start), endDate: iso(end) }).then(function (data) {
      var list = Array.isArray(data) ? data : [];
      var rank = { A: 0, B: 1, C: 2, M: 3, X: 4 };
      function power(f) { var c = f.classType || 'A0'; return rank[c[0]] * 100 + parseFloat(c.slice(1) || 0); }
      var xCount = list.filter(function (f) { return (f.classType || '')[0] === 'X'; }).length;
      var mCount = list.filter(function (f) { return (f.classType || '')[0] === 'M'; }).length;
      var strongest = list.slice().sort(function (a, b) { return power(b) - power(a); })[0];
      el.innerHTML =
        '<p class="card-kicker">' + kicker + '</p><h4>🌞 ' + title + '</h4>' +
        '<div class="stat-row">' +
          '<div class="stat"><b>' + list.length + '</b><span>zonnevlammen geregistreerd</span></div>' +
          '<div class="stat"><b>' + xCount + '</b><span>X-klasse (de krachtigste)</span></div>' +
          '<div class="stat"><b>' + mCount + '</b><span>M-klasse</span></div>' +
          (strongest ? '<div class="stat"><b>' + esc(strongest.classType) + '</b><span>sterkste, op ' + esc(formatDate(strongest.peakTime ? strongest.peakTime.slice(0, 10) : strongest.beginTime.slice(0, 10))) + '</span></div>' : '') +
        '</div>' +
        '<p>Zonnevlammen worden ingedeeld in klassen A, B, C, M en X. Elke klasse is tien keer krachtiger dan de vorige. Sterke vlammen kunnen radioverkeer verstoren en zorgen soms voor prachtig noorderlicht.</p>' +
        (list.length ? '' : '<p>De Zon was de afgelopen maand opvallend rustig.</p>');
    }).catch(function (err) { cardError(el, kicker, title, err); });
  }

  function liveEarth(el) {
    var kicker = 'Live · EPIC (DSCOVR)';
    var title = 'De Aarde zoals NASA haar het laatst zag';
    cardLoading(el, kicker, title);
    nasa('/EPIC/api/natural/images').then(function (data) {
      if (!Array.isArray(data) || !data.length) throw new ApiError('Leeg', 404);
      var shot = data[Math.floor(data.length / 2)];
      var d = shot.date.slice(0, 10).split('-');
      var src = 'https://epic.gsfc.nasa.gov/archive/natural/' + d[0] + '/' + d[1] + '/' + d[2] + '/jpg/' + encodeURIComponent(shot.image) + '.jpg';
      var c = shot.centroid_coordinates || {};
      el.innerHTML =
        '<p class="card-kicker">' + kicker + '</p><h4>🌍 ' + title + '</h4>' +
        '<div class="apod">' +
          '<img src="' + esc(src) + '" alt="De Aarde gefotografeerd door de EPIC-camera" loading="lazy">' +
          '<div><p>Deze foto werd gemaakt op <b>' + esc(formatDate(shot.date.slice(0, 10))) + '</b> om ' + esc(shot.date.slice(11, 16)) + ' (UTC) door de EPIC-camera op satelliet DSCOVR.</p>' +
          '<p>DSCOVR hangt op zo\'n 1,5 miljoen kilometer van de Aarde, op een punt tussen de Aarde en de Zon. Daardoor ziet hij altijd de volledig verlichte kant van onze planeet.</p>' +
          (c.lat != null ? '<p class="source">📍 Midden van de foto: ' + nf(c.lat, 1) + '°, ' + nf(c.lon, 1) + '°</p>' : '') +
          '</div></div>';
    }).catch(function (err) { cardError(el, kicker, title, err); });
  }

  function liveDeep(el) {
    var kicker = 'NASA Image Library';
    var title = 'Uit het diepe heelal';
    cardLoading(el, kicker, title);
    var topics = ['black hole', 'galaxy Hubble', 'nebula Webb', 'Andromeda galaxy'];
    searchImages(topics[Math.floor(Math.random() * topics.length)]).then(function (items) {
      if (!items.length) throw new ApiError('Leeg', 404);
      var pick = items[Math.floor(Math.random() * items.length)];
      var desc = pick.description.replace(/<[^>]*>/g, '');
      if (desc.length > 600) desc = desc.slice(0, 600).replace(/\s+\S*$/, '') + '…';
      el.innerHTML =
        '<p class="card-kicker">' + kicker + '</p><h4>🌌 ' + title + '</h4>' +
        '<div class="apod">' +
          '<a href="https://images.nasa.gov/details/' + encodeURIComponent(pick.id) + '" target="_blank" rel="noopener"><img src="' + esc(pick.thumb) + '" alt="' + esc(pick.title) + '" loading="lazy"></a>' +
          '<div><h4>' + esc(pick.title) + '</h4>' +
          '<div class="explain">' + esc(desc) + '</div>' +
          (pick.date ? '<p class="source">📅 ' + esc(formatDate(pick.date.slice(0, 10))) + ' · Tekst van NASA (Engels).</p>' : '') +
          '</div></div>';
    }).catch(function (err) { cardError(el, kicker, title, err); });
  }

  // ---------- Actions ----------
  function anotherFact() {
    var match = MATCHES[state.match.key];
    state.factIndex = (state.factIndex + 1) % match.facts.length;
    var el = $('#match-fact');
    el.classList.remove('swap');
    void el.offsetWidth;
    el.classList.add('swap');
    el.textContent = match.facts[state.factIndex];
  }

  function share() {
    var match = MATCHES[state.match.key];
    var text = 'Mijn kosmische match is ' + match.name + ' ' + match.emoji + '! NASA-weetje: ' + match.facts[state.factIndex];
    var url = location.href.split('#')[0];
    if (navigator.share) {
      navigator.share({ title: 'Kosmisch Weetje', text: text, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + ' ' + url).then(function () { toast('📋 Gekopieerd naar je klembord!'); },
        function () { toast('Kopiëren lukte niet.'); });
    } else {
      toast(text);
    }
  }

  function restart() {
    state.step = 0;
    state.answers = {};
    state.match = null;
    show('screen-intro');
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    initStars();
    initKeyDialog();

    try {
      var last = JSON.parse(storage('kw-last') || 'null');
      if (last && last.name) $('#name-input').value = last.name;
    } catch (e) {}

    $('#intro-form').addEventListener('submit', function (e) {
      e.preventDefault();
      state.name = $('#name-input').value.trim().slice(0, 30);
      state.step = 0;
      show('screen-quiz');
      renderQuestion();
    });
    $('#quiz-form').addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(renderQuestion.auto); next(); });
    $('#back-btn').addEventListener('click', back);
    $('#another-fact').addEventListener('click', anotherFact);
    $('#share-btn').addEventListener('click', share);
    $('#restart-btn').addEventListener('click', restart);
    $('#brand-link').addEventListener('click', function (e) { e.preventDefault(); restart(); });
  }

  init();
})();
