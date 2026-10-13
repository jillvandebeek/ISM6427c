# Kosmisch Weetje: NASA quiz

Een one-page app in gewone HTML, CSS en JavaScript. Bezoekers beantwoorden 5 vragen en krijgen
een persoonlijke "kosmische match" met een NASA-weetje, plus een ruimtedossier vol live NASA-data.

## De 5 vragen en wat ze opleveren

| Vraag | Wat je terugkrijgt | Bron |
| --- | --- | --- |
| Geboortedatum | Astronomy Picture of the Day van je geboortedag, de planetoïde die toen langs de Aarde scheerde, je leeftijd op andere planeten | APOD, NeoWs |
| Lievelingskleur | Een kleurweetje met een passende NASA-foto | NASA Image Library |
| Droombestemming | Afstand en reistijd met echte missies | Ingebouwde feiten |
| Rol op een missie | Weetje over die rol met een NASA-foto | NASA Image Library |
| Waar je nieuwsgierig naar bent | Live data: planetoïden van vandaag, zonnevlammen (30 dagen), de laatste EPIC-foto van de Aarde of beelden uit het diepe heelal | NeoWs, DONKI, EPIC, Image Library |

Alle antwoorden geven punten aan 8 kosmische matches (Maan, Mars, Jupiter, Saturnus, Zon, Europa,
Voyager 1, zwart gat). De winnaar bepaalt het hoofdweetje.

## Inloggen (Supabase)

De quiz is alleen bereikbaar na inloggen met e-mail. `login.html` biedt:

- Inloggen met e-mail + wachtwoord
- Account maken (met naam, wachtwoordsterkte-meter en bevestigingsmail)
- Wachtwoord vergeten → resetlink → nieuw wachtwoord kiezen
- Inloggen zonder wachtwoord via een e-maillink (magic link)
- Bevestigingsmail opnieuw versturen, nette Nederlandse foutmeldingen

Na het inloggen bewaart de app elke kosmische match in een persoonlijk **logboek**
(tabel `quiz_results`) en onthoudt ze je naam (tabel `profiles`). Row Level Security zorgt dat
elke gebruiker alleen zijn eigen rijen kan lezen, toevoegen of wissen. Het schema staat in
`supabase/migrations/`.

Bestanden: `supabase-config.js` (project-URL + publishable key, veilig voor de browser),
`auth.js` (gedeelde client en foutmeldingen), `login.html` / `login.js`, `space-ui.js`
(thema + sterrenhemel voor beide pagina's).

### Eenmalig instellen in het Supabase-dashboard

1. **Authentication → URL Configuration**
   - *Site URL*: je Netlify-adres, bv. `https://jouw-site.netlify.app`
   - *Redirect URLs*: voeg `https://jouw-site.netlify.app/**` toe (en `http://localhost:8000/**` om lokaal te testen)
2. **Authentication → Sign In / Providers → Email**: staat standaard aan. Laat *Confirm email* aan.
3. **Authentication → Emails → SMTP Settings**: stel een eigen mailprovider in (bv. Resend,
   Brevo, Postmark). **Zonder eigen SMTP stuurt Supabase alleen mails naar leden van je
   Supabase-team** (andere adressen krijgen "Email address not authorized") en maar enkele
   mails per uur. Voor een demo met alleen je eigen adres werkt het zonder.

## Kenmerken

- Ruimtethema met fonkelende sterren, vallende sterren en zwevende planeten
- Licht, donker en systeemthema (wordt onthouden)
- Werkt meteen met `DEMO_KEY`; via 🔑 kan je een eigen gratis sleutel van
  [api.nasa.gov](https://api.nasa.gov/#signUp) toevoegen (alleen bewaard in je browser)
- Duidelijke meldingen bij rate limits, delen via de share-knop of klembord
- Responsive en respecteert `prefers-reduced-motion`

## APOD-proxy

Sinds september 2026 draait APOD op `https://science.nasa.gov/wp-json/wp/v2/apod-basic/YYMMDD`.
`netlify.toml` proxyt die als `/api/apod/*` zodat de browser niet afhangt van CORS-headers.
Lokaal valt de app terug op de directe URL.

## Lokaal draaien

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy naar Netlify

Koppel deze repo in Netlify, branch `main`, geen build command, publish directory `.`
(staat al in `netlify.toml`). Elke push naar `main` deployt opnieuw.

De vorige weer-app staat nog steeds op `/weather/`.
