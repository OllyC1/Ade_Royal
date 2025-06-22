# Error Handling Guide

This guide covers the comprehensive error handling system implemented in the Ade-Royal CBT frontend application.

## Overview

The application now includes industry-standard error handling with:

- **Centralized error management** with consistent error types and messages
- **React Error Boundaries** to catch component errors
- **Toast notifications** for user-friendly error display
- **Loading states** with skeleton loaders
- **Retry mechanisms** for failed operations
- **Form validation** with field-level error handling
- **API call wrappers** with automatic error handling
- **Custom hooks** for common patterns

## Core Components

### 1. Error Handler Utility (`utils/errorHandler.js`)

The main error handling utility provides:

```javascript
import { handleError, withErrorHandling, withRetry } from '../utils/errorHandler';

// Basic error handling
try {
  // risky operation
} catch (error) {
  handleError(error, {
    context: 'user operation',
    customMessage: 'Failed to perform operation'
  });
}

// API call with error handling
const result = await withErrorHandling(
  () => apiRequest.post('/api/endpoint', data),
  {
    context: 'data submission',
    successMessage: 'Data saved successfully',
    loadingState: { setLoading }
  }
);

// Retry failed operations
const result = await withRetry(
  () => apiRequest.get('/api/data'),
  3, // retries
  1000 // delay in ms
);
```

### 2. Error Boundary (`components/ErrorBoundary.js`)

Wraps components to catch React errors:

```javascript
import ErrorBoundary from '../components/ErrorBoundary';

// Wrap components
<ErrorBoundary errorMessage="Custom error message">
  <YourComponent />
</ErrorBoundary>

// Higher-order component
export default withErrorBoundary(YourComponent, {
  errorMessage: 'Component failed to load'
});
```

### 3. Error State Components (`components/ErrorState.js`)

Reusable error display components:

```javascript
import ErrorState, { 
  NetworkErrorState, 
  NotFoundErrorState, 
  ServerErrorState 
} from '../components/ErrorState';

// Basic error state
<ErrorState 
  error={error} 
  onRetry={handleRetry}
  title="Failed to load data"
/>

// Specific error types
<NetworkErrorState onRetry={handleRetry} />
<NotFoundErrorState message="Page not found" />
<ServerErrorState onRetry={handleRetry} />
```

### 4. Loading States (`components/LoadingState.js`)

Various loading indicators:

```javascript
import LoadingState, { 
  InlineLoader, 
  ButtonLoader, 
  TableLoader, 
  CardLoader 
} from '../components/LoadingState';

// Full page loading
<LoadingState fullScreen message="Loading application..." />

// Overlay loading
<LoadingState overlay message="Saving..." />

// Button with loading
<ButtonLoader loading={isLoading}>
  Save Changes
</ButtonLoader>

// Skeleton loaders
<CardLoader count={3} />
<TableLoader columns={4} rows={5} />
```

## Custom Hooks

### 1. useApi Hook

For API calls with built-in error handling:

```javascript
import { useApi } from '../utils/hooks';

const {
  data,
  loading,
  error,
  execute,
  retry
} = useApi(
  () => apiRequest.get('/api/data'),
  [], // dependencies
  {
    context: 'data fetching',
    retries: 3,
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.log('Error:', error)
  }
);

// Manual execution
const handleRefresh = () => execute();

// Retry on error
if (error) {
  return <ErrorState error={error} onRetry={retry} />;
}
```

### 2. useForm Hook

For form handling with validation:

```javascript
import { useForm } from '../utils/hooks';

const validationSchema = (values) => {
  const errors = {};
  if (!values.email) errors.email = 'Email is required';
  if (!values.password) errors.password = 'Password is required';
  return errors;
};

const {
  values,
  errors,
  handleChange,
  handleSubmit,
  isSubmitting
} = useForm(
  { email: '', password: '' }, // initial values
  validationSchema,
  {
    onSubmit: async (data) => {
      const result = await apiRequest.post('/api/login', data);
      // handle success
    }
  }
);
```

### 3. usePagination Hook

For paginated data with error handling:

```javascript
import { usePagination } from '../utils/hooks';

const {
  items,
  loading,
  error,
  currentPage,
  totalPages,
  goToPage,
  nextPage,
  prevPage,
  retry
} = usePagination(
  (page, pageSize) => apiRequest.get(`/api/data?page=${page}&size=${pageSize}`),
  10 // page size
);
```

## Implementation Patterns

### 1. Component Error Handling

```javascript
import React, { useState } from 'react';
import { useApi } from '../utils/hooks';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const DataComponent = () => {
  const {
    data,
    loading,
    error,
    retry
  } = useApi(() => apiRequest.get('/api/data'));

  if (loading) {
    return <LoadingState message="Loading data..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retry} />;
  }

  return (
    <div>
      {/* Render data */}
    </div>
  );
};
```

### 2. Form Submission with Error Handling

```javascript
import React from 'react';
import { useForm } from '../utils/hooks';
import { ButtonLoader } from '../components/LoadingState';
import { handleFormError } from '../utils/errorHandler';

const FormComponent = () => {
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
    setErrors
  } = useForm(
    { name: '', email: '' },
    null,
    {
      onSubmit: async (data) => {
        try {
          await apiRequest.post('/api/submit', data);
          toast.success('Form submitted successfully');
        } catch (error) {
          handleFormError(error, setErrors);
        }
      }
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {errors.name && <span className="error">{errors.name}</span>}
      
      <ButtonLoader loading={isSubmitting} type="submit">
        Submit
      </ButtonLoader>
    </form>
  );
};
```

### 3. Dashboard with Multiple Data Sources

```javascript
import React, { useState, useCallback } from 'react';
import { useApi } from '../utils/hooks';
import { withErrorHandling } from '../utils/errorHandler';

const Dashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    data: dashboardData,
    loading,
    error,
    execute: fetchDashboard
  } = useApi(() => apiRequest.get('/api/dashboard'));

  const handleRefresh = useCallback(async () => {
    try {
      await withErrorHandling(
        () => fetchDashboard(),
        {
          loadingState: { setLoading: setRefreshing },
          context: 'dashboard refresh',
          successMessage: 'Dashboard refreshed'
        }
      );
    } catch (error) {
      // Error already handled by withErrorHandling
    }
  }, [fetchDashboard]);

  // Component implementation...
};
```

## Error Types and Messages

The system categorizes errors into types:

- **NETWORK**: Connection issues, timeouts
- **VALIDATION**: Form validation errors, bad requests
- **AUTHENTICATION**: Login required, token expired
- **AUTHORIZATION**: Access denied, insufficient permissions
- **NOT_FOUND**: Resource not found
- **SERVER**: Internal server errors
- **UNKNOWN**: Unexpected errors

Each type has appropriate default messages and handling behavior.

## Best Practices

### 1. Use Appropriate Error Boundaries

```javascript
// App level - catches all errors
<ErrorBoundary errorMessage="Critical application error">
  <App />
</ErrorBoundary>

// Page level - catches page-specific errors
<ErrorBoundary errorMessage="Error loading this page">
  <PageComponent />
</ErrorBoundary>

// Component level - catches component-specific errors
<ErrorBoundary errorMessage="Error in this section">
  <ComplexComponent />
</ErrorBoundary>
```

### 2. Provide Context in Error Messages

```javascript
// Good - specific context
handleError(error, {
  context: 'exam submission',
  customMessage: 'Failed to submit exam. Your answers have been saved.'
});

// Bad - generic context
handleError(error, {
  context: 'operation',
  customMessage: 'Something went wrong'
});
```

### 3. Handle Loading States Appropriately

```javascript
// Show skeleton loaders for content
if (loading) {
  return <CardLoader count={3} />;
}

// Show overlay for user actions
<div className="relative">
  {/* Content */}
  {saving && <LoadingState overlay message="Saving..." />}
</div>

// Show button loading for form submissions
<ButtonLoader loading={isSubmitting}>
  Save Changes
</ButtonLoader>
```

### 4. Implement Retry Logic

```javascript
// Automatic retry for network errors
const result = await withRetry(
  () => apiRequest.get('/api/data'),
  3, // max retries
  1000 // delay between retries
);

// Manual retry button
if (error) {
  return (
    <ErrorState 
      error={error} 
      onRetry={() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }}
    />
  );
}
```

### 5. Form Error Handling

```javascript
// Field-level validation
const handleSubmit = async (formData) => {
  try {
    await apiRequest.post('/api/submit', formData);
  } catch (error) {
    // Handle validation errors
    const fieldErrors = handleFormError(error, setFieldErrors);
    
    if (Object.keys(fieldErrors).length === 0) {
      // Not a validation error, show general error
      handleError(error, {
        context: 'form submission',
        customMessage: 'Failed to submit form. Please try again.'
      });
    }
  }
};
```

## Toast Notifications

The system uses `react-hot-toast` for notifications:

```javascript
import toast from 'react-hot-toast';

// Success
toast.success('Operation completed successfully');

// Error (handled automatically by error handler)
handleError(error, { context: 'operation' });

// Loading
const loadingToast = toast.loading('Processing...');
// Later...
toast.dismiss(loadingToast);
toast.success('Complete!');
```

## Debugging

### Development Mode Features

- **Console grouping** for error details
- **Error boundaries** show error details in development
- **Request/response logging** in browser console
- **Error IDs** for tracking specific error instances

### Error Information

All errors include:
- **Type**: Categorized error type
- **Message**: User-friendly message
- **Status Code**: HTTP status if applicable
- **Details**: Original error data
- **Context**: Where the error occurred
- **Timestamp**: When the error occurred

## Migration Guide

To update existing components:

1. **Replace manual error handling** with `handleError()` or `withErrorHandling()`
2. **Add Error Boundaries** around component trees
3. **Use custom hooks** (`useApi`, `useForm`) for common patterns
4. **Replace loading indicators** with standard loading components
5. **Add retry functionality** for failed operations

## Testing Error Handling

```javascript
// Test error boundaries
const ThrowError = () => {
  throw new Error('Test error');
};

// Test error states
const TestComponent = () => {
  const [error, setError] = useState(null);
  
  return error ? (
    <ErrorState error={error} onRetry={() => setError(null)} />
  ) : (
    <button onClick={() => setError(new Error('Test error'))}>
      Trigger Error
    </button>
  );
};
```

This error handling system provides a robust foundation for handling all types of errors in the application while maintaining a consistent user experience. 