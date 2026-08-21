<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'
import { storeToRefs } from 'pinia'
import { weatherList as cityRegistry, buildBudgetPlan, MAX_SCORE } from '../data/weatherMock.js'
import { fetchCityWeather } from '../data/weatherApi.js'
import { useBudgetStore } from '../stores/budgetStore.js'

const router = useRouter()

// 과제 5: 대시보드와 같은 예산을 본다. 한쪽에서 바꾸면 다른 쪽도 같이 바뀐다.
const budgetStore = useBudgetStore()
const { total } = storeToRefs(budgetStore)

// 과제 6: 요약 표도 실시간 날씨로 등급/예산을 매긴다.
const weatherList = ref([])
const isLoading = ref(false)

const loadWeather = async () => {
  isLoading.value = true
  try {
    weatherList.value = await axios.all(cityRegistry.map(fetchCityWeather))
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    alert('날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부나 주소를 확인하세요.')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadWeather)

// 목록 화면은 검색으로 걸러진 도시만 보지만, 요약은 항상 전체 도시를 본다.
const budgetPlan = computed(() => buildBudgetPlan(weatherList.value, total.value))

const totalScore = computed(() => budgetPlan.value.reduce((sum, item) => sum + item.grade.score, 0))

const totalShare = computed(() => budgetPlan.value.reduce((sum, item) => sum + item.share, 0))

const totalBudget = computed(() => budgetPlan.value.reduce((sum, item) => sum + item.budget, 0))

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
    <h2>📋 의사결정 보조 지표 요약</h2>

    <BaseDashboardCard>
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
        <span class="preset">
          <button @click="budgetStore.setTotal(500)">500</button>
          <button @click="budgetStore.setTotal(1000)">1000</button>
          <button @click="budgetStore.setTotal(2000)">2000</button>
        </span>
      </p>
      <p class="guide">
        현재 배정 예산 <strong>{{ budgetStore.totalLabel }}</strong> — 날씨 대시보드와 같은 값을
        봅니다. 한쪽에서 바꾸면 다른 쪽도 바뀝니다.
      </p>
      <p class="guide">
        전체 도시를 집행 점수(최고 {{ MAX_SCORE }}점) 높은 순으로 정렬했습니다. 행을 클릭하면 해당
        도시의 상세 페이지로 이동합니다.
      </p>
    </BaseDashboardCard>

    <p v-if="isLoading && !budgetPlan.length" class="guide">실시간 날씨를 불러오는 중입니다...</p>

    <BaseDashboardCard v-if="budgetPlan.length">
      <table class="summary-table">
        <thead>
          <tr>
            <th>도시</th>
            <th>등급</th>
            <th>점수</th>
            <th>점유율</th>
            <th>예산</th>
            <th>우선순위</th>
            <th>세그먼트</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in budgetPlan" :key="item.id" @click="goDetail(item)">
            <td>{{ item.name }}</td>
            <td>{{ item.code }}</td>
            <td>{{ item.grade.score }}</td>
            <td>{{ item.share }}%</td>
            <td>{{ item.budget }}만원</td>
            <td>
              <span class="badge priority" :class="`p-${item.priority}`">{{ item.priority }}</span>
            </td>
            <td>{{ item.segment.label }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>합계</td>
            <td>-</td>
            <td>{{ totalScore }}</td>
            <td>{{ totalShare }}%</td>
            <td>{{ totalBudget }}만원</td>
            <td>-</td>
            <td>{{ budgetPlan.length }}개 도시</td>
          </tr>
        </tfoot>
      </table>
      <p class="guide">
        도시별 점유율을 각각 반올림해서 더하기 때문에 합계가 100%에서 1~2% 어긋날 수 있습니다.
      </p>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.budget-input {
  width: 100px;
  padding: 8px;
  font-size: 14px;
  /* 회계 표기: 금액 입력란은 우측 정렬하고 자릿수를 등폭으로 맞춘다 */
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.preset {
  margin-left: 8px;
}
.preset button {
  margin-right: 4px;
}
.guide {
  font-size: 13px;
  color: #868e96;
  margin: 8px 0 0;
}
.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  /* 회계 표기: 자릿수가 세로로 맞도록 등폭 숫자를 쓴다 */
  font-variant-numeric: tabular-nums;
}
/* 회계 표기: 수량/비율/금액 열은 우측 정렬 (3.점수 4.점유율 5.예산) */
.summary-table th:nth-child(3),
.summary-table th:nth-child(4),
.summary-table th:nth-child(5),
.summary-table td:nth-child(3),
.summary-table td:nth-child(4),
.summary-table td:nth-child(5) {
  text-align: right;
}
.summary-table th,
.summary-table td {
  padding: 10px 8px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}
.summary-table th {
  background: #f1f3f5;
  color: #495057;
  font-weight: 600;
}
.summary-table tbody tr {
  cursor: pointer;
}
.summary-table tbody tr:hover {
  background: #f8f9fa;
}
/* 회계 표기: 합계 행 위는 이중선으로 구분한다 */
.summary-table tfoot td {
  font-weight: bold;
  border-bottom: none;
  border-top: 3px double #495057;
}
.badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  color: #fff;
}
.p-A {
  background-color: #d63031;
}
.p-B {
  background-color: #e17055;
}
.p-C {
  background-color: #b2bec3;
}
</style>
