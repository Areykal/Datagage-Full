<template>
  <v-icon v-if="iconExists" :size="size" :color="color">{{
    fullIconName
  }}</v-icon>
  <v-icon v-else :size="size" :color="color">{{ fallback }}</v-icon>
</template>

<script setup>
// Remove the import of defineProps - it's a compiler macro
import { computed } from "vue";

const props = defineProps({
  icon: {
    type: String,
    default: "",
  },
  size: {
    type: [String, Number],
    default: "default",
  },
  color: {
    type: String,
    default: "",
  },
  fallback: {
    type: String,
    default: "mdi-database-outline",
  },
});

// Ensure icon has mdi- prefix
const fullIconName = computed(() => {
  if (!props.icon) return props.fallback;
  return props.icon.startsWith("mdi-") ? props.icon : `mdi-${props.icon}`;
});

// Check if the icon property is valid
const iconExists = computed(() => {
  return Boolean(props.icon);
});
</script>
