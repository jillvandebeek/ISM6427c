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
