<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/configStore.js'

// 전역 저장소 포인터 확보
const configStore = useConfigStore()

// el-switch는 boolean model이 필요하다. 화씨일 때 true로 매핑해서 store와 이어붙인다.
const isFahrenheit = computed({
  get: () => configStore.unit === 'fahrenheit',
  set: () => configStore.toggleUnit(),
})
</script>

<template>
  <div class="unit-toggler">
    <span class="unit-label">날씨단위</span>
    <el-switch
      v-model="isFahrenheit"
      inline-prompt
      active-text="°F"
      inactive-text="°C"
      style="--el-switch-on-color: var(--color-accent)"
    />
  </div>
</template>

<style scoped>
/* 13차-k: 스위치 안 °C/°F가 흰 글자라 꺼짐(밝은 트랙) 상태에서 거의 안 보였다.
   꺼짐일 때는 진한 글자로 바꾼다. */
.unit-toggler :deep(.el-switch__inner) {
  /* 스위치 트랙 안 °C/°F. 켜짐은 강조색 트랙이라 흰 글자, 꺼짐은 밝은 트랙이라
     진한 글자여야 한다. EP 기본값이 양쪽 다 흰색이라 꺼짐에서 안 보였다. */
  font-weight: 700 !important;
}
/* 글자는 .el-switch__inner가 아니라 그 안의 wrapper > span에 들어 있어서,
   inner에만 색을 주면 자식이 EP의 흰색으로 덮는다. 자손까지 함께 지정한다. */
.unit-toggler :deep(.el-switch:not(.is-checked) .el-switch__inner),
.unit-toggler :deep(.el-switch:not(.is-checked) .el-switch__inner *) {
  color: #3c4655 !important;
}
.unit-toggler :deep(.el-switch.is-checked .el-switch__inner),
.unit-toggler :deep(.el-switch.is-checked .el-switch__inner *) {
  color: #ffffff !important;
}
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
}
.unit-label {
  font-size: 14px;
  font-weight: 600;
  color: #4e5968;
  white-space: nowrap;
}
</style>
