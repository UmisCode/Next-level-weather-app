// Using Open-Meteo free weather API (no API key required)
const BASE_URL = 'https://api.open-meteo.com/v1';

// DOM Elements (same as before)
const dayNameElement = document.getElementById('dayname');
const dateElement = document.getElementById('date');
const locationElement = document.getElementById('location');
const weatherIconElement = document.getElementById('weather-icon');
const temperatureElement = document.getElementById('temperature');
const weatherDescElement = document.getElementById('weather-description');
const precipitationElement = document.getElementById('precipitation');
const humidityElement = document.getElementById('humidity');
const windElement = document.getElementById('wind');
const pressureElement = document.getElementById('pressure');
const visibilityElement = document.getElementById('visibility');
const forecastListElement = document.getElementById('forecast-list');
const refreshBtn = document.getElementById('refresh-btn');
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loader = document.getElementById('loader');

// Weather icon mapping (updated for Open-Meteo weather codes)
const weatherIcons = {
    0: 'fas fa-sun', // Clear sky
    1: 'fas fa-cloud-sun', // Mainly clear
    2: 'fas fa-cloud-sun', // Partly cloudy
    3: 'fas fa-cloud', // Overcast
    45: 'fas fa-smog', // Fog
    48: 'fas fa-smog', // Depositing rime fog
    51: 'fas fa-cloud-rain', // Drizzle: Light
    53: 'fas fa-cloud-rain', // Drizzle: Moderate
    55: 'fas fa-cloud-rain', // Drizzle: Dense
    56: 'fas fa-cloud-rain', // Freezing Drizzle: Light
    57: 'fas fa-cloud-rain', // Freezing Drizzle: Dense
    61: 'fas fa-cloud-showers-heavy', // Rain: Slight
    63: 'fas fa-cloud-showers-heavy', // Rain: Moderate
    65: 'fas fa-cloud-showers-heavy', // Rain: Heavy
    66: 'fas fa-cloud-rain', // Freezing Rain: Light
    67: 'fas fa-cloud-rain', // Freezing Rain: Heavy
    71: 'fas fa-snowflake', // Snow fall: Slight
    73: 'fas fa-snowflake', // Snow fall: Moderate
    75: 'fas fa-snowflake', // Snow fall: Heavy
    77: 'fas fa-snowflake', // Snow grains
    80: 'fas fa-cloud-showers-heavy', // Rain showers: Slight
    81: 'fas fa-cloud-showers-heavy', // Rain showers: Moderate
    82: 'fas fa-cloud-showers-heavy', // Rain showers: Violent
    85: 'fas fa-snowflake', // Snow showers: Slight
    86: 'fas fa-snowflake', // Snow showers: Heavy
    95: 'fas fa-bolt', // Thunderstorm: Slight or moderate
    96: 'fas fa-bolt', // Thunderstorm with slight hail
    99: 'fas fa-bolt' // Thunderstorm with heavy hail
};

// Weather description mapping
const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Heavy thunderstorm with hail'
};

// Initialize the app
function init() {
    updateDate();
    
    refreshBtn.addEventListener('click', fetchWeatherByLocation);
    searchBtn.addEventListener('click', searchWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    
    fetchWeatherByLocation();
}

function updateDate() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    dayNameElement.textContent = days[now.getDay()];
    dateElement.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function showLoader() {
    loader.style.display = 'flex';
}

function hideLoader() {
    loader.style.display = 'none';
}

function fetchWeatherByLocation() {
    showLoader();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherData(latitude, longitude);
            },
            (error) => {
                console.error('Error getting location:', error);
                // Default to New York coordinates if geolocation fails
                fetchWeatherData(40.7128, -74.0060);
                hideLoader();
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
        fetchWeatherData(40.7128, -74.0060);
        hideLoader();
    }
}

function searchWeather() {
    const city = cityInput.value.trim();
    if (city) {
        showLoader();
        // First get coordinates for the city
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
            .then(response => response.json())
            .then(data => {
                if (!data.results || data.results.length === 0) {
                    throw new Error('City not found');
                }
                const { latitude, longitude, name, country } = data.results[0];
                locationElement.textContent = `${name}, ${country}`;
                return fetchWeatherData(latitude, longitude);
            })
            .catch(error => {
                console.error('Error fetching city data:', error);
                alert('City not found. Please try another location.');
                hideLoader();
            });
    }
}

function fetchWeatherData(lat, lon) {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    // Fetch current weather
    fetch(`${BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,weathercode,pressure_msl,visibility,windspeed_10m,precipitation&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`)
        .then(response => response.json())
        .then(data => {
            updateCurrentWeather(data, currentHour);
            updateForecast(data);
            hideLoader();
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            alert('Error fetching weather data. Please try again.');
            hideLoader();
        });
}

function updateCurrentWeather(data, currentHour) {
    const { current_weather, hourly, daily } = data;
    const { temperature, weathercode, windspeed } = current_weather;
    
    // Get current hour data from hourly arrays
    const hourlyData = {
        humidity: hourly.relativehumidity_2m[currentHour],
        pressure: hourly.pressure_msl[currentHour],
        visibility: hourly.visibility[currentHour],
        precipitation: hourly.precipitation[currentHour]
    };
    
    // Update weather icon and description
    weatherIconElement.className = `weather-icon ${weatherIcons[weathercode]}`;
    weatherDescElement.textContent = weatherDescriptions[weathercode];
    
    // Update temperature and other values
    temperatureElement.textContent = `${Math.round(temperature)}°C`;
    humidityElement.textContent = `${hourlyData.humidity}%`;
    windElement.textContent = `${Math.round(windspeed * 3.6)} km/h`;
    pressureElement.textContent = `${Math.round(hourlyData.pressure)} hPa`;
    visibilityElement.textContent = `${hourlyData.visibility / 1000} km`;
    precipitationElement.textContent = `${hourlyData.precipitation} mm`;
    
    // Update background based on time of day
    updateBackground(currentHour, daily.sunrise[0], daily.sunset[0]);
}

function updateForecast(data) {
    forecastListElement.innerHTML = '';
    const { daily } = data;
    
    // Skip today (index 0) if you want to show only future days
    for (let i = 1; i < Math.min(6, daily.time.length); i++) {
        const date = new Date(daily.time[i]);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[date.getDay()];
        const weatherCode = daily.weathercode[i];
        
        const forecastItem = document.createElement('li');
        forecastItem.innerHTML = `
            <span class="day-name">${dayName}</span>
            <i class="day-icon ${weatherIcons[weatherCode]}"></i>
            <span class="day-temp">${Math.round(daily.temperature_2m_max[i])}° <span>${Math.round(daily.temperature_2m_min[i])}°</span></span>
        `;
        
        forecastListElement.appendChild(forecastItem);
    }
}

function updateBackground(currentHour, sunrise, sunset) {
    const weatherSide = document.querySelector('.weather-side');
    const weatherGradient = document.querySelector('.weather-gradient');
    
    // Convert sunrise/sunset strings to hours
    const sunriseHour = new Date(sunrise).getHours();
    const sunsetHour = new Date(sunset).getHours();
    
    if (currentHour >= sunriseHour && currentHour < sunriseHour + 2) {
        // Sunrise
        weatherGradient.style.background = 'linear-gradient(135deg, rgba(253, 184, 19, 0.6) 0%, rgba(254, 139, 98, 0.6) 100%)';
        weatherSide.style.backgroundImage = 'url("https://images.unsplash.com/photo-1494548162494-384bba4ab999?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")';
    } else if (currentHour >= sunsetHour - 2 && currentHour < sunsetHour + 2) {
        // Sunset
        weatherGradient.style.background = 'linear-gradient(135deg, rgba(254, 139, 98, 0.6) 0%, rgba(106, 75, 165, 0.6) 100%)';
        weatherSide.style.backgroundImage = 'url("https://images.unsplash.com/photo-1509316785289-025f5b846b35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")';
    } else if (currentHour >= sunsetHour || currentHour < sunriseHour) {
        // Night
        weatherGradient.style.background = 'linear-gradient(135deg, rgba(11, 21, 56, 0.6) 0%, rgba(43, 9, 66, 0.6) 100%)';
        weatherSide.style.backgroundImage = 'url("https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")';
    } else {
        // Day
        weatherGradient.style.background = 'linear-gradient(135deg, rgba(0, 198, 251, 0.6) 0%, rgba(0, 91, 234, 0.6) 100%)';
        weatherSide.style.backgroundImage = 'url("https://images.unsplash.com/photo-1559963110-71b394e7494d?ixlib=rb-1.2.1&auto=format&fit=crop&w=675&q=80")';
    }
}

document.addEventListener('DOMContentLoaded', init);