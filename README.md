# SkyCast — City Weather App

Responsive weather dashboard built with HTML, CSS and vanilla JavaScript.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser.
3. Search for a city. An internet connection is required for live weather.

No API key, package installation or build step is required.

## Free API
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

Both endpoints are configured in the `API` object at the top of `script.js`.

## Features
- Worldwide city search.
- Current temperature, feels-like temperature, humidity, wind and conditions.
- Five-day forecast with daily high and low temperatures.
- Loading, empty input, invalid input, city-not-found and network/API error states.
- `fetch`, `async/await`, `response.ok`, `encodeURIComponent` and `URLSearchParams`.
- Debounced input validation; API requests run only on form submission.
- Dynamic forecast cards created with DOM methods and `textContent`.
- Responsive desktop and mobile layout.
- Loads Coimbatore as a demo city on first visit.

## Error handling note
Empty and too-short inputs are validated before requests. The app checks `response.ok` before parsing JSON, displays a friendly message if a city is not found, handles network/API failures, and aborts an older request when a new search begins.

## Deploy with GitHub Pages
Upload the files to a GitHub repository. Go to Settings → Pages, select the main branch and root folder, then save. Use the generated Pages URL as your live demo link.
