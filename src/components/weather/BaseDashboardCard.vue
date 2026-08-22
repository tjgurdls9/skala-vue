<template>
  <!-- 교재 249p: 대시보드 카드를 Element Plus el-card로 전면 교체 -->
  <el-card class="base-dashboard-card" shadow="hover">
    <slot></slot>
  </el-card>
</template>

<style scoped>
/* 6차: WeatherCard.vue와 같은 이유로 el-card 기본 불투명 배경을 유리 토큰으로 되돌린다.
   실제 굴절(App.vue의 #glass-refraction)을 쓰므로 blur는 --glass-refract-blur(약하게)로. */
.base-dashboard-card {
  margin-bottom: 15px;
  border-radius: var(--radius-card);
  background-color: var(--glass-bg);
  background-image: var(--glass-sheen);
  -webkit-backdrop-filter: url(#glass-refraction) var(--glass-refract-blur);
  backdrop-filter: url(#glass-refraction) var(--glass-refract-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}
.base-dashboard-card :deep(.el-card__body) {
  background: transparent;
}
</style>
