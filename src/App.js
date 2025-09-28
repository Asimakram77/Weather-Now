import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const WEATHER_CODE_MAP = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  80: "Rain showers",
};

function App() {
  const [city, setCity] = useState("London");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async () => {
    if (!city.trim()) return;
    setLoading(true);
    setError("");
    try {
      const geoRes = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}`
      );

      if (!geoRes.data.results || geoRes.data.results.length === 0) {
        setError("City not found. Try another search.");
        setWeather(null);
        setLoading(false);
        return;
      }

      const { latitude, longitude, name, country } = geoRes.data.results[0];

      const weatherRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&forecast_days=1&timezone=GMT`
      );

      const current = weatherRes.data.current_weather;
      const hourlyTimes = weatherRes.data.hourly?.time || [];
      const hourlyHumidity = weatherRes.data.hourly?.relativehumidity_2m || [];
      const idx = hourlyTimes.indexOf(current.time);
      const humidity = idx !== -1 ? hourlyHumidity[idx] : undefined;

      setWeather({
        city: name,
        country,
        temperature: Math.round(current.temperature),
        wind: Math.round(current.windspeed),
        code: current.weathercode,
        time: current.time,
        humidity,
      });
    } catch (e) {
      console.error(e);
      setError("Error fetching weather. Please try again.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") fetchWeather();
  };

  return (
    <div className="app-container">
      <h1 className="title">Weather Now</h1>

      <div className="search">
        <input
          className="search-input"
          type="text"
          placeholder="London"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="search-button" onClick={fetchWeather} disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {weather && (
        <div className="card">
          <div className="card-header">
            <div className="city">
              {weather.city}, {weather.country}
            </div>
            <div className="updated">{weather.time} (GMT)</div>
          </div>

          <div className="card-body">
            <div className="temp">
              {weather.temperature}
              <span className="unit">°C</span>
            </div>
            <div className="meta">
              <div className="meta-item">
                <span className="label">Wind</span>
                <span className="value">{weather.wind} km/h</span>
              </div>
              <div className="meta-item">
                <span className="label">Humidity</span>
                <span className="value">{weather.humidity != null ? `${weather.humidity}%` : "—"}</span>
              </div>
              <div className="meta-item">
                <span className="label">Conditions</span>
                <span className="value">{WEATHER_CODE_MAP[weather.code] || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!weather && !error && (
        <div className="hint">Search for a city to see the weather.</div>
      )}
    </div>
  );
}

export default App;
