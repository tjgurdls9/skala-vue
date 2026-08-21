<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/configStore.js'

// 1. 상위로부터 단방향 주입받을 객체 데이터 규격 검수 (매크로)
const props = defineProps({
  cityItem: {
    type: Object,
    required: true,
  },
})

// 2. 상위로 송신할 두 가지 경로의 커스텀 이벤트 식별자 등록 (매크로)
const emit = defineEmits(['select-card', 'click-detail'])

// 3. 과제 5: 전역 단위 설정에 맞춰 표시용 기온을 계산한다.
const configStore = useConfigStore()

const displayTemp = computed(() => {
  const rawTemp = props.cityItem.temp // 기본 원본 데이터는 섭씨 숫자
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
})
</script>

<template>
  <div class="weather-card" @click="emit('select-card', `${cityItem.name}이 선택되었습니다.`)">
    <div class="card-header">
      <h4>{{ cityItem.name }}</h4>
    </div>

    <p class="temp-display">
      {{ displayTemp }}<span class="temp-unit">{{ configStore.unitSymbol }}</span>
    </p>
    <p class="sub-line">
      {{ cityItem.status }} · 습도 {{ cityItem.humidity }}% · 미세먼지 {{ cityItem.microdust }}
    </p>

    <div class="badge-row">
      <span v-if="cityItem.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
      <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

      <span v-if="cityItem.humidity >= 60" class="badge humid">🌫️ 습함 (60% 이상)</span>
      <span v-else-if="cityItem.humidity >= 40" class="badge good">🍀 상쾌함 (40~59%)</span>
      <span v-else class="badge dry">🌵 건조함 (40% 미만)</span>

      <span v-if="cityItem.microdust >= 50" class="badge bad">😷 나쁨 (50 이상)</span>
      <span v-else class="badge fine">😀 좋음 (50 미만)</span>
    </div>

    <hr class="card-divider" />
    <h5 class="decision-title">📊 의사결정 보조 지표</h5>
    <p class="score-line">
      <span class="badge priority" :class="`p-${cityItem.priority}`"
        >우선순위 {{ cityItem.priority }}</span
      >
      <span class="badge code">등급 {{ cityItem.code }}</span>
      <span class="badge segment">{{ cityItem.segment.label }}</span>
      <span class="badge budget">{{ cityItem.budget }}만원 ({{ cityItem.share }}%)</span>
    </p>
    <p class="plan-comment">{{ cityItem.segment.plan }}</p>

    <button class="btn-detail" @click.stop="emit('click-detail', cityItem)">상세보기</button>
  </div>
</template>

<style scoped>
.weather-card {
  background: #fff;
  border: none;
  padding: 18px 20px;
  margin-bottom: 12px;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  position: relative;
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
  color: #8e8e93;
  margin-left: 2px;
}
.sub-line {
  font-size: 13px;
  color: #8e8e93;
  margin: 2px 0 0;
}
.badge-row {
  margin-top: 10px;
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  margin: 0 6px 6px 0;
}
.hot {
  background-color: #ffe5e5;
  color: #ff3b30;
}
.cool {
  background-color: #e5f3ff;
  color: #007aff;
}
.humid {
  background-color: #eef1f4;
  color: #636366;
}
.good {
  background-color: #e6f9ed;
  color: #34c759;
}
.dry {
  background-color: #fff4e5;
  color: #ff9500;
}
.bad {
  background-color: #ffe5e5;
  color: #ff3b30;
}
.fine {
  background-color: #e6f9ed;
  color: #34c759;
}
.btn-detail {
  position: absolute;
  right: 18px;
  top: 18px;
  padding: 6px 14px;
  cursor: pointer;
  border-radius: var(--radius-pill);
}
.card-divider {
  border: none;
  border-top: 1px solid #f0f0f2;
  margin: 12px 0 8px;
}
.decision-title {
  margin: 0 0 8px;
  font-size: 13px;
  color: #8e8e93;
}
.score-line {
  margin: 0;
}
.p-A {
  background-color: #ffe5e5;
  color: #ff3b30;
}
.p-B {
  background-color: #fff4e5;
  color: #ff9500;
}
.p-C {
  background-color: #eef1f4;
  color: #636366;
}
.code {
  background-color: #eef1f4;
  color: #636366;
}
.segment {
  background-color: #e6f9ed;
  color: #248a5e;
}
.budget {
  background-color: #e5f3ff;
  color: #007aff;
}
.plan-comment {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #636366;
}
</style>
