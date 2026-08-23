/* global process */
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

export default async function handler(request, response) {
  const { lat, lon } = request.query
  const key = process.env.OPENWEATHER_KEY || process.env.VITE_OPENWEATHER_KEY
  if (!key) return response.status(500).json({ message: 'OpenWeatherMap API key is missing.' })
  if (!lat || !lon) return response.status(400).json({ message: 'lat and lon are required.' })

  const query = new URLSearchParams({ lat, lon, appid: key, units: 'metric', lang: 'kr' })
  const [weatherResponse, airResponse] = await Promise.all([
    fetch(`${BASE_URL}/weather?${query}`),
    fetch(`${BASE_URL}/air_pollution?${new URLSearchParams({ lat, lon, appid: key })}`),
  ])
  if (!weatherResponse.ok || !airResponse.ok) {
    return response.status(weatherResponse.ok ? airResponse.status : weatherResponse.status).json({
      message: 'Upstream weather request failed.',
    })
  }

  response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800')
  return response.status(200).json({
    weather: await weatherResponse.json(),
    air: await airResponse.json(),
  })
}
