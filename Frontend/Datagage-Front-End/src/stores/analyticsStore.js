import { defineStore } from "pinia";
import { ref, computed } from "vue";
import analyticsService from "@/services/analyticsService";
import { notify } from "@/utils/notifications";

export const useAnalyticsStore = defineStore("analytics", () => {
  // State
  const salesData = ref([]);
  const aiInsights = ref("");
  const loading = ref(false);
  const error = ref(null);
  const lastUpdated = ref(null);
  const currentFilters = ref({
    timeRange: 12,
    product: "all",
    customer: "all",
  });

  // Getters
  const filteredSalesData = computed(() => {
    return salesData.value || [];
  });

  // Actions
  async function fetchSalesData(filters = {}, forceRefresh = false) {
    try {
      loading.value = true;
      error.value = null;

      // Update filters with any new values
      currentFilters.value = {
        ...currentFilters.value,
        ...filters,
      };

      const { timeRange, product, customer } = currentFilters.value;

      // Check cache unless force refresh is requested
      const cacheKey = `sales_${timeRange}_${product}_${customer}`;
      const cachedData = !forceRefresh && localStorage.getItem(cacheKey);

      if (cachedData) {
        salesData.value = JSON.parse(cachedData);
      } else {
        const data = await analyticsService.getSalesData(
          timeRange,
          product,
          customer
        );
        salesData.value = data;

        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }

      lastUpdated.value = new Date().toISOString();
      return salesData.value;
    } catch (err) {
      error.value = err.message || "Failed to fetch sales data";
      notify.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function generateInsights(data = null) {
    try {
      loading.value = true;
      error.value = null;

      // Use provided data or current salesData
      const dataToAnalyze = data || salesData.value;

      if (!dataToAnalyze || dataToAnalyze.length === 0) {
        aiInsights.value = "No data available to generate insights.";
        return aiInsights.value;
      }

      // Include current filters context in the insights generation
      const filterContext = {
        timeRange: currentFilters.value.timeRange,
        product: currentFilters.value.product,
        customer: currentFilters.value.customer,
      };

      const insights = await analyticsService.getInsights(
        dataToAnalyze,
        filterContext
      );
      aiInsights.value = insights;

      return insights;
    } catch (err) {
      error.value = err.message || "Failed to generate insights";
      notify.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSalesAnalysis(months = 12, forceRefresh = false) {
    try {
      loading.value = true;
      error.value = null;

      currentFilters.value.timeRange = months;

      // Fetch sales data first with the updated timeRange
      await fetchSalesData({ timeRange: months }, forceRefresh);

      // Then generate insights based on this data
      await generateInsights();

      return {
        salesData: salesData.value,
        aiInsights: aiInsights.value,
      };
    } catch (err) {
      error.value = err.message || "Failed to fetch analysis";
      notify.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    salesData,
    aiInsights,
    loading,
    error,
    lastUpdated,
    currentFilters,

    // Getters
    filteredSalesData,

    // Actions
    fetchSalesData,
    generateInsights,
    fetchSalesAnalysis,
  };
});
