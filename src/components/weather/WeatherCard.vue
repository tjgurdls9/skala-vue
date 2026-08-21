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
    <h4>{{ cityItem.name }} ({{ cityItem.status }})</h4>
    <p>현재 기온: {{ displayTemp }}{{ configStore.unitSymbol }}</p>
    <p>현재 습도: {{ cityItem.humidity }}%</p>
    <p>미세먼지수치: {{ cityItem.microdust }}</p>

    <span v-if="cityItem.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
    <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

    <span v-if="cityItem.humidity >= 60" class="badge humid">🌫️ 습함 (60% 이상)</span>
    <span v-else-if="cityItem.humidity >= 40" class="badge good">🍀 상쾌함 (40~59%)</span>
    <span v-else class="badge dry">🌵 건조함 (40% 미만)</span>

    <span v-if="cityItem.microdust >= 50" class="badge bad">😷 나쁨 (50 이상)</span>
    <span v-else class="badge fine">😀 좋음 (50 미만)</span>

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
  border: 1px solid #dee2e6;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
}
.badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  color: #fff;
  margin: 0 4px 4px 0;
}
.hot {
  background-color: #ff7675;
}
.cool {
  background-color: #74b9ff;
}
.humid {
  background-color: #a4b0be;
}
.good {
  background-color: #a8d879;
}
.dry {
  background-color: #ffbf75;
}
.bad {
  background-color: #a29bfe;
}
.fine {
  background-color: #fd79a8;
}
.btn-detail {
  position: absolute;
  right: 12px;
  top: 15px;
  padding: 6px 10px;
  cursor: pointer;
}
.card-divider {
  border: none;
  border-top: 1px solid #dee2e6;
  margin: 12px 0 8px;
}
.decision-title {
  margin: 0 0 8px;
  font-size: 13px;
  color: #495057;
}
.score-line {
  margin: 0;
}
.p-A {
  background-color: #d63031;
}
.p-B {
  background-color: #e17055;
}
.p-C {
  background-color: #b2bec3;
}
.code {
  background-color: #636e72;
}
.segment {
  background-color: #00b894;
}
.budget {
  background-color: #0984e3;
}
.plan-comment {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #495057;
}
</style>
