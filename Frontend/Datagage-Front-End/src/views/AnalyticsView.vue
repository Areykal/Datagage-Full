<template>
  <div class="analytics-container">
    <v-row class="mb-5">
      <v-col cols="12">
        <h1 class="text-h4 mb-2">Analytics Dashboard</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Explore your sales data and get AI-powered insights
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-text>
            <v-row>
              <!-- Date range filter -->
              <v-col cols="12" md="3">
                <v-select
                  v-model="timeRange"
                  :items="timeRangeOptions"
                  label="Time Range"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="fetchData"
                ></v-select>
              </v-col>

              <!-- Product filter -->
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedProduct"
                  :items="productOptions"
                  label="Product"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="fetchData"
                ></v-select>
              </v-col>

              <!-- Customer filter -->
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedCustomer"
                  :items="customerOptions"
                  label="Customer"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="fetchData"
                ></v-select>
              </v-col>

              <!-- Refresh button -->
              <v-col cols="12" md="3" class="d-flex align-center justify-end">
                <v-btn
                  prepend-icon="mdi-refresh"
                  @click="fetchData"
                  :loading="loading"
                  color="primary"
                  variant="tonal"
                >
                  Refresh Data
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Stats summary -->
      <v-col cols="12" md="6" lg="3" v-for="stat in stats" :key="stat.title">
        <v-card class="stat-card">
          <v-card-text>
            <div class="d-flex flex-column">
              <div class="text-overline text-medium-emphasis">
                {{ stat.title }}
              </div>
              <div class="text-h4 mb-2">{{ stat.value }}</div>
              <div class="d-flex align-center">
                <v-icon
                  :color="stat.trend >= 0 ? 'success' : 'error'"
                  size="small"
                  class="mr-1"
                >
                  {{ stat.trend >= 0 ? "mdi-arrow-up" : "mdi-arrow-down" }}
                </v-icon>
                <span
                  class="text-caption"
                  :class="stat.trend >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ Math.abs(stat.trend) }}% from previous period
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Charts column -->
      <v-col cols="12" lg="8">
        <v-card height="400px" class="mb-6">
          <v-card-title>Revenue Trend</v-card-title>
          <v-card-text class="fill-height">
            <div
              v-if="loading"
              class="d-flex justify-center align-center fill-height"
            >
              <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <div
              v-else-if="!salesData.length"
              class="d-flex justify-center align-center fill-height"
            >
              No data available
            </div>
            <div v-else class="fill-height">
              <!-- Placeholder for chart component -->
              <div class="chart-placeholder">
                Revenue chart will be rendered here
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card height="400px">
          <v-card-title>Products Performance</v-card-title>
          <v-card-text class="fill-height">
            <div
              v-if="loading"
              class="d-flex justify-center align-center fill-height"
            >
              <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <div
              v-else-if="!salesData.length"
              class="d-flex justify-center align-center fill-height"
            >
              No data available
            </div>
            <div v-else class="fill-height">
              <!-- Placeholder for chart component -->
              <div class="chart-placeholder">
                Product performance chart will be rendered here
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- AI Insights column -->
      <v-col cols="12" lg="4">
        <InsightsPanel
          :data="salesData"
          :insights="insights"
          :loading="insightsLoading"
          :error="insightsError"
          :filter-context="filterContext"
          @refresh="generateInsights"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useNotificationStore } from "@/stores/notificationStore";
import InsightsPanel from "@/components/InsightsPanel.vue";

// Data
const salesData = ref([]);
const loading = ref(false);
const insights = ref(null);
const insightsLoading = ref(false);
const insightsError = ref(null);

// Filters
const timeRange = ref(12);
const timeRangeOptions = [
  { title: "Last 3 months", value: 3 },
  { title: "Last 6 months", value: 6 },
  { title: "Last 12 months", value: 12 },
  { title: "Last 24 months", value: 24 },
];

const selectedProduct = ref("all");
const productOptions = ref([
  { title: "All Products", value: "all" },
  { title: "Laptop", value: "Laptop" },
  { title: "Smartphone", value: "Smartphone" },
  { title: "Headphones", value: "Headphones" },
  { title: "Mouse", value: "Mouse" },
  { title: "Keyboard", value: "Keyboard" },
  { title: "Monitor", value: "Monitor" },
]);

const selectedCustomer = ref("all");
const customerOptions = ref([{ title: "All Customers", value: "all" }]);

// Stats
const stats = ref([
  { title: "TOTAL REVENUE", value: "$0", trend: 0 },
  { title: "ORDERS", value: "0", trend: 0 },
  { title: "AVG ORDER VALUE", value: "$0", trend: 0 },
  { title: "UNIQUE CUSTOMERS", value: "0", trend: 0 },
]);

// Computed
const filterContext = computed(() => ({
  timeRange: timeRange.value,
  product: selectedProduct.value,
  customer: selectedCustomer.value,
}));

const notificationStore = useNotificationStore();

// Methods
const fetchData = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `/api/analytics/sales?timeRange=${timeRange.value}&product=${selectedProduct.value}&customer=${selectedCustomer.value}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    salesData.value = data;

    // Update stats after data load
    updateStats();

    // Generate insights
    generateInsights();

    notificationStore.add({
      message: "Data successfully loaded",
      type: "success",
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    notificationStore.add({
      message: "Failed to load data: " + error.message,
      type: "error",
    });
  } finally {
    loading.value = false;
  }
};

const updateStats = () => {
  if (!salesData.value.length) return;

  // Calculate total revenue
  const totalRevenue = salesData.value.reduce(
    (sum, item) => sum + parseFloat(item.total_revenue || 0),
    0
  );

  // Calculate total orders
  const totalOrders = salesData.value.reduce(
    (sum, item) => sum + parseInt(item.total_orders || 0),
    0
  );

  // Calculate average order value
  const avgOrderValue = totalOrders
    ? (totalRevenue / totalOrders).toFixed(2)
    : 0;

  // Get unique customers count (use the max from any period)
  const uniqueCustomers = Math.max(
    ...salesData.value.map((item) => parseInt(item.unique_customers || 0))
  );

  // Update stats
  stats.value = [
    {
      title: "TOTAL REVENUE",
      value: `$${totalRevenue.toLocaleString()}`,
      trend: 5.2,
    },
    { title: "ORDERS", value: totalOrders.toLocaleString(), trend: 2.8 },
    { title: "AVG ORDER VALUE", value: `$${avgOrderValue}`, trend: -1.3 },
    {
      title: "UNIQUE CUSTOMERS",
      value: uniqueCustomers.toLocaleString(),
      trend: 12.4,
    },
  ];
};

const generateInsights = async () => {
  if (!salesData.value.length) {
    insights.value = null;
    return;
  }

  insightsLoading.value = true;
  insightsError.value = null;

  try {
    const response = await fetch("/api/analytics/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: salesData.value,
        filterContext: filterContext.value,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate insights");
    }

    insights.value = await response.text();
  } catch (error) {
    console.error("Error generating insights:", error);
    insightsError.value = error.message;
    notificationStore.add({
      message: "Failed to generate insights: " + error.message,
      type: "error",
    });
  } finally {
    insightsLoading.value = false;
  }
};

// Load initial data
onMounted(async () => {
  await fetchData();

  // Populate customer options from data
  const customers = new Set();
  salesData.value.forEach((item) => {
    if (item.customer_name) {
      customers.add(item.customer_name);
    }
  });

  if (customers.size > 0) {
    customerOptions.value = [
      { title: "All Customers", value: "all" },
      ...Array.from(customers).map((name) => ({
        title: name,
        value: name,
      })),
    ];
  }
});
</script>

<style scoped>
.analytics-container {
  max-width: 100%;
  margin: 0 auto;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.chart-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
