<script setup>
// 교재 247p 실습 2: 커머스 상품 수량 및 평점 시스템
import { ref } from 'vue'

const productQuantity = ref(1) // 수량 카운터 기본값
const productRate = ref(4) // 별점 기본값 (별 4개)
</script>

<template>
  <div class="practice-section">
    <h2>Element Plus 실습 2: 상품 수량 및 평점</h2>

    <el-card>
      <template #header>🛒 실습 2. 커머스 상품 수량 및 평점 시스템</template>

      <div class="form-row">
        <span class="form-label">구매 수량 선택:</span>
        <!-- min/max를 주면 한계값에서 +,- 버튼이 알아서 비활성화된다 -->
        <el-input-number v-model="productQuantity" :min="1" :max="10" />
        <span class="hint">(최대 10개 구매 가능)</span>
      </div>

      <div class="form-row">
        <span class="form-label">상품 만족도 별점:</span>
        <el-rate v-model="productRate" show-score score-template="{value} 점" />
      </div>

      <!-- 두 입력값이 바뀔 때마다 즉시 다시 그려지는 요약줄 -->
      <el-alert type="success" :closable="false" show-icon>
        실시간 장부 요약: 선택 수량 {{ productQuantity }}개 / 내가 준 점수 {{ productRate }}점
      </el-alert>
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
  flex: 0 0 110px;
}
.hint {
  font-size: 13px;
  color: #6e6e73;
}
</style>
