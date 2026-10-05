(function () {
  'use strict';

  // Default location: Boca Raton, Florida
  var DEFAULT_LOCATION = {
    name: 'Boca Raton',
    admin1: 'Florida',
    country: 'United States',
    latitude: 26.3683,
    longitude: -80.1289,
    timezone: 'America/New_York'
  };

  var USER_NAME = 'Jill Vandebeek';
  var FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
  var GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

  // WMO weather codes used by Open-Meteo
  var WEATHER_CODES = {
    0: ['Clear sky', '☀️', '🌙'],
    1: ['Mainly clear', '🌤️', '🌙'],
    2: ['Partly cloudy', '⛅', '☁️'],
    3: ['Overcast', '☁️', '☁️'],
    45: ['Fog', '🌫️', '🌫️'],
    48: ['Depositing rime fog', '🌫️', '🌫️'],
    51: ['Light drizzle', '🌦️', '🌧️'],
    53: ['Drizzle', '🌦️', '🌧️'],
    55: ['Dense drizzle', '🌧️', '🌧️'],
    56: ['Freezing drizzle', '🌧️', '🌧️'],
    57: ['Heavy freezing drizzle', '🌧️', '🌧️'],
    61: ['Slight rain', '🌦️', '🌧️'],
    63: ['Rain', '🌧️', '🌧️'],
    65: ['Heavy rain', '🌧️', '🌧️'],
    66: ['Freezing rain', '🌧️', '🌧️'],
    67: ['Heavy freezing rain', '🌧️', '🌧️'],
    71: ['Slight snow', '🌨️', '🌨️'],
    73: ['Snow', '🌨️', '🌨️'],
    75: ['Heavy snow', '❄️', '❄️'],
    77: ['Snow grains', '🌨️', '🌨️'],
    80: ['Rain showers', '🌦️', '🌧️'],
    81: ['Heavy rain showers', '🌧️', '🌧️'],
    82: ['Violent rain showers', '⛈️', '⛈️'],
    85: ['Snow showers', '🌨️', '🌨️'],
    86: ['Heavy snow showers', '❄️', '❄️'],
    95: ['Thunderstorm', '⛈️', '⛈️'],
    96: ['Thunderstorm with hail', '⛈️', '⛈️'],
    99: ['Severe thunderstorm with hail', '⛈️', '⛈️']
  };

  var $ = function (id) { return document.getElementById(id); };

  var state = {
    location: DEFAULT_LOCATION,
    unit: readPref('unit', 'fahrenheit'),
    data: null
  };

  /* ---------- Preferences (localStorage, safely) ---------- */
  function readPref(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }
  function writePref(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    document.querySelectorAll('[data-theme-choice]').forEach(function (btn) {
      btn.setAttribute('aria-checked', String(btn.dataset.themeChoice === theme));
    });
    writePref('theme', theme);
  }

  /* ---------- Greeting ---------- */
  function renderGreeting() {
    var hour = new Date().getHours();
    var part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    var emoji = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';
    var firstName = USER_NAME.split(' ')[0];
    $('greeting-title').textContent = part + ', ' + USER_NAME + '! ' + emoji;
    $('greeting-sub').textContent = 'Welcome back, ' + firstName +
      '. Here is the latest weather, starting with sunny Boca Raton.';
  }

  /* ---------- Helpers ---------- */
  function describe(code, isDay) {
    var entry = WEATHER_CODES[code] || ['Unknown', '🌡️', '🌡️'];
    return { text: entry[0], icon: isDay === 0 ? entry[2] : entry[1] };
  }
  function tempUnit() { return state.unit === 'celsius' ? '°C' : '°F'; }
  function windUnit() { return state.unit === 'celsius' ? 'km/h' : 'mph'; }
  function precipUnit() { return state.unit === 'celsius' ? 'mm' : 'in'; }
  function round(n) { return Math.round(n); }

  // Open-Meteo returns local times without an offset when timezone is set, e.g. "2026-10-05T14:00".
  function parseLocal(iso) {
    var p = iso.split(/[-T:]/).map(Number);
    return new Date(p[0], p[1] - 1, p[2], p[3] || 0, p[4] || 0);
  }
  function formatTime(iso) {
    return parseLocal(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  function formatHour(iso) {
    return parseLocal(iso).toLocaleTimeString([], { hour: 'numeric' });
  }
  function formatDay(iso, index) {
    if (index === 0) return 'Today';
    return parseLocal(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function windDirection(deg) {
    var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function setStatus(msg, isError) {
    var el = $('status');
    el.textContent = msg || '';
    el.classList.toggle('error', !!isError);
  }

  /* ---------- API ---------- */
  function fetchForecast(loc) {
    var params = new URLSearchParams({
      latitude: loc.latitude,
      longitude: loc.longitude,
      timezone: 'auto',
      forecast_days: '7',
      temperature_unit: state.unit,
      wind_speed_unit: state.unit === 'celsius' ? 'kmh' : 'mph',
      precipitation_unit: state.unit === 'celsius' ? 'mm' : 'inch',
      current: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
        'precipitation', 'weather_code', 'wind_speed_10m', 'wind_direction_10m'
      ].join(','),
      hourly: ['temperature_2m', 'precipitation_probability', 'weather_code', 'is_day'].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset',
        'uv_index_max', 'precipitation_probability_max'
      ].join(',')
    });
    return fetch(FORECAST_URL + '?' + params.toString()).then(function (res) {
      if (!res.ok) throw new Error('Weather service returned ' + res.status);
      return res.json();
    });
  }

  function searchCities(query) {
    var params = new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' });
    return fetch(GEOCODE_URL + '?' + params.toString()).then(function (res) {
      if (!res.ok) throw new Error('Search failed (' + res.status + ')');
      return res.json();
    }).then(function (json) { return json.results || []; });
  }

  /* ---------- Rendering ---------- */
  function renderAll() {
    var d = state.data;
    var loc = state.location;
    var c = d.current;
    var info = describe(c.weather_code, c.is_day);

    $('location-name').textContent = loc.name;
    $('location-meta').textContent = [loc.admin1, loc.country].filter(Boolean).join(', ') +
      ' · Updated ' + formatTime(c.time);
    $('current-desc').textContent = info.text;
    $('current-icon').textContent = info.icon;
    $('current-temp').textContent = round(c.temperature_2m) + tempUnit();

    $('stat-feels').textContent = round(c.apparent_temperature) + tempUnit();
    $('stat-humidity').textContent = c.relative_humidity_2m + '%';
    $('stat-wind').textContent = round(c.wind_speed_10m) + ' ' + windUnit() + ' ' + windDirection(c.wind_direction_10m);
    $('stat-precip').textContent = c.precipitation + ' ' + precipUnit();
    $('stat-uv').textContent = d.daily.uv_index_max[0] != null ? d.daily.uv_index_max[0].toFixed(1) : 'n/a';
    $('stat-sun').textContent = formatTime(d.daily.sunrise[0]) + ' / ' + formatTime(d.daily.sunset[0]);

    renderHourly(d);
    renderDaily(d);

    $('current').hidden = false;
    $('hourly-section').hidden = false;
    $('daily-section').hidden = false;
    document.title = loc.name + ' ' + round(c.temperature_2m) + tempUnit() + ' | Sky Check';
  }

  function renderHourly(d) {
    var container = $('hourly');
    container.innerHTML = '';
    // Start at the current hour in the location's local time
    var nowKey = d.current.time.slice(0, 13);
    var start = d.hourly.time.findIndex(function (t) { return t.slice(0, 13) === nowKey; });
    if (start < 0) start = 0;

    for (var i = start; i < Math.min(start + 24, d.hourly.time.length); i++) {
      var info = describe(d.hourly.weather_code[i], d.hourly.is_day[i]);
      var el = document.createElement('div');
      el.className = 'hour';
      el.innerHTML =
        '<div class="h-time"></div><div class="h-icon" aria-hidden="true"></div>' +
        '<div class="h-temp"></div><div class="h-rain"></div>';
      el.querySelector('.h-time').textContent = i === start ? 'Now' : formatHour(d.hourly.time[i]);
      el.querySelector('.h-icon').textContent = info.icon;
      el.querySelector('.h-temp').textContent = round(d.hourly.temperature_2m[i]) + '°';
      var rain = d.hourly.precipitation_probability[i];
      el.querySelector('.h-rain').textContent = rain ? '💧' + rain + '%' : '';
      el.title = info.text;
      container.appendChild(el);
    }
  }

  function renderDaily(d) {
    var list = $('daily');
    list.innerHTML = '';
    d.daily.time.forEach(function (day, i) {
      var info = describe(d.daily.weather_code[i], 1);
      var rain = d.daily.precipitation_probability_max[i];
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="d-day"></span><span class="d-icon" aria-hidden="true"></span>' +
        '<span class="d-desc"></span><span class="d-range"><span class="hi"></span><span class="lo"></span></span>';
      li.querySelector('.d-day').textContent = formatDay(day, i);
      li.querySelector('.d-icon').textContent = info.icon;
      li.querySelector('.d-desc').textContent = info.text + (rain ? ' · ' + rain + '% rain' : '');
      li.querySelector('.hi').textContent = round(d.daily.temperature_2m_max[i]) + '°';
      li.querySelector('.lo').textContent = round(d.daily.temperature_2m_min[i]) + '°';
      list.appendChild(li);
    });
  }

  /* ---------- Loading ---------- */
  function loadWeather(loc) {
    state.location = loc;
    setStatus('Loading weather for ' + loc.name + '…');
    return fetchForecast(loc).then(function (data) {
      state.data = data;
      renderAll();
      setStatus('');
    }).catch(function (err) {
      console.error(err);
      setStatus('Sorry, we could not load the weather right now. Please try again in a moment.', true);
    });
  }

  /* ---------- Search UI ---------- */
  function showResults(results) {
    var list = $('search-results');
    list.innerHTML = '';
    if (!results.length) {
      var empty = document.createElement('li');
      empty.textContent = 'No cities found.';
      empty.setAttribute('aria-disabled', 'true');
      list.appendChild(empty);
    }
    results.forEach(function (r) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.tabIndex = 0;
      li.textContent = r.name + ' ';
      var small = document.createElement('small');
      small.textContent = [r.admin1, r.country].filter(Boolean).join(', ');
      li.appendChild(small);
      var choose = function () {
        hideResults();
        $('search-input').value = '';
        loadWeather({
          name: r.name, admin1: r.admin1, country: r.country,
          latitude: r.latitude, longitude: r.longitude
        });
      };
      li.addEventListener('click', choose);
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
      });
      list.appendChild(li);
    });
    list.hidden = false;
  }
  function hideResults() { $('search-results').hidden = true; }

  function initSearch() {
    var input = $('search-input');
    var timer;

    function run() {
      var q = input.value.trim();
      if (q.length < 2) { hideResults(); return; }
      searchCities(q).then(showResults).catch(function () {
        setStatus('City search is unavailable right now.', true);
      });
    }

    $('search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      clearTimeout(timer);
      run();
    });
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(run, 300);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideResults();
      if (e.key === 'ArrowDown') {
        var first = $('search-results').querySelector('li[role="option"]');
        if (first) { e.preventDefault(); first.focus(); }
      }
    });
    document.addEventListener('click', function (e) {
      if (!$('search-form').contains(e.target)) hideResults();
    });
    $('home-btn').addEventListener('click', function () {
      hideResults();
      loadWeather(DEFAULT_LOCATION);
    });
  }

  /* ---------- Units ---------- */
  function applyUnit(unit) {
    state.unit = unit;
    writePref('unit', unit);
    document.querySelectorAll('[data-unit]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.unit === unit));
    });
  }

  /* ---------- Init ---------- */
  function init() {
    renderGreeting();

    applyTheme(readPref('theme', 'system'));
    document.querySelectorAll('[data-theme-choice]').forEach(function (btn) {
      btn.addEventListener('click', function () { applyTheme(btn.dataset.themeChoice); });
    });

    applyUnit(state.unit);
    document.querySelectorAll('[data-unit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.unit === state.unit) return;
        applyUnit(btn.dataset.unit);
        loadWeather(state.location);
      });
    });

    initSearch();
    loadWeather(DEFAULT_LOCATION);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
