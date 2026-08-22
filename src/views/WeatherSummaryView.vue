<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'
import { buildRegionalOutlook, buildOpsMode, EXEC_MAX_SCORE } from '../data/weatherMock.js'
import { useWeatherStore } from '../stores/weatherStore.js'
import { DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()

// 과제 6: 요약 표도 실시간 날씨로 등급과 기상 영향 점수를 매긴다.
// 11차: 이 화면이 axios로 17개 도시를 따로 다시 부르고 있었다. 대시보드·상세와 같은 데이터라
// 스토어 하나만 보면 된다 — 탭을 오갈 때마다 17회씩 재조회하던 걸 없앴다.
// (App.vue가 앱 시작 시 한 번 load()를 부르고, 스토어가 결과를 캐시한다.)
const weatherStore = useWeatherStore()
const { list: weatherList, isLoading } = storeToRefs(weatherStore)

// 목록 화면은 검색으로 걸러진 도시만 보지만, 요약은 항상 전체 도시를 본다.
const budgetPlan = computed(() => buildRegionalOutlook(weatherList.value))

const totalScore = computed(() => budgetPlan.value.reduce((sum, item) => sum + item.execScore, 0))

// el-table의 show-summary가 호출하는 합계 행 조립기. 순서는 el-table-column 배치 순서와 같아야 한다.
const getSummary = () => [
  '합계',
  '-',
  `${totalScore.value}`,
  '-',
  '-',
  `${budgetPlan.value.length}개 지역`,
]

// 11차: '세그먼트'(교재 과제 산출물)는 실데이터에서 거의 전 지역이 '옥외 활동 적합'으로 찍혀
// 표에서 아무것도 구분해주지 못한다. 교재 산출물이라 지우지는 않고, 실제로 갈라지는 축인
// 운영 모드를 옆에 같이 세운다.
const opsTagType = { normal: 'success', indoor: 'info', reduced: 'warning', halt: 'danger' }
const opsOf = (row) => buildOpsMode(row)

const priorityTagType = (priority) => ({ A: 'danger', B: 'warning', C: 'info' })[priority]

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

    <BaseDashboardCard>
      <p class="guide">
        전국 지역을 기상 영향 점수(최고 {{ EXEC_MAX_SCORE }}점) 높은 순으로 정렬했습니다. 행을
        클릭하면 해당 지역의 상세 분석으로 이동합니다.
      </p>
    </BaseDashboardCard>

    <el-skeleton v-if="isLoading && !budgetPlan.length" :rows="5" animated />

    <BaseDashboardCard v-if="budgetPlan.length">
      <!-- 교재 249p: 표를 el-table로 교체. show-summary + summary-method가 하단 합계 행을 대신 그려준다 -->
      <el-table
        :data="budgetPlan"
        style="width: 100%"
        show-summary
        :summary-method="getSummary"
        @row-click="goDetail"
      >
        <el-table-column prop="name" label="도시" />
        <el-table-column prop="code" label="등급" />
        <el-table-column label="점수" align="right">
          <template #default="{ row }">{{ row.execScore }}</template>
        </el-table-column>
        <el-table-column label="검토 우선순위">
          <template #default="{ row }">
            <el-tag :type="priorityTagType(row.priority)">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="운영 모드" min-width="110">
          <template #default="{ row }">
            <el-tag :type="opsTagType[opsOf(row).key]" effect="light">
              {{ opsOf(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="세그먼트" min-width="150">
          <template #default="{ row }">{{ row.segment.label }}</template>
        </el-table-column>
      </el-table>
    </BaseDashboardCard>
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
.budget-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.preset {
  margin-left: 4px;
}
/* 8차: #868e96은 반투명 유리 위에서 대비가 모자라 흐리게 읽혔다 — 앱 표준 보조 텍스트 색으로 */
.guide {
  font-size: 13px;
  color: #6e6e73;
  margin: 8px 0 0;
}
/* el-table 행 클릭이 이동으로 이어지는 걸 시각적으로 알려준다 */
:deep(.el-table__row) {
  cursor: pointer;
}
</style>
