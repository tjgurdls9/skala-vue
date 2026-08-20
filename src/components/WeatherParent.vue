<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
// 1. 컴포넌트 파일명 국룰 표기법(PascalCase) 매칭 수입
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'

const GRADE_STANDARD = {
  temp: { bestMin: 20, bestMax: 26, okMin: 16, okMax: 30 },
  humidity: { bestMin: 40, bestMax: 60, okMin: 30, okMax: 70 },
  dust: { best: 30, ok: 50 },
}
const MAX_SCORE = 27
const OUTDOOR_MIN_SCORE = 8
const HIGH_SCORE = 12
const MID_SCORE = 6
const PRIORITY_A_RATE = 1.3
const PRIORITY_B_RATE = 0.8
const LOG_LIMIT = 20

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 68, microdust: 55 },
  { id: 'city_02', name: '광주', temp: 27, status: '비', humidity: 82, microdust: 20 },
  { id: 'city_03', name: '울산', temp: 29, status: '맑음', humidity: 45, microdust: 88 },
  { id: 'city_04', name: '수원', temp: 24, status: '비', humidity: 75, microdust: 33 },
  { id: 'city_05', name: '부산', temp: 26, status: '흐림', humidity: 35, microdust: 42 },
])

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()
  if (!keyword) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(keyword))
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

const marketingBudget = ref(1000)

const getSegment = (grade) => {
  if (grade.dust === 1)
    return {
      label: '🏠 실내 집중형',
      plan: '미세먼지가 나빠 야외 행사는 어렵습니다. 실내 매장과 온라인 쿠폰 위주로 집행하는 것을 제안합니다.',
    }
  if (grade.score >= OUTDOOR_MIN_SCORE)
    return {
      label: '🎪 야외 프로모션 최적',
      plan: '세 지표 모두 좋습니다. 팝업스토어 같은 야외 행사를 진행해도 괜찮습니다.',
    }
  if (grade.humidity === 1)
    return {
      label: '💧 습도 관리형',
      plan: '습도가 높음으로 인한 불쾌감으로 체류 시간이 짧습니다. 쾌적한 행사장을 마련하거나 임팩트를 짧고 강하게 설정하는 것을 제안합니다.',
    }
  return {
    label: '🙂 무난형',
    plan: '특별한 제약이 없습니다. 기존 판촉을 유지하여 전환비용을 절약하는 것을 제안합니다.',
  }
}

const gradeTemp = (value) => {
  const standard = GRADE_STANDARD.temp
  if (value >= standard.bestMin && value <= standard.bestMax) return 3
  if (value >= standard.okMin && value <= standard.okMax) return 2
  return 1
}

const gradeHumidity = (value) => {
  const standard = GRADE_STANDARD.humidity
  if (value >= standard.bestMin && value <= standard.bestMax) return 3
  if (value >= standard.okMin && value <= standard.okMax) return 2
  return 1
}

const gradeDust = (value) => {
  const standard = GRADE_STANDARD.dust
  if (value < standard.best) return 3
  if (value < standard.ok) return 2
  return 1
}

const scoredList = computed(() =>
  filteredWeatherList.value.map((item) => {
    const temp = gradeTemp(item.temp)
    const humidity = gradeHumidity(item.humidity)
    const dust = gradeDust(item.microdust)
    const grade = { temp, humidity, dust, score: temp * humidity * dust }
    return { ...item, grade, code: `${temp}-${humidity}-${dust}`, segment: getSegment(grade) }
  }),
)

const totalScore = computed(() => scoredList.value.reduce((sum, item) => sum + item.grade.score, 0))

const evenShare = computed(() => (scoredList.value.length ? 100 / scoredList.value.length : 0))

const budgetPlan = computed(() => {
  const aLine = Math.min(evenShare.value * PRIORITY_A_RATE, 100)
  const bLine = evenShare.value * PRIORITY_B_RATE

  return scoredList.value
    .map((item) => {
      const share = totalScore.value ? Math.round((item.grade.score / totalScore.value) * 100) : 0
      return {
        ...item,
        share,
        budget: Math.round((share / 100) * marketingBudget.value),
        priority: share >= aLine ? 'A' : share >= bLine ? 'B' : 'C',
      }
    })
    .sort((a, b) => b.grade.score - a.grade.score)
})

const topCity = computed(() => {
  if (!budgetPlan.value.length) return null
  return budgetPlan.value[0]
})

watch(marketingBudget, (budget) => {
  const top = topCity.value
  addLog(`💰 총 예산 ${budget}만원 기준으로 다시 배분했습니다. (1순위: ${top ? top.name : '없음'})`)
})

const showDetail = (item) => {
  const grade = item.grade
  const lowest = Math.min(grade.temp, grade.humidity, grade.dust)
  const weakest = lowest === grade.dust ? '미세먼지' : lowest === grade.humidity ? '습도' : '기온'
  const meaning =
    grade.score >= HIGH_SCORE
      ? '세 지표 모두 적정해서 어떤 방식이든 성과를 기대할 수 있습니다. 예산을 몰아줄 후보입니다.'
      : grade.score >= MID_SCORE
        ? '병목인 지표가 있어 집행 방식을 가려서 골라야 합니다.'
        : '약한 지표 탓에 예산 효율이 낮습니다. 최소한으로 유지하고 다른 도시에 더 투자하는 것을 제안합니다.'
  const scoreSum = budgetPlan.value.map((city) => city.grade.score).join(' + ')

  window.alert(
    [
      `${item.name}의 현재 날씨는 [${item.status}] 상태입니다.`,
      ``,
      `[등급 판정]`,
      `기온 ${item.temp}도 → ${grade.temp}등급 (${GRADE_STANDARD.temp.bestMin}~${GRADE_STANDARD.temp.bestMax}도면 3등급)`,
      `습도 ${item.humidity}% → ${grade.humidity}등급 (${GRADE_STANDARD.humidity.bestMin}~${GRADE_STANDARD.humidity.bestMax}%면 3등급)`,
      `미세먼지 ${item.microdust} → ${grade.dust}등급 (${GRADE_STANDARD.dust.best} 미만이면 3등급)`,
      ``,
      `[집행 점수] ${grade.temp} × ${grade.humidity} × ${grade.dust} = ${grade.score}점 (최고 ${MAX_SCORE}점)`,
      `가장 낮은 등급은 ${weakest}(${lowest}등급)입니다. 이 지점이 병목입니다.`,
      `→ ${meaning}`,
      ``,
      `[예산 편성]`,
      `1) 화면에 보이는 도시들의 점수 합계: ${scoreSum} = ${totalScore.value}점`,
      `2) 이 도시의 몫: ${grade.score} / ${totalScore.value} = ${item.share}%`,
      `3) 총 예산 ${marketingBudget.value}만원 × ${item.share}% = ${item.budget}만원`,
      `4) 우선순위: ${item.share}% → ${item.priority} (균등 배분선 ${Math.round(evenShare.value)}%의 ${PRIORITY_A_RATE}배 이상 A, ${PRIORITY_B_RATE}배 이상 B, 나머지 C)`,
      `검색으로 도시를 필터링하면 총합계가 바뀌므로 우선순위도 다시 계산됩니다.`,
      ``,
      `[실행안] ${item.segment.label}`,
      item.segment.plan,
    ].join('\n'),
  )
}
</script>

<template>
  <div class="practice-section">
    <h2>⛅ 과제 3: 날씨 (컴포넌트)</h2>
    <div class="dashboard-wrapper">
      <BaseDashboardCard>
        <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />

        <p>
          마케팅 총 예산(만원):
          <input
            v-model.number="marketingBudget"
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
        <h3>🏙️ 지역별 날씨 현황</h3>

        <WeatherCard
          v-for="item in budgetPlan"
          :key="item.id"
          :city-item="item"
          @select-card="(msg) => (selectedCityInfo = msg)"
          @click-detail="showDetail"
        />

        <p v-if="!budgetPlan.length" class="empty-result">검색어와 일치하는 도시가 없습니다. 🥲</p>
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
.budget-input {
  width: 100px;
  padding: 8px;
  font-size: 14px;
}
.top-city {
  background: #fff8e1;
  border-left: 4px solid #f39c12;
  padding: 8px 10px;
  border-radius: 4px;
}
.empty-result {
  text-align: center;
  color: #868e96;
  padding: 12px 0;
}
.status-bar {
  background: #e8f5e9;
  padding: 10px;
  text-align: center;
  color: #2e7d32;
  font-weight: bold;
  border-radius: 6px;
}
</style>
