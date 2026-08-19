<script setup>
import { ref } from 'vue'

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 68, microdust: 55 },
  { id: 'city_02', name: '광주', temp: 27, status: '비', humidity: 82, microdust: 20 },
  { id: 'city_03', name: '울산', temp: 29, status: '맑음', humidity: 45, microdust: 88 },
  { id: 'city_04', name: '수원', temp: 24, status: '비', humidity: 75, microdust: 33 },
  { id: 'city_05', name: '부산', temp: 26, status: '흐림', humidity: 35, microdust: 42 },
])

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="practice-section">
    <h2>⛅️과제 1: 날씨 (Mockup)</h2>
    <div class="dashboard-wrapper">
      <section class="search-box">
        <h3>🔍 도시 검색</h3>
        <input
          type="text"
          :value="searchQuery"
          @input="(e) => (searchQuery = e.target.value)"
          placeholder="검색할 도시 이름 입력"
        />
        <p>
          검색 중인 도시: <strong>{{ searchQuery }}</strong>
        </p>
      </section>

      <section class="list-box">
        <h3>🏙️ 지역별 날씨 현황</h3>

        <div
          v-for="item in weatherList"
          :key="item.id"
          class="weather-card"
          @click="selectedCityInfo = `${item.name}이 선택되었습니다.`"
        >
          <h4>{{ item.name }} ({{ item.status }})</h4>
          <p>현재 기온: {{ item.temp }}°C</p>
          <p>현재 습도: {{ item.humidity }}%</p>
          <p>미세먼지수치: {{ item.microdust }}</p>

          <span v-if="item.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
          <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

          <span v-if="item.humidity >= 60" class="badge humid">🌫️ 습함 (60% 이상)</span>
          <span v-else-if="item.humidity >= 40" class="badge good">🍀 상쾌함 (40~59%)</span>
          <span v-else class="badge dry">🌵 건조함 (40% 미만)</span>

          <span v-if="item.microdust >= 50" class="badge bad">😷 나쁨 (50 이상)</span>
          <span v-else class="badge fine">😀 좋음 (50 미만)</span>

          <button class="btn-detail" @click.stop="showDetail(item.name, item.status)">
            상세보기
          </button>
        </div>
      </section>

      <div class="status-bar">
        {{ selectedCityInfo }}
      </div>
    </div>
  </div>
</template>

<style>
@import '@/assets/exercise.css';
</style>

<style scoped>
/* exercise.css의 600px 고정폭/중앙정렬 해제 - 다른 실습 컴포넌트와 폭 맞춤 */
.dashboard-wrapper {
  width: auto;
  margin: 0;
}
.badge {
  margin: 0 4px 4px 0;
}
.humid {
  background-color: #a4b0be;
}
.good {
  background-color: #a8d879;
}
.dry {
  background-color: #ffbf75;
}
.bad {
  background-color: #a29bfe;
}
.fine {
  background-color: #fd79a8;
}
</style>
