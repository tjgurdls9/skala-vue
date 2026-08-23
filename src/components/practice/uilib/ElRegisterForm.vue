<script setup>
// 교재 246p 실습 1: 회원가입 Form & 인풋 제어
import { ref } from 'vue'
// ElMessage는 태그가 아니라 JS 호출로 쓰는 알림창이라 직접 import 한다 (교재 244p)
import { ElMessage } from 'element-plus'
import WeatherDeskIcon from '../../WeatherDeskIcon.vue'

// 1. 입력값 두 개를 객체 하나로 묶어 반응형으로 잡는다
const userForm = ref({
  email: '',
  agree: false,
})

// 2. 제출 시점에 검증한다. 통과 못 하면 알림만 띄우고 즉시 빠져나간다.
const handleRegister = () => {
  if (!userForm.value.email.includes('@')) {
    ElMessage.error('올바른 이메일 형식이 아닙니다.')
    return
  }
  if (!userForm.value.agree) {
    ElMessage.warning('이용약관에 동의하셔야 합니다.')
    return
  }
  ElMessage.success('가입 신청이 정상적으로 완료되었습니다!')
}
</script>

<template>
  <div class="practice-section">
    <h2>Element Plus 실습 1: 회원가입 Form &amp; 인풋 제어</h2>

    <!-- el-card의 header 슬롯으로 카드 제목을 넣는다 -->
    <el-card>
      <template #header><span class="icon-heading"><WeatherDeskIcon name="form" /> 실습 1. 회원가입 Form &amp; 인풋 제어</span></template>

      <div class="form-row">
        <span class="form-label">이메일 주소:</span>
        <el-input v-model="userForm.email" placeholder="example@email.com" clearable />
      </div>

      <div class="form-row">
        <el-switch v-model="userForm.agree" />
        <span>개인정보 수집 및 필수 이용약관에 동의합니다.</span>
      </div>

      <el-button type="success" class="submit-button" @click="handleRegister">회원가입하기</el-button>
    </el-card>
  </div>
</template>

<style scoped>
.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.form-label {
  /* 라벨 폭을 고정해야 두 줄의 입력 요소 시작점이 맞는다 */
  flex: 0 0 90px;
}
.submit-button {
  width: 100%;
}
</style>
