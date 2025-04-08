<template>
  <PageLayout
    title="Add Data Source"
    subtitle="Connect a new data source to Datagage"
    :loading="loading"
    :error="error"
    showBack
  >
    <v-stepper v-model="currentStep" class="source-stepper">
      <v-stepper-header class="stepper-header">
        <template v-for="(step, i) in steps" :key="i">
          <v-stepper-item
            :value="i + 1"
            :complete="currentStep > i + 1"
            :class="currentStep === i + 1 ? 'active-step' : ''"
          >
            <template v-slot:title>
              <span class="stepper-title">{{ step }}</span>
            </template>
            <template v-slot:icon>
              <template v-if="currentStep > i + 1">
                <v-icon>mdi-check</v-icon>
              </template>
              <template v-else>
                {{ i + 1 }}
              </template>
            </template>
          </v-stepper-item>
          <v-divider v-if="i < steps.length - 1"></v-divider>
        </template>
      </v-stepper-header>

      <div class="step-progress-container">
        <div class="step-progress-bar">
          <div 
            class="step-progress-fill" 
            :style="{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }"
          ></div>
        </div>
        <div class="step-counter">Step {{ currentStep }} of {{ steps.length }}</div>
      </div>

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
                    <div class="source-type-shimmer"></div>
                    <v-card-item class="d-flex flex-column align-center position-relative">
                      <div class="selection-indicator" v-if="sourceType === type.type">
                        <v-icon color="primary">mdi-check-circle</v-icon>
                      </div>
                      <v-avatar
                        color="primary"
                        variant="tonal"
                        size="64"
                        class="mb-4 source-icon"
                      >
                        <v-icon size="32">{{ getSourceIcon(type.type) }}</v-icon>
                      </v-avatar>
                      <v-card-title class="text-center source-type-title">
                        {{ type.name }}
                      </v-card-title>
                    </v-card-item>
                    <v-card-text class="text-center source-type-description">
                      {{ type.description }}
                    </v-card-text>
                    <v-card-actions class="source-type-actions">
                      <v-btn
                        block
                        :color="sourceType === type.type ? 'primary' : ''"
                        :variant="sourceType === type.type ? 'flat' : 'text'"
                        class="select-btn"
                      >
                        {{ sourceType === type.type ? 'Selected' : 'Select' }}
                      </v-btn>
                    </v-card-actions>
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
              <v-alert
                color="info"
                variant="tonal"
                class="mb-6 source-info"
                density="compact"
                border="start"
                :title="getSourceInstructions(sourceType).title"
              >
                {{ getSourceInstructions(sourceType).description }}
              </v-alert>
              
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
                      prepend-inner-icon="mdi-tag-outline"
                      hint="A descriptive name to identify this data source"
                      persistent-hint
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <!-- MySQL Configuration -->
                <div v-if="sourceType === 'mysql'" class="form-section">
                  <h3 class="text-h6 mb-4">MySQL Database Connection</h3>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('mysql', 'host')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.host"
                            label="Host"
                            placeholder="localhost or IP address"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Host is required']"
                            :error-messages="formErrors.host"
                            prepend-inner-icon="mdi-server"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('mysql', 'port')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.port"
                            label="Port"
                            placeholder="3306"
                            type="number"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Port is required']"
                            :error-messages="formErrors.port"
                            prepend-inner-icon="mdi-ethernet"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('mysql', 'database')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.database"
                            label="Database Name"
                            placeholder="my_database"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Database name is required']"
                            :error-messages="formErrors.database"
                            prepend-inner-icon="mdi-database"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('mysql', 'username')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.username"
                            label="Username"
                            placeholder="db_user"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Username is required']"
                            :error-messages="formErrors.username"
                            prepend-inner-icon="mdi-account"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('mysql', 'password')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.password"
                            label="Password"
                            placeholder="•••••••••••"
                            type="password"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Password is required']"
                            :error-messages="formErrors.password"
                            prepend-inner-icon="mdi-key"
                            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                            @click:append-inner="showPassword = !showPassword"
                            :type="showPassword ? 'text' : 'password'"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-switch
                        v-model="connectionConfig.sslMode"
                        color="primary"
                        label="Enable SSL Connection"
                        hint="Use SSL/TLS for secure connection"
                        persistent-hint
                      ></v-switch>
                    </v-col>
                  </v-row>
                </div>

                <!-- PostgreSQL Configuration - Using the same pattern as MySQL but keeping it separate for clarity -->
                <div v-else-if="sourceType === 'postgres'" class="form-section">
                  <h3 class="text-h6 mb-4">PostgreSQL Database Connection</h3>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('postgres', 'host')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.host"
                            label="Host"
                            placeholder="localhost or IP address"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Host is required']"
                            :error-messages="formErrors.host"
                            prepend-inner-icon="mdi-server"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('postgres', 'port')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.port"
                            label="Port"
                            placeholder="5432"
                            type="number"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Port is required']"
                            :error-messages="formErrors.port"
                            prepend-inner-icon="mdi-ethernet"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('postgres', 'database')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.database"
                            label="Database Name"
                            placeholder="my_database"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Database name is required']"
                            :error-messages="formErrors.database"
                            prepend-inner-icon="mdi-database"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('postgres', 'username')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.username"
                            label="Username"
                            placeholder="db_user"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Username is required']"
                            :error-messages="formErrors.username"
                            prepend-inner-icon="mdi-account"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('postgres', 'password')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.password"
                            label="Password"
                            placeholder="•••••••••••"
                            type="password"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Password is required']"
                            :error-messages="formErrors.password"
                            prepend-inner-icon="mdi-key"
                            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                            @click:append-inner="showPassword = !showPassword"
                            :type="showPassword ? 'text' : 'password'"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-switch
                        v-model="connectionConfig.sslMode"
                        color="primary"
                        label="Enable SSL Connection"
                        hint="Use SSL/TLS for secure connection"
                        persistent-hint
                      ></v-switch>
                    </v-col>
                  </v-row>
                </div>

                <!-- Google Sheets Configuration - Again following the same enhanced pattern -->
                <div v-else-if="sourceType === 'google-sheets'" class="form-section">
                  <h3 class="text-h6 mb-4">Google Sheets Connection</h3>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('google-sheets', 'spreadsheetId')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.spreadsheetId"
                            label="Spreadsheet ID or URL"
                            placeholder="Find in the URL of your sheet"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Spreadsheet ID is required']"
                            :error-messages="formErrors.spreadsheetId"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
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

                <!-- CSV File Configuration - Again following the same enhanced pattern -->
                <div v-else-if="sourceType === 'file'" class="form-section">
                  <h3 class="text-h6 mb-4">CSV File Upload</h3>
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
                      <v-tooltip :text="getFieldTooltip('file', 'datasetName')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.datasetName"
                            label="Dataset Name"
                            placeholder="Name for this dataset"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Dataset name is required']"
                            :error-messages="formErrors.datasetName"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
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
              <v-alert 
                color="info" 
                variant="tonal" 
                class="mb-6 source-info"
                density="comfortable"
                icon="mdi-information-outline"
              >
                Please verify your connection details before saving. You can go back to make changes if needed.
              </v-alert>

              <div class="review-section">
                <div class="d-flex align-center mb-6">
                  <v-avatar
                    color="primary"
                    variant="tonal"
                    size="64"
                    class="mr-4 source-avatar"
                  >
                    <v-icon size="32">{{ getSourceIcon(sourceType) }}</v-icon>
                  </v-avatar>
                  <div>
                    <h2 class="text-h5">{{ connectionConfig.name }}</h2>
                    <div class="text-subtitle-1 text-medium-emphasis">{{ getSourceTypeName(sourceType) }} Connection</div>
                  </div>
                </div>

                <v-divider class="mb-4"></v-divider>

                <h3 class="text-h6 mb-3">Connection Details</h3>
              
                <v-list class="review-list">
                  <template v-for="(value, key) in connectionConfigDisplay" :key="key">
                    <v-list-item v-if="value !== null && key !== 'name'" class="review-item mb-2">
                      <template v-slot:prepend>
                        <v-avatar size="36" color="primary" variant="tonal" class="mr-3">
                          <v-icon size="20">{{ getFieldIcon(key) }}</v-icon>
                        </v-avatar>
                      </template>
                      <v-list-item-title class="review-item-label">{{ formatLabel(key) }}</v-list-item-title>
                      <v-list-item-subtitle class="review-item-value">{{ formatValue(key, value) }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-list>

                <v-divider class="my-6"></v-divider>
                
                <div class="d-flex align-center">
                  <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
                  <span class="text-caption">After creating this source, Datagage will automatically sync the data at regular intervals.</span>
                </div>
              </div>
            </v-card-text>

            <v-card-actions class="pa-4">
              <v-btn variant="text" @click="prevStep" :disabled="saving">
                <v-icon start>mdi-arrow-left</v-icon>
                Edit Details
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                size="large"
                @click="saveSource"
                :loading="saving"
                :disabled="saving"
              >
                <v-icon start>mdi-check</v-icon>
                Create Data Source
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
const sourceTypes = ref([]);
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

// Password visibility toggle
const showPassword = ref(false);

// Source-specific instructions
const getSourceInstructions = (type) => {
  const instructions = {
    'mysql': {
      title: 'Connect to MySQL Database',
      description: 'Enter your MySQL database credentials below. You\'ll need a user with at least read access to the database.'
    },
    'postgres': {
      title: 'Connect to PostgreSQL Database',
      description: 'Enter your PostgreSQL database credentials below. Make sure the database user has appropriate permissions.'
    },
    'google-sheets': {
      title: 'Google Sheets Connection',
      description: 'You\'ll need a Google service account with access to the spreadsheet and its JSON credentials.'
    },
    'file': {
      title: 'CSV File Upload',
      description: 'Upload a CSV file to import data. Make sure it\'s properly formatted with consistent columns.'
    }
  };
  return instructions[type] || { title: 'Configure Connection', description: 'Enter the connection details below.' };
};

// Field tooltips
const getFieldTooltip = (sourceType, fieldName) => {
  const tooltips = {
    'mysql': {
      'host': 'The hostname or IP address of your MySQL server',
      'port': 'The port your MySQL server is running on (default: 3306)',
      'database': 'The name of the database you want to connect to',
      'username': 'The username to authenticate with your MySQL server',
      'password': 'The password for authentication'
    },
    'postgres': {
      'host': 'The hostname or IP address of your PostgreSQL server',
      'port': 'The port your PostgreSQL server is running on (default: 5432)',
      'database': 'The name of the database you want to connect to',
      'username': 'The username to authenticate with your PostgreSQL server',
      'password': 'The password for authentication'
    },
    'google-sheets': {
      'spreadsheetId': 'The ID of your Google Sheet (found in the URL)'
    },
    'file': {
      'datasetName': 'A name for this dataset to identify it in Datagage'
    }
  };
  
  if (tooltips[sourceType] && tooltips[sourceType][fieldName]) {
    return tooltips[sourceType][fieldName];
  }
  return '';
};

// Field icon mapping
const getFieldIcon = (key) => {
  const icons = {
    host: 'mdi-server',
    port: 'mdi-ethernet',
    database: 'mdi-database',
    username: 'mdi-account',
    password: 'mdi-key',
    spreadsheetId: 'mdi-google-spreadsheet',
    datasetName: 'mdi-label',
    csvFile: 'mdi-file-delimited',
    credentials: 'mdi-key-variant',
    sslMode: 'mdi-shield-lock',
    hasHeaderRow: 'mdi-format-header-1'
  };
  return icons[key] || 'mdi-cog-outline';
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
onMounted(async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Fetch source types from the API
    sourceTypes.value = await sourceService.getSourceTypes();
    
    if (!sourceTypes.value || sourceTypes.value.length === 0) {
      error.value = "No source types available";
    }
  } catch (err) {
    error.value = `Failed to load source types: ${err.message}`;
    notify.error("Failed to load source types", {
      title: "Error",
    });
    console.error("Error fetching source types:", err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.active-step :deep(.v-stepper-item__content) {
  color: var(--v-primary-base) !important;
  font-weight: 600;
}

.source-info {
  background: linear-gradient(to right, rgba(var(--v-theme-info), 0.05), rgba(var(--v-theme-info), 0.02)) !important;
}

.form-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.review-section {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.review-list {
  background: transparent !important;
}

.review-item {
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03) !important;
  transition: all 0.2s ease;
}

.review-item:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}

.review-item-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.review-item-value {
  font-weight: 500 !important;
  font-size: 1rem !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

.source-avatar {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1)) !important;
  border: 2px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.source-type-column {
  padding: 8px;
}

.step-progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 16px 0 24px;
}

.step-progress-bar {
  width: 100%;
  max-width: 400px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.step-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--v-primary-base), rgba(99, 102, 241, 0.7));
  border-radius: 3px;
  transition: width 0.5s ease-out;
}

.step-counter {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.source-type-card {
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: rgba(30, 30, 30, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
  min-height: 220px; /* Increased height for better spacing */
  display: flex;
  flex-direction: column;
  border-radius: 12px !important;
}
</style>
