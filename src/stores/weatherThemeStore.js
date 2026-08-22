import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useWeatherStore } from './weatherStore.js'

// weatherMain(OpenWeatherMap 원본 필드) → 배경 사진 4종.
// 대시보드의 날씨 필터도 같은 매핑을 써야 배경과 필터 분류가 어긋나지 않는다.
export const WEATHER_THEME_MAP = {
  Clear: 'clear',
  Clouds: 'clouds',
  Mist: 'clouds',
  Haze: 'clouds',
  Fog: 'clouds',
  Rain: 'rain',
  Drizzle: 'rain',
  Thunderstorm: 'rain',
  Snow: 'snow',
}

// 11차 구조 수정: 지금까지 배경 테마는 WeatherHomeView가 자기 안에서 계산해 스토어에 밀어넣었다.
// 그래서 대시보드를 떠나면(지표 요약·실습 아카이브) 아무도 테마를 갱신하지 않아 배경이 직전
// 값에 멈췄고, 홈으로 돌아올 때만 다시 맞았다 — 배경이 한 화면에 묶여 있는 구조였다.
//
// 이제 테마는 "지금 보고 있는 지역"에서 파생된다. 그 지역은 weatherStore가 들고 있으므로
// 어느 탭에 있든 같은 값을 본다. 화면은 더 이상 배경을 신경 쓰지 않는다.
export const useWeatherThemeStore = defineStore('weatherTheme', () => {
  const weatherStore = useWeatherStore()

  // 사용자가 세그먼트로 특정 테마를 미리보기 할 때만 쓰는 덮어쓰기 값('auto'면 실제 날씨)
  const override = ref('auto')

  // 지역을 고정했으면 그 지역, 아니면 전국 1순위 지역의 실제 날씨를 따른다.
  const liveTheme = computed(() => {
    const target = weatherStore.selectedCity ?? weatherStore.rankedAll[0] ?? null
    return WEATHER_THEME_MAP[target?.weatherMain] ?? 'clear'
  })

  const theme = computed(() => (override.value === 'auto' ? liveTheme.value : override.value))

  function setOverride(next) {
    override.value = next
  }

  return { theme, override, liveTheme, setOverride }
})
