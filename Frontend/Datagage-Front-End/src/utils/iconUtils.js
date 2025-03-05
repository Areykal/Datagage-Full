/**
 * Utility functions for handling icons
 */

// Standard mapping of source types to Material Design icons
export const SOURCE_TYPE_TO_ICON = {
  "google-sheets": "mdi-google-spreadsheet",
  file: "mdi-file-delimited",
  mysql: "mdi-database",
  postgres: "mdi-database-outline",
  salesforce: "mdi-salesforce",
  // Add more source types as needed
};

/**
 * Get the icon for a specific source type with fallback
 * @param {string} sourceType - The type of source
 * @returns {string} - The Material Design icon name
 */
export function getSourceIcon(sourceType) {
  console.log("iconUtils: Getting icon for", sourceType);
  return SOURCE_TYPE_TO_ICON[sourceType] || "mdi-database-outline";
}

/**
 * Check if Vuetify has the specified icon loaded
 * @param {string} iconName - The Material Design icon name
 * @returns {boolean} - Whether the icon exists
 */
export function iconExists(iconName) {
  // This is a simple check - in reality you might need to verify with Vuetify
  return iconName && iconName.startsWith("mdi-");
}
