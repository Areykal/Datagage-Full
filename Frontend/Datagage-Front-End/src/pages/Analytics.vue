<template>
  <PageLayout title="Analytics" subtitle="Analyze your sales data and business performance"
    :loading="analyticsStore.dataLoading && !analyticsStore.hasData" :error="analyticsStore.error">
    <!-- Filter controls -->
    <v-card class="mb-6" variant="flat" rounded="lg">
      <v-card-title class="pb-1">Data Filters</v-card-title>
      <v-card-subtitle class="pb-3">Refine the analytics view</v-card-subtitle>
      <v-divider class="mb-3"></v-divider>
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="months" :items="periodOptions" item-title="title" item-value="value" label="Time Period"
              variant="outlined" density="comfortable" hide-details
              @update:model-value="fetchFilteredData()"></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="selectedProduct" :items="productOptions" item-title="title" item-value="value"
              label="Product" variant="outlined" density="comfortable" hide-details clearable
              @update:model-value="fetchFilteredData()"
              @click:clear="selectedProduct = 'all'; fetchFilteredData()"></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="selectedCustomer" :items="customerOptions" item-title="title" item-value="value"
              label="Customer" variant="outlined" density="comfortable" hide-details clearable
              @update:model-value="fetchFilteredData()"
              @click:clear="selectedCustomer = 'all'; fetchFilteredData()"></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" class="d-flex justify-end">
            <v-btn color="primary" prepend-icon="mdi-refresh" @click="fetchFilteredData(true)"
              :loading="analyticsStore.dataLoading">
              Refresh Data
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Main Content: Show only if not initial loading OR if data exists -->
    <template v-if="!analyticsStore.dataLoading || analyticsStore.hasData">
      <v-row>
        <!-- Revenue Graph -->
        <v-col cols="12">
          <v-card variant="flat" rounded="lg">
            <v-card-title class="pb-0">Sales Performance</v-card-title>
            <v-card-subtitle>Revenue over time (based on overview)</v-card-subtitle>
            <v-card-text class="pt-0">
              <v-sheet v-if="analyticsStore.dataLoading && !analyticsStore.hasData" height="400"
                class="d-flex align-center justify-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-sheet>
              <v-sheet v-else-if="!revenueChartData.labels || !revenueChartData.labels.length" height="400"
                class="d-flex align-center justify-center">
                <div class="text-center">
                  <v-icon icon="mdi-chart-timeline-variant" size="64" color="grey-lighten-1"></v-icon>
                  <div class="text-h6 mt-2">No revenue data available</div>
                  <div class="text-body-2 text-medium-emphasis">Try changing your filters or time period</div>
                </div>
              </v-sheet>
              <v-sheet v-else height="400" class="pa-2">
                <TimeSeriesChart :chart-data="revenueChartData" title="Monthly Revenue" y-axis-label="Revenue"
                  :loading="analyticsStore.dataLoading" />
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- AI Insights Row -->
      <v-row class="mt-4">
        <v-col cols="12"> <!-- Full width -->
          <v-card variant="flat" rounded="lg" class="insights-card">
            <v-card-title>
              <div class="d-flex align-center">
                <v-icon icon="mdi-lightbulb-on-outline" color="amber" class="mr-2"></v-icon>
                <span>AI Insights</span> <!-- Wrapped title in span -->
                <v-spacer></v-spacer>
                <!-- Group indicator and button together -->
                <div class="d-flex align-center">
                  <v-progress-circular v-if="analyticsStore.isStreamingInsights" indeterminate size="20" width="2"
                    color="amber" class="mr-2"></v-progress-circular>
                  <v-btn icon="mdi-refresh" variant="text" size="small" @click="regenerateInsights"
                    :disabled="analyticsStore.dataLoading || !analyticsStore.hasData || analyticsStore.isStreamingInsights">
                  </v-btn>
                </div>
              </div>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="insights-content-container pa-4">
              <!-- Display streaming content directly -->
              <div v-if="analyticsStore.insightsLoading && !analyticsStore.streamingInsightsContent"
                class="text-center text-medium-emphasis">
                Generating insights...
              </div>
              <div
                v-else-if="!analyticsStore.insightsLoading && !analyticsStore.streamingInsightsContent && analyticsStore.hasData"
                class="text-center text-medium-emphasis">
                Click the refresh button <v-icon small>mdi-refresh</v-icon> to generate insights.
              </div>
              <div v-else-if="!analyticsStore.hasData" class="text-center text-medium-emphasis">
                Load data to generate insights.
              </div>
              <div v-else v-html="sanitizedStreamingInsights" class="insights-content"></div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Detailed Analytics Breakdowns Row -->
      <v-row class="mt-4">
        <!-- Product Revenue Chart -->
        <v-col cols="12" md="6"> <!-- Half width -->
          <v-card variant="flat" rounded="lg" class="h-100">
            <v-card-title class="pb-0">Product Revenue Breakdown</v-card-title>
            <v-card-subtitle>Top 10 products by revenue</v-card-subtitle>
            <v-card-text>
              <v-sheet v-if="analyticsStore.dataLoading" height="300" class="d-flex align-center justify-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-sheet>
              <v-sheet
                v-else-if="!productChartData || !productChartData.labels || !productChartData.labels.length || !productChartData.datasets || !productChartData.datasets.length"
                height="300" class="d-flex align-center justify-center">
                <div class="text-center">
                  <v-icon icon="mdi-chart-pie" size="64" color="grey-lighten-1"></v-icon>
                  <div class="text-body-2 text-medium-emphasis">No product data for current filters</div>
                </div>
              </v-sheet>
              <v-sheet v-else height="300">
                <BarChart :data="productChartData" :options="productChartOptions" />
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Customer Revenue Chart -->
        <v-col cols="12" md="6"> <!-- Half width -->
          <v-card variant="flat" rounded="lg" class="h-100">
            <v-card-title class="pb-0">Customer Revenue Breakdown</v-card-title>
            <v-card-subtitle>Top 10 customers by revenue</v-card-subtitle>
            <v-card-text>
              <v-sheet v-if="analyticsStore.dataLoading" height="300" class="d-flex align-center justify-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-sheet>
              <v-sheet
                v-else-if="!customerChartData || !customerChartData.labels || !customerChartData.labels.length || !customerChartData.datasets || !customerChartData.datasets.length"
                height="300" class="d-flex align-center justify-center">
                <div class="text-center">
                  <v-icon icon="mdi-account-group" size="64" color="grey-lighten-1"></v-icon>
                  <div class="text-body-2 text-medium-emphasis">No customer data for current filters</div>
                </div>
              </v-sheet>
              <v-sheet v-else height="300">
                <BarChart :data="customerChartData" :options="customerChartOptions" />
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- NEW: Quantity and Orders Breakdowns Row -->
      <v-row class="mt-4">
        <!-- Product Quantity Chart -->
        <v-col cols="12" md="6">
          <v-card variant="flat" rounded="lg" class="h-100">
            <v-card-title class="pb-0">Product Units Sold</v-card-title>
            <v-card-subtitle>Top 10 products by units sold</v-card-subtitle>
            <v-card-text>
              <v-sheet v-if="analyticsStore.dataLoading" height="300" class="d-flex align-center justify-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-sheet>
              <v-sheet
                v-else-if="!productQuantityChartData || !productQuantityChartData.labels || !productQuantityChartData.labels.length || !productQuantityChartData.datasets || !productQuantityChartData.datasets.length"
                height="300" class="d-flex align-center justify-center">
                <div class="text-center">
                  <v-icon icon="mdi-package-variant-closed" size="64" color="grey-lighten-1"></v-icon>
                  <div class="text-body-2 text-medium-emphasis">No quantity data for current filters</div>
                </div>
              </v-sheet>
              <v-sheet v-else height="300">
                <BarChart :data="productQuantityChartData" :options="productQuantityChartOptions" />
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Customer Orders Chart -->
        <v-col cols="12" md="6">
          <v-card variant="flat" rounded="lg" class="h-100">
            <v-card-title class="pb-0">Customer Order Count</v-card-title>
            <v-card-subtitle>Top 10 customers by order count</v-card-subtitle>
            <v-card-text>
              <v-sheet v-if="analyticsStore.dataLoading" height="300" class="d-flex align-center justify-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-sheet>
              <v-sheet
                v-else-if="!customerOrdersChartData || !customerOrdersChartData.labels || !customerOrdersChartData.labels.length || !customerOrdersChartData.datasets || !customerOrdersChartData.datasets.length"
                height="300" class="d-flex align-center justify-center">
                <div class="text-center">
                  <v-icon icon="mdi-receipt-text-outline" size="64" color="grey-lighten-1"></v-icon>
                  <div class="text-body-2 text-medium-emphasis">No order data for current filters</div>
                </div>
              </v-sheet>
              <v-sheet v-else height="300">
                <BarChart :data="customerOrdersChartData" :options="customerOrdersChartOptions" />
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

    </template>

    <!-- Loading state for initial load -->
    <template v-else-if="analyticsStore.dataLoading && !analyticsStore.hasData">
      <v-row>
        <v-col cols="12" sm="6" md="3"> <v-skeleton-loader type="text@2"></v-skeleton-loader> </v-col>
        <v-col cols="12" sm="6" md="3"> <v-skeleton-loader type="text@2"></v-skeleton-loader> </v-col>
        <v-col cols="12" sm="6" md="3"> <v-skeleton-loader type="text@2"></v-skeleton-loader> </v-col>
        <v-col cols="12" sm="6" md="3"> <v-skeleton-loader type="button"></v-skeleton-loader> </v-col>
      </v-row>
      <v-row class="mt-4">
        <v-col cols="12"> <v-skeleton-loader type="image" height="400"></v-skeleton-loader> </v-col>
      </v-row>
      <v-row class="mt-4">
        <v-col cols="12" md="6"> <v-skeleton-loader type="image" height="300"></v-skeleton-loader> </v-col>
        <v-col cols="12" md="6"> <v-skeleton-loader type="image" height="300"></v-skeleton-loader> </v-col>
      </v-row>
      <v-row class="mt-4">
        <v-col cols="12" md="6"> <v-skeleton-loader type="image" height="300"></v-skeleton-loader> </v-col>
        <v-col cols="12" md="6"> <v-skeleton-loader type="image" height="300"></v-skeleton-loader> </v-col>
      </v-row>
    </template>

    <!-- Error state -->
    <template v-else-if="analyticsStore.error">
      <v-alert type="error" prominent border="start" class="ma-4">
        {{ analyticsStore.error }}
        <template v-slot:append>
          <v-btn variant="text" @click="fetchFilteredData(true)">Retry</v-btn>
        </template>
      </v-alert>
    </template>

  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useNotificationStore } from "@/stores/notificationStore";
import PageLayout from "@/components/PageLayout.vue";
import TimeSeriesChart from "@/components/TimeSeriesChart.vue";
import BarChart from "@/components/BarChart.vue";
import DOMPurify from 'dompurify'; // Keep DOMPurify for sanitizing the final streamed HTML

const analyticsStore = useAnalyticsStore();
const notificationStore = useNotificationStore();

// Local state for filters
const months = ref(analyticsStore.currentFilters.timeRange || 12);
const selectedProduct = ref(analyticsStore.currentFilters.product || "all");
const selectedCustomer = ref(analyticsStore.currentFilters.customer || "all");

// --- Computed properties for filter options ---
const periodOptions = [
  { title: "Last Month", value: 1 },
  { title: "Last 3 Months", value: 3 },
  { title: "Last 6 Months", value: 6 },
  { title: "Last 12 Months", value: 12 },
  // --- FIX: Correct 'All Time' value to match backend/service ---
  { title: "All Time", value: 'all' },
  // --- END FIX ---
];

// Use detail data for dynamic filter options now
const productOptions = computed(() => {
  const uniqueProducts = [
    ...new Set(analyticsStore.salesDetailData.map(item => item.product).filter(Boolean))
  ];
  return [
    { title: "All Products", value: "all" },
    ...uniqueProducts.sort().map(p => ({ title: p, value: p }))
  ];
});

const customerOptions = computed(() => {
  const uniqueCustomers = [
    ...new Set(analyticsStore.salesDetailData.map(item => item.customer_name).filter(Boolean))
  ];
  return [
    { title: "All Customers", value: "all" },
    ...uniqueCustomers.sort().map(c => ({ title: c, value: c }))
  ];
});

// --- Computed properties for chart data ---

// Default empty chart structure
const emptyChartData = {
  labels: [],
  datasets: [{ data: [] }],
};

// Time series chart data (from detail data)
const revenueChartData = computed(() => {
  return analyticsStore.monthlyRevenueTrend || emptyChartData; // Use the store's computed property directly or default
});

// Product bar chart data (from detail data)
const productChartData = computed(() => {
  const topProducts = analyticsStore.revenueByProduct?.slice(0, 10);
  if (!topProducts || topProducts.length === 0) return emptyChartData;
  return {
    labels: topProducts.map(p => p.product),
    datasets: [
      {
        label: 'Revenue',
        data: topProducts.map(p => p.total_revenue),
        backgroundColor: [
          '#1976D2', '#03A9F4', '#4CAF50', '#FFC107', '#FF5722',
          '#9C27B0', '#673AB7', '#009688', '#FF5722', '#607D8B'
        ],
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    ],
  };
});

// Customer bar chart data (from detail data)
const customerChartData = computed(() => {
  const topCustomers = analyticsStore.customerMetrics?.slice(0, 10);
  if (!topCustomers || topCustomers.length === 0) return emptyChartData;
  return {
    labels: topCustomers.map(c => c.customer_name),
    datasets: [
      {
        label: 'Revenue',
        data: topCustomers.map(c => c.total_revenue),
        backgroundColor: [
          '#673AB7', '#9C27B0', '#E91E63', '#F44336', '#FF9800',
          '#CDDC39', '#8BC34A', '#00BCD4', '#2196F3', '#3F51B5'
        ],
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    ],
  };
});

// --- NEW: Product Quantity Chart Data ---
const productQuantityChartData = computed(() => {
  const topProducts = analyticsStore.quantityByProduct?.slice(0, 10);
  if (!topProducts || topProducts.length === 0) return emptyChartData;
  return {
    labels: topProducts.map(p => p.product),
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts.map(p => p.total_quantity),
        backgroundColor: [
          '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58',
          '#FFCA28', '#FFA726', '#FF7043', '#8D6E63', '#78909C'
        ],
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    ],
  };
});

// --- NEW: Customer Orders Chart Data ---
const customerOrdersChartData = computed(() => {
  const topCustomers = analyticsStore.ordersByCustomer?.slice(0, 10);
  if (!topCustomers || topCustomers.length === 0) return emptyChartData;
  return {
    labels: topCustomers.map(c => c.customer_name),
    datasets: [
      {
        label: 'Total Orders',
        data: topCustomers.map(c => c.total_orders),
        backgroundColor: [
          '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0',
          '#42A5F5', '#29B6F6', '#26C6DA', '#66BB6A', '#FFA726'
        ],
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    ],
  };
});

// --- Computed property for Sanitized Streaming Insights ---
const sanitizedStreamingInsights = computed(() => {
  // Sanitize the HTML content received from the stream
  // Although the backend *should* send clean HTML, this adds an extra layer of security
  return DOMPurify.sanitize(analyticsStore.streamingInsightsContent);
});

// --- Chart Options ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', compactDisplay: 'short' }).format(value);
};

// --- NEW: Format Number (for units, orders) ---
const formatNumber = (value) => {
  // Use compact notation for large numbers, otherwise standard formatting
  return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value);
};

// Base options for horizontal bar charts
const baseHorizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y', // Horizontal bars
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        // Placeholder, will be overridden
        callback: function (value) { return value; }
      }
    },
    y: {
      ticks: {
        autoSkip: false // Ensure all labels are shown
      }
    }
  },
  plugins: {
    legend: { display: false }, // Usually hide legend for single dataset bars
    tooltip: {
      callbacks: {
        // Placeholder, will be overridden
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.x !== null) {
            label += context.parsed.x; // Raw value, will be formatted by specific options
          }
          return label;
        }
      }
    }
  },
};

// Options for Revenue charts (using currency)
const revenueChartOptions = computed(() => ({
  ...baseHorizontalBarOptions,
  scales: {
    ...baseHorizontalBarOptions.scales,
    x: {
      ...baseHorizontalBarOptions.scales.x,
      ticks: {
        callback: function (value) { return formatCurrency(value); }
      }
    }
  },
  plugins: {
    ...baseHorizontalBarOptions.plugins,
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.x !== null) {
            label += formatCurrency(context.parsed.x);
          }
          return label;
        }
      }
    }
  }
}));

// Options for Quantity/Order charts (using plain numbers)
const numberChartOptions = computed(() => ({
  ...baseHorizontalBarOptions,
  scales: {
    ...baseHorizontalBarOptions.scales,
    x: {
      ...baseHorizontalBarOptions.scales.x,
      ticks: {
        callback: function (value) { return formatNumber(value); }
      }
    }
  },
  plugins: {
    ...baseHorizontalBarOptions.plugins,
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.x !== null) {
            label += formatNumber(context.parsed.x);
          }
          return label;
        }
      }
    }
  }
}));

// Specific options for each chart type
const productChartOptions = revenueChartOptions; // Revenue uses currency
const customerChartOptions = revenueChartOptions; // Revenue uses currency
const productQuantityChartOptions = numberChartOptions; // Quantity uses numbers
const customerOrdersChartOptions = numberChartOptions; // Orders use numbers


// --- Methods ---
function fetchFilteredData(forceRefresh = false) {
  console.log("fetchFilteredData called with filters:", { months: months.value, product: selectedProduct.value, customer: selectedCustomer.value });
  analyticsStore.fetchSalesAnalytics(
    {
      timeRange: months.value,
      product: selectedProduct.value,
      customer: selectedCustomer.value,
    },
    forceRefresh
  );
}

function regenerateInsights() {
  console.log("Regenerating insights...");
  analyticsStore.streamInsights(); // Call the streaming action
}

// --- Lifecycle Hooks ---
onMounted(() => {
  console.log("Analytics component mounted. Fetching initial data...");
  // Fetch data on initial mount using current/default filters
  fetchFilteredData();
});

// Optional: Watch for filter changes if you prefer not to use @update:model-value
// watch([months, selectedProduct, selectedCustomer], () => {
//   fetchFilteredData();
// });

</script>

<style scoped>
.insights-card {
  /* Add any specific styling for the insights card */
  border: 1px solid rgba(0, 0, 0, 0.12);
  /* Subtle border */
}

.insights-content-container {
  /* Removed max-height previously */
  overflow-y: auto;
  /* Allow scrolling if content exceeds card size */
  min-height: 150px;
  /* Ensure a minimum height */
  position: relative;
  /* Needed for potential absolute positioning of overlays */
}

.insights-content {
  /* Styling for the rendered HTML content */
  line-height: 1.6;
}

/* Remove absolute positioning for the streaming indicator */
/* .insights-card .v-progress-circular { ... } */

/* Ensure charts have enough space */
.v-sheet {
  width: 100%;
}

/* Improve responsiveness of filter selects */
@media (max-width: 600px) {
  .v-col {
    padding-top: 8px;
    padding-bottom: 8px;
  }
}
</style>
