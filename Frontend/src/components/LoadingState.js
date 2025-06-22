import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const LoadingState = ({ 
  message = "Loading...", 
  size = "medium",
  className = "",
  overlay = false,
  fullScreen = false 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { spinner: 'h-4 w-4', text: 'text-sm' };
      case 'large':
        return { spinner: 'h-12 w-12', text: 'text-lg' };
      default:
        return { spinner: 'h-8 w-8', text: 'text-base' };
    }
  };

  const sizeClasses = getSizeClasses();

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <ArrowPathIcon className={`${sizeClasses.spinner} text-blue-600 animate-spin`} />
      {message && (
        <p className={`${sizeClasses.text} text-gray-600 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        {content}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      {content}
    </div>
  );
};

export const InlineLoader = ({ message, className = "" }) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <ArrowPathIcon className="h-4 w-4 text-blue-600 animate-spin" />
    {message && <span className="text-sm text-gray-600">{message}</span>}
  </div>
);

export const ButtonLoader = ({ loading, children, ...props }) => (
  <button {...props} disabled={loading || props.disabled}>
    {loading ? (
      <div className="flex items-center justify-center space-x-2">
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    ) : (
      children
    )}
  </button>
);

export const TableLoader = ({ columns = 3, rows = 5 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="flex-1">
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const CardLoader = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    ))}
  </div>
);

export default LoadingState; 