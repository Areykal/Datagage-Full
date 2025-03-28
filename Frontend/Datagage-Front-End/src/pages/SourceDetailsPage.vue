<template>
  <PageLayout
    :title="source ? source.name : 'Data Source'"
    :subtitle="source ? `Source details for ${source.sourceType}` : ''"
    :loading="loading"
    :error="error"
    showBack
  >
    <v-alert
      v-if="!source && !loading && !error"
      type="warning"
      variant="tonal"
      class="mb-6"
    >
      Source not found or still loading.
    </v-alert>

    <template v-if="source">
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="mb-6 h-100">
            <v-card-title>Source Information</v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-avatar
                  color="primary"
                  variant="tonal"
                  size="48"
                  class="mr-3"
                >
                  <SafeIcon :icon="getSourceIconSafe()" size="24" />
                </v-avatar>
                <div>
                  <div class="text-h6">{{ source.name }}</div>
                  <div class="text-subtitle-2">{{ source.sourceType }}</div>
                </div>
              </div>

              <v-divider class="mb-4"></v-divider>

              <div class="mb-2">
                <strong>Status:</strong>
                <v-chip
                  :color="source.status === 'active' ? 'success' : 'warning'"
                  size="small"
                  class="ml-2"
                >
                  {{ source.status }}
                </v-chip>
              </div>

              <div class="mb-2">
                <strong>Source ID:</strong>
                <span class="text-medium-emphasis ml-2">{{
                  source.sourceId
                }}</span>
              </div>

              <div class="d-flex mt-6">
                <v-btn color="error" @click="confirmDelete"
                  >Delete Source</v-btn
                >
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card class="mb-6">
            <v-card-title>Connection Configuration</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-if="
                    Object.keys(source.connectionConfiguration || {}).length ===
                    0
                  "
                >
                  <v-list-item-title
                    >No configuration details available</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  v-for="(value, key) in source.connectionConfiguration"
                  :key="key"
                >
                  <template v-slot:prepend>
                    <v-icon icon="mdi-cog-outline"></v-icon>
                  </template>
                  <v-list-item-title>{{ formatKey(key) }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ key === "password" ? "••••••••" : value }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title>Actions</v-card-title>
            <v-card-text>
              <v-btn
                color="primary"
                class="mr-3"
                prepend-icon="mdi-sync"
                @click="syncSource"
                :loading="syncing"
              >
                Sync Now
              </v-btn>

              <v-btn
                color="secondary"
                prepend-icon="mdi-pencil"
                @click="editSource"
              >
                Edit Configuration
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Delete confirmation dialog -->
      <v-dialog v-model="deleteDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5">Delete Data Source</v-card-title>
          <v-card-text>
            Are you sure you want to delete <strong>{{ source.name }}</strong
            >? This action cannot be undone.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="deleteDialog = false"
              >Cancel</v-btn
            >
            <v-btn color="error" @click="deleteSource" :loading="deleting"
              >Delete</v-btn
            >
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
const sourceId = computed(() => route.params.id);

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
  } catch (err) {
    error.value = "Failed to sync source"; 
    notify.error("Failed to sync source: " + (err.message || "Unknown error"));
  } finally {
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
/* No special styles needed, using Vuetify components */
</style>
