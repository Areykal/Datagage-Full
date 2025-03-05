export const SOURCE_TYPES = {
  GOOGLE_SHEETS: "google-sheets",
  CSV: "file",
  MYSQL: "mysql",
  POSTGRESQL: "postgres",
  SALESFORCE: "salesforce",
};

export const SOURCE_TYPE_DETAILS = {
  [SOURCE_TYPES.GOOGLE_SHEETS]: {
    name: "Google Sheets",
    description: "Import data from Google Spreadsheets",
    icon: "mdi-google-spreadsheet",
    formFields: [
      {
        name: "spreadsheetUrl",
        label: "Spreadsheet URL",
        type: "text",
        required: true,
      },
      { name: "sheetName", label: "Sheet Name", type: "text", required: false },
    ],
  },
  [SOURCE_TYPES.CSV]: {
    name: "CSV File",
    description: "Import data from CSV files",
    icon: "mdi-file-delimited",
    formFields: [
      { name: "filePath", label: "File Path", type: "text", required: true },
      {
        name: "datasetName",
        label: "Dataset Name",
        type: "text",
        required: true,
      },
    ],
  },
  [SOURCE_TYPES.MYSQL]: {
    name: "MySQL Database",
    description: "Connect to MySQL database",
    icon: "mdi-database",
    formFields: [
      { name: "host", label: "Host", type: "text", required: true },
      {
        name: "port",
        label: "Port",
        type: "number",
        required: true,
        default: 3306,
      },
      {
        name: "database",
        label: "Database Name",
        type: "text",
        required: true,
      },
      { name: "username", label: "Username", type: "text", required: true },
      { name: "password", label: "Password", type: "password", required: true },
    ],
  },
  [SOURCE_TYPES.POSTGRESQL]: {
    name: "PostgreSQL Database",
    description: "Connect to PostgreSQL database",
    icon: "mdi-database-outline",
    formFields: [
      { name: "host", label: "Host", type: "text", required: true },
      {
        name: "port",
        label: "Port",
        type: "number",
        required: true,
        default: 5432,
      },
      {
        name: "database",
        label: "Database Name",
        type: "text",
        required: true,
      },
      { name: "username", label: "Username", type: "text", required: true },
      { name: "password", label: "Password", type: "password", required: true },
    ],
  },
  [SOURCE_TYPES.SALESFORCE]: {
    name: "Salesforce",
    description: "Import data from Salesforce",
    icon: "mdi-salesforce",
    formFields: [
      { name: "clientId", label: "Client ID", type: "text", required: true },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        name: "refreshToken",
        label: "Refresh Token",
        type: "text",
        required: true,
      },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      {
        name: "isSandbox",
        label: "Is Sandbox?",
        type: "checkbox",
        required: false,
      },
    ],
  },
};

export const getSourceConfig = (sourceType, credentials) => {
  const configs = {
    [SOURCE_TYPES.GOOGLE_SHEETS]: {
      sourceType: "google-sheets",
      names_conversion: true,
      spreadsheet_id: credentials.spreadsheetUrl,
      credentials: {
        auth_type: "Service",
        service_account_info: JSON.stringify(credentials.serviceAccountInfo),
      },
    },
    [SOURCE_TYPES.CSV]: {
      sourceType: "file",
      format: "csv",
      provider: {
        storage: "local",
        path: credentials.filePath,
      },
      dataset_name: credentials.datasetName,
    },
    [SOURCE_TYPES.MYSQL]: {
      sourceType: "mysql",
      host: credentials.host,
      port: credentials.port,
      database: credentials.database,
      username: credentials.username,
      password: credentials.password,
      ssl: false,
    },
    [SOURCE_TYPES.POSTGRESQL]: {
      sourceType: "postgres",
      host: credentials.host,
      port: credentials.port,
      database: credentials.database,
      username: credentials.username,
      password: credentials.password,
      ssl: false,
    },
    [SOURCE_TYPES.SALESFORCE]: {
      sourceType: "salesforce",
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      start_date: credentials.startDate,
      is_sandbox: credentials.isSandbox || false,
    },
  };

  return configs[sourceType];
};
