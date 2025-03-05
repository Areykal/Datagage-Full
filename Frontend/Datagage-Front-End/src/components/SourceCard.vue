<template>
  <v-card
    :to="to"
    class="source-card"
    variant="elevated"
    elevation="1"
    hover
    @mouseover="hovering = true"
    @mouseleave="hovering = false"
  >
    <v-card-item>
      <template v-slot:prepend>
        <v-avatar
          color="primary"
          variant="tonal"
          size="48"
          class="source-icon"
          :class="{ 'scale-up': hovering }"
        >
          <v-icon size="24">{{ icon }}</v-icon>
        </v-avatar>
      </template>
      <v-card-title class="text-truncate">{{ title }}</v-card-title>
      <v-card-subtitle>{{ subtitle }}</v-card-subtitle>
    </v-card-item>

    <v-expand-transition>
      <div v-if="hovering" class="px-4 pb-4">
        <slot name="actions">
          <v-btn variant="tonal" block> View Details </v-btn>
        </slot>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  icon: { type: String, default: "mdi-database" },
  to: { type: String, required: true },
});

const hovering = ref(false);
</script>

<style scoped>
.source-card {
  transition: all 0.3s ease;
  border: 1px solid var(--dark-border) !important;
}

.source-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.25) !important;
}

.source-icon {
  transition: transform 0.3s ease;
}

.scale-up {
  transform: scale(1.1);
}
</style>
