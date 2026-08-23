<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '../../stores/weatherStore.js'
import WeatherDeskIcon from '../WeatherDeskIcon.vue'

const store = useWeatherStore()
const { isLoading, completedCount, progress, errorMessage, loadedAt } = storeToRefs(store)
const totalCount = computed(() => store.totalCount)

const updatedLabel = computed(() => {
  if (!loadedAt.value) return ''
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(loadedAt.value)
})
</script>

<template>
  <section v-if="isLoading || errorMessage || loadedAt" class="data-status" aria-live="polite" role="status">
    <WeatherDeskIcon :name="errorMessage ? 'risk' : 'observation'" />
    <div class="data-status-copy">
      <strong v-if="isLoading">전국 관측 지점 불러오는 중 · {{ completedCount }}/{{ totalCount }}</strong>
      <strong v-else-if="errorMessage">{{ errorMessage }}</strong>
      <strong v-else>전국 {{ totalCount }}개 관측 지점 최신 데이터</strong>
      <span v-if="updatedLabel">마지막 정상 갱신 {{ updatedLabel }}</span>
    </div>
    <el-progress v-if="isLoading" class="data-status-progress" :percentage="progress" :show-text="false" />
    <el-button v-if="errorMessage && !isLoading" size="small" @click="store.load({ force: true })">다시 시도</el-button>
  </section>
</template>

<style scoped>
.data-status {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  margin: 10px 0 18px;
  padding: 8px 12px;
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  background: var(--glass-surface);
  backdrop-filter: blur(16px) saturate(130%);
}
.weather-desk-icon { width: 32px; height: 32px; }
.data-status-copy { display: grid; gap: 2px; min-width: 0; }
.data-status-copy strong { color: var(--text-primary); font-size: 13px; }
.data-status-copy span { color: var(--text-secondary); font-size: 11px; }
.data-status-progress { flex: 1; min-width: 100px; margin-left: auto; }
:global(html[data-theme='dark']) .data-status-copy strong { color: #f2f6fc; }
:global(html[data-theme='dark']) .data-status-copy span { color: #b9c5d8; }
:global(html[data-theme='dark']) .data-status { border-color: rgba(207, 223, 248, .42); }
@media (max-width: 640px) {
  .data-status { flex-wrap: wrap; }
  .data-status-copy { flex: 1; }
  .data-status-progress { flex-basis: 100%; }
}
</style>
