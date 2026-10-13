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
  var state = { step: 0, name: '', answers: {}, match: null, factIndex: 0, user: null, profileName: '', profile: {}, avatarUrl: '', onboarding: false };

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
    if (current === undefined && q.key === 'birth') current = state.profile.birth_date || undefined;
    if (current === undefined && q.key === 'color') current = state.profile.favorite_color || undefined;
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
    saveResult(m);

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
    loadHistory();
  }

  // ---------- Account (Supabase) ----------
  var db = window.kwAuth.client;

  var AVATAR_EMOJIS = ['👩‍🚀', '🧑‍🚀', '👨‍🚀', '👽', '🤖', '🛸', '🚀', '🌙', '⭐', '🪐', '☄️', '🌍'];
  var DEFAULT_EMOJI = '🧑‍🚀';

  function displayName() {
    return state.profileName || (state.user && state.user.email ? state.user.email.split('@')[0] : '');
  }

  // Paint an avatar (photo or emoji) into an element.
  function paintAvatar(el, url, emoji) {
    el.textContent = '';
    if (url) {
      var img = document.createElement('img');
      img.src = url;
      img.alt = '';
      el.appendChild(img);
    } else {
      el.textContent = emoji || DEFAULT_EMOJI;
    }
  }

  function renderUser() {
    $('#user-name').textContent = displayName();
    $('#user-email').textContent = state.user.email || '';
    paintAvatar($('#user-avatar'), state.avatarUrl, state.profile.avatar_emoji);
    $('#user-menu').hidden = false;
    if (!$('#name-input').value) $('#name-input').value = state.profileName;
  }

  function refreshAvatarUrl() {
    var path = state.profile.avatar_path;
    if (!path) { state.avatarUrl = ''; return Promise.resolve(); }
    return db.storage.from('avatars').createSignedUrl(path, 60 * 60).then(function (r) {
      state.avatarUrl = r.error ? '' : r.data.signedUrl;
    });
  }

  function loadProfile() {
    return db.from('profiles')
      .select('display_name, bio, avatar_emoji, avatar_path, birth_date, favorite_color, onboarded_at, created_at')
      .eq('id', state.user.id).maybeSingle()
      .then(function (r) {
        state.profile = (!r.error && r.data) ? r.data : {};
        state.profileName = state.profile.display_name || '';
        if (!state.profileName && state.user.user_metadata && state.user.user_metadata.display_name) {
          state.profileName = String(state.user.user_metadata.display_name).slice(0, 30);
        }
        return refreshAvatarUrl();
      })
      .then(function () {
        renderUser();
        // First visit: ask the user to create their profile before the first mission.
        if (state.profile.created_at && !state.profile.onboarded_at) openProfile(true);
      });
  }

  function saveName(name) {
    if (!name || name === state.profileName) return;
    state.profileName = name;
    state.profile.display_name = name;
    renderUser();
    db.from('profiles').update({ display_name: name }).eq('id', state.user.id)
      .then(function (r) { if (r.error) console.warn('Naam opslaan mislukt', r.error); });
  }

  // ---------- Profile screen ----------
  var draft = { emoji: '', file: null, removePhoto: false, previewUrl: '' };

  function renderAvatarPicker() {
    $('#avatar-picker').innerHTML = AVATAR_EMOJIS.map(function (e, i) {
      var id = 'av-' + i;
      return '<span class="option avatar-opt"><input type="radio" name="avatar-emoji" id="' + id + '" value="' + e + '"' +
        (draft.emoji === e && !hasPhoto() ? ' checked' : '') + '><label for="' + id + '" title="Kies ' + e + '">' + e + '</label></span>';
    }).join('');
    $('#avatar-picker').querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        draft.emoji = inp.value;
        draft.file = null;
        draft.removePhoto = !!state.profile.avatar_path;
        if (draft.previewUrl) { URL.revokeObjectURL(draft.previewUrl); draft.previewUrl = ''; }
        paintPreview();
      });
    });
  }

  function hasPhoto() {
    return !!draft.previewUrl || (!!state.avatarUrl && !draft.removePhoto);
  }

  function paintPreview() {
    var url = draft.previewUrl || (draft.removePhoto ? '' : state.avatarUrl);
    paintAvatar($('#profile-avatar-preview'), url, draft.emoji);
    $('#avatar-remove').hidden = !url;
  }

  function renderColorPicker(selected) {
    var none = '<span class="option color-opt"><input type="radio" name="fav-color" id="fc-none" value=""' + (!selected ? ' checked' : '') +
      '><label for="fc-none"><span class="swatch-dot none" aria-hidden="true"></span>Geen</label></span>';
    $('#color-picker').innerHTML = none + COLORS.map(function (c) {
      var id = 'fc-' + c.id;
      return '<span class="option color-opt"><input type="radio" name="fav-color" id="' + id + '" value="' + c.id + '"' +
        (selected === c.id ? ' checked' : '') + '><label for="' + id + '"><span class="swatch-dot" style="--dot:' + c.hex + '" aria-hidden="true"></span>' + esc(c.label) + '</label></span>';
    }).join('');
  }

  function renderProfileStats() {
    var box = $('#profile-stats');
    var since = state.profile.created_at ? new Date(state.profile.created_at) : null;
    $('#profile-member-since').textContent = since ? 'Lid van de bemanning sinds ' + since.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) + '.' : '';
    box.innerHTML = '';
    db.from('quiz_results').select('match_key').limit(1000).then(function (r) {
      var rows = (!r.error && r.data) || [];
      var counts = {};
      rows.forEach(function (row) { counts[row.match_key] = (counts[row.match_key] || 0) + 1; });
      var fav = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
      var stats = [
        { v: rows.length, l: rows.length === 1 ? 'missie voltooid' : 'missies voltooid' },
        { v: fav ? MATCHES[fav].emoji + ' ' + MATCHES[fav].name : '—', l: 'vaakste match' }
      ];
      if (state.profile.birth_date) stats.push({ v: nf(ageInfo(state.profile.birth_date).days), l: 'dagen rond de Zon' });
      box.innerHTML = stats.map(function (s) {
        return '<div class="stat"><b>' + esc(s.v) + '</b><span>' + esc(s.l) + '</span></div>';
      }).join('');
    });
  }

  function openProfile(onboarding) {
    state.onboarding = !!onboarding;
    var p = state.profile;
    draft = { emoji: p.avatar_emoji || DEFAULT_EMOJI, file: null, removePhoto: false, previewUrl: '' };
    $('#profile-eyebrow').textContent = onboarding ? 'Welkom aan boord 🚀' : 'Jouw ruimteprofiel';
    $('#profile-title').textContent = onboarding ? 'Maak je ruimteprofiel' : 'Mijn profiel';
    $('#profile-lead').textContent = onboarding
      ? 'Voor je eerste missie: kies een avatar en vertel iets over jezelf. Alleen jij kan je profiel zien, en je kan het later altijd aanpassen.'
      : 'Pas aan hoe je in de app verschijnt. Alleen jij kan je profiel zien.';
    $('#profile-cancel').textContent = onboarding ? 'Later' : 'Annuleren';
    $('#profile-save').textContent = onboarding ? '🚀 Profiel aanmaken' : '💾 Profiel opslaan';
    $('#profile-name').value = p.display_name || state.profileName || '';
    $('#profile-bio').value = p.bio || '';
    $('#bio-count').textContent = String(($('#profile-bio').value || '').length);
    $('#profile-birth').value = p.birth_date || '';
    $('#profile-birth').max = todayIso();
    $('#profile-email').textContent = state.user.email || '';
    $('#profile-error').hidden = true;
    $('#password-error').hidden = true;
    $('#avatar-status').textContent = 'JPG, PNG of WebP. We maken er automatisch een vierkantje van.';
    renderAvatarPicker();
    renderColorPicker(p.favorite_color || '');
    paintPreview();
    renderProfileStats();
    $('#password-form').hidden = onboarding;
    $('#profile-stats').hidden = onboarding;
    show('screen-profile');
  }

  // Crop to a centred square and shrink to 320px so uploads stay tiny.
  function squareJpeg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var size = Math.min(img.naturalWidth, img.naturalHeight);
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 320;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, (img.naturalWidth - size) / 2, (img.naturalHeight - size) / 2, size, size, 0, 0, 320, 320);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error('encode')); }, 'image/jpeg', 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  function onAvatarFile(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    var status = $('#avatar-status');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { status.textContent = '⚠️ Kies een JPG-, PNG- of WebP-afbeelding.'; return; }
    if (file.size > 15 * 1024 * 1024) { status.textContent = '⚠️ Die foto is te groot (max. 15 MB).'; return; }
    status.textContent = 'Foto verwerken…';
    squareJpeg(file).then(function (blob) {
      if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl);
      draft.file = blob;
      draft.removePhoto = false;
      draft.previewUrl = URL.createObjectURL(blob);
      $('#avatar-picker').querySelectorAll('input').forEach(function (i) { i.checked = false; });
      status.textContent = '✅ Foto klaar. Klik op opslaan om hem te bewaren.';
      paintPreview();
    }).catch(function () {
      status.textContent = '⚠️ Deze foto kon niet gelezen worden. Probeer een andere.';
    });
  }

  function removePhoto() {
    if (draft.previewUrl) { URL.revokeObjectURL(draft.previewUrl); draft.previewUrl = ''; }
    draft.file = null;
    draft.removePhoto = !!state.profile.avatar_path;
    renderAvatarPicker();
    paintPreview();
    $('#avatar-status').textContent = 'Je emoji-avatar wordt gebruikt.';
  }

  function saveProfile(e) {
    e.preventDefault();
    var err = $('#profile-error');
    err.hidden = true;
    var name = $('#profile-name').value.trim().slice(0, 30);
    var bio = $('#profile-bio').value.trim().slice(0, 160);
    var birth = $('#profile-birth').value;
    var colorInput = document.querySelector('input[name="fav-color"]:checked');
    var color = colorInput ? colorInput.value : '';
    if (!name) { err.textContent = 'Vul een weergavenaam in.'; err.hidden = false; $('#profile-name').focus(); return; }
    if (birth && (birth > todayIso() || birth < '1900-01-01')) { err.textContent = 'Kies een geboortedatum tussen 1900 en vandaag.'; err.hidden = false; return; }

    var btn = $('#profile-save');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Opslaan…';
    var path = state.user.id + '/avatar.jpg';

    var avatarStep = Promise.resolve(state.profile.avatar_path || null);
    if (draft.file) {
      avatarStep = db.storage.from('avatars').upload(path, draft.file, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })
        .then(function (r) { if (r.error) throw r.error; return path; });
    } else if (draft.removePhoto && state.profile.avatar_path) {
      avatarStep = db.storage.from('avatars').remove([state.profile.avatar_path]).then(function () { return null; });
    }

    avatarStep.then(function (avatarPath) {
      var update = {
        display_name: name,
        bio: bio || null,
        avatar_emoji: draft.emoji || DEFAULT_EMOJI,
        avatar_path: avatarPath,
        birth_date: birth || null,
        favorite_color: color || null
      };
      if (!state.profile.onboarded_at) update.onboarded_at = new Date().toISOString();
      return db.from('profiles').update(update).eq('id', state.user.id)
        .select('display_name, bio, avatar_emoji, avatar_path, birth_date, favorite_color, onboarded_at, created_at').single();
    }).then(function (r) {
      if (r.error) throw r.error;
      state.profile = r.data;
      state.profileName = r.data.display_name;
      $('#name-input').value = r.data.display_name;
      if (draft.previewUrl) { URL.revokeObjectURL(draft.previewUrl); draft.previewUrl = ''; }
      return refreshAvatarUrl();
    }).then(function () {
      btn.disabled = false;
      btn.textContent = label;
      renderUser();
      toast(state.onboarding ? '🚀 Welkom aan boord, ' + state.profileName + '!' : '✅ Profiel opgeslagen.');
      state.onboarding = false;
      restart();
    }).catch(function (error) {
      btn.disabled = false;
      btn.textContent = label;
      var msg = (error && error.message) || '';
      err.textContent = /payload too large|size/i.test(msg) ? 'Die foto is te groot.' :
        /mime|type/i.test(msg) ? 'Dit bestandstype wordt niet ondersteund.' :
        'Opslaan lukte niet. Controleer je verbinding en probeer opnieuw.';
      err.hidden = false;
    });
  }

  function skipProfile() {
    if (state.onboarding && !state.profile.onboarded_at) {
      // Remember that the user chose "later" so we don't ask on every visit.
      db.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', state.user.id).then(function (r) {
        if (!r.error) state.profile.onboarded_at = new Date().toISOString();
      });
    }
    state.onboarding = false;
    if (draft.previewUrl) { URL.revokeObjectURL(draft.previewUrl); draft.previewUrl = ''; }
    restart();
  }

  function changePassword(e) {
    e.preventDefault();
    var err = $('#password-error');
    var pw = $('#new-password').value;
    err.hidden = true;
    if (pw.length < 8) { err.textContent = 'Je nieuwe wachtwoord moet minstens 8 tekens lang zijn.'; err.hidden = false; return; }
    if (pw !== $('#new-password-confirm').value) { err.textContent = 'De twee wachtwoorden zijn niet gelijk.'; err.hidden = false; return; }
    var btn = $('#password-save');
    btn.disabled = true;
    db.auth.updateUser({ password: pw }).then(function (r) {
      btn.disabled = false;
      if (r.error) { err.textContent = window.kwAuth.message(r.error); err.hidden = false; return; }
      $('#new-password').value = '';
      $('#new-password-confirm').value = '';
      toast('🔐 Wachtwoord gewijzigd.');
    });
  }

  function initProfile() {
    $('#profile-form').addEventListener('submit', saveProfile);
    $('#password-form').addEventListener('submit', changePassword);
    $('#profile-cancel').addEventListener('click', skipProfile);
    $('#avatar-file').addEventListener('change', onAvatarFile);
    $('#avatar-remove').addEventListener('click', removePhoto);
    $('#profile-bio').addEventListener('input', function (e) { $('#bio-count').textContent = String(e.target.value.length); });
    $('#profile-form').addEventListener('input', function () { $('#profile-error').hidden = true; });
    $('#password-form').addEventListener('input', function () { $('#password-error').hidden = true; });
  }

  function saveResult(m) {
    var note = $('#saved-note');
    note.hidden = true;
    db.from('quiz_results').insert({
      match_key: m.key,
      age_years: Math.max(0, Math.min(130, ageInfo(state.answers.birth).years)),
      color: state.answers.color,
      destination: state.answers.dest,
      role: state.answers.role,
      fascination: state.answers.fasc
    }).then(function (r) {
      note.hidden = false;
      note.textContent = r.error ? '⚠️ Deze match kon niet in je logboek bewaard worden.' : '📓 Bewaard in je logboek.';
    });
  }

  function timeAgo(isoDate) {
    var d = new Date(isoDate);
    return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
      d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
  }

  function loadHistory() {
    if (!state.user) return;
    db.from('quiz_results').select('id, match_key, color, destination, role, created_at')
      .order('created_at', { ascending: false }).limit(12)
      .then(function (r) {
        var box = $('#history');
        if (r.error || !r.data || !r.data.length) { box.hidden = true; return; }
        var counts = {};
        r.data.forEach(function (row) { counts[row.match_key] = (counts[row.match_key] || 0) + 1; });
        var fav = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
        $('#history-summary').textContent = r.data.length === 1
          ? 'Je hebt één missie voltooid. Speel opnieuw en kijk of je match verandert!'
          : 'Je laatste ' + r.data.length + ' missies. Je komt het vaakst uit bij ' + MATCHES[fav].name + ' ' + MATCHES[fav].emoji + '.';
        $('#history-list').innerHTML = r.data.map(function (row) {
          var mt = MATCHES[row.match_key];
          var c = find(COLORS, row.color);
          var dest = find(DESTINATIONS, row.destination);
          var role = find(ROLES, row.role);
          if (!mt) return '';
          return '<li><span class="h-emoji" aria-hidden="true">' + mt.emoji + '</span>' +
            '<span class="h-main"><strong>' + esc(mt.name) + '</strong>' +
            '<span class="small muted">' + esc([c && c.label, dest && dest.label, role && role.label].filter(Boolean).join(' · ')) + '</span></span>' +
            '<time class="small muted" datetime="' + esc(row.created_at) + '">' + esc(timeAgo(row.created_at)) + '</time></li>';
        }).join('');
        box.hidden = false;
      });
  }

  function clearHistory() {
    if (!window.confirm('Wil je je hele logboek wissen? Dit kan niet ongedaan worden.')) return;
    db.from('quiz_results').delete().eq('user_id', state.user.id).then(function (r) {
      if (r.error) { toast('Wissen lukte niet. Probeer het later opnieuw.'); return; }
      toast('🧹 Logboek gewist.');
      loadHistory();
    });
  }

  var leaving = false;
  function goToLogin() {
    if (leaving) return;
    leaving = true;
    window.location.replace(window.kwAuth.pageUrl('login.html'));
  }

  function initUserMenu() {
    var btn = $('#user-btn');
    var dd = $('#user-dropdown');
    function setOpen(open) { dd.hidden = !open; btn.setAttribute('aria-expanded', String(open)); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(dd.hidden); });
    document.addEventListener('click', function (e) { if (!dd.hidden && !dd.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dd.hidden) { setOpen(false); btn.focus(); } });
    $('#profile-btn').addEventListener('click', function () {
      setOpen(false);
      openProfile(false);
    });
    $('#history-btn').addEventListener('click', function () {
      setOpen(false);
      restart();
      setTimeout(function () { var h = $('#history'); if (!h.hidden) h.scrollIntoView({ behavior: 'smooth' }); }, 400);
    });
    $('#logout-btn').addEventListener('click', function () {
      window.kwAuth.signOut().then(goToLogin, goToLogin);
    });
    $('#history-clear').addEventListener('click', clearHistory);
    db.auth.onAuthStateChange(function (event) {
      if (event === 'SIGNED_OUT') goToLogin();
    });
  }

  // ---------- Init ----------
  function init() {
    window.kwUI.initTheme();
    window.kwUI.initStars();
    initKeyDialog();
    storage('kw-last', null); // older versions kept answers (incl. birth date) here

    $('#intro-form').addEventListener('submit', function (e) {
      e.preventDefault();
      state.name = $('#name-input').value.trim().slice(0, 30);
      saveName(state.name);
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

    if (!db) {
      // The auth library failed to load (offline / blocked CDN): explain instead of showing a blank page.
      document.documentElement.classList.remove('auth-pending');
      document.querySelector('.container').innerHTML =
        '<section class="screen is-active"><h1>Even geen verbinding 🛰️</h1><p class="lead">De inlogservice kon niet geladen worden. Controleer je internetverbinding en herlaad de pagina.</p></section>';
      return;
    }

    window.kwAuth.requireUser().then(function (user) {
      state.user = user;
      document.documentElement.classList.remove('auth-pending');
      initUserMenu();
      initProfile();
      // Clean tokens from the URL after arriving through a confirmation or magic link.
      if (/access_token|refresh_token|type=/.test(window.location.hash)) history.replaceState(null, '', window.location.pathname);
      loadProfile();
      loadHistory();
    });
  }

  init();
})();
