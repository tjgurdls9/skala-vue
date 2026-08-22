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
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
}
.unit-label {
  font-size: 14px;
  color: #495057;
  white-space: nowrap;
}
</style>
