// Simple notification system without external dependencies

// Store for notifications
const notifications = [];
let nextId = 1;

// Default options
const DEFAULT_OPTIONS = {
  duration: 5000,
  position: "top-right",
  closable: true,
};

// Import for the store - will be used with a getter function
import { useNotificationStore } from "@/stores/notificationStore";

// Debug flag - set to false in production
const DEBUG = false;

// Create a getter function that will only be called when Pinia is ready
let _store = null;
const getStore = () => {
  if (!_store) {
    try {
      _store = useNotificationStore();
    } catch (error) {
      console.warn("Notification store not available yet, will retry later");
    }
  }
  return _store;
};

/**
 * Creates and shows a notification
 */
function showNotification(message, type, customOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `datagage-notification datagage-${type}`;
  notification.style.position = "fixed";
  notification.style.padding = "12px 16px";
  notification.style.borderRadius = "4px";
  notification.style.boxShadow = "0 3px 6px rgba(0,0,0,0.16)";
  notification.style.margin = "8px";
  notification.style.maxWidth = "350px";
  notification.style.transition = "all 0.3s ease";
  notification.style.zIndex = "9999";

  // Set colors based on type
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#4caf50";
      notification.style.color = "white";
      break;
    case "error":
      notification.style.backgroundColor = "#f44336";
      notification.style.color = "white";
      break;
    case "warning":
      notification.style.backgroundColor = "#ff9800";
      notification.style.color = "white";
      break;
    case "info":
    default:
      notification.style.backgroundColor = "#2196f3";
      notification.style.color = "white";
  }

  // Set position
  const position = options.position.split("-");
  if (position[0] === "top") {
    notification.style.top = "20px";
  } else {
    notification.style.bottom = "20px";
  }

  if (position[1] === "left") {
    notification.style.left = "20px";
  } else {
    notification.style.right = "20px";
  }

  // Add title if provided
  let content = "";
  if (options.title) {
    content += `<div style="font-weight: bold; margin-bottom: 4px">${options.title}</div>`;
  }

  // Add message
  content += `<div>${message}</div>`;

  notification.innerHTML = content;

  // Add close button if closable
  if (options.closable) {
    const closeBtn = document.createElement("div");
    closeBtn.innerHTML = "×";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "8px";
    closeBtn.style.right = "8px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "18px";
    closeBtn.onclick = () => removeNotification(notification);
    notification.appendChild(closeBtn);
    notification.style.paddingRight = "28px";
  }

  // Add to DOM
  document.body.appendChild(notification);

  // Add to store
  const id = nextId++;
  const notificationData = {
    id,
    type,
    message,
    element: notification,
    timestamp: new Date(),
    read: false,
  };
  notifications.push(notificationData);

  // Auto remove after duration if set
  if (options.duration) {
    setTimeout(() => {
      removeNotification(notification);
    }, options.duration);
  }

  return notificationData;
}

function removeNotification(element) {
  // Find the notification in store
  const index = notifications.findIndex((n) => n.element === element);

  if (index !== -1) {
    // Remove from DOM with animation
    element.style.opacity = "0";
    element.style.transform = "translateX(40px)";
    setTimeout(() => {
      document.body.removeChild(element);
    }, 300);

    // Remove from store
    notifications.splice(index, 1);
  }
}

/**
 * Utilities for displaying notifications
 */
export const notify = {
  /**
   * Show a notification message
   * @param {string} message - Message to display
   * @param {string} type - Type of notification: 'success', 'error', 'info', 'warning'
   * @param {number} duration - How long to show the notification in ms
   */
  show(message, type = "info", duration = 5000, position = DEFAULT_OPTIONS.position, title = "") {
    if (DEBUG) console.log(`[NOTIFICATION] ${type}: ${message}`);
    
    // Try to use the store if available
    const store = getStore();
    if (store) {
      store.add({
        message,
        type,
        duration,
        position,
        title
      });
    } else {
      // Fallback to simple notification if store not available
      showNotification(message, type, { duration, position, title });
    }
  },

  /**
   * Show a success notification
   * @param {string} message - Message to display
   * @param {Object|number} options - Options or duration in ms
   */
  success(message, options = {}) {
    if (typeof options === 'number') {
      options = { duration: options };
    }
    this.show(message, "success", options.duration, options.position, options.title);
  },

  /**
   * Show an error notification
   * @param {string} message - Message to display
   * @param {Object|number} options - Options or duration in ms
   */
  error(message, options = {}) {
    if (typeof options === 'number') {
      options = { duration: options };
    }
    this.show(message, "error", options.duration, options.position, options.title);
  },

  /**
   * Show an info notification
   * @param {string} message - Message to display
   * @param {Object|number} options - Options or duration in ms
   */
  info(message, options = {}) {
    if (typeof options === 'number') {
      options = { duration: options };
    }
    this.show(message, "info", options.duration, options.position, options.title);
  },

  /**
   * Show a warning notification
   * @param {string} message - Message to display
   * @param {Object|number} options - Options or duration in ms
   */
  warning(message, options = {}) {
    if (typeof options === 'number') {
      options = { duration: options };
    }
    this.show(message, "warning", options.duration, options.position, options.title);
  },
};

// For debugging - log the notification system status
if (DEBUG) {
  console.log("[NOTIFICATION] Notification utility loaded");
}

export default notify;

// Plugin for Vue
export const notificationPlugin = {
  install: (app) => {
    app.config.globalProperties.$notify = notify;
  },
};
