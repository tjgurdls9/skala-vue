<script setup>
import { RouterView, useRoute } from 'vue-router'
import UnitToggler from './components/weather/UnitToggler.vue'
import { House, DataAnalysis, MagicStick } from '@element-plus/icons-vue'
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

// 12차: 여기 있던 pointermove 추적(커서 위치를 --px/--py로 흘려보내던 것)은 지웠다.
// 그걸 쓰던 분광·스페큘러 레이어를 전부 걷어냈기 때문이다 — 호버 반응은 이제 순수 CSS로
// 유리 자체의 투명도·채도·높이만 바꾼다(base.css '유리 표면의 호버 반응' 참고).
</script>

<template>
  <!-- 12차: 6차에 넣었던 feTurbulence + feDisplacementMap 굴절 필터를 걷어냈다.
       난수 결로 배경을 밀어내는 방식이라, 배경이 구름 사진인 우리 화면에서는 밝은 구름이
       실처럼 늘어지며 '대리석 무늬'가 됐다 — 실제로 그렇게 보인다는 지적을 받았다.
       주름유리(왜곡 유리)의 표현이지 리퀴드 글라스의 표현이 아니다.
       지금은 균질한 블러(--glass-surface) + 가장자리 렌즈 띠 + 스페큘러/분광으로 간다.
       자세한 이유는 base.css의 --glass-surface 주석 참고. -->

  <!-- 뷰포트 전체를 덮는 고정 배경. 히어로 안에 갇혀 있던 "지금 날씨"를 앱 전체로 끌어올렸다.
       13차: 지금까지 한 장짜리 div의 클래스만 바꿔 끼웠다. .weather-scene에 걸어둔
       `transition: background-image 1s`는 background-image가 보간되지 않는 속성이라
       실제로는 아무 일도 하지 않았고, 지역을 바꾸면 하늘이 그냥 툭 갈아끼워졌다.
       테마를 key로 준 요소를 Transition으로 감싸면 새 사진이 들어오는 동안 옛 사진이
       남아 있어 두 장이 겹치고, 불투명도만 교차시키면 진짜 크로스페이드가 된다. -->
  <Transition name="scene-fade">
    <div
      :key="weatherThemeStore.theme"
      class="app-backdrop-layer weather-scene"
      :class="`weather-${weatherThemeStore.theme}`"
    ></div>
  </Transition>

  <div class="app-container">
    <header class="brand">
      <h1 class="wordmark">
        <span class="wordmark-thin">WEATHER</span><span class="wordmark-bold">DESK</span
        ><span class="wordmark-dot">.</span>
      </h1>
      <p class="brand-sub">기상 데이터를 전사 경영 판단으로 번역합니다</p>
      <span class="brand-badge">종합실습 5 · 스토어적용</span>
    </header>

    <nav class="navigation-bar">
      <!-- 교재 249p: 네비게이션을 Element Plus el-menu(router 모드)로 교체.
           index를 라우트 path로 주면 클릭 시 router가 알아서 push한다. -->
      <el-menu
        :default-active="route.path"
        mode="horizontal"
        router
        background-color="transparent"
        text-color="#7f8c8d"
        active-text-color="#ffffff"
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

/* --- 13차: 브랜드 ------------------------------------------------------
   이미지 자산도 웹폰트도 쓰지 않는다. 로고는 굵기 대비 하나로 만든다 —
   WEATHER는 얇게, DESK는 굵게, 그리고 마침표 하나.
   사진 배경 위에 유리 없이 얹히므로 흰 글자 + halo(--text-on-photo)가 필요하다. */
.brand {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-bottom: 22px;
}
.wordmark {
  margin: 0;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #191f28;
  white-space: nowrap;
}
.wordmark-thin {
  font-weight: 300;
  color: #8b95a1;
}
.wordmark-bold {
  font-weight: 800;
}
/* 로고의 유일한 도형 요소. 마침표 하나가 '문장을 끝맺는' 인상을 준다 */
.wordmark-dot {
  color: var(--color-accent);
  font-weight: 800;
  margin-left: 1px;
}
.brand-sub {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #8b95a1;
}
/* 과제 식별자는 지우지 않되, 서비스 이름보다 뒤로 물린다 */
.brand-badge {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef1f4;
  font-size: 12px;
  font-weight: 600;
  color: #8b95a1;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .wordmark {
    font-size: 26px;
  }
  .brand-badge {
    margin-left: 0;
  }
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
  /* 13차-e: 배경이 단색이라 블러할 대상이 없다. 흰 카드 + 헤어라인으로 충분하다. */
  background: #ffffff;
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}

/* el-menu 기본 스타일(하단 보더, 흰 배경 강제)이 유리 내비 필과 부딪혀서 걷어낸다 */
.nav-menu {
  border-bottom: none !important;
  /* 바가 내용 너비가 됐으므로 메뉴도 늘어나면 안 된다(늘어나면 다시 빈 공간이 생긴다) */
  flex: 0 0 auto;
  /* 12차: 탭 글씨가 유리 상단에 밀착돼 보이던 진짜 원인.
     el-menu는 가로 모드에서 높이를 60px로 고정하는데(--el-menu-horizontal-height),
     그 안의 항목은 40px짜리로 위쪽에 붙는다 — 결과적으로 글씨 위 9px / 아래 29px이
     됐다. 11차에 바의 padding을 8px로 맞췄는데도 안 고쳐진 게 이 20px 때문이었다.
     메뉴 높이를 항목 높이와 같게 맞추면 항목이 바 한가운데에 온다. */
  --el-menu-horizontal-height: 40px;
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
  /* 13차: '선택됨'을 단위 토글과 같은 방식으로 — 강조색으로 채우고 글자는 흰색.
     여기서 한 번 걸렸다: el-menu의 active-text-color가 파랑이라, 배경을 파랑으로 채우자
     파랑 글자가 파랑 위에 얹혀 탭 이름이 통째로 사라졌다. 그래서 그 prop도 흰색으로 바꿨다. */
  background-color: var(--control-bg-on);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 2px 8px rgba(28, 32, 56, 0.1);
}

/* 배경 크로스페이드. 나가는 사진과 들어오는 사진이 같은 자리에 겹쳐야 하므로
   둘 다 position: fixed(.app-backdrop-layer)인 점을 그대로 이용한다.
   들어오는 쪽을 조금 더 길게(1.1s) 잡아 중간에 배경이 옅어지는 구간이 생기지 않게 한다. */
.scene-fade-enter-active {
  transition: opacity 1.1s var(--apple-ease);
}
.scene-fade-leave-active {
  transition: opacity 0.9s var(--apple-ease);
}
.scene-fade-enter-from,
.scene-fade-leave-to {
  opacity: 0;
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
