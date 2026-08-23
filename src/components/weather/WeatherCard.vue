<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useConfigStore } from '../../stores/configStore.js'
import WeatherDeskIcon from '../WeatherDeskIcon.vue'
import {
  buildRiskAlerts,
  buildDiscomfort,
  buildStayMinutes,
  build7P,
} from '../../data/weatherMock.js'
import {
  Sunny,
  PartlyCloudy,
  Drizzling,
  WindPower,
  CircleCheck,
} from '@element-plus/icons-vue'

// 1. 상위로부터 단방향 주입받을 객체 데이터 규격 검수 (매크로)
const props = defineProps({
  cityItem: {
    type: Object,
    required: true,
  },
})

// 2. 상위로 송신할 커스텀 이벤트 식별자 등록 (매크로)
const emit = defineEmits(['click-detail'])

// 3. 과제 5: 전역 단위 설정에 맞춰 표시용 기온을 계산한다.
const configStore = useConfigStore()

const displayTemp = computed(() => {
  return configStore.convertTemperature(props.cityItem.temp)
})

// 10차: 파생 지표(불쾌지수 / 옥외 체류 시간)
const discomfort = computed(() => buildDiscomfort(props.cityItem))
const stay = computed(() => buildStayMinutes(props.cityItem))

// 11차: 카드는 "오늘 이 지역을 어떻게 운영할지"라는 결론만 보여준다.
// 7P 전체와 경영 기능 5축은 공간이 넉넉한 상세 화면이 맡는다.
const ops = computed(() => build7P(props.cityItem))

// 경보는 개수만 배지로. 내용은 상세에서 본다.
const alertCount = computed(
  () => buildRiskAlerts(props.cityItem).filter((alert) => alert.level !== 'success').length,
)

// 13차-p: 지금까지 이 자리에 판촉(Promotion) 한 줄만 고정으로 띄웠다. 7P를 다 계산해
// 놓고 하나만 보여준 셈이라, 카드만 보면 '이 서비스는 커뮤니케이션 얘기만 한다'로 읽혔다.
// 일곱 항목을 차례로 돌린다 — 카드 높이는 그대로 두고 내용만 바뀐다.
const ROTATE_MS = 4600
const tipIndex = ref(0)
const tipPaused = ref(false)
let tipTimer = 0
let tipDelay = 0

const currentTip = computed(() => {
  const list = ops.value.items
  return list[tipIndex.value % list.length] ?? list[0]
})

onMounted(() => {
  // 읽는 중에 글이 바뀌면 곤란하다. 동작 최소화를 켠 사용자에게는 돌리지 않고,
  // 지금까지와 같은 판촉 항목에 세워둔다.
  const promotionAt = ops.value.items.findIndex((entry) => entry.p === 'Promotion')
  tipIndex.value = promotionAt >= 0 ? promotionAt : 0
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // 한 화면에 카드가 여섯 장이라, 같은 순간에 다 같이 넘어가면 화면이 깜빡이는 것처럼 보인다.
  // 시작 시점을 흩어 놓으면 각자 다른 박자로 넘어간다.
  tipDelay = window.setTimeout(() => {
    tipTimer = window.setInterval(() => {
      if (tipPaused.value) return
      tipIndex.value = (tipIndex.value + 1) % ops.value.items.length
    }, ROTATE_MS)
  }, Math.random() * ROTATE_MS)
})

onBeforeUnmount(() => {
  clearTimeout(tipDelay)
  clearInterval(tipTimer)
})
</script>

<template>
  <!-- 교재 249p: 카드를 Element Plus el-card로 교체. shadow="hover"가 iOS 유리 카드의 hover 승격과 같은 역할 -->
  <el-card class="weather-card" shadow="hover" @click="emit('click-detail', cityItem)">
    <div class="card-header">
      <h4>{{ cityItem.name }}</h4>
    </div>

    <p class="temp-display">
      {{ displayTemp }}<span class="temp-unit">{{ configStore.unitSymbol }}</span>
      <!-- 10차: 같은 응답에 이미 있던 체감/최고최저를 큰 숫자 옆에 붙였다 -->
      <span v-if="cityItem.tempMax !== undefined" class="temp-range">
        ↑{{ configStore.convertTemperature(cityItem.tempMax) }}°
        ↓{{ configStore.convertTemperature(cityItem.tempMin) }}°
      </span>
    </p>
    <p class="sub-line">
      {{ cityItem.status }}
      <template v-if="cityItem.feelsLike !== undefined">
        · 체감 {{ configStore.convertTemperature(cityItem.feelsLike) }}°</template
      >
      · 습도 {{ cityItem.humidity }}% · 미세먼지 {{ cityItem.microdust }}
    </p>

    <!-- 10차: 불쾌지수 · 옥외 체류 시간. 원본 수치만 늘어놓는 대신 해석된 지표를 같이 보여준다 -->
    <div class="index-row">
      <div class="index-cell">
        <span class="index-label">불쾌지수</span>
        <span class="index-value" :class="`tone-${discomfort.tone}`">
          {{ discomfort.value }} <small>{{ discomfort.label }}</small>
        </span>
        <span class="index-track"
          ><i :style="{ width: `${Math.min(discomfort.value, 100)}%` }"
        /></span>
      </div>
      <div class="index-cell">
        <span class="index-label">옥외 체류 적정</span>
        <span class="index-value">{{ stay.minutes }}<small>분</small></span>
        <span class="index-track"
          ><i class="is-stay" :style="{ width: `${stay.ratio * 100}%` }"
        /></span>
      </div>
    </div>

    <!-- 이모지 대신 Element Plus 아이콘. 색(el-tag type)으로 상태를, 아이콘으로 종류를 구분한다 -->
    <div class="badge-row">
      <el-tag v-if="cityItem.temp >= 25" type="danger">
        <el-icon><Sunny /></el-icon> 더움 (25도 이상)
      </el-tag>
      <el-tag v-else type="info">
        <el-icon><PartlyCloudy /></el-icon> 선선함 (25도 미만)
      </el-tag>

      <el-tag v-if="cityItem.humidity >= 60" type="info">
        <el-icon><Drizzling /></el-icon> 습함 (60% 이상)
      </el-tag>
      <el-tag v-else-if="cityItem.humidity >= 40" type="success">
        <el-icon><CircleCheck /></el-icon> 상쾌함 (40~59%)
      </el-tag>
      <el-tag v-else type="warning">
        <el-icon><WindPower /></el-icon> 건조함 (40% 미만)
      </el-tag>

      <el-tag v-if="cityItem.microdust >= 50" type="danger">
        <WeatherDeskIcon name="risk" class="weather-tag-art" /> 나쁨 (50 이상)
      </el-tag>
      <el-tag v-else type="success">
        <el-icon><CircleCheck /></el-icon> 좋음 (50 미만)
      </el-tag>
    </div>

    <hr class="card-divider" />

    <!-- 11차: 4개 탭(마케팅/재고/인력/경보)을 카드 안에 다 밀어넣으니 좁아서 읽기 힘들었다.
         카드에는 "오늘 이 지역을 어떻게 운영할지" 결론만 크게 두고, 7P 전체와 경영 기능
         5축(인사/재무/회계/생산물류/안전)은 공간이 넉넉한 상세 화면으로 옮겼다. -->
    <div class="ops-head">
      <span class="ops-badge" :class="`tone-${ops.mode.tone}`">{{ ops.mode.label }}</span>
      <span v-if="alertCount" class="ops-alert-count">
        <WeatherDeskIcon name="risk" class="weather-tag-art" /> 경보 {{ alertCount }}건
      </span>
    </div>
    <p class="ops-summary">{{ ops.mode.summary }}</p>
    <!-- 높이를 고정한 슬롯 안에서만 글이 바뀐다 — 안 그러면 문장 길이가 다를 때마다
         카드가 늘었다 줄었다 해서 아래 카드들까지 밀린다.
         마우스를 올리고 있는 동안에는 멈춘다(읽는 중에 바뀌면 안 된다). -->
    <div
      class="ops-lead-slot"
      @mouseenter="tipPaused = true"
      @mouseleave="tipPaused = false"
    >
      <!-- 13차-q: mode="out-in"은 옛 문장이 완전히 사라진 뒤에야 새 문장이 나타나서,
           그 사이 빈 순간이 "부드러운 전환"이 아니라 "끊기고 다시 나옴"으로 읽혔다.
           mode 없이(동시 진행) 나가는 문장만 자리에서 빼서(position:absolute)
           들어오는 문장과 겹쳐 크로스페이드한다. -->
      <Transition name="tip-swap">
        <p :key="currentTip.p" class="ops-lead">
          <span class="ops-lead-label">{{ currentTip.label }}</span>
          <span class="ops-lead-text">{{ currentTip.text }}</span>
        </p>
      </Transition>
    </div>

    <el-button class="btn-detail" size="small" @click.stop="emit('click-detail', cityItem)">
      상세보기
    </el-button>
  </el-card>
</template>

<style scoped>
/* 6차: el-card로 바꾸면서 Element Plus 기본 불투명 흰 배경(--el-card-bg-color)을 그대로 쓰고
   있었다 — 유리 토큰을 하나도 안 받는 카드였다. 배경/블러/보더/그림자를 직접 지정해서 진짜
   유리로 되돌린다. 우리 클래스가 el-card 루트에 그대로 붙어 있어서(Vue의 scope id가 자식
   컴포넌트 루트에도 붙는다) :deep 없이도 el-card의 기본 스타일을 덮어쓸 수 있다. */
.weather-card {
  margin-bottom: 12px;
  border-radius: var(--radius-card);
  /* 11차 UX: 지금까지 카드 전체에 cursor:pointer가 걸려 있는데 정작 클릭은 아무 일도
     하지 않았다 — "눌릴 것 같은데 안 눌리는" 전형적인 어포던스 위반이었다.
     카드 전체를 상세로 가는 클릭 타깃으로 만들고, 버튼은 명시적 안내로 남긴다. */
  cursor: pointer;
  position: relative;
  isolation: isolate;
  /* 12차: 이 카드는 항상 대시보드 카드(BaseDashboardCard) '안'에 놓인다.
     바깥과 같은 --glass-bg(32%)를 쓰면 32%가 두 번 겹쳐 실효 54%가 되고, 여기에
     backdrop-filter까지 두 번 걸려 뒤가 한 번 더 뿌예진다 — 주변 유리보다 혼자
     하얗게 보이던 원인이다. 안쪽에 놓이는 판이므로 안쪽 면 토큰을 쓰고,
     블러는 바깥 카드가 이미 걸어둔 것으로 충분해 다시 걸지 않는다. */
  background-color: var(--glass-inset-bg);
  background-image: var(--glass-inset-sheen);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--shadow-glass);
  /* 13차-l: 여기 있던 transition을 걷어냈다. 바로 아래 주석대로 호버는 base.css가
     맡는데, 이 선언이 그 전환 목록을 통째로 덮어써서(스코프 스타일이 나중에 주입된다)
     정작 transform·border-radius에는 전환이 안 걸려 카드가 툭 튀었다. */
}
/* 12차: 호버하면 오히려 더 '맑아지는' 쪽이 유리답다 — 공통 규칙(base.css)이
   투명도·떠오름·스페큘러를 모두 맡으므로 여기서는 따로 덮지 않는다. */
/* el-card 내부 padding을 우리 카드 리듬(18px 20px)에 맞추고, 자체 배경/그림자는 지운다
   (배경·그림자는 위 .weather-card가 이미 담당한다 — 두 겹으로 깔리면 탁해진다) */
.weather-card :deep(.el-card__body) {
  padding: 18px 20px;
  position: relative;
  background: transparent;
}
.card-header {
  padding-right: 90px;
}
.card-header h4 {
  font-size: 17px;
  font-weight: 600;
  color: #1c1c1e;
}
.temp-display {
  font-size: 48px;
  font-weight: 700;
  color: #1c1c1e;
  line-height: 1.1;
  margin: 4px 0 0;
}
.temp-unit {
  font-size: 22px;
  font-weight: 500;
  color: #48515f;
  margin-left: 2px;
}
.temp-range {
  font-size: 13px;
  font-weight: 600;
  color: #48515f;
  margin-left: 8px;
  vertical-align: middle;
}
.sub-line {
  font-size: 13px;
  color: #48515f;
  margin: 2px 0 0;
}

/* 10차: 파생 지표 두 칸. 숫자 + 색 + 길이 세 가지로 같은 값을 읽게 한다 */
.index-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}
.index-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
}
.index-label {
  font-size: 11px;
  color: #48515f;
}
.index-value {
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}
.index-value small {
  font-size: 11px;
  font-weight: 600;
  margin-left: 2px;
}
.index-value.tone-success {
  color: #14563a;
}
.index-value.tone-info {
  color: #0a53c0;
}
.index-value.tone-warning {
  color: #8a4e00;
}
.index-value.tone-danger {
  color: #ad251c;
}
.index-track {
  display: block;
  height: 4px;
  border-radius: 999px;
  background: rgba(120, 120, 128, 0.2);
  overflow: hidden;
}
.index-track i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2ebe7a 0%, #e6a23c 55%, #ad251c 100%);
}
.index-track i.is-stay {
  background: var(--color-accent);
}
.badge-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.badge-row .el-tag,
.score-line .el-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.btn-detail {
  position: absolute;
  right: 18px;
  top: 18px;
}
.card-divider {
  border: none;
  border-top: 1px solid rgba(28, 32, 56, 0.1);
  margin: 14px 0 12px;
}

/* --- 11차: 운영 지시 블록 --- */
.ops-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ops-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
}
.ops-badge.tone-success {
  background: rgba(36, 138, 94, 0.14);
  color: #14563a;
}
.ops-badge.tone-info {
  background: rgba(10, 95, 216, 0.14);
  color: #0a53c0;
}
.ops-badge.tone-warning {
  background: rgba(168, 95, 0, 0.16);
  color: #8a4e00;
}
.ops-badge.tone-danger {
  background: rgba(198, 45, 34, 0.14);
  color: #ad251c;
}
.ops-alert-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: #8a4e00;
}
.weather-tag-art {
  width: 18px;
  height: 18px;
}
.ops-summary {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #48484f;
}
.ops-lead {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 8px 0 12px;
  padding: 9px 12px;
  border-radius: 10px;
  background: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
  font-size: 13px;
  line-height: 1.5;
  color: #48484f;
}
/* 13차-p: 7P가 돌아가는 슬롯. 두 줄 높이로 못 박아 카드가 들썩이지 않게 한다.
   min-height만으로는 좁은 화면에서 세 줄짜리 문장이 들어오면 다시 늘어난다 —
   본문을 두 줄로 잘라 어떤 폭에서도 높이가 같게 만든다. */
.ops-lead-slot {
  position: relative;
  min-height: 62px;
}
.ops-lead-slot .ops-lead {
  margin: 8px 0 12px;
}
.ops-lead-slot .ops-lead-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  min-width: 0;
}
.tip-swap-enter-active,
.tip-swap-leave-active {
  transition:
    opacity 0.5s var(--apple-ease),
    transform 0.5s var(--apple-ease);
}
.tip-swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
/* 나가는 문장을 자리에서 빼내 들어오는 문장과 같은 자리에 겹친다 —
   슬롯 높이는 이미 min-height로 고정돼 있어 겹쳐도 아래 내용이 흔들리지 않는다. */
.tip-swap-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
.tip-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.ops-lead-label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: #48515f;
}
</style>
