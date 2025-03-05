<template>
  <div class="product-analytics">
    <v-card class="mb-6">
      <v-card-title class="d-flex align-center">
        <span>Product Performance Analysis</span>
        <v-spacer></v-spacer>
        <v-select
          v-model="selectedProduct"
          :items="productOptions"
          label="Select Product"
          variant="outlined"
          density="comfortable"
          hide-details
          style="max-width: 200px"
        ></v-select>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text v-if="filteredData.length > 0">
        <v-row>
          <v-col cols="12" sm="6">
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-currency-usd</v-icon>
                </template>
                <v-list-item-title>Total Revenue</v-list-item-title>
                <v-list-item-subtitle
                  class="text-right text-primary font-weight-bold"
                >
                  ${{ totalRevenue.toLocaleString() }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="info">mdi-cart</v-icon>
                </template>
                <v-list-item-title>Total Units Sold</v-list-item-title>
                <v-list-item-subtitle
                  class="text-right text-info font-weight-bold"
                >
                  {{ totalUnitsSold }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="success">mdi-account-group</v-icon>
                </template>
                <v-list-item-title>Unique Customers</v-list-item-title>
                <v-list-item-subtitle
                  class="text-right text-success font-weight-bold"
                >
                  {{ totalUniqueCustomers }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col cols="12" sm="6">
            <!-- Basic chart placeholder - would use a real chart library in production -->
            <div class="chart-container">
              <div
                v-for="(item, i) in monthlyData"
                :key="i"
                class="chart-bar"
                :style="{
                  height: `${(item.revenue / maxRevenue) * 100}%`,
                  backgroundColor: `hsl(${210 + i * 10}, 80%, 60%)`,
                }"
              >
                <div class="chart-tooltip">
                  {{ item.month }}: ${{ item.revenue.toLocaleString() }}
                </div>
              </div>
            </div>
            <div class="chart-labels">
              <span v-for="(item, i) in monthlyData" :key="i">
                {{ item.month.split("-")[1] }}
              </span>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text v-else class="text-center pa-8">
        <v-icon size="64" color="grey">mdi-chart-box-outline</v-icon>
        <div class="text-h6 mt-4">
          No data available for {{ selectedProduct }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useAnalyticsStore } from "@/stores/analyticsStore";

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const analytics = useAnalyticsStore();
const selectedProduct = ref("All Products");

const productOptions = computed(() => {
  const products = ["All Products"];
  if (props.data && props.data.length) {
    props.data.forEach((item) => {
      if (!products.includes(item.product)) {
        products.push(item.product);
      }
    });
  }
  return products;
});

const filteredData = computed(() => {
  if (selectedProduct.value === "All Products") {
    return props.data || [];
  }
  return (props.data || []).filter(
    (item) => item.product === selectedProduct.value
  );
});

const monthlyData = computed(() => {
  const months = {};
  filteredData.value.forEach((item) => {
    const month = item.month;
    if (!months[month]) {
      months[month] = {
        month,
        revenue: 0,
        units: 0,
        customers: 0,
      };
    }
    months[month].revenue += Number(item.total_revenue);
    months[month].units += Number(item.items_sold);
    months[month].customers += Number(item.unique_customers);
  });

  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
});

const totalRevenue = computed(() => {
  return filteredData.value.reduce(
    (sum, item) => sum + Number(item.total_revenue),
    0
  );
});

const totalUnitsSold = computed(() => {
  return filteredData.value.reduce(
    (sum, item) => sum + Number(item.items_sold),
    0
  );
});

const totalUniqueCustomers = computed(() => {
  return filteredData.value.reduce(
    (sum, item) => sum + Number(item.unique_customers),
    0
  );
});

const maxRevenue = computed(() => {
  return monthlyData.value.reduce(
    (max, item) => Math.max(max, item.revenue),
    0
  );
});

watch(
  () => analytics.salesData,
  (newData) => {
    if (newData?.length && !selectedProduct.value) {
      selectedProduct.value = "All Products";
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 150px;
  margin-bottom: 10px;
  padding: 0 10px;
  border-bottom: 1px solid var(--border-color);
}

.chart-bar {
  flex: 1;
  margin: 0 3px;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  position: relative;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  transform: scaleY(1.05);
  filter: brightness(1.1);
}

.chart-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 3px 6px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  white-space: nowrap;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.chart-bar:hover .chart-tooltip {
  opacity: 1;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  font-size: 12px;
  color: var(--text-secondary-color);
}
</style>
