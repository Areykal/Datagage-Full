<script setup>
import { onMounted, ref } from "vue";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import DataFilters from "@/components/DataFilters.vue";
import ETLMonitor from "@/components/ETLMonitor.vue";
import ETLStatusWidget from "@/components/ETLStatusWidget.vue";

const analyticsStore = useAnalyticsStore();
const selectedFilters = ref({
  timeRange: 12,
  product: "all",
  customer: "all",
});

const quickActions = ref([
  {
    title: "Add Source",
    icon: "mdi-database-plus-outline",
    color: "primary",
    to: "/sources/new",
  },
  {
    title: "View Sources",
    icon: "mdi-database-outline",
    color: "secondary",
    to: "/sources",
  },
  {
    title: "Analytics",
    icon: "mdi-chart-bar",
    color: "info",
    to: "/analytics",
  },
  {
    title: "Settings",
    icon: "mdi-cog-outline",
    color: "default",
    to: "/settings",
  },
]);

const activities = ref([
  {
    id: 1,
    title: "New data source connected",
    timestamp: "5 minutes ago",
    icon: "mdi-database-plus",
    iconColor: "success",
  },
  {
    id: 2,
    title: "Source sync completed",
    timestamp: "1 hour ago",
    icon: "mdi-sync",
    iconColor: "info",
  },
  {
    id: 3,
    title: "System update installed",
    timestamp: "Yesterday",
    icon: "mdi-update",
    iconColor: "primary",
  },
]);

onMounted(() => {
  loadAnalytics();
});

const loadAnalytics = () => {
  analyticsStore.fetchSalesAnalysis(selectedFilters.value.timeRange);
};

const handleFiltersApplied = (filters) => {
  selectedFilters.value = { ...filters };
  loadAnalytics();
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <DataFilters
          :initial-filters="selectedFilters"
          @apply-filters="handleFiltersApplied"
        />        <v-card class="mb-6">
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="action in quickActions"
                :key="action.title"
                cols="6"
                md="3"
              >
                <v-btn
                  :prepend-icon="action.icon"
                  :color="action.color"
                  variant="tonal"
                  block
                  class="text-none py-3"
                  :to="action.to"
                >
                  {{ action.title }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-row class="mb-6">
          <v-col cols="12" md="8">
            <v-card height="100%">
              <v-card-title>System Status</v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-alert
                      color="success"
                      icon="mdi-check-circle"
                      variant="tonal"
                      density="compact"
                      border="start"
                      class="mb-3"
                    >
                      All systems operational
                    </v-alert>
                    <v-alert
                      color="info"
                      icon="mdi-information"
                      variant="tonal"
                      density="compact"
                      border="start"
                    >
                      Last system check: {{ new Date().toLocaleString() }}
                    </v-alert>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-list density="compact" lines="two">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="success">mdi-database-check</v-icon>
                        </template>
                        <v-list-item-title>Database Connection</v-list-item-title>
                        <v-list-item-subtitle>Connected</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="success">mdi-api</v-icon>
                        </template>
                        <v-list-item-title>API Services</v-list-item-title>
                        <v-list-item-subtitle>Online</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <ETLStatusWidget />
          </v-col>
        </v-row>

        <v-card>
          <v-card-title>Recent Activities</v-card-title>
          <v-card-text>
            <v-list v-if="activities.length > 0" lines="two">
              <v-list-item v-for="activity in activities" :key="activity.id">
                <template v-slot:prepend>
                  <v-avatar
                    :color="activity.iconColor"
                    variant="tonal"
                    size="36"
                  >
                    <v-icon :icon="activity.icon"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ activity.title }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  activity.timestamp
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else class="text-center pa-4">
              <v-icon size="48" color="primary" class="mb-2"
                >mdi-information-outline</v-icon
              >
              <div>No recent activities</div>
            </div>
          </v-card-text>
        </v-card>        <!-- ETL Process Monitor -->
        <ETLMonitor />
        
        <v-card v-if="analyticsStore.salesData?.length" class="mt-4">
          <v-card-title>
            <v-icon start class="mr-2">mdi-chart-timeline-variant</v-icon>
            Sales Analytics Overview
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="analyticsStore.error"
              type="error"
              :text="analyticsStore.error"
              prepend-icon="mdi-alert-circle"
            ></v-alert>

            <v-progress-circular
              v-if="analyticsStore.loading"
              indeterminate
              color="primary"
            ></v-progress-circular>

            <v-row v-else>
              <v-col
                v-for="(data, index) in analyticsStore.salesData"
                :key="index"
                cols="12"
                md="4"
              >
                <v-card>
                  <v-card-title class="text-subtitle-1">
                    {{ data.region }} - {{ data.product }}
                  </v-card-title>
                  <v-card-text>
                    <p>
                      <v-icon size="small" class="mr-1">mdi-cash</v-icon>
                      Revenue: ${{ data.total_revenue }}
                    </p>
                    <p>
                      <v-icon size="small" class="mr-1">mdi-cart</v-icon>
                      Orders: {{ data.total_orders }}
                    </p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-card v-if="analyticsStore.aiInsights" class="mt-4">
              <v-card-title>
                <v-icon start class="mr-2">mdi-chart-areaspline</v-icon>
                AI Analysis
              </v-card-title>
              <v-card-text>
                <div v-html="analyticsStore.aiInsights"></div>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
