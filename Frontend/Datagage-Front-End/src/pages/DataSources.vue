<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { airbyteService } from "@/services/airbyteService";
import PageLayout from "@/components/PageLayout.vue";
import { notify } from "@/utils/notifications";

const router = useRouter();
const route = useRoute();
const sources = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchSources = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await airbyteService.getSources();
    await nextTick(); // Wait for DOM update
    sources.value = response.data || [];

    if (sources.value.length === 0) {
      notify.info(
        "No data sources found. Add your first data source to get started.",
        {
          position: "bottom-center",
          timeout: 8000,
        }
      );
    }
  } catch (err) {
    error.value = err.message;
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
</script>

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
        class="px-6"
      >
        Add Source
      </v-btn>
    </template>

    <v-row v-if="!loading && !error">
      <v-col v-if="!sources.length" cols="12">
        <v-card class="empty-state pa-12 text-center">
          <v-icon size="64" color="primary" class="mb-4">
            mdi-database-plus-outline
          </v-icon>
          <h3 class="text-h5 mb-2">No data sources yet</h3>
          <p class="text-medium-emphasis mb-6">
            Get started by adding your first data source
          </p>
          <v-btn
            color="primary"
            size="large"
            @click="createNewSource"
            class="px-6"
          >
            Add Your First Source
          </v-btn>
        </v-card>
      </v-col>

      <v-row>
        <v-col
          v-for="source in sources"
          :key="source.sourceId"
          cols="12"
          xs="12"
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
            <v-card-item>
              <template v-slot:prepend>
                <v-avatar
                  color="primary"
                  variant="tonal"
                  size="48"
                  class="source-icon"
                >
                  <v-icon size="24">mdi-database-outline</v-icon>
                </v-avatar>
              </template>
              <v-card-title class="text-truncate">{{
                source.name
              }}</v-card-title>
              <v-card-subtitle>{{ source.sourceType }}</v-card-subtitle>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </v-row>
  </PageLayout>
</template>

<style scoped>
.sources-container {
  animation: fadeIn 0.5s ease-out;
}

.source-card {
  background-color: var(--dark-surface) !important;
  border: 1px solid var(--dark-border) !important;
  transition: all 0.3s ease;
}

.source-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.25) !important;
}

.source-icon {
  transition: transform 0.3s ease;
}

.source-card:hover .source-icon {
  transform: scale(1.1);
}

.empty-state {
  background: linear-gradient(145deg, var(--dark-surface), #1a1a1a) !important;
  border: 1px solid var(--dark-border) !important;
}

.source-column {
  padding: clamp(0.5rem, 1vw, 1rem);
}

@media (max-width: 600px) {
  .source-card {
    margin-bottom: 1rem;
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
