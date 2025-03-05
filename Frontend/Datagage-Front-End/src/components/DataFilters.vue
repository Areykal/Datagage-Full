<template>
  <v-card class="filter-card mb-6" variant="outlined">
    <v-card-title>
      <v-icon start class="mr-2">mdi-filter</v-icon>
      Data Filters
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filters.timeRange"
            :items="timeRangeOptions"
            label="Time Range"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-calendar-range"
            @update:model-value="handleChange"
          ></v-select>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filters.product"
            :items="productOptions"
            label="Product"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-package-variant"
            @update:model-value="handleChange"
          ></v-select>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filters.customer"
            :items="customerOptions"
            label="Customer"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-account-group"
            @update:model-value="handleChange"
          ></v-select>
        </v-col>

        <v-col cols="12" sm="6" md="3" class="d-flex align-center">
          <v-btn
            color="primary"
            variant="text"
            @click="resetFilters"
            :disabled="!isFiltered"
            class="mr-2"
          >
            <v-icon start>mdi-filter-remove</v-icon>
            Reset
          </v-btn>

          <v-btn color="primary" @click="applyFilters" :loading="loading">
            <v-icon start>mdi-filter-check</v-icon>
            Apply
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useAnalyticsStore } from "@/stores/analyticsStore";

const analyticsStore = useAnalyticsStore();
const loading = computed(() => analyticsStore.loading);

// Filter options
const timeRangeOptions = [
  { title: "Last 7 days", value: 7 },
  { title: "Last 30 days", value: 30 },
  { title: "Last 90 days", value: 90 },
  { title: "Last 12 months", value: 365 },
  { title: "All time", value: 0 },
];

const productOptions = [
  { title: "All Products", value: "all" },
  { title: "Widgets", value: "widgets" },
  { title: "Gadgets", value: "gadgets" },
  { title: "Tools", value: "tools" },
  { title: "Supplies", value: "supplies" },
];

const customerOptions = [
  { title: "All Customers", value: "all" },
  { title: "Enterprise", value: "enterprise" },
  { title: "SMB", value: "smb" },
  { title: "Individual", value: "individual" },
];

// Filter state
const filters = ref({
  timeRange: analyticsStore.timeRange || 30,
  product: analyticsStore.product || "all",
  customer: analyticsStore.customer || "all",
});

// Computed property to check if filters are applied
const isFiltered = computed(() => {
  return (
    filters.value.timeRange !== 30 ||
    filters.value.product !== "all" ||
    filters.value.customer !== "all"
  );
});

// Handle change event for auto-apply mode
const handleChange = () => {
  // If you want filters to auto-apply, uncomment the next line
  // applyFilters();
};

// Methods
const applyFilters = () => {
  // Update the store with the current filters
  analyticsStore.timeRange = filters.value.timeRange;
  analyticsStore.product = filters.value.product;
  analyticsStore.customer = filters.value.customer;

  // Trigger data refetch with new filters
  analyticsStore.fetchData(true);
};

const resetFilters = () => {
  filters.value = {
    timeRange: 30,
    product: "all",
    customer: "all",
  };
  applyFilters();
};

// Watch for store changes
watch(
  () => [
    analyticsStore.timeRange,
    analyticsStore.product,
    analyticsStore.customer,
  ],
  ([newTimeRange, newProduct, newCustomer]) => {
    // Update local filters if they change in the store
    filters.value = {
      timeRange: newTimeRange,
      product: newProduct,
      customer: newCustomer,
    };
  },
  { immediate: true }
);
</script>

<style scoped>
.filter-card {
  background: var(--surface-color) !important;
  border: 1px solid var(--border-color) !important;
  transition: all 0.3s ease;
}

@media (max-width: 600px) {
  .filter-card {
    padding: 12px;
  }
}
</style>
