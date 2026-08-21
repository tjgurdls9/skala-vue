import axios from 'axios'

// 1. 백엔드 공용 주소와 발급받은 API Key (교재 224p)
// Vite는 .env의 VITE_ 접두사가 붙은 값만 클라이언트 코드에 노출한다.
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution'
const HOLIDAY_URL = 'https://date.nager.at/api/v3/PublicHolidays'

// 위도/경도 기반 실시간 날씨 조회 (교재 220p Call current weather data)
export const fetchCurrentWeather = async (lat, lon) => {
  const response = await axios.get(WEATHER_URL, {
    params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'kr' },
  })
  return response.data
}

// 요구사항 2: OpenWeatherMap의 다른 API(Air Pollution)로 기능 확장.
// Current Weather API에는 미세먼지가 없어서 같은 좌표로 별도 엔드포인트를 한 번 더 호출한다.
export const fetchAirPollution = async (lat, lon) => {
  const response = await axios.get(AIR_POLLUTION_URL, {
    params: { lat, lon, appid: API_KEY },
  })
  return response.data
}

// 도시 하나(id, name, region, lat, lon)를 받아 실시간 날씨 + 미세먼지를 합쳐서 돌려준다.
// 두 요청을 axios.all로 동시에 보낸다. (교재 226p 병렬 요청)
export const fetchCityWeather = async (city) => {
  const [weather, air] = await axios.all([
    fetchCurrentWeather(city.lat, city.lon),
    fetchAirPollution(city.lat, city.lon),
  ])
  return {
    ...city,
    temp: Math.round(weather.main.temp),
    status: weather.weather[0].description,
    humidity: weather.main.humidity,
    wind: weather.wind.speed,
    microdust: Math.round(air.list[0].components.pm2_5),
  }
}

// 요구사항 3: OpenWeatherMap이 아닌 기타 외부 API(Nager.Date)로 기능 확장. 키가 필요 없다.
// 대한민국 공휴일 목록을 받아와서, 이 앱의 마케팅 예산 편성과 엮어 보여준다.
export const fetchHolidays = async (year) => {
  const response = await axios.get(`${HOLIDAY_URL}/${year}/KR`)
  return response.data
}
