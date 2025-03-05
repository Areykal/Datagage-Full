<template>
  <v-avatar :color="sourceColor" :size="size" rounded class="source-icon">
    <v-icon :size="iconSize">{{ iconName }}</v-icon>
  </v-avatar>
</template>

<script setup>
import { computed } from "vue";
import { getSourceTypeDetails } from "@/config/sourceTypes";

const props = defineProps({
  sourceType: {
    type: String,
    required: true,
  },
  size: {
    type: [String, Number],
    default: 40,
  },
});

// Get source details
const sourceDetails = computed(() => getSourceTypeDetails(props.sourceType));

// Map source types to colors
const sourceColorMap = {
  "google-sheets": "green-lighten-1",
  file: "blue-lighten-1",
  mysql: "orange-lighten-1",
  postgres: "blue-darken-1",
  salesforce: "light-blue",
};

// Get icon name from source details
const iconName = computed(() => sourceDetails.value.icon);

// Get source color with fallback to primary
const sourceColor = computed(() => {
  return sourceColorMap[props.sourceType] || "primary";
});

// Calculate appropriate icon size based on avatar size
const iconSize = computed(() => {
  const avatarSize =
    typeof props.size === "number" ? props.size : parseInt(props.size, 10);
  return Math.max(16, Math.floor(avatarSize * 0.6));
});
</script>

<style scoped>
.source-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
