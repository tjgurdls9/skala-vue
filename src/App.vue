<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import UnitToggler from './components/weather/UnitToggler.vue'
import { House, DataAnalysis, MagicStick, Tools } from '@element-plus/icons-vue'
import { useWeatherStore } from './stores/weatherStore.js'

// el-menu의 default-active를 현재 경로와 맞춰야 새로고침해도 활성 탭이 맞게 표시된다
const route = useRoute()

// 13차-n: 배경이 날씨를 따라가지 않게 되면서 App은 테마 스토어를 더 쓰지 않는다.
// (스토어는 남는다 — 콕핏 배지의 날씨 아이콘이 읽는다.)
// 날씨 데이터는 여전히 앱의 몫으로 부른다. 대시보드에서만 부르면
// /practice처럼 날씨를 안 쓰는 탭으로 새로고침해 들어왔을 때 배경이 기본값(맑음)으로 굳는다.
// load()는 스토어에서 캐시되므로 각 화면이 또 불러도 중복 요청이 되지 않는다.
useWeatherStore().load()

// --- 13차-j: 리퀴드 글래스 (2) 반사 ---------------------------------------
// 애플의 리퀴드 글래스는 기기를 기울이면 스페큘러가 움직인다. 웹에는 기울기가 없으므로
// 커서를 가상 광원으로 삼는다 — 커서가 카드의 어느 쪽에 있느냐를 각도로 바꿔서
// 모서리를 도는 conic 그라디언트(--lightangle)를 회전시킨다.
//
// 12차에도 커서 추적을 붙였다가 지웠는데, 그때는 판 한가운데에 흰 원을 그려서
// '원형 그라디언트를 덧댄 티'가 났다. 이번엔 빛이 모서리 링을 따라 돌기만 한다.
// base.css의 유리 판 목록과 같은 목록이어야 한다 — 여기서 빠지면 그 판만 빛이 안 돈다.
const GLASS_SELECTOR =
  '.base-dashboard-card, .weather-card, .navigation-bar, .about-card, ' +
  '.notfound-card, .detail-hero, .hero-glass, .lab-index, .lab-note-list, .practice-section, ' +
  '.trouble-index, .trouble-detail'
let rafId = 0
let pending = null
// 13차-l: atan2는 ±180도에서 값이 튄다. 각도에 전환이 걸린 지금은 그 순간
// 빛이 카드를 한 바퀴 돌아버리므로, 직전 각도에서 가장 가까운 표현으로 이어붙인다.
// (예: 179도 -> -179도가 아니라 181도로 준다.)
const lastAngle = new WeakMap()

const flush = () => {
  rafId = 0
  if (!pending) return
  const { card, angle } = pending
  pending = null
  // 13차-q: 그림자 오프셋(--lx/--ly) 갱신을 걷었다. 링(conic-gradient, 블러 없음)만
  // 커서를 따라 돈다 — 그림자(블러 40px)는 base.css에서 고정 광원 기준 상수로 바뀌었다.
  card.style.setProperty('--lightangle', `${angle}deg`)
}

const onPointerMove = (event) => {
  const card = event.target.closest?.(GLASS_SELECTOR)
  if (!card) return
  const r = card.getBoundingClientRect()
  // 카드 중심에서 커서로 향하는 방향 = 광원이 있는 쪽
  const dx = event.clientX - (r.left + r.width / 2)
  const dy = event.clientY - (r.top + r.height / 2)
  const raw = Math.round((Math.atan2(dy, dx) * 180) / Math.PI) + 90
  const prev = lastAngle.get(card)
  const angle = prev === undefined ? raw : prev + ((((raw - prev) % 360) + 540) % 360) - 180
  lastAngle.set(card, angle)
  pending = { card, angle }
  if (!rafId) rafId = requestAnimationFrame(flush)
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <!-- 12차: 6차에 넣었던 feTurbulence + feDisplacementMap 굴절 필터를 걷어냈다.
       난수 결로 배경을 밀어내는 방식이라, 배경이 구름 사진인 우리 화면에서는 밝은 구름이
       실처럼 늘어지며 '대리석 무늬'가 됐다 — 실제로 그렇게 보인다는 지적을 받았다.
       주름유리(왜곡 유리)의 표현이지 리퀴드 글라스의 표현이 아니다.
       지금은 균질한 블러(--glass-surface) + 가장자리 렌즈 띠 + 스페큘러/분광으로 간다.
       자세한 이유는 base.css의 --glass-surface 주석 참고. -->

  <!-- 리퀴드 글래스의 굴절. 변위 맵은 R=가로 램프, G=세로 램프다.
       feDisplacementMap은 (채널값/255 - 0.5)만큼 픽셀을 민다 — 램프를 깔면 중앙(0.5)은 0,
       왼쪽 끝은 왼쪽으로, 오른쪽 끝은 오른쪽으로 밀린다. 즉 판 전체가 바깥으로 벌어지는
       볼록 렌즈다. 램프는 연속이라 잘라낸 경계가 없다(6차·7차의 실패가 그 두 가지였다).

       13차-n: 여기에 두 가지를 더했다.
       (1) 표면의 요철 — 진짜 유리는 표면이 평평하지 않아 굴절이 일정하지 않다.
           낮은 주파수 노이즈를 램프에 '섞어' 굴절량을 자리마다 흔든다.
           6차에 노이즈만 써서 대리석이 됐던 것과 다르다: 여기서는 램프가 주(85%)고
           노이즈는 흔들기(25%)이며, 배경도 매끈한 그라디언트라 결이 아니라 물결로 읽힌다.
       (2) 프리즘 — 파장마다 굴절률이 다르다. 같은 맵으로 R/G/B를 서로 다른 세기로 밀고
           채널만 뽑아 다시 합친다. 변위는 가장자리로 갈수록 커지므로 색 분리도 가장자리에서만
           커진다 — 실제 렌즈와 같은 원리라 '덧칠한 무지개'로 안 보인다.
           (12차에 뺐던 분광은 유리 '위에' 색을 얹는 방식이라 얹은 티가 났던 것이다.) -->
  <svg class="filter-defs" aria-hidden="true">
    <filter
      id="lg-refract"
      x="-14%"
      y="-14%"
      width="128%"
      height="128%"
      color-interpolation-filters="sRGB"
    >
      <feImage
        href="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cdefs%3E%3ClinearGradient id='r' x1='0' y1='0' x2='1' y2='0'%3E%3Cstop offset='0' stop-color='rgb(0,128,0)'/%3E%3Cstop offset='1' stop-color='rgb(255,128,0)'/%3E%3C/linearGradient%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='rgb(0,0,0)'/%3E%3Cstop offset='1' stop-color='rgb(0,255,0)'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='120' fill='url(%23r)'/%3E%3Crect width='120' height='120' fill='url(%23g)' style='mix-blend-mode:screen'/%3E%3C/svg%3E"
        preserveAspectRatio="none"
        result="ramp"
      />

      <!-- 표면의 요철. baseFrequency가 낮을수록 넓고 완만한 물결이 된다 —
           높이면 곧바로 자글자글한 '결'이 되어 대리석으로 돌아간다. -->
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.009 0.013"
        numOctaves="2"
        seed="11"
        result="rawNoise"
      />
      <!-- 노이즈를 0.5 중심의 절반 진폭으로 눌러 담고 알파를 1로 채운다.
           (알파가 노이즈인 채로 두면 아래 합성이 프리멀티플라이드에서 뒤틀린다.) -->
      <feColorMatrix
        in="rawNoise"
        type="matrix"
        values="0.5 0 0 0 0.25  0 0.5 0 0 0.25  0 0 0.5 0 0.25  0 0 0 0 1"
        result="waves"
      />
      <!-- 램프 85% + 물결 25% - 0.05. 중앙이 다시 0.5가 되도록 맞춘 값이다.
           렌즈의 방향성은 유지하면서 굴절량만 흔들린다. -->
      <feComposite
        in="waves"
        in2="ramp"
        operator="arithmetic"
        k1="0"
        k2="0.25"
        k3="0.85"
        k4="-0.05"
        result="map"
      />

      <!-- 프리즘: 같은 맵, 다른 세기. 13차-p에서 3패스를 2패스로 줄였다.
           변위 패스 하나가 이 필터에서 가장 비싼 연산이라, 세 번 돌리면 상단바처럼
           작은 판에서도 호버가 버벅였다. 빨강 한 패스 + 청록 한 패스면 색수차는
           그대로 보인다(실제 렌즈도 사람 눈에는 붉은 끝과 푸른 끝으로 갈려 보인다). -->
      <feDisplacementMap
        in="SourceGraphic"
        in2="map"
        scale="44"
        xChannelSelector="R"
        yChannelSelector="G"
        result="dispWarm"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="map"
        scale="24"
        xChannelSelector="R"
        yChannelSelector="G"
        result="dispCool"
      />
      <feColorMatrix
        in="dispWarm"
        type="matrix"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
        result="onlyR"
      />
      <feColorMatrix
        in="dispCool"
        type="matrix"
        values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
        result="onlyGB"
      />
      <feBlend in="onlyR" in2="onlyGB" mode="screen" />
    </filter>
  </svg>

  <!-- 뷰포트 전체를 덮는 고정 배경.
       13차-n: 날씨별로 갈아끼우던 걸 그만뒀다(테마 제거). 갈아끼울 게 없으니
       크로스페이드용 Transition과 key도 함께 걷어낸다 — 한 장으로 고정한다. -->
  <div class="app-backdrop-layer weather-scene"></div>

  <div class="app-container">
    <header class="brand">
      <h1 class="wordmark">
        <img class="brand-mark" src="/brand/weather-desk-mark.png" alt="" />
        <span class="wordmark-thin">WEATHER</span><span class="wordmark-bold">DESK</span
        ><span class="wordmark-dot" aria-hidden="true">.</span>
      </h1>
      <p class="brand-sub">기상 데이터를 전사 경영 판단으로 번역합니다</p>
    </header>

    <nav class="navigation-bar">
      <!-- 교재 249p: 네비게이션을 Element Plus el-menu(router 모드)로 교체.
           index를 라우트 path로 주면 클릭 시 router가 알아서 push한다. -->
      <el-menu
        :default-active="route.path"
        mode="horizontal"
        router
        background-color="transparent"
        text-color="#4e5968"
        active-text-color="#ffffff"
        :ellipsis="false"
        class="nav-menu"
      >
        <el-menu-item index="/dashboard"
          ><el-icon><House /></el-icon> 날씨 대시보드</el-menu-item
        >
        <el-menu-item index="/"
          ><el-icon><DataAnalysis /></el-icon> 지표 요약</el-menu-item
        >
        <el-menu-item index="/practice"
          ><el-icon><MagicStick /></el-icon> 실습 아카이브</el-menu-item
        >
        <el-menu-item index="/troubleshooting"
          ><el-icon><Tools /></el-icon> 트러블슈팅</el-menu-item
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

/* --- 브랜드 ------------------------------------------------------------ */
.brand {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-bottom: 22px;
}
.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #f2f6fc;
  white-space: nowrap;
}
.brand-mark {
  width: 58px;
  height: 42px;
  padding: 5px;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 12px;
  background: rgba(242, 246, 252, 0.92);
  box-shadow: 0 4px 14px rgba(6, 12, 30, 0.2);
}
.wordmark-thin {
  font-weight: 300;
  color: rgba(226, 236, 250, 0.75);
}
.wordmark-bold {
  font-weight: 800;
}
.wordmark-dot {
  margin-left: -7px;
  color: #4da3ff;
  font-weight: 800;
  text-shadow: 0 0 18px rgba(77, 163, 255, 0.45);
}
.brand-sub {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: rgba(214, 226, 244, 0.78);
}
@media (max-width: 640px) {
  .wordmark {
    font-size: 26px;
    gap: 6px;
  }
  .brand-mark {
    width: 50px;
    height: 36px;
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
  /* 13차-k: 내비 바는 콘텐츠 위에 떠 있는 컨트롤 레이어 — 리퀴드 글래스가 가장 잘 맞는
     자리다(애플도 이 레이어에 쓰라고 한다). 13차-e에 흰 카드로 눌러놨던 걸 되돌리고
     공용 유리 규칙(굴절·스페큘러·유동)을 그대로 받게 한다. */
  background-color: var(--glass-tint, var(--glass-bg));
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
  /* 13차-p: 상단바는 굴절 렌즈를 쓰는 두 곳 중 하나다. 작고 떠 있는 컨트롤이라
     가장자리 띠가 면적에서 차지하는 몫이 커서 굴절이 실제로 보이고,
     넓이가 대시보드 카드의 1/24이라 비싼 SVG 필터를 감당할 수 있다. */
  -webkit-backdrop-filter: var(--glass-surface-lens);
  backdrop-filter: var(--glass-surface-lens);
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
  --el-menu-horizontal-height: 44px;
}
/* 13차-k 버그: 탭이 "호버하면 회색, 누르면 회색, 다른 곳을 클릭해야 파란색"이었다.
   원인은 Element Plus가 자기 hover 배경(--el-menu-hover-bg-color, 회색)을 우리 .is-active
   위에 덮어쓰고, 클릭 후에도 포커스가 남아 그 회색이 유지된 것이다.
   EP의 hover 색을 투명으로 꺼버리고, 상태는 우리가 전부 직접 정한다. */
.nav-menu {
  --el-menu-hover-bg-color: transparent;
}
.nav-menu :deep(.el-menu-item) {
  border-bottom: none;
  font-weight: 700;
  font-size: 16px;
  /* 알약 대신 둥근 사각형 — macOS 사이드바/탭 선택 표시가 실제로 이렇다 */
  border-radius: var(--control-radius);
  min-height: 44px;
  height: 44px;
  line-height: 44px;
  background-color: transparent !important;
  transition:
    background-color 0.2s var(--apple-ease),
    color 0.2s var(--apple-ease);
}
/* 안 눌린 탭의 호버 — 회색이 아니라 유리가 살짝 밝아지는 느낌으로 */
.nav-menu :deep(.el-menu-item:not(.is-active):hover),
.nav-menu :deep(.el-menu-item:not(.is-active):focus) {
  background-color: rgba(28, 32, 56, 0.06) !important;
  color: #1c1c1e !important;
}
/* 선택된 탭은 어떤 상태(호버·포커스·클릭)에서도 강조색을 유지한다 */
.nav-menu :deep(.el-menu-item.is-active),
.nav-menu :deep(.el-menu-item.is-active:hover),
.nav-menu :deep(.el-menu-item.is-active:focus) {
  background-color: var(--control-bg-on) !important;
  color: #ffffff !important;
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

@media (max-width: 900px) {
  .app-container {
    margin: 24px auto;
    padding: 0 16px;
  }
  .brand {
    margin-bottom: 18px;
  }
  .navigation-bar {
    width: 100%;
    justify-content: space-between;
  }
  .nav-menu {
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .nav-menu::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 640px) {
  .app-container {
    margin-top: 18px;
    padding: 0 12px;
  }
  .brand-sub {
    width: 100%;
    padding-left: 56px;
    font-size: 13px;
  }
  .navigation-bar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    padding: 7px;
    border-radius: 18px;
  }
  .nav-menu :deep(.el-menu-item) {
    padding: 0 13px;
    font-size: 14px;
  }
  .nav-menu :deep(.el-menu-item .el-icon) {
    display: none;
  }
}
</style>
