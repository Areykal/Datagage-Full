<template>
  <PageLayout :title="source ? source.name : 'Data Source'"
    :subtitle="source ? `Source details for ${source.sourceType}` : ''" :loading="loading" :error="error" showBack>
    <v-alert v-if="!source && !loading && !error" type="warning" variant="tonal" class="mb-6">
      Source not found or still loading.
    </v-alert>

    <template v-if="source">
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="mb-6 h-100 source-info-card">
            <v-card-title class="source-card-title">Source Information</v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-avatar color="primary" variant="tonal" size="56" class="mr-3 source-avatar">
                  <SafeIcon :icon="getSourceIconSafe()" size="28" />
                </v-avatar>
                <div>
                  <div class="text-h6">{{ source.name }}</div>
                  <div class="text-subtitle-2 source-type-badge">
                    <v-chip size="small" variant="flat" color="primary"
                      class="text-caption text-uppercase font-weight-medium">
                      {{ source.sourceType }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <v-divider class="mb-4"></v-divider>

              <div class="info-row mb-3">
                <strong>Source ID:</strong>
                <span class="text-medium-emphasis source-id ml-2">{{ source.sourceId }}</span>
              </div>

              <div class="info-row mb-3">
                <strong>Created:</strong>
                <span class="text-medium-emphasis ml-2">{{ formatDate(source.createdAt) }}</span>
              </div>

              <div class="d-flex mt-6">
                <v-btn color="error" variant="outlined" prepend-icon="mdi-trash-can-outline" class="delete-button"
                  @click="confirmDelete">
                  Delete Source
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card class="mb-6 connection-card">
            <v-card-title class="source-card-title">Connection Configuration</v-card-title>
            <v-card-text>
              <v-list class="config-list">
                <v-list-item v-if="Object.keys(source.connectionConfiguration || {}).length === 0">
                  <v-list-item-title>No configuration details available</v-list-item-title>
                </v-list-item>
                <v-list-item v-for="(value, key) in source.connectionConfiguration" :key="key" class="config-list-item">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-cog-outline" class="config-icon"></v-icon>
                  </template>
                  <v-list-item-title class="config-key">{{ formatKey(key) }}</v-list-item-title>
                  <v-list-item-subtitle class="config-value">
                    <!-- MASK SENSITIVE VALUES -->
                    {{ isSensitiveKey(key) ? "••••••••" : value }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <v-card class="actions-card">
            <v-card-title class="source-card-title">Actions</v-card-title>
            <v-card-text>
              <div class="d-flex flex-wrap gap-3">
                <v-btn color="primary" prepend-icon="mdi-sync" class="action-button" @click="syncSource"
                  :loading="syncing">
                  Sync Now
                </v-btn>

                <v-btn color="secondary" prepend-icon="mdi-pencil" class="action-button" @click="editSource">
                  Edit Configuration
                </v-btn>
              </div>

              <v-expand-transition>
                <div v-if="syncing" class="mt-4 sync-progress">
                  <v-progress-linear indeterminate color="primary" class="mb-2"></v-progress-linear>
                  <div class="text-caption text-center">Synchronizing data...</div>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Delete confirmation dialog -->
      <v-dialog v-model="deleteDialog" max-width="500" class="delete-dialog">
        <v-card>
          <v-card-title class="text-h5 delete-dialog-title">
            <v-icon color="error" size="28" class="mr-2">mdi-alert-circle</v-icon>
            Delete Data Source
          </v-card-title>
          <v-card-text class="delete-dialog-content">
            Are you sure you want to delete <strong>{{ source.name }}</strong>? This action cannot be undone.
          </v-card-text>
          <v-card-actions class="delete-dialog-actions">
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="deleteSource" :loading="deleting">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { sourceService } from "@/services/sourceService";
import PageLayout from "@/components/PageLayout.vue";
import { notify } from "@/utils/notifications";
import SafeIcon from "@/components/SafeIcon.vue";

const route = useRoute();
const router = useRouter();
const sourceId = computed(() => route.params.id || route.params.sourceId);

const source = ref(null);
const loading = ref(true);
const error = ref(null);
const syncing = ref(false);
const deleting = ref(false);
const deleteDialog = ref(false);

// Source icon mapping - matches the structure from the console output
const SOURCE_ICONS = {
  "google-sheets": "mdi-google-spreadsheet",
  file: "mdi-file-delimited",
  mysql: "mdi-database",
  postgres: "mdi-database-outline"
};

// Safe getter function for source icon
const getSourceIconSafe = () => {
  const sourceType = source.value?.sourceType;
  return sourceType && SOURCE_ICONS[sourceType]
    ? SOURCE_ICONS[sourceType]
    : "mdi-database-outline";
};

// Format camelCase or snake_case keys to Title Case
const formatKey = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
};

// Format date (handle Unix timestamp in seconds)
const formatDate = (timestamp) => {
  if (!timestamp) return "Not available";
  // Convert seconds to milliseconds
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

// Check if a configuration key is sensitive
const SENSITIVE_KEYS = ['password', 'secret', 'token', 'key', 'apiKey', 'clientSecret'];
const isSensitiveKey = (key) => {
  if (!key) return false; // Handle cases where key might be undefined
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive));
};


// Fetch source details
const fetchSource = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await sourceService.getSourceDetails(sourceId.value);
    source.value = response;

    // Check if sourceType exists
    if (!source.value.sourceType && source.value.connectionConfiguration?.sourceType) {
      source.value.sourceType = source.value.connectionConfiguration.sourceType;
    }
  } catch (err) {
    error.value = "Failed to load source details";
  } finally {
    loading.value = false;
  }
};

// Actions
const syncSource = async () => {
  syncing.value = true;
  try {
    await sourceService.syncSource(sourceId.value, source.value.name);
    notify.success(`Source "${source.value.name}" synchronization started`, {
      title: "Sync Started"
    });

    // Simulate success after delay for demo
    setTimeout(() => {
      notify.success(`Source "${source.value.name}" synchronized successfully`, {
        title: "Sync Complete"
      });
      syncing.value = false;
    }, 3000);

  } catch (err) {
    error.value = "Failed to sync source";
    notify.error("Failed to sync source: " + (err.message || "Unknown error"));
    syncing.value = false;
  }
};

const editSource = () => {
  // This would navigate to an edit page in a real implementation
  notify.info("Edit functionality coming soon");
};

const confirmDelete = () => {
  deleteDialog.value = true;
};

const deleteSource = async () => {
  deleting.value = true;
  try {
    await sourceService.deleteSource(sourceId.value);
    deleteDialog.value = false;
    router.push("/sources");
  } catch (err) {
    error.value = "Failed to delete source";
    notify.error("Failed to delete source: " + (err.message || "Unknown error"));
    deleteDialog.value = false;
  } finally {
    deleting.value = false;
  }
};

onMounted(fetchSource);
</script>

<style scoped>
/* Source Info Card Styling */
.source-info-card,
.connection-card,
.actions-card {
  /* MODIFIED: Use theme surface color */
  background: linear-gradient(145deg, rgba(var(--v-theme-surface), 0.9), rgba(var(--v-theme-surface), 0.95)) !important;
  /* MODIFIED: Use theme border variables */
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
  backdrop-filter: blur(5px) !important;
  transition: all 0.3s ease;
}

.source-info-card:hover,
.connection-card:hover,
.actions-card:hover {
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.source-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 12px;
}

.source-card-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, var(--v-primary-base), transparent);
  border-radius: 3px;
}

.source-avatar {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1)) !important;
  border: 2px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.source-avatar:hover {
  transform: scale(1.05) rotate(5deg);
}

.status-container,
.info-row {
  display: flex;
  align-items: center;
}

.source-id {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 0.85rem;
}

.status-chip {
  font-weight: 500;
}

/* Configuration Styling */
.config-list {
  padding: 0;
}

.config-list-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  min-height: 60px;
  /* Ensure minimum height for items */
  padding: 8px 0;
  /* Add consistent padding */
}

.config-list-item :deep(.v-list-item__content) {
  overflow: hidden;
  /* Prevent content overflow */
}

.config-key {
  font-weight: 500;
  font-size: 0.95rem;
  white-space: nowrap;
  /* Prevent line breaks */
  overflow: hidden;
  /* Hide overflow */
  text-overflow: ellipsis;
  /* Add ellipsis for long text */
}

.config-value {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 0.85rem !important;
  overflow: hidden;
  /* Hide overflow */
  text-overflow: ellipsis;
  /* Add ellipsis for long text */
  max-width: 100%;
  /* Ensure text doesn't extend beyond container */
  word-break: break-word;
  /* Allow breaking long words */
}

/* Actions Styling */
.action-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.action-button::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-button:hover::after {
  opacity: 1;
}

.action-button:active::after {
  opacity: 0.5;
}

.sync-progress {
  animation: fadeIn 0.3s ease;
}

/* Delete Dialog Styling */
.delete-dialog :deep(.v-card) {
  background: linear-gradient(145deg, rgba(37, 37, 37, 0.95), rgba(30, 30, 30, 0.98)) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
}

.delete-dialog-title {
  color: #ff4d4d;
}

.delete-dialog-content {
  padding: 20px 0;
}

.delete-dialog-actions {
  padding: 16px !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Responsiveness */
@media (max-width: 960px) {
  .source-info-card {
    margin-bottom: 16px !important;
  }
}
</style>
