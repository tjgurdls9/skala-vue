/* global process */
export default async function handler(request, response) {
  const { lat, lon } = request.query
  const key = process.env.OPENWEATHER_KEY || process.env.VITE_OPENWEATHER_KEY
  if (!key) return response.status(500).json({ message: 'OpenWeatherMap API key is missing.' })
  if (!lat || !lon) return response.status(400).json({ message: 'lat and lon are required.' })

  const query = new URLSearchParams({ lat, lon, appid: key, units: 'metric', lang: 'kr' })
  const upstream = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${query}`)
  if (!upstream.ok) {
    return response.status(upstream.status).json({ message: 'Upstream forecast request failed.' })
  }

  response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800')
  return response.status(200).json(await upstream.json())
}
