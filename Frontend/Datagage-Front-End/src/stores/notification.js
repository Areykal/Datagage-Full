import { reactive } from "vue";

// Debug flag - set to true to see notification store events in console
const DEBUG = true;

// Create a reactive notification store
export const notificationStore = reactive({
  notification: null,
  timeout: null,

  show(message, type = "info", duration = 5000) {
    if (DEBUG)
      console.log(`[NOTIFICATION STORE] Showing: ${type} - ${message}`);

    this.clear();
    this.notification = { message, type, timestamp: Date.now() };

    if (duration > 0) {
      this.timeout = setTimeout(() => {
        this.clear();
      }, duration);
    }

    // Return the notification for chaining if needed
    return this.notification;
  },

  clear() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.notification) {
      if (DEBUG) console.log("[NOTIFICATION STORE] Clearing notification");
      this.notification = null;
    }
  },

  // Helper methods for common notification types
  info(message, duration) {
    return this.show(message, "info", duration);
  },

  success(message, duration) {
    return this.show(message, "success", duration);
  },

  warning(message, duration) {
    return this.show(message, "warning", duration);
  },

  error(message, duration) {
    return this.show(message, "error", duration);
  },
});

// For debugging - confirm the store is created
if (DEBUG) {
  console.log("[NOTIFICATION STORE] Store initialized:", notificationStore);

  // Test notification
  setTimeout(() => {
    console.log("[NOTIFICATION STORE] Testing notification");
    notificationStore.info("Notification system test");
  }, 1000);
}

export default notificationStore;
