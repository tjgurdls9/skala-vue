<script setup>
import { ref, computed, watch, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 1. 컴포넌트 파일명 국룰 표기법(PascalCase) 매칭 수입
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'
import SearchBar from '../components/weather/SearchBar.vue'
import WeatherCard from '../components/weather/WeatherCard.vue'
import WeatherMap from '../components/weather/WeatherMap.vue'
// 2. 상세/요약 화면과 공유하는 도시 등록 정보와 등급 판정 로직
import { storeToRefs } from 'pinia'
import {
  buildRegionalOutlook,
  buildRiskAlerts,
  buildDiscomfort,
  EXEC_MAX_SCORE,
} from '../data/weatherMock.js'
import { fetchHolidays } from '../data/weatherApi.js'
import { useWeatherStore } from '../stores/weatherStore.js'
import { useWeatherThemeStore, WEATHER_THEME_MAP } from '../stores/weatherThemeStore.js'
import {
  Cloudy,
  Sunny,
  Pouring,
  Calendar,
  RefreshRight,
  House,
  Aim,
  WarnTriangleFilled,
  CircleCheck,
  Odometer,
  TrendCharts,
  InfoFilled,
  Location,
  Trophy,
  Opportunity,
} from '@element-plus/icons-vue'

// Element Plus 아이콘 세트에 눈(❄️) 아이콘이 없어서 이거 하나만 직접 그린다.
// viewBox/좌표계를 Element Plus 아이콘과 동일하게(0 0 1024 1024) 맞춰서 <el-icon> 안에서 크기가 똑같이 맞는다.
const SnowflakeIcon = {
  name: 'SnowflakeIcon',
  render: () =>
    h('svg', { viewBox: '0 0 1024 1024' }, [
      h('path', {
        d: 'M512 96v832M176 256l672 512M176 768l672-512',
        stroke: 'currentColor',
        'stroke-width': 64,
        'stroke-linecap': 'round',
        fill: 'none',
      }),
    ]),
}

// 3. 과제 4: 라우터 이동을 위한 route(수신) / router(송신) 객체
const route = useRoute()
const router = useRouter()

const searchQuery = ref('')

// 11차: 조회를 스토어로 올렸다. 홈/요약/상세가 같은 데이터를 공유하므로 탭을 옮겨도
// 다시 부르지 않고, "선택한 지역"도 화면 밖에서 유지된다.
const weatherStore = useWeatherStore()
const { list: weatherList, isLoading } = storeToRefs(weatherStore)

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
  router.replace(keyword ? '/?search=' + keyword : '/')
})

// 11차: 예산 개념을 걷어냈다(사유는 weatherMock.js의 buildRegionalOutlook 주석 참고).
// 검색으로 걸러진 지역들에 점수/우선순위를 붙인다.
const budgetPlan = computed(() => buildRegionalOutlook(filteredWeatherList.value))

const topCity = computed(() => {
  if (!budgetPlan.value.length) return null
  return budgetPlan.value[0]
})

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

const WEATHER_THEME_ICON = { clear: Sunny, clouds: Cloudy, rain: Pouring, snow: SnowflakeIcon }
const WEATHER_THEME_LABEL = { clear: '맑음', clouds: '흐림', rain: '비', snow: '눈' }

const heroThemeOptions = [
  { value: 'auto', label: '실시간' },
  { value: 'clear', label: '맑음' },
  { value: 'clouds', label: '흐림' },
  { value: 'rain', label: '비' },
  { value: 'snow', label: '눈' },
]
// 11차 구조 수정: 예전에는 이 화면이 배경 테마를 계산해서 스토어에 밀어넣었다. 그래서 다른
// 탭으로 가면(이 화면이 언마운트되면) 아무도 테마를 갱신하지 않아 배경이 직전 값에 멈췄다.
// 이제 스토어가 선택된 지역에서 직접 테마를 파생하므로, 이 화면은 결과만 읽어 쓴다.
const weatherThemeStore = useWeatherThemeStore()
const heroTheme = computed(() => weatherThemeStore.theme)
const heroThemeIcon = computed(() => WEATHER_THEME_ICON[heroTheme.value])

const heroBadgeText = computed(() => {
  if (weatherThemeStore.override !== 'auto') {
    return `${WEATHER_THEME_LABEL[heroTheme.value]} 테마 미리보기`
  }
  if (!spotlightCity.value) return '날씨 × 전사 경영 판단'
  const pinned = weatherStore.selectedCityId === spotlightCity.value.id
  return `${spotlightCity.value.name} 기준 실시간 날씨${pinned ? '' : ' (영향 1순위)'}`
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
const riskIcon = computed(() => (riskCityCount.value === 0 ? CircleCheck : WarnTriangleFilled))

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

// 시상대는 항상 전체 기준 상위 3개다(필터를 걸어도 "오늘의 1순위"는 바뀌지 않아야 한다).
// 가운데를 1위로 두려고 2-1-3 순서로 배열한다.
const podium = computed(() => {
  const top = budgetPlan.value.slice(0, 3)
  if (top.length < 3) return []
  return [
    { rank: 2, item: top[1] },
    { rank: 1, item: top[0] },
    { rank: 3, item: top[2] },
  ]
})

const insight = computed(() => {
  if (budgetPlan.value.length < 2) return ''
  const byTemp = [...budgetPlan.value].sort((a, b) => b.temp - a.temp)
  const hottest = byTemp[0]
  const coolest = byTemp[byTemp.length - 1]
  const worst = [...budgetPlan.value].sort(
    (a, b) => buildDiscomfort(b).value - buildDiscomfort(a).value,
  )[0]
  return `오늘은 ${hottest.name}이(가) 가장 덥고(${hottest.temp}°C), ${coolest.name}이(가) 가장 선선합니다(${coolest.temp}°C). 불쾌지수는 ${worst.name}이(가) 가장 높습니다.`
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
      <el-icon><Cloudy /></el-icon> 지역별 날씨 대시보드
    </h2>
    <div class="dashboard-wrapper">
      <!-- 날씨 × 경영 의사결정 히어로. 대표 지역의 실시간 날씨로 뒤 하늘 그림이 자동 전환되고,
           그 위에 리퀴드 글라스 패널이 떠 있다. 오른쪽 세그먼트로 테마를 직접 미리 볼 수도 있다. -->
      <section class="hero-panel">
        <!-- 7차: 히어로만 자기 사진을 따로 깔고 있어서(.hero-sky) 카드들과 다르게 "미리 그려진
             배경" 위에 앉아 있었다 — 다른 유리 패널(App.vue 내비, WeatherCard 등)처럼 자기 이미지
             없이 앱 전체 배경(App.vue의 .app-backdrop-layer, heroTheme과 항상 같은 사진)을
             backdrop-filter로 그대로 투과시킨다. -->

        <!-- 6차-보강: "가운데 정렬 1단뿐이다" 지적 — 히어로 안도 위아래로만 쌓여 있던 걸
             왼쪽(카피)/오른쪽(통계) 2단으로 갈라 가로 폭을 실제로 쓰게 했다. -->
        <div class="hero-glass">
          <div class="hero-col hero-col-copy">
            <div class="hero-top">
              <span class="hero-badge">
                <el-icon><component :is="heroThemeIcon" /></el-icon> {{ heroBadgeText }}
              </span>
              <el-segmented
                :model-value="weatherThemeStore.override"
                :options="heroThemeOptions"
                size="small"
                @change="weatherThemeStore.setOverride"
              />
            </div>

            <h1 class="hero-title">오늘의 하늘이<br />오늘의 경영 판단이 됩니다</h1>
            <p class="hero-sub">
              전국 {{ budgetPlan.length }}개 지역의 실시간 기상 데이터를 마케팅 믹스 7P와
              인사·재무·회계·물류·안전 5개 경영 기능의 영향으로 바꿔 보여줍니다.
            </p>

            <div v-if="budgetPlan.length" class="hero-chart">
              <span class="hero-chart-label">
                <el-icon><TrendCharts /></el-icon> 지역별 기상 영향 점수
                <span class="hero-chart-hint">막대를 눌러 지역을 고정할 수 있습니다</span>
              </span>
              <!-- 11차 UX: 지금까지 이 막대들은 지역 이름까지 달고 있으면서 클릭이 안 됐다
                   ("눌릴 것 같은데 안 눌리는" 케이스). 대시보드에서 지역을 직접 고를 방법도
                   없었기에, 이 막대를 그대로 지역 선택기로 만들었다. 선택한 지역은 스토어에
                   저장돼서 배경 테마와 다른 탭에도 그대로 이어진다. -->
              <div class="hero-chart-bars">
                <button
                  v-for="item in budgetPlan"
                  :key="item.id"
                  type="button"
                  class="hero-bar"
                  :class="{
                    'is-spotlight': item.id === spotlightCity?.id,
                    'is-picked': item.id === weatherStore.selectedCityId,
                  }"
                  :style="{ height: `${Math.max((item.execScore / EXEC_MAX_SCORE) * 100, 8)}%` }"
                  :title="`${item.name} ${item.execScore}점 — 눌러서 고정`"
                  :aria-pressed="item.id === weatherStore.selectedCityId"
                  @click="weatherStore.selectCity(item.id)"
                >
                  <span class="hero-bar-label">{{ item.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="hero-col hero-col-stats">
            <div class="hero-stat">
              <span class="hero-stat-label"
                ><el-icon><Sunny /></el-icon> 전국 평균 기온</span
              >
              <span class="hero-stat-value">{{ avgTemp !== null ? `${avgTemp}°C` : '—' }}</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-label"
                ><el-icon><Aim /></el-icon> 최우선 확인 지역</span
              >
              <span class="hero-stat-value">{{ topCity ? topCity.name : '—' }}</span>
            </div>
            <div class="hero-stat hero-stat-alert" :class="{ 'is-safe': riskCityCount === 0 }">
              <span class="hero-stat-label">
                <el-icon><component :is="riskIcon" /></el-icon> 기상 경보 지역
              </span>
              <span class="hero-stat-value">{{ riskCityCount }}개 지역</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-label"
                ><el-icon><Odometer /></el-icon> 전국 평균 불쾌지수</span
              >
              <span class="hero-stat-value">{{ avgDiscomfort ?? '—' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 6차-보강: 공휴일/검색 패널을 본문과 같은 폭으로 세로 나열하던 걸 왼쪽 사이드바로 뺐다.
           오른쪽엔 카드 그리드만 남아서 넓은 화면에서 좌우를 같이 쓰는 실제 대시보드 구조가 됐다. -->
      <div class="dashboard-body">
        <aside class="dashboard-sidebar">
          <!-- 9차: 전국 지역을 표/카드로만 훑던 걸 지도로도 볼 수 있게 했다. 막대 길이와 색이
               같은 값(기상 영향 점수)을 두 가지로 알려주고, 클릭하면 그 지역 상세로 간다. -->
          <BaseDashboardCard v-if="budgetPlan.length">
            <h3 class="section-title">
              <el-icon><Location /></el-icon> 전국 기상 영향 점수 지도
            </h3>
            <WeatherMap
              :cities="budgetPlan"
              :spotlight-id="spotlightCity?.id ?? ''"
              @select-city="goDetail"
            />
          </BaseDashboardCard>

          <!-- 교재 249p: 공휴일 배너를 el-alert로 -->
          <el-alert
            v-if="nextHoliday"
            type="info"
            show-icon
            :closable="false"
            class="holiday-banner"
            title="다가오는 공휴일"
          >
            <el-icon><Calendar /></el-icon>
            {{ nextHoliday.date }} {{ nextHoliday.localName }} — 옥외 유동인구가 평시와 다르게 움직이는
            날입니다. 인력·재고 계획에 반영하세요.
          </el-alert>

          <BaseDashboardCard>
            <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />

            <!-- 11차: 예산 배분 UI를 걷어냈다. 전국 17개 시·도를 다루면서 "마케팅 총 예산을
                 지역에 나눈다"는 개념이 성립하지 않게 됐고(업종·조직마다 예산 단위가 다르다),
                 실제로 v-model이 걸린 total은 스크립트에 정의조차 없는 죽은 바인딩이었다.
                 자리에는 업종과 무관하게 통하는 "먼저 볼 지역"만 남긴다. -->
            <el-alert v-if="topCity" type="info" show-icon :closable="false" class="top-city">
              먼저 확인할 지역: <strong>{{ topCity.name }}</strong> — 기상 영향 점수
              {{ topCity.execScore }}점
            </el-alert>
          </BaseDashboardCard>
        </aside>

        <main class="dashboard-main">
          <!-- 10차: 순위를 표로만 보던 걸 시상대로. 1위를 가운데 높게 둬서 한눈에 읽힌다 -->
          <BaseDashboardCard v-if="podium.length === 3" class="podium-card">
            <h3 class="section-title">
              <el-icon><Trophy /></el-icon> 기상 영향 상위 3개 지역
            </h3>
            <div class="podium">
              <button
                v-for="slot in podium"
                :key="slot.item.id"
                type="button"
                class="podium-slot"
                :class="`rank-${slot.rank}`"
                @click="goDetail(slot.item)"
              >
                <span class="podium-rank">{{ slot.rank }}위</span>
                <span class="podium-name">{{ slot.item.name }}</span>
                <span class="podium-score">{{ slot.item.execScore }}점</span>
                <span class="podium-meta">
                  {{ slot.item.temp }}°C · 체감 {{ slot.item.feelsLike }}°
                </span>
              </button>
            </div>
          </BaseDashboardCard>

          <BaseDashboardCard>
            <h3 class="section-title">
              <el-icon><House /></el-icon> 지역별 날씨 현황
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

            <!-- 10차: 17개 지역을 한 번에 훑기 어려워서 날씨 종류 필터와 정렬을 붙였다 -->
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
                <el-option label="영향 점수순" value="score" />
                <el-option label="기온 높은순" value="temp" />
                <el-option label="불쾌지수 높은순" value="thi" />
                <el-option label="이름순" value="name" />
              </el-select>
            </div>

            <!-- 다른 팀의 "오늘은 부산이 가장 덥고…" 한 줄 요약이 좋아서 우리 지표로 옮겼다 -->
            <p v-if="insight" class="insight-line">
              <el-icon><Opportunity /></el-icon> {{ insight }}
            </p>

            <!-- 교재 249p: el-row/el-col로 넓은 화면에서 2열 그리드가 되도록 반응형 배치 -->
            <el-row :gutter="16">
              <el-col v-for="item in visiblePlan" :key="item.id" :span="24" :md="12">
                <WeatherCard :city-item="item" @click-detail="goDetail" />
              </el-col>
            </el-row>

            <!-- 실데이터가 오기 전 회색 뼈대로 체감 로딩속도를 높인다 (교재 241p Skeleton) -->
            <el-skeleton v-if="isLoading && !budgetPlan.length" :rows="4" animated />
            <el-empty
              v-else-if="!visiblePlan.length"
              description="조건에 맞는 지역이 없습니다."
            />
          </BaseDashboardCard>
        </main>
      </div>

      <!-- 원래 /about 탭이던 서비스 소개를 별도 탭 대신 메인 화면 하단에 짧게 붙였다 -->
      <BaseDashboardCard class="about-inline">
        <h3 class="section-title"><el-icon><InfoFilled /></el-icon> 서비스 소개</h3>
        <p class="about-text">
          Vue 3와 Vue Router 5로 만든 기상 기반 경영 의사결정 참고 대시보드입니다. 전국 17개
          시·도의 실시간 날씨를 업종과 무관하게 읽히는 경영 영향으로 번역해, 전사 전략을 짤 때
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
/* h2도 h1과 같은 문제 — 카드 밖, 사진 배경에 직접 얹혀 있어서 어두운 배경에서 안 보였다 */
.practice-section > h2 {
  color: #f5f5f7;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 2px 14px rgba(0, 0, 0, 0.35);
}
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
  .dashboard-sidebar {
    /* 카드 그리드를 스크롤해도 검색 사이드바는 화면에 붙어 있는다 */
    position: sticky;
    top: 20px;
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
  color: #6e6e73;
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
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.45);
  box-shadow: none;
  cursor: pointer;
  text-align: center;
  transition:
    background-color 0.2s var(--apple-ease),
    transform 0.2s var(--apple-ease);
}
.podium-slot:hover {
  background: rgba(255, 255, 255, 0.72);
  transform: translateY(-2px);
}
/* 1위만 더 높고 진하게 — 시상대처럼 보이게 하는 건 결국 높이 차이다 */
.podium-slot.rank-1 {
  padding: 24px 10px;
  background: rgba(0, 122, 255, 0.14);
  border-color: rgba(0, 122, 255, 0.3);
}
.podium-rank {
  font-size: 11px;
  font-weight: 700;
  color: #6e6e73;
}
.podium-slot.rank-1 .podium-rank {
  color: #0a5fd8;
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
  color: #0a5fd8;
  font-variant-numeric: tabular-nums;
}
.podium-meta {
  font-size: 11px;
  color: #6e6e73;
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
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.45);
  box-shadow: none;
  font-size: 13px;
  font-weight: 600;
  color: #48484f;
  cursor: pointer;
  transition:
    background-color 0.2s var(--apple-ease),
    color 0.2s var(--apple-ease);
}
.filter-chip:hover {
  background: rgba(255, 255, 255, 0.7);
}
.filter-chip.is-on {
  background: rgba(0, 122, 255, 0.16);
  border-color: rgba(0, 122, 255, 0.32);
  color: #0a5fd8;
}
.sort-select {
  width: 148px;
}
.insight-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 14px;
  padding: 9px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid var(--glass-border);
  font-size: 13px;
  color: #48484f;
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
     비틀려 보인다 — blur를 세게 걸면 굴절이 뭉개져서 --glass-refract-blur(약한 블러)로 바꿨다. */
  -webkit-backdrop-filter: url(#glass-refraction) var(--glass-refract-blur);
  backdrop-filter: url(#glass-refraction) var(--glass-refract-blur);
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
  border: 1px solid var(--glass-border);
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
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--glass-border);
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
  color: #6e6e73;
}
.hero-stat-value {
  font-size: 19px;
  font-weight: 700;
}
.hero-stat-alert .hero-stat-value {
  color: #c62d22;
}
.hero-stat-alert.is-safe .hero-stat-value {
  color: #248a5e;
}
.hero-chart-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
  color: #6e6e73;
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
  transform: translateY(-2px);
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
  background: linear-gradient(180deg, #0a5fd8 0%, rgba(0, 122, 255, 0.4) 100%);
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 98, 204, 0.35);
}
.hero-chart-hint {
  font-size: 11px;
  color: #8a8a90;
  margin-left: 2px;
}
.hero-bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  /* 9차 가독성: 10px + #8e8e93은 유리 위에서 거의 안 읽혔다. 앱에서 가장 흐린 글자였다 */
  font-size: 11px;
  font-weight: 500;
  color: #48484f;
  white-space: nowrap;
}
</style>
