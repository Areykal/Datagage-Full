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
  const metabaseUrl = ref(null);
  const currentFilters = ref({
    timeRange: 12,
    product: "all",
    customer: "all",
  });

  // Cached data keyed by filter combinations
  const dataCache = ref({});
  const insightsCache = ref({});

  // Cache TTL in minutes
  const CACHE_TTL_MINUTES = 10;

  // Getters
  const filteredSalesData = computed(() => {
    return salesData.value || [];
  });

  const revenueByProduct = computed(() => {
    if (!salesData.value?.length) return [];

    const productTotals = {};
    salesData.value.forEach(item => {
      if (!productTotals[item.product]) {
        productTotals[item.product] = 0;
      }
      productTotals[item.product] += Number(item.total_revenue);
    });

    return Object.entries(productTotals).map(([product, total]) => ({
      product,
      total_revenue: total
    })).sort((a, b) => b.total_revenue - a.total_revenue);
  });

  const customerMetrics = computed(() => {
    if (!salesData.value?.length) return {};
    
    const totalCustomers = new Set();
    salesData.value.forEach(item => {
      const customer = item.customer || item.customer_name;
      if (customer) totalCustomers.add(customer);
    });
    
    const totalOrders = salesData.value.reduce(
      (sum, item) => sum + Number(item.total_orders || 0), 0
    );
    
    return {
      uniqueCustomers: totalCustomers.size,
      totalOrders,
      averageOrdersPerCustomer: totalCustomers.size ? 
        (totalOrders / totalCustomers.size).toFixed(2) : 0,
    };
  });

  // Helpers
  const getCacheKey = (filters = {}) => {
    const { timeRange, product, customer } = {
      ...currentFilters.value,
      ...filters,
    };
    return `sales_${timeRange}_${product}_${customer}`;
  };

  const isCacheValid = (timestamp) => {
    if (!timestamp) return false;
    const now = new Date().getTime();
    const cacheTime = new Date(timestamp).getTime();
    const diffMinutes = (now - cacheTime) / (1000 * 60);
    return diffMinutes < CACHE_TTL_MINUTES;
  };

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

      const cacheKey = getCacheKey();
      const cachedEntry = dataCache.value[cacheKey];

      // Use cache if available and not forcing refresh
      if (!forceRefresh && cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        salesData.value = cachedEntry.data;
        lastUpdated.value = cachedEntry.timestamp;
        return salesData.value;
      }

      // Otherwise fetch fresh data
      const data = await analyticsService.getSalesData(
        currentFilters.value.timeRange,
        currentFilters.value.product,
        currentFilters.value.customer
      );
      
      // Update state
      salesData.value = data;
      lastUpdated.value = new Date().toISOString();
      
      // Update cache
      dataCache.value[cacheKey] = {
        data,
        timestamp: lastUpdated.value
      };
      
      // Store in localStorage for persistence across sessions
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: lastUpdated.value
      }));

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
      
      // Check insights cache if analyzing global data set
      const cacheKey = data ? null : `insights_${getCacheKey()}`;
      if (cacheKey && insightsCache.value[cacheKey] && isCacheValid(insightsCache.value[cacheKey].timestamp)) {
        aiInsights.value = insightsCache.value[cacheKey].insights;
        return aiInsights.value;
      }

      loading.value = true;
      const insights = await analyticsService.getInsights(
        dataToAnalyze,
        filterContext
      );
      aiInsights.value = insights;
      
      // Cache insights for the current filter set
      if (cacheKey) {
        insightsCache.value[cacheKey] = {
          insights,
          timestamp: new Date().toISOString()
        };
      }

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

      // Also try to fetch metabase URL if available
      try {
        const metabaseResponse = await analyticsService.getMetabaseUrl();
        if (metabaseResponse && metabaseResponse.url) {
          metabaseUrl.value = metabaseResponse.url;
        }
      } catch (metabaseErr) {
        // Non-critical error, just log
        console.warn("Could not fetch Metabase URL:", metabaseErr);
      }

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

  // Method to clear cache - useful for debugging or if data structure changes
  function clearCache() {
    // Clear in-memory cache
    dataCache.value = {};
    insightsCache.value = {};
    
    // Clear localStorage cache for sales data
    const keys = Object.keys(localStorage).filter(key => key.startsWith('sales_'));
    keys.forEach(key => localStorage.removeItem(key));
    
    notify.info("Analytics cache cleared");
  }

  // Load initial cached data from localStorage on store initialization
  function loadCachedData() {
    try {
      // Find all localStorage items that start with sales_
      const keys = Object.keys(localStorage).filter(key => key.startsWith('sales_'));
      
      for (const key of keys) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (cached && cached.data && cached.timestamp) {
            dataCache.value[key] = cached;
          }
        } catch (e) {
          // Ignore invalid cache entries
          console.warn(`Invalid cache entry for ${key}`, e);
        }
      }
      
      console.log(`Loaded ${Object.keys(dataCache.value).length} cached analytics data entries`);
    } catch (e) {
      console.error("Failed to load cached analytics data", e);
    }
  }
  
  // Initialize cache from localStorage
  loadCachedData();

  return {
    // State
    salesData,
    aiInsights,
    loading,
    error,
    lastUpdated,
    currentFilters,
    metabaseUrl,

    // Getters
    filteredSalesData,
    revenueByProduct,
    customerMetrics,

    // Actions
    fetchSalesData,
    generateInsights,
    fetchSalesAnalysis,
    clearCache,
  };
});
