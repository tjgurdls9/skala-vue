<script setup>
import SlotDefaultChild from './SlotDefaultChild.vue'
import WeatherDeskIcon from '../../WeatherDeskIcon.vue'
</script>

<template>
  <div class="practice-section">
    <h2>Default Slot 레이아웃 주입 실습</h2>
    <SlotDefaultChild>
      <p>단순한 텍스트 문장을 주입합니다.</p>
    </SlotDefaultChild>
    <SlotDefaultChild>
      <h2 class="icon-heading" style="color: #e74c3c"><WeatherDeskIcon name="risk" /> 경고 상태</h2>
      <button>확인</button>
    </SlotDefaultChild>
    <SlotDefaultChild> </SlotDefaultChild>
  </div>
</template>
