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
      >
        <v-card
          @click="selectSourceType(sourceType)"
          class="source-type-card"
          elevation="0"
          :ripple="false"
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
                <v-icon size="24">{{ getSourceIcon(sourceType.type) }}</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 mb-2">{{
              sourceType.name
            }}</v-card-title>
            <v-card-subtitle>{{ sourceType.description }}</v-card-subtitle>
          </v-card-item>
        </v-card>
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

onMounted(async () => {
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
});

const selectSourceType = (sourceType) => {
  router.push({
    name: "source-config",
    params: { sourceType: sourceType.type },
  });
};

const getSourceIcon = (type) => {
  const icons = {
    "google-sheets": "mdi-google-spreadsheet",
    file: "mdi-file-delimited",
    mysql: "mdi-database",
    postgres: "mdi-database"
  };
  return icons[type] || "mdi-database";
};
</script>

<style scoped>
.source-type-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.source-type-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05) !important;
}

.source-icon {
  transition: transform 0.3s ease;
}

.source-type-card:hover .source-icon {
  transform: scale(1.1);
}
</style>
