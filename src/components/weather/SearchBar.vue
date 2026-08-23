<script setup>
import { Search } from '@element-plus/icons-vue'

// 1. 상위로 입력 텍스트를 전달할 커스텀 이벤트 등록 (매크로)
defineEmits(['update-query'])

// 2. 상위로부터 현재 검색 상태 값을 수신 (한글 동기화 상태 유지용)
defineProps({
  currentQuery: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="search-inner">
    <h3 class="search-title">
      <el-icon><Search /></el-icon> 도시 검색
    </h3>
    <!-- el-input은 v-model만 지원하므로 currentQuery/emit 조합 대신 :model-value + input 이벤트로 잇는다 -->
    <el-input
      class="search-field"
      :model-value="currentQuery"
      clearable
      :prefix-icon="Search"
      placeholder="도시 이름 입력"
      @update:model-value="$emit('update-query', $event)"
    />
    <!-- 8차: "검색 중인 도시: (전체)"를 맨몸 텍스트로 두던 걸 상태 칩으로. 전체일 때는 회색,
         검색 중일 때는 강조색이라 지금 필터가 걸려 있는지 한눈에 보인다. -->
    <p class="search-state">
      <span class="search-state-chip" :class="{ 'is-filtered': currentQuery }">
        {{ currentQuery || '전체 지역' }}
      </span>
    </p>
  </div>
</template>

<style scoped>
.search-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
}

/* 8차: 기본 el-input이 옅은 회색 바로만 보여서 "비활성처럼 덜렁 놓인" 느낌이었다 —
   iOS 검색 필드처럼 높이/여백을 키우고 배경 대비를 올려서 입력 가능한 곳으로 읽히게 한다. */
/* 12차: 인풋 면도 다른 안쪽 판과 같은 토큰을 쓴다. 0.72는 투명해진 유리 카드 안에서
   혼자 흰 종이처럼 떠 보였다. 배경/테두리는 base.css의 .el-input__wrapper 규칙이 잡고,
   여기서는 이 검색창만의 치수(패딩·높이)만 남긴다. */
.search-field :deep(.el-input__wrapper) {
  border-radius: var(--control-radius);
  padding: 2px 12px;
  min-height: 36px;
}
.search-field :deep(.el-input__inner) {
  font-size: 14px;
  color: #1c1c1e;
}
.search-field :deep(.el-input__inner::placeholder) {
  color: #8e8e93;
}
.search-field :deep(.el-input__prefix) {
  color: #6e6e73;
}

.search-state {
  margin: 8px 0 0;
}
.search-state-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(120, 120, 128, 0.16);
  color: #48484f;
  transition:
    background-color 0.2s var(--apple-ease),
    color 0.2s var(--apple-ease);
}
/* 12차: '선택됨' 파랑은 화면 전체가 같은 토큰을 쓴다 */
.search-state-chip.is-filtered {
  background: var(--control-bg-on);
  color: var(--control-fg-on);
}
</style>
