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
const temperature = document.getElementById("temperature");
const weatherCondition = document.getElementById("weatherCondition");
const weatherIcon = document.getElementById("weatherIcon");

const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const pressure = document.getElementById("pressure");

const forecastCards = document.getElementById("forecastCards");

const recentCities = document.getElementById("recentCities");

const weatherAlert = document.getElementById("weatherAlert");
const closeAlert = document.getElementById("closeAlert");

const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

const weatherSection = document.querySelector(".weather-section");

const loader = document.getElementById("loader");

// ======================================
// Default Temperature Unit
// ======================================

let currentUnit = "metric";

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

  showLoader();

  try {

    const weatherURL =
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}`;

    const forecastURL =
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${currentUnit}`;

    // Fetch Both APIs Together
    const [weatherResponse, forecastResponse] =
      await Promise.all([
        fetch(weatherURL),
        fetch(forecastURL)
      ]);

    const weatherData =
      await weatherResponse.json();

    const forecastData =
      await forecastResponse.json();

    // Invalid City
    if (weatherData.cod !== 200) {

      showError("City not found.");
      return;

    }

    // Update UI
    updateCurrentWeather(weatherData);
    updateForecast(forecastData);

    // Save Recent Search
    saveRecentCity(city);

  } catch (error) {

    showError("Something went wrong.");

  } finally {

    smoothHideLoader();

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

        // Fetch Both APIs Together
        const [weatherResponse, forecastResponse] =
          await Promise.all([
            fetch(weatherURL),
            fetch(forecastURL)
          ]);

        const weatherData =
          await weatherResponse.json();

        const forecastData =
          await forecastResponse.json();

        // Update UI
        updateCurrentWeather(weatherData);
        updateForecast(forecastData);

      } catch (error) {

        showError("Unable to fetch location weather.");

      } finally {

        smoothHideLoader();

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

  // Current Date
  const today = new Date();

  dateTime.textContent =
    today.toDateString();

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

  // Weather Alert
  if (data.main.temp > 40 && currentUnit === "metric") {

    weatherAlert.classList.remove("hidden");
    weatherAlert.classList.add("flex");

  } else {

    weatherAlert.classList.add("hidden");

  }

  // Dynamic Background
  changeBackground(data.weather[0].main);

}

// ======================================
// Update 5 Day Forecast
// ======================================

function updateForecast(data) {

  forecastCards.innerHTML = "";

  // Store Unique Days
  const forecastMap = {};

  data.list.forEach(item => {

    const date = item.dt_txt.split(" ")[0];

    if (!forecastMap[date]) {

      forecastMap[date] = item;

    }

  });

  // First 5 Days
  const dailyForecast =
    Object.values(forecastMap).slice(0, 5);

  dailyForecast.forEach(day => {

    const card = document.createElement("div");

    card.className =
      "forecast-card bg-white/80 backdrop-blur-md rounded-3xl p-6 text-center shadow-lg border border-white/30 hover:-translate-y-2 transition duration-300";

    const date = new Date(day.dt_txt);

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
        ${currentUnit === "metric" ? "°C" : "°F"}
      </h4>

      <p class="text-sm text-slate-500 mt-2">
        Humidity: ${day.main.humidity}%
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
    JSON.parse(localStorage.getItem("recentCities")) || [];

  // Remove Duplicate
  cities = cities.filter(item =>
    item.toLowerCase() !== city.toLowerCase()
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
    JSON.parse(localStorage.getItem("recentCities")) || [];

  recentCities.innerHTML =
    `<option value="">Recent Searches</option>`;

  cities.forEach(city => {

    const option = document.createElement("option");

    option.value = city;
    option.textContent = city;

    recentCities.appendChild(option);

  });

}

// ======================================
// Select Recent City
// ======================================

recentCities.addEventListener("change", () => {

  const city = recentCities.value;

  if (city !== "") {

    getWeatherByCity(city);

  }

});

// ======================================
// Temperature Toggle
// ======================================

celsiusBtn.addEventListener("click", () => {

  currentUnit = "metric";

  celsiusBtn.classList.add(
    "bg-blue-600",
    "text-white"
  );

  fahrenheitBtn.classList.remove(
    "bg-blue-600",
    "text-white"
  );

  const city =
    cityName.textContent.split(",")[0];

  if (city) {

    getWeatherByCity(city);

  }

});

fahrenheitBtn.addEventListener("click", () => {

  currentUnit = "imperial";

  fahrenheitBtn.classList.add(
    "bg-blue-600",
    "text-white"
  );

  celsiusBtn.classList.remove(
    "bg-blue-600",
    "text-white"
  );

  const city =
    cityName.textContent.split(",")[0];

  if (city) {

    getWeatherByCity(city);

  }

});

// ======================================
// Close Weather Alert
// ======================================

closeAlert.addEventListener("click", () => {

  weatherAlert.classList.add("hidden");

});

// ======================================
// Dynamic Weather Background
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
// Show Error Message
// ======================================

function showError(message) {

  const errorDiv =
    document.createElement("div");

  errorDiv.classList.add("error-message");

  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

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

    loader.style.opacity = "1";

  }

}

function smoothHideLoader() {

  if (loader) {

    loader.style.opacity = "0";

    setTimeout(() => {

      loader.classList.add("hidden");
      loader.classList.remove("flex");

    }, 300);

  }

}

// ======================================
// Load Default Weather
// ======================================

window.addEventListener("load", () => {

  // Load Recent Searches
  loadRecentCities();

  // Default City
  getWeatherByCity("Bhubaneswar");

});