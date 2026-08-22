<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/configStore.js'
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
  WarnTriangleFilled,
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
  const rawTemp = props.cityItem.temp // 기본 원본 데이터는 섭씨 숫자
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
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

// 대표 지시 한 줄 — 운영 모드를 가장 직접적으로 설명하는 판촉(Promotion) 항목을 쓴다.
const leadAction = computed(
  () => ops.value.items.find((entry) => entry.p === 'Promotion') ?? ops.value.items[0],
)
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
        ↑{{ cityItem.tempMax }}° ↓{{ cityItem.tempMin }}°
      </span>
    </p>
    <p class="sub-line">
      {{ cityItem.status }}
      <template v-if="cityItem.feelsLike !== undefined">
        · 체감 {{ cityItem.feelsLike }}°</template
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
        <el-icon><WarnTriangleFilled /></el-icon> 나쁨 (50 이상)
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
        <el-icon><WarnTriangleFilled /></el-icon> 경보 {{ alertCount }}건
      </span>
    </div>
    <p class="ops-summary">{{ ops.mode.summary }}</p>
    <p class="ops-lead">
      <span class="ops-lead-label">{{ leadAction.label }}</span>
      {{ leadAction.text }}
    </p>

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
  background-color: var(--glass-bg);
  background-image: var(--glass-sheen);
  /* 빛이 훑는 애니메이션 대신 실제 굴절. blur를 약하게 써야 굴절이 안 뭉개진다 */
  -webkit-backdrop-filter: url(#glass-refraction) var(--glass-refract-blur);
  backdrop-filter: url(#glass-refraction) var(--glass-refract-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
  transition:
    background-color 0.25s var(--apple-ease),
    box-shadow 0.25s var(--apple-ease);
}
.weather-card:hover {
  background-color: var(--glass-bg-strong);
  box-shadow: var(--shadow-glass-raised);
}
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
  color: #6e6e73;
  margin-left: 2px;
}
.temp-range {
  font-size: 13px;
  font-weight: 600;
  color: #6e6e73;
  margin-left: 8px;
  vertical-align: middle;
}
.sub-line {
  font-size: 13px;
  color: #6e6e73;
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
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid var(--glass-border);
}
.index-label {
  font-size: 11px;
  color: #6e6e73;
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
  color: #248a5e;
}
.index-value.tone-info {
  color: #0a5fd8;
}
.index-value.tone-warning {
  color: #a85f00;
}
.index-value.tone-danger {
  color: #c62d22;
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
  background: linear-gradient(90deg, #2ebe7a 0%, #e6a23c 55%, #c62d22 100%);
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
  color: #1c6f49;
}
.ops-badge.tone-info {
  background: rgba(10, 95, 216, 0.14);
  color: #0a5fd8;
}
.ops-badge.tone-warning {
  background: rgba(168, 95, 0, 0.16);
  color: #8a4e00;
}
.ops-badge.tone-danger {
  background: rgba(198, 45, 34, 0.14);
  color: #c62d22;
}
.ops-alert-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: #a85f00;
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
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid var(--glass-border);
  font-size: 13px;
  line-height: 1.5;
  color: #48484f;
}
.ops-lead-label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: #6e6e73;
}
</style>
