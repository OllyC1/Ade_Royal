import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { handleError, withErrorHandling, ERROR_TYPES } from '../utils/errorHandler';
import { apiRequest } from '../utils/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: (() => {
    try {
      const userData = localStorage.getItem('user');
      return userData && userData !== 'undefined' ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  })(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      try {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      } catch (error) {
        console.error('Error storing auth data to localStorage:', error);
        handleError(error, {
          context: 'localStorage storage',
          showToast: false
        });
      }
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'LOGOUT':
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case 'LOAD_USER':
      try {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } catch (error) {
        console.error('Error storing user data to localStorage:', error);
        handleError(error, {
          context: 'user data storage',
          showToast: false
        });
      }
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload || null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    if (state.token) {
      loadUser();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadUser = async () => {
    try {
      const data = await withErrorHandling(
        () => apiRequest.get('/api/auth/me'),
        {
          context: 'user verification',
          showToast: false // Don't show toast for automatic user loads
        }
      );
      
      dispatch({ type: 'LOAD_USER', payload: data.data.user });
    } catch (error) {
      console.error('Load user error:', error);
      dispatch({ type: 'AUTH_ERROR', payload: error });
      
      // Only show error if it's not a network issue during page load
      if (error.response?.status !== 401) {
        handleError(error, {
          context: 'user verification',
          customMessage: 'Session verification failed. Please log in again.',
          showToast: false
        });
      }
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const data = await withErrorHandling(
        () => apiRequest.post('/api/auth/login', { email, password }),
        {
          context: 'user login',
          showToast: false // We'll handle success message manually
        }
      );
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.data.user,
          token: data.data.token,
        },
      });

      return { success: true, user: data.data.user };
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error });
      
      const errorInfo = handleError(error, {
        context: 'login',
        showToast: false // Let the Login component handle the toast
      });
      
      return { 
        success: false, 
        message: errorInfo.message,
        error: errorInfo
      };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const data = await withErrorHandling(
        () => apiRequest.post('/api/auth/register', userData),
        {
          context: 'user registration',
          successMessage: 'Registration successful! Welcome to Ade-Royal CBT.'
        }
      );
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.data.user,
          token: data.data.token,
        },
      });

      return { success: true, user: data.data.user };
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error });
      
      const errorInfo = handleError(error, {
        context: 'registration',
        customMessage: 'Registration failed. Please check your information and try again.'
      });
      
      return { 
        success: false, 
        message: errorInfo.message,
        error: errorInfo
      };
    }
  };

  const logout = () => {
    try {
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch (error) {
      handleError(error, {
        context: 'logout',
        customMessage: 'Error during logout'
      });
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await withErrorHandling(
        () => apiRequest.put('/api/auth/profile', profileData),
        {
          context: 'profile update',
          successMessage: 'Profile updated successfully'
        }
      );
      
      dispatch({ type: 'LOAD_USER', payload: data.data.user });
      return { success: true, user: data.data.user };
    } catch (error) {
      const errorInfo = handleError(error, {
        context: 'profile update',
        customMessage: 'Failed to update profile. Please try again.'
      });
      
      return { 
        success: false, 
        message: errorInfo.message,
        error: errorInfo
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await withErrorHandling(
        () => apiRequest.put('/api/auth/change-password', passwordData),
        {
          context: 'password change',
          successMessage: 'Password changed successfully'
        }
      );
      
      return { success: true };
    } catch (error) {
      const errorInfo = handleError(error, {
        context: 'password change',
        customMessage: 'Failed to change password. Please check your current password and try again.'
      });
      
      return { 
        success: false, 
        message: errorInfo.message,
        error: errorInfo
      };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    loadUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 