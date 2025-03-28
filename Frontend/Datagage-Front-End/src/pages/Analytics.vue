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

    <!-- Product Analytics Component -->
    <ProductAnalytics
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

// Compute customer options (this would come from actual data in a real app)
const customerOptions = computed(() => [
  "all",
  "Lauren Smith",
  "John Mason",
  "Thomas Melton",
]);

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
    // Show loading state
    loading.value = true;

    // Update filters in the store and fetch data
    await analytics.fetchSalesData(
      {
        timeRange: months.value,
        product: selectedProduct.value,
        customer: selectedCustomer.value,
      },
      forceRefresh
    );

    // Generate new insights based on filtered data
    refreshInsights();

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
    insightsLoading.value = true;
    await analytics.generateInsights();
    notify.success("AI insights updated based on current filters");
  } catch (err) {
    notify.error("Failed to generate insights");
    console.error(err);
  } finally {
    insightsLoading.value = false;
  }
};

const generateProductInsights = async (productData) => {
  try {
    insightsLoading.value = true;

    // Generate insights for specific product data
    const productInsights = await analytics.generateInsights(productData);
  } catch (err) {
    notify.error("Failed to generate product insights");
    console.error(err);
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

    // Create CSV content
    const headers = Object.keys(analytics.salesData[0]).join(",");
    const rows = analytics.salesData
      .map((item) => Object.values(item).join(","))
      .join("\n");
    const csvContent = `${headers}\n${rows}`;

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datagage_analytics_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    notify.success("Data exported successfully");
  } catch (error) {
    notify.error("Failed to export data");
    console.error(error);
  }
};

onMounted(() => fetchFilteredData());
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
