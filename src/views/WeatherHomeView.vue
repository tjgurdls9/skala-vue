<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 1. 컴포넌트 파일명 국룰 표기법(PascalCase) 매칭 수입
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'
import SearchBar from '../components/weather/SearchBar.vue'
import WeatherCard from '../components/weather/WeatherCard.vue'
import WeatherMap from '../components/weather/WeatherMap.vue'
import WeatherDeskIcon from '../components/WeatherDeskIcon.vue'
// 2. 상세/요약 화면과 공유하는 도시 등록 정보와 등급 판정 로직
import { storeToRefs } from 'pinia'
import {
  buildRegionalOutlook,
  buildRiskAlerts,
  buildDiscomfort,
  buildOpsMode,
  summarizeOps,
  execGrade,
  OPS_MODES,
  EXEC_MAX_SCORE,
} from '../data/weatherMock.js'
import { fetchHolidays } from '../data/weatherApi.js'
import { useWeatherStore } from '../stores/weatherStore.js'
import { useConfigStore } from '../stores/configStore.js'
import { WEATHER_THEME_MAP } from '../stores/weatherThemeStore.js'
import {
  Calendar,
  RefreshRight,
  CircleCheck,
  InfoFilled,
  Opportunity,
} from '@element-plus/icons-vue'

// 3. 과제 4: 라우터 이동을 위한 route(수신) / router(송신) 객체
const route = useRoute()
const router = useRouter()

const searchQuery = ref('')

// 11차: 조회를 스토어로 올렸다. 홈/요약/상세가 같은 데이터를 공유하므로 탭을 옮겨도
// 다시 부르지 않고, "선택한 지역"도 화면 밖에서 유지된다.
const weatherStore = useWeatherStore()
const configStore = useConfigStore()
const { list: weatherList, isLoading } = storeToRefs(weatherStore)

const formatTemp = (value) => `${configStore.convertTemperature(value)}${configStore.unitSymbol}`

const loadWeather = () => weatherStore.load({ force: true })

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
  weatherStore.load()
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
  router.replace(keyword ? '/dashboard?search=' + keyword : '/dashboard')
})

// 11차: 예산 개념을 걷어냈다(사유는 weatherMock.js의 buildRegionalOutlook 주석 참고).
// 검색으로 걸러진 지역들에 점수/우선순위를 붙인다.
const budgetPlan = computed(() => buildRegionalOutlook(filteredWeatherList.value))

// --- 히어로 패널이 비추는 지역 ---
// 11차: 원래는 6초마다 지역을 자동으로 돌렸다. 그런데 배경 사진까지 같이 바뀌다 보니
// (1) 사용자가 읽는 중에 화면이 저 혼자 넘어가고, (2) 지역을 눌러 고정하는 기능이 생기면서
// "지금 보고 있는 지역"이 자동 순환인지 내가 고른 것인지 헷갈렸다.
// 이제 초점은 오직 사용자가 고른 지역이고, 안 골랐으면 영향 점수 1순위 지역이다.
const spotlightCity = computed(() => {
  if (!budgetPlan.value.length) return null
  const picked = budgetPlan.value.find((item) => item.id === weatherStore.selectedCityId)
  return picked ?? budgetPlan.value[0]
})

const heroBadgeText = computed(() => {
  if (!spotlightCity.value) return '날씨 × 전사 경영 판단'
  // 13차-q: pinned일 때 태그를 통째로 지웠더니 '왜 이 지역이 여기 있는지' 근거가
  // 사라졌다. 항상 둘 중 하나를 붙인다 — 직접 골랐거나, 기본값(1위)이거나.
  const pinned = weatherStore.selectedCityId === spotlightCity.value.id
  return `${spotlightCity.value.name} 기준 실시간 날씨 (${pinned ? '직접 선택' : '기상 대응 우수'})`
})

// 11차: 예산을 걷어낸 자리에 도메인과 무관하게 통하는 지표를 둔다.
const avgDiscomfort = computed(() => {
  if (!budgetPlan.value.length) return null
  const sum = budgetPlan.value.reduce((acc, item) => acc + buildDiscomfort(item).value, 0)
  return Math.round(sum / budgetPlan.value.length)
})

const avgTemp = computed(() => {
  if (!budgetPlan.value.length) return null
  const sum = budgetPlan.value.reduce((acc, item) => acc + item.temp, 0)
  return Math.round(sum / budgetPlan.value.length)
})

// 마케팅 세그먼트와 별개로, 재고/인력/경보 3개 축 중 하나라도 안전(success)이 아니면 리스크 지역으로 센다.
// 11차: 원래는 '주의' 이상이면 전부 셌더니 한여름엔 습도 하나로 17개 지역이 전부 걸려서
// "리스크 감지 17개 지역"이라는, 아무것도 알려주지 않는 숫자가 됐다.
// 경보(error) 수준만 센다 — 화면의 숫자는 봤을 때 행동이 갈려야 의미가 있다.
const riskCityCount = computed(
  () =>
    budgetPlan.value.filter((item) =>
      buildRiskAlerts(item).some((alert) => alert.level === 'error'),
    ).length,
)

// --- 10차: 목록 필터 / 정렬 / 시상대 / 한 줄 인사이트 ---
const weatherFilters = [
  { value: 'all', label: '전체' },
  { value: 'clear', label: '맑음' },
  { value: 'clouds', label: '흐림' },
  { value: 'rain', label: '비·눈' },
]
const weatherFilter = ref('all')
const sortKey = ref('score')

// 배경 테마와 같은 매핑을 재사용하되, 비/눈은 한 칸으로 합쳐 필터를 단순하게 둔다
const filterGroup = (weatherMain) => {
  const theme = WEATHER_THEME_MAP[weatherMain] ?? 'clear'
  return theme === 'snow' ? 'rain' : theme
}

const visiblePlan = computed(() => {
  const list = budgetPlan.value.filter(
    (item) => weatherFilter.value === 'all' || filterGroup(item.weatherMain) === weatherFilter.value,
  )
  const sorted = [...list]
  if (sortKey.value === 'temp') sorted.sort((a, b) => b.temp - a.temp)
  else if (sortKey.value === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  else if (sortKey.value === 'thi')
    sorted.sort((a, b) => buildDiscomfort(b).value - buildDiscomfort(a).value)
  // 'score'는 buildRegionalOutlook이 이미 점수 내림차순으로 정렬해 두므로 그대로 둔다
  return sorted
})

// 13차: 카드 목록 페이지네이션.
// 83장을 쭉 늘어놓으면 스크롤 8화면이다. 한때 이 자리를 한 줄짜리 컴팩트 행으로 바꿨는데,
// 그건 '지표 요약'(/summary) 탭이 이미 하고 있는 일이라 두 화면이 똑같아졌다.
// 역할을 다시 갈랐다 — /summary는 전체를 한 줄씩 비교하는 곳, 여기는 몇 개를 자세히 보는 곳.
// 그래서 카드만 남기고 길이는 페이지네이션으로 끊는다.
const CARDS_PER_PAGE = 6
const page = ref(1)
watch(visiblePlan, () => {
  page.value = 1
})
const pagedPlan = computed(() => {
  const start = (page.value - 1) * CARDS_PER_PAGE
  return visiblePlan.value.slice(start, start + CARDS_PER_PAGE)
})

// 상위 3곳. 지도 오른쪽 패널에서 지역을 고르기 전 기본 화면으로 쓴다.
// 필터를 걸어도 "오늘의 1순위"는 바뀌지 않아야 하므로 항상 전체 기준이다.
const podium = computed(() =>
  budgetPlan.value.slice(0, 3).map((item, i) => ({ rank: i + 1, item })),
)
// 시상대는 가운데가 1위여야 시상대로 읽힌다 — 2·1·3 순서로 세운다
const podiumStand = computed(() => {
  const top = podium.value
  if (top.length < 3) return top
  return [top[1], top[0], top[2]]
})

// --- 13차: 지도 오른쪽 패널 ---
// 지도를 누르면 상세 페이지로 '떠나던' 것을 바꿨다. 여러 지역을 비교하려면 왕복을 반복해야
// 했는데, 이제 옆 패널만 갱신되므로 지도를 훑으면서 계속 읽을 수 있다.
// 상세 페이지는 딥링크·공유용으로 그대로 두고 패널의 버튼으로 연결한다.
const picked = computed(() =>
  weatherStore.selectedCityId
    ? (budgetPlan.value.find((item) => item.id === weatherStore.selectedCityId) ?? null)
    : null,
)
// 13차-h: 오른쪽 패널은 비워두지 않는다. 고른 지역이 있으면 그것, 없으면 1순위 지역.
const focus = computed(() => picked.value ?? budgetPlan.value[0] ?? null)
const focusGrade = computed(() => (focus.value ? execGrade(focus.value.execScore) : null))
const focusOps = computed(() => (focus.value ? buildOpsMode(focus.value) : null))
const focusAlerts = computed(() =>
  focus.value ? buildRiskAlerts(focus.value).filter((a) => a.level !== 'success') : [],
)

// 반원 게이지. 반지름 50 원호의 길이 = π·r ≈ 157.
const GAUGE_LEN = 157
const gaugeOffset = computed(() => {
  if (!focus.value) return GAUGE_LEN
  return GAUGE_LEN * (1 - Math.min(focus.value.execScore / EXEC_MAX_SCORE, 1))
})

// 축 막대 색: 그 축이 만점 대비 얼마나 채웠는지로 정한다(점수 색과 같은 기준).
const axisColor = (part) => execGrade((part.contribution / part.weight) * 100).color

const avgScore = computed(() => {
  if (!budgetPlan.value.length) return null
  const sum = budgetPlan.value.reduce((acc, item) => acc + item.execScore, 0)
  return Math.round(sum / budgetPlan.value.length)
})

// 전국 권장 대응 전략 분포. "지금 전국이 어떤 상태인가"를 숫자 하나가 아니라 구성으로 보여준다.
const opsSpread = computed(() => {
  const counts = summarizeOps(budgetPlan.value)
  return Object.values(OPS_MODES).map((mode) => ({
    key: mode.key,
    label: mode.label,
    color: mode.color,
    count: counts[mode.key],
    ratio: budgetPlan.value.length ? counts[mode.key] / budgetPlan.value.length : 0,
  }))
})

// 전국 평균만으로는 오늘 무엇을 먼저 봐야 하는지 알기 어렵다.
// 가장 많이 필요한 운영 방식과 실제 경보 지역 수를 한 문장으로 묶어 왼쪽 패널의 첫 결론으로 둔다.
const nationalPulse = computed(() => {
  if (!budgetPlan.value.length) return null
  const dominant = [...opsSpread.value].sort((a, b) => b.count - a.count)[0]
  if (!dominant) return null
  return {
    isAlert: riskCityCount.value > 0,
    headline: riskCityCount.value
      ? `우선 점검이 필요한 지역이 ${riskCityCount.value}곳입니다.`
      : '즉시 대응이 필요한 경보 지역은 없습니다.',
    detail: `${dominant.label} 권장 지역이 ${dominant.count}곳으로 가장 많습니다.`,
  }
})

// 양 끝 지역. 평균만 보면 "전국이 고만고만하다"로 읽혀서 폭을 같이 보여준다.
const extremes = computed(() => {
  if (budgetPlan.value.length < 2) return null
  const byTemp = [...budgetPlan.value].sort((a, b) => b.temp - a.temp)
  return {
    hottest: byTemp[0],
    coolest: byTemp[byTemp.length - 1],
    best: budgetPlan.value[0],
    worst: budgetPlan.value[budgetPlan.value.length - 1],
  }
})


// 지도에서 지역을 고르면 스토어에 담는다 — 오른쪽 패널과 앱 배경이 같은 값을 본다
const pickCity = (item) => {
  weatherStore.setCity(item.id)
}

const insight = computed(() => {
  if (budgetPlan.value.length < 2) return ''
  const byTemp = [...budgetPlan.value].sort((a, b) => b.temp - a.temp)
  const hottest = byTemp[0]
  const coolest = byTemp[byTemp.length - 1]
  const worst = [...budgetPlan.value].sort(
    (a, b) => buildDiscomfort(b).value - buildDiscomfort(a).value,
  )[0]
  // 13차-o: '이(가)'로 조사를 얼버무리던 문장을 수치 중심으로 다시 썼다.
  return `오늘 최고기온 ${hottest.name} ${formatTemp(hottest.temp)}, 최저기온 ${coolest.name} ${formatTemp(coolest.temp)}. 불쾌지수는 ${worst.name}이 가장 높습니다.`
})

// 과제 3의 window.alert()를 걷어내고 상세 페이지로 이동시킨다. (Programmatic Navigation)
// 우선순위는 지금 화면에 보이는 지역들 기준이라 상세에서 다시 못 구한다. 쿼리로 같이 넘긴다.
const goDetail = (item) => {
  router.push({
    name: 'WeatherDetail',
    params: { cityId: item.id },
    query: { priority: item.priority },
  })
}
</script>

<template>
  <div class="practice-section">
    <h2>
      지역별 날씨 대시보드
    </h2>
    <div class="dashboard-wrapper">
      <!-- 13차: 지도를 화면의 중심으로. 우리나라 지도는 세로로 길어(가로세로비 0.70)
           세로를 채우면 좌우에 900px이 남는다 — 그 자리를 전국 요약(왼쪽)과 선택 지역
           요약(오른쪽)이 채운다. 지도가 끝나는 지점부터 아래 카드 목록이 시작된다. -->
      <BaseDashboardCard class="cockpit">
        <!-- 13차-g: 테마 세그먼트(실시간/맑음/흐림/비/눈)를 걷어냈다.
             배경이 하늘 사진이던 시절의 컨트롤인데, 단색 블루 톤이 된 지금은 눌러도
             색조가 미세하게 달라질 뿐이라 자리만 차지했다. 배경은 선택 지역의 실제
             날씨를 따라가면 그것으로 충분하다. -->
        <div class="cockpit-head">
          <span class="hero-badge">{{ heroBadgeText }}</span>
        </div>

        <div class="cockpit-body">
          <!-- 왼쪽: 전국 한눈 지표 -->
          <aside class="cockpit-side">
            <div class="cockpit-title-row">
              <WeatherDeskIcon name="overview" class="cockpit-title-art" />
              <h3 class="cockpit-title">전국 운영 현황</h3>
            </div>
            <div v-if="nationalPulse" class="national-pulse" :class="{ 'is-alert': nationalPulse.isAlert }">
              <WeatherDeskIcon :name="nationalPulse.isAlert ? 'risk' : 'observation'" class="national-pulse-art" />
              <div>
                <span>전국 운영 브리핑</span>
                <strong>{{ nationalPulse.headline }}</strong>
                <p>{{ nationalPulse.detail }}</p>
              </div>
            </div>
            <div class="cockpit-stat">
              <span class="cockpit-stat-label">평균 기상 대응 지수</span>
              <span class="cockpit-stat-value">{{ avgScore ?? '—' }}<small>/{{ EXEC_MAX_SCORE }}</small></span>
            </div>
            <div class="cockpit-stat">
              <span class="cockpit-stat-label">전국 평균 기온</span>
              <span class="cockpit-stat-value">{{ avgTemp !== null ? formatTemp(avgTemp) : '—' }}</span>
            </div>
            <div class="cockpit-stat">
              <span class="cockpit-stat-label">전국 평균 불쾌지수</span>
              <span class="cockpit-stat-value">{{ avgDiscomfort ?? '—' }}</span>
            </div>
            <div class="cockpit-stat" :class="{ 'is-alert': riskCityCount > 0 }">
              <span class="cockpit-stat-label">
                <WeatherDeskIcon v-if="riskCityCount" name="risk" class="alert-inline-art" />
                <el-icon v-else><CircleCheck /></el-icon> 기상 경보 지역
              </span>
              <span class="cockpit-stat-value">{{ riskCityCount }}<small>곳</small></span>
            </div>

            <!-- 평균만 보면 '전국이 고만고만하다'로 읽힌다. 구성과 양 끝을 같이 둔다. -->
            <div class="cockpit-block">
              <span class="cockpit-stat-label">권장 대응 전략</span>
              <div class="mode-bar">
                <i
                  v-for="mode in opsSpread"
                  :key="mode.key"
                  :style="{ flexGrow: mode.count, background: mode.color }"
                  :title="`${mode.label} ${mode.count}곳`"
                />
              </div>
              <ul class="mode-legend">
                <li v-for="mode in opsSpread" :key="mode.key" :class="{ 'is-zero': !mode.count }">
                  <i :style="{ background: mode.color }" />{{ mode.label }}
                  <b>{{ mode.count }}</b>
                </li>
              </ul>
            </div>

            <!-- '양 끝'을 말 그대로 두 끝으로 그린다. 가운데 띠가 그 사이의 폭이다. -->
            <div v-if="extremes" class="cockpit-block">
              <span class="cockpit-stat-label">오늘의 기온 폭</span>
              <div class="span-row">
                <div class="span-end">
                  <b>{{ configStore.convertTemperature(extremes.coolest.temp) }}<small>{{ configStore.unitSymbol }}</small></b>
                  <span>{{ extremes.coolest.name }}</span>
                </div>
                <div class="span-track" aria-hidden="true"></div>
                <div class="span-end is-right">
                  <b>{{ configStore.convertTemperature(extremes.hottest.temp) }}<small>{{ configStore.unitSymbol }}</small></b>
                  <span>{{ extremes.hottest.name }}</span>
                </div>
              </div>
              <!-- 점수 축이라 기온의 두 끝과 같은 줄에 설 수 없다. 아래로 내려 성격을 가른다. -->
              <p class="span-note">
                <WeatherDeskIcon name="risk" class="alert-inline-art" />
                기상 대응 최저 <b>{{ extremes.worst.name }}</b> {{ extremes.worst.execScore }}점
              </p>
            </div>
          </aside>

          <!-- 가운데: 지도 -->
          <div class="cockpit-map">
            <div class="cockpit-map-label">
              <WeatherDeskIcon name="location" class="cockpit-map-art" />
              <div>
                <strong>지역별 대응 지도</strong>
                <span>지역을 선택해 현재 상황을 비교하세요</span>
              </div>
            </div>
            <WeatherMap
              v-if="budgetPlan.length"
              :cities="budgetPlan"
              :spotlight-id="spotlightCity?.id ?? ''"
              @select-city="pickCity"
            />
            <el-skeleton v-else :rows="8" animated />
          </div>

          <!-- 오른쪽: 선택 지역을 '읽는' 대신 '보는' 자리.
               점수는 게이지로, 무엇이 점수를 깎았는지는 축별 막대로 보여준다.
               13차-h: 지역을 안 골랐을 때도 비워두지 않고 1순위 지역을 띄운다 —
               빈 패널은 자리만 차지하고 아무것도 알려주지 않는다. -->
          <aside class="cockpit-side">
            <!-- 13차-i: 시상대는 선택과 무관한 전국 정보라 패널 맨 위에 상시로 둔다.
                 눌러서 그 지역으로 초점을 옮길 수도 있어 목록이자 컨트롤이다. -->
            <div class="cockpit-title-row">
              <WeatherDeskIcon name="priority" class="cockpit-title-art" />
              <h3 class="cockpit-title">오늘의 운영 안정 지역</h3>
            </div>
            <div v-if="podiumStand.length === 3" class="podium">
              <button
                v-for="slot in podiumStand"
                :key="slot.item.id"
                type="button"
                class="podium-slot"
                :class="[`rank-${slot.rank}`, { 'is-focus': slot.item.id === focus?.id }]"
                @click="pickCity(slot.item)"
              >
                <span class="podium-rank">{{ slot.rank }}위</span>
                <span class="podium-name">{{ slot.item.name }}</span>
                <span class="podium-score">{{ slot.item.execScore }}점</span>
              </button>
            </div>

            <Transition name="panel-swap" mode="out-in">
              <div v-if="focus" :key="focus.id" class="cockpit-swap">
                <h3 class="cockpit-title">
                  {{ focus.name }}
                  <!-- 13차-q: 시상대 3곳 밖의 지역을 고르면 이 지역이 '1위'도 아니고
                       시상대 강조 링(is-focus)도 안 붙어서, 왜 이 지역이 떠 있는지
                       알 방법이 없었다. 배지와 같은 근거를 여기도 붙인다. -->
                  <span class="cockpit-title-tag">{{ picked ? '직접 선택' : '기상 대응 우수' }}</span>
                </h3>

                <!-- 점수 게이지. 원호의 채움 길이와 색이 같은 값을 두 가지로 말한다 -->
                <div class="gauge">
                  <svg viewBox="0 0 120 68" class="gauge-svg" aria-hidden="true">
                    <path d="M10,62 A50,50 0 0,1 110,62" class="gauge-track" />
                    <path
                      d="M10,62 A50,50 0 0,1 110,62"
                      class="gauge-fill"
                      :stroke="focusGrade.color"
                      :style="{ strokeDasharray: GAUGE_LEN, strokeDashoffset: gaugeOffset }"
                    />
                  </svg>
                  <div class="gauge-center">
                    <strong :style="{ color: focusGrade.color }">{{ focus.execScore }}</strong>
                    <span>{{ focusGrade.label }}</span>
                  </div>
                </div>

                <p class="cockpit-mode" :style="{ color: focusOps.color }">{{ focusOps.label }}</p>

                <!-- 축별 기여도. buildExecScore가 이미 가중치까지 반영한 contribution을
                     계산해 두므로, '무엇이 점수를 깎았나'를 그리기만 하면 된다. -->
                <ul class="axis-list">
                  <li v-for="part in focus.exec.parts" :key="part.key">
                    <span class="axis-name">{{ part.label }}</span>
                    <span class="axis-track">
                      <span
                        class="axis-fill"
                        :style="{
                          width: `${(part.contribution / part.weight) * 100}%`,
                          background: axisColor(part),
                        }"
                      />
                    </span>
                    <span class="axis-val">{{ part.contribution }}<i>/{{ part.weight }}</i></span>
                  </li>
                </ul>

                <ul v-if="focusAlerts.length" class="cockpit-alerts" aria-label="감지된 기상 리스크">
                  <li v-for="alert in focusAlerts" :key="alert.text" class="cockpit-alert">
                    <WeatherDeskIcon name="risk" class="alert-inline-art" /> {{ alert.text }}
                  </li>
                </ul>

                <el-button type="primary" class="cockpit-go" @click="goDetail(focus)">
                  <WeatherDeskIcon name="analysis" class="cockpit-go-art" />
                  <span class="cockpit-go-copy">
                    <strong>상세 분석 보기</strong>
                    <small>지표별 영향과 실행 제안</small>
                  </span>
                  <span class="cockpit-go-arrow" aria-hidden="true">›</span>
                </el-button>
              </div>
            </Transition>
          </aside>
        </div>
      </BaseDashboardCard>

      <!-- 13차: 사이드바가 없어져 좌우 2단 그리드(.dashboard-body/.dashboard-sidebar)도
           같이 걷어냈다. 이제 지도가 끝나는 지점부터 목록이 한 단으로 이어진다. -->
      <BaseDashboardCard>
            <h3 class="section-title">
              지역별 날씨 현황
              <el-button
                class="btn-refresh"
                size="small"
                :icon="RefreshRight"
                :loading="isLoading"
                @click="loadWeather"
              >
                {{ isLoading ? '불러오는 중...' : '새로고침' }}
              </el-button>
            </h3>

            <!-- 13차: 사이드바를 걷어내면서 검색을 목록 바로 위로 옮겼다.
                 목록을 좁히는 컨트롤(검색·필터·정렬)이 한자리에 모인다. -->
            <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />

            <!-- 10차: 지역을 한 번에 훑기 어려워서 날씨 종류 필터와 정렬을 붙였다 -->
            <div class="list-controls">
              <div class="filter-chips">
                <button
                  v-for="option in weatherFilters"
                  :key="option.value"
                  type="button"
                  class="filter-chip"
                  :class="{ 'is-on': weatherFilter === option.value }"
                  @click="weatherFilter = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
              <el-select v-model="sortKey" size="small" class="sort-select">
                <el-option label="기상 대응 지수순" value="score" />
                <el-option label="기온 높은순" value="temp" />
                <el-option label="불쾌지수 높은순" value="thi" />
                <el-option label="이름순" value="name" />
              </el-select>
            </div>

            <!-- 다른 팀의 "오늘은 부산이 가장 덥고…" 한 줄 요약이 좋아서 우리 지표로 옮겼다.
                 12차: 공휴일 예고를 사이드바에서 이 옆으로 옮겼다. 사이드바를 뷰포트 안에
                 들여보내려는 이유가 컸지만, 성격도 이쪽이 맞다 — 하나는 '오늘 어떤가',
                 다른 하나는 '며칠 뒤 유동인구가 어떻게 달라지나'라 같은 줄에서 읽힌다. -->
            <div class="brief-row">
              <p v-if="insight" class="insight-line">
                <el-icon><Opportunity /></el-icon> {{ insight }}
              </p>
              <p v-if="nextHoliday" class="insight-line is-holiday">
                <el-icon><Calendar /></el-icon>
                <span
                  ><strong>{{ nextHoliday.date }} {{ nextHoliday.localName }}</strong> — 옥외
                  유동인구가 평시와 달라집니다. 인력·재고 계획 반영이 필요합니다.</span
                >
              </p>
            </div>

            <!-- 교재 249p: el-row/el-col로 넓은 화면에서 2열 그리드가 되도록 반응형 배치.
                 13차: 카드는 '몇 개를 자세히' 보는 물건이라 페이지당 6장으로 끊는다. -->
            <el-row :gutter="16">
              <el-col v-for="item in pagedPlan" :key="item.id" :span="24" :md="12">
                <WeatherCard :city-item="item" @click-detail="goDetail" />
              </el-col>
            </el-row>
            <el-pagination
              v-if="visiblePlan.length > CARDS_PER_PAGE"
              v-model:current-page="page"
              :page-size="CARDS_PER_PAGE"
              :total="visiblePlan.length"
              layout="prev, pager, next"
              background
              class="card-pager"
            />

            <!-- 실데이터가 오기 전 회색 뼈대로 체감 로딩속도를 높인다 (교재 241p Skeleton) -->
            <el-skeleton v-if="isLoading && !budgetPlan.length" :rows="4" animated />
            <el-empty
              v-else-if="!visiblePlan.length"
              description="조건에 맞는 지역이 없습니다."
            />
      </BaseDashboardCard>

      <!-- 원래 /about 탭이던 서비스 소개를 별도 탭 대신 메인 화면 하단에 짧게 붙였다 -->
      <BaseDashboardCard class="about-inline">
        <h3 class="section-title"><el-icon><InfoFilled /></el-icon> 서비스 소개</h3>
        <p class="about-text">
          Vue 3와 Vue Router 5로 만든 기상 기반 경영 의사결정 참고 대시보드입니다. 전국 83개
          관측 지점의 실시간 날씨를 업종과 무관하게 읽히는 경영 영향으로 번역해, 전사 전략을 짤 때
          근거로 쓸 수 있게 정리합니다.
        </p>
        <ul class="about-list">
          <li>실시간 검색 상태를 URL 쿼리와 동기화</li>
          <li>동적 라우팅(<code>/weather/:cityId</code>)으로 도시별 상세 페이지 제공</li>
          <li>Navigation Guard로 화면 전환마다 문서 제목 자동 갱신</li>
        </ul>
      </BaseDashboardCard>
    </div>
  </div>
</template>

<style scoped>

/* --- 13차-h: 게이지 + 축별 막대 (오른쪽 패널 시각자료) --- */
.gauge {
  position: relative;
  align-self: center;
  width: 200px;
  max-width: 100%;
}
.gauge-svg {
  width: 100%;
  display: block;
  overflow: visible;
}
.gauge-track,
.gauge-fill {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
}
.gauge-track {
  stroke: rgba(28, 32, 56, 0.1);
}
.gauge-fill {
  transition:
    stroke-dashoffset 0.5s var(--apple-ease),
    stroke 0.3s var(--apple-ease);
}
/* 숫자는 원호 안쪽에 앉힌다 — 게이지와 값을 눈이 한 번에 잡는다 */
.gauge-center {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.gauge-center strong {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.gauge-center span {
  font-size: 13px;
  font-weight: 700;
  color: #48515f;
}

/* 축별 기여도 — '무엇이 점수를 깎았나'를 막대 길이로 읽는다 */
.axis-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.axis-list li {
  display: grid;
  grid-template-columns: 62px 1fr 44px;
  align-items: center;
  gap: 8px;
}
.axis-name {
  font-size: 13px;
  color: #48515f;
}
.axis-track {
  height: 8px;
  border-radius: 4px;
  background: rgba(28, 32, 56, 0.1);
  overflow: hidden;
}
.axis-fill {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition:
    width 0.45s var(--apple-ease),
    background-color 0.3s var(--apple-ease);
}
.axis-val {
  font-size: 13px;
  font-weight: 700;
  color: #1c1c1e;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.axis-val i {
  font-style: normal;
  font-weight: 600;
  color: #5c6675;
}

/* 지금 초점이 가 있는 칸을 링으로 표시한다 — 지도·게이지와 같은 지역임을 잇는다 */
.podium-slot.is-focus {
  box-shadow: 0 0 0 2px var(--color-accent);
}

/* --- 13차-g: 시상대 (콕핏 오른쪽 패널용 축소판) ---
   1위를 가운데 높게 두는 형태 자체가 순위 정보다. 숫자를 읽기 전에 높이로 먼저 읽힌다. */
.podium {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  align-items: end;
}
.podium-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 6px;
  border: none;
  border-radius: var(--control-radius);
  background: var(--control-bg);
  box-shadow: none;
  cursor: pointer;
  text-align: center;
  transition:
    background-color 0.2s var(--apple-ease),
    transform 0.2s var(--apple-ease);
}
.podium-slot:hover {
  background: var(--control-bg-hover);
  transform: var(--control-lift);
}
/* 1위만 더 높고 강조색으로 — 높이 차이가 시상대를 시상대로 만든다 */
.podium-slot.rank-1 {
  padding: 22px 6px;
  background: var(--control-bg-on);
}
.podium-rank {
  font-size: 11px;
  font-weight: 700;
  color: #48515f;
}
.podium-slot.rank-1 .podium-rank,
.podium-slot.rank-1 .podium-name,
.podium-slot.rank-1 .podium-score,
.podium-slot.rank-1 .podium-meta {
  color: var(--control-fg-on-solid);
}
.podium-name {
  font-size: 16px;
  font-weight: 700;
  color: #1c1c1e;
}
.podium-slot.rank-1 .podium-name {
  font-size: 19px;
}
.podium-score {
  font-size: 13px;
  font-weight: 700;
  color: var(--control-fg-on);
  font-variant-numeric: tabular-nums;
}
.podium-meta {
  font-size: 11px;
  color: #48515f;
}

/* --- 13차: 콕핏 소제목 위계 + 패널 전환 ---
   라벨이 본문과 같은 크기·색이라 어디서 묶음이 끊기는지 안 보였다.
   크기를 줄이는 대신 자간을 넓히고 굵게 해서 '값'이 아니라 '이름표'로 읽히게 한다. */
.cockpit-stat-label {
  font-size: 12px !important;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #48515f !important;
  text-transform: none;
}
/* 묶음(운영 모드 분포 / 오늘의 양 끝 …)은 위에 얇은 선을 둬서 구획을 만든다 */
.cockpit-block {
  padding-top: 14px;
  border-top: 1px solid rgba(28, 32, 56, 0.1);
}
.cockpit-title {
  letter-spacing: -0.01em;
}
.cockpit-title-tag {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--glass-inset-bg);
  font-size: 11px;
  font-weight: 700;
  color: #48515f;
}


/* 패널 전환: 살짝 올라오면서 나타난다. 위치 이동은 4px로 아주 작게 —
   크게 움직이면 '전환'이 아니라 '튀는 것'으로 읽힌다. */
.cockpit-swap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.panel-swap-enter-active {
  transition:
    opacity 0.28s var(--apple-ease),
    transform 0.28s var(--apple-ease);
}
.panel-swap-leave-active {
  transition:
    opacity 0.18s var(--apple-ease),
    transform 0.18s var(--apple-ease);
}
.panel-swap-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.panel-swap-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 숫자가 바뀔 때도 같은 결로 — 색만 부드럽게 따라가게 한다 */
.cockpit-stat-value,
.row-score,
.map-readout-score {
  transition: color 0.3s var(--apple-ease);
}

@media (prefers-reduced-motion: reduce) {
  .panel-swap-enter-active,
  .panel-swap-leave-active {
    transition: opacity 0.12s linear;
  }
  .panel-swap-enter-from,
  .panel-swap-leave-to {
    transform: none;
  }
}

/* --- 13차: 컴팩트 목록 + 뷰 전환 --- */
.view-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--control-radius);
  background: var(--control-bg);
}
.view-toggle button {
  padding: 4px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  box-shadow: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--control-fg);
  cursor: pointer;
}
/* 켜진 쪽은 단위 토글과 같은 방식 — 강조색 채움 + 흰 글자 */
.view-toggle button.is-on {
  background: var(--control-bg-on);
  color: var(--control-fg-on-solid);
}

.row-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row-item {
  display: grid;
  grid-template-columns: 30px 84px 46px 1fr 42px 76px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: var(--control-radius);
  background: transparent;
  box-shadow: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.16s var(--apple-ease);
}
.row-item:hover {
  background: var(--control-bg-hover);
}
.row-rank {
  font-size: 13px;
  font-weight: 700;
  color: #48515f;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.row-name {
  font-size: 16px;
  font-weight: 700;
  color: #1c1c1e;
}
.row-temp {
  font-size: 15px;
  color: #48484f;
  font-variant-numeric: tabular-nums;
}
/* 점수를 막대 길이로 옮기면 83개도 눈으로 비교된다 — 숫자만 있으면 하나씩 읽어야 한다 */
.row-track {
  height: 8px;
  border-radius: 4px;
  background: rgba(120, 120, 128, 0.16);
  overflow: hidden;
}
.row-fill {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s var(--apple-ease);
}
.row-score {
  font-size: 16px;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.row-mode {
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}
.card-pager {
  justify-content: center;
  margin-top: 16px;
}

@media (max-width: 760px) {
  /* 좁은 화면에서는 막대와 이름만 남긴다 */
  .row-item {
    grid-template-columns: 26px 1fr 44px 40px;
  }
  .row-track,
  .row-mode {
    display: none;
  }
}

/* --- 13차: 콕핏 좌우 패널 확충 --- */
.cockpit-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 운영 모드 분포 — 숫자 대신 폭으로 구성을 읽게 한다 */
.mode-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: rgba(120, 120, 128, 0.16);
}
.mode-bar i {
  min-width: 0;
  transition: flex-grow 0.4s var(--apple-ease);
}
.mode-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 13px;
  color: #48484f;
}
.mode-legend li {
  display: flex;
  align-items: center;
  gap: 5px;
}
.mode-legend li.is-zero {
  opacity: 0.4;
}
.mode-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.mode-legend b {
  font-weight: 700;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}

/* 오늘의 양 끝 */
/* 기온의 두 끝. 숫자를 주인공으로 두고 지역명은 그 아래 받침으로 내린다 —
   예전엔 '속초 30°C'가 통째로 볼드라 무엇이 주인지 안 잡혔다. */
.span-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.span-end {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.1;
}
.span-end.is-right {
  align-items: flex-end;
  text-align: right;
}
.span-end b {
  font-size: 21px;
  font-weight: 800;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.span-end b small {
  font-size: 12px;
  font-weight: 700;
  margin-left: 1px;
}
.span-end > span {
  margin-top: 3px;
  font-size: 12px;
  color: #48515f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 두 끝 사이의 폭. 위 '운영 모드 분포' 막대와 같은 두께·같은 라운드로 맞춘다.
   색은 앱이 이미 쓰는 두 색(찬 파랑·더운 주황)만 잇는다 — 새 색을 들이지 않는다. */
.span-track {
  flex: 1;
  min-width: 20px;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(10, 83, 192, 0.7), rgba(138, 78, 0, 0.7));
}
.span-note {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 12px 0 0;
  font-size: 13px;
  color: #48515f;
}
.span-note .el-icon {
  color: #8a4e00;
}
.span-note b {
  font-weight: 700;
  color: #1c1c1e;
}

/* 선택 지역: 전국 순위 한 줄 */
.cockpit-rankline {
  margin: -4px 0 0;
  font-size: 14px;
  color: #48515f;
}
.cockpit-rankline b {
  font-weight: 700;
  color: var(--control-fg-on);
}

/* 선택 지역: 관측값 6칸. 상세 페이지로 가야만 알 수 있던 값들을 여기서 바로 읽는다 */
.picked-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}
.picked-grid li {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.picked-grid span {
  font-size: 12px;
  color: #48515f;
}
.picked-grid b {
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}

/* 오늘 가장 크게 움직이는 경영 레버 두 개 */
.picked-mix {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #48484f;
}
.picked-mix span {
  display: inline-block;
  margin-right: 6px;
  font-weight: 700;
  color: #1c1c1e;
}

/* --- 13차: 지도 콕핏 ---------------------------------------------------
   우리나라 지도는 세로로 길다(가로세로비 0.70). 세로를 채우면 1440px 컨테이너에서
   좌우로 900px이 남는데, 그 자리를 비워두면 '가운데 뜬 작은 지도'가 된다.
   그래서 3단으로 나눠 좌우를 지표가 채우게 했다 — 지도는 커지고 여백은 사라진다. */
.cockpit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.cockpit-body {
  display: grid;
  /* 가운데는 지도, 좌우는 지표. 지도를 키우되 좌우가 빈 여백이 되지 않도록
     사이드 폭에 상한(320px)을 둔다 — 남는 가로는 전부 지도가 가져간다. */
  grid-template-columns: minmax(200px, 320px) minmax(360px, 1fr) minmax(200px, 320px);
  gap: 28px;
  align-items: start;
}
.cockpit-map {
  min-width: 0;
}
.cockpit-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cockpit-title-art {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
}
.cockpit-map-label {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.cockpit-map-art {
  width: 72px;
  height: 72px;
  flex: 0 0 auto;
}
.cockpit-map-label strong,
.cockpit-map-label span {
  display: block;
}
.cockpit-map-label strong {
  color: var(--color-text);
  font-size: 16px;
  font-weight: 750;
}
.cockpit-map-label span {
  margin-top: 3px;
  color: var(--text-secondary, #48515f);
  font-size: 13px;
}
.cockpit-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.cockpit-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin: 0 0 2px;
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
}
.cockpit-clear {
  margin-left: auto;
  padding: 2px 8px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--control-fg-on);
  cursor: pointer;
}
.cockpit-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.national-pulse {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  background: var(--glass-inset-bg);
}
.national-pulse-art {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
}
.national-pulse > div {
  min-width: 0;
}
.national-pulse span,
.national-pulse p {
  display: block;
  color: var(--text-secondary);
}
.national-pulse span {
  font-size: 11px;
  font-weight: 700;
}
.national-pulse strong {
  display: block;
  margin-top: 2px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 750;
  line-height: 1.35;
}
.national-pulse p {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 1.4;
}
.national-pulse.is-alert strong {
  color: #ad251c;
}
.cockpit-stat-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #48515f;
}
.cockpit-stat-value {
  font-size: 38px;
  font-weight: 700;
  color: #1c1c1e;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.cockpit-stat-value small {
  font-size: 15px;
  font-weight: 600;
  color: #48515f;
  margin-left: 4px;
}
.cockpit-stat.is-alert .cockpit-stat-value {
  color: #ad251c;
}

/* 선택한 지역 요약 */
.cockpit-mode {
  margin: 4px 0 0;
  font-size: 19px;
  font-weight: 700;
}
.cockpit-summary {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: #48484f;
}
.cockpit-alerts {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.cockpit-alert {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #8a4e00;
}
.alert-inline-art {
  width: 20px;
  height: 20px;
}
.cockpit-go {
  align-self: stretch;
  display: flex;
  min-height: 72px;
  margin-top: 4px;
  padding: 10px 14px;
  border-radius: 16px;
  justify-content: flex-start;
  text-align: left;
}
.cockpit-go-art {
  width: 42px;
  height: 42px;
  margin-right: 10px;
}
.cockpit-go-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.cockpit-go-copy strong {
  font-size: 15px;
  font-weight: 750;
}
.cockpit-go-copy small {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.82;
}
.cockpit-go-arrow {
  margin-left: 8px;
  font-size: 20px;
}

/* 상위 3곳 (지역을 고르기 전 기본 화면) */
.cockpit-rank {
  display: flex;
  align-items: baseline;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--control-radius);
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  text-align: left;
}
.cockpit-rank:hover {
  background: var(--control-bg-hover);
}
.cockpit-rank-no {
  font-size: 14px;
  font-weight: 700;
  color: #48515f;
  width: 12px;
}
.cockpit-rank-name {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
}
.cockpit-rank-score {
  font-size: 15px;
  font-weight: 700;
  color: var(--control-fg-on);
  font-variant-numeric: tabular-nums;
}
.cockpit-hint {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #48515f;
}

/* 좁은 화면: 좌우 분할이 불가능하므로 지도 → 전국 요약 → 선택 요약 순으로 쌓는다 */
@media (max-width: 1100px) {
  .cockpit-body {
    grid-template-columns: 1fr;
  }
  .cockpit-map {
    order: -1;
  }
  .cockpit-side {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px 28px;
  }
  .cockpit-title {
    width: 100%;
  }
  .cockpit-title-row {
    width: 100%;
  }
}
@media (max-width: 640px) {
  .cockpit-title-art {
    width: 40px;
    height: 40px;
  }
  .cockpit-map-art {
    width: 56px;
    height: 56px;
  }
}
/* 6차: practice.css의 div.practice-section 자체가 유리다. 날씨 화면은 그 안에 또 유리 카드
   (BaseDashboardCard/WeatherCard)를 겹쳐 쓰는 구조라 최상위까지 유리면 3중으로 겹쳐 색이
   뭉개진다("유리 위 유리" 문제) — 최상위는 투명하게 비우고 카드들만 유리로 남긴다. */
.practice-section {
  background: transparent;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  border: none;
  box-shadow: none;
  /* 6차: 화면마다 콘텐츠 폭이 제각각이라 탭을 옮길 때 좌우 폭이 튀어 보였다.
     항상 app-container 전체 폭을 그대로 쓰도록 명시한다. */
  width: 100%;
}
/* 13차-f: 사진 배경 시절에 h2를 흰 글자 + 그림자로 만들어 뒀던 규칙을 지웠다.
   배경이 밝은 회색이 된 뒤로는 흰 배경에 흰 글자였고, 화면에서 이 제목만 혼자
   그림자를 달고 있었다. practice.css의 기본 다크 텍스트를 그대로 쓴다. */
.dashboard-wrapper {
  width: 100%;
  margin: 0;
}
.holiday-banner {
  margin-bottom: 12px;
}
/* 8차: 위 컨트롤에 바로 붙어 있어서 숨이 막혔다 */
.top-city {
  margin-top: 14px;
}
/* 6차-보강: 공휴일/검색 패널을 본문과 같은 폭으로 세로 나열하던 걸 사이드바로 뺐다. 넓은 화면
   (≥960px)에서만 좌우로 갈라지고, 좁은 화면에서는 원래처럼 위아래로 쌓인다. */
.dashboard-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}
@media (min-width: 960px) {
  .dashboard-body {
    grid-template-columns: minmax(260px, 300px) 1fr;
  }
  /* 12차 버그: 사이드바 전체에 position: sticky를 걸어놨는데, 검색+공휴일+지도를 합치면
     높이가 955px로 뷰포트(≈820px)보다 크다. sticky는 요소를 top:20px에 고정해버리므로
     페이지를 끝까지 드래그해도 사이드바 아래 152px(지도 하단)이 화면 밖에 영원히 남았다 —
     아무리 스크롤해도 도달할 수 없는 영역이었다.

     고정이 필요한 건 사이드바 전체가 아니라 '자주 쓰는 컨트롤'뿐이다. 그래서 sticky를
     첫 번째 카드(도시 검색)에만 건다. 검색창은 계속 따라오고, 공휴일·지도는 페이지와 같이
     흘러가므로 전부 도달 가능해진다. 내부 스크롤바를 만드는 방식(max-height+overflow)은
     스크롤바가 두 개로 보여 더 헷갈리므로 쓰지 않았다. */
  .dashboard-sidebar {
    /* 카드 그리드를 스크롤해도 검색·지도 사이드바는 화면에 붙어 있는다.
       12차: 예전에는 여기에 공휴일 배너까지 들어 있어 사이드바 높이가 955px가 됐고,
       뷰포트(≈820px)를 넘겨서 아래 152px에 스크롤로 도달할 수 없었다. 공휴일을 본문으로
       옮겨 사이드바가 화면 안에 들어오게 만든 뒤에야 전체 sticky가 제대로 동작한다.
       화면이 더 짧은 기기를 위한 안전장치는 아래 @media로 따로 둔다. */
    position: sticky;
    top: 20px;
  }
}
/* 12차: 짧은 화면 안전장치. 처음엔 max-height + overflow-y: auto로 막으려 했는데,
   overflow는 자식을 '자른다' — 유리 카드의 큰 그림자(0 14px 40px)가 사이드바 경계에서
   뚝 잘리면서 사이드바 전체에 회색 사각형이 깔린 것처럼 보였다.
   자르는 대신, 사이드바가 들어갈 자리가 없는 높이에서는 고정을 아예 포기하고 본문과 같이
   흐르게 둔다. 그러면 잘리는 것도 없고 도달 못 하는 영역도 없다. */
/* 임계값 계산: 지도 상한(300px)을 준 뒤 사이드바가 ≈730px. 위아래 여백 20px씩 더해
   770px보다 짧은 화면에서만 고정을 포기한다. 노트북 대부분(800px+)은 고정이 걸린다. */
@media (min-width: 960px) and (max-height: 769px) {
  .dashboard-sidebar {
    position: static;
  }
}
/* 8차: 라벨 위 / 인풋 아래로 쌓아서 좁은 사이드바에서도 단어가 안 쪼개진다 */
.budget-field {
  margin: 14px 0 0;
}
.budget-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #48515f;
}
.budget-input {
  width: 100%;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-refresh {
  margin-left: auto;
}
/* --- 10차: 시상대 --- */
.podium {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-items: end;
}
.podium-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 14px 10px;
  border: 1px solid var(--control-border);
  border-radius: var(--control-radius);
  background: var(--control-bg);
  box-shadow: var(--control-shadow);
  cursor: pointer;
  text-align: center;
  transition:
    background-color 0.2s var(--apple-ease),
    box-shadow 0.2s var(--apple-ease),
    transform 0.2s var(--apple-ease);
}
.podium-slot:hover {
  background: var(--control-bg-hover);
  box-shadow: var(--control-shadow-hover);
  transform: var(--control-lift);
}
/* 1위만 더 높고 진하게 — 시상대처럼 보이게 하는 건 결국 높이 차이다.
   색은 다른 '선택됨' 상태와 같은 토큰을 쓴다. */
.podium-slot.rank-1 {
  padding: 24px 10px;
  background: var(--control-bg-on);
  border-color: var(--control-border-on);
}
.podium-rank {
  font-size: 11px;
  font-weight: 700;
  color: #48515f;
}
.podium-name {
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
}
.podium-slot.rank-1 .podium-name {
  font-size: 21px;
}
.podium-score {
  font-size: 13px;
  font-weight: 700;
  color: #0a53c0;
  font-variant-numeric: tabular-nums;
}
.podium-meta {
  font-size: 11px;
  color: #48515f;
}

/* --- 10차: 목록 필터 / 정렬 / 인사이트 --- */
.list-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.filter-chip {
  padding: 5px 12px;
  border-radius: var(--control-radius);
  border: 1px solid var(--control-border);
  background: var(--control-bg);
  box-shadow: var(--control-shadow);
  font-size: 13px;
  font-weight: 600;
  color: var(--control-fg);
  cursor: pointer;
  transition:
    background-color 0.2s var(--apple-ease),
    box-shadow 0.2s var(--apple-ease),
    transform 0.2s var(--apple-ease),
    color 0.2s var(--apple-ease);
}
.filter-chip:hover {
  background: var(--control-bg-hover);
  box-shadow: var(--control-shadow-hover);
  transform: var(--control-lift);
}
.filter-chip.is-on {
  background: var(--control-bg-on);
  border-color: var(--control-border-on);
  color: var(--control-fg-on);
}
.sort-select {
  width: 148px;
}
/* 12차: 오늘 한 줄 + 공휴일 예고를 나란히. 좁은 화면에서는 자연히 위아래로 쌓인다 */
.brief-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
/* 13차-o: 넓은 화면에서 좌우로 나누던 걸 위아래로 세운다.
   둘은 시점이 다르다 — 하나는 '오늘', 다른 하나는 '며칠 뒤'다.
   나란히 두면 같은 시점의 두 사실처럼 읽히고, 길이도 서로 달라 줄이 안 맞았다. */
.insight-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 14px;
  padding: 9px 12px;
  border-radius: 10px;
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
  font-size: 13px;
  color: #48484f;
}
/* 두 줄이 나란히 설 때 위아래 여백은 .brief-row가 잡는다 */
.brief-row .insight-line {
  margin: 0;
  align-items: flex-start;
  line-height: 1.5;
}
.insight-line.is-holiday strong {
  color: #1c1c1e;
}

.about-inline {
  margin-top: 20px;
}
.about-text {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.6;
  color: #48484f;
}
.about-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
  color: #48484f;
}
.about-list code {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 12px;
}

/* --- 히어로 패널: 날씨 하늘(뒤) + 리퀴드 글라스 패널(위). 유리는 뒤에 비칠 게 있어야 유리로
   보인다는 원칙을 여기서 제일 크게 써먹는다 — 하늘이 진하고 화사할수록 유리가 산다. --- */
.hero-panel {
  position: relative;
  border-radius: var(--radius-card);
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-glass-raised);
}

/* 6차: 처음엔 .hero-panel(바깥 액자) 안에 .hero-glass(안쪽 유리판)를 margin 10px로 띄워서
   "액자 속에 또 액자"처럼 이중 테두리가 겹쳐 보였다("테두리가 부자연스럽다" 피드백) — 프레임은
   .hero-panel 하나만 남기고 .hero-glass는 그 안을 꽉 채우는 유리 필터 레이어로 합쳤다.
   7차: 자체 사진(.hero-sky)을 없앤 뒤로 이 패널이 곧 유일한 유리 표면이라 border-radius를
   직접 갖는다 — backdrop-filter는 자기 자신의 radius로만 잘린다. */
.hero-glass {
  position: relative;
  z-index: 1;
  border-radius: var(--radius-card);
  padding: 28px 30px;
  background-color: var(--glass-bg-strong);
  background-image: var(--glass-sheen);
  /* 6차: 빛이 훑고 지나가는 애니메이션 대신 실제 굴절을 쓴다. 뒤 하늘(.hero-sky)이 유리를 통과하며
     비틀려 보인다. 12차에 노이즈 굴절을 걷어내고 --glass-surface(균질한 블러)로 바꿨다. */
  -webkit-backdrop-filter: var(--glass-surface);
  backdrop-filter: var(--glass-surface);
  color: #1c1c1e;
  /* 6차-보강: "가운데 정렬 1단뿐이다" 지적으로 왼쪽 카피/오른쪽 통계를 나란히 놓는 2단 그리드로.
     좁은 화면에서는 위아래로 쌓인다. */
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 32px;
  align-items: start;
}
.hero-glass > * {
  position: relative;
  z-index: 3;
}
.hero-col {
  min-width: 0;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  /* 알약 배지 습관을 걷어내고 다른 유리 패널들과 같은 둥근 사각형으로 통일 */
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
  font-size: 12px;
  font-weight: 600;
}
.hero-title {
  margin: 0 0 8px;
  font-size: 28px;
  line-height: 1.28;
  font-weight: 800;
  color: #1c1c1e;
}
.hero-sub {
  margin: 0 0 20px;
  font-size: 13px;
  color: #48484f;
  max-width: 420px;
}
/* 6차-보강: 오른쪽 컬럼 안에서 2x2로 딱 맞게 */
.hero-col-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  align-content: start;
}
.hero-stat {
  /* 12차: 카드 안에 놓인 판이라 안쪽 면 토큰을 따른다(0.5는 유리 위에서 불투명해 보였다) */
  background-color: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
  border-radius: var(--radius-control);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hero-stat-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #48515f;
}
.hero-stat-value {
  font-size: 19px;
  font-weight: 700;
}
.hero-stat-alert .hero-stat-value {
  color: #ad251c;
}
.hero-stat-alert.is-safe .hero-stat-value {
  color: #14563a;
}
.hero-chart-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
  color: #48515f;
  margin-bottom: 8px;
}
.hero-chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 64px;
  /* 막대 아래 도시 이름 라벨이 absolute로 튀어나가므로(.hero-bar-label bottom:-20px) 여백을 준다 */
  margin-bottom: 20px;
}
.hero-bar {
  flex: 1;
  min-width: 0;
  /* button으로 바꿨으므로 practice.css의 전역 버튼 스타일을 걷어낸다 */
  padding: 0;
  border: none;
  cursor: pointer;
  /* 8차: 검색으로 한 도시만 남으면 flex:1이 막대 하나를 폭 전체로 늘려서 그래프가 아니라
     거대한 파란 띠로 보였다 — 상한을 둬서 결과 수가 적어도 막대 모양을 유지한다 */
  max-width: 44px;
  background: linear-gradient(180deg, var(--color-accent) 0%, rgba(0, 122, 255, 0.25) 100%);
  border-radius: 6px 6px 2px 2px;
  position: relative;
  transition:
    height 0.4s ease,
    transform 0.4s ease,
    box-shadow 0.4s ease;
}
.hero-bar:hover {
  transform: var(--control-lift);
  filter: brightness(1.08);
}
/* 사용자가 눌러서 고정한 지역 — 순환 중 강조(is-spotlight)와 구분되게 테두리를 준다 */
.hero-bar.is-picked {
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 4px var(--color-accent);
}
/* 히어로가 지금 순환해서 비추고 있는 지역의 막대만 살짝 떠오르고 진해진다 */
.hero-bar.is-spotlight {
  background: linear-gradient(180deg, #0a53c0 0%, rgba(0, 122, 255, 0.4) 100%);
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 98, 204, 0.35);
}
.hero-chart-hint {
  font-size: 11px;
  color: #48515f;
  margin-left: 2px;
}
.hero-bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  /* 9차 가독성: 10px + #48515f은 유리 위에서 거의 안 읽혔다. 앱에서 가장 흐린 글자였다 */
  font-size: 11px;
  font-weight: 500;
  color: #48484f;
  white-space: nowrap;
}
</style>
