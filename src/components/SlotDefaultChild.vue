<template>
  <div class="base-card">
    <slot>
      <p>기본 콘텐츠 영역입니다.</p>
    </slot>
  </div>
</template>

<style scoped>
.base-card {
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}
</style>
