<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 잘못 들어온 주소는 히스토리에 남길 필요가 없어서 replace로 되돌린다.
const goHome = () => {
  router.replace('/')
}
</script>

<template>
  <div class="practice-section not-found-page">
    <p class="emoji">🌤️❓</p>
    <h2>페이지를 찾을 수 없습니다.</h2>
    <p>요청하신 주소가 존재하지 않거나,</p>
    <p>아직 개발되지 않았습니다.</p>
    <button class="btn-external" @click="goHome">날씨 메인으로 이동</button>
  </div>
</template>

<style scoped>
.not-found-page {
  text-align: center;
  padding: 40px 20px;
}
.not-found-page h2 {
  border-bottom: none;
}
.emoji {
  font-size: 3rem;
  margin: 0;
}
</style>
