<template>
  <PageLayout
    title="Add New Data Source"
    subtitle="Select a source type to connect your data"
    :loading="loading"
    :error="error"
    showBack
  >
    <v-row>
      <v-col
        v-for="sourceType in sourceTypes"
        :key="sourceType.type"
        cols="12"
        sm="6"
        md="4"
        class="source-type-column"
      >
        <v-card
          @click="selectSourceType(sourceType)"
          class="source-type-card"
          elevation="0"
          :ripple="false"
          hover
        >
          <div class="source-type-shimmer"></div>
          
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar
                color="primary"
                variant="tonal"
                size="56"
                class="source-icon"
              >
                <v-icon size="28">{{ getSourceIcon(sourceType.type) }}</v-icon>
              </v-avatar>
            </template>
            
            <v-card-title class="text-h6 mb-2 source-type-title">
              {{ sourceType.name }}
            </v-card-title>
            
            <v-card-subtitle class="source-type-subtitle">
              {{ sourceType.description }}
            </v-card-subtitle>
          </v-card-item>
          
          <v-card-actions class="source-type-actions">
            <v-spacer></v-spacer>
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              class="select-btn"
            >
              Select
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row v-if="sourceTypes.length === 0 && !loading">
      <v-col cols="12" class="text-center py-12">
        <v-avatar color="primary" variant="tonal" size="80" class="mb-6">
          <v-icon size="48">mdi-database-search</v-icon>
        </v-avatar>
        
        <h3 class="text-h5 mb-2">No source types available</h3>
        <p class="text-body-1 text-medium-emphasis text-center mb-6 max-width-sm mx-auto">
          Please check your connection or try refreshing the page
        </p>
        
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          @click="refreshSourceTypes"
        >
          Refresh Source Types
        </v-btn>
      </v-col>
    </v-row>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { airbyteService } from "@/services/airbyteService";
import PageLayout from "@/components/PageLayout.vue";

const router = useRouter();
const sourceTypes = ref([]);
const loading = ref(true);
const error = ref(null);

const loadSourceTypes = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const types = await airbyteService.getSourceTypes();
    if (!Array.isArray(types)) {
      throw new Error("Invalid source types data");
    }
    sourceTypes.value = types;
  } catch (err) {
    error.value = `Failed to load source types: ${
      err.response?.data?.error || err.message
    }`;
    console.error("Source types error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(loadSourceTypes);

const refreshSourceTypes = () => {
  loadSourceTypes();
};

const selectSourceType = (sourceType) => {
  router.push({
    name: "source-config",
    params: { sourceType: sourceType.type },
  });
};

const getSourceIcon = (type) => {
  const icons = {
    "google-sheets": "mdi-google-spreadsheet",
    "file": "mdi-file-delimited", 
    "csv": "mdi-file-delimited",    // Add this for consistency with backend
    "excel": "mdi-microsoft-excel", // Add Excel icon
    "mysql": "mdi-database",
    "postgres": "mdi-database-outline"
  };
  return icons[type] || "mdi-database";
};
</script>

<style scoped>
.source-type-column {
  padding: 12px;
}

.source-type-card {
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  /* MODIFIED: Use theme surface color */
  background-color: rgb(var(--v-theme-surface)) !important;
  /* MODIFIED: Use theme border variables */
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  border-radius: 12px !important;
}

.source-type-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.03) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(-100%);
  animation: shimmer 5s infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  20%, 100% {
    transform: translateX(100%);
  }
}

.source-type-card:hover {
  transform: translateY(-8px);
  border-color: rgba(99, 102, 241, 0.4) !important;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4) !important;
}

.source-icon {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1)) !important;
  border: 2px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.5s ease;
}

.source-type-card:hover .source-icon {
  transform: scale(1.15) rotate(10deg);
}

.source-type-title {
  font-weight: 600;
  transition: color 0.3s ease;
}

.source-type-subtitle {
  color: rgba(255, 255, 255, 0.6) !important;
  transition: color 0.3s ease;
}

.source-type-card:hover .source-type-title {
  color: var(--v-primary-base);
}

.source-type-card:hover .source-type-subtitle {
  color: rgba(255, 255, 255, 0.8) !important;
}

.source-type-actions {
  padding: 8px 16px 16px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.source-type-card:hover .source-type-actions {
  opacity: 1;
  transform: translateY(0);
}

.select-btn {
  background: rgba(99, 102, 241, 0.2);
  transition: all 0.3s ease;
}

.select-btn:hover {
  background: rgba(99, 102, 241, 0.4);
}

.max-width-sm {
  max-width: 400px;
}
</style>
