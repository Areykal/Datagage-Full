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

      <div v-else-if="!insights && !loading && !error" class="text-center pa-5">
        <v-icon icon="mdi-database-search" size="64" color="grey"></v-icon>
        <div class="text-h6 mt-4">No insights available</div>
        <div class="text-body-2 mt-2">
          Generate insights or adjust filters.
        </div>
      </div>

      <div v-else class="insights-content" v-html="renderedHtml"></div>
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
import { marked } from 'marked'; // Import marked

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

// New computed property using marked
const renderedHtml = computed(() => {
  if (!props.insights) return '<p class="text-medium-emphasis text-center pa-4">No insights generated yet.</p>';
  try {
    // Basic sanitization (consider a more robust library like DOMPurify if needed)
    const cleanHtml = props.insights
        .replace(/<script.*?>.*?<\/script>/gi, '') // Remove script tags
        .replace(/<style.*?>.*?<\/style>/gi, '') // Remove style tags
        .replace(/on\w+=".*?"/gi, ''); // Remove on... event handlers

    // Configure marked (optional: add breaks for newlines, etc.)
    marked.setOptions({
      breaks: true, // Add <br> on single newlines
      gfm: true,    // Use GitHub Flavored Markdown
    });

    return marked.parse(cleanHtml);
  } catch (e) {
    console.error("Error parsing AI insights:", e);
    return '<p class="text-error text-center pa-4">Error displaying insights.</p>';
  }
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

.insights-content-container { /* Renamed from .insights-content */
  max-height: 70vh; /* Or adjust as needed */
  overflow-y: auto;
  padding: 0 4px; /* Add slight horizontal padding for scrollbar */
  flex-grow: 1; /* Allow content to take available space */
}

.insights-content {
  padding: 0.5rem 0.5rem; /* Increased horizontal padding */
}

/* --- Deep Styling for v-html content --- */

/* General Typography & Spacing */
.insights-content :deep(*) {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Section Styling (H4 and following content) */
.insights-content :deep(h1),
.insights-content :deep(h2),
.insights-content :deep(h3),
.insights-content :deep(h4),
.insights-content :deep(h5),
.insights-content :deep(h6) {
  margin-top: 2.5rem; /* Adjusted top margin */
  margin-bottom: 1rem; /* Adjusted bottom margin */
  font-weight: 600;
  line-height: 1.4;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  /* Remove padding-top and border-top from previous attempt */
  /* padding-top: 1rem; */
  /* border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); */
}
.insights-content :deep(h4) {
  font-size: 1.3rem; /* Slightly adjusted h4 size */
  background-color: rgba(var(--v-theme-primary), 0.08); /* Subtle primary background */
  padding: 0.5rem 1rem; /* Add padding */
  border-radius: 4px; /* Rounded corners */
  border-left: 3px solid rgb(var(--v-theme-primary)); /* Add left border */
  margin-left: -1rem; /* Offset padding to align text */
  margin-right: -1rem; /* Offset padding */
}

/* Remove top margin and border from the very first heading */
.insights-content :deep(> h1:first-child),
.insights-content :deep(> h2:first-child),
.insights-content :deep(> h3:first-child),
.insights-content :deep(> h4:first-child),
.insights-content :deep(> h5:first-child),
.insights-content :deep(> h6:first-child) {
  margin-top: 0.5rem;
  /* Remove background/border adjustments for the very first heading if it looks odd */
  /* background-color: transparent;
  padding: 0;
  border-left: none;
  margin-left: 0;
  margin-right: 0; */
}


.insights-content :deep(p) {
  font-size: 1.05rem; /* Slightly reduced from 1.1rem */
  margin-bottom: 1.1rem; /* Slightly reduced */
  line-height: 1.7; /* Slightly reduced */
}

.insights-content :deep(ul),
.insights-content :deep(ol) {
  margin-left: 0; /* Reset margin */
  margin-bottom: 1.1rem; /* Match paragraph bottom margin */
  padding-left: 2.5rem; /* Increased padding for deeper indent */
}
.insights-content :deep(li) {
  font-size: 1.05rem; /* Match paragraph font size */
  margin-bottom: 0.75rem; /* Slightly reduced */
  line-height: 1.65; /* Slightly reduced */
}
/* Add space between paragraphs and lists */
.insights-content :deep(p + ul),
.insights-content :deep(p + ol) {
  margin-top: 0.75rem; /* Adjusted space */
}
/* Add space between list items with nested lists */
.insights-content :deep(li > ul),
.insights-content :deep(li > ol) {
  margin-top: 0.75rem; /* Adjusted space */
  margin-bottom: 0.75rem; /* Adjusted space */
}


.insights-content :deep(strong) {
  font-weight: 600;
  color: rgb(var(--v-theme-primary)); /* Keep primary color for strong */
}

/* Code Blocks (Keep existing styling or adjust as needed) */
.insights-content :deep(code) {
  background-color: rgba(var(--v-theme-on-surface), 0.08); /* Slightly darker code background */
  padding: 0.2em 0.5em;
  border-radius: 4px;
  font-size: 0.875em;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.insights-content :deep(pre) {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid rgba(var(--v-border-color), 0.5); /* Subtle border for pre */
}
.insights-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  border: none;
  font-size: 0.9em;
}

/* Blockquotes */
.insights-content :deep(blockquote) {
  border-left: 3px solid rgb(var(--v-theme-primary)); /* Use primary color for border */
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-style: italic; /* Italicize blockquotes */
}

/* Error container styling */
.error-container {
  background-color: rgba(var(--v-theme-error), 0.08); /* Use theme error color */
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-error), 0.3); /* Use theme error color */
  padding: 1rem; /* Add padding */
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .insights-content-container {
    max-height: 70vh; /* Increase height slightly on mobile */
  }
  .insights-content :deep(h4) {
    font-size: 1.25rem;
    margin-top: 2rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    margin-left: -0.5rem;
    margin-right: -0.5rem;
  }
  .insights-content :deep(> h4:first-child) {
     margin-left: 0;
     margin-right: 0;
     padding-left: 0;
     padding-right: 0;
  }
  .insights-content :deep(p),
  .insights-content :deep(li) {
    font-size: 1.05rem;
  }
  .insights-content :deep(ul),
  .insights-content :deep(ol) {
    padding-left: 1.75rem; /* Adjust list indent on mobile */
  }
}
</style>
