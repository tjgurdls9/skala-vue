<script setup>
import { RouterLink, RouterView } from 'vue-router'
import UnitToggler from './components/weather/UnitToggler.vue'
</script>

<template>
  <div class="app-container">
    <h1>⛅ 종합실습 5: 스토어적용</h1>
    <hr />

    <nav class="navigation-bar">
      <div class="nav-links">
        <RouterLink to="/" class="nav-item">🌤️ 날씨 대시보드</RouterLink>
        <span class="divider">|</span>
        <RouterLink to="/about" class="nav-item">ℹ️ 서비스 소개</RouterLink>
        <span class="divider">|</span>
        <RouterLink to="/summary" class="nav-item">📋 지표 요약</RouterLink>
        <span class="divider">|</span>
        <RouterLink to="/practice" class="nav-item">🧪 단원별 실습</RouterLink>
      </div>

      <UnitToggler />
    </nav>

    <RouterView />
  </div>
</template>

<style>
@import '@/assets/practice.css';
@import '@/assets/exercise.css';
</style>

<style scoped>
/* exercise.css의 .app-container는 max-width 900px, margin: 40px 10px 이라 좁고 좌측에 붙는다.
   practice.css의 div.practice-container가 쓰는 max-width(1200px)를 따와서 넓히고 가운데로 옮긴다. */
.app-container {
  max-width: 1200px;
  margin: 40px auto;
}

/* exercise.css의 .navigation-bar는 justify-content: center 다.
   링크는 가운데 두고 단위 토글만 오른쪽 끝으로 밀기 위해 space-between으로 덮는다. */
.navigation-bar {
  justify-content: space-between;
  /* 링크 묶음과 단위 토글이 붙지 않도록 최소 간격을 준다 */
  gap: 24px;
  flex-wrap: wrap;
}
.nav-links {
  display: flex;
  align-items: center;
}
</style>
