import { ref, computed } from "vue";
import { defineStore } from "pinia";
import analyticsService from "@/services/analyticsService";
import { useNotificationStore } from "./notificationStore";

// Define cache duration (e.g., 5 minutes in milliseconds)
const CACHE_DURATION_MS = 5 * 60 * 1000;

export const useAnalyticsStore = defineStore(
  "analytics", // Store ID
  () => {
    const notificationStore = useNotificationStore();

    // --- State ---
    const salesOverview = ref({});
    const salesDetailData = ref([]);
    const aiInsights = ref(""); // Holds the final non-streaming insights (can be deprecated if unused)
    const streamingInsightsContent = ref(""); // Holds the progressively built streaming content
    const dataLoading = ref(false); // Loading state for main sales data
    const insightsLoading = ref(false); // Loading state specifically for AI insights generation (streaming or not)
    const isStreamingInsights = ref(false); // Flag to indicate if streaming is active
    const error = ref(null);
    const lastUpdated = ref(null);
    const currentFilters = ref({
      timeRange: 12,
      product: "all",
      customer: "all",
    });

    // --- Computed Properties ---
    const hasData = computed(
      () =>
        salesDetailData.value.length > 0 ||
        salesOverview.value?.totalRevenue !== undefined
    );

    // ... existing metrics computed ...
    const metrics = computed(() => [
      {
        title: "Total Revenue",
        // Use optional chaining and nullish coalescing for safety
        value: `$${
          salesOverview.value?.totalRevenue?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) ?? "0.00"
        }`,
        trend: salesOverview.value?.revenueTrend ?? null, // Default trend to null if data missing
        icon: "mdi-currency-usd",
        color: "primary",
      },
      {
        title: "Total Orders",
        value: salesOverview.value?.totalOrders?.toLocaleString() ?? "0",
        trend: salesOverview.value?.ordersTrend ?? null,
        icon: "mdi-cart-outline",
        color: "secondary",
      },
      {
        title: "Unique Customers",
        value: salesOverview.value?.uniqueCustomers?.toLocaleString() ?? "0",
        trend: salesOverview.value?.customersTrend ?? null,
        icon: "mdi-account-group-outline",
        color: "accent",
      },
      {
        title: "Avg. Order Value",
        value: `$${
          salesOverview.value?.avgOrderValue?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) ?? "0.00"
        }`,
        trend: salesOverview.value?.aovTrend ?? null,
        icon: "mdi-chart-line",
        color: "info",
      },
    ]);

    // ... existing revenueByProduct computed ...
    const revenueByProduct = computed(() => {
      if (!salesDetailData.value || salesDetailData.value.length === 0)
        return [];
      const productMap = new Map();
      salesDetailData.value.forEach((item) => {
        const product = item.product || "Unknown Product";
        // Ensure values are numbers, default to 0 if null/undefined
        const revenue = Number(item.total_revenue || 0);
        const orders = Number(item.total_orders || 0);
        const quantity = Number(item.items_sold || 0);

        if (!productMap.has(product)) {
          productMap.set(product, {
            product,
            total_revenue: 0,
            total_orders: 0,
            total_quantity: 0,
          });
        }
        const current = productMap.get(product);
        current.total_revenue += revenue;
        current.total_orders += orders;
        current.total_quantity += quantity;
      });
      return Array.from(productMap.values())
        .map((p) => ({
          ...p,
          avg_order_value:
            p.total_orders > 0 ? p.total_revenue / p.total_orders : 0,
          avg_price_per_unit:
            p.total_quantity > 0 ? p.total_revenue / p.total_quantity : 0,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue);
    });

    // ... existing customerMetrics computed ...
    const customerMetrics = computed(() => {
      if (!salesDetailData.value || salesDetailData.value.length === 0)
        return [];
      const customerMap = new Map();
      salesDetailData.value.forEach((item) => {
        const customer = item.customer_name || "Unknown Customer";
        const revenue = Number(item.total_revenue || 0);
        const orders = Number(item.total_orders || 0);

        if (!customerMap.has(customer)) {
          customerMap.set(customer, {
            customer_name: customer,
            total_revenue: 0,
            total_orders: 0,
          });
        }
        const current = customerMap.get(customer);
        current.total_revenue += revenue;
        current.total_orders += orders;
      });
      return Array.from(customerMap.values())
        .map((c) => ({
          ...c,
          avg_order_value:
            c.total_orders > 0 ? c.total_revenue / c.total_orders : 0,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue);
    });

    // --- NEW: Computed property for quantity by product ---
    const quantityByProduct = computed(() => {
      if (!salesDetailData.value || salesDetailData.value.length === 0)
        return [];
      const productMap = new Map();
      salesDetailData.value.forEach((item) => {
        const product = item.product || "Unknown Product";
        const quantity = Number(item.items_sold || 0); // Use items_sold

        if (!productMap.has(product)) {
          productMap.set(product, {
            product,
            total_quantity: 0,
            // Include revenue/orders if needed for other potential metrics later
            total_revenue: Number(item.total_revenue || 0),
            total_orders: Number(item.total_orders || 0),
          });
        } else {
          const current = productMap.get(product);
          current.total_quantity += quantity;
          // Aggregate other metrics if they were initialized
          current.total_revenue += Number(item.total_revenue || 0);
          current.total_orders += Number(item.total_orders || 0);
        }
      });
      // Sort by quantity descending
      return Array.from(productMap.values()).sort(
        (a, b) => b.total_quantity - a.total_quantity
      );
    });

    // --- NEW: Computed property for orders by customer ---
    const ordersByCustomer = computed(() => {
      if (!salesDetailData.value || salesDetailData.value.length === 0)
        return [];
      const customerMap = new Map();
      salesDetailData.value.forEach((item) => {
        const customer = item.customer_name || "Unknown Customer";
        const orders = Number(item.total_orders || 0);
        const revenue = Number(item.total_revenue || 0); // Keep revenue for potential AOV calculation

        if (!customerMap.has(customer)) {
          customerMap.set(customer, {
            customer_name: customer,
            total_orders: 0,
            total_revenue: 0,
          });
        }
        const current = customerMap.get(customer);
        current.total_orders += orders;
        current.total_revenue += revenue;
      });
      // Sort by order count descending
      return Array.from(customerMap.values())
        .map((c) => ({
          ...c,
          avg_order_value:
            c.total_orders > 0 ? c.total_revenue / c.total_orders : 0,
        }))
        .sort((a, b) => b.total_orders - a.total_orders);
    });

    // ... existing monthlyRevenueTrend computed ...
    const monthlyRevenueTrend = computed(() => {
      if (!salesDetailData.value || salesDetailData.value.length === 0)
        return { labels: [], datasets: [] };

      const monthlyMap = new Map();
      salesDetailData.value.forEach((item) => {
        const dateObj = new Date(item.month); // Assuming 'month' is like 'YYYY-MM-01T...'
        if (isNaN(dateObj.getTime())) {
          console.warn("Invalid date encountered in detail data:", item.month);
          return;
        }
        // Format consistently, e.g., "YYYY-MM" or "Mon YYYY"
        const monthKey = dateObj.toLocaleDateString("en-CA", {
          year: "numeric",
          month: "short",
        }); // e.g., "Jan 2023"
        const revenue = Number(item.total_revenue || 0);

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, 0);
        }
        monthlyMap.set(monthKey, monthlyMap.get(monthKey) + revenue);
      });

      const sortedKeys = Array.from(monthlyMap.keys()).sort(
        (a, b) => new Date(a) - new Date(b)
      );
      const labels = sortedKeys;
      const data = sortedKeys.map((key) => monthlyMap.get(key));

      return {
        labels,
        datasets: [
          {
            label: "Monthly Revenue",
            data,
            borderColor: "#4CAF50",
            tension: 0.1,
            fill: false,
          },
        ],
      };
    });

    // --- Actions ---
    async function fetchSalesAnalytics(filters = {}, forceRefresh = false) {
      const currentFilterValues = {
        timeRange: currentFilters.value.timeRange,
        product: currentFilters.value.product,
        customer: currentFilters.value.customer,
      };
      const incomingFilters =
        typeof filters === "object" && filters !== null ? filters : {};
      const effectiveFilters = { ...currentFilterValues, ...incomingFilters };

      // Update current filters state
      currentFilters.value = effectiveFilters;

      const now = new Date();
      const isCacheValid =
        lastUpdated.value &&
        now.getTime() - lastUpdated.value.getTime() < CACHE_DURATION_MS &&
        !forceRefresh;

      // Use cached data if valid and not forcing refresh
      if (isCacheValid) {
        console.log("Using cached analytics data.");
        // Optionally trigger insights refresh even if data is cached
        if (
          hasData.value &&
          !insightsLoading.value &&
          !isStreamingInsights.value
        ) {
          // Check if insights aren't already loading/streaming
          streamInsights(); // Use the new streaming function
        }
        return;
      }

      console.log(
        "Fetching fresh analytics data with filters:",
        effectiveFilters
      );
      dataLoading.value = true;
      error.value = null;

      try {
        // Fetch both overview and detail data in parallel
        const [overviewResult, detailResult] = await Promise.all([
          // Pass the entire filters object
          analyticsService.getSalesOverview(effectiveFilters),
          // Pass the entire filters object
          analyticsService.getSalesDetailData(effectiveFilters),
        ]);

        // Process overview data
        if (overviewResult) {
          salesOverview.value = overviewResult;
        } else {
          // Handle case where overview data might be missing or empty
          salesOverview.value = {}; // Reset or set to default structure
          console.warn("Sales overview data was empty or missing.");
        }

        // Process detail data
        if (Array.isArray(detailResult)) {
          salesDetailData.value = detailResult;
        } else {
          // Handle case where detail data is not an array
          salesDetailData.value = []; // Reset to empty array
          console.warn(
            "Sales detail data was not in the expected array format."
          );
        }

        lastUpdated.value = new Date();
        console.log("Analytics data updated:", {
          overview: salesOverview.value,
          detailsCount: salesDetailData.value.length,
        });

        // Trigger insights generation after data is fetched
        if (hasData.value) {
          streamInsights(); // Use the new streaming function
        } else {
          aiInsights.value = ""; // Clear insights if no data
          streamingInsightsContent.value = ""; // Clear streaming content too
        }
      } catch (err) {
        console.error("Failed to fetch sales analytics:", err);
        error.value = err.message || "Failed to load analytics data.";
        notificationStore.add({
          message: error.value,
          type: "error",
        });
        // Reset data on error? Optional, depends on desired UX
        // salesOverview.value = {};
        // salesDetailData.value = [];
      } finally {
        dataLoading.value = false;
      }
    }

    // --- NEW: Action to stream AI insights ---
    async function streamInsights() {
      if (!hasData.value) {
        notificationStore.add({
          message: "No data available to generate insights.",
          type: "warning",
        });
        return;
      }
      if (isStreamingInsights.value) {
        notificationStore.add({
          message: "Insights generation already in progress.",
          type: "info",
        });
        return; // Don't start another stream if one is active
      }

      console.log("Starting AI insights stream...");
      insightsLoading.value = true;
      isStreamingInsights.value = true;
      streamingInsightsContent.value = ""; // Clear previous streaming content
      aiInsights.value = ""; // Clear previous final insights
      error.value = null; // Clear previous errors specific to insights

      const filterContext = {
        months: currentFilters.value.timeRange,
        product: currentFilters.value.product,
        customer: currentFilters.value.customer,
      };

      // Prepare data payload
      const payload = {
        filterContext: filterContext,
        overviewData: salesOverview.value,
        // Avoid sending large detailData. Backend's analyzeDataStream uses this.
        // If the backend *requires* detail data for the prompt, send a sample or summary.
        // detailData: salesDetailData.value.slice(0, 10) // Example: send only first 10 rows
      };

      try {
        const response = await fetch("/api/analytics/insights-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream", // Indicate we expect an SSE stream
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          // Handle non-2xx responses before trying to read the stream
          const errorText = await response.text(); // Get raw text for better debugging
          let errorJson = {};
          try {
            errorJson = JSON.parse(errorText);
          } catch (e) {
            /* Ignore parse error if response wasn't JSON */
          }
          console.error(`HTTP error ${response.status}: ${errorText}`);
          throw new Error(
            errorJson.error ||
              errorJson.message ||
              `Failed to start insights stream: ${response.statusText}`
          );
        }

        if (!response.body) {
          throw new Error("Response body is null, cannot read stream.");
        }

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (value) {
            // Check if value exists before processing
            buffer += value;
            // Process buffer line by line for SSE messages
            // SSE messages end with \n\n
            let boundary = buffer.indexOf("\n\n");
            while (boundary !== -1) {
              const message = buffer.substring(0, boundary);
              buffer = buffer.substring(boundary + 2); // Skip the \n\n

              if (message.startsWith("data: ")) {
                const dataString = message.substring(6).trim(); // Remove 'data: ' prefix and trim whitespace

                if (dataString === "[DONE]") {
                  console.log("Received [DONE] signal.");
                  // The stream will end naturally when done is true
                } else {
                  try {
                    const parsedData = JSON.parse(dataString);
                    if (parsedData.content) {
                      streamingInsightsContent.value += parsedData.content;
                    } else if (parsedData.error) {
                      console.error(
                        "Received error message in stream:",
                        parsedData.error
                      );
                      error.value = `Streaming Error: ${parsedData.error}`;
                      // --- FIX: Correct typo addNotification -> add ---
                      notificationStore.add({
                        message: error.value,
                        type: "error",
                      });
                      // --- END FIX ---
                      // Don't cancel reader here, let it finish naturally or via done flag
                    }
                  } catch (parseError) {
                    console.error(
                      "Failed to parse stream data chunk:",
                      dataString,
                      parseError
                    );
                    // --- FIX: Add notification for parse error ---
                    notificationStore.add({
                      message: "Error processing insights stream data.",
                      type: "error",
                    });
                    // --- END FIX ---
                  }
                }
              }
              boundary = buffer.indexOf("\n\n");
            } // End while boundary !== -1
          } // end if(value)

          if (done) {
            console.log("Stream finished.");
            if (buffer.length > 0) {
              console.warn(
                "Stream ended with unprocessed buffer content:",
                buffer
              );
              // Attempt to process any remaining buffer content if needed
            }
            break; // Exit the loop
          }
        } // End while(true) reader loop
      } catch (err) {
        console.error("Failed to stream AI insights:", err);
        error.value = err.message || "Failed to stream AI insights.";
        notificationStore.add({
          message: error.value,
          type: "error",
        });
      } finally {
        console.log("Stream processing ended.");
        insightsLoading.value = false;
        isStreamingInsights.value = false;
        // Final content is now in streamingInsightsContent
      }
    }

    return {
      // State
      salesOverview,
      salesDetailData,
      aiInsights, // Keep if needed for non-streaming or final result
      streamingInsightsContent, // New state for streaming
      dataLoading,
      insightsLoading,
      isStreamingInsights, // New flag
      error,
      lastUpdated,
      currentFilters,

      // Computed
      hasData,
      metrics,
      revenueByProduct,
      customerMetrics,
      quantityByProduct,
      ordersByCustomer,
      monthlyRevenueTrend,

      // Actions
      fetchSalesAnalytics,
      streamInsights, // New action
    };
  },
  {
    // Optional: Pinia Persist configuration (if needed)
    // persist: true, // Example: Persist the entire store
  }
);
