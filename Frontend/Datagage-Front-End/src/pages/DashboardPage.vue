<template>
  <PageLayout title="Dashboard" subtitle="Executive overview of your business performance"
    :loading="analyticsStore.dataLoading" :error="analyticsStore.error" @clearError="analyticsStore.error = null">
    <template #actions>
      <v-btn color="primary" variant="outlined" prepend-icon="mdi-chart-bar" to="/analytics" class="mr-2">
        Detailed Analytics
      </v-btn>
      <v-btn icon="mdi-refresh" variant="text" @click="refreshData" :loading="refreshing"></v-btn>
    </template>

    <!-- Main Content: Show if data exists -->
    <template v-if="analyticsStore.hasData">
      <!-- Key Metrics Row -->
      <v-row>
        <v-col v-for="(metric, i) in analyticsStore.metrics" :key="i" cols="12" sm="6" md="3">
          <v-card class="sales-metric-card h-100" variant="flat" rounded="lg">
            <v-card-text>
              <div class="d-flex flex-column">
                <span class="text-caption text-medium-emphasis mb-1">{{ metric.title }}</span>
                <span class="text-h4 font-weight-bold">{{ metric.value }}</span>
                <div v-if="metric.trend !== undefined && metric.trend !== null"
                  :class="['metric-trend', metric.trend >= 0 ? 'positive' : 'negative']">
                  <v-icon :icon="metric.trend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'" size="small"
                    class="mr-1"></v-icon>
                  <span>{{ Math.abs(metric.trend).toFixed(1) }}% vs last period</span>
                </div>
                <div v-else class="metric-trend text-medium-emphasis">
                  <span>Trend N/A</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Revenue Chart Row -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="flat" rounded="lg">
            <v-card-title class="pb-0">Revenue Trends</v-card-title>
            <v-card-subtitle class="pb-0">Monthly revenue performance</v-card-subtitle>
            <v-card-text class="pt-2">
              <v-sheet v-if="analyticsStore.dataLoading && !refreshing" height="300"
                class="d-flex align-center justify-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-sheet>
              <v-sheet v-else-if="!revenueChartData || !revenueChartData.labels || !revenueChartData.labels.length"
                height="300" class="d-flex align-center justify-center">
                <div class="text-center">
                  <v-icon icon="mdi-chart-timeline-variant" size="64" color="grey-lighten-1"></v-icon>
                  <div class="text-h6 mt-2">No revenue data available</div>
                  <div class="text-body-2 text-medium-emphasis">Try applying different filters or refreshing</div>
                </div>
              </v-sheet>
              <v-sheet v-else height="300" class="px-0">
                <TimeSeriesChart :chart-data="revenueChartData" title="Monthly Revenue" color="#4CAF50" />
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bottom Row - Now includes Business Health -->
      <v-row> <!-- Removed mt-4 -->
        <!-- Business Health -->
        <v-col cols="12" md="3"> <!-- Changed to md=3 -->
          <v-card class="h-100" variant="flat" rounded="lg">
            <v-card-title class="pb-1">Business Health</v-card-title>
            <v-card-text>
              <div class="d-flex align-center justify-center flex-column py-4">
                <v-progress-circular :model-value="businessHealthScore" :color="getBusinessHealthColor()" :size="120"
                  :width="12" class="mb-2">
                  {{ businessHealthScore }}%
                </v-progress-circular>
                <div class="text-h6 mt-2">{{ getBusinessHealthStatus() }}</div>
                <div class="text-caption text-medium-emphasis text-center mt-1">
                  Based on revenue & customer trends
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Top Products -->
        <v-col cols="12" md="3"> <!-- Changed to md=3 -->
          <v-card variant="flat" rounded="lg" class="h-100">
            <v-card-title class="pb-0">Top Products</v-card-title>
            <v-card-subtitle class="pb-0">By revenue (current period)</v-card-subtitle>
            <v-list density="compact">
              <v-list-item v-if="analyticsStore.dataLoading && !refreshing">
                <v-skeleton-loader type="list-item-avatar-two-line@4"></v-skeleton-loader>
              </v-list-item>
              <template v-else-if="topProducts.length">
                <v-list-item v-for="product in topProducts" :key="product.product" class="px-4">
                  <template v-slot:prepend>
                    <v-avatar :color="getProductColor(product)" size="32" class="text-white mr-3" rounded>
                      <span class="text-caption">{{ product.product.slice(0, 2).toUpperCase() }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ product.product }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatCurrency(product.total_revenue) }}</v-list-item-subtitle>
                  <!-- Trend data for individual products is not available in overview -->
                </v-list-item>
              </template>
              <v-list-item v-else class="text-center text-medium-emphasis py-4">
                No product data found.
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item to="/analytics" link prepend-icon="mdi-chart-bar" class="text-primary">
                View all products
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Top Customers -->
        <v-col cols="12" md="3"> <!-- Changed to md=3 -->
          <v-card variant="flat" rounded="lg" class="h-100">
            <v-card-title class="pb-0">Top Customers</v-card-title>
            <v-card-subtitle class="pb-0">By spending (current period)</v-card-subtitle>
            <v-list density="compact">
              <v-list-item v-if="analyticsStore.dataLoading && !refreshing">
                <v-skeleton-loader type="list-item-avatar-two-line@4"></v-skeleton-loader>
              </v-list-item>
              <template v-else-if="topCustomers.length">
                <v-list-item v-for="(customer, i) in topCustomers" :key="customer.customer_name" class="px-4">
                  <template v-slot:prepend>
                    <v-avatar :color="`blue-grey-lighten-${i % 5 + 1}`" size="32" class="text-white mr-3">
                      <span class="text-caption">{{ customer.customer_name.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ customer.customer_name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatCurrency(customer.total_revenue) }}</v-list-item-subtitle>
                  <!-- Trend data for individual customers is not available in overview -->
                </v-list-item>
              </template>
              <v-list-item v-else class="text-center text-medium-emphasis py-4">
                No customer data found.
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item to="/analytics" link prepend-icon="mdi-account-group" class="text-primary">
                View all customers
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Alerts & Notifications -->
        <v-col cols="12" md="3"> <!-- Changed to md=3 -->
          <v-card variant="flat" rounded="lg" class="h-100">
            <v-card-title class="pb-0">Alerts & Notifications</v-card-title>
            <v-card-subtitle class="pb-0">Requiring attention</v-card-subtitle>
            <v-list density="compact">
              <v-list-item v-if="analyticsStore.dataLoading && !refreshing">
                <v-skeleton-loader type="list-item-avatar-two-line@3"></v-skeleton-loader>
              </v-list-item>
              <template v-else-if="alerts.length">
                <v-list-item v-for="(alert, i) in alerts.slice(0, 5)" :key="i" :prepend-icon="getAlertIcon(alert.level)"
                  :title="alert.title" :subtitle="formatDate(alert.date)" class="px-4">
                  <template v-slot:append>
                    <v-chip size="small" :color="getAlertColor(alert.level)" variant="tonal">
                      {{ alert.level }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
              <v-list-item v-else class="px-4 text-center text-medium-emphasis py-4">
                <v-icon icon="mdi-check-circle" color="success" class="mr-2"></v-icon>
                <span>No alerts at this time</span>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item to="/settings/notifications" link prepend-icon="mdi-bell" class="text-primary">
                Manage notifications
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Skeleton Loaders: Show only if loading AND no data exists yet -->
    <template v-else-if="analyticsStore.dataLoading">
      <!-- Key Metrics Skeletons -->
      <v-row>
        <v-col v-for="n in 4" :key="`sk-metric-${n}`" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card-avatar"></v-skeleton-loader>
        </v-col>
      </v-row>
      <!-- Revenue Chart Skeleton -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
        </v-col>
      </v-row>
      <!-- Bottom Row Skeletons (Now 4 items) -->
      <v-row> <!-- Removed mt-4 -->
        <v-col cols="12" md="3"> <!-- Changed to md=3 -->
          <v-skeleton-loader type="image" height="200"></v-skeleton-loader> <!-- Health Skeleton -->
        </v-col>
        <v-col cols="12" md="3"> <!-- Changed to md=3 -->
          <v-skeleton-loader type="list-item-avatar-two-line@4"></v-skeleton-loader>
        </v-col>
        <v-col cols="12" md="3"> <!-- Changed to md=3 -->
          <v-skeleton-loader type="list-item-avatar-two-line@4"></v-skeleton-loader>
        </v-col>
        <v-col cols="12" md="3"> <!-- Changed to md=3 -->
          <v-skeleton-loader type="list-item-avatar-two-line@3"></v-skeleton-loader>
        </v-col>
      </v-row>
    </template>

  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useNotificationStore } from "@/stores/notificationStore";
import PageLayout from "@/components/PageLayout.vue";
import TimeSeriesChart from "@/components/TimeSeriesChart.vue";

const router = useRouter();
const analyticsStore = useAnalyticsStore();
const notificationStore = useNotificationStore();

// UI state management
const refreshing = ref(false); // For manual refresh button

// --- Computed properties based on analyticsStore --

// Get top products from store's revenueByProduct
const topProducts = computed(() => {
  return analyticsStore.revenueByProduct?.slice(0, 4) || [];
});

// Get top customers from store's customerMetrics
const topCustomers = computed(() => {
  return analyticsStore.customerMetrics?.slice(0, 4) || [];
});

// Revenue chart data - use the computed property from the store
const revenueChartData = computed(() => {
  const storeData = analyticsStore.monthlyRevenueTrend;
  if (!storeData || !storeData.labels || !storeData.labels.length) {
    return { labels: [], datasets: [] };
  }
  return storeData;
});


// Business health score calculation
// Combines trends with weights: Revenue (50%), Customers (30%), AOV (20%)
// Adjusts score based on significant positive/negative thresholds.
const businessHealthScore = computed(() => {
  let score = 50; // Neutral score
  const overview = analyticsStore.salesOverview;

  if (!overview || overview.totalRevenue === undefined) {
    return 0; // No data
  }

  const revenueTrend = overview.revenueTrend ?? 0;
  const customerTrend = overview.customersTrend ?? 0;
  const aovTrend = overview.aovTrend ?? 0;

  // Apply weighted trends
  score += revenueTrend * 0.5;
  score += customerTrend * 0.3;
  score += aovTrend * 0.2;

  // Apply threshold adjustments
  if (revenueTrend > 15) score += 10; // Strong growth bonus
  if (revenueTrend < -10) score -= 15; // Significant decline penalty
  if (customerTrend < -5) score -= 10; // Customer churn penalty

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
});


// Alerts generation
// Creates alerts based on significant negative trends in overview data.
const alerts = computed(() => {
  const alertsList = [];
  const overview = analyticsStore.salesOverview;

  if (!overview) return [];

  // Revenue Drop Alerts
  if (overview.revenueTrend !== null && overview.revenueTrend < -10) {
    alertsList.push({
      level: "Critical",
      title: `Revenue down ${Math.abs(overview.revenueTrend).toFixed(1)}%`,
      date: new Date() // Use current date for freshness
    });
  } else if (overview.revenueTrend !== null && overview.revenueTrend < -5) {
    alertsList.push({
      level: "Warning",
      title: `Revenue down ${Math.abs(overview.revenueTrend).toFixed(1)}%`,
      date: new Date()
    });
  }

  // Customer Trend Alert
  if (overview.customersTrend !== null && overview.customersTrend < -8) {
    alertsList.push({
      level: "Warning",
      title: `Customer base shrinking (${overview.customersTrend.toFixed(1)}%)`,
      date: new Date(Date.now() - 1000 * 60 * 60 * 2) // Slightly older date for variety
    });
  }

  // AOV Trend Alert
  if (overview.aovTrend !== null && overview.aovTrend < -5) {
    alertsList.push({
      level: "Info",
      title: `Avg. Order Value decreased (${overview.aovTrend.toFixed(1)}%)`,
      date: new Date(Date.now() - 1000 * 60 * 60 * 5) // Older date
    });
  }

  // Mock inventory alert - TODO: Replace with real inventory data if available
  if (Math.random() > 0.85 && topProducts.value.length > 0) {
    alertsList.push({
      level: "Critical",
      title: `Inventory low for ${topProducts.value[0]?.product || "product"}`,
      date: new Date(Date.now() - 1000 * 60 * 60 * 1) // Recent date
    });
  }

  // Sort alerts by date, newest first
  return alertsList.sort((a, b) => b.date - a.date);
});


// --- Methods ---
function formatCurrency(value) {
  if (value === undefined || value === null) return '$0';
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

function getProductColor(product) {
  let hash = 0;
  const name = product.product || '';
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["#1976D2", "#03A9F4", "#4CAF50", "#FFC107", "#FF5722", "#9C27B0", "#673AB7"];
  return colors[Math.abs(hash) % colors.length];
}

function getBusinessHealthStatus() {
  const score = businessHealthScore.value;
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Needs Attention";
  return "Critical";
}

function getBusinessHealthColor() {
  const score = businessHealthScore.value;
  if (score >= 80) return "success";
  if (score >= 65) return "light-green-darken-1";
  if (score >= 50) return "warning";
  if (score >= 30) return "orange-darken-2";
  return "error";
}

function getAlertIcon(level) {
  switch (level?.toLowerCase()) {
    case "critical": return "mdi-alert-circle";
    case "warning": return "mdi-alert";
    case "info": return "mdi-information";
    default: return "mdi-bell";
  }
}

function getAlertColor(level) {
  switch (level?.toLowerCase()) {
    case "critical": return "error";
    case "warning": return "warning";
    case "info": return "info";
    default: return "grey";
  }
}


const refreshData = async () => {
  refreshing.value = true;
  try {
    // Pass current filters first, then true for forceRefresh
    await analyticsStore.fetchSalesAnalytics(analyticsStore.currentFilters, true);
    // Use the correct notification action name: add
    notificationStore.add({
      message: "Dashboard data refreshed.",
      type: "success",
    });
  } catch (error) {
    console.error("Error refreshing dashboard data:", error);
    // Use the correct notification action name: add
    notificationStore.add({
      message: `Failed to refresh data: ${error.message}`,
      type: "error",
    });
  } finally {
    refreshing.value = false;
  }
}


// --- Lifecycle Hooks ---
onMounted(() => {
  // Fetch initial data if not already loaded or stale
  // Pass the store's current filters to the initial fetch
  if (!analyticsStore.hasData || !analyticsStore.lastUpdated) {
    // Use hasData computed property for a cleaner check
    analyticsStore.fetchSalesAnalytics(analyticsStore.currentFilters);
  }
  // No need to fetch insights on mount here
});
</script>

<style scoped>
.sales-metric-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: box-shadow 0.2s ease-in-out;
}

.sales-metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.metric-trend {
  font-size: 0.8rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
}

.metric-trend.positive {
  color: rgb(var(--v-theme-success));
}

.metric-trend.negative {
  color: rgb(var(--v-theme-error));
}
</style>
