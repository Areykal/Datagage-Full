<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="pa-4" outlined tile>
              <v-card-title>Data Sources</v-card-title>
              <v-card-text>
                <v-list>
                  <SourceCard
                    v-for="source in sources"
                    :key="source.sourceId"
                    :source="source"
                    @click="fetchSourceDetails(source.sourceId)"
                  />
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="pa-4" outlined tile>
              <v-card-title>Data Visualization</v-card-title>
              <v-card-text>
                <!-- Placeholder for new chart component -->
                <GenericChart :chart-data="chartData" :chart-options="chartOptions" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.timeRange"
              label="Time Range"
              :items="timeRangeOptions"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.sourceId"
              label="Data Source"
              :items="sourceOptions"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.dataCategory"
              label="Data Category"
              :items="categoryOptions"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" class="d-flex align-center">
            <v-btn 
              color="primary"
              block
              @click="applyFilters"
              :loading="isLoading"
            >
              Apply Filters
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div v-if="isLoading && !dashboardId" class="pa-6 d-flex justify-center align-center" style="height: 400px">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <span class="ml-2">Loading visualization...</span>
        </div>
        
        <div v-else-if="error" class="pa-6">
          <v-alert type="error" variant="tonal">
            {{ error }}
            <template v-slot:append>
              <v-btn size="small" variant="text" @click="refreshDashboard">
                Retry
              </v-btn>
            </template>
          </v-alert>
        </div>
        
        <div v-else-if="!dashboardId" class="pa-6 d-flex flex-column align-center">
          <v-icon icon="mdi-chart-box-outline" size="64" color="grey"></v-icon>
          <div class="text-subtitle-1 mt-4 text-center">No visualization available</div>
          <div class="text-caption text-center mb-4">Select a data source and apply filters to generate a visualization</div>
          <v-btn @click="showFilters = true" color="primary">Select Data Source</v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import sourceService from '@/services/sourceService';
import analyticsService from '@/services/analyticsService';
import SourceCard from '@/components/SourceCard.vue';
import GenericChart from '@/components/GenericChart.vue';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';

const route = useRoute();
const notificationStore = useNotificationStore();
const analyticsStore = useAnalyticsStore();

// State management
const source = ref(null);
const sources = ref([]);
const dashboardId = ref(null);
const isLoading = ref(true);
const error = ref(null);
const chartData = ref(null);
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
});

// Filter options
const timeRangeOptions = [
  { title: 'Last 24 Hours', value: '1d' },
  { title: 'Last 7 Days', value: '7d' },
  { title: 'Last 30 Days', value: '30d' },
  { title: 'Last 90 Days', value: '90d' },
  { title: 'This Year', value: 'ytd' },
  { title: 'All Time', value: 'all' }
];

const categoryOptions = [
  { title: 'All Categories', value: 'all' },
  { title: 'Sales Data', value: 'sales' },
  { title: 'User Activity', value: 'user_activity' },
  { title: 'Inventory', value: 'inventory' },
  { title: 'Marketing', value: 'marketing' }
];

// Current filters
const filters = ref({
  timeRange: '30d',
  sourceId: 'all',
  dataCategory: 'all'
});

// Show filters modal
const showFilters = ref(false);

// Computed properties
const sourceOptions = computed(() => {
  const options = [{ title: 'All Sources', value: 'all' }];
  
  sources.value.forEach(source => {
    // Include source status with a visual indicator
    const statusIndicator = source.status === 'active' ? '● ' : '○ ';
    options.push({
      title: `${statusIndicator}${source.name}`,
      value: source.sourceId
    });
  });
  
  return options;
});

// Methods
const fetchSourceDetails = async (sourceId) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await sourceService.getSourceDetails(sourceId);
    source.value = response.data;
    await fetchAnalyticsData(source.value.tableName);
  } catch (err) {
    console.error('Error fetching source details:', err);
    error.value = 'Failed to load source details';
  } finally {
    isLoading.value = false;
  }
};

// Function to fetch analytics data
const fetchAnalyticsData = async (tableName) => {
  try {
    isLoading.value = true;
    // Example: Fetch time series data
    const data = await analyticsService.getTimeSeriesData({
      tableName,
      timeColumn: 'created_at',
      granularity: 'day',
      metrics: ['count(*)']
    });

    // Process data for Chart.js (example for a line chart)
    chartData.value = {
      labels: data.map(item => new Date(item.time_bucket).toLocaleDateString()),
      datasets: [
        {
          label: `Records per day in ${tableName}`,
          backgroundColor: '#f87979',
          borderColor: '#f87979',
          data: data.map(item => item.metric_value),
          fill: false,
          tension: 0.1
        }
      ]
    };
    notificationStore.addNotification({ message: 'Analytics data loaded.', type: 'success' });
  } catch (err) {
    console.error('Error fetching analytics data:', err);
    notificationStore.addNotification({ message: `Error fetching analytics data: ${err.message || 'Unknown error'}`, type: 'error' });
    error.value = 'Failed to load analytics data.';
    chartData.value = null; // Clear chart data on error
  } finally {
    isLoading.value = false;
  }
};

// Apply filters to the visualization
const applyFilters = async () => {
  if (filters.value.sourceId === 'all') {
    error.value = 'Please select a specific data source.';
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    
    // Fetch source details if not already loaded
    if (!source.value || source.value.sourceId !== filters.value.sourceId) {
      await fetchSourceDetails(filters.value.sourceId);
    }
    
    // Fetch filtered data based on current filter settings
    await fetchAnalyticsData(
      source.value.tableName, 
      filters.value.timeRange,
      filters.value.dataCategory
    );
  } catch (err) {
    console.error('Error applying filters:', err);
    error.value = 'Failed to apply filters';
  } finally {
    isLoading.value = false;
  }
};

const refreshDashboard = async () => {
  if (source.value) {
    await fetchSourceDetails(source.value.sourceId);
  } else {
    await fetchSources();  // Fallback to fetching all sources
  }
};

const fetchSources = async () => {
  try {
    isLoading.value = true;
    const response = await sourceService.getAllSources();
    sources.value = response.data || [];
    
    if (sources.value.length === 0) {
      error.value = 'No data sources found';
    }
  } catch (err) {
    console.error('Error fetching sources:', err);
    error.value = 'Failed to load data sources';
    notificationStore.addNotification({ message: `Error: ${err.message || 'Failed to load sources'}`, type: 'error' });
  } finally {
    isLoading.value = false;
  }
};

// Fetch data on component mount
onMounted(async () => {
  await fetchSources();
  
  // Check if route has a source ID parameter
  if (route.params.id) {
    await fetchSourceDetails(route.params.id);
  }
});

// Watch for route changes
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await fetchSourceDetails(newId);
  }
});
</script>

<style scoped>
/* Add any specific styles if needed */
.v-card-text {
  min-height: 300px; /* Ensure space for the chart */
  position: relative; /* Needed for chart responsiveness */
}
</style>
