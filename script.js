// Free Open-Meteo endpoints; no API key is required.
const API = {
  geocoding: "https://geocoding-api.open-meteo.com/v1/search",
  forecast: "https://api.open-meteo.com/v1/forecast"
};

const form = document.querySelector("#search-form");
const input = document.querySelector("#city-input");
const button = document.querySelector("#search-button");
const statusBox = document.querySelector("#status");
const weatherContent = document.querySelector("#weather-content");
let debounceTimer;
let activeController;

const weatherCodes = {
  0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],
  56:["Freezing drizzle","🌧️"],57:["Freezing drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
  66:["Freezing rain","🌧️"],67:["Freezing rain","🌧️"],71:["Light snow","🌨️"],73:["Snow","🌨️"],75:["Heavy snow","❄️"],
  77:["Snow grains","🌨️"],80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Heavy showers","⛈️"],
  85:["Snow showers","🌨️"],86:["Heavy snow showers","❄️"],95:["Thunderstorm","⛈️"],96:["Thunderstorm with hail","⛈️"],99:["Thunderstorm with hail","⛈️"]
};
const describe = code => weatherCodes[code] || ["Weather unavailable","🌡️"];
const setStatus = (message,type="info") => { statusBox.textContent=message; statusBox.className=type; statusBox.hidden=false; };
const clearStatus = () => { statusBox.hidden=true; statusBox.textContent=""; };
const setLoading = loading => { button.disabled=loading; button.innerHTML=loading?"Searching…":'Search <b>→</b>'; };
const dayName = date => new Intl.DateTimeFormat(undefined,{weekday:"short"}).format(new Date(`${date}T12:00:00`));
const fullDate = date => new Intl.DateTimeFormat(undefined,{weekday:"long",day:"numeric",month:"long"}).format(new Date(`${date}T12:00:00`));

async function fetchJSON(url,signal) {
  const response = await fetch(url,{signal});
  if (!response.ok) throw new Error(`The weather service responded with ${response.status}. Please try again.`);
  return response.json();
}

async function searchCity(rawCity) {
  const city=rawCity.trim();
  if (!city) { setStatus("Please enter a city name before searching.","error"); input.focus(); return; }
  if (city.length<2) { setStatus("Please enter at least two characters for the city name.","error"); input.focus(); return; }
  if (!/^[\p{L}\p{M}\s.'-]+$/u.test(city)) { setStatus("Please use letters in the city name. Spaces and hyphens are fine.","error"); input.focus(); return; }

  if (activeController) activeController.abort();
  activeController=new AbortController();
  const {signal}=activeController;
  setLoading(true);
  setStatus("Finding your city and checking the latest forecast…");

  try {
    const geoURL=`${API.geocoding}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geo=await fetchJSON(geoURL,signal);
    if (!geo.results?.length) throw new Error(`We couldn't find “${city}”. Check the spelling or try a nearby city.`);
    const place=geo.results[0];
    const params=new URLSearchParams({
      latitude:place.latitude,longitude:place.longitude,
      current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
      daily:"weather_code,temperature_2m_max,temperature_2m_min",
      timezone:"auto",forecast_days:"6"
    });
    const weather=await fetchJSON(`${API.forecast}?${params}`,signal);
    if (signal.aborted) return;
    renderWeather(place,weather);
    clearStatus();
    weatherContent.hidden=false;
  } catch(error) {
    if (error.name==="AbortError") return;
    weatherContent.hidden=true;
    setStatus(error instanceof TypeError
      ?"We couldn't connect to the weather service. Check your internet connection and try again."
      :(error.message||"Something went wrong. Please try again in a moment."),"error");
  } finally {
    if (!signal.aborted) setLoading(false);
  }
}

function renderWeather(place,data) {
  const c=data.current,d=data.daily;
  const [description,icon]=describe(c.weather_code);
  document.querySelector("#location-name").textContent=[...new Set([place.name,place.admin1,place.country].filter(Boolean))].join(", ");
  document.querySelector("#local-date").textContent=fullDate(d.time[0]);
  document.querySelector("#weather-description").textContent=description;
  document.querySelector("#current-icon").textContent=icon;
  document.querySelector("#current-temp").textContent=Math.round(c.temperature_2m);
  document.querySelector("#feels-like").textContent=`Feels like ${Math.round(c.apparent_temperature)}°`;
  document.querySelector("#current-summary").textContent=c.is_day?`It's ${description.toLowerCase()} outside. Have a lovely day!`:`It's ${description.toLowerCase()} tonight.`;
  document.querySelector("#today-high").textContent=`${Math.round(d.temperature_2m_max[0])}°`;
  document.querySelector("#today-low").textContent=`${Math.round(d.temperature_2m_min[0])}°`;
  document.querySelector("#humidity").textContent=`${c.relative_humidity_2m}%`;
  document.querySelector("#wind").textContent=`${Math.round(c.wind_speed_10m)} km/h`;
  document.querySelector("#feels-metric").textContent=`${Math.round(c.apparent_temperature)}°`;

  const forecast=document.querySelector("#forecast");
  forecast.replaceChildren();
  d.time.slice(1,6).forEach((date,i)=>{
    const n=i+1,[label,emoji]=describe(d.weather_code[n]);
    const card=document.createElement("article"); card.className="forecast-day";
    const day=document.createElement("h3"); day.textContent=dayName(date);
    const iconNode=document.createElement("div"); iconNode.className="forecast-icon"; iconNode.textContent=emoji; iconNode.setAttribute("aria-hidden","true");
    const condition=document.createElement("p"); condition.className="forecast-condition"; condition.textContent=label;
    const temps=document.createElement("div"); temps.className="forecast-temps";
    const high=document.createElement("strong"); high.textContent=`${Math.round(d.temperature_2m_max[n])}°`;
    const low=document.createElement("span"); low.textContent=`${Math.round(d.temperature_2m_min[n])}°`;
    temps.append(high,low); card.append(day,iconNode,condition,temps); forecast.append(card);
  });
}

form.addEventListener("submit",event=>{event.preventDefault();clearTimeout(debounceTimer);searchCity(input.value);});

// Debounced local validation: no API calls happen on every keystroke.
input.addEventListener("input",()=>{
  clearTimeout(debounceTimer);
  const value=input.value.trim();
  if (!value) { clearStatus(); return; }
  debounceTimer=setTimeout(()=>{
    if(value.length===1) setStatus("Keep typing — enter at least two characters.");
    else if(!/^[\p{L}\p{M}\s.'-]+$/u.test(value)) setStatus("City names should use letters, spaces, apostrophes or hyphens.","error");
    else clearStatus();
  },350);
});

// Show a useful example city when the app first opens.
searchCity("Coimbatore");
