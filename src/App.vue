<script setup>
import { RouterView, useRoute } from 'vue-router'
import UnitToggler from './components/weather/UnitToggler.vue'
import { Cloudy, House, DataAnalysis, MagicStick } from '@element-plus/icons-vue'
import { useWeatherThemeStore } from './stores/weatherThemeStore.js'
import { useWeatherStore } from './stores/weatherStore.js'

// el-menu의 default-active를 현재 경로와 맞춰야 새로고침해도 활성 탭이 맞게 표시된다
const route = useRoute()

// 6차: 앱 전체 배경이 지금 날씨를 따라간다.
// 11차: 계산 주체가 WeatherHomeView에서 weatherThemeStore로 옮겨졌다. 배경은 이제 어느 탭에
// 있든 "지금 보고 있는 지역"의 실제 날씨를 따른다.
const weatherThemeStore = useWeatherThemeStore()

// 배경이 앱 전체 것이 된 이상, 그 근거 데이터를 부르는 것도 앱의 몫이다. 대시보드에서만 부르면
// /practice처럼 날씨를 안 쓰는 탭으로 새로고침해 들어왔을 때 배경이 기본값(맑음)으로 굳는다.
// load()는 스토어에서 캐시되므로 각 화면이 또 불러도 중복 요청이 되지 않는다.
useWeatherStore().load()
</script>

<template>
  <!-- 6차: 굴절 유리 효과 전용 SVG 필터. 문서에 한 번만 있으면 되고, CSS에서
       backdrop-filter: url(#glass-refraction) 로 어디서든 참조해서 쓴다. -->
  <svg class="filter-defs" aria-hidden="true">
    <filter id="glass-refraction" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.01 0.015"
        numOctaves="2"
        seed="7"
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="34"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>

  <!-- 뷰포트 전체를 덮는 고정 배경. 히어로 안에 갇혀 있던 "지금 날씨"를 앱 전체로 끌어올렸다 -->
  <div class="app-backdrop-layer weather-scene" :class="`weather-${weatherThemeStore.theme}`"></div>

  <div class="app-container">
    <h1>
      <el-icon><Cloudy /></el-icon> 종합실습 5: 스토어적용
    </h1>
    <hr />

    <nav class="navigation-bar">
      <!-- 교재 249p: 네비게이션을 Element Plus el-menu(router 모드)로 교체.
           index를 라우트 path로 주면 클릭 시 router가 알아서 push한다. -->
      <el-menu
        :default-active="route.path"
        mode="horizontal"
        router
        background-color="transparent"
        text-color="#7f8c8d"
        active-text-color="var(--color-accent)"
        :ellipsis="false"
        class="nav-menu"
      >
        <el-menu-item index="/"
          ><el-icon><House /></el-icon> 날씨 대시보드</el-menu-item
        >
        <el-menu-item index="/summary"
          ><el-icon><DataAnalysis /></el-icon> 지표 요약</el-menu-item
        >
        <el-menu-item index="/practice"
          ><el-icon><MagicStick /></el-icon> 실습 아카이브</el-menu-item
        >
      </el-menu>

      <UnitToggler />
    </nav>

    <!-- 7차: 모든 라우트가 동적 import(코드 스플리팅)라, 탭을 옮기면 이전 화면이 사라지고
         다음 청크가 로드될 때까지 잠깐 RouterView가 비어 있다 — 그 순간 높이가 0으로
         꺼졌다가 로드되면서 다시 튀어 올라 "창 전체가 들썩인다". 최소 높이로 그 구간의
         붕괴를 막고, 급작스러운 교체 대신 부드러운 크로스페이드로 전환한다. -->
    <main class="route-stage">
      <RouterView v-slot="{ Component }">
        <Transition name="route-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style>
@import '@/assets/practice.css';
@import '@/assets/exercise.css';
</style>

<style scoped>
/* SVG 필터 정의는 화면에 아무것도 안 그린다 — 0크기로 숨겨서 레이아웃에서 완전히 뺀다 */
.filter-defs {
  position: absolute;
  width: 0;
  height: 0;
}

.app-backdrop-layer {
  position: fixed;
  inset: 0;
  z-index: -1;
}

/* exercise.css의 .app-container는 max-width 900px, margin: 40px 10px 이라 좁고 좌측에 붙는다.
   6차: "좌우가 비어있다, 웹사이트답게 넓게 써라"는 지적으로 1200px → 1440px로 더 넓혔다.
   8차: 이제 /practice(실습 아카이브)도 practice.css의 800px 제한을 걷어내서 이 폭을 그대로
   따른다 — 앱 전체가 한 가지 폭으로 통일됐다. */
.app-container {
  max-width: 1440px;
  margin: 40px auto;
  padding: 0 24px;
}

/* 6차: h1은 유리 카드 밖, 사진 배경에 직접 얹혀 있다. exercise.css 전역 h1이 다크 텍스트(#1c1c1e)로
   고정해놔서 비/눈처럼 어두운 배경에서는 거의 안 보였다 — 실제로 확인한 가독성 버그.
   흰 글자 + 진한 그림자 조합은 밝은 하늘/어두운 폭풍 배경 양쪽에서 다 읽힌다. */
.app-container h1 {
  color: #f5f5f7;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 2px 14px rgba(0, 0, 0, 0.35);
}
.app-container hr {
  border-color: rgba(255, 255, 255, 0.4);
}

/* exercise.css의 .navigation-bar는 justify-content: center 다.
   메뉴는 왼쪽에 두고 단위 토글만 오른쪽 끝으로 밀기 위해 space-between으로 덮는다. */
.navigation-bar {
  /* 11차: 1440px 전폭 바에 항목이 3개뿐이라 가운데가 크게 비어 있었다.
     참고 사이트들(RUNNING WEATHER, SKALA Weather)처럼 내용 너비만 차지하는 바로 줄이고
     가운데 정렬한다 — 빈 공간이 사라지고 탭 묶음이 하나의 덩어리로 읽힌다. */
  width: fit-content;
  max-width: 100%;
  margin: 0 auto 24px;
  justify-content: center;
  /* 메뉴와 단위 토글이 붙지 않도록 최소 간격을 준다 */
  gap: 16px;
  flex-wrap: wrap;
  /* 11차: 위쪽 padding이 4px뿐이라 탭 글자가 유리 상단에 밀착돼 있었고, 대신 아래로는
     여백이 남아 위아래가 안 맞았다. 상하를 같게 주고(8px) 좌우를 조금 넓혀 균형을 잡는다. */
  padding: 8px 12px;
  /* 6차: 굴절 유리로. blur를 세게 걸면 굴절이 뭉개져서 --glass-refract-blur(약한 블러)를 쓴다 */
  backdrop-filter: url(#glass-refraction) var(--glass-refract-blur);
  -webkit-backdrop-filter: url(#glass-refraction) var(--glass-refract-blur);
}

/* el-menu 기본 스타일(하단 보더, 흰 배경 강제)이 유리 내비 필과 부딪혀서 걷어낸다 */
.nav-menu {
  border-bottom: none !important;
  /* 바가 내용 너비가 됐으므로 메뉴도 늘어나면 안 된다(늘어나면 다시 빈 공간이 생긴다) */
  flex: 0 0 auto;
}
.nav-menu :deep(.el-menu-item) {
  border-bottom: none;
  font-weight: bold;
  font-size: 16px;
  /* 알약 대신 둥근 사각형 — macOS 사이드바/탭 선택 표시가 실제로 이렇다 */
  border-radius: 10px;
  height: 40px;
  line-height: 40px;
}
.nav-menu :deep(.el-menu-item.is-active) {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 8px rgba(28, 32, 56, 0.12);
}

/* 라우트 전환 중 청크 로딩 공백에도 화면이 0으로 꺼지지 않도록 최소 높이를 잡아둔다 */
.route-stage {
  min-height: 80vh;
}
.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity 0.18s var(--apple-ease);
}
.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
}
</style>
