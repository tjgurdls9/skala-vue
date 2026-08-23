<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  alt: { type: String, default: '' },
})

// 투명 배경으로 다시 다듬은 아이콘은 우선 이 목록에서 사용한다.
// 나머지 아이콘도 기존 경로를 유지해, 추가 교체 전에는 깨지지 않는다.
const transparentNames = new Set(['risk', 'observation', 'location', 'sun', 'moon'])
const src = computed(
  () => `/icons/weather-desk/weather-${props.name}${transparentNames.has(props.name) ? '-transparent' : ''}.png`,
)
</script>

<template>
  <img
    class="weather-desk-icon"
    :src="src"
    :alt="alt"
    :aria-hidden="alt ? undefined : 'true'"
  />
</template>
