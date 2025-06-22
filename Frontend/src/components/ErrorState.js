import React from 'react';
import { 
  ExclamationTriangleIcon, 
  WifiIcon, 
  ServerIcon, 
  ShieldExclamationIcon,
  ArrowPathIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

const ErrorState = ({ 
  error, 
  onRetry, 
  showRetry = true, 
  title = "Something went wrong",
  className = "",
  compact = false 
}) => {
  const getErrorIcon = () => {
    if (!error) return ExclamationTriangleIcon;
    
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return WifiIcon;
    }
    if (errorMessage.includes('server') || errorMessage.includes('500')) {
      return ServerIcon;
    }
    if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      return ShieldExclamationIcon;
    }
    
    return ExclamationTriangleIcon;
  };

  const getErrorMessage = () => {
    if (!error) return "An unexpected error occurred";
    
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    
    return "Something went wrong. Please try again.";
  };

  const getErrorSuggestion = () => {
    if (!error) return null;
    
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return "Please check your internet connection and try again.";
    }
    if (errorMessage.includes('server') || errorMessage.includes('500')) {
      return "Our servers are experiencing issues. Please try again in a few moments.";
    }
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return "The requested resource could not be found.";
    }
    if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      return "You don't have permission to access this resource.";
    }
    
    return "If the problem persists, please contact support.";
  };

  const IconComponent = getErrorIcon();

  if (compact) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="text-center">
          <IconComponent className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{getErrorMessage()}</p>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <IconComponent className="h-16 w-16 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-2 max-w-md">{getErrorMessage()}</p>
      
      {getErrorSuggestion() && (
        <p className="text-sm text-gray-500 mb-6 max-w-md">{getErrorSuggestion()}</p>
      )}
      
      {showRetry && onRetry && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Go Home
          </button>
        </div>
      )}
    </div>
  );
};

export const NetworkErrorState = ({ onRetry, className = "" }) => (
  <ErrorState
    error={{ message: "Unable to connect to server. Please check your internet connection." }}
    title="Connection Problem"
    onRetry={onRetry}
    className={className}
  />
);

export const NotFoundErrorState = ({ message = "The page you're looking for doesn't exist.", onRetry, className = "" }) => (
  <ErrorState
    error={{ message }}
    title="Page Not Found"
    onRetry={onRetry}
    className={className}
  />
);

export const UnauthorizedErrorState = ({ message = "You don't have permission to access this page.", className = "" }) => (
  <ErrorState
    error={{ message }}
    title="Access Denied"
    showRetry={false}
    className={className}
  />
);

export const ServerErrorState = ({ onRetry, className = "" }) => (
  <ErrorState
    error={{ message: "Our servers are experiencing issues. Please try again in a few moments." }}
    title="Server Error"
    onRetry={onRetry}
    className={className}
  />
);

export default ErrorState; 