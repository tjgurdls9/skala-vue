<script setup>
defineProps({
  name: { type: String, required: true },
  alt: { type: String, default: '' },
})
</script>

<template>
  <img
    class="weather-desk-icon"
    :src="`/icons/weather-desk/weather-${name}.png`"
    :alt="alt"
    :aria-hidden="alt ? undefined : 'true'"
  />
</template>

