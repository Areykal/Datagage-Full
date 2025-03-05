// Add console log to confirm module is loaded
console.log("Loading sourceTypes.js");

// Source types configuration matching backend
export const SOURCE_TYPES = {
  GOOGLE_SHEETS: "google-sheets",
  CSV: "file",
  MYSQL: "mysql",
  POSTGRESQL: "postgres",
  SALESFORCE: "salesforce",
};

// Frontend source type details with simplified icons
export const SOURCE_TYPE_DETAILS = {
  "google-sheets": {
    name: "Google Sheets",
    description: "Import data from Google Spreadsheets",
    icon: "mdi-google-spreadsheet", // Material Design Icon
  },
  file: {
    name: "CSV File",
    description: "Import data from CSV files",
    icon: "mdi-file", // Simpler icon name
  },
  mysql: {
    name: "MySQL Database",
    description: "Connect to MySQL database",
    icon: "mdi-database", // Common database icon
  },
  postgres: {
    name: "PostgreSQL Database",
    description: "Connect to PostgreSQL database",
    icon: "mdi-database", // Same icon as MySQL for simplicity
  },
  salesforce: {
    name: "Salesforce",
    description: "Import data from Salesforce",
    icon: "mdi-cloud", // Simple cloud icon
  },
};

// Helper function to get source type details with fallback
export function getSourceTypeDetails(type) {
  console.log("Getting details for source type:", type);
  const details = SOURCE_TYPE_DETAILS[type];
  if (details) {
    return details;
  } else {
    console.warn(`No details found for source type: ${type}, using fallback`);
    return {
      name: "Data Source",
      description: "Generic data source",
      icon: "mdi-database-outline",
    };
  }
}

// Helper function to get just the icon for a source type
export function getSourceIcon(type) {
  console.log("Getting icon for source type:", type);
  return getSourceTypeDetails(type).icon;
}
