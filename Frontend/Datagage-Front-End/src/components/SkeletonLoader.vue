<template>
  <div class="skeleton-loader" :class="type">
    <v-skeleton-loader
      :loading="true"
      :type="type"
      :types="customTypes"
    ></v-skeleton-loader>
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, default: "card" },
});

const customTypes = {
  "source-card": "card-avatar, article",
  "source-details": "card-heading, divider, paragraph, divider, table",
};
</script>

<style scoped>
.skeleton-loader {
  background: var(--dark-surface);
  border-radius: 8px;
  overflow: hidden;
}

.source-card {
  height: 120px;
}

.source-details {
  min-height: 400px;
}
</style>
