<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'
import {
  buildRegionalOutlook,
  buildOpsMode,
  buildDiscomfort,
  summarizeOps,
  execGrade,
  OPS_MODES,
  EXEC_MAX_SCORE,
} from '../data/weatherMock.js'
import { useWeatherStore } from '../stores/weatherStore.js'
import { DataAnalysis, Odometer, TrendCharts } from '@element-plus/icons-vue'

const router = useRouter()

// 과제 6: 요약 화면도 실시간 날씨로 등급과 기상 영향 점수를 매긴다.
// 11차: 이 화면이 axios로 17개 도시를 따로 다시 부르고 있었다. 대시보드·상세와 같은 데이터라
// 스토어 하나만 보면 된다 — 탭을 오갈 때마다 17회씩 재조회하던 걸 없앴다.
const weatherStore = useWeatherStore()
const { list: weatherList, isLoading } = storeToRefs(weatherStore)

const ranked = computed(() => buildRegionalOutlook(weatherList.value))

// 12차: 표(el-table)를 걷어냈다. 17행 × 6열 표는 "숫자를 읽어서 비교하는" 일을 사용자에게
// 떠넘긴다 — 어느 지역이 얼마나 나쁜지 알려면 78과 63을 눈으로 빼야 했다.
// 대신 (1) 전국 상태를 한 줄로 요약하고 (2) 점수를 막대 길이로 바꿔 눈으로 바로 비교되게 했다.
// buildOpsMode는 execScore를 본다. 원본 list에는 그 값이 없어서, 여기에 weatherList를
// 그대로 넘기면 집계(전부 '실내 전환')와 아래 목록(전부 '정상 운영')이 서로 다른 말을 했다.
// 점수가 붙은 ranked를 넘겨야 둘이 같은 값을 본다.
const opsCounts = computed(() => summarizeOps(ranked.value))

// 전국 요약 타일. 운영 모드별 지역 수를 OPS_MODES 정의 순서대로 세운다.
const opsSummary = computed(() =>
  Object.values(OPS_MODES).map((mode) => ({
    key: mode.key,
    label: mode.label,
    color: mode.color,
    count: opsCounts.value[mode.key],
  })),
)

const avgScore = computed(() => {
  if (!ranked.value.length) return 0
  return Math.round(ranked.value.reduce((sum, item) => sum + item.execScore, 0) / ranked.value.length)
})

const avgDiscomfort = computed(() => {
  if (!ranked.value.length) return 0
  return Math.round(
    ranked.value.reduce((sum, item) => sum + buildDiscomfort(item).value, 0) / ranked.value.length,
  )
})

// 점수 → 막대 길이(%)와 색. 색 기준은 지도·카드와 같은 execGrade 한 곳에서 온다.
const rows = computed(() =>
  ranked.value.map((item, index) => {
    const grade = execGrade(item.execScore)
    const mode = buildOpsMode(item)
    return {
      item,
      rank: index + 1,
      width: Math.max((item.execScore / EXEC_MAX_SCORE) * 100, 6),
      color: grade.color,
      gradeLabel: grade.label,
      mode,
    }
  }),
)

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
      <el-icon><DataAnalysis /></el-icon> 의사결정 보조 지표 요약
    </h2>

    <el-skeleton v-if="isLoading && !ranked.length" :rows="6" animated />

    <template v-if="ranked.length">
      <!-- 전국 한 줄 요약: 개별 지역을 보기 전에 "전국이 지금 어떤 상태인가"부터 답한다 -->
      <BaseDashboardCard>
        <h3 class="section-title">
          <el-icon><Odometer /></el-icon> 전국 요약
        </h3>
        <div class="overview">
          <div class="overview-stat">
            <span class="overview-key">평균 기상 영향 점수</span>
            <span class="overview-val">{{ avgScore }}<small>/{{ EXEC_MAX_SCORE }}</small></span>
          </div>
          <div class="overview-stat">
            <span class="overview-key">평균 불쾌지수</span>
            <span class="overview-val">{{ avgDiscomfort }}</span>
          </div>
          <div class="overview-stat">
            <span class="overview-key">집계 지역</span>
            <span class="overview-val">{{ ranked.length }}<small>개</small></span>
          </div>
        </div>

        <div class="ops-strip">
          <div
            v-for="mode in opsSummary"
            :key="mode.key"
            class="ops-chip"
            :class="{ 'is-empty': !mode.count }"
          >
            <span class="ops-dot" :style="{ backgroundColor: mode.color }"></span>
            <span class="ops-name">{{ mode.label }}</span>
            <span class="ops-count">{{ mode.count }}</span>
          </div>
        </div>
      </BaseDashboardCard>

      <!-- 순위 목록: 숫자를 나열하는 대신 막대 길이로 비교시킨다 -->
      <BaseDashboardCard>
        <h3 class="section-title">
          <el-icon><TrendCharts /></el-icon> 지역별 기상 영향 순위
        </h3>
        <p class="guide">
          막대가 길수록 옥외 활동에 유리한 조건입니다. 지역을 누르면 상세 분석으로 이동합니다.
        </p>

        <ul class="rank-list">
          <li v-for="row in rows" :key="row.item.id">
            <button type="button" class="rank-row" @click="goDetail(row.item)">
              <span class="rank-num">{{ row.rank }}</span>
              <span class="rank-name">{{ row.item.name }}</span>

              <span class="rank-track">
                <span
                  class="rank-fill"
                  :style="{ width: `${row.width}%`, backgroundColor: row.color }"
                ></span>
              </span>

              <span class="rank-score" :style="{ color: row.color }">{{ row.item.execScore }}</span>
              <span class="rank-grade">{{ row.gradeLabel }}</span>
              <span class="rank-mode" :style="{ color: row.mode.color }">{{ row.mode.label }}</span>
              <!-- 등급 코드(3-1-3)는 교재 과제 산출물이라 계속 노출하되, 맨 뒤 보조 정보로 둔다 -->
              <span class="rank-code">{{ row.item.code }}</span>
            </button>
          </li>
        </ul>
      </BaseDashboardCard>
    </template>
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
/* 12차: 사진 위 h2 처리는 base.css로 올려서 전 라우트가 같은 규칙을 쓴다 */

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: #1c1c1e;
}
.guide {
  font-size: 13px;
  color: #6e6e73;
  margin: 0 0 14px;
}

/* --- 전국 요약 --- */
.overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.overview-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--control-radius);
  border: 1px solid var(--control-border);
  background: var(--control-bg);
}
.overview-key {
  font-size: 12px;
  color: #6e6e73;
}
.overview-val {
  font-size: 26px;
  font-weight: 700;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}
.overview-val small {
  font-size: 13px;
  font-weight: 600;
  color: #8a8a90;
  margin-left: 2px;
}

.ops-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ops-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: var(--control-radius);
  border: 1px solid var(--control-border);
  background: var(--control-bg);
  font-size: 13px;
  font-weight: 600;
  color: var(--control-fg);
}
/* 해당 모드인 지역이 없으면 존재는 알리되 시선은 끌지 않는다 */
.ops-chip.is-empty {
  opacity: 0.45;
}
.ops-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.ops-count {
  font-variant-numeric: tabular-nums;
  color: #1c1c1e;
}

/* --- 순위 목록 --- */
.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rank-row {
  display: grid;
  grid-template-columns: 28px 64px 1fr 46px 52px 76px 60px;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: var(--control-radius);
  background: transparent;
  box-shadow: none;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s var(--apple-ease),
    border-color 0.2s var(--apple-ease),
    transform 0.2s var(--apple-ease);
}
.rank-row:hover {
  background: var(--control-bg-hover);
  border-color: var(--control-border);
  transform: var(--control-lift);
  box-shadow: var(--control-shadow-hover);
}
.rank-num {
  font-size: 12px;
  font-weight: 700;
  color: #8a8a90;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.rank-name {
  font-size: 15px;
  font-weight: 700;
  color: #1c1c1e;
}
/* 점수를 눈으로 비교하게 만드는 부분 — 표가 못 하던 일이다 */
.rank-track {
  height: 8px;
  border-radius: 4px;
  background: rgba(120, 120, 128, 0.16);
  overflow: hidden;
}
.rank-fill {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s var(--apple-ease);
}
.rank-score {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.rank-grade,
.rank-mode {
  font-size: 12px;
  font-weight: 600;
}
.rank-grade {
  color: #6e6e73;
}
.rank-code {
  font-size: 12px;
  color: #8a8a90;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

@media (max-width: 900px) {
  .overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  /* 좁은 화면에서는 막대와 이름만 남기고 보조 정보를 접는다 */
  .rank-row {
    grid-template-columns: 24px 56px 1fr 42px;
  }
  .rank-grade,
  .rank-mode,
  .rank-code {
    display: none;
  }
}
</style>
