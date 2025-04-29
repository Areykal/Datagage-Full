<script setup>
import { ref, onMounted, onErrorCaptured } from "vue";
import { useRoute, useRouter } from "vue-router";
import { sourceService } from "@/services/sourceService";
import PageLayout from "@/components/PageLayout.vue";
import SkeletonLoader from "@/components/SkeletonLoader.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";

const props = defineProps({
  sourceId: {
    type: String,
    required: false,
  },
});

const route = useRoute();
const router = useRouter();
const source = ref(null);
const loading = ref(true);
const error = ref(null);
const connectionStatus = ref(null);
const isDeleting = ref(false);
const isSyncing = ref(false);
const confirmDialog = ref(null);

const fetchSourceDetails = async () => {
  try {
    loading.value = true;
    const id = props.sourceId || route.params.sourceId;
    source.value = await sourceService.getSourceDetails(id);
  } catch (err) {
    error.value = "Failed to load source details";
    console.error("Source details error:", err);
  } finally {
    loading.value = false;
  }
};

const showDeleteConfirm = () => {
  confirmDialog.value.show();
};

const deleteSource = async () => {
  try {
    isDeleting.value = true;
    await sourceService.deleteSource(route.params.sourceId);
    await router.replace({ name: "sources" });
  } catch (err) {
    error.value = err.message;
    console.error("Delete source error:", err);
  } finally {
    isDeleting.value = false;
  }
};

const syncSource = async () => {
  try {
    isSyncing.value = true;
    await sourceService.syncSource(source.value.sourceId, source.value.name);
  } catch (err) {
    error.value = "Failed to sync source";
    console.error("Sync error:", err);
  } finally {
    isSyncing.value = false;
  }
};

onErrorCaptured((err, instance, info) => {
  console.error("Error captured in SourceDetail:", err);
  error.value = "An unexpected error occurred";
  return false;
});

onMounted(fetchSourceDetails);
</script>

<template>
  <ErrorBoundary :onRetry="fetchSourceDetails">
    <PageLayout
      :title="source?.name || 'Source Details'"
      :loading="loading"
      :error="error"
      :showBack="true"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="outlined"
          class="mr-2"
          @click="syncSource"
          :disabled="loading || isSyncing"
          :loading="isSyncing"
        >
          <v-icon start>mdi-sync</v-icon>
          Sync Now
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          @click="showDeleteConfirm"
          :disabled="loading || isDeleting"
        >
          Delete Source
        </v-btn>
      </template>

      <template v-if="loading">
        <SkeletonLoader type="source-details" />
      </template>

      <template v-else-if="source">
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="mb-4 source-detail-card">
              <v-card-item>
                <v-card-title>Basic Information</v-card-title>
                <v-card-text>
                  <div class="d-flex mb-2">
                    <span class="text-caption text-medium-emphasis"
                      >Source Type</span
                    >
                    <v-spacer></v-spacer>
                    <span class="font-weight-medium">{{
                      source.sourceType
                    }}</span>
                  </div>
                  <div class="d-flex mb-2">
                    <span class="text-caption text-medium-emphasis"
                      >Status</span
                    >
                    <v-spacer></v-spacer>
                    <v-chip
                      :color="
                        source.status === 'active' ? 'success' : 'warning'
                      "
                      size="small"
                      variant="tonal"
                    >
                      {{ source.status }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card-item>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card variant="outlined" class="source-detail-card">
              <v-card-item>
                <v-card-title>Configuration</v-card-title>
                <v-card-text>
                  <pre class="config-json">{{
                    JSON.stringify(source.connectionConfiguration, null, 2)
                  }}</pre>
                </v-card-text>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </PageLayout>

    <ConfirmDialog
      ref="confirmDialog"
      title="Delete Source"
      message="Are you sure you want to delete this source? This action cannot be undone."
      confirm-text="Delete"
      :loading="isDeleting"
      @confirm="deleteSource"
    />
  </ErrorBoundary>
</template>

<style scoped>
.config-json {
  background-color: #1e1e1e;
  color: #e0e0e0;
  padding: 1rem;
  border-radius: 4px;
  font-family: "Fira Code", monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.source-detail-card {
  background-color: #1e1e1e !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.text-medium-emphasis {
  color: rgba(255, 255, 255, 0.7) !important;
}
</style>
