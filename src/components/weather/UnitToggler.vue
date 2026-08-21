<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/configStore.js'

// 전역 저장소 포인터 확보
const configStore = useConfigStore()

const unitName = computed(() => (configStore.unit === 'fahrenheit' ? '화씨' : '섭씨'))
</script>

<template>
  <div class="unit-toggler">
    <span class="unit-label">
      날씨단위: <strong>{{ unitName }}({{ configStore.unitSymbol }})</strong>
    </span>
    <button @click="configStore.toggleUnit">단위변경</button>
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
