<template>
  <PageLayout
    title="Add Data Source"
    subtitle="Connect a new data source to Datagage"
    :loading="loading"
    :error="error"
    show-back
    @clearError="hideError"
  >
    <!-- Source Error Handler Component -->    <SourceErrorHandler
      :show="showError"
      :title="errorDetails.title"
      :message="errorDetails.message"
      :details="errorDetails.details"
      :suggestions="errorDetails.suggestions"
      :code="errorDetails.code"
      :can-retry="errorDetails.canRetry"
      @close="hideError"
      @retry="handleRetryOperation"
    />
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
            <v-card-title>Configure Connection</v-card-title>
            <v-card-subtitle>{{ getSourceInstructions(sourceType).description }}</v-card-subtitle>
            <v-card-text>
              <!-- Error Handler Component -->
              <SourceErrorHandler
                :show="showError"
                :title="errorDetails.title"
                :message="errorDetails.message"
                :details="errorDetails.details"
                :suggestions="errorDetails.suggestions"
                :code="errorDetails.code"
                :can-retry="errorDetails.canRetry"
                @close="hideError"
                @retry="handleRetryOperation"
                class="mb-6"
              />

              <v-form ref="connectionForm" v-model="formValid" @submit.prevent="nextStep">
                <!-- Common Name Field -->
                <v-text-field
                  v-model="connectionConfig.name"
                  label="Source Name"
                  placeholder="e.g., Production DB, Marketing Sheets"
                  variant="outlined"
                  class="mb-4"
                  :rules="[(v) => !!v || 'Source name is required']"
                  :error-messages="formErrors.name"
                  prepend-inner-icon="mdi-tag-outline"
                  :hint="getFieldTooltip(null, 'name')"
                ></v-text-field>

                <!-- MySQL Configuration -->
                <div v-if="sourceType === 'mysql'" class="form-section">
                  <h3 class="text-h6 mb-4">MySQL Connection Details</h3>
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
                  <h3 class="text-h6 mb-4">PostgreSQL Connection Details</h3>
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

                <!-- CSV File Configuration -->
                <div v-else-if="sourceType === 'csv'" class="form-section">
                  <h3 class="text-h6 mb-4">CSV File Upload</h3>
                  <v-row>
                    <v-col cols="12">
                      <v-file-input
                        v-model="connectionConfig.csvFile"
                        accept=".csv"
                        label="Upload CSV File"
                        placeholder="Select your CSV file"
                        prepend-icon="mdi-file-delimited"
                        variant="outlined"
                        :rules="[(v) => !!v || 'CSV file is required']"
                        :error-messages="formErrors.csvFile"
                        hint="Select a CSV file from your computer. Maximum file size: 50MB."
                        show-size
                        clearable
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-tooltip :text="getFieldTooltip('csv', 'datasetName')" location="top" open-delay="300">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="connectionConfig.datasetName"
                            label="Dataset Name"
                            placeholder="Name for this dataset"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Dataset name is required']"
                            :error-messages="formErrors.datasetName"
                            prepend-inner-icon="mdi-label"
                          ></v-text-field>
                        </template>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6" class="d-flex align-center">
                       <v-checkbox
                        v-model="connectionConfig.hasHeaderRow"
                        label="First row is header"
                        hint="Check if the first row contains column names"
                        density="compact"
                        hide-details="auto"
                      ></v-checkbox>
                    </v-col>
                  </v-row>
                </div>

                <!-- Excel File Configuration -->
                <div v-else-if="sourceType === 'excel'" class="form-section">
                   <h3 class="text-h6 mb-4">Excel File Upload</h3>
                   <v-row>
                     <v-col cols="12">
                       <v-file-input
                         v-model="connectionConfig.excelFile"
                         accept=".xlsx, .xls"
                         label="Upload Excel File"
                         placeholder="Select your Excel file"
                         prepend-icon="mdi-microsoft-excel"
                         variant="outlined"
                         :rules="[(v) => !!v || 'Excel file is required']"
                         :error-messages="formErrors.excelFile"
                         hint="Select an Excel file (.xlsx or .xls). Maximum file size: 50MB."
                         show-size
                         clearable
                       ></v-file-input>
                     </v-col>
                     <v-col cols="12" md="6">
                       <v-tooltip :text="getFieldTooltip('excel', 'datasetName')" location="top" open-delay="300">
                         <template v-slot:activator="{ props }">
                           <v-text-field
                             v-bind="props"
                             v-model="connectionConfig.datasetName"
                             label="Dataset Name"
                             placeholder="Name for this dataset"
                             variant="outlined"
                             :rules="[(v) => !!v || 'Dataset name is required']"
                             :error-messages="formErrors.datasetName"
                             prepend-inner-icon="mdi-label"
                           ></v-text-field>
                         </template>
                       </v-tooltip>
                     </v-col>
                     <v-col cols="12" md="6">
                       <v-tooltip :text="getFieldTooltip('excel', 'sheetName')" location="top" open-delay="300">
                         <template v-slot:activator="{ props }">
                           <v-text-field
                             v-bind="props"
                             v-model="connectionConfig.sheetName"
                             label="Sheet Name (Optional)"
                             placeholder="Defaults to first sheet"
                             variant="outlined"
                             :error-messages="formErrors.sheetName"
                             prepend-inner-icon="mdi-table-large"
                           ></v-text-field>
                         </template>
                       </v-tooltip>
                     </v-col>
                     <v-col cols="12" md="6" class="d-flex align-center">
                       <v-checkbox
                         v-model="connectionConfig.hasHeaderRow"
                         label="First row is header"
                         hint="Check if the first row contains column names"
                         density="compact"
                         hide-details="auto"
                       ></v-checkbox>
                     </v-col>
                   </v-row>
                 </div>


                <!-- Generic message for other source types -->
                <div v-else-if="!sourceType">
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { sourceService } from "@/services/sourceService";
import PageLayout from "@/components/PageLayout.vue";
import { notify } from "@/utils/notifications";
import SourceErrorHandler from "@/components/SourceErrorHandler.vue";

const router = useRouter();
const loading = ref(false);
const error = ref(null);
const connectionForm = ref(null);
const formValid = ref(false);
const testing = ref(false);
const saving = ref(false);

// Error handling setup
const showError = ref(false);
const errorDetails = ref({
  title: '',
  message: '',
  details: '',
  suggestions: [],
  code: '',
  canRetry: false
});

// Stepper
const currentStep = ref(1);
const steps = ['Source Type', 'Configure', 'Review & Save'];

// Source types and selection
const sourceTypes = ref([]);
const sourceType = ref(null);
const connectionConfig = ref({
  name: '',
  // Initialize other common fields or leave empty
  host: '',
  port: null,
  database: '',
  username: '',
  password: '',
  sslMode: false,
  spreadsheetId: '',
  credentials: null, // Store parsed JSON or file object temporarily
  csvFile: null, // Store file object
  excelFile: null, // Store file object for Excel
  sheetName: '', // Optional sheet name for Excel
  datasetName: '', // Name for file-based datasets
  hasHeaderRow: true, // Default for file uploads
});
const formErrors = ref({});
const selectedSourceType = ref(null);

// Get source type name by type
const getSourceTypeName = (type) => {
  const found = sourceTypes.value.find(st => st.type === type);
  return found ? found.name : type;
};

// Format display labels
const formatLabel = (key) => {
  // Handle specific cases first
  if (key === 'spreadsheetId') return 'Spreadsheet ID';
  if (key === 'csvFile') return 'CSV File';
  if (key === 'excelFile') return 'Excel File';
  if (key === 'sheetName') return 'Sheet Name';
  if (key === 'datasetName') return 'Dataset Name';
  if (key === 'hasHeaderRow') return 'First Row is Header';
  if (key === 'sslMode') return 'SSL Enabled';

  // General formatting
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
};

// Format display values
const formatValue = (key, value) => {
  if (key === 'password' || key === 'clientSecret') {
    return '••••••••••'; // Mask sensitive info
  }
  if (key === 'credentials') {
    return 'Provided'; // Indicate credentials file was given
  }
  if (key === 'csvFile' || key === 'excelFile') {
    return value?.name || 'Not selected'; // Show filename or placeholder
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }
  return value;
};

// Computed to filter sensitive data for display
const connectionConfigDisplay = computed(() => {
  const config = { ...connectionConfig.value };

  // Remove properties we don't want to show directly in the review list
  delete config.password;
  delete config.credentials; // Don't show the raw credentials object

  // Filter out null/undefined/empty values unless explicitly needed
  const displayConfig = {};
  for (const key in config) {
    if (config[key] !== null && config[key] !== undefined && config[key] !== '') {
       // Special handling for file objects to show name
      if ((key === 'csvFile' || key === 'excelFile') && config[key] instanceof File) {
         displayConfig[key] = config[key].name;
      } else if (key !== 'csvFile' && key !== 'excelFile') { // Avoid adding file objects directly
         displayConfig[key] = config[key];
      }
    }
  }

  // Add back formatted representations if needed
  if (connectionConfig.value.password) {
    displayConfig.password = '••••••••••';
  }
  if (connectionConfig.value.credentials) {
    displayConfig.credentials = 'Provided';
  }
   if (connectionConfig.value.csvFile instanceof File) {
    displayConfig.csvFile = connectionConfig.value.csvFile.name;
  }
   if (connectionConfig.value.excelFile instanceof File) {
    displayConfig.excelFile = connectionConfig.value.excelFile.name;
  }


  return displayConfig;
});

// Source icon mapping
const getSourceIcon = (type) => {
  const icons = {
    'mysql': 'mdi-database',
    'postgres': 'mdi-database-outline',
    'google-sheets': 'mdi-google-spreadsheet',
    'file': 'mdi-file-delimited', // Generic file icon
    'csv': 'mdi-file-delimited', // Specific CSV icon
    'excel': 'mdi-microsoft-excel', // Specific Excel icon
  };
  return icons[type] || 'mdi-database'; // Default icon
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
    'file': { // Generic file instruction (might need refinement if more file types added)
      title: 'File Upload',
      description: 'Upload a data file (e.g., CSV, Excel) to import data. Ensure it\'s properly formatted.'
    },
    'csv': {
      title: 'CSV File Upload',
      description: 'Upload a CSV file to import data. Make sure it\'s properly formatted with consistent columns.'
    },
    'excel': {
      title: 'Excel File Upload',
      description: 'Upload an Excel file (.xlsx or .xls) to import data. You can specify which sheet to import.'
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
    'file': { // Tooltips for generic file type (if applicable)
      'datasetName': 'A name for this dataset to identify it in Datagage'
    },
     'csv': {
      'datasetName': 'A name for this CSV dataset to identify it in Datagage',
      'hasHeaderRow': 'Indicates if the first row of the CSV contains column headers'
    },
    'excel': {
      'datasetName': 'A name for this Excel dataset to identify it in Datagage',
      'sheetName': 'Specify the sheet name to import (optional, defaults to the first sheet)',
      'hasHeaderRow': 'Indicates if the first row of the selected sheet contains column headers'
    }
  };
  if (tooltips[sourceType] && tooltips[sourceType][fieldName]) {
    return tooltips[sourceType][fieldName];
  }
  // Fallback for common fields
  if (fieldName === 'name') return 'A descriptive name for this data source connection';
  return ''; // Default empty tooltip
};

// Field icon mapping
const getFieldIcon = (key) => {
  const icons = {
    name: 'mdi-tag-outline',
    host: 'mdi-server',
    port: 'mdi-ethernet',
    database: 'mdi-database',
    username: 'mdi-account',
    password: 'mdi-key',
    spreadsheetId: 'mdi-google-spreadsheet',
    credentials: 'mdi-key-variant', // Icon for credentials file/info
    sslMode: 'mdi-shield-lock',
    csvFile: 'mdi-file-delimited',
    excelFile: 'mdi-microsoft-excel',
    sheetName: 'mdi-table-large', // Icon for sheet name
    datasetName: 'mdi-label',
    hasHeaderRow: 'mdi-format-header-1' // Icon for header row option
  };
  return icons[key] || 'mdi-cog-outline'; // Default icon
};

// Step navigation
const nextStep = () => {
  if (currentStep.value < steps.length) {
    // Optionally add validation logic here before proceeding
    // e.g., if (currentStep.value === 2 && !formValid.value) return;
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
  // Reset config but keep the name
  const currentName = connectionConfig.value.name;
  connectionConfig.value = {
    name: currentName,
    host: '', port: null, database: '', username: '', password: '', sslMode: false,
    spreadsheetId: '', credentials: null, csvFile: null, excelFile: null,
    sheetName: '', datasetName: '', hasHeaderRow: true,
  };
  // Reset errors
  formErrors.value = {};
  // Set default port based on type if applicable
  if (type === 'mysql') connectionConfig.value.port = 3306;
  if (type === 'postgres') connectionConfig.value.port = 5432;
  // Set the selected source type object for reference
  selectedSourceType.value = sourceTypes.value.find(st => st.type === type) || { type };
};

// Handle file selection for Google Sheets credentials
const handleCredentialsFile = (event) => {
  const file = event.target.files[0];
  if (!file) {
    connectionConfig.value.credentials = null; // Clear if no file selected
    delete formErrors.value.credentials; // Clear potential previous error
    return;
  }
  if (file.type !== 'application/json') {
     formErrors.value.credentials = 'Invalid file type. Please upload a JSON file.';
     connectionConfig.value.credentials = null; // Clear invalid file
     return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const credentials = JSON.parse(e.target.result);
      // Basic validation (can be more thorough)
      if (!credentials.client_email || !credentials.private_key) {
        throw new Error('JSON file seems incomplete or invalid.');
      }
      connectionConfig.value.credentials = credentials;
      delete formErrors.value.credentials; // Clear error on success
    } catch (err) {
      console.error("Error parsing credentials file:", err);
      formErrors.value.credentials = `Invalid JSON file: ${err.message}`;
      connectionConfig.value.credentials = null; // Clear invalid data
    }
  };
   reader.onerror = (err) => {
      console.error("Error reading credentials file:", err);
      formErrors.value.credentials = 'Error reading the credentials file.';
      connectionConfig.value.credentials = null;
   };
  reader.readAsText(file);
};

// Handle CSV file selection - Updated to work with v-file-input v-model
// Note: v-file-input v-model usually provides an array of files.
// If 'multiple' prop is not set, it's an array with one file or empty.
watch(() => connectionConfig.value.csvFile, (newFile) => {
  if (newFile && newFile.length > 0) {
    const file = newFile[0]; // Get the first file
    // Auto-fill dataset name if empty
    if (!connectionConfig.value.datasetName && file.name) {
      connectionConfig.value.datasetName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    }
    delete formErrors.value.csvFile; // Clear error on success
  } else {
     // Clear dataset name if file is removed, unless user manually set it? Optional.
     // connectionConfig.value.datasetName = '';
  }
});

// Handle Excel file selection - Updated for v-file-input v-model
watch(() => connectionConfig.value.excelFile, (newFile) => {
  if (newFile && newFile.length > 0) {
    const file = newFile[0]; // Get the first file
    // Auto-fill dataset name if empty
    if (!connectionConfig.value.datasetName && file.name) {
      connectionConfig.value.datasetName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    }
    delete formErrors.value.excelFile; // Clear error on success
  } else {
     // Clear dataset name if file is removed? Optional.
     // connectionConfig.value.datasetName = '';
  }
});


// Test connection
const testConnection = async () => {
  testing.value = true;
  formErrors.value = {}; // Clear previous errors
  hideError(); // Hide any previous detailed errors

  // Basic form validation before testing
  if (connectionForm.value) {
    const { valid } = await connectionForm.value.validate();
    if (!valid) {
      notify.error('Please fix the errors in the form before testing.');
      testing.value = false;
      return;
    }
  }

  try {
    // File upload validation (client-side check)
    if (sourceType.value === 'csv') {
      // v-model handles the file object, check if it exists
      if (!connectionConfig.value.csvFile || connectionConfig.value.csvFile.length === 0) {
        formErrors.value.csvFile = 'Please select a CSV file to upload';
        throw new Error('CSV file not selected');
      }
      // Simulate a quick check (e.g., file size, basic parsing if needed)
      await new Promise(resolve => setTimeout(resolve, 300));
      notify.success('CSV file selected and appears valid.');

    } else if (sourceType.value === 'excel') {
       // v-model handles the file object, check if it exists
       if (!connectionConfig.value.excelFile || connectionConfig.value.excelFile.length === 0) {
        formErrors.value.excelFile = 'Please select an Excel file to upload';
        throw new Error('Excel file not selected');
      }
      // Simulate a quick check
      await new Promise(resolve => setTimeout(resolve, 300));
      notify.success('Excel file selected and appears valid.');

    } else if (sourceType.value === 'google-sheets') {
       if (!connectionConfig.value.spreadsheetId) {
         formErrors.value.spreadsheetId = 'Spreadsheet ID is required';
         throw new Error('Spreadsheet ID missing');
       }
       if (!connectionConfig.value.credentials) {
         formErrors.value.credentials = 'Service account credentials are required';
         throw new Error('Credentials missing');
       }
       // Simulate API call for testing Google Sheets connection
       console.log('Testing Google Sheets connection with:', {
         spreadsheetId: connectionConfig.value.spreadsheetId,
         // Don't log full credentials
       });
       await sourceService.testConnection({
         sourceType: sourceType.value,
         config: {
           spreadsheetId: connectionConfig.value.spreadsheetId,
           credentials: connectionConfig.value.credentials,
         }
       });
       notify.success('Google Sheets connection successful!');

    } else {
      // For database types (MySQL, PostgreSQL)
      console.log(`Testing ${sourceType.value} connection with:`, {
        ...connectionConfig.value,
        password: '***', // Mask password in log
      });
      await sourceService.testConnection({
        sourceType: sourceType.value,
        config: connectionConfig.value
      });
      notify.success(`${getSourceTypeName(sourceType.value)} connection successful!`);
    }

  } catch (err) {
    console.error("Connection test failed:", err);
    const errorMessage = err.response?.data?.message || err.message || 'Connection failed';
    // Use detailed error handler for connection issues
    showDetailedError({
      title: 'Connection Test Failed',
      message: `Unable to connect to ${getSourceTypeName(sourceType.value)}.`,
      details: errorMessage,
      suggestions: [
        'Verify all connection details are correct (host, port, credentials, etc.).',
        'Ensure the database/service is running and accessible.',
        'Check network connectivity and firewall rules.',
        'For Google Sheets, ensure the service account has access to the sheet.',
      ],
      code: err.response?.data?.code || err.code || 'CONN_TEST_FAILED',
      canRetry: true
    });
    // Optionally map specific backend errors to form fields
    if (err.response?.data?.fieldErrors) {
       formErrors.value = { ...formErrors.value, ...err.response.data.fieldErrors };
    } else {
       // General error notification if not field-specific
       notify.error(`Connection Test Failed: ${errorMessage}`);
    }
  } finally {
    testing.value = false;
  }
};

// Save source
const saveSource = async () => {
  saving.value = true;
  formErrors.value = {}; // Clear previous errors
  hideError(); // Hide previous detailed errors

  // Final validation before saving
  if (connectionForm.value) {
    const { valid } = await connectionForm.value.validate();
    if (!valid) {
      notify.error('Please fix the errors in the form before saving.');
      saving.value = false;
      currentStep.value = 2; // Go back to config step
      return;
    }
  }
  
  // Create a clean version of the config, removing file objects and null/undefined values
  const cleanConfig = {};
  Object.entries(connectionConfig.value).forEach(([key, value]) => {
    // Skip file objects and null/undefined values
    if (key !== 'csvFile' && key !== 'excelFile' && value !== null && value !== undefined) {
      cleanConfig[key] = value;
    }
  });
  
  try {
    // Determine if we need to handle file uploads
    const requiresFileUpload = sourceType.value === 'csv' || sourceType.value === 'excel';
    let apiPayload;
    
    if (requiresFileUpload) {
      // For file uploads, use FormData
      const formData = new FormData();
      formData.append('sourceName', connectionConfig.value.name);
      formData.append('sourceType', sourceType.value);
      formData.append('sourceConfig', JSON.stringify(cleanConfig));
      
      // Add the actual file
      if (connectionConfig.value.csvFile && connectionConfig.value.csvFile.length > 0) {
        const file = connectionConfig.value.csvFile[0];
        formData.append('file', file, file.name);
      }
      if (connectionConfig.value.excelFile && connectionConfig.value.excelFile.length > 0) {
        const file = connectionConfig.value.excelFile[0];
        formData.append('file', file, file.name);
      }
      
      apiPayload = formData;
      console.log('Creating source with FormData (see network tab)');
    } else {
      // For regular source types, use JSON
      apiPayload = {
        sourceName: connectionConfig.value.name,
        sourceType: sourceType.value,
        sourceConfig: cleanConfig
      };
      console.log('Creating source with payload:', apiPayload);
    }

    const createdSource = await sourceService.createSource(apiPayload);
    
    notify.success(`Source "${createdSource.name || connectionConfig.value.name}" created successfully!`);
    router.push('/sources'); // Redirect to sources list
  } catch (err) {
    console.error("Failed to save source:", err);
    const errorMessage = err.response?.data?.message || err.message || 'Failed to create source';
    
    // Use detailed error handler
    showDetailedError({
      title: 'Source Creation Failed',
      message: 'Could not save the new data source.',
      details: errorMessage,
      suggestions: [
        'Review the configuration details on the previous step.',
        'Ensure the backend service is running.',
        'Check server logs for more details.',
      ],
      code: err.response?.data?.code || err.code || 'SAVE_FAILED',
      canRetry: false
    });
    
    // Map specific backend errors to form fields if available
    if (err.response?.data?.fieldErrors) {
      formErrors.value = { ...formErrors.value, ...err.response.data.fieldErrors };
      currentStep.value = 2; // Go back to config step if there are field errors
    } else {
      notify.error(`Source Creation Failed: ${errorMessage}`);
    }
  } finally {
    saving.value = false;
  }
};

// Fetch source types from API
const fetchSourceTypes = async () => {
  loading.value = true;
  error.value = null;
  hideError();

  try {
    sourceTypes.value = await sourceService.getSourceTypes();
    if (!sourceTypes.value || sourceTypes.value.length === 0) {
      throw new Error("No source types returned from the API.");
    }
  } catch (err) {
    console.error("Failed to load source types:", err);
    error.value = `Failed to load source types: ${err.message}`;
    showDetailedError({
      title: 'Source Types Error',
      message: 'Failed to load available source types.',
      details: err.message || 'Could not fetch source types from the server.',
      suggestions: ['Check your network connection', 'Try refreshing the page', 'Contact support if the problem persists.'],
      code: err.code || 'FETCH_TYPES_FAILED',
      canRetry: true // Allow retrying the fetch
    });
  } finally {
    loading.value = false;
  }
};

// Initialize component
onMounted(async () => {
  await fetchSourceTypes();
});

// Error handling methods
const showDetailedError = (details) => {
  errorDetails.value = {
    title: details.title || 'Error',
    message: details.message || 'An error occurred',
    details: details.details || '',
    suggestions: details.suggestions || [],
    code: details.code || '',
    canRetry: details.canRetry || false
  };
  showError.value = true;
};

const hideError = () => {
  showError.value = false;
};

const handleRetryOperation = () => {
  const operationToRetry = errorDetails.value.code; // Use code or another indicator
  hideError();

  console.log(`Retrying operation related to error code: ${operationToRetry}`);

  // Retry logic based on the context (step and error code)
  if (operationToRetry === 'FETCH_TYPES_FAILED' || currentStep.value === 1) {
    fetchSourceTypes();
  } else if (operationToRetry === 'CONN_TEST_FAILED' || currentStep.value === 2) {
    testConnection();
  }
  // Add retry for save if needed, though less common
  // else if (operationToRetry === 'SAVE_FAILED' || currentStep.value === 3) {
  //   saveSource();
  // }
  else {
     console.warn("No specific retry logic defined for this error/step.");
  }
};
</script>

<style scoped>
/* General Page Layout & Stepper */
.v-stepper {
  /* Match surface color and remove default light shadow */
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border for dark theme */
  box-shadow: none; /* Remove default light theme shadow */
  border-radius: 8px;
}

.stepper-header {
  /* Use a subtle border matching other components */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 24px;
  background-color: rgba(255, 255, 255, 0.03); /* Slightly different shade for header */
}

.v-stepper-item {
  opacity: 0.6; /* Keep inactive steps less prominent */
  transition: opacity 0.3s ease;
}
.v-stepper-item .v-stepper-item__title {
  color: rgba(255, 255, 255, 0.7); /* Ensure title is visible */
}
.v-stepper-item .v-stepper-item__icon .v-icon {
  color: rgba(255, 255, 255, 0.7); /* Ensure icon is visible */
}

.v-stepper-item--selected,
.v-stepper-item--complete {
  opacity: 1;
}
.v-stepper-item--selected .v-stepper-item__title,
.v-stepper-item--complete .v-stepper-item__title {
  color: rgb(var(--v-theme-primary)); /* Highlight active/complete step title */
}
.v-stepper-item--selected .v-stepper-item__icon .v-icon,
.v-stepper-item--complete .v-stepper-item__icon .v-icon {
  color: rgb(var(--v-theme-primary)); /* Highlight active/complete step icon */
}

.stepper-title {
  font-weight: 500;
}

/* Progress Bar */
.step-progress-container {
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.02); /* Very subtle background */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.step-progress-bar {
  flex-grow: 1;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1); /* Darker background for progress bar */
  border-radius: 3px;
  overflow: hidden;
  margin-right: 16px;
}

.step-progress-fill {
  height: 100%;
  background-color: rgb(var(--v-theme-primary));
  border-radius: 3px;
  transition: width 0.4s ease-out;
}

.step-counter {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7); /* Lighter text for dark theme */
}

/* Stepper Content Window */
.v-stepper-window {
  padding: 24px; /* More padding */
}

.v-stepper-window-item {
  transition: opacity 0.4s ease-in-out;
}

/* Step 1: Source Type Selection */
.source-type-column {
  display: flex;
}

.source-type-card {
  transition: all 0.25s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.12); /* Dark theme border */
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  background-color: rgb(var(--v-theme-surface)); /* Use surface color */
  border-radius: 8px; /* Consistent rounding */
}

.source-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3); /* Darker shadow */
  border-color: rgba(var(--v-theme-primary), 0.7); /* Primary color border on hover */
}

.source-type-card.selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 6px 20px rgba(var(--v-theme-primary), 0.3); /* More prominent shadow when selected */
  background-color: rgba(var(--v-theme-primary), 0.08); /* Primary tint background */
}

.selection-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgb(var(--v-theme-surface)); /* Match surface */
  border-radius: 50%;
  padding: 3px;
  line-height: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.selection-indicator .v-icon {
  color: rgb(var(--v-theme-primary)); /* Primary color for check */
}

.source-icon {
  transition: transform 0.3s ease;
}

.source-type-card:hover .source-icon {
  transform: scale(1.1);
}

.source-type-title {
  font-size: 1.1rem; /* Slightly larger */
  font-weight: 500;
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.9); /* Brighter title */
}

.source-type-description {
  font-size: 0.875rem; /* Standard body-2 size */
  color: rgba(255, 255, 255, 0.7); /* Standard medium emphasis */
  flex-grow: 1;
  padding: 8px 16px 16px;
  line-height: 1.5;
}

.source-type-actions {
  padding: 0 16px 16px;
  margin-top: auto;
}

.select-btn {
  transition: background-color 0.2s ease, color 0.2s ease;
  font-weight: 500;
}

/* Step 2: Configuration Form */
.form-section {
  padding: 24px; /* Increase padding */
  border: 1px solid rgba(255, 255, 255, 0.1); /* Dark theme border */
  border-radius: 8px; /* Consistent rounding */
  margin-bottom: 24px;
  background-color: rgba(255, 255, 255, 0.03); /* Slightly different background */
}

.form-section h3 {
  margin-bottom: 20px;
  color: rgb(var(--v-theme-primary));
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.3); /* Primary color border */
  padding-bottom: 10px;
  font-size: 1.1rem;
  font-weight: 500;
}

/* Ensure form inputs have correct dark theme appearance (handled by Vuetify theme) */
/* Add consistent spacing below form rows */
.form-section .v-row {
  margin-bottom: 8px;
}
.form-section .v-col {
  padding-top: 8px;
  padding-bottom: 8px;
}

/* Tooltips */
.v-tooltip > .v-overlay__content {
  background: rgba(40, 40, 40, 0.9); /* Darker tooltip */
  color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 0.8rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

/* Step 3: Review & Save */
.source-info {
  /* Use theme's info color with transparency */
  background-color: rgba(var(--v-theme-info), 0.1);
  border: 1px solid rgba(var(--v-theme-info), 0.3);
  color: rgba(255, 255, 255, 0.9); /* Ensure text is readable */
}
.source-info .v-icon {
  color: rgb(var(--v-theme-info)); /* Match icon color */
}

.review-section {
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.03); /* Match form section background */
}

.review-list {
  background-color: transparent;
}

.review-item {
  border-bottom: 1px dashed rgba(255, 255, 255, 0.15); /* Dark theme dashed border */
  padding: 16px 0 !important; /* Increase padding */
}
.review-item:last-child {
  border-bottom: none;
}

.review-item .v-list-item-title { /* Use class selector for specificity */
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7); /* Medium emphasis label */
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.review-item .v-list-item-subtitle { /* Use class selector for specificity */
  color: rgba(255, 255, 255, 0.9); /* High emphasis value */
  font-size: 0.95rem;
  word-break: break-all;
}

.review-item .v-avatar {
  margin-right: 16px;
  background-color: rgba(var(--v-theme-primary), 0.15); /* Primary tint avatar background */
}
.review-item .v-avatar .v-icon {
  color: rgb(var(--v-theme-primary)); /* Primary color icon */
}

.source-avatar {
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
}
.source-avatar .v-icon {
  color: rgb(var(--v-theme-primary));
}

/* Action Buttons Area */
.v-card-actions {
  background-color: rgba(255, 255, 255, 0.05); /* Slightly lighter than surface */
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Ensure card titles/text have good contrast */
.v-card-title {
 color: rgba(255, 255, 255, 0.9);
}
.v-card-text {
 color: rgba(255, 255, 255, 0.8);
}
.v-card-subtitle {
 color: rgba(255, 255, 255, 0.7);
}

</style>
