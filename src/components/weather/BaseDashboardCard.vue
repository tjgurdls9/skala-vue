<template>
  <div class="base-dashboard-card">
    <slot></slot>
  </div>
</template>

<style scoped>
.base-dashboard-card {
  background: #fff;
  padding: 18px 20px;
  border-radius: var(--radius-card);
  margin-bottom: 15px;
  box-shadow: var(--shadow-card);
}
</style>
