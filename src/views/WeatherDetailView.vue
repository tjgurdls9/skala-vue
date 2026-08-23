<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'
import { useConfigStore } from '../stores/configStore.js'
import { useWeatherStore } from '../stores/weatherStore.js'
import {
  findCity,
  gradeCity,
  GRADE_STANDARD,
  buildRiskAlerts,
  build7P,
  buildExecScore,
  buildFunctionalImpacts,
  buildDailyForecast,
  FORECAST_MAX_SCORE,
  buildBriefing,
  buildDaylight,
  buildDiscomfort,
  windLabel,
  aqiLabel,
} from '../data/weatherMock.js'
import { fetchCityWeather, fetchForecast } from '../data/weatherApi.js'
import {
  DataAnalysis,
  Location,
  Aim,
  // 12차: 템플릿에서 <Promotion />을 쓰면서 import를 빠뜨려
  // 콘솔에 "Failed to resolve component: Promotion"이 계속 찍히고 아이콘이 안 그려졌다
  Promotion,
  Odometer,
  Flag,
  Briefcase,
  WarnTriangleFilled,
  Drizzling,
  Pouring,
  Calendar,
  CircleCheck,
  Sunny,
  PartlyCloudy,
  WindPower,
  Back,
  ArrowLeft,
  InfoFilled,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const weatherStore = useWeatherStore()

const city = ref(null)
const isLoading = ref(false)
const notFound = ref(false)
const forecast = ref([])

// 예보 날씨(Clear/Rain/…)를 이미 쓰고 있는 아이콘 매핑으로 옮긴다
const FORECAST_ICON = {
  Clear: Sunny,
  Clouds: PartlyCloudy,
  Rain: Pouring,
  Drizzle: Drizzling,
  Thunderstorm: Pouring,
  Snow: Drizzling,
}
const forecastIcon = (main) => FORECAST_ICON[main] ?? PartlyCloudy

// 예보 점수(최고 9점)를 한 줄 코멘트로 옮긴다. 지금 날씨의 27점과 만점이 달라서 헷갈리지
// 않도록 화면에도 "/9"를 같이 적는다.
const forecastComment = (score) => {
  if (score >= 9) return '옥외 활동 적기'
  if (score >= 6) return '제약 없음'
  if (score >= 3) return '실내 병행 권장'
  return '옥외 활동 보류 검토'
}

// 동적 세그먼트 /weather/:cityId 로 들어온 도시 코드로 Mount 시점에 등록된 도시인지 먼저 확인하고
// 실시간 날씨를 조회해 등급까지 매긴다. (교재 224p try/catch/finally 패턴)
onMounted(async () => {
  const registered = findCity(route.params.cityId)
  if (!registered) {
    notFound.value = true
    return
  }

  // 11차: 상세로 들어왔다는 건 "지금 이 지역을 보고 있다"는 뜻이다. 스토어에 그대로 반영해서
  // 앱 배경이 이 지역의 실제 날씨를 따르게 하고, 대시보드로 돌아가도 같은 지역이 선택돼 있게 한다.
  weatherStore.setCity(registered.id)
  weatherStore.load()

  isLoading.value = true
  try {
    const live = await fetchCityWeather(registered)
    // 11차: gradeCity만 붙이면 execScore가 없어서 재무 영향이 NaN%로 나왔다.
    // 목록 화면(buildRegionalOutlook)과 같은 방식으로 연속 점수까지 붙여준다.
    const graded = gradeCity(live)
    const exec = buildExecScore(graded)
    city.value = { ...graded, exec, execScore: exec.score }
    // 9차: 예보는 실패해도 상세 화면 본문은 계속 보여야 하므로 따로 잡는다
    try {
      const raw = await fetchForecast(registered.lat, registered.lon)
      forecast.value = buildDailyForecast(raw.list)
    } catch (forecastError) {
      console.error('예보 조회 중 에러가 발생했습니다:', forecastError)
    }
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    alert('날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부와 주소를 확인해 주시기 바랍니다.')
  } finally {
    isLoading.value = false
  }
})

// 과제 5: 전역 단위 설정에 맞춰 표시용 기온을 계산한다.
const displayTemp = computed(() => {
  if (!city.value) return 0
  return configStore.convertTemperature(city.value.temp)
})

const riskAlerts = computed(() =>
  city.value ? buildRiskAlerts(city.value).filter((alert) => alert.level !== 'success') : [],
)

// 11차: 마케팅 7P + 경영 기능 5축(인사/재무/회계/생산물류/안전)
const ops = computed(() => (city.value ? build7P(city.value) : { mode: null, items: [] }))
const impacts = computed(() => (city.value ? buildFunctionalImpacts(city.value) : []))
const LEVEL_LABEL = { success: '영향 없음', info: '참고', warning: '주의', danger: '중대' }
// 7P 타일이 P 이름을 머리글로 다는 것과 같은 자리. 경영 기능도 같은 결로 맞춘다.
const FUNC_EN = {
  hr: 'HR',
  finance: 'Finance',
  accounting: 'Accounting',
  scm: 'SCM',
  safety: 'Safety',
}


// --- 10차: 브리핑 / 일조 / 관측 지표 타일 ---
const TONE_ICON = {
  success: CircleCheck,
  info: InfoFilled,
  warning: WarnTriangleFilled,
  danger: WarnTriangleFilled,
}

const formatTemp = (value) => `${configStore.convertTemperature(value)}${configStore.unitSymbol}`
const briefing = computed(() =>
  city.value ? buildBriefing(city.value, formatTemp) : { headline: '', lines: [] },
)
const daylight = computed(() => (city.value ? buildDaylight(city.value) : null))

// 낮에는 태양, 밤에는 달이 각각의 시간 진행률에 맞춰 같은 호를 지난다.
const celestialPos = computed(() => {
  const d = daylight.value
  if (!d) return { x: 14, y: 86 }
  const progress = d.isDay ? d.progress : d.nightProgress
  return {
    x: 14 + 272 * progress,
    y: 86 - Math.sin(Math.PI * progress) * 63,
  }
})

const metrics = computed(() => {
  const c = city.value
  if (!c) return []
  const discomfort = buildDiscomfort(c)
  return [
    {
      label: '체감 온도',
      icon: Sunny,
      value: configStore.convertTemperature(c.feelsLike),
      unit: configStore.unitSymbol,
      note:
        c.feelsLike > c.temp
          ? '습도와 바람의 영향으로 실제 기온보다 높게 체감됩니다.'
          : c.feelsLike < c.temp
            ? '바람의 영향으로 실제 기온보다 낮게 체감됩니다.'
            : '체감 온도와 실제 기온이 일치합니다.',
    },
    {
      label: '불쾌지수',
      icon: Odometer,
      value: discomfort.value,
      unit: '',
      note: `${discomfort.label} — ${discomfort.value >= 75 ? '옥외 체류 시간이 짧아집니다.' : '옥외 체류에 제약이 없습니다.'}`,
    },
    {
      label: '습도',
      icon: Drizzling,
      value: c.humidity,
      unit: '%',
      note: c.humidity >= 60 ? '쾌적 구간(40–60%)을 상회합니다.' : '쾌적 구간에 있습니다.',
    },
    {
      label: '바람',
      icon: WindPower,
      value: c.wind,
      unit: 'm/s',
      note: `${windLabel(c.windDeg)}풍, 풍향 ${c.windDeg}°.`,
    },
    {
      label: '통합 대기질',
      icon: CircleCheck,
      value: aqiLabel(c.airQualityIndex),
      unit: '',
      note: `초미세먼지 ${c.microdust} · 미세먼지 ${c.pm10} µg/m³`,
    },
    {
      label: '구름량',
      icon: PartlyCloudy,
      value: c.clouds,
      unit: '%',
      note: '전운량 — 하늘 전체 대비 구름이 덮은 비율입니다.',
    },
    {
      label: '가시거리',
      icon: Aim,
      value: c.visibility,
      unit: 'km',
      note: c.visibility >= 10 ? '시정 제약이 없습니다.' : '안개·강수로 시정이 제한됩니다.',
    },
    {
      label: '기압',
      icon: Odometer,
      value: c.pressure,
      unit: 'hPa',
      note: '해면기압(MSLP) 기준값입니다.',
    },
  ]
})

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.go(-1)
}
</script>

<template>
  <div class="practice-section">
    <h2>
      <el-icon><DataAnalysis /></el-icon> 지역별 상세 기상 관측 정보
    </h2>

    <!-- 실 데이터가 오기 전 회색 뼈대로 체감 로딩속도를 높인다 (교재 241p Skeleton) -->
    <el-skeleton v-if="isLoading" :rows="4" animated />

    <div v-if="city">
      <!-- 7차: 표 한 줄로 묻혀 있던 실시간 기온을 WeatherCard와 같은 "큰 숫자" 문법으로 올렸다.
           같은 정보를 화면마다 다른 방식으로 보여주면 그 자체로 비일관적이라 Apple스럽지 않다. -->
      <section class="detail-hero">
        <div class="detail-hero-head">
          <span class="detail-hero-region"
            ><el-icon><Location /></el-icon> {{ city.region }}</span
          >
          <h3 class="detail-hero-name">{{ city.name }}</h3>
        </div>
        <p class="detail-hero-temp">
          {{ displayTemp }}<span class="detail-hero-unit">{{ configStore.unitSymbol }}</span>
        </p>
        <p class="detail-hero-status">
          {{ city.status }} · 체감 {{ configStore.convertTemperature(city.feelsLike) }}° ·
          ↑{{ configStore.convertTemperature(city.tempMax) }}°
          ↓{{ configStore.convertTemperature(city.tempMin) }}°
        </p>
        <div class="badge-row">
          <el-tag :type="city.temp >= 25 ? 'danger' : 'info'">
            <el-icon><component :is="city.temp >= 25 ? Sunny : PartlyCloudy" /></el-icon>
            {{ city.temp >= 25 ? '더움 (25도 이상)' : '선선함 (25도 미만)' }}
          </el-tag>
          <el-tag :type="city.humidity >= 60 ? 'info' : city.humidity >= 40 ? 'success' : 'warning'">
            <el-icon
              ><component
                :is="city.humidity >= 60 ? Drizzling : city.humidity >= 40 ? CircleCheck : WindPower"
            /></el-icon>
            {{
              city.humidity >= 60 ? '습함 (60% 이상)' : city.humidity >= 40 ? '상쾌함' : '건조함'
            }}
          </el-tag>
          <el-tag :type="city.microdust >= 50 ? 'danger' : 'success'">
            <el-icon><component :is="city.microdust >= 50 ? WarnTriangleFilled : CircleCheck" /></el-icon>
            미세먼지 {{ city.microdust }}
          </el-tag>
        </div>
      </section>

      <!-- 10차: 수치를 늘어놓는 대신 한 문단 + 근거 목록으로 정리한 의사결정 브리핑.
           규칙 기반이라 실제로 모델을 부르지 않는다 — 그래서 이름에 AI를 붙이지 않았다. -->
      <BaseDashboardCard class="briefing-card">
        <h3 class="section-title">
          <el-icon><Promotion /></el-icon> 의사결정 브리핑
        </h3>
        <p class="briefing-headline">{{ briefing.headline }}</p>
        <ul class="briefing-list">
          <li v-for="line in briefing.lines" :key="line.key" :class="`tone-${line.tone}`">
            <el-icon><component :is="TONE_ICON[line.tone]" /></el-icon>
            <span>{{ line.text }}</span>
          </li>
        </ul>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <h3 class="section-title">
          <el-icon><Odometer /></el-icon> 관측 지표
        </h3>
        <!-- 각 수치 밑에 "그래서 무슨 뜻인지" 한 줄을 붙였다. 숫자만 있으면 판단이 안 된다. -->
        <div class="metric-grid">
          <div v-for="metric in metrics" :key="metric.label" class="metric-tile">
            <span class="metric-label">
              <el-icon><component :is="metric.icon" /></el-icon> {{ metric.label }}
            </span>
            <span class="metric-value">
              {{ metric.value }}<small v-if="metric.unit">{{ metric.unit }}</small>
            </span>
            <span class="metric-note">{{ metric.note }}</span>
          </div>
        </div>

        <template v-if="daylight">
          <h3 class="section-title">
            <el-icon><Sunny /></el-icon> 일조 시간
          </h3>
          <div class="daylight">
            <!-- 해가 뜨고 지는 호. 지금이 낮이면 해 위치가 호 위에 놓인다 -->
            <svg class="daylight-arc" viewBox="0 0 300 106" aria-hidden="true">
              <!-- 반지름 136짜리 원호는 viewBox 밖으로 솟아 위가 잘렸다.
                   높이를 직접 정할 수 있는 2차 베지에로 바꿔서 얕은 돔을 그린다. -->
              <path d="M14,86 Q150,-40 286,86" class="daylight-path" />
              <line x1="8" y1="86" x2="292" y2="86" class="daylight-ground" />
              <!-- 낮에는 태양, 밤에는 초승달을 그린다. 문자 이모지가 아니라 같은 SVG 체계다. -->
              <circle
                v-if="daylight.isDay"
                :cx="celestialPos.x"
                :cy="celestialPos.y"
                r="8"
                class="daylight-sun"
              />
              <path
                v-else
                d="M4,-8A8,8 0 1,0 4,8A6.4,6.4 0 0,1 4,-8Z"
                class="daylight-moon"
                :transform="`translate(${celestialPos.x} ${celestialPos.y})`"
              />
            </svg>
            <div class="daylight-row">
              <span class="daylight-cell">
                <span class="daylight-key">일출</span>
                <span class="daylight-val">{{ daylight.sunrise }}</span>
              </span>
              <span class="daylight-cell is-center">
                <span class="daylight-key">낮 길이</span>
                <span class="daylight-val">{{ daylight.dayLengthLabel }}</span>
              </span>
              <span class="daylight-cell is-right">
                <span class="daylight-key">일몰</span>
                <span class="daylight-val">{{ daylight.sunset }}</span>
              </span>
            </div>
            <p class="footnote">
              현지 시각 {{ daylight.observed }} 관측 ·
              {{ daylight.isDay ? '현재 낮입니다' : '현재 야간입니다' }}
            </p>
          </div>
        </template>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <h3 class="section-title">
          <el-icon><Aim /></el-icon> 등급 판정
        </h3>
        <div class="grade-row">
          <div class="grade-stat">
            <span class="grade-stat-label">기온</span>
            <span class="grade-stat-value">{{ city.grade.temp }}등급</span>
            <span class="grade-stat-hint"
              >쾌적 구간 {{ configStore.convertTemperature(GRADE_STANDARD.temp.bestMin) }}–{{
                configStore.convertTemperature(GRADE_STANDARD.temp.bestMax)
              }}{{ configStore.unitSymbol }}</span
            >
          </div>
          <div class="grade-stat">
            <span class="grade-stat-label">습도</span>
            <span class="grade-stat-value">{{ city.grade.humidity }}등급</span>
            <span class="grade-stat-hint"
              >쾌적 구간 {{ GRADE_STANDARD.humidity.bestMin }}–{{
                GRADE_STANDARD.humidity.bestMax
              }}%</span
            >
          </div>
          <div class="grade-stat">
            <span class="grade-stat-label">미세먼지</span>
            <span class="grade-stat-value">{{ city.grade.dust }}등급</span>
            <span class="grade-stat-hint">‘좋음’ 기준 {{ GRADE_STANDARD.dust.best }}µg/m³ 미만</span>
          </div>
        </div>

        <!-- 9차: OpenWeatherMap 5 Day Forecast를 붙여, 지금 판단만 하던 화면이 며칠 앞까지
             보게 됐다. 예보 응답에는 미세먼지가 없어서 기온·습도 2축(최고 9점)만 쓴다 —
             지금 날씨의 27점과 만점이 다르므로 화면에도 분모를 같이 적는다. -->
        <template v-if="forecast.length">
          <h3 class="section-title">
            <el-icon><Calendar /></el-icon> 향후 {{ forecast.length }}일 옥외 활동 전망
          </h3>
          <div class="forecast-row">
            <div v-for="day in forecast" :key="day.date" class="forecast-day">
              <span class="forecast-date">{{ day.label }}</span>
              <el-icon class="forecast-icon"><component :is="forecastIcon(day.weatherMain)" /></el-icon>
              <span class="forecast-temp">
                {{ configStore.convertTemperature(day.max) }}<span class="forecast-temp-min"
                  >/{{ configStore.convertTemperature(day.min) }}{{ configStore.unitSymbol }}</span
                >
              </span>
              <span class="forecast-humidity">습도 {{ day.humidity }}%</span>
              <span class="forecast-score">{{ day.grade.score }}/{{ FORECAST_MAX_SCORE }}점</span>
              <span class="forecast-comment">{{ forecastComment(day.grade.score) }}</span>
            </div>
          </div>
          <p class="footnote">
            예보 응답에는 대기질 항목이 없어 기온·습도 2개 축으로만 산출한 점수입니다.
          </p>
        </template>

        <h3 class="section-title">
          <el-icon><Odometer /></el-icon> 기상 대응 지수
        </h3>
        <p class="score-formula">
          6개 기상 축의 가중 합계 = <strong>{{ city.execScore }}점</strong> (최고 100점)
        </p>
        <p class="index-meaning">
          점수가 높을수록 현재 경영 계획을 유지하기 좋은 기상 조건입니다. 낮을수록
          일정·채널·인력·안전 계획의 선제 조정이 필요합니다. 이 지수는 성과를 예측하는 값이
          아니라, 기상 노출에 대응할 우선순위를 정하는 참고 지표입니다.
        </p>
        <div class="index-parts" aria-label="기상 대응 지수 산출 내역">
          <span v-for="part in city.exec.parts" :key="part.key">
            {{ part.label }} <b>{{ part.contribution }}/{{ part.weight }}</b>
          </span>
        </div>
        <p class="footnote">구간: 75–100 우수 · 55–74 양호 · 35–54 주의 · 0–34 미흡</p>
      </BaseDashboardCard>

      <!-- 11차: 4개 탭(마케팅/재고/인력/경보)을 서비스 마케팅 7P로 넓혔다.
           카드에서는 결론만 보여주고, 근거 전체는 공간이 넉넉한 여기서 펼친다. -->
      <BaseDashboardCard>
        <h3 class="section-title">
          <el-icon><Flag /></el-icon> 마케팅 믹스 7P 영향
        </h3>
        <p class="footnote section-lead">
          서비스 마케팅 7P 각 요소가 오늘 이 지역의 기상 조건에서 어떤 영향을 받는지 정리했습니다.
        </p>
        <div class="mix-grid">
          <div v-for="entry in ops.items" :key="entry.p" class="mix-tile">
            <span class="mix-p">{{ entry.p }}</span>
            <span class="mix-label">{{ entry.label }}</span>
            <span class="mix-text">{{ entry.text }}</span>
          </div>
        </div>
      </BaseDashboardCard>

      <!-- 11차: 마케팅 밖의 경영 기능까지. 날씨는 인사·재무·회계·물류·안전에 전부 걸린다. -->
      <BaseDashboardCard>
        <h3 class="section-title">
          <el-icon><Briefcase /></el-icon> 경영 기능별 영향
        </h3>
        <p class="footnote section-lead">
          추정치는 업계 통용 경험칙에 기반합니다. 실제 수치는 각 조직의 실적 데이터로 보정해
          사용합니다.
        </p>
        <!-- 13차-p: 세로 목록이던 걸 7P와 같은 타일 그리드로 맞췄다. 두 카드가 같은
             성격(요소별 영향)인데 어법이 갈려 있어서, 상세 화면 안에서 톤이 두 갈래였다.
             다섯 개라 2 + 3으로 나눈다. -->
        <div class="func-grid">
          <div v-for="fn in impacts" :key="fn.key" class="mix-tile" :class="`tone-${fn.level}`">
            <span class="mix-p">{{ FUNC_EN[fn.key] }}</span>
            <span class="mix-label">
              {{ fn.label }}
              <em class="mix-level">{{ LEVEL_LABEL[fn.level] }}</em>
            </span>
            <span class="mix-text">{{ fn.notes.join(' ') }}</span>
          </div>
        </div>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <h3 class="section-title">
          <el-icon><WarnTriangleFilled /></el-icon> 기상 리스크 경보
        </h3>
        <el-alert
          v-for="(alert, index) in riskAlerts"
          :key="index"
          :type="alert.type ?? alert.level"
          :closable="false"
          show-icon
          class="risk-alert"
        >
          {{ alert.text }}
        </el-alert>
        <el-empty v-if="!riskAlerts.length" :image-size="48" description="현재 감지된 기상 리스크가 없습니다." />
      </BaseDashboardCard>
    </div>

    <BaseDashboardCard v-else-if="notFound">
      <!-- "조회된 검색 결과가 없습니다" 케이스 전용 컴포넌트 (교재 241p Empty) -->
      <el-empty :description="`'${route.params.cityId}'에 해당하는 도시 정보가 없습니다.`" />
    </BaseDashboardCard>

    <!-- 8차: "←" 문자를 직접 박아 쓰던 걸 아이콘으로. 앱 전체가 이모지/문자 대신 아이콘을 쓴다 -->
    <div class="detail-actions">
      <el-button type="primary" :icon="Back" @click="goHome">메인 대시보드로 돌아가기</el-button>
      <el-button :icon="ArrowLeft" @click="goBack">이전 화면으로</el-button>
    </div>
  </div>
</template>

<style scoped>
/* 6차: "유리 위 유리" 방지 — WeatherHomeView.vue와 같은 이유 */
.practice-section {
  background: transparent;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  border: none;
  box-shadow: none;
  width: 100%;
}
/* 13차-f: 사진 배경 시절에 h2를 흰 글자 + 그림자로 만들어 뒀던 규칙을 지웠다.
   배경이 밝은 회색이 된 뒤로는 흰 배경에 흰 글자였고, 화면에서 이 제목만 혼자
   그림자를 달고 있었다. practice.css의 기본 다크 텍스트를 그대로 쓴다. */
:deep(.el-tabs__item) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
/* 7차: el-descriptions의 격자 테두리(border 속성)를 걷어낸 자리에 남는 기본 회색 배경/셀 구분선을
   지워서 유리 카드 안에 자연스럽게 녹아들게 한다 — 격자 표 대신 옅은 구분선의 라벨:값 목록으로 */
:deep(.el-descriptions__body) {
  background: transparent;
}
:deep(.el-descriptions__label) {
  color: #48515f;
  font-weight: 500;
}
:deep(.el-descriptions__content) {
  color: #1c1c1e;
}

.detail-hero {
  position: relative;
  border-radius: var(--radius-card);
  margin-bottom: 15px;
  padding: 24px 26px;
  background-color: var(--glass-bg-strong);
  background-image: var(--glass-sheen);
  -webkit-backdrop-filter: var(--glass-surface);
  backdrop-filter: var(--glass-surface);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}
.detail-hero-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}
.detail-hero-region {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #48515f;
}
.detail-hero-name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1c1c1e;
}
.detail-hero-temp {
  margin: 4px 0 0;
  font-size: 56px;
  font-weight: 700;
  line-height: 1.1;
  color: #1c1c1e;
}
.detail-hero-unit {
  font-size: 24px;
  font-weight: 500;
  color: #48515f;
  margin-left: 2px;
}
.detail-hero-status {
  margin: 2px 0 14px;
  font-size: 13px;
  color: #48484f;
}
.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.badge-row .el-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.grade-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.grade-stat {
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
  border-radius: var(--radius-control);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.grade-stat-label {
  font-size: 12px;
  color: #48515f;
}
.grade-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1c1c1e;
}
.grade-stat-hint {
  font-size: 11px;
  color: #48515f;
}
.section-lead {
  margin: -4px 0 12px;
}

/* --- 11차: 마케팅 7P --- */
/* 12차: 7개는 어떤 균등 분할로도 안 떨어져서 마지막 줄이 늘 어정쩡했다.
   12열 위에 얹어 첫 줄 3개(각 4칸) + 둘째 줄 4개(각 3칸)로 나눈다. */
.mix-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 10px;
}
.mix-tile:nth-child(-n + 3) {
  grid-column: span 4;
}
.mix-tile:nth-child(n + 4) {
  grid-column: span 3;
}
@media (max-width: 900px) {
  .mix-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mix-tile:nth-child(-n + 3),
  .mix-tile:nth-child(n + 4) {
    grid-column: span 1;
  }
}
.mix-tile {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 14px;
  border-radius: var(--radius-control);
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
}
.mix-p {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #48515f;
}
.mix-label {
  font-size: 14px;
  font-weight: 700;
  color: #1c1c1e;
}
.mix-text {
  font-size: 12px;
  line-height: 1.55;
  color: #48484f;
}

/* 13차-p: 경영 기능 5개를 2 + 3으로. 6칸 그리드에서 앞 둘은 3칸, 뒤 셋은 2칸이다. */
.func-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}
.func-grid .mix-tile:nth-child(-n + 2) {
  grid-column: span 3;
}
.func-grid .mix-tile:nth-child(n + 3) {
  grid-column: span 2;
}
@media (max-width: 900px) {
  .func-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .func-grid .mix-tile:nth-child(-n + 2),
  .func-grid .mix-tile:nth-child(n + 3) {
    grid-column: span 1;
  }
}
/* 등급은 라벨 옆 작은 글자로. 타일 배경을 물들이면 유리 톤이 무너진다(11차와 같은 판단). */
.mix-level {
  margin-left: 6px;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  color: #48515f;
}
.mix-tile.tone-success .mix-level {
  color: #14563a;
}
.mix-tile.tone-warning .mix-level {
  color: #8a4e00;
}
.mix-tile.tone-danger .mix-level {
  color: #ad251c;
}

/* --- 11차: 경영 기능별 영향 --- */
.func-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.func-row {
  padding: 12px 14px;
  border-radius: var(--radius-control);
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
  /* 심각도는 왼쪽 색 띠로. 배경을 물들이면 유리 톤이 무너진다 */
  border-left-width: 3px;
}
.func-row.tone-success {
  border-left-color: #14563a;
}
.func-row.tone-warning {
  border-left-color: #8a4e00;
}
.func-row.tone-danger {
  border-left-color: #ad251c;
}
.func-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.func-label {
  font-size: 14px;
  font-weight: 700;
  color: #1c1c1e;
}
.func-level {
  font-size: 11px;
  font-weight: 600;
  color: #48515f;
}
.func-notes {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.6;
  color: #48484f;
}

.score-formula {
  font-size: 15px;
}
.index-meaning {
  margin: 8px 0 14px;
  line-height: 1.55;
  color: #48515f;
}
.index-parts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}
.index-parts span {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 10px;
  background: var(--glass-inset-bg);
  color: #48515f;
  font-size: 12px;
}
.index-parts b {
  color: #101828;
  font-weight: 700;
}

/* --- 10차: 의사결정 브리핑 --- */
.briefing-headline {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.55;
  color: #1c1c1e;
}
.briefing-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.briefing-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
  font-size: 13px;
  line-height: 1.55;
  color: #48484f;
}
.briefing-list li .el-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
.briefing-list li.tone-success .el-icon {
  color: #14563a;
}
.briefing-list li.tone-info .el-icon {
  color: #0a53c0;
}
.briefing-list li.tone-warning .el-icon {
  color: #8a4e00;
}
.briefing-list li.tone-danger .el-icon {
  color: #ad251c;
}

/* --- 10차: 관측 지표 타일 --- */
/* 12차: auto-fit이라 폭에 따라 7개가 한 줄에 들어가고 마지막 1개만 다음 줄로 떨어졌다.
   지표가 정확히 8개니 4열로 고정하면 4+4로 딱 떨어진다. */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.metric-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--radius-control);
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
}
.metric-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #48515f;
}
.metric-value {
  font-size: 21px;
  font-weight: 700;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}
.metric-value small {
  font-size: 12px;
  font-weight: 500;
  color: #48515f;
  margin-left: 2px;
}
.metric-note {
  font-size: 11px;
  line-height: 1.45;
  color: #48515f;
}

/* --- 10차: 일조 시간 호 --- */
.daylight-arc {
  width: 100%;
  max-width: 340px;
  height: auto;
  display: block;
  margin: 0 auto;
}
.daylight-path {
  fill: none;
  stroke: rgba(28, 32, 56, 0.25);
  stroke-width: 2;
  stroke-dasharray: 4 6;
  stroke-linecap: round;
}
.daylight-ground {
  stroke: rgba(28, 32, 56, 0.32);
  stroke-width: 1.5;
}
.daylight-sun {
  fill: #f5a623;
  stroke: rgba(255, 255, 255, 0.85);
  stroke-width: 2;
  transition: all 0.4s var(--apple-ease);
}
.daylight-moon {
  fill: #dce8ff;
  stroke: rgba(94, 142, 229, 0.72);
  stroke-width: 1.2;
  filter: drop-shadow(0 0 5px rgba(111, 165, 255, 0.55));
}
.daylight-row {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}
.daylight-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.daylight-cell.is-center {
  align-items: center;
}
.daylight-cell.is-right {
  align-items: flex-end;
}
.daylight-key {
  font-size: 11px;
  color: #48515f;
}
.daylight-val {
  font-size: 15px;
  font-weight: 700;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}

/* 5일 예보: 하루 한 칸. 좁아지면 자동으로 줄이 접힌다 */
.forecast-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(122px, 1fr));
  gap: 10px;
  margin-bottom: 8px;
}
.forecast-day {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--radius-control);
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
}
.forecast-date {
  font-size: 12px;
  font-weight: 600;
  color: #48484f;
}
.forecast-icon {
  font-size: 20px;
  color: var(--color-accent);
  margin: 2px 0;
}
.forecast-temp {
  font-size: 19px;
  font-weight: 700;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}
.forecast-temp-min {
  font-size: 13px;
  font-weight: 500;
  color: #48515f;
}
.forecast-humidity {
  font-size: 11px;
  color: #48515f;
}
.forecast-score {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #0a53c0;
  font-variant-numeric: tabular-nums;
}
.forecast-comment {
  font-size: 11px;
  color: #48484f;
}
.segment-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
  color: var(--color-accent);
}
.footnote {
  font-size: 13px;
  color: #48515f;
  margin-top: 8px;
}
.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.risk-alert {
  margin-bottom: 8px;
}
.risk-alert:last-child {
  margin-bottom: 0;
}
@media (max-width: 640px) {
  .index-parts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
