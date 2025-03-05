<template>
  <PageLayout
    title="Add Data Source"
    subtitle="Connect a new data source to Datagage"
    :loading="loading"
    :error="error"
    showBack
  >
    <v-stepper v-model="currentStep" :items="steps" class="source-stepper">
      <template #default="{ step }">
        <!-- Step 1: Select Source Type -->
        <div v-if="step === 1" class="fade-in">
          <v-card class="mb-6">
            <v-card-title>Select Source Type</v-card-title>
            <v-card-text>
              <div v-if="sourceTypes.length === 0" class="text-center pa-6">
                <v-progress-circular
                  indeterminate
                  v-if="loading"
                ></v-progress-circular>
                <v-alert v-else type="warning" variant="tonal">
                  No source types available. Please try refreshing the page.
                </v-alert>
              </div>

              <v-row v-else>
                <v-col
                  v-for="type in sourceTypes"
                  :key="type.type"
                  cols="12"
                  sm="6"
                  md="4"
                  xl="3"
                  class="source-type-column"
                >
                  <v-card
                    :class="[
                      'source-type-card',
                      { selected: sourceType === type.type },
                    ]"
                    @click="selectSourceType(type.type)"
                    variant="outlined"
                    hover
                  >
                    <v-card-item>
                      <v-avatar
                        :color="
                          sourceType === type.type ? 'primary' : undefined
                        "
                        :variant="sourceType === type.type ? 'flat' : 'tonal'"
                        size="48"
                        class="mb-3"
                      >
                        <v-icon size="24">{{
                          getSourceIcon(type.type)
                        }}</v-icon>
                      </v-avatar>
                      <v-card-title>{{ type.name }}</v-card-title>
                      <v-card-subtitle v-if="type.description">{{
                        type.description
                      }}</v-card-subtitle>
                    </v-card-item>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Debug info - remove in production -->
              <div
                v-if="sourceTypes.length > 0"
                class="text-caption text-grey mt-4"
              >
                Found {{ sourceTypes.length }} source types
              </div>
            </v-card-text>
          </v-card>

          <div class="d-flex justify-end">
            <v-btn
              color="primary"
              size="large"
              @click="nextStep"
              :disabled="!sourceType"
            >
              Continue
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Step 2: Configure Connection -->
        <div v-else-if="step === 2" class="fade-in">
          <v-card class="mb-6">
            <v-card-title
              >Configure
              {{ getSourceTypeName(sourceType) }} Connection</v-card-title
            >
            <v-card-text>
              <v-form ref="connectionForm" v-model="formValid">
                <!-- Source Name (common to all source types) -->
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="connectionConfig.name"
                      label="Source Name"
                      placeholder="Give your data source a name"
                      variant="outlined"
                      :rules="[(v) => !!v || 'Name is required']"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <!-- MySQL Configuration -->
                <div v-if="sourceType === 'mysql'">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.host"
                        label="Host"
                        placeholder="localhost or IP address"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Host is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.port"
                        label="Port"
                        placeholder="3306"
                        type="number"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Port is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.database"
                        label="Database Name"
                        placeholder="my_database"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Database name is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.username"
                        label="Username"
                        placeholder="db_user"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Username is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.password"
                        label="Password"
                        placeholder="•••••••••••"
                        type="password"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Password is required']"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>

                <!-- PostgreSQL Configuration -->
                <div v-else-if="sourceType === 'postgres'">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.host"
                        label="Host"
                        placeholder="localhost or IP address"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Host is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.port"
                        label="Port"
                        placeholder="5432"
                        type="number"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Port is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.database"
                        label="Database Name"
                        placeholder="my_database"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Database name is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.username"
                        label="Username"
                        placeholder="db_user"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Username is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.password"
                        label="Password"
                        placeholder="•••••••••••"
                        type="password"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Password is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-checkbox
                        v-model="connectionConfig.sslMode"
                        label="Enable SSL Mode"
                      ></v-checkbox>
                    </v-col>
                  </v-row>
                </div>

                <!-- Google Sheets Configuration -->
                <div v-else-if="sourceType === 'google-sheets'">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.spreadsheetId"
                        label="Spreadsheet ID or URL"
                        placeholder="Find in the URL of your sheet"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Spreadsheet ID is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-file-input
                        accept=".json"
                        label="Service Account Credentials (JSON)"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Credentials are required']"
                        @change="handleCredentialsFile"
                      ></v-file-input>
                    </v-col>
                  </v-row>
                </div>

                <!-- CSV File Configuration -->
                <div v-else-if="sourceType === 'file'">
                  <v-row>
                    <v-col cols="12">
                      <v-file-input
                        v-model="connectionConfig.csvFile"
                        accept=".csv"
                        label="Upload CSV File"
                        variant="outlined"
                        :rules="[(v) => !!v || 'CSV file is required']"
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.datasetName"
                        label="Dataset Name"
                        placeholder="Name for this dataset"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Dataset name is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-checkbox
                        v-model="connectionConfig.hasHeaderRow"
                        label="First row is header"
                        hint="Check if the first row contains column names"
                      ></v-checkbox>
                    </v-col>
                  </v-row>
                </div>

                <!-- Salesforce Configuration -->
                <div v-else-if="sourceType === 'salesforce'">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.clientId"
                        label="Client ID"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Client ID is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.clientSecret"
                        label="Client Secret"
                        type="password"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Client Secret is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="connectionConfig.refreshToken"
                        label="Refresh Token"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Refresh Token is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.startDate"
                        label="Start Date"
                        type="date"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Start Date is required']"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-checkbox
                        v-model="connectionConfig.isSandbox"
                        label="Is Sandbox?"
                      ></v-checkbox>
                    </v-col>
                  </v-row>
                </div>

                <!-- Generic message for other source types -->
                <div v-else>
                  <p class="text-center text-medium-emphasis py-4">
                    Please go back and select a source type first.
                  </p>
                </div>
              </v-form>
            </v-card-text>

            <v-card-actions class="pa-4">
              <v-btn variant="text" @click="prevStep">
                <v-icon start>mdi-arrow-left</v-icon>
                Back
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                @click="testConnection"
                :loading="testing"
                class="mr-2"
              >
                <v-icon start>mdi-connection</v-icon>
                Test Connection
              </v-btn>
              <v-btn color="primary" @click="nextStep" :disabled="!formValid">
                Continue
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>

        <!-- Step 3: Confirm and Save -->
        <div v-else-if="step === 3" class="fade-in">
          <v-card class="mb-6">
            <v-card-title>Review and Save</v-card-title>
            <v-card-text>
              <v-alert color="info" variant="tonal" class="mb-6">
                Please review your connection details before saving.
              </v-alert>

              <h3 class="text-h6 mb-2">Source Type</h3>
              <p class="mb-4">
                {{ getSourceTypeName(sourceType) }}
              </p>

              <h3 class="text-h6 mb-2">Connection Details</h3>
              <v-list>
                <v-list-item>
                  <v-list-item-title>Name</v-list-item-title>
                  <v-list-item-subtitle>{{
                    connectionConfig.name
                  }}</v-list-item-subtitle>
                </v-list-item>

                <template
                  v-if="sourceType === 'mysql' || sourceType === 'postgres'"
                >
                  <v-list-item>
                    <v-list-item-title>Host</v-list-item-title>
                    <v-list-item-subtitle
                      >{{ connectionConfig.host }}:{{
                        connectionConfig.port
                      }}</v-list-item-subtitle
                    >
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Database</v-list-item-title>
                    <v-list-item-subtitle>{{
                      connectionConfig.database
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Username</v-list-item-title>
                    <v-list-item-subtitle>{{
                      connectionConfig.username
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Password</v-list-item-title>
                    <v-list-item-subtitle>••••••••</v-list-item-subtitle>
                  </v-list-item>
                </template>

                <template v-else-if="sourceType === 'google-sheets'">
                  <v-list-item>
                    <v-list-item-title>Spreadsheet ID</v-list-item-title>
                    <v-list-item-subtitle>{{
                      connectionConfig.spreadsheetId
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Credentials</v-list-item-title>
                    <v-list-item-subtitle
                      >Service account credentials
                      provided</v-list-item-subtitle
                    >
                  </v-list-item>
                </template>
              </v-list>
            </v-card-text>

            <v-card-actions class="pa-4">
              <v-btn variant="text" @click="prevStep">
                <v-icon start>mdi-arrow-left</v-icon>
                Back
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="saveSource" :loading="saving">
                <v-icon start>mdi-check</v-icon>
                Save and Connect
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </template>
    </v-stepper>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { sourceService } from "@/services/sourceService";
import { notify } from "@/utils/notifications";
import PageLayout from "@/components/PageLayout.vue";

const router = useRouter();

// State
const currentStep = ref(1);
const sourceType = ref("");
const sourceTypes = ref([]);
const loading = ref(false);
const error = ref(null);
const testing = ref(false);
const saving = ref(false);
const formValid = ref(false);
const connectionForm = ref(null);

// Stepper configuration
const steps = [
  {
    title: "Select Source Type",
    value: 1,
  },
  {
    title: "Configure Connection",
    value: 2,
  },
  {
    title: "Review and Save",
    value: 3,
  },
];

// Connection configuration
const connectionConfig = reactive({
  name: "",
  // MySQL / PostgreSQL
  host: "",
  port: "",
  database: "",
  username: "",
  password: "",
  sslMode: false,
  // Google Sheets
  spreadsheetId: "",
  credentialsJson: "",
  // CSV
  csvFile: null,
  datasetName: "",
  hasHeaderRow: true,
  // Salesforce
  clientId: "",
  clientSecret: "",
  refreshToken: "",
  startDate: "",
  isSandbox: false,
});

// Helper functions
function getSourceTypeName(typeId) {
  const sourceType = sourceTypes.value.find((type) => type.type === typeId);
  return sourceType ? sourceType.name : "Unknown";
}

// Get icon for source type
function getSourceIcon(type) {
  const icons = {
    "google-sheets": "mdi-google-spreadsheet",
    file: "mdi-file-delimited",
    mysql: "mdi-database",
    postgres: "mdi-database",
    salesforce: "mdi-cloud",
  };
  return icons[type] || "mdi-database";
}

// Event handlers
function selectSourceType(type) {
  sourceType.value = type;

  // Reset form when changing source type
  Object.keys(connectionConfig).forEach((key) => {
    if (key !== "name") {
      if (typeof connectionConfig[key] === "boolean") {
        connectionConfig[key] = false;
      } else {
        connectionConfig[key] = "";
      }
    }
  });

  // Set default values based on source type
  if (type === "mysql") {
    connectionConfig.port = "3306";
  } else if (type === "postgres") {
    connectionConfig.port = "5432";
  }
}

function handleCredentialsFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      connectionConfig.credentialsJson = e.target.result;
    } catch (err) {
      notify.error("Invalid credentials file");
    }
  };
  reader.readAsText(file);
}

// Navigation
function nextStep() {
  if (currentStep.value < steps.length) {
    if (currentStep.value === 2 && !connectionForm.value?.validate()) {
      return;
    }
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

// API calls
async function testConnection() {
  if (!connectionForm.value?.validate()) return;

  testing.value = true;
  try {
    await sourceService.testConnection(connectionConfig, sourceType.value);
  } catch (err) {
    notify.error("Connection failed: " + err.message);
  } finally {
    testing.value = false;
  }
}

async function saveSource() {
  saving.value = true;
  try {
    const sourceData = {
      name: connectionConfig.name,
      sourceType: sourceType.value,
      connectionConfiguration: { ...connectionConfig },
    };

    // Remove name from connection config (it's at the top level)
    delete sourceData.connectionConfiguration.name;

    const result = await sourceService.createSource(sourceData);
    router.push(`/sources/${result.data.source.sourceId}`);
  } catch (err) {
    error.value = "Failed to create source: " + err.message;
  } finally {
    saving.value = false;
  }
}

// Load source types on mount
onMounted(async () => {
  loading.value = true;
  try {
    const types = await sourceService.getSourceTypes();
    console.log("Loaded source types:", types);

    if (!types || types.length === 0) {
      throw new Error("No source types returned from API");
    }

    // Ensure we're assigning an array to the ref
    sourceTypes.value = Array.isArray(types) ? types : [];

    console.log("Source types after assignment:", sourceTypes.value);
  } catch (err) {
    error.value = "Failed to load source types: " + err.message;
    console.error("Error loading source types:", err);

    // Fallback source types in case of API failure
    sourceTypes.value = [
      {
        type: "mysql",
        name: "MySQL Database",
        description: "Connect to MySQL database",
      },
      {
        type: "postgres",
        name: "PostgreSQL Database",
        description: "Connect to PostgreSQL database",
      },
      {
        type: "google-sheets",
        name: "Google Sheets",
        description: "Import data from Google Spreadsheets",
      },
      {
        type: "file",
        name: "CSV File",
        description: "Import data from CSV files",
      },
      {
        type: "salesforce",
        name: "Salesforce",
        description: "Import data from Salesforce",
      },
    ];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.source-stepper {
  background: var(--surface-color) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary-color) !important;
}

.source-type-card {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--border-color) !important;
}

.source-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 15px 0 rgba(0, 0, 0, 0.2);
}

.source-type-card.selected {
  border: 2px solid var(--primary-color) !important;
  background-color: var(--primary-color-soft) !important;
}

.source-type-column {
  padding: 8px;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
