// Advanced source validation and error handling
import { notify } from '@/utils/notifications';

/**
 * Validates source configuration based on source type
 * @param {Object} config - The source configuration to validate
 * @param {string} sourceType - The type of source (mysql, postgres, etc.)
 * @returns {Object} - Validation result with isValid flag and errors object
 */
export function validateSourceConfig(config, sourceType) {
  const errors = {};
  let isValid = true;
  
  // Common validation for all source types
  if (!config.name || config.name.trim() === '') {
    errors.name = 'Source name is required';
    isValid = false;
  }
  
  // Source-specific validation
  switch (sourceType) {
    case 'mysql':
    case 'postgres': {
      // Database validation rules
      const requiredFields = ['host', 'port', 'database', 'username', 'password'];
      
      for (const field of requiredFields) {
        if (!config[field]) {
          errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
          isValid = false;
        }
      }
      
      // Validate port number
      if (config.port && (isNaN(Number(config.port)) || Number(config.port) <= 0 || Number(config.port) > 65535)) {
        errors.port = 'Port must be a number between 1 and 65535';
        isValid = false;
      }
      
      break;
    }
    
    case 'google-sheets': {
      if (!config.spreadsheetId) {
        errors.spreadsheetId = 'Spreadsheet ID is required';
        isValid = false;
      } else {
        // Validate spreadsheet URL/ID format
        const urlRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
        const idRegex = /^[a-zA-Z0-9-_]+$/;
        
        // If it's a URL, extract the ID
        const urlMatch = config.spreadsheetId.match(urlRegex);
        if (urlMatch && urlMatch[1]) {
          config.spreadsheetId = urlMatch[1]; // Extract just the ID
        } else if (!idRegex.test(config.spreadsheetId)) {
          errors.spreadsheetId = 'Invalid spreadsheet ID format';
          isValid = false;
        }
      }
      
      if (!config.credentials) {
        errors.credentials = 'Service account credentials are required';
        isValid = false;
      }
      
      break;
    }
    
    case 'file':
    case 'csv': {
      if (!config.datasetName) {
        errors.datasetName = 'Dataset name is required';
        isValid = false;
      }
      
      if (!config.csvFile) {
        errors.csvFile = 'CSV file is required';
        isValid = false;
      }
      
      break;
    }
    
    default:
      errors.sourceType = 'Invalid source type';
      isValid = false;
  }
  
  return {
    isValid,
    errors
  };
}

/**
 * Maps API error responses to user-friendly error objects
 * @param {Object} error - The error object from API
 * @param {string} sourceType - The type of source
 * @returns {Object} - Error details object for UI display
 */
export function mapSourceError(error, sourceType) {
  const details = {
    title: 'Connection Error',
    message: 'Failed to connect to your data source.',
    details: '',
    suggestions: [],
    code: 'unknown_error',
    canRetry: true
  };
  
  try {
    // Extract API error details if available
    const apiError = error.response?.data?.error || error.message || 'Unknown error';
    const statusCode = error.response?.status;
    
    details.details = `Error: ${apiError}\nStatus: ${statusCode || 'N/A'}`;
    
    // Add specific error codes and messages based on error patterns
    if (apiError.includes('timeout')) {
      details.code = 'connection_timeout';
      details.message = 'Connection timed out. The server may be unavailable or behind a firewall.';
    } else if (apiError.includes('password') || apiError.includes('authentication') || statusCode === 401) {
      details.code = 'auth_failed';
      details.message = 'Authentication failed. Please check your username and password.';
    } else if (apiError.includes('database') && apiError.includes('not found') || statusCode === 404) {
      details.code = 'db_not_found';
      details.message = 'Database not found. Please verify the database name and ensure it exists.';
    } else if (apiError.includes('schema') && apiError.includes('not found')) {
      details.code = 'schema_not_found';
      details.message = 'Schema not found. Please verify the schema name and ensure it exists.';
    } else if (apiError.includes('permission')) {
      details.code = 'permission_error';
      details.message = 'Permission denied. The provided credentials may not have sufficient privileges.';
    } else if (apiError.includes('parse') || apiError.includes('csv') || apiError.includes('format')) {
      details.code = 'parse_error';
      details.message = 'Failed to parse the file. Please check the file format and try again.';
    } else if (apiError.includes('access denied')) {
      details.code = 'access_denied';
      details.message = 'Access denied. Please check your credentials and permissions.';
    } else if (statusCode === 400) {
      details.code = 'invalid_request';
      details.message = 'Invalid request. Please check the configuration parameters.';
    } else if (statusCode >= 500) {
      details.code = 'server_error';
      details.message = 'Server error. Please try again later or contact support.';
    }
    
    // Add generic suggestions
    details.suggestions = [
      'Check your network connection and firewall settings',
      'Verify that all the required fields are filled correctly',
      'Make sure the service/database is running and accessible'
    ];
    
  } catch (err) {
    console.error('Error parsing API error:', err);
  }
  
  // Log but don't display in UI
  console.error('Source connection error:', {
    type: sourceType,
    errorCode: details.code,
    originalError: error
  });
  
  return details;
}

/**
 * Handles source connection test with proper error handling
 * @param {Function} testFn - The function that tests the connection
 * @param {Object} config - Source configuration
 * @param {string} sourceType - Source type
 * @returns {Promise<boolean>} - Success or failure
 */
export async function testSourceConnection(testFn, config, sourceType) {
  try {
    const result = await testFn(sourceType, config);
    notify.success('Connection successful!', {
      title: 'Success',
      timeout: 3000
    });
    return true;
  } catch (error) {
    const errorDetails = mapSourceError(error, sourceType);
    notify.error(errorDetails.message, {
      title: 'Connection Failed',
      timeout: 5000
    });
    return false;
  }
}
