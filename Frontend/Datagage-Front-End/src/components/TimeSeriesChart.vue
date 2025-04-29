<template>
  <div class="time-series-chart">
    <!-- Updated v-if condition to check the object structure -->
    <div v-if="!chartData || !chartData.labels || chartData.labels.length === 0"
      class="d-flex justify-center align-center pa-8">
      <v-icon size="48" color="grey" class="mr-4">mdi-chart-timeline-variant</v-icon>
      <div class="text-subtitle-1">No data available for chart</div>
    </div>
    <div v-else>
      <!-- Pass chartData prop directly -->
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
// Removed 'computed' as formattedData is no longer needed here
import { ref } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Props
const props = defineProps({
  chartData: {
    // Changed type to Object
    type: Object,
    default: () => ({ labels: [], datasets: [] }) // Default to empty Chart.js object
  },
  title: { // Title prop might not be used anymore if dataset label is set upstream
    type: String,
    default: 'Time Series Data'
  },
  color: { // Color prop might not be used anymore if dataset color is set upstream
    type: String,
    default: '#1976D2' // Default Vuetify primary color
  }
});

// Chart options (can potentially be simplified or made more dynamic if needed)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true
    }
  },
  plugins: {
    legend: {
      display: true // Keep legend display, assuming datasets have labels
    },
    // Tooltip configuration can be added here if needed
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
    }
  }
};

// Removed the formattedData computed property as the data is expected pre-formatted

</script>

<style scoped>
.time-series-chart {
  position: relative;
  height: 300px;
  /* Ensure height is sufficient */
}
</style>