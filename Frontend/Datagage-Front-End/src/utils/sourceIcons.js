// Source icon mapping for consistent use across components
export const SOURCE_ICONS = {
  "google-sheets": "mdi-google-spreadsheet",
  file: "mdi-file-delimited",
  mysql: "mdi-database",
  postgres: "mdi-database-outline",
  salesforce: "mdi-salesforce",
};

/**
 * Get the icon for a given source type
 * @param {string} sourceType - The type of the source
 * @returns {string} - The corresponding icon name
 */
export function getSourceIcon(sourceType) {
  return SOURCE_ICONS[sourceType] || "mdi-database-outline";
}