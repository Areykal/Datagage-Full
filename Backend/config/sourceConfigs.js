// Configuration for various source types with validation rules
export const SOURCE_TYPE_DETAILS = {
  mysql: {
    name: "MySQL Database",
    description: "Connect to MySQL or MariaDB database",
    icon: "mdi-database",
    formFields: [
      { 
        name: "host", 
        label: "Host", 
        type: "text", 
        required: true,
        description: "Database server hostname or IP address",
        hint: "e.g., localhost or db.example.com",
        validation: value => !!value || "Host is required"
      },
      { 
        name: "port", 
        label: "Port", 
        type: "number", 
        required: true,
        description: "Database server port number",
        hint: "Default: 3306",
        defaultValue: 3306,
        validation: value => (value > 0 && value < 65536) || "Port must be between 1-65535"
      },
      { 
        name: "database", 
        label: "Database", 
        type: "text", 
        required: true,
        description: "Name of the database to connect to",
        validation: value => !!value || "Database name is required"
      },
      { 
        name: "username", 
        label: "Username", 
        type: "text", 
        required: true,
        description: "Database user with necessary permissions",
        validation: value => !!value || "Username is required"
      },
      { 
        name: "password", 
        label: "Password", 
        type: "password", 
        required: true,
        description: "Database user password",
        validation: value => !!value || "Password is required"
      },
      { 
        name: "ssl", 
        label: "Use SSL", 
        type: "checkbox", 
        required: false,
        description: "Enable SSL/TLS encrypted connection",
        defaultValue: false
      }
    ],
    testConnection: true,
    advancedOptions: [
      {
        name: "connectionTimeout",
        label: "Connection Timeout (s)",
        type: "number",
        required: false,
        description: "Timeout in seconds for database connections",
        defaultValue: 30
      },
      {
        name: "replicationMethod",
        label: "Replication Method",
        type: "select",
        required: false,
        description: "Method to use for replicating data",
        options: [
          { value: "standard", text: "Standard" },
          { value: "cdc", text: "CDC (Change Data Capture)" }
        ],
        defaultValue: "standard"
      }
    ]
  },
  postgres: {
    name: "PostgreSQL",
    description: "Connect to PostgreSQL database",
    icon: "mdi-database",
    formFields: [
      { 
        name: "host", 
        label: "Host", 
        type: "text", 
        required: true,
        description: "Database server hostname or IP address",
        hint: "e.g., localhost or db.example.com",
        validation: value => !!value || "Host is required"
      },
      { 
        name: "port", 
        label: "Port", 
        type: "number", 
        required: true,
        description: "Database server port number",
        hint: "Default: 5432",
        defaultValue: 5432,
        validation: value => (value > 0 && value < 65536) || "Port must be between 1-65535"
      },
      { 
        name: "database", 
        label: "Database", 
        type: "text", 
        required: true,
        description: "Name of the database to connect to",
        validation: value => !!value || "Database name is required"
      },
      { 
        name: "username", 
        label: "Username", 
        type: "text", 
        required: true,
        description: "Database user with necessary permissions",
        validation: value => !!value || "Username is required"
      },
      { 
        name: "password", 
        label: "Password", 
        type: "password", 
        required: true,
        description: "Database user password",
        validation: value => !!value || "Password is required"
      },
      { 
        name: "schema", 
        label: "Schema", 
        type: "text", 
        required: false,
        description: "Database schema (default: public)",
        defaultValue: "public"
      },
      { 
        name: "ssl", 
        label: "Use SSL", 
        type: "checkbox", 
        required: false,
        description: "Enable SSL/TLS encrypted connection",
        defaultValue: true
      }
    ],
    testConnection: true,
    advancedOptions: [
      {
        name: "connectionTimeout",
        label: "Connection Timeout (s)",
        type: "number",
        required: false,
        description: "Timeout in seconds for database connections",
        defaultValue: 30
      },
      {
        name: "replicationMethod",
        label: "Replication Method",
        type: "select",
        required: false,
        description: "Method to use for replicating data",
        options: [
          { value: "standard", text: "Standard" },
          { value: "logical_replication", text: "Logical Replication (CDC)" }
        ],
        defaultValue: "standard"
      }
    ]
  },
  "google-sheets": {
    name: "Google Sheets",
    description: "Connect to Google Sheets",
    icon: "mdi-google-spreadsheet",
    formFields: [
      { 
        name: "spreadsheetLink", 
        label: "Spreadsheet Link", 
        type: "text", 
        required: true,
        description: "URL of the Google Spreadsheet",
        hint: "e.g., https://docs.google.com/spreadsheets/d/1abc...",
        validation: value => {
          const regex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/;
          return regex.test(value) || "Please enter a valid Google Sheets URL";
        }
      },
      { 
        name: "authMethod", 
        label: "Authentication Method", 
        type: "select", 
        required: true,
        description: "Method to authenticate with Google Sheets",
        options: [
          { value: "service_account", text: "Service Account (recommended)" },
          { value: "oauth", text: "OAuth 2.0" }
        ],
        defaultValue: "service_account"
      },
      { 
        name: "credentials", 
        label: "Service Account JSON", 
        type: "textarea", 
        required: value => value.authMethod === "service_account",
        description: "JSON credentials for your Google service account",
        conditionalField: "authMethod",
        conditionalValue: "service_account",
        validation: value => {
          if (value.authMethod !== "service_account") return true;
          try {
            JSON.parse(value.credentials);
            return true;
          } catch (e) {
            return "Invalid JSON format";
          }
        }
      }
    ],
    testConnection: true,
    authInstructions: `
      <ol>
        <li>Go to <a href="https://console.developers.google.com/" target="_blank">Google API Console</a></li>
        <li>Create a new project</li>
        <li>Enable the Google Sheets API</li>
        <li>Create service account credentials</li>
        <li>Download the JSON key file</li>
        <li>Share your spreadsheet with the service account email</li>
      </ol>
    `
  },  csv: {
    name: "CSV File",
    description: "Upload and process CSV files",
    icon: "mdi-file-delimited",
    fileUpload: {
      accept: ".csv",
      maxSize: 52428800, // 50MB
      multiple: false
    },
    formFields: [
      {
        name: "name",
        label: "Source Name",
        type: "text",
        required: true,
        description: "Give this data source a name for easy identification",
        validation: value => !!value || "Source name is required"
      },
      {
        name: "datasetName",
        label: "Dataset Name",
        type: "text",
        required: true,
        description: "Name of the dataset (used for organizing your data)",
        validation: value => !!value || "Dataset name is required"
      },
      {
        name: "csvFile",
        label: "CSV File",
        type: "file",
        required: true,
        description: "Select your CSV file for upload",
        accept: ".csv",
        validation: value => !!value || "CSV file is required"
      },
      { 
        name: "uploadMethod", 
        label: "Upload Method", 
        type: "select", 
        required: true,
        description: "How to upload your CSV files",
        options: [
          { value: "direct_upload", text: "Direct Upload" },
          { value: "sftp", text: "SFTP Server" },
          { value: "url", text: "URL" }
        ],
        defaultValue: "direct_upload"
      },
      { 
        name: "fileUrl", 
        label: "File URL", 
        type: "text", 
        required: value => value.uploadMethod === "url",
        description: "URL to the CSV file",
        conditionalField: "uploadMethod",
        conditionalValue: "url",
        validation: value => {
          if (value.uploadMethod !== "url") return true;
          const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
          return regex.test(value.fileUrl) || "Please enter a valid URL";
        }
      },
      { 
        name: "sftpHost", 
        label: "SFTP Host", 
        type: "text", 
        required: value => value.uploadMethod === "sftp",
        description: "SFTP server hostname or IP",
        conditionalField: "uploadMethod",
        conditionalValue: "sftp"
      },
      { 
        name: "sftpPort", 
        label: "SFTP Port", 
        type: "number", 
        required: value => value.uploadMethod === "sftp",
        description: "SFTP server port (usually 22)",
        defaultValue: 22,
        conditionalField: "uploadMethod",
        conditionalValue: "sftp"
      },
      { 
        name: "sftpUser", 
        label: "SFTP Username", 
        type: "text", 
        required: value => value.uploadMethod === "sftp",
        description: "SFTP username",
        conditionalField: "uploadMethod",
        conditionalValue: "sftp"
      },
      { 
        name: "sftpPassword", 
        label: "SFTP Password", 
        type: "password", 
        required: value => value.uploadMethod === "sftp",
        description: "SFTP password",
        conditionalField: "uploadMethod",
        conditionalValue: "sftp"
      },
      { 
        name: "sftpPath", 
        label: "SFTP Path", 
        type: "text", 
        required: value => value.uploadMethod === "sftp",
        description: "Path to CSV files on SFTP server",
        defaultValue: "/",
        conditionalField: "uploadMethod",
        conditionalValue: "sftp"
      },
      {
        name: "delimiter",
        label: "Delimiter",
        type: "select",
        required: true,
        description: "Character used to separate values",
        options: [
          { value: ",", text: "Comma (,)" },
          { value: ";", text: "Semicolon (;)" },
          { value: "\\t", text: "Tab" },
          { value: "|", text: "Pipe (|)" },
          { value: "custom", text: "Custom..." }
        ],
        defaultValue: ","
      },
      {
        name: "customDelimiter",
        label: "Custom Delimiter",
        type: "text",
        required: value => value.delimiter === "custom",
        description: "Specify a custom delimiter character",
        conditionalField: "delimiter",
        conditionalValue: "custom"
      },      {
        name: "hasHeader",
        label: "First Row is Header",
        type: "checkbox",
        required: false,
        description: "First row contains column names",
        defaultValue: true
      },
      {
        name: "dateFormat",
        label: "Date Format",
        type: "select",
        required: false,
        description: "Format of date columns in your CSV",
        options: [
          { value: "YYYY-MM-DD", text: "YYYY-MM-DD" },
          { value: "MM/DD/YYYY", text: "MM/DD/YYYY" },
          { value: "DD/MM/YYYY", text: "DD/MM/YYYY" },
          { value: "YYYY-MM-DD HH:mm:ss", text: "YYYY-MM-DD HH:mm:ss" }
        ],
        defaultValue: "YYYY-MM-DD"
      },
      {
        name: "nullValues",
        label: "Null Value Markers",
        type: "text",
        required: false,
        description: "Comma-separated values to treat as NULL (e.g., NA, null, '')",
        defaultValue: "NA, null, ",
        validation: value => !value || value.split(',').every(v => v.trim().length > 0) || "Invalid null value markers"
      },
      {
        name: "skipRows",
        label: "Skip Initial Rows",
        type: "number",
        required: false,
        description: "Number of rows to skip from the beginning",
        defaultValue: 0,
        validation: value => value >= 0 || "Cannot skip negative number of rows"
      }
    ],
    fileUpload: true,
    advancedOptions: [
      {
        name: "encoding",
        label: "File Encoding",
        type: "select",
        required: false,
        description: "Character encoding of the CSV file",
        options: [
          { value: "UTF-8", text: "UTF-8 (Recommended)" },
          { value: "ISO-8859-1", text: "ISO-8859-1 (Latin-1)" },
          { value: "UTF-16", text: "UTF-16" },
          { value: "ASCII", text: "ASCII" }
        ],
        defaultValue: "UTF-8"
      },
      {
        name: "quoteChar",
        label: "Quote Character",
        type: "select",
        required: false,
        description: "Character used to quote fields",
        options: [
          { value: "\"", text: "Double Quote (\")" },
          { value: "'", text: "Single Quote (')" },
          { value: "none", text: "None" }
        ],
        defaultValue: "\""
      }
    ]
  },
  excel: {
    name: "Excel File",
    description: "Upload and process Excel files (XLSX, XLS)",
    icon: "mdi-microsoft-excel",
    fileUpload: {
      accept: ".xlsx,.xls",
      maxSize: 52428800, // 50MB
      multiple: false
    },
    formFields: [
      {
        name: "name",
        label: "Source Name",
        type: "text",
        required: true,
        description: "Give this data source a name for easy identification",
        validation: value => !!value || "Source name is required"
      },
      {
        name: "datasetName",
        label: "Dataset Name",
        type: "text",
        required: true,
        description: "Name of the dataset (used for organizing your data)",
        validation: value => !!value || "Dataset name is required"
      },
      {
        name: "excelFile",
        label: "Excel File",
        type: "file",
        required: true,
        description: "Select your Excel file (XLSX or XLS)",
        accept: ".xlsx,.xls",
        validation: value => !!value || "Excel file is required"
      },
      {
        name: "sheet",
        label: "Sheet Name",
        type: "text",
        required: false,
        description: "Name of the sheet to import (leave blank for first sheet)",
        defaultValue: "Sheet1"
      },
      {
        name: "hasHeader",
        label: "First Row is Header",
        type: "checkbox",
        required: false,
        description: "First row contains column names",
        defaultValue: true
      },
      {
        name: "dateFormat",
        label: "Date Format",
        type: "select",
        required: false,
        description: "Format for parsing date columns",
        options: [
          { value: "YYYY-MM-DD", text: "YYYY-MM-DD" },
          { value: "MM/DD/YYYY", text: "MM/DD/YYYY" },
          { value: "DD/MM/YYYY", text: "DD/MM/YYYY" },
          { value: "YYYY-MM-DD HH:mm:ss", text: "YYYY-MM-DD HH:mm:ss" }
        ],
        defaultValue: "YYYY-MM-DD"
      },
      {
        name: "nullValues",
        label: "Null Value Markers",
        type: "text",
        required: false,
        description: "Comma-separated values to treat as NULL (e.g., NA, null, '')",
        defaultValue: "NA, null, ",
        validation: value => !value || value.split(',').every(v => v.trim().length > 0) || "Invalid null value markers"
      },
      {
        name: "skipRows",
        label: "Skip Initial Rows",
        type: "number",
        required: false,
        description: "Number of rows to skip from the beginning",
        defaultValue: 0,
        validation: value => value >= 0 || "Cannot skip negative number of rows"
      }
    ],
    advancedOptions: [
      {
        name: "cellRange",
        label: "Cell Range",
        type: "text",
        required: false,
        description: "Range of cells to import (e.g., A1:H100)",
        validation: value => {
          if (!value) return true;
          const regex = /^[A-Z]+[0-9]+:[A-Z]+[0-9]+$/;
          return regex.test(value) || "Invalid cell range format (e.g., A1:H100)";
        }
      },
      {
        name: "preserveFormatting",
        label: "Preserve Formatting",
        type: "checkbox",
        required: false,
        description: "Preserve cell formatting (colors, fonts, etc.)",
        defaultValue: false
      }
    ]
  }
};

export const SOURCE_TYPES = Object.keys(SOURCE_TYPE_DETAILS).map(type => ({
  id: type,
  ...SOURCE_TYPE_DETAILS[type]
}));

// Helper function to convert frontend source configuration to Airbyte configuration
export function getSourceConfig(sourceType, sourceConfig) {
  switch (sourceType) {
    case 'mysql':
      return {
        host: sourceConfig.host,
        port: parseInt(sourceConfig.port || 3306),
        database: sourceConfig.database,
        username: sourceConfig.username,
        password: sourceConfig.password,
        ssl: Boolean(sourceConfig.ssl),
        replication_method: sourceConfig.replicationMethod || 'standard',
        connection_timeout: parseInt(sourceConfig.connectionTimeout || 30)
      };

    case 'postgres':
      return {
        host: sourceConfig.host,
        port: parseInt(sourceConfig.port || 5432),
        database: sourceConfig.database,
        username: sourceConfig.username,
        password: sourceConfig.password,
        schema: sourceConfig.schema || 'public',
        ssl: Boolean(sourceConfig.ssl),
        replication_method: sourceConfig.replicationMethod || 'standard',
        connection_timeout: parseInt(sourceConfig.connectionTimeout || 30)
      };

    case 'google-sheets':
      const config = {
        spreadsheet_id: extractSpreadsheetId(sourceConfig.spreadsheetLink)
      };

      if (sourceConfig.authMethod === 'service_account') {
        try {
          config.credentials_json = JSON.parse(sourceConfig.credentials);
        } catch (e) {
          throw new Error('Invalid service account JSON');
        }
      }

      return config;    case 'csv':
      const csvConfig = {
        format: 'csv',
        name: sourceConfig.name,
        dataset_name: sourceConfig.datasetName,
        has_header: Boolean(sourceConfig.hasHeader),
        delimiter: sourceConfig.delimiter === 'custom' ? sourceConfig.customDelimiter : sourceConfig.delimiter,
        date_format: sourceConfig.dateFormat || 'YYYY-MM-DD',
        null_values: sourceConfig.nullValues ? sourceConfig.nullValues.split(',').map(v => v.trim()) : ['NA', 'null', ''],
        skip_rows: parseInt(sourceConfig.skipRows || 0),
        encoding: sourceConfig.encoding || 'UTF-8',
        quote_char: sourceConfig.quoteChar === 'none' ? null : (sourceConfig.quoteChar || '"')
      };

      if (sourceConfig.uploadMethod === 'direct_upload') {
        // Handle file upload
        csvConfig.upload_type = 'local';
        csvConfig.file_path = sourceConfig.csvFile; // This will be handled by the file upload handler
      } else if (sourceConfig.uploadMethod === 'url') {
        csvConfig.upload_type = 'url';
        csvConfig.url = sourceConfig.fileUrl;
      } else if (sourceConfig.uploadMethod === 'sftp') {
        csvConfig.upload_type = 'sftp';
        csvConfig.sftp_host = sourceConfig.sftpHost;
        csvConfig.sftp_port = parseInt(sourceConfig.sftpPort || 22);
        csvConfig.sftp_user = sourceConfig.sftpUser;
        csvConfig.sftp_password = sourceConfig.sftpPassword;
        csvConfig.sftp_path = sourceConfig.sftpPath;
      }

      if (sourceConfig.encoding) {
        csvConfig.encoding = sourceConfig.encoding;
      }
        if (sourceConfig.quoteChar) {
        csvConfig.quote_char = sourceConfig.quoteChar === 'none' ? null : sourceConfig.quoteChar;
      }

      return csvConfig;

    case 'excel':
      const excelConfig = {
        format: 'excel',
        name: sourceConfig.name,
        dataset_name: sourceConfig.datasetName,
        has_header: Boolean(sourceConfig.hasHeader),
        sheet_name: sourceConfig.sheet || 'Sheet1',
        date_format: sourceConfig.dateFormat || 'YYYY-MM-DD',
        null_values: sourceConfig.nullValues ? sourceConfig.nullValues.split(',').map(v => v.trim()) : ['NA', 'null', ''],
        skip_rows: parseInt(sourceConfig.skipRows || 0),
        file_path: sourceConfig.excelFile,
        cell_range: sourceConfig.cellRange || null,
        preserve_formatting: Boolean(sourceConfig.preserveFormatting)
      };

      return excelConfig;

    default:
      throw new Error(`Unsupported source type: ${sourceType}`);
  }
}

// Helper function to extract spreadsheet ID from a Google Sheets URL
function extractSpreadsheetId(url) {
  try {
    // Match the spreadsheet ID from the URL
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    throw new Error('Invalid Google Sheets URL format');
  } catch (e) {
    throw new Error('Could not extract spreadsheet ID from URL');
  }
}
