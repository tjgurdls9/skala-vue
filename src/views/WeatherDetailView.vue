<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'
import { useConfigStore } from '../stores/configStore.js'
import {
  findCity,
  gradeCity,
  findWeakest,
  GRADE_STANDARD,
  MAX_SCORE,
  HIGH_SCORE,
  MID_SCORE,
} from '../data/weatherMock.js'
import { fetchCityWeather } from '../data/weatherApi.js'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const city = ref(null)
const isLoading = ref(false)
const notFound = ref(false)

// 동적 세그먼트 /weather/:cityId 로 들어온 도시 코드로 Mount 시점에 등록된 도시인지 먼저 확인하고
// 실시간 날씨를 조회해 등급까지 매긴다. (교재 224p try/catch/finally 패턴)
onMounted(async () => {
  const registered = findCity(route.params.cityId)
  if (!registered) {
    notFound.value = true
    return
  }

  isLoading.value = true
  try {
    const live = await fetchCityWeather(registered)
    city.value = gradeCity(live)
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    alert('날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부나 주소를 확인하세요.')
  } finally {
    isLoading.value = false
  }
})

// 과제 5: 전역 단위 설정에 맞춰 표시용 기온을 계산한다.
const displayTemp = computed(() => {
  if (!city.value) return 0
  const rawTemp = city.value.temp // 기본 원본 데이터는 섭씨 숫자
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
})

// 과제 3에서 window.alert()로 쏟아내던 해설을 페이지 본문으로 옮겼다.
const weakest = computed(() => (city.value ? findWeakest(city.value.grade) : null))

const meaning = computed(() => {
  if (!city.value) return ''
  const score = city.value.grade.score
  if (score >= HIGH_SCORE)
    return '세 지표 모두 적정해서 어떤 방식이든 성과를 기대할 수 있습니다. 예산을 몰아줄 후보입니다.'
  if (score >= MID_SCORE) return '병목인 지표가 있어 집행 방식을 가려서 골라야 합니다.'
  return '약한 지표 탓에 예산 효율이 낮습니다. 최소한으로 유지하고 다른 도시에 더 투자하는 것을 제안합니다.'
})

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<template>
  <div class="practice-section">
    <h2>📊 지역별 상세 기상 관측 정보</h2>

    <p v-if="isLoading" class="loading">실시간 날씨를 불러오는 중입니다...</p>

    <div v-if="city">
      <BaseDashboardCard>
        <p class="region">📍 지정 지역: {{ city.region }}</p>
        <p>실시간 기온: {{ displayTemp }}{{ configStore.unitSymbol }}</p>
        <p>기상 현황: {{ city.status }}</p>
        <p>대기 습도: {{ city.humidity }}%</p>
        <p>미세먼지: {{ city.microdust }}</p>
        <p>현재 풍속: {{ city.wind }}m/s</p>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <h3>🎯 등급 판정</h3>
        <p>
          기온 {{ city.temp }}도 → {{ city.grade.temp }}등급 ({{ GRADE_STANDARD.temp.bestMin }}~{{
            GRADE_STANDARD.temp.bestMax
          }}도면 3등급)
        </p>
        <p>
          습도 {{ city.humidity }}% → {{ city.grade.humidity }}등급 ({{
            GRADE_STANDARD.humidity.bestMin
          }}~{{ GRADE_STANDARD.humidity.bestMax }}%면 3등급)
        </p>
        <p>
          미세먼지 {{ city.microdust }} → {{ city.grade.dust }}등급 ({{ GRADE_STANDARD.dust.best }}
          미만이면 3등급)
        </p>

        <h3>🧮 집행 점수</h3>
        <p>
          {{ city.grade.temp }} × {{ city.grade.humidity }} × {{ city.grade.dust }} =
          <strong>{{ city.grade.score }}점</strong> (최고 {{ MAX_SCORE }}점)
        </p>
        <p>
          가장 낮은 등급은 <strong>{{ weakest.name }}({{ weakest.lowest }}등급)</strong>입니다. 이
          지점이 병목입니다.
        </p>
        <p>→ {{ meaning }}</p>
      </BaseDashboardCard>

      <BaseDashboardCard v-if="route.query.share">
        <h3>💰 예산 편성</h3>
        <p>이 도시의 몫: {{ route.query.share }}%</p>
        <p>배정 예산: {{ route.query.budget }}만원</p>
        <p>우선순위: {{ route.query.priority }}</p>
        <p class="footnote">
          목록 화면에서 검색으로 도시를 필터링하면 총합계가 바뀌므로 이 값도 다시 계산됩니다.
        </p>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <h3>🚩 실행안</h3>
        <p class="segment-label">{{ city.segment.label }}</p>
        <p>{{ city.segment.plan }}</p>
      </BaseDashboardCard>
    </div>

    <BaseDashboardCard v-else-if="notFound">
      <p class="not-found">'{{ route.params.cityId }}'에 해당하는 도시 정보가 없습니다. 🥲</p>
    </BaseDashboardCard>

    <div class="detail-actions">
      <button class="btn-external" @click="goHome">← 메인 대시보드로 돌아가기</button>
      <button @click="goBack">이전 화면으로</button>
    </div>
  </div>
</template>

<style scoped>
.region {
  font-weight: bold;
}
.segment-label {
  font-weight: bold;
  color: #00b894;
}
.footnote {
  font-size: 13px;
  color: #868e96;
}
.loading {
  text-align: center;
  color: #868e96;
  padding: 12px 0;
}
.not-found {
  text-align: center;
  color: #868e96;
  padding: 12px 0;
}
.detail-actions {
  display: flex;
  gap: 10px;
}
</style>
