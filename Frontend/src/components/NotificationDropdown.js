import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { BellIcon, XMarkIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showActions, setShowActions] = useState(null);
  const dropdownRef = useRef(null);
  const actionsRef = useRef(null);
  const navigate = useNavigate();
  
  const {
    notifications,
    unreadCount,
    loading,
    markSingleAsRead,
    markAsRead,
    deleteNotification,
    clearReadNotifications,
    loadMore,
    hasMore
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markSingleAsRead(notification._id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAsRead();
    setShowActions(null);
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
    setShowActions(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'exam_submitted':
        return '📝';
      case 'result_published':
        return '📊';
      case 'exam_created':
        return '📅';
      case 'exam_updated':
        return '✏️';
      case 'system_announcement':
        return '📢';
      case 'reminder':
        return '⏰';
      case 'warning':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-royal-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Notification Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications {unreadCount > 0 && <span className="text-royal-blue-600">({unreadCount})</span>}
            </h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-royal-blue-600 hover:text-royal-blue-700 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-blue-600 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`relative p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-royal-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Notification Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </span>
                              {notification.sender && (
                                <span className="text-xs text-gray-400">
                                  • from {notification.sender.firstName} {notification.sender.lastName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(showActions === notification._id ? null : notification._id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            </button>

                            {showActions === notification._id && (
                              <div 
                                ref={actionsRef}
                                className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                              >
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markSingleAsRead(notification._id);
                                      setShowActions(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Mark as read
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDeleteNotification(notification._id, e)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="absolute top-4 right-4">
                        <div className="w-2 h-2 bg-royal-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full text-center text-sm text-royal-blue-600 hover:text-royal-blue-700 font-medium disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load more notifications'}
                    </button>
                  </div>
                )}

                {/* Clear Read Notifications */}
                {notifications.some(n => n.isRead) && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={clearReadNotifications}
                      className="w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Clear read notifications
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 