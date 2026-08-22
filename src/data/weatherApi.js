import axios from 'axios'

// 1. 백엔드 공용 주소와 발급받은 API Key (교재 224p)
// Vite는 .env의 VITE_ 접두사가 붙은 값만 클라이언트 코드에 노출한다.
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'
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
    // 경영 의사결정 확장(인력 배치 탭)에서 강수 여부 판단용. 새 API 호출 없이 같은 응답에서 꺼낸다.
    weatherMain: weather.weather[0].main,
    humidity: weather.main.humidity,
    wind: weather.wind.speed,
    microdust: Math.round(air.list[0].components.pm2_5),
    // 10차: 다른 팀 산출물들을 돌아보니 같은 API 응답에서 이미 내려주는데 우리만 안 쓰던 값이
    // 많았다(체감온도·최고최저·일출일몰·풍향·기압·가시거리·구름량). 추가 호출 없이 그대로 꺼낸다.
    feelsLike: Math.round(weather.main.feels_like),
    tempMin: Math.round(weather.main.temp_min),
    tempMax: Math.round(weather.main.temp_max),
    pressure: weather.main.pressure,
    windDeg: weather.wind.deg ?? 0,
    clouds: weather.clouds?.all ?? 0,
    // visibility는 m 단위로 오고 최대 10000이다 — km로 바꾸되 소수점 한 자리까지만
    // (7.016km처럼 원본 정밀도를 그대로 흘리면 다른 지표들과 자릿수가 안 맞아 지저분하다)
    visibility: Math.round((weather.visibility ?? 0) / 100) / 10,
    // 유닉스 초. 관측 시각과 일출/일몰을 "이 도시 현지 시각"으로 보여주려면 timezone 오프셋이 필요하다
    observedAt: weather.dt,
    sunrise: weather.sys?.sunrise ?? null,
    sunset: weather.sys?.sunset ?? null,
    timezone: weather.timezone ?? 0,
    // 미세먼지(PM10)와 통합 대기질 지수(1~5)도 이미 같은 응답에 들어 있다
    pm10: Math.round(air.list[0].components.pm10),
    airQualityIndex: air.list[0].main.aqi,
  }
}

// 9차: 교재 요구사항 ②("OpenWeatherMap의 다른 API로 기능 확장")는 열려 있는 항목이라 하나 더
// 붙였다. 5 Day / 3 Hour Forecast도 Free Tier에 포함된다(같은 키를 그대로 쓴다).
// 지금 날씨만 보던 앱이 "며칠 뒤까지" 보게 되면서, 경영 판단이 사후 대응에서 사전 계획이 된다.
export const fetchForecast = async (lat, lon) => {
  const response = await axios.get(FORECAST_URL, {
    params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'kr' },
  })
  return response.data
}

// 요구사항 3: OpenWeatherMap이 아닌 기타 외부 API(Nager.Date)로 기능 확장. 키가 필요 없다.
// 대한민국 공휴일 목록을 받아와서, 옥외 유동인구가 평시와 달라지는 날을 같이 보여준다.
export const fetchHolidays = async (year) => {
  const response = await axios.get(`${HOLIDAY_URL}/${year}/KR`)
  return response.data
}
