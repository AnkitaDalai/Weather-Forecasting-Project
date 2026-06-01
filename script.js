// ======================================
// OpenWeather API Key
// ======================================

const apiKey = "bd5e378503939ddaee76f12ad7a97608";

// ======================================
// DOM Elements
// ======================================

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const cityName = document.getElementById("cityName");
const dateTime = document.getElementById("dateTime");
const liveClock = document.getElementById("liveClock");

const temperature = document.getElementById("temperature");
const weatherCondition = document.getElementById("weatherCondition");
const weatherTip = document.getElementById("weatherTip");
const weatherIcon = document.getElementById("weatherIcon");

const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const pressure = document.getElementById("pressure");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");

const forecastCards = document.getElementById("forecastCards");

const recentCities = document.getElementById("recentCities");

const weatherAlert = document.getElementById("weatherAlert");
const closeAlert = document.getElementById("closeAlert");

const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

const weatherSection =
  document.querySelector(".weather-section");

const loader =
  document.getElementById("loader");

// ======================================
// Default Temperature Unit
// ======================================

let currentUnit = "metric";
let currentCity = "Bhubaneswar";

// ======================================
// Search Weather By City
// ======================================

searchBtn.addEventListener("click", () => {

  const city = cityInput.value.trim();

  if (city === "") {

    showError("Please enter a city name.");
    return;

  }

  getWeatherByCity(city);

});

// ======================================
// Search Weather With Enter Key
// ======================================

cityInput.addEventListener("keypress", (e) => {

  if (e.key === "Enter") {

    searchBtn.click();

  }

});

// ======================================
// Fetch Weather By City
// ======================================

async function getWeatherByCity(city) {

  currentCity = city;

  showLoader();

  try {

    // Current Weather API
    const weatherURL =
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}`;

    // Forecast API
    const forecastURL =
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${currentUnit}`;

    // Fetch Current Weather
    const weatherResponse =
      await fetch(weatherURL);

    const weatherData =
      await weatherResponse.json();

    // Invalid City
    if (weatherData.cod !== 200) {

      showError("City not found.");
      return;

    }

    // Fetch Forecast
    const forecastResponse =
      await fetch(forecastURL);

    const forecastData =
      await forecastResponse.json();

    // Forecast Validation
    if (!forecastData.list) {

      showError("Forecast unavailable.");
      return;

    }

    // Update UI
    updateCurrentWeather(weatherData);

    updateForecast(forecastData);

    updateWeatherTip(
      weatherData.weather[0].main
    );

    // Save Recent Search
    saveRecentCity(city);

    // Clear Input
    cityInput.value = "";

  } catch (error) {

    showError("Something went wrong.");

  } finally {

    hideLoader();

  }

}

// ======================================
// Get Weather By Current Location
// ======================================

locationBtn.addEventListener("click", () => {

  if (!navigator.geolocation) {

    showError("Geolocation is not supported.");
    return;

  }

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      showLoader();

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {

        const weatherURL =
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`;

        const forecastURL =
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`;

        // Fetch Current Weather
        const weatherResponse =
          await fetch(weatherURL);

        const weatherData =
          await weatherResponse.json();

        // Fetch Forecast
        const forecastResponse =
          await fetch(forecastURL);

        const forecastData =
          await forecastResponse.json();

        // Update Current City
        currentCity = weatherData.name;

        // Update UI
        updateCurrentWeather(weatherData);

        updateForecast(forecastData);

        updateWeatherTip(
          weatherData.weather[0].main
        );

      } catch (error) {

        showError(
          "Unable to fetch location weather."
        );

      } finally {

        hideLoader();

      }

    },

    () => {

      showError("Location access denied.");

    }

  );

});

// ======================================
// Update Current Weather
// ======================================

function updateCurrentWeather(data) {

  // City Name
  cityName.textContent =
    `${data.name}, ${data.sys.country}`;

  // Date
  const today = new Date();

  dateTime.textContent =
    today.toLocaleDateString("en-US", {

      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"

    });

  // Temperature
  const temp =
    Math.round(data.main.temp);

  temperature.textContent =
    currentUnit === "metric"
      ? `${temp}°C`
      : `${temp}°F`;

  // Weather Condition
  weatherCondition.textContent =
    data.weather[0].main;

  // Weather Icon
  weatherIcon.src =
    `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  weatherIcon.alt =
    data.weather[0].main;

  // Feels Like
  feelsLike.textContent =
    currentUnit === "metric"
      ? `${Math.round(data.main.feels_like)}°C`
      : `${Math.round(data.main.feels_like)}°F`;

  // Humidity
  humidity.textContent =
    `${data.main.humidity}%`;

  // Wind Speed
  windSpeed.textContent =
    currentUnit === "metric"
      ? `${data.wind.speed} m/s`
      : `${data.wind.speed} mph`;

  // Pressure
  pressure.textContent =
    `${data.main.pressure} hPa`;

  // Sunrise
  sunrise.textContent =
    formatTime(data.sys.sunrise);

  // Sunset
  sunset.textContent =
    formatTime(data.sys.sunset);

  // High Temperature Alert
  if (
    data.main.temp > 40 &&
    currentUnit === "metric"
  ) {

    weatherAlert.style.display = "flex";

  } else {

    weatherAlert.style.display = "none";

  }

  // Change Background
  changeBackground(
    data.weather[0].main
  );

}

// ======================================
// Update 5 Day Forecast
// ======================================

function updateForecast(data) {

  forecastCards.innerHTML = "";

  // Store unique days
  const forecastMap = {};

  data.list.forEach(item => {

    const date =
      item.dt_txt.split(" ")[0];

    // Save first forecast
    if (!forecastMap[date]) {

      forecastMap[date] = item;

    }

  });

  // Get first 5 days
  const dailyForecast =
    Object.values(forecastMap).slice(0, 5);

  // Empty Forecast Protection
  if (dailyForecast.length === 0) {

    forecastCards.innerHTML = `

      <p class="text-slate-500 text-lg col-span-full text-center">
        Forecast data unavailable.
      </p>

    `;

    return;

  }

  dailyForecast.forEach(day => {

    const card =
      document.createElement("div");

    card.className =
      "forecast-card bg-white/80 backdrop-blur-md rounded-3xl p-6 text-center shadow-lg border border-white/30 hover:-translate-y-2 transition duration-300";

    const date =
      new Date(day.dt_txt);

    card.innerHTML = `

      <h3 class="text-lg font-semibold text-slate-800 mb-3">
        ${date.toLocaleDateString("en-US", {
          weekday: "short"
        })}
      </h3>

      <img
        class="w-20 mx-auto"
        src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png"
        alt="Weather Icon"
      />

      <p class="text-slate-600 mt-2">
        ${day.weather[0].main}
      </p>

      <h4 class="text-3xl font-bold text-blue-600 mt-2">
        ${Math.round(day.main.temp)}
        ${currentUnit === "metric"
          ? "°C"
          : "°F"}
      </h4>

      <p class="text-sm text-slate-500 mt-2">
        Humidity:
        ${day.main.humidity}%
      </p>

    `;

    forecastCards.appendChild(card);

  });

}

// ======================================
// Save Recent Cities
// ======================================

function saveRecentCity(city) {

  let cities =
    JSON.parse(
      localStorage.getItem("recentCities")
    ) || [];

  // Remove Duplicate
  cities = cities.filter(item =>
    item.toLowerCase() !==
    city.toLowerCase()
  );

  // Add New City
  cities.unshift(city);

  // Limit To 5
  cities = cities.slice(0, 5);

  localStorage.setItem(
    "recentCities",
    JSON.stringify(cities)
  );

  loadRecentCities();

}

// ======================================
// Load Recent Cities
// ======================================

function loadRecentCities() {

  const cities =
    JSON.parse(
      localStorage.getItem("recentCities")
    ) || [];

  recentCities.innerHTML =
    `<option value="">Recent Searches</option>`;

  cities.forEach(city => {

    const option =
      document.createElement("option");

    option.value = city;
    option.textContent = city;

    recentCities.appendChild(option);

  });

}

// ======================================
// Select Recent City
// ======================================

recentCities.addEventListener("change", () => {

  const city =
    recentCities.value;

  if (city !== "") {

    getWeatherByCity(city);

  }

});

// ======================================
// Temperature Toggle
// ======================================

celsiusBtn.addEventListener("click", () => {

  currentUnit = "metric";

  celsiusBtn.classList.add("active");

  fahrenheitBtn.classList.remove("active");

  if (currentCity) {

    getWeatherByCity(currentCity);

  }

});

fahrenheitBtn.addEventListener("click", () => {

  currentUnit = "imperial";

  fahrenheitBtn.classList.add("active");

  celsiusBtn.classList.remove("active");

  if (currentCity) {

    getWeatherByCity(currentCity);

  }

});

// ======================================
// Close Weather Alert
// ======================================

closeAlert.addEventListener("click", () => {

  weatherAlert.style.display = "none";

});

// ======================================
// Dynamic Weather Tips
// ======================================

function updateWeatherTip(weather) {

  let tip = "";

  switch (weather.toLowerCase()) {

    case "clear":

      tip =
        "Perfect day for outdoor activities ☀️";

      break;

    case "clouds":

      tip =
        "Cloudy skies today. Carry light layers ☁️";

      break;

    case "rain":

      tip =
        "Don't forget your umbrella 🌧️";

      break;

    case "thunderstorm":

      tip =
        "Stay indoors and avoid open areas ⛈️";

      break;

    case "snow":

      tip =
        "Wear warm clothes and stay safe ❄️";

      break;

    default:

      tip =
        "Stay prepared for today's weather.";

  }

  weatherTip.textContent = tip;

}

// ======================================
// Dynamic Background
// ======================================

function changeBackground(weather) {

  let backgroundImage = "";

  switch (weather.toLowerCase()) {

    case "clear":

      backgroundImage =
        "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1400&auto=format&fit=crop')";

      break;

    case "clouds":

      backgroundImage =
        "url('https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=1400&auto=format&fit=crop')";

      break;

    case "rain":

      backgroundImage =
        "url('https://images.unsplash.com/photo-1501691223387-dd0500403074?q=80&w=1400&auto=format&fit=crop')";

      break;

    case "thunderstorm":

      backgroundImage =
        "url('https://images.unsplash.com/photo-1500674425229-f692875b0ab7?q=80&w=1400&auto=format&fit=crop')";

      break;

    case "snow":

      backgroundImage =
        "url('https://images.unsplash.com/photo-1517299321609-52687d1bc55a?q=80&w=1400&auto=format&fit=crop')";

      break;

    default:

      backgroundImage =
        "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1400&auto=format&fit=crop')";

  }

  weatherSection.style.backgroundImage =
    backgroundImage;

}

// ======================================
// Format Time
// ======================================

function formatTime(timestamp) {

  return new Date(timestamp * 1000)
    .toLocaleTimeString("en-US", {

      hour: "2-digit",
      minute: "2-digit"

    });

}

// ======================================
// Show Error Message
// ======================================

function showError(message) {

  const errorDiv =
    document.createElement("div");

  errorDiv.classList.add("error-message");

  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

  // Remove after 3 seconds
  setTimeout(() => {

    errorDiv.remove();

  }, 3000);

}

// ======================================
// Loader Functions
// ======================================

function showLoader() {

  if (loader) {

    loader.classList.remove("hidden");
    loader.classList.add("flex");

  }

}

function hideLoader() {

  if (loader) {

    loader.classList.remove("flex");
    loader.classList.add("hidden");

  }

}

// ======================================
// Live Clock
// ======================================

function updateClock() {

  const now = new Date();

  liveClock.textContent =
    now.toLocaleTimeString();

}

setInterval(updateClock, 1000);

// ======================================
// Auto Refresh Weather
// ======================================

setInterval(() => {

  if (currentCity) {

    getWeatherByCity(currentCity);

  }

}, 300000);

// ======================================
// Load Default Weather
// ======================================

window.addEventListener("load", () => {

  // Load Recent Searches
  loadRecentCities();

  // Start Clock
  updateClock();

  // Default Weather
  getWeatherByCity(currentCity);

});