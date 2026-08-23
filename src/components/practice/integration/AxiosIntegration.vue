<script setup>
import { computed } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore.js'

const weatherStore = useWeatherStore()
const loadedCount = computed(() => weatherStore.list.length)
</script>

<template>
  <div class="practice-section integration-practice">
    <h2>Axios 외부 데이터 연동</h2>
    <p>
      교재 229p 실습은 별도 샘플이 아니라 WEATHER DESK의 실제 데이터 흐름에 적용했습니다.
      OpenWeatherMap의 날씨·대기질·5일 예보와 Nager.Date 공휴일 정보를 Axios로 조회합니다.
    </p>
    <dl class="integration-grid">
      <div>
        <dt>현재 로드된 관측 지점</dt>
        <dd>{{ loadedCount }}곳</dd>
      </div>
      <div>
        <dt>요청 처리</dt>
        <dd>axios.get · axios.all</dd>
      </div>
      <div>
        <dt>API 키</dt>
        <dd>VITE_OPENWEATHER_KEY</dd>
      </div>
      <div>
        <dt>적용 위치</dt>
        <dd>weatherApi.js · weatherStore.js</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.integration-practice p {
  margin: 0 0 16px;
  color: #4e5968;
}
.integration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin: 0;
}
.integration-grid div {
  padding: 14px;
  border: 1px solid rgba(28, 32, 56, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.42);
}
.integration-grid dt {
  margin-bottom: 5px;
  font-size: 12px;
  color: #6b7684;
}
.integration-grid dd {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #191f28;
}
</style>
