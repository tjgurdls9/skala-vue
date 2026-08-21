import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 요구사항 4번: 본인 추가 스토어.
// 마케팅 총 예산을 대시보드(WeatherHomeView)와 지표 요약(WeatherSummaryView)이 같이 본다.
// 스토어로 올리기 전에는 두 화면이 각자 ref(1000)을 들고 있어서 예산이 따로 놀았다.
export const useBudgetStore = defineStore('budget', () => {
  // 1. State: 마케팅 총 예산 (단위: 만원)
  const total = ref(1000)

  // 2. Getters: 화면에 그대로 찍을 수 있는 문구
  const totalLabel = computed(() => `${total.value}만원`)

  // 3. Actions: 예산을 지정한 값으로 바꾼다 (프리셋 버튼용)
  function setTotal(value) {
    total.value = value
  }

  return { total, totalLabel, setTotal }
})
