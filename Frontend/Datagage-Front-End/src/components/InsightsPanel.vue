<template>
  <v-card class="insights-panel">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-lightbulb" class="mr-2 text-amber" />
      AI Insights
      <v-spacer></v-spacer>
      <v-chip
        v-if="filterContext"
        size="small"
        color="info"
        class="text-caption"
      >
        {{ getFilterDescription() }}
      </v-chip>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="pt-4">
      <div v-if="loading" class="d-flex flex-column align-center py-5">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <div class="mt-4 text-body-1">Analyzing your data...</div>
      </div>

      <div v-else-if="error" class="error-container pa-4 text-center">
        <v-icon icon="mdi-alert-circle" color="error" size="large"></v-icon>
        <div class="text-subtitle-1 mt-2">Analysis Error</div>
        <div class="text-body-2 mt-1">{{ error }}</div>
        <v-btn
          color="primary"
          variant="tonal"
          class="mt-4"
          @click="retryAnalysis"
        >
          Retry Analysis
        </v-btn>
      </div>

      <div v-else-if="!insights" class="text-center pa-5">
        <v-icon icon="mdi-database-search" size="64" color="grey"></v-icon>
        <div class="text-h6 mt-4">No insights available</div>
        <div class="text-body-2 mt-2">
          Select data to analyze or adjust your filters
        </div>
      </div>

      <div v-else class="insights-content" v-html="formattedInsights"></div>
    </v-card-text>

    <v-divider v-if="insights"></v-divider>

    <v-card-actions v-if="insights">
      <v-btn
        prepend-icon="mdi-refresh"
        variant="text"
        @click="refreshAnalysis"
        :disabled="loading"
      >
        Refresh Analysis
      </v-btn>
      <v-spacer></v-spacer>
      <v-tooltip text="Export as PDF">
        <template v-slot:activator="{ props }">
          <v-btn
            icon="mdi-file-pdf-box"
            v-bind="props"
            variant="text"
            color="primary"
          ></v-btn>
        </template>
      </v-tooltip>
      <v-tooltip text="Share">
        <template v-slot:activator="{ props }">
          <v-btn
            icon="mdi-share-variant"
            v-bind="props"
            variant="text"
            color="primary"
          ></v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useNotificationStore } from "@/stores/notificationStore";

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  insights: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  filterContext: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["refresh"]);
const notificationStore = useNotificationStore();

// Format the AI insights to enhance the HTML provided by AI
const formattedInsights = computed(() => {
  if (!props.insights) return "";

  let formatted = props.insights
    // Add custom CSS classes to HTML elements
    .replace(
      /<h3>/g,
      '<h3 class="text-h5 font-weight-medium mb-3 mt-4 primary--text">'
    )
    .replace(/<ul>/g, '<ul class="insights-list pl-4 mb-4">')
    .replace(/<li>/g, '<li class="mb-2">')
    .replace(/<p>/g, '<p class="mb-3 text-body-1">');

  return formatted;
});

const getFilterDescription = () => {
  const { timeRange, product, customer } = props.filterContext;
  let description = timeRange ? `${timeRange} months` : "";

  if (product && product !== "all") {
    description += description ? ` • ${product}` : product;
  }

  if (customer && customer !== "all") {
    description += description ? ` • ${customer}` : customer;
  }

  return description || "All Data";
};

const refreshAnalysis = () => {
  emit("refresh");
};

const retryAnalysis = () => {
  emit("refresh");
  notificationStore.add({
    message: "Retrying data analysis...",
    type: "info",
  });
};

// Watch for data changes to auto-refresh
watch(
  () => props.data,
  (newData) => {
    if (newData && newData.length > 0 && !props.insights && !props.loading) {
      refreshAnalysis();
    }
  },
  { deep: true }
);
</script>

<style scoped>
.insights-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.insights-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 4px;
}

.insights-content :deep(h3) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.insights-content :deep(strong) {
  color: var(--v-primary-base);
}

.error-container {
  background-color: rgba(244, 67, 54, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

@media (max-width: 600px) {
  .insights-content {
    max-height: 60vh;
  }
}
</style>
