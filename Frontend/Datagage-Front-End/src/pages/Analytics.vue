<template>
  <PageLayout
    title="Analytics"
    subtitle="Analyze your data insights"
    :loading="loading"
    :error="error"
  >
    <!-- Filter controls -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-select
              v-model="months"
              :items="periodOptions"
              item-title="title"
              item-value="value"
              label="Time Period"
              variant="outlined"
              density="comfortable"
              @update:model-value="fetchFilteredData"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedProduct"
              :items="productOptions"
              label="Product"
              variant="outlined"
              density="comfortable"
              @update:model-value="fetchFilteredData"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedCustomer"
              :items="customerOptions"
              label="Customer"
              variant="outlined"
              density="comfortable"
              @update:model-value="fetchFilteredData"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2" class="d-flex justify-end">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="fetchFilteredData(true)"
              :loading="loading"
            >
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Stats Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="analytics-card">
          <v-card-item>
            <v-card-title>Total Products</v-card-title>
            <div class="text-h4">
              {{
                analytics.salesData?.reduce(
                  (acc, curr) =>
                    acc.includes(curr.product) ? acc : [...acc, curr.product],
                  []
                ).length || 0
              }}
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="analytics-card">
          <v-card-item>
            <v-card-title>Total Orders</v-card-title>
            <div class="text-h4">
              {{
                analytics.salesData?.reduce(
                  (acc, curr) => acc + Number(curr.total_orders),
                  0
                ) || 0
              }}
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="analytics-card">
          <v-card-item>
            <v-card-title>Total Revenue</v-card-title>
            <div class="text-h4">
              ${{
                analytics.salesData
                  ?.reduce((acc, curr) => acc + Number(curr.total_revenue), 0)
                  .toLocaleString() || 0
              }}
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="analytics-card">
          <v-card-item>
            <v-card-title>Last Updated</v-card-title>
            <div class="text-subtitle-1">{{ lastSync }}</div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <!-- Revenue Trend Chart -->
    <div v-if="!loading && analytics.salesData?.length > 0" class="mb-6">
      <TimeSeriesChart 
        :data="analytics.salesData" 
        xKey="month" 
        yKey="total_revenue" 
        title="Revenue Trends" 
        metric="Revenue"
        :format="(val) => `$${val.toLocaleString()}`"
      />
    </div>
    
    <!-- User Activity Chart -->
    <div v-if="!loading && analytics.salesData?.length > 0" class="mb-6">
      <TimeSeriesChart 
        :data="analytics.salesData" 
        xKey="month" 
        yKey="unique_customers" 
        title="Customer Engagement" 
        metric="Unique Customers"
      />
    </div>

    <!-- Product Analytics Component -->
    <div v-if="loading" class="text-center pa-4">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      <div class="mt-3">Loading analytics data...</div>
    </div>
    <ProductAnalytics
      v-else
      :data="analytics.salesData || []"
      class="mb-6"
      @generate-product-insights="generateProductInsights"
    />

    <v-row>
      <v-col cols="12">
        <!-- AI Insights with loading state -->
        <v-card class="analytics-card mb-6">
          <v-card-title class="d-flex align-center">
            <span>AI Insights</span>
            <v-chip
              class="ml-2"
              size="small"
              color="primary"
              v-if="insightsLoading"
              >Analyzing...</v-chip
            >
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              @click="refreshInsights"
              :loading="insightsLoading"
            >
              <v-tooltip activator="parent" location="top">
                Refresh Insights
              </v-tooltip>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div v-if="insightsLoading" class="d-flex justify-center my-4">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <div
              v-else-if="analytics.aiInsights"
              class="text-body-1 insights-content"
              v-html="analytics.aiInsights"
            ></div>
            <div v-else class="text-body-1 text-center pa-4">
              No insights available. Click refresh to generate insights for your
              current data.
            </div>
          </v-card-text>
        </v-card>

        <!-- Metabase visualization (if available) -->
        <v-card v-if="analytics.metabaseUrl" class="analytics-card mb-6">
          <v-card-title>Sales Analytics Dashboard</v-card-title>
          <v-card-text>
            <iframe
              :src="analytics.metabaseUrl"
              frameborder="0"
              width="100%"
              height="600"
              allowtransparency
            ></iframe>
          </v-card-text>
        </v-card>

        <!-- Data table -->
        <v-card class="analytics-card mb-6">
          <v-card-title class="d-flex align-center">
            <span>Sales Data</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-download" variant="text" @click="downloadData">
              <v-tooltip activator="parent" location="top">
                Export Data
              </v-tooltip>
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="tableHeaders"
            :items="analytics.salesData || []"
            :loading="loading"
          ></v-data-table>
        </v-card>

        <!-- Placeholder when no data is available -->
        <v-card
          v-if="!analytics.salesData.length && !loading"
          class="analytics-card"
        >
          <v-card-title>Analytics Dashboard</v-card-title>
          <v-card-text>
            <div
              class="d-flex align-center justify-center"
              style="height: 400px"
            >
              <v-icon size="64" color="primary" class="mr-4">
                mdi-chart-box-outline
              </v-icon>
              <div class="text-h6">
                No data available for the selected filters
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import PageLayout from "@/components/PageLayout.vue";
import { notify } from "@/utils/notifications";
import ProductAnalytics from "@/components/ProductAnalytics.vue";
import TimeSeriesChart from "@/components/TimeSeriesChart.vue";
import analyticsService from "@/services/analyticsService";

const analytics = useAnalyticsStore();
const months = ref(12);
const selectedProduct = ref("all");
const selectedCustomer = ref("all");
const insightsLoading = ref(false);

const periodOptions = [
  { title: "3 Months", value: 3 },
  { title: "6 Months", value: 6 },
  { title: "12 Months", value: 12 },
  { title: "24 Months", value: 24 },
];

const tableHeaders = [
  { title: "Month", key: "month", align: "start" },
  { title: "Product", key: "product" },
  { title: "Orders", key: "total_orders", align: "end" },
  { title: "Items Sold", key: "items_sold", align: "end" },
  {
    title: "Revenue",
    key: "total_revenue",
    align: "end",
    format: (val) => `$${Number(val).toLocaleString()}`,
  },
  { title: "Customers", key: "unique_customers", align: "end" },
  {
    title: "Avg Order",
    key: "avg_order_value",
    align: "end",
    format: (val) => `$${Number(val).toLocaleString()}`,
  },
];

const loading = computed(() => analytics.loading);
const error = computed(() => analytics.error);

// Computed product options from available data
const productOptions = computed(() => {
  const products = new Set(["all"]);
  if (analytics.salesData?.length) {
    analytics.salesData.forEach((item) => {
      if (item.product) products.add(item.product);
    });
  }
  return Array.from(products);
});

// Compute customer options from available data
const customerOptions = computed(() => {
  const customers = new Set(["all"]);
  if (analytics.salesData?.length) {
    analytics.salesData.forEach((item) => {
      // Check for both "customer" and "customer_name" fields to handle possible inconsistencies
      const customerName = item.customer || item.customer_name || null;
      if (customerName) customers.add(customerName);
    });
  }
  return Array.from(customers);
});

// Computed statistics
const totalRecords = computed(() => {
  return (
    analytics.salesData?.reduce(
      (acc, curr) => acc + Number(curr.total_orders || 0),
      0
    ) || 0
  );
});

const lastSync = computed(() => {
  return analytics.lastUpdated || new Date().toLocaleString();
});

const fetchFilteredData = async (forceRefresh = false) => {
  try {
    // Don't set loading state here as it's a computed property from the store
    // The store will handle setting its own loading state
    
    // Update filters in the store and fetch data
    const result = await analytics.fetchSalesData(
      {
        timeRange: months.value,
        product: selectedProduct.value,
        customer: selectedCustomer.value,
      },
      forceRefresh
    );

    // Only generate new insights if explicitly requested via the refresh button
    // This prevents API calls that might fail during regular filter changes
    if (forceRefresh && result && result.length > 0) {
      try {
        await refreshInsights();
      } catch (insightErr) {
        // If insight generation fails, we still want to show the filtered data
        console.error("Failed to refresh insights, but data was filtered:", insightErr);
      }
    }

    if (forceRefresh) {
      notify.success("Analytics data refreshed");
    }
  } catch (err) {
    notify.error("Failed to load analytics data");
    console.error(err);
  }
};

const refreshInsights = async () => {
  try {
    if (!analytics.salesData?.length) {
      notify.warning("No data available to generate insights");
      return;
    }
    
    insightsLoading.value = true;
    const result = await analytics.generateInsights();
    
    if (result) {
      notify.success("AI insights updated based on current filters");
    }
  } catch (err) {
    notify.error("Failed to generate insights: " + (err.message || "Unknown error"));
    console.error("Insight generation error:", err);
  } finally {
    insightsLoading.value = false;
  }
};

const generateProductInsights = async (productData) => {
  try {
    if (!productData || productData.length === 0) {
      notify.warning("No product data available to generate insights");
      return;
    }
    
    insightsLoading.value = true;

    // Generate insights for specific product data
    const productInsights = await analytics.generateInsights(productData);
    notify.success("Product insights generated successfully");
    return productInsights;
  } catch (err) {
    notify.error("Failed to generate product insights: " + (err.message || "Unknown error"));
    console.error("Product insight generation error:", err);
  } finally {
    insightsLoading.value = false;
  }
};

const downloadData = () => {
  try {
    if (!analytics.salesData?.length) {
      notify.error("No data to export");
      return;
    }

    // Use the enhanced CSV export function from the analytics service
    const csvContent = analyticsService.exportToCsv(analytics.salesData);
    
    // Generate a descriptive filename with filters
    const dateStr = new Date().toISOString().split('T')[0];
    let filename = `datagage_analytics_${dateStr}`;
    
    // Add filter information to filename
    if (selectedProduct.value !== 'all') {
      filename += `_${selectedProduct.value}`;
    }
    if (selectedCustomer.value !== 'all') {
      filename += `_${selectedCustomer.value}`;
    }
    filename += `.csv`;

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);

    notify.success("Data exported successfully");
  } catch (error) {
    notify.error("Failed to export data: " + error.message);
    console.error("Export error:", error);
  }
};

onMounted(async () => {
  try {
    await fetchFilteredData();
  } catch (err) {
    notify.error("Failed to load initial analytics data. Please try refreshing the page.");
    console.error("Error loading initial analytics data:", err);
  }
});
</script>

<style scoped>
.analytics-container {
  animation: fadeIn 0.5s ease-out;
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

.analytics-card {
  background: var(--surface-color) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary-color) !important;
  transition: all 0.3s ease;
}

.analytics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.25);
}
</style>
