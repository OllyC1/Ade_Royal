import toast from 'react-hot-toast';

// Error types for better categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// HTTP status code mappings
const STATUS_CODE_MESSAGES = {
  400: 'Bad Request - Please check your input',
  401: 'Authentication required - Please log in',
  403: 'Access denied - You don\'t have permission for this action',
  404: 'Resource not found',
  422: 'Validation failed - Please check your input',
  429: 'Too many requests - Please try again later',
  500: 'Internal server error - Please try again later',
  502: 'Service temporarily unavailable',
  503: 'Service temporarily unavailable',
  504: 'Request timeout - Please try again'
};

// Default error messages
const DEFAULT_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network error - Please check your connection',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again',
  [ERROR_TYPES.AUTHENTICATION]: 'Please log in to continue',
  [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission for this action',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_TYPES.SERVER]: 'Server error - Please try again later',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred'
};

/**
 * Extracts error information from different error sources
 */
export const extractErrorInfo = (error) => {
  console.error('Error occurred:', error);

  // Network errors (no response)
  if (!error.response) {
    if (error.request) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: 'Unable to connect to server. Please check your internet connection.',
        statusCode: null,
        details: error.message
      };
    }
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: error.message || DEFAULT_MESSAGES[ERROR_TYPES.UNKNOWN],
      statusCode: null,
      details: error.message
    };
  }

  const { status, data } = error.response;
  
  // Determine error type based on status code
  let errorType = ERROR_TYPES.UNKNOWN;
  if (status === 401) errorType = ERROR_TYPES.AUTHENTICATION;
  else if (status === 403) errorType = ERROR_TYPES.AUTHORIZATION;
  else if (status === 404) errorType = ERROR_TYPES.NOT_FOUND;
  else if (status === 422 || (status === 400 && data?.errors)) errorType = ERROR_TYPES.VALIDATION;
  else if (status >= 500) errorType = ERROR_TYPES.SERVER;
  else if (status >= 400) errorType = ERROR_TYPES.VALIDATION;

  // Extract message from response
  let message = STATUS_CODE_MESSAGES[status] || DEFAULT_MESSAGES[errorType];
  
  if (data?.message) {
    message = data.message;
  } else if (data?.error) {
    message = data.error;
  }

  // Handle validation errors specifically
  let validationErrors = null;
  if (errorType === ERROR_TYPES.VALIDATION && data?.errors) {
    validationErrors = Array.isArray(data.errors) 
      ? data.errors.map(err => err.msg || err.message || err).join(', ')
      : data.errors;
    message = `Validation error: ${validationErrors}`;
  }

  return {
    type: errorType,
    message,
    statusCode: status,
    details: data,
    validationErrors
  };
};

/**
 * Handles errors with appropriate user notifications
 */
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    customMessage = null,
    onError = null,
    context = 'general'
  } = options;

  const errorInfo = extractErrorInfo(error);
  
  // Use custom message if provided
  const displayMessage = customMessage || errorInfo.message;

  // Show toast notification if enabled
  if (showToast) {
    switch (errorInfo.type) {
      case ERROR_TYPES.VALIDATION:
        toast.error(displayMessage, { duration: 4000 });
        break;
      case ERROR_TYPES.AUTHENTICATION:
        toast.error(displayMessage, { duration: 3000 });
        break;
      case ERROR_TYPES.AUTHORIZATION:
        toast.error(displayMessage, { duration: 3000 });
        break;
      case ERROR_TYPES.NETWORK:
        toast.error(displayMessage, { duration: 5000 });
        break;
      case ERROR_TYPES.SERVER:
        toast.error(displayMessage, { duration: 4000 });
        break;
      default:
        toast.error(displayMessage, { duration: 3000 });
    }
  }

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error in ${context}`);
    console.error('Error Info:', errorInfo);
    console.error('Original Error:', error);
    console.groupEnd();
  }

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    onError(errorInfo);
  }

  return errorInfo;
};

/**
 * Creates a standard error handler for async operations
 */
export const createAsyncErrorHandler = (context, options = {}) => {
  return (error) => handleError(error, { ...options, context });
};

/**
 * Wrapper for API calls with built-in error handling
 */
export const withErrorHandling = async (apiCall, options = {}) => {
  const {
    loadingState = null,
    successMessage = null,
    context = 'API call'
  } = options;

  try {
    if (loadingState && typeof loadingState.setLoading === 'function') {
      loadingState.setLoading(true);
    }

    const result = await apiCall();

    if (successMessage) {
      toast.success(successMessage);
    }

    return result;
  } catch (error) {
    handleError(error, { ...options, context });
    throw error; // Re-throw so components can handle specific logic
  } finally {
    if (loadingState && typeof loadingState.setLoading === 'function') {
      loadingState.setLoading(false);
    }
  }
};

/**
 * Retry mechanism for failed operations
 */
export const withRetry = async (operation, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      const errorInfo = extractErrorInfo(error);
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (errorInfo.statusCode >= 400 && errorInfo.statusCode < 500 && errorInfo.statusCode !== 429) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

/**
 * Form validation error handler
 */
export const handleFormError = (error, setFieldErrors) => {
  const errorInfo = extractErrorInfo(error);
  
  if (errorInfo.type === ERROR_TYPES.VALIDATION && errorInfo.details?.errors) {
    const fieldErrors = {};
    
    if (Array.isArray(errorInfo.details.errors)) {
      errorInfo.details.errors.forEach(err => {
        if (err.param) {
          fieldErrors[err.param] = err.msg || err.message;
        }
      });
    }
    
    if (setFieldErrors && typeof setFieldErrors === 'function') {
      setFieldErrors(fieldErrors);
    }
    
    return fieldErrors;
  }
  
  // Show general error
  handleError(error, { context: 'form submission' });
  return {};
};

export default {
  handleError,
  createAsyncErrorHandler,
  withErrorHandling,
  withRetry,
  handleFormError,
  extractErrorInfo,
  ERROR_TYPES
}; 