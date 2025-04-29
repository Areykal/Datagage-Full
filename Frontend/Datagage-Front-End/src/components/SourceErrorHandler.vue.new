<template>
  <div class="source-error-handler">
    <v-dialog v-model="showDialog" max-width="550">
      <v-card>
        <v-card-title class="headline">
          <v-icon icon="mdi-alert-circle" color="error" class="mr-2"></v-icon>
          {{ title }}
        </v-card-title>
        
        <v-card-text>
          <div class="error-container">
            <p class="error-message">{{ message }}</p>
            
            <v-expansion-panels v-if="details" variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="text-body-2">
                    <v-icon icon="mdi-code-tags" class="mr-2" size="small"></v-icon>
                    Technical Details
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-alert :text="details" variant="outlined" type="error" class="error-details"></v-alert>
                  
                  <div v-if="suggestions && suggestions.length > 0" class="mt-3">
                    <div class="text-subtitle-2 mb-2">Suggestions:</div>
                    <ul>
                      <li v-for="(suggestion, index) in suggestions" :key="index">
                        {{ suggestion }}
                      </li>
                    </ul>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <div v-if="!details && suggestions && suggestions.length > 0" class="mt-4">
              <div class="text-subtitle-2 mb-2">Suggestions:</div>
              <ul>
                <li v-for="(suggestion, index) in suggestions" :key="index">
                  {{ suggestion }}
                </li>
              </ul>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDialog = false" color="grey" variant="text">
            Close
          </v-btn>
          <v-btn v-if="showRetry" @click="handleRetry" color="primary">
            Retry
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Error Occurred'
  },
  message: {
    type: String,
    default: 'An unexpected error occurred while processing your request.'
  },
  details: {
    type: String,
    default: ''
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  sourceType: {
    type: String,
    default: ''
  },
  errorCode: {
    type: String,
    default: ''
  },
  showRetry: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'retry']);
const showDialog = ref(false);

watch(
  () => props.show, 
  (value) => {
    showDialog.value = value;
  },
  { immediate: true }
);

watch(
  () => showDialog.value,
  (value) => {
    if (!value) {
      emit('close');
    }
  }
);

onMounted(() => {
  showDialog.value = props.show;
});

const handleRetry = () => {
  emit('retry');
  showDialog.value = false;
};

const getSpecificSuggestions = () => {
  // Return custom suggestions based on sourceType and errorCode
  const errorMap = {
    mysql: {
      'connection_failed': [
        'Check that the hostname and port are correct',
        'Verify that the database server is running',
        'Ensure network connectivity and firewall settings allow the connection',
        'Verify the database user has proper connection privileges'
      ],
      'auth_failed': [
        'Verify username and password are correct',
        'Check if the user has permission to access the specified database'
      ],
      'db_not_found': [
        'Verify the database name is spelled correctly',
        'Check if the database exists on the server',
        'Ensure the user has permissions to access this database'
      ]
    },
    postgres: {
      'connection_failed': [
        'Check that the hostname and port are correct',
        'Verify that the database server is running',
        'Ensure network connectivity and firewall settings allow the connection',
        'Verify the database user has proper connection privileges'
      ],
      'auth_failed': [
        'Verify username and password are correct',
        'Check if the user has permission to access the specified database and schema'
      ],
      'schema_not_found': [
        'Verify the schema name is spelled correctly',
        'Check if the schema exists in the database',
        'Ensure the user has permissions to access this schema'
      ]
    },
    'google-sheets': {
      'auth_failed': [
        'Verify the service account credentials JSON is correct',
        'Ensure the spreadsheet is shared with the service account email',
        'Check that the Google Sheets API is enabled for your Google Cloud project'
      ],
      'not_found': [
        'Verify the spreadsheet URL is correct',
        'Check if the spreadsheet exists and is accessible',
        'Ensure proper sharing permissions are set'
      ]
    },
    csv: {
      'parse_error': [
        'Check that the CSV file format matches the specified delimiter',
        'Verify the file encoding is correct',
        'Ensure the file is not corrupted'
      ],
      'access_denied': [
        'If using SFTP, verify credentials and permissions',
        'If using URL, ensure the file is publicly accessible'
      ]
    }
  };
  
  if (props.sourceType && props.errorCode && 
      errorMap[props.sourceType] && 
      errorMap[props.sourceType][props.errorCode]) {
    return errorMap[props.sourceType][props.errorCode];
  }
  
  // Generic suggestions if no specific ones found
  return [
    'Verify all connection details are correct',
    'Check network connectivity',
    'Ensure you have the necessary permissions'
  ];
};

const combinedSuggestions = computed(() => {
  // Combine provided suggestions with specific ones
  return [
    ...props.suggestions,
    ...getSpecificSuggestions()
  ];
});
</script>

<style scoped>
.error-message {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.error-details {
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.source-error-handler .v-expansion-panels {
  margin-top: 1rem;
}
</style>
