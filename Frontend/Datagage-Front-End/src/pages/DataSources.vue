<template>
  <PageLayout
    title="Data Sources"
    subtitle="Manage your data connections"
    :loading="loading"
    :error="error"
  >
    <template #actions>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="createNewSource"
        size="large"
        elevation="1"
        class="px-6 add-source-btn"
      >
        Add Source
      </v-btn>
    </template>

    <v-row v-if="sources.length > 0" class="sources-container">
      <v-col
        v-for="source in sources"
        :key="source.sourceId"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        class="source-column"
      >
        <v-card
          :to="`/sources/${source.sourceId}`"
          class="source-card"
          variant="elevated"
          elevation="1"
          hover
        >
          <div class="source-card-content">
            <v-avatar
              color="primary"
              variant="tonal"
              size="48"
              class="source-icon mb-3"
            >
              <v-icon size="24">{{ getSourceIcon(source.sourceType) }}</v-icon>
            </v-avatar>
            
            <v-card-title class="text-truncate source-title">
              {{ source.name }}
            </v-card-title>
            
            <div class="source-metadata">
              <v-chip
                :color="source.status === 'active' ? 'success' : 'warning'"
                size="small"
                class="status-chip mr-2"
                variant="tonal"
              >
                <v-icon size="14" start>
                  {{ source.status === 'active' ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                </v-icon>
                {{ source.status }}
              </v-chip>
              
              <v-chip
                size="small"
                class="type-chip"
                color="primary"
                variant="flat"
              >
                {{ source.sourceType }}
              </v-chip>
            </div>
            
            <div class="source-stats mt-3">
              <span class="source-stat">
                <v-icon size="16" color="info">mdi-calendar-clock</v-icon>
                <span class="ml-1 text-caption text-medium-emphasis">
                  {{ formatDate(source.lastSync) || "Never synced" }}
                </span>
              </span>
            </div>
          </div>
          
          <div class="source-card-overlay">
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              class="view-details-btn"
            >
              View Details
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else class="empty-state mt-4">
      <v-card-text class="d-flex flex-column align-center py-12">
        <v-avatar color="primary" variant="tonal" size="80" class="mb-6">
          <v-icon size="48">mdi-database-plus-outline</v-icon>
        </v-avatar>
        
        <h3 class="text-h5 mb-2">No data sources yet</h3>
        <p class="text-body-1 text-medium-emphasis text-center mb-6 max-width-sm">
          Connect to your first data source to start analyzing your data
        </p>
        
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          @click="createNewSource"
        >
          Add Your First Source
        </v-btn>
      </v-card-text>
    </v-card>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import PageLayout from "@/components/PageLayout.vue";
import { sourceService } from "@/services/sourceService";
import { notify } from "@/utils/notifications";

const router = useRouter();
const sources = ref([]);
const loading = ref(true);
const error = ref(null);

// Fetch all sources
const fetchSources = async () => {
  loading.value = true;
  sources.value = [];

  try {
    sources.value = await sourceService.getSources();
  } catch (err) {
    error.value = "Failed to load data sources";
    notify.error("Failed to load data sources", {
      title: "Error",
    });
    console.error("Error fetching sources:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchSources);

const createNewSource = () => {
  router.push("/sources/new");
};

const getSourceIcon = (sourceType) => {
  const icons = {
    "google-sheets": "mdi-google-spreadsheet",
    file: "mdi-file-delimited",
    mysql: "mdi-database",
    postgres: "mdi-database-outline"
  };
  return icons[sourceType] || "mdi-database-outline";
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString();
};
</script>

<style scoped>
.sources-container {
  animation: fadeIn 0.5s ease-out;
}

.source-column {
  padding: clamp(0.5rem, 1vw, 1rem);
}

.source-card {
  height: 100%;
  min-height: 200px; /* Set minimum height to prevent collapsing */
  background-color: rgba(37, 37, 37, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;
  overflow: hidden;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.source-card-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 200px; /* Match min-height of card */
  padding-bottom: 60px; /* Add extra padding at the bottom to prevent overlap with overlay */
}

.source-card:hover {
  transform: translateY(-6px);
  border-color: rgba(99, 102, 241, 0.4) !important;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4) !important;
}

.source-icon {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1)) !important;
  border: 2px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.4s ease;
}

.source-card:hover .source-icon {
  transform: scale(1.15) rotate(10deg);
}

.source-title {
  font-weight: 600;
  line-height: 1.3;
  font-size: 1.1rem;
  margin-bottom: 8px;
  width: 100%; /* Full width for proper truncation */
  overflow: hidden; /* Prevent text overflow */
  text-overflow: ellipsis; /* Add ellipsis for overflowing text */
  white-space: nowrap; /* Keep title on one line */
}

.source-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.source-stats {
  margin-top: auto;
  font-size: 0.85rem;
  color: var(--text-secondary-color);
  z-index: 1; /* Ensure stats are above the overlay gradient */
  position: relative; /* Enable z-index */
}

.source-stat {
  display: inline-flex;
  align-items: center;
}

.source-card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px;
  background: linear-gradient(to top, rgba(30, 30, 30, 0.95) 0%, rgba(30, 30, 30, 0.8) 50%, rgba(30, 30, 30, 0) 100%);
  display: flex;
  justify-content: center;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  height: 60px; /* Set fixed height for overlay */
}

.source-card:hover .source-card-overlay {
  transform: translateY(0);
}

.empty-state {
  background: linear-gradient(145deg, rgba(37, 37, 37, 0.8), rgba(30, 30, 30, 0.9)) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
  backdrop-filter: blur(5px) !important;
  transition: all 0.3s ease;
}

.empty-state:hover {
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

.add-source-btn {
  background: linear-gradient(45deg, var(--v-primary-base), rgba(99, 102, 241, 0.8)) !important;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3) !important;
  transition: all 0.3s ease;
}

.add-source-btn:hover {
  box-shadow: 0 6px 25px rgba(99, 102, 241, 0.5) !important;
  transform: translateY(-2px);
}

.view-details-btn {
  white-space: nowrap;
}

.max-width-sm {
  max-width: 400px;
}

@media (max-width: 600px) {
  .source-card {
    margin-bottom: 1rem;
  }
  
  .source-card-overlay {
    transform: translateY(0);
    background: linear-gradient(to top, rgba(30, 30, 30, 0.7) 0%, rgba(30, 30, 30, 0) 100%);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
