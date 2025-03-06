/**
 * Notification system constants shared across the application
 */

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error", 
  WARNING: "warning",
  INFO: "info"
};

// Notification positions
export const NOTIFICATION_POSITIONS = {
  TOP_RIGHT: "top-right",
  TOP_LEFT: "top-left",
  TOP_CENTER: "top-center",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_CENTER: "bottom-center"
};

// Notification icons mapping
export const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.SUCCESS]: "mdi-check-circle",
  [NOTIFICATION_TYPES.ERROR]: "mdi-alert-circle",
  [NOTIFICATION_TYPES.WARNING]: "mdi-alert",
  [NOTIFICATION_TYPES.INFO]: "mdi-information"
};

// Notification colors mapping for Vuetify
export const NOTIFICATION_COLORS = {
  [NOTIFICATION_TYPES.SUCCESS]: "success",
  [NOTIFICATION_TYPES.ERROR]: "error",
  [NOTIFICATION_TYPES.WARNING]: "warning",
  [NOTIFICATION_TYPES.INFO]: "info"
};

// Default notification settings
export const DEFAULT_NOTIFICATION_OPTIONS = {
  duration: 5000,
  position: NOTIFICATION_POSITIONS.TOP_RIGHT,
  closable: true,
};