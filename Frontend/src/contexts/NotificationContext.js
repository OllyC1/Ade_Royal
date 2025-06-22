import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { apiRequest } from '../utils/axios';
import { handleError, withErrorHandling } from '../utils/errorHandler';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'LOAD_NOTIFICATIONS_SUCCESS':
      return {
        ...state,
        notifications: action.payload.replace ? action.payload.notifications : [...state.notifications, ...action.payload.notifications],
        unreadCount: action.payload.unreadCount,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page,
        loading: false,
        error: null
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + (action.payload.isRead ? 0 : 1)
      };
    
    case 'UPDATE_NOTIFICATION_COUNT':
      return {
        ...state,
        unreadCount: action.payload
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => 
          action.payload.includes(notification._id) 
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - action.payload.length)
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({ ...notification, isRead: true })),
        unreadCount: 0
      };
    
    case 'DELETE_NOTIFICATION':
      const deletedNotification = state.notifications.find(n => n._id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification._id !== action.payload),
        unreadCount: deletedNotification && !deletedNotification.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
        hasMore: true,
        currentPage: 1
      };
    
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();

  // Load notifications
  const loadNotifications = useCallback(async (page = 1, replace = false) => {
    if (!isAuthenticated || !user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const data = await withErrorHandling(
        () => apiRequest.get(`/api/notifications?page=${page}&limit=20`),
        {
          context: 'loading notifications',
          showToast: false
        }
      );

      dispatch({
        type: 'LOAD_NOTIFICATIONS_SUCCESS',
        payload: {
          notifications: data.data.notifications,
          unreadCount: data.data.unreadCount,
          hasMore: data.data.pagination.page < data.data.pagination.pages,
          page: data.data.pagination.page,
          replace
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error });
      handleError(error, {
        context: 'loading notifications',
        showToast: false
      });
    }
  }, [isAuthenticated, user]);

  // Load notification count
  const loadNotificationCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const data = await withErrorHandling(
        () => apiRequest.get('/api/notifications/count'),
        {
          context: 'loading notification count',
          showToast: false
        }
      );

      dispatch({
        type: 'UPDATE_NOTIFICATION_COUNT',
        payload: data.data.unreadCount
      });
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  }, [isAuthenticated, user]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds = []) => {
    if (!isAuthenticated || !user) return;

    try {
      await withErrorHandling(
        () => apiRequest.put('/api/notifications/read', { notificationIds }),
        {
          context: 'marking notifications as read',
          showToast: false
        }
      );

      if (notificationIds.length > 0) {
        dispatch({ type: 'MARK_AS_READ', payload: notificationIds });
      } else {
        dispatch({ type: 'MARK_ALL_AS_READ' });
      }
    } catch (error) {
      handleError(error, {
        context: 'marking notifications as read',
        customMessage: 'Failed to mark notifications as read'
      });
    }
  }, [isAuthenticated, user]);

  // Mark single notification as read
  const markSingleAsRead = useCallback(async (notificationId) => {
    if (!isAuthenticated || !user) return;

    try {
      await withErrorHandling(
        () => apiRequest.put(`/api/notifications/${notificationId}/read`),
        {
          context: 'marking notification as read',
          showToast: false
        }
      );

      dispatch({ type: 'MARK_AS_READ', payload: [notificationId] });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [isAuthenticated, user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!isAuthenticated || !user) return;

    try {
      await withErrorHandling(
        () => apiRequest.delete(`/api/notifications/${notificationId}`),
        {
          context: 'deleting notification',
          successMessage: 'Notification deleted'
        }
      );

      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
    } catch (error) {
      handleError(error, {
        context: 'deleting notification',
        customMessage: 'Failed to delete notification'
      });
    }
  }, [isAuthenticated, user]);

  // Clear all read notifications
  const clearReadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const data = await withErrorHandling(
        () => apiRequest.delete('/api/notifications/read'),
        {
          context: 'clearing read notifications',
          successMessage: 'Read notifications cleared'
        }
      );

      // Reload notifications to update the list
      loadNotifications(1, true);
    } catch (error) {
      handleError(error, {
        context: 'clearing read notifications',
        customMessage: 'Failed to clear read notifications'
      });
    }
  }, [isAuthenticated, user, loadNotifications]);

  // Show notification toast
  const showNotificationToast = useCallback((notification) => {
    const priorityColors = {
      low: '📨',
      normal: '🔔',
      high: '⚠️',
      urgent: '🚨'
    };

    const icon = priorityColors[notification.priority] || '🔔';
    
    toast.success(
      `${icon} ${notification.title}`,
      {
        duration: 4000,
        position: 'top-right',
        style: {
          background: notification.priority === 'urgent' ? '#fee2e2' : '#f0f9ff',
          border: notification.priority === 'urgent' ? '1px solid #fca5a5' : '1px solid #7dd3fc',
          color: notification.priority === 'urgent' ? '#991b1b' : '#0c4a6e',
        }
      }
    );
  }, []);

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      loadNotifications(state.currentPage + 1, false);
    }
  }, [loadNotifications, state.loading, state.hasMore, state.currentPage]);

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected || !isAuthenticated) return;

    const handleNewNotification = (data) => {
      console.log('New notification received:', data);
      const notification = data.notification;
      
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      showNotificationToast(notification);
    };

    const handleNotificationCount = (data) => {
      console.log('Notification count update:', data);
      dispatch({ type: 'UPDATE_NOTIFICATION_COUNT', payload: data.unreadCount });
    };

    socket.on('new-notification', handleNewNotification);
    socket.on('notification-count', handleNotificationCount);

    return () => {
      socket.off('new-notification', handleNewNotification);
      socket.off('notification-count', handleNotificationCount);
    };
  }, [socket, isConnected, isAuthenticated, showNotificationToast]);

  // Load initial data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications(1, true);
      loadNotificationCount();
    } else {
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    }
  }, [isAuthenticated, user, loadNotifications, loadNotificationCount]);

  const value = {
    ...state,
    loadNotifications,
    loadNotificationCount,
    markAsRead,
    markSingleAsRead,
    deleteNotification,
    clearReadNotifications,
    loadMore,
    refreshNotifications: () => loadNotifications(1, true)
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 