<script setup>
import { ref } from 'vue'
import vPropsEmitsChild from './vPropsEmitsChild.vue'

// 1. 상위 컴포넌트의 로컬 반응형 상태 정의
const message = ref('Parent 초기 메시지')

// 2. 하위 컴포넌트의 커스텀 이벤트를 수신했을 때 실행될 핸들러 함수
//    인자(newValue)로 하위 컴포넌트가 보낸 페이로드가 자동 주입됩니다.
const handleUpdateRequest = (newValue) => {
  message.value = newValue
}
</script>

<template>
  <div class="practice-section">
    <h2>Props &amp; Emits</h2>
    <div class="parent-container">
      <h3>상위 컴포넌트 (Parent)</h3>
      <p>
        현재 로컬 데이터(State): <strong>{{ message }}</strong>
      </p>
      <vPropsEmitsChild :parent-data="message" @update-request="handleUpdateRequest" />
    </div>
  </div>
</template>

<style scoped>
.parent-container {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f3efff;
  border: 1px solid #b8a9f0;
  border-radius: 6px;
}
</style>
