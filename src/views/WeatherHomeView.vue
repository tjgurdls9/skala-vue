<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 1. 컴포넌트 파일명 국룰 표기법(PascalCase) 매칭 수입
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'
import SearchBar from '../components/weather/SearchBar.vue'
import WeatherCard from '../components/weather/WeatherCard.vue'
// 2. 상세/요약 화면과 공유하는 도시 등록 정보와 등급 판정 로직
import { storeToRefs } from 'pinia'
import { weatherList as cityRegistry, buildBudgetPlan } from '../data/weatherMock.js'
import axios from 'axios'
import { fetchCityWeather, fetchHolidays } from '../data/weatherApi.js'
import { useBudgetStore } from '../stores/budgetStore.js'

const LOG_LIMIT = 20

// 3. 과제 4: 라우터 이동을 위한 route(수신) / router(송신) 객체
const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

// 4. 과제 6: 등록된 도시 5개의 실시간 날씨(기온/습도/미세먼지/풍속)를 담을 배열
const weatherList = ref([])
const isLoading = ref(false)

const loadWeather = async () => {
  isLoading.value = true
  try {
    // 5개 도시를 동시에 조회한다. (교재 226p axios.all)
    weatherList.value = await axios.all(cityRegistry.map(fetchCityWeather))
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    alert('날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부나 주소를 확인하세요.')
  } finally {
    isLoading.value = false
  }
}

// 5. 요구사항 3: OpenWeatherMap이 아닌 기타 외부 API(공휴일)로 기능 확장
const holidays = ref([])
const loadHolidays = async () => {
  try {
    const year = new Date().getFullYear()
    holidays.value = await fetchHolidays(year)
  } catch (error) {
    console.error('공휴일 조회 중 에러가 발생했습니다:', error)
  }
}
// ponytail: 연말에는 다음 해 공휴일이 안 잡힌다. 해가 바뀌면 새로고침으로 갱신하면 됨
const nextHoliday = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return holidays.value.find((item) => item.date >= today) ?? null
})

onMounted(() => {
  loadWeather()
  loadHolidays()
  // 주소창에 ?search=값 이 이미 있다면 해당 값으로 내부 상태 복원
  if (route.query.search) {
    searchQuery.value = route.query.search
  }
})

const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()
  if (!keyword) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(keyword))
})

// 검색어를 주소창 쿼리 스트링에 실시간 동기화한다.
// push를 쓰면 글자 수만큼 히스토리가 쌓여 뒤로 가기가 먹통이 되므로 replace를 쓴다.
watch(searchQuery, (keyword) => {
  router.replace(keyword ? '/?search=' + keyword : '/')
})

let history = []
const logs = ref([])
const addLog = (message) => {
  console.log(message)
  history = [`${new Date().toLocaleTimeString()} ${message}`, ...history].slice(0, LOG_LIMIT)
  logs.value = history
}

watch(selectedCityInfo, (newInfo, oldInfo) => {
  addLog(`📌 상태바 변경: [${oldInfo}] → [${newInfo}]`)
})

watchEffect(() => {
  addLog(`⌨️ 검색어 추적: "${searchQuery.value}" (결과 ${filteredWeatherList.value.length}건)`)
})

// 과제 5: 예산을 지표 요약 화면과 공유하기 위해 스토어로 올렸다.
// State/Getters는 구조분해하면 반응성이 끊기므로 storeToRefs로 감싼다. (교재 205p)
const budgetStore = useBudgetStore()
const { total } = storeToRefs(budgetStore)

const budgetPlan = computed(() => buildBudgetPlan(filteredWeatherList.value, total.value))

const topCity = computed(() => {
  if (!budgetPlan.value.length) return null
  return budgetPlan.value[0]
})

watch(total, (budget) => {
  const top = topCity.value
  addLog(`💰 총 예산 ${budget}만원 기준으로 다시 배분했습니다. (1순위: ${top ? top.name : '없음'})`)
})

// 과제 3의 window.alert()를 걷어내고 상세 페이지로 이동시킨다. (Programmatic Navigation)
// 예산/점유율은 지금 화면에 보이는 도시들 기준이라 상세에서 다시 못 구한다. 쿼리로 같이 넘긴다.
const goDetail = (item) => {
  router.push({
    name: 'WeatherDetail',
    params: { cityId: item.id },
    query: { share: item.share, budget: item.budget, priority: item.priority },
  })
}
</script>

<template>
  <div class="practice-section">
    <h2>⛅ 지역별 날씨 대시보드</h2>
    <div class="dashboard-wrapper">
      <p v-if="nextHoliday" class="holiday-banner">
        📅 다가오는 공휴일: {{ nextHoliday.date }} {{ nextHoliday.localName }} — 이 날은 야외
        프로모션 참여율이 높을 수 있습니다.
      </p>

      <BaseDashboardCard>
        <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />

        <p>
          마케팅 총 예산(만원):
          <input
            v-model.number="total"
            class="budget-input"
            autocomplete="off"
            type="number"
            min="0"
            step="100"
          />
        </p>
        <p v-if="topCity" class="top-city">
          가장 먼저 집행할 도시: <strong>{{ topCity.name }}</strong> {{ topCity.budget }}만원 ({{
            topCity.share
          }}%)
        </p>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <h3>
          🏙️ 지역별 날씨 현황
          <button class="btn-refresh" :disabled="isLoading" @click="loadWeather">
            {{ isLoading ? '불러오는 중...' : '🔄 새로고침' }}
          </button>
        </h3>

        <WeatherCard
          v-for="item in budgetPlan"
          :key="item.id"
          :city-item="item"
          @select-card="(msg) => (selectedCityInfo = msg)"
          @click-detail="goDetail"
        />

        <p v-if="isLoading && !budgetPlan.length" class="empty-result">
          실시간 날씨를 불러오는 중입니다...
        </p>
        <p v-else-if="!budgetPlan.length" class="empty-result">
          검색어와 일치하는 도시가 없습니다. 🥲
        </p>
      </BaseDashboardCard>

      <details class="monitor log-box">
        <summary>👁️‍🗨️ Watcher 로그 보기 ({{ logs.length }}건)</summary>
        <ul>
          <li v-for="(log, index) in logs" :key="index">{{ log }}</li>
          <li v-if="!logs.length">아직 기록된 로그가 없습니다.</li>
        </ul>
      </details>

      <div class="status-bar">
        {{ selectedCityInfo }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  width: auto;
  margin: 0;
}
.holiday-banner {
  background: #e5f3ff;
  color: #007aff;
  padding: 10px 14px;
  border-radius: var(--radius-control);
  margin: 0 0 12px;
}
.btn-refresh {
  float: right;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
}
.budget-input {
  width: 100px;
  padding: 8px;
  font-size: 14px;
  /* 회계 표기: 금액 입력란은 우측 정렬하고 자릿수를 등폭으로 맞춘다 */
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.top-city {
  background: #fff4e5;
  color: #ff9500;
  padding: 10px 14px;
  border-radius: var(--radius-control);
}
.empty-result {
  text-align: center;
  color: #8e8e93;
  padding: 12px 0;
}
.status-bar {
  background: #e6f9ed;
  padding: 10px;
  text-align: center;
  color: #248a5e;
  font-weight: bold;
  border-radius: var(--radius-control);
}
</style>
