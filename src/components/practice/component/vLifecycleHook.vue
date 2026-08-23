<script setup>
import { ref } from 'vue'
import vLifecycleHookChild from './vLifecycleHookChild.vue'
import WeatherDeskIcon from '../../WeatherDeskIcon.vue'

const isAlive = ref(true)
</script>

<template>
  <div class="practice-section">
    <h2>Lifecycle Hook</h2>
    <button class="destroy" @click="isAlive = !isAlive">
      실습 컴포넌트 {{ isAlive ? '파괴하기 (v-if="false")' : '되살리기 (v-if="true")' }}
    </button>

    <h3 class="icon-heading"><WeatherDeskIcon name="automation" /> 라이프사이클 훅 흐름 탐색기</h3>
    <vLifecycleHookChild v-if="isAlive" />
  </div>
</template>

<style scoped>
button.destroy {
  display: block;
  width: 100%;
}
</style>
