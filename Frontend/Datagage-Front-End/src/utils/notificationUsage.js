/**
 * Notification System Usage Examples
 *
 * This file provides examples of how to use the notification system throughout the application.
 * Note: This file is for documentation purposes only and is not meant to be imported.
 */

// OPTION 1: Using the notify utility (recommended for components)
import { notify } from "@/utils/notifications";

// Basic usage
notify.success("Operation successful");
notify.error("Something went wrong");
notify.warning("Please be careful");
notify.info("For your information");

// With options
notify.success("Item created successfully", {
  title: "Success", // Add a title
  timeout: 3000, // Override default timeout (in ms)
  position: "top-right", // Position: top-right, top-left, top-center, bottom-right, etc.
});

// OPTION 2: Using the store directly
import { useNotificationStore } from "@/stores/notification";

const notificationStore = useNotificationStore();

// Basic usage with store
notificationStore.showSuccess("Operation successful");
notificationStore.showError("Something went wrong");

// Full control with show method
notificationStore.show(
  "Custom notification", // message
  "info", // type: success, error, warning, info
  5000, // timeout in ms (0 for no auto-dismiss)
  "bottom-center", // position
  "Custom Title" // title
);

// OPTION 3: From templates using the global $notify
// Available in template after installing the plugin
// <v-btn @click="$notify.success('Button clicked!')">Click Me</v-btn>
