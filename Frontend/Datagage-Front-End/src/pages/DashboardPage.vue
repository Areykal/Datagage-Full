<template>
  <PageLayout
    title="Dashboard"
    subtitle="Welcome to Datagage - Your data integration platform"
    :loading="loading"
  >
    <!-- Stats Summary Cards -->
    <v-row class="mb-6">
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
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card class="mb-6" variant="elevated">
          <v-card-title>Quick Start</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-card
                  variant="outlined"
                  class="h-100 quick-action-card"
                  @click="navigateTo('/sources/new')"
                  hover
                >
                  <v-card-item>
                    <v-avatar
                      rounded="lg"
                      class="mb-3"
                      color="primary"
                      variant="tonal"
                    >
                      <v-icon>mdi-database-plus-outline</v-icon>
                    </v-avatar>
                    <v-card-title>Connect a Source</v-card-title>
                    <v-card-subtitle>
                      Connect to your data sources to start collecting data
                    </v-card-subtitle>
                  </v-card-item>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card
                  variant="outlined"
                  class="h-100 quick-action-card"
                  @click="navigateTo('/analytics')"
                  hover
                >
                  <v-card-item>
                    <v-avatar
                      rounded="lg"
                      class="mb-3"
                      color="secondary"
                      variant="tonal"
                    >
                      <v-icon>mdi-chart-box</v-icon>
                    </v-avatar>
                    <v-card-title>View Analytics</v-card-title>
                    <v-card-subtitle>
                      Explore insights and visualizations from your data
                    </v-card-subtitle>
                  </v-card-item>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card
                  variant="outlined"
                  class="h-100 quick-action-card"
                  @click="navigateTo('/settings')"
                  hover
                >
                  <v-card-item>
                    <v-avatar
                      rounded="lg"
                      class="mb-3"
                      color="info"
                      variant="tonal"
                    >
                      <v-icon>mdi-cog-outline</v-icon>
                    </v-avatar>
                    <v-card-title>Configure Settings</v-card-title>
                    <v-card-subtitle>
                      Set up your workspace and preferences
                    </v-card-subtitle>
                  </v-card-item>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-6">
          <v-card-title>Recent Sources</v-card-title>
          <v-card-text>
            <div v-if="sources.length > 0">
              <v-list lines="two">
                <v-list-item
                  v-for="source in sources"
                  :key="source.sourceId"
                  :title="source.name"
                  :subtitle="source.sourceType"
                  :prepend-avatar="getSourceIcon(source.sourceType)"
                  :to="`/sources/${source.sourceId}`"
                >
                  <template v-slot:append>
                    <v-chip
                      size="small"
                      :color="
                        source.status === 'active' ? 'success' : 'warning'
                      "
                    >
                      {{ source.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>
            <div v-else class="py-6 text-center">
              <v-icon size="48" class="mb-2 text-medium-emphasis"
                >mdi-database-alert</v-icon
              >
              <div class="text-medium-emphasis">No data sources found</div>
              <v-btn class="mt-4" color="primary" to="/sources/new">
                Connect Your First Source
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Add Analytics Visualization -->
        <v-card v-if="analyticsStore.metabaseUrl">
          <v-card-title>Analytics Overview</v-card-title>
          <v-card-text>
            <iframe
              :src="analyticsStore.metabaseUrl"
              frameborder="0"
              width="100%"
              height="350"
              allowtransparency
            ></iframe>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-6">
          <v-card-title>System Status</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="success">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title>API Connectivity</v-list-item-title>
                <v-list-item-subtitle
                  >All systems operational</v-list-item-subtitle
                >
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="success">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title>Data Processing</v-list-item-title>
                <v-list-item-subtitle>Running normally</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="warning">mdi-alert-circle</v-icon>
                </template>
                <v-list-item-title>Advanced Analytics</v-list-item-title>
                <v-list-item-subtitle>Feature coming soon</v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-btn
              variant="tonal"
              block
              class="mt-4"
              @click="showStatusNotification"
            >
              Check System Status
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Notifications</v-card-title>
          <v-card-text>
            <div class="d-flex flex-column">
              <v-btn
                block
                color="primary"
                variant="text"
                class="mb-2 text-left justify-start"
                @click="showSuccessDemo"
              >
                <v-icon start>mdi-check-circle</v-icon>
                Success Notification Demo
              </v-btn>

              <v-btn
                block
                color="error"
                variant="text"
                class="mb-2 text-left justify-start"
                @click="showErrorDemo"
              >
                <v-icon start>mdi-alert-circle</v-icon>
                Error Notification Demo
              </v-btn>

              <v-btn
                block
                color="warning"
                variant="text"
                class="mb-2 text-left justify-start"
                @click="showWarningDemo"
              >
                <v-icon start>mdi-alert</v-icon>
                Warning Notification Demo
              </v-btn>

              <v-btn
                block
                color="info"
                variant="text"
                class="mb-2 text-left justify-start"
                @click="showInfoDemo"
              >
                <v-icon start>mdi-information</v-icon>
                Info Notification Demo
              </v-btn>

              <v-btn
                block
                variant="tonal"
                to="/demo/notifications"
                class="mt-4"
              >
                View Notification Demo
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import PageLayout from "@/components/PageLayout.vue";
import { notify } from "@/utils/notifications";
import { airbyteService } from "@/services/airbyteService";
import { useAnalyticsStore } from "@/stores/analyticsStore";

const router = useRouter();
const loading = ref(false);
const sources = ref([]);
const analyticsStore = useAnalyticsStore();

// Calculate stats from sources and analytics data
const stats = computed(() => ({
  totalSources: sources.value.length || 0,
  activeSources: sources.value.filter((s) => s.status === "active").length || 0,
  totalRecords:
    analyticsStore.salesData?.reduce(
      (acc, curr) => acc + (curr.total_orders || 0),
      0
    ) || 0,
  lastSync: analyticsStore.lastUpdated || new Date().toLocaleString(),
}));

function navigateTo(path) {
  router.push(path);
}

function getSourceIcon(sourceType) {
  const icons = {
    mysql: "https://cdn-icons-png.flaticon.com/512/5968/5968313.png",
    postgres: "https://cdn-icons-png.flaticon.com/512/5968/5968342.png",
    "google-sheets": "https://cdn-icons-png.flaticon.com/512/5968/5968472.png",
  };
  return (
    icons[sourceType] ||
    "https://cdn-icons-png.flaticon.com/512/5968/5968313.png"
  );
}

// Notification demos
function showSuccessDemo() {
  notify.success("Operation completed successfully", {
    title: "Success",
    position: "top-right",
  });
}

function showErrorDemo() {
  notify.error("An error occurred while processing your request", {
    title: "Error",
    position: "top-right",
  });
}

function showWarningDemo() {
  notify.warning("This action may have consequences", {
    title: "Warning",
    position: "top-right",
  });
}

function showInfoDemo() {
  notify.info("Here is some information about your action", {
    title: "Information",
    position: "top-right",
  });
}

function showComingSoonNotification() {
  notify.info("This feature is coming soon!", {
    title: "Coming Soon",
    timeout: 4000,
  });
}

function showStatusNotification() {
  notify.success("All systems are operational", {
    title: "System Status",
    timeout: 3000,
  });
}

// Load data
async function loadSources() {
  loading.value = true;
  try {
    const response = await airbyteService.getSources();
    sources.value = response.data || [];

    // Also load analytics data for stats calculation
    if (!analyticsStore.salesData.length) {
      await analyticsStore.fetchData();
    }
  } catch (err) {
    notify.error("Could not load data sources", {
      title: "Error",
    });
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadSources();

  // Welcome notification
  setTimeout(() => {
    notify.info("Welcome to Datagage!", {
      title: "Getting Started",
      timeout: 6000,
      position: "bottom-right",
    });
  }, 1000);
});
</script>

<style scoped>
.quick-action-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-action-card:hover {
  transform: translateY(-5px);
}

.h-100 {
  height: 100%;
}

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
