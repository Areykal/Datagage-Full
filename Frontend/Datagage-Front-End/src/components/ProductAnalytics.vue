<template>
  <div class="product-analytics">
    <div v-if="loading" class="d-flex justify-center align-center py-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else>
      <div class="d-flex align-center mb-4">
        <v-select v-model="selectedProduct" :items="productOptions" label="Select Product" variant="outlined"
          density="comfortable" hide-details style="max-width: 200px"></v-select>
      </div>

      <v-divider class="mb-4"></v-divider>

      <div v-if="filteredData.length > 0">
        <v-row>
          <v-col cols="12" md="5"> {/* Adjusted cols */}
            <v-list density="compact"> {/* Added density */}
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-currency-usd</v-icon>
                </template>
                <v-list-item-title>Total Revenue</v-list-item-title>
                <v-list-item-subtitle class="text-right text-primary font-weight-bold">
                  {{ formatCurrency(totalRevenue) }} {/* Use helper */}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="info">mdi-cart</v-icon>
                </template>
                <v-list-item-title>Total Orders</v-list-item-title>
                <v-list-item-subtitle class="text-right text-info font-weight-bold">
                  {{ totalOrders.toLocaleString() }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="success">mdi-trending-up</v-icon>
                </template>
                <v-list-item-title>Avg Order Value</v-list-item-title>
                <v-list-item-subtitle class="text-right text-success font-weight-bold">
                  {{ formatCurrency(avgOrderValue) }} {/* Use helper */}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col cols="12" md="7"> {/* Adjusted cols */}
            <!-- Product revenue chart using BarChart -->
            <v-sheet height="250"> {/* Adjust height as needed */}
              <BarChart v-if="productMonthlyChartData.labels.length" :chart-data="productMonthlyChartData"
                :chart-options="productMonthlyChartOptions" />
              <div v-else class="d-flex align-center justify-center fill-height text-medium-emphasis">
                No monthly data to display.
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </div>

      <div v-else class="text-center pa-8">
        <v-icon size="48" color="grey">mdi-chart-box-outline</v-icon>
        <div class="text-h6 mt-4">
          No data available for {{ selectedProduct }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import BarChart from './BarChart.vue'; // Import BarChart

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const selectedProduct = ref("All Products");

// Generate product options from data
const productOptions = computed(() => {
  const products = ["All Products"];
  if (props.data && props.data.length) {
    props.data.forEach((item) => {
      if (item.product && !products.includes(item.product)) {
        products.push(item.product);
      }
    });
  }
  return products;
});

// Filter data based on selected product
const filteredData = computed(() => {
  if (!Array.isArray(props.data)) return [];

  if (selectedProduct.value === "All Products") {
    return props.data;
  }
  return props.data.filter(item => item.product === selectedProduct.value);
});

// Process data to get monthly figures
const monthlyData = computed(() => {
  const months = {};

  filteredData.value.forEach((item) => {
    if (item && item.month) {
      // Use Date object for reliable parsing and formatting
      const dateObj = new Date(item.month);
      if (isNaN(dateObj.getTime())) {
        console.warn("Invalid date encountered in product data:", item.month);
        return; // Skip this item
      }
      // Use a consistent, sortable key like YYYY-MM
      const monthKey = dateObj.toISOString().slice(0, 7); // "YYYY-MM"

      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey, // Store the sortable key
          revenue: 0,
          orders: 0
        };
      }

      // Accumulate values, ensuring they are treated as numbers
      months[monthKey].revenue += Number(item.total_revenue || 0);
      months[monthKey].orders += Number(item.total_orders || 0);
    }
  });

  // Convert to array and sort chronologically by the YYYY-MM key
  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
});

// --- Chart Data and Options ---

const productMonthlyChartData = computed(() => {
  const labels = monthlyData.value.map(item => {
    // Format YYYY-MM to a readable label like 'Jan 2023'
    try {
      const [year, month] = item.month.split('-');
      const date = new Date(year, month - 1); // month is 0-indexed
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) {
      return item.month; // Fallback
    }
  });
  const data = monthlyData.value.map(item => item.revenue);

  return {
    labels: labels,
    datasets: [
      {
        label: 'Monthly Revenue',
        data: data,
        backgroundColor: '#1976D2', // Example color
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    ],
  };
});

const productMonthlyChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // indexAxis: 'x', // Default is vertical bars
  scales: {
    y: { // Changed from x for vertical bars
      beginAtZero: true,
      ticks: {
        callback: function (value) {
          // Use compact notation for y-axis
          return '$' + new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value);
        }
      }
    },
    x: { // Changed from y
      ticks: {
        autoSkip: true, // Allow skipping labels if too crowded
        maxRotation: 0, // Keep labels horizontal
        minRotation: 0
      }
    }
  },
  plugins: {
    legend: { display: false }, // Hide legend for single dataset
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.y !== null) { // Use y for vertical bars
            label += formatCurrency(context.parsed.y); // Use currency formatter
          }
          return label;
        }
      }
    }
  },
}));


// Calculate key metrics
const totalRevenue = computed(() => {
  return filteredData.value.reduce(
    (sum, item) => sum + Number(item.total_revenue || 0),
    0
  );
});

const totalOrders = computed(() => {
  return filteredData.value.reduce(
    (sum, item) => sum + Number(item.total_orders || 0),
    0
  );
});

const avgOrderValue = computed(() => {
  const orders = totalOrders.value;
  return orders > 0 ? totalRevenue.value / orders : 0;
});

// --- Helper Functions ---
function formatCurrency(value) {
  if (value === undefined || value === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0 // Adjust as needed
  }).format(value);
}

// Remove unused maxRevenue, formatMonthLabel, formatShortMonth

// Initialize selectedProduct if options change and current selection is invalid
watch(productOptions, (newOptions) => {
  if (!newOptions.includes(selectedProduct.value)) {
    selectedProduct.value = "All Products";
  }
});

</script>

<style scoped>
/* Optional: Add some padding if needed */
.product-analytics {
  padding: 16px;
}
</style>
