<template>
  <ErrorBoundary @retry="handleRetry">
    <PageLayout
      title="Dashboard"
      subtitle="Overview of your data infrastructure"
      :loading="loading"
      :error="error"
    >
      <!-- Add DataFilters component -->
      <DataFilters />

      <v-row>
        <!-- Summary Cards -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="dashboard-card">
            <v-card-item>
              <v-card-title>Total Sources</v-card-title>
              <div class="text-h4">{{ stats.totalSources || 0 }}</div>
            </v-card-item>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="dashboard-card">
            <v-card-item>
              <v-card-title>Active Sources</v-card-title>
              <div class="text-h4">{{ stats.activeSources || 0 }}</div>
            </v-card-item>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="dashboard-card">
            <v-card-item>
              <v-card-title>Total Records</v-card-title>
              <div class="text-h4">{{ stats.totalRecords || 0 }}</div>
            </v-card-item>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="dashboard-card">
            <v-card-item>
              <v-card-title>Last Sync</v-card-title>
              <div class="text-subtitle-1">{{ stats.lastSync || "Never" }}</div>
            </v-card-item>
          </v-card>
        </v-col>

        <!-- Add Metabase visualization -->
        <v-col cols="12">
          <v-card class="dashboard-card">
            <v-card-title>Sales Analytics</v-card-title>
            <v-card-text>
              <iframe
                v-if="store.metabaseUrl"
                :src="store.metabaseUrl"
                frameborder="0"
                width="100%"
                height="600"
                allowtransparency
              ></iframe>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Add AI Insights -->
        <v-col cols="12">
          <v-card class="dashboard-card">
            <v-card-title>AI Insights</v-card-title>
            <v-card-text>
              <div class="text-body-1" v-html="store.aiInsights"></div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Placeholder for future widgets -->
        <v-col cols="12">
          <v-card class="dashboard-card">
            <v-card-title>Recent Activity</v-card-title>
            <v-card-text>
              <div class="text-subtitle-1">Coming soon...</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </PageLayout>
  </ErrorBoundary>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from "vue";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import PageLayout from "@/components/PageLayout.vue";
import DataFilters from "@/components/DataFilters.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";
import { notify } from "@/utils/notifications";

const store = useAnalyticsStore();
const { loading, error } = store;

const stats = computed(() => ({
  totalSources: store.salesData.length || 0,
  activeSources: store.salesData.filter((s) => s.total_revenue > 0).length || 0,
  totalRecords:
    store.salesData.reduce((acc, curr) => acc + curr.total_orders, 0) || 0,
  lastSync: new Date().toLocaleString(),
}));

onMounted(async () => {
  try {
    if (!store.salesData.length) {
      await store.fetchData();
      notify.success("Dashboard data loaded successfully");
    }
  } catch (err) {
    notify.error("Error loading dashboard data");
  }
});

onUnmounted(() => {
  // Clear sensitive data but keep cached results
  store.$reset();
});

const handleRetry = async () => {
  try {
    await store.fetchData(true); // Force refresh
    notify.success("Data refreshed successfully");
  } catch (err) {
    notify.error("Failed to refresh data");
  }
};
</script>

<style scoped>
.dashboard-card {
  background: var(--surface-color) !important;
  border: 1px solid var(--border-color) !important;
  transition: all 0.3s ease;
  color: var(--text-primary-color) !important;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.25);
}
</style>
