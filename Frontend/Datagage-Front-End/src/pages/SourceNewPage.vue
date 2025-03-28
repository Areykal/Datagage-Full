<template>
  <PageLayout
    title="Add Data Source"
    subtitle="Connect a new data source to Datagage"
    :loading="loading"
    :error="error"
    showBack
  >
    <v-stepper v-model="currentStep" class="source-stepper">
      <v-stepper-header>
        <v-stepper-item
          v-for="(step, i) in steps"
          :key="i"
          :value="i + 1"
          :complete="currentStep > i + 1"
        >
          {{ step }}
        </v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <!-- Step 1: Select Source Type -->
        <v-stepper-window-item :value="1" class="fade-in">
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

              <v-row justify="center">
                <v-col
                  v-for="type in sourceTypes"
                  :key="type.type"
                  cols="6"
                  md="4"
                  lg="3"
                  class="source-type-column"
                >
                  <v-card
                    height="100%"
                    class="source-type-card"
                    :class="{ selected: sourceType === type.type }"
                    @click="selectSourceType(type.type)"
                  >
                    <v-card-item class="d-flex flex-column align-center">
                      <v-icon
                        size="48"
                        color="primary"
                        class="mb-3 source-icon"
                        >{{ getSourceIcon(type.type) }}</v-icon
                      >
                      <v-card-title class="text-center">{{
                        type.name
                      }}</v-card-title>
                    </v-card-item>
                    <v-card-text class="text-center">
                      {{ type.description }}
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
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
        </v-stepper-window-item>

        <!-- Step 2: Configure Connection -->
        <v-stepper-window-item :value="2" class="fade-in">
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
                      :error-messages="formErrors.name"
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
                        :error-messages="formErrors.host"
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
                        :error-messages="formErrors.port"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.database"
                        label="Database Name"
                        placeholder="my_database"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Database name is required']"
                        :error-messages="formErrors.database"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.username"
                        label="Username"
                        placeholder="db_user"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Username is required']"
                        :error-messages="formErrors.username"
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
                        :error-messages="formErrors.password"
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
                        :error-messages="formErrors.host"
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
                        :error-messages="formErrors.port"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.database"
                        label="Database Name"
                        placeholder="my_database"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Database name is required']"
                        :error-messages="formErrors.database"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.username"
                        label="Username"
                        placeholder="db_user"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Username is required']"
                        :error-messages="formErrors.username"
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
                        :error-messages="formErrors.password"
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
                        :error-messages="formErrors.spreadsheetId"
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
                        :error-messages="formErrors.csvFile"
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="connectionConfig.datasetName"
                        label="Dataset Name"
                        placeholder="Name for this dataset"
                        variant="outlined"
                        :rules="[(v) => !!v || 'Dataset name is required']"
                        :error-messages="formErrors.datasetName"
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
        </v-stepper-window-item>

        <!-- Step 3: Confirm and Save -->
        <v-stepper-window-item :value="3" class="fade-in">
          <v-card class="mb-6">
            <v-card-title>Review and Save</v-card-title>
            <v-card-text>
              <v-alert color="info" variant="tonal" class="mb-6">
                Please review your connection details before saving.
              </v-alert>

              <h3 class="text-h6 mb-4">{{ getSourceTypeName(sourceType) }} Connection</h3>

              <v-list>
                <v-list-item>
                  <v-list-item-title>Source Name</v-list-item-title>
                  <v-list-item-subtitle>{{ connectionConfig.name }}</v-list-item-subtitle>
                </v-list-item>

                <!-- Dynamic connection details based on source type -->
                <template v-for="(value, key) in connectionConfigDisplay" :key="key">
                  <v-list-item v-if="value !== null && key !== 'name'">
                    <v-list-item-title>{{ formatLabel(key) }}</v-list-item-title>
                    <v-list-item-subtitle>{{ formatValue(key, value) }}</v-list-item-subtitle>
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
              <v-btn
                color="primary"
                @click="saveSource"
                :loading="saving"
                :disabled="saving"
              >
                <v-icon start>mdi-check</v-icon>
                Save Source
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { sourceService } from "@/services/sourceService";
import PageLayout from "@/components/PageLayout.vue";
import { notify } from "@/utils/notifications";

const router = useRouter();
const loading = ref(false);
const error = ref(null);
const connectionForm = ref(null);
const formValid = ref(false);
const testing = ref(false);
const saving = ref(false);

// Stepper
const currentStep = ref(1);
const steps = ['Source Type', 'Configure', 'Review & Save'];

// Source types and selection
const sourceTypes = ref([
  { type: 'mysql', name: 'MySQL', description: 'Connect to a MySQL database' },
  { type: 'postgres', name: 'PostgreSQL', description: 'Connect to a PostgreSQL database' },
  { type: 'google-sheets', name: 'Google Sheets', description: 'Import data from Google Sheets' },
  { type: 'file', name: 'CSV File', description: 'Upload and import CSV files' }
]);

const sourceType = ref(null);
const connectionConfig = ref({
  name: '',
});
const formErrors = ref({});

// Get source type name by type
const getSourceTypeName = (type) => {
  const found = sourceTypes.value.find(st => st.type === type);
  return found ? found.name : type;
};

// Format display labels
const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
};

// Format display values
const formatValue = (key, value) => {
  if (key === 'password' || key === 'clientSecret') {
    return '••••••••••';
  }
  return value;
};

// Computed to filter sensitive data for display
const connectionConfigDisplay = computed(() => {
  const config = { ...connectionConfig.value };
  
  // Remove file objects that can't be displayed
  if (config.csvFile) {
    config.csvFile = config.csvFile.name || 'Selected file';
  }
  
  // Remove credentials JSON
  if (config.credentials) {
    config.credentials = 'Service account credentials provided';
  }
  
  return config;
});

// Source icon mapping
const getSourceIcon = (type) => {
  const icons = {
    'mysql': 'mdi-database',
    'postgres': 'mdi-database-outline',
    'google-sheets': 'mdi-google-spreadsheet',
    'file': 'mdi-file-delimited',
  };
  return icons[type] || 'mdi-database';
};

// Step navigation
const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Select source type
const selectSourceType = (type) => {
  sourceType.value = type;
  // Reset config when changing source type
  connectionConfig.value = { name: connectionConfig.value.name };
};

// Handle file selection for Google Sheets credentials
const handleCredentialsFile = (file) => {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const credentials = JSON.parse(e.target.result);
      connectionConfig.value.credentials = credentials;
    } catch (err) {
      formErrors.value.credentials = 'Invalid JSON file';
    }
  };
  reader.readAsText(file);
};

// Test connection
const testConnection = async () => {
  testing.value = true;
  try {
    // Simulate API call for demo
    await new Promise(resolve => setTimeout(resolve, 1500));
    notify.success('Connection successful!');
  } catch (err) {
    notify.error('Connection failed. Please check your credentials.');
  } finally {
    testing.value = false;
  }
};

// Save source
const saveSource = async () => {
  saving.value = true;
  try {
    // Format payload based on source type
    const payload = {
      name: connectionConfig.value.name,
      sourceType: sourceType.value,
      config: { ...connectionConfig.value }
    };
    
    // Remove sensitive data from log
    const logPayload = { ...payload };
    if (logPayload.config.password) logPayload.config.password = '••••••••';
    if (logPayload.config.clientSecret) logPayload.config.clientSecret = '••••••••';
    
    console.log('Creating source:', logPayload);
    
    // Simulate API call for demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    notify.success(`${sourceType.value} source "${connectionConfig.value.name}" created successfully!`);
    router.push('/sources');
  } catch (err) {
    notify.error('Failed to create source. Please try again.');
    error.value = err.message;
  } finally {
    saving.value = false;
  }
};

// Initialize component
onMounted(() => {
  // In a real app, we would fetch source types from the API
  loading.value = false;
});
</script>

<style scoped>
.source-type-column {
  padding: 8px;
}

.source-type-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.source-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.25) !important;
}

.source-type-card.selected {
  border: 2px solid var(--v-primary-base) !important;
  box-shadow: 0 4px 25px 0 rgba(var(--v-primary-base), 0.25) !important;
}

.source-icon {
  transition: transform 0.3s ease;
}

.source-type-card:hover .source-icon {
  transform: scale(1.1);
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
