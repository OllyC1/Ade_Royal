import { useState, useEffect, useCallback, useRef } from 'react';
import { handleError, withErrorHandling, withRetry } from './errorHandler';
import { apiRequest } from './axios';
import toast from 'react-hot-toast';

/**
 * Custom hook for API calls with built-in loading, error handling, and retry
 */
export const useApi = (apiCall, dependencies = [], options = {}) => {
  const {
    immediate = true,
    retries = 3,
    retryDelay = 1000,
    showToast = true,
    onSuccess,
    onError,
    context = 'API call'
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const result = await withErrorHandling(
        () => withRetry(() => apiCall(...args), retries, retryDelay),
        {
          context,
          showToast: false // We'll handle toasts manually
        }
      );

      if (!mountedRef.current) return;

      setData(result);
      setRetryCount(0);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      if (!mountedRef.current) return;

      setError(err);
      
      if (showToast && retryCount === 0) {
        handleError(err, { context });
      }

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, retries, retryDelay, context, showToast, onSuccess, onError, retryCount]);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    refetch: execute
  };
};

/**
 * Custom hook for form handling with validation and error management
 */
export const useForm = (initialValues = {}, validationSchema = null, options = {}) => {
  const {
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
    resetOnSubmit = false
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((fieldName = null, fieldValue = null) => {
    if (!validationSchema) return {};

    const valuesToValidate = fieldName 
      ? { ...values, [fieldName]: fieldValue }
      : values;

    try {
      if (typeof validationSchema === 'function') {
        return validationSchema(valuesToValidate, fieldName);
      }
      return {};
    } catch (error) {
      console.error('Validation error:', error);
      return {};
    }
  }, [values, validationSchema]);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (validateOnChange && touched[name]) {
      const fieldErrors = validate(name, value);
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }, [validateOnChange, touched, validate]);

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      const fieldErrors = validate(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }, [validateOnBlur, validate, values]);

  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
    }

    const formErrors = validate();
    setErrors(formErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(formErrors).length > 0) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      if (resetOnSubmit) {
        setValues(initialValues);
        setErrors({});
        setTouched({});
      }
    } catch (error) {
      handleError(error, {
        context: 'form submission',
        customMessage: 'Failed to submit form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, resetOnSubmit, initialValues]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldError,
    setFieldValue,
    setErrors
  };
};

/**
 * Custom hook for data fetching with pagination
 */
export const usePagination = (fetchFunction, pageSize = 10, options = {}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const {
    data,
    loading,
    error,
    execute: fetchData,
    retry
  } = useApi(
    (page, size) => fetchFunction(page, size),
    [currentPage, pageSize],
    {
      ...options,
      immediate: true
    }
  );

  useEffect(() => {
    if (data && data.pagination) {
      setTotalPages(data.pagination.totalPages || 0);
      setTotalItems(data.pagination.totalItems || 0);
    }
  }, [data]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const refresh = useCallback(() => {
    fetchData(currentPage, pageSize);
  }, [fetchData, currentPage, pageSize]);

  return {
    items: data?.items || data?.data || [],
    currentPage,
    totalPages,
    totalItems,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    retry
  };
};

/**
 * Custom hook for local storage with error handling
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      handleError(error, {
        context: 'localStorage write',
        customMessage: 'Failed to save data to local storage',
        showToast: false
      });
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      handleError(error, {
        context: 'localStorage remove',
        customMessage: 'Failed to remove data from local storage',
        showToast: false
      });
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Custom hook for debouncing values
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for async operations with loading state
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const result = await asyncFunction(...args);
      setData(result);
      setStatus('success');
      return result;
    } catch (error) {
      setError(error);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    data,
    error,
    isIdle: status === 'idle',
    isLoading: status === 'pending',
    isError: status === 'error',
    isSuccess: status === 'success'
  };
}; 