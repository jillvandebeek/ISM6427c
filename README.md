# Sky Check: Weather App

A responsive weather app built with plain HTML, CSS and JavaScript, powered by the free
[Open-Meteo API](https://open-meteo.com/) (no API key, no cost).

## Features

- Personal greeting for Jill Vandebeek based on the time of day
- Default location: **Boca Raton, Florida**
- City search (Open-Meteo Geocoding API) with a quick "Boca" button to return home
- Current conditions, next 24 hours and a 7 day forecast
- °F / °C toggle
- Light, dark and system themes (choice is remembered)
- Responsive layout for desktop, tablet and mobile

## Run locally

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to Netlify

1. In Netlify choose **Add new site → Import an existing project** and pick this GitHub repo.
2. Branch: `main`. Build command: leave empty. Publish directory: `.`
   (these are already set in `netlify.toml`).
3. Click **Deploy**. Every push to `main` redeploys automatically.

Alternatively, drag and drop the project folder onto <https://app.netlify.com/drop>.
