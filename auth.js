/* Shared Supabase auth helpers for index.html and login.html. */
(function () {
  'use strict';

  var cfg = window.KW_SUPABASE || {};
  var client = null;
  if (window.supabase && cfg.url && cfg.publishableKey) {
    client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  function pageUrl(file) {
    return new URL(file, window.location.href).href.split('#')[0].split('?')[0];
  }

  // Translate the most common Supabase Auth errors into friendly Dutch.
  function message(error) {
    if (!error) return '';
    var code = error.code || '';
    var msg = (error.message || '').toLowerCase();
    if (code === 'otp_expired' || msg.indexOf('expired') > -1) return 'Deze link is verlopen of al gebruikt. Vraag een nieuwe aan.';
    if (code === 'invalid_credentials' || msg.indexOf('invalid login credentials') > -1) return 'Dat e-mailadres en wachtwoord passen niet bij elkaar.';
    if (code === 'email_not_confirmed' || msg.indexOf('email not confirmed') > -1) return 'Je e-mailadres is nog niet bevestigd. Klik op de link in je mailbox.';
    if (code === 'user_already_exists' || msg.indexOf('already registered') > -1) return 'Er bestaat al een account met dit e-mailadres. Log in of reset je wachtwoord.';
    if (code === 'weak_password' || msg.indexOf('password should') > -1) return 'Kies een sterker wachtwoord (minstens 8 tekens, liefst met cijfers en letters).';
    if (code === 'same_password') return 'Je nieuwe wachtwoord moet verschillen van je oude.';
    if (code === 'over_email_send_rate_limit' || msg.indexOf('rate limit') > -1 || error.status === 429) return 'Er zijn net te veel e-mails of pogingen verstuurd. Wacht even en probeer het opnieuw.';
    if (code === 'email_address_invalid' || msg.indexOf('invalid format') > -1 || msg.indexOf('is invalid') > -1) return 'Dat e-mailadres lijkt niet geldig.';
    if (code === 'email_address_not_authorized' || msg.indexOf('not authorized') > -1) return 'Naar dit e-mailadres kan de app nog geen mails sturen. De beheerder moet eerst een eigen mailserver (SMTP) instellen in Supabase.';
    if (code === 'signup_disabled') return 'Nieuwe accounts aanmaken is momenteel uitgeschakeld.';
    if (msg.indexOf('failed to fetch') > -1 || msg.indexOf('network') > -1) return 'Geen verbinding met de inlogserver. Controleer je internet.';
    return 'Er ging iets mis: ' + (error.message || 'onbekende fout') + '.';
  }

  window.kwAuth = {
    client: client,
    available: !!client,
    pageUrl: pageUrl,
    message: message,
    getUser: function () {
      if (!client) return Promise.resolve(null);
      return client.auth.getSession().then(function (r) {
        return (r.data && r.data.session && r.data.session.user) || null;
      });
    },
    requireUser: function () {
      return this.getUser().then(function (user) {
        if (!user) {
          window.location.replace(pageUrl('login.html'));
          return new Promise(function () {}); // never resolves; we are navigating away
        }
        return user;
      });
    },
    signOut: function () {
      return client ? client.auth.signOut({ scope: 'local' }) : Promise.resolve();
    }
  };
})();
