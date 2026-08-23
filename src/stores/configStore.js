import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 날씨 단위(섭씨/화씨)를 앱 전체에서 공유하는 전역 스토어.
// 파일명은 configStore.js, 내보내는 함수명은 use + 파일명 + Store 규칙을 따른다.
export const useConfigStore = defineStore('config', () => {
  // 1. State: 단위를 저장하는 변수 (초기값 celsius)
  const unit = ref('celsius')

  // 2. Getters: 현재 단위 상태에 맞는 기호
  const unitSymbol = computed(() => (unit.value === 'fahrenheit' ? '℉' : '℃'))

  // 화면마다 변환식을 따로 쓰면 최고·최저·체감 온도가 섭씨로 남는 문제가 생긴다.
  // 원본 데이터는 섭씨로 유지하고, 표시 직전에 이 함수 하나로 변환한다.
  function convertTemperature(value) {
    if (value === undefined || value === null) return value
    return unit.value === 'fahrenheit' ? Math.round((value * 9) / 5 + 32) : Math.round(value)
  }

  // 3. Actions: 'celsius'와 'fahrenheit'를 토글(스위칭)하는 함수
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  return { unit, unitSymbol, convertTemperature, toggleUnit }
})
