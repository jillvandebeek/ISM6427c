/* Login page: email + password, magic link, password reset (Supabase Auth). */
(function () {
  'use strict';

  var auth = window.kwAuth;
  var client = auth.client;
  var $ = function (sel) { return document.querySelector(sel); };
  var pendingEmail = '';
  var recovering = false;

  window.kwUI.initTheme();
  window.kwUI.initStars();

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showAlert(text, kind) {
    var el = $('#auth-alert');
    el.textContent = text;
    el.className = 'auth-alert' + (kind ? ' is-' + kind : '');
    el.hidden = !text;
  }

  function showView(id) {
    document.querySelectorAll('.auth-view').forEach(function (v) { v.classList.toggle('is-active', v.id === id); });
    var tabbed = id === 'view-signin' || id === 'view-signup';
    $('#auth-tabs').hidden = !tabbed;
    if (tabbed) {
      $('#tab-signin').setAttribute('aria-selected', String(id === 'view-signin'));
      $('#tab-signup').setAttribute('aria-selected', String(id === 'view-signup'));
    }
    var first = document.querySelector('#' + id + ' input');
    if (first) first.focus();
  }

  function busy(form, on) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = 'Even geduld…'; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
    btn.disabled = on;
  }

  function goToApp() { window.location.replace(auth.pageUrl('index.html')); }

  function sent(text, allowResend) {
    $('#sent-text').textContent = text;
    $('#resend-btn').hidden = !allowResend;
    showAlert('');
    showView('view-sent');
  }

  function strength(pw) {
    var score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  function passwordProblem(pw, confirm) {
    if (pw.length < 8) return 'Je wachtwoord moet minstens 8 tekens lang zijn.';
    if (pw !== confirm) return 'De twee wachtwoorden zijn niet gelijk.';
    return '';
  }

  // ---------- Wiring ----------
  $('#tab-signin').addEventListener('click', function () { showAlert(''); showView('view-signin'); });
  $('#tab-signup').addEventListener('click', function () { showAlert(''); showView('view-signup'); });
  document.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      var email = $('#signin-email').value.trim();
      if (email) { $('#forgot-email').value = email; $('#magic-email').value = email; }
      showAlert('');
      showView(b.dataset.view);
    });
  });
  document.querySelectorAll('.pw-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var input = document.getElementById(b.dataset.target);
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.setAttribute('aria-label', show ? 'Verberg wachtwoord' : 'Toon wachtwoord');
      b.textContent = show ? '🙈' : '👁️';
    });
  });
  $('#signup-password').addEventListener('input', function (e) {
    var s = strength(e.target.value);
    var labels = ['Minstens 8 tekens.', 'Zwak', 'Kan beter', 'Goed', 'Sterk', 'Raketsterk 🚀'];
    $('#pw-meter-bar').style.width = (s / 5 * 100) + '%';
    $('#pw-meter-bar').dataset.level = String(s);
    $('#pw-meter-label').textContent = e.target.value ? labels[s] : labels[0];
  });

  if (!client) {
    showAlert('De inlogservice kon niet geladen worden. Controleer je internetverbinding en herlaad de pagina.', 'error');
    document.querySelectorAll('.auth-view button[type="submit"]').forEach(function (b) { b.disabled = true; });
    return;
  }

  $('#view-signin').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var email = $('#signin-email').value.trim();
    var password = $('#signin-password').value;
    if (!EMAIL_RE.test(email)) return showAlert('Vul een geldig e-mailadres in.', 'error');
    if (!password) return showAlert('Vul je wachtwoord in.', 'error');
    busy(form, true);
    client.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
      busy(form, false);
      if (r.error) {
        pendingEmail = email;
        if (r.error.code === 'email_not_confirmed') {
          sent('Je account voor ' + email + ' is nog niet bevestigd. Klik op de link in de bevestigingsmail, of vraag hieronder een nieuwe aan.', true);
          return;
        }
        showAlert(auth.message(r.error), 'error');
        return;
      }
      goToApp();
    });
  });

  $('#view-signup').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var name = $('#signup-name').value.trim().slice(0, 30);
    var email = $('#signup-email').value.trim();
    var password = $('#signup-password').value;
    if (!EMAIL_RE.test(email)) return showAlert('Vul een geldig e-mailadres in.', 'error');
    var problem = passwordProblem(password, $('#signup-confirm').value);
    if (problem) return showAlert(problem, 'error');
    busy(form, true);
    client.auth.signUp({
      email: email,
      password: password,
      options: { data: { display_name: name }, emailRedirectTo: auth.pageUrl('index.html') }
    }).then(function (r) {
      busy(form, false);
      if (r.error) return showAlert(auth.message(r.error), 'error');
      if (r.data && r.data.session) return goToApp(); // email confirmation is turned off
      pendingEmail = email;
      sent('We hebben een bevestigingsmail gestuurd naar ' + email + '. Klik op de link om je account te activeren.', true);
    });
  });

  $('#view-forgot').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var email = $('#forgot-email').value.trim();
    if (!EMAIL_RE.test(email)) return showAlert('Vul een geldig e-mailadres in.', 'error');
    busy(form, true);
    client.auth.resetPasswordForEmail(email, { redirectTo: auth.pageUrl('login.html') }).then(function (r) {
      busy(form, false);
      if (r.error) return showAlert(auth.message(r.error), 'error');
      sent('Als er een account bestaat voor ' + email + ', ontvang je zo een link om een nieuw wachtwoord te kiezen.', false);
    });
  });

  $('#view-magic').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var email = $('#magic-email').value.trim();
    if (!EMAIL_RE.test(email)) return showAlert('Vul een geldig e-mailadres in.', 'error');
    busy(form, true);
    client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: auth.pageUrl('index.html') } }).then(function (r) {
      busy(form, false);
      if (r.error) return showAlert(auth.message(r.error), 'error');
      sent('We hebben een inloglink gestuurd naar ' + email + '. Open hem op dit toestel om meteen in te loggen.', false);
    });
  });

  $('#view-reset').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var password = $('#reset-password').value;
    var problem = passwordProblem(password, $('#reset-confirm').value);
    if (problem) return showAlert(problem, 'error');
    busy(form, true);
    client.auth.updateUser({ password: password }).then(function (r) {
      busy(form, false);
      if (r.error) return showAlert(auth.message(r.error), 'error');
      recovering = false;
      showAlert('Je wachtwoord is aangepast. Je wordt doorgestuurd…', 'success');
      setTimeout(goToApp, 1200);
    });
  });

  $('#resend-btn').addEventListener('click', function () {
    if (!pendingEmail) return;
    var btn = $('#resend-btn');
    btn.disabled = true;
    client.auth.resend({ type: 'signup', email: pendingEmail, options: { emailRedirectTo: auth.pageUrl('index.html') } }).then(function (r) {
      btn.disabled = false;
      showAlert(r.error ? auth.message(r.error) : 'Verstuurd! Check je mailbox opnieuw.', r.error ? 'error' : 'success');
    });
  });

  // ---------- Arriving from an email link ----------
  // Errors from expired or reused links come back in the URL hash or query string.
  var params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
  if (params.get('error') || params.get('error_code')) {
    showAlert(auth.message({ code: params.get('error_code'), message: params.get('error_description') || '' }), 'error');
    history.replaceState(null, '', window.location.pathname);
  }
  var isRecoveryLink = params.get('type') === 'recovery';

  // If an email link is opened in a tab that already shows this page, only the hash
  // changes; reload so Supabase picks up the tokens.
  window.addEventListener('hashchange', function () {
    if (/access_token|error_code/.test(window.location.hash)) window.location.reload();
  });

  client.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') {
      recovering = true;
      showAlert('');
      showView('view-reset');
    }
  });

  // Already signed in? Go straight to the app (unless we are resetting a password).
  client.auth.getSession().then(function (r) {
    if (r.data && r.data.session && !recovering && !isRecoveryLink) goToApp();
  });
})();
