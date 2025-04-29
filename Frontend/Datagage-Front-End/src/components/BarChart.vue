<template>
  <Bar :options="computedChartOptions" :data="computedChartData" :chart-id="chartId"
    :dataset-id-key="datasetIdKey" :plugins="plugins" :css-classes="cssClasses" :styles="styles" :width="width"
    :height="height" />
</template>

<script>
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { computed } from 'vue'; // Import computed

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
  name: 'BarChart',
  components: { Bar },
  props: {
    chartId: {
      type: String,
      default: 'bar-chart',
    },
    datasetIdKey: {
      type: String,
      default: 'label',
    },
    width: {
      type: Number,
      default: 400,
    },
    height: {
      type: Number,
      default: 300,
    },
    cssClasses: {
      default: '',
      type: String,
    },
    styles: {
      type: Object,
      default: () => ({}),
    },
    plugins: {
      type: Array,
      default: () => [],
    },
    chartData: {
      type: Object,
      required: true, // Keep required, remove default from previous attempts
    },
    chartOptions: {
      type: Object,
      default: () => ({ // Sensible defaults for options
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            // Default tooltip behavior is usually fine
          }
        }
      }),
    },
  },
  computed: {
    computedChartData() {
      // Ensure it always returns a valid structure expected by Chart.js
      // Check for labels and datasets arrays specifically.
      // If invalid, return a structure with an empty dataset object inside the datasets array.
      return this.chartData && Array.isArray(this.chartData.labels) && Array.isArray(this.chartData.datasets)
        ? this.chartData
        : { labels: [], datasets: [{ data: [] }] }; // Adjusted fallback structure
    },
    computedChartOptions() {
      // Simply pass through the options prop provided by the parent
      return this.chartOptions;
    }
  }
};
</script>
