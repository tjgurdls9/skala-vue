<script setup>
import { useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import WeatherDeskIcon from '../components/WeatherDeskIcon.vue'

const router = useRouter()

// 잘못 들어온 주소는 히스토리에 남길 필요가 없어서 replace로 되돌린다.
const goHome = () => {
  router.replace('/dashboard')
}
</script>

<template>
  <!-- 8차: 문자 이모지 + 가운데 정렬 문단 3줄이었다. 이모지는 이미 앱 전체에서 아이콘으로
       걷어낸 요소고, "가운데 정렬 본문"은 apple-design 스킬이 명시한 안티패턴이라 둘 다 고친다.
       화면 하나를 꽉 채우던 빈 카드도 내용에 맞는 크기로 줄였다. -->
  <div class="notfound-page">
    <section class="notfound-card">
      <WeatherDeskIcon name="location" class="notfound-icon" />
      <h2 class="notfound-title">페이지를 찾을 수 없습니다</h2>
      <p class="notfound-text">
        요청하신 주소가 존재하지 않거나 아직 개발되지 않았습니다. 주소를 확인해 주시기 바랍니다.
      </p>
      <el-button type="primary" :icon="Back" @click="goHome">날씨 대시보드로 이동</el-button>
    </section>
  </div>
</template>

<style scoped>
.notfound-page {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 40px;
}
.notfound-card {
  width: 100%;
  max-width: 460px;
  padding: 32px 34px;
  border-radius: var(--radius-card);
  background-color: var(--glass-bg-strong);
  background-image: var(--glass-sheen);
  -webkit-backdrop-filter: var(--glass-surface);
  backdrop-filter: var(--glass-surface);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass-raised);
}
.notfound-icon {
  width: 56px;
  height: 56px;
}
.notfound-title {
  margin: 12px 0 0;
  font-size: 22px;
  font-weight: 700;
  color: #1c1c1e;
  border-bottom: none;
  padding-bottom: 0;
}
/* 스킬 안티패턴: 본문 가운데 정렬 금지(제목만 허용) — 왼쪽 정렬로 둔다 */
.notfound-text {
  margin: 8px 0 20px;
  font-size: 14px;
  line-height: 1.6;
  color: #48484f;
}
</style>
