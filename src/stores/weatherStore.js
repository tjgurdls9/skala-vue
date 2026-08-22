import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { weatherList as cityRegistry, buildRegionalOutlook } from '../data/weatherMock.js'
import { fetchCityWeather } from '../data/weatherApi.js'

// 11차: 지금까지 홈/요약/상세 세 화면이 각자 onMounted에서 전국 17개 지역을 따로 조회했다.
// 화면을 옮길 때마다 API를 17×2회씩 다시 때렸고(무료 티어를 그냥 태우는 셈),
// 무엇보다 "지금 보고 있는 지역"이라는 상태가 홈 화면 안에만 갇혀 있어서
// 탭을 옮기면 앱 전체 배경(App.vue)이 갱신되지 않고 이전 값에 멈춰 있었다.
//
// 그래서 조회 결과와 선택 지역을 스토어로 올린다.
// - 배경 테마는 이 스토어의 selectedCity에서 파생되므로 어느 탭에 있든 일관된다.
// - 캐시가 있으면 재조회하지 않는다(사용자가 새로고침을 누를 때만 다시 부른다).
export const useWeatherStore = defineStore('weather', () => {
  const list = ref([])
  const isLoading = ref(false)
  const loadedAt = ref(null)
  const errorMessage = ref('')

  // 사용자가 대시보드에서 직접 고른 지역. 비어 있으면 자동 순환(spotlight)을 따른다.
  const selectedCityId = ref('')

  const load = async ({ force = false } = {}) => {
    if (isLoading.value) return
    // 이미 받아둔 데이터가 있으면 화면을 옮겨도 다시 부르지 않는다
    if (!force && list.value.length) return

    isLoading.value = true
    errorMessage.value = ''
    try {
      list.value = await axios.all(cityRegistry.map(fetchCityWeather))
      loadedAt.value = Date.now()
    } catch (error) {
      console.error('통신 중 에러가 발생했습니다:', error)
      // 11차: 여기서 alert()를 띄우면 화면 전환 중에도 모달이 튀어나와 흐름이 끊긴다.
      // 메시지를 상태로 두고 화면이 배너로 보여주게 바꿨다.
      errorMessage.value = '날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부를 확인하세요.'
    } finally {
      isLoading.value = false
    }
  }

  // 막대/지도에서 누를 때: 같은 지역을 다시 누르면 선택을 풀어 전국 1순위로 돌아간다
  const selectCity = (cityId) => {
    selectedCityId.value = selectedCityId.value === cityId ? '' : cityId
  }

  // 상세 화면처럼 "이 지역을 보고 있다"가 확정된 경우엔 토글 없이 그대로 맞춘다.
  // 이걸 안 하면 상세로 들어왔을 때 배경만 다른 지역(전국 1순위) 날씨로 남는다.
  const setCity = (cityId) => {
    selectedCityId.value = cityId
  }

  // 전국 기준 점수/우선순위가 붙은 목록. 검색 필터는 화면 쪽 책임이라 여기서는 전체만 만든다.
  const rankedAll = computed(() => buildRegionalOutlook(list.value))

  const selectedCity = computed(
    () => rankedAll.value.find((item) => item.id === selectedCityId.value) ?? null,
  )

  const findById = (cityId) => rankedAll.value.find((item) => item.id === cityId) ?? null

  return {
    list,
    isLoading,
    loadedAt,
    errorMessage,
    selectedCityId,
    rankedAll,
    selectedCity,
    load,
    selectCity,
    setCity,
    findById,
  }
})
