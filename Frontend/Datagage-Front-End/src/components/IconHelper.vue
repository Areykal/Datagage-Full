<template>
  <v-icon v-if="isValidIcon" :icon="name" :size="size" :color="color"></v-icon>
  <v-icon v-else :size="size" :color="color">mdi-help-circle-outline</v-icon>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [String, Number],
    default: "default",
  },
  color: {
    type: String,
    default: undefined,
  },
});

// Check if the icon name is valid (starts with 'mdi-')
const isValidIcon = computed(() => {
  return props.name && props.name.startsWith("mdi-");
});
</script>
