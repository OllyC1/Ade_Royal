import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [examUpdates, setExamUpdates] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated, token } = useAuth();
  const socketRef = useRef(null);
  const connectionInitialized = useRef(false);
  const reconnectTimeoutRef = useRef(null);

  // Stable connection function that won't change on every render
  const initializeSocket = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (socketRef.current && socketRef.current.connected) {
      console.log('Socket already connected, skipping initialization');
      return;
    }

    console.log('Initializing socket connection for user:', user?.role);
    
    // Clean up any existing connection first
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Initialize socket connection with stable configuration
    const newSocket = io(process.env.REACT_APP_SERVER_URL || '', {
      auth: {
        token: token,
      },
      autoConnect: true,
      reconnection: false, // Disable automatic reconnection to prevent loops
      timeout: 10000,
      forceNew: false // Don't force new connection
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected successfully:', newSocket.id);
      setIsConnected(true);
      connectionInitialized.current = true;
      
      // Join user to their role-specific room after successful connection
      newSocket.emit('join-room', {
        userId: user._id || user.id,
        role: user.role,
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Only attempt manual reconnect for unexpected disconnections
      if (reason === 'io server disconnect' || reason === 'transport error') {
        console.log('Server disconnected, will attempt to reconnect...');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isAuthenticated && user && token) {
            initializeSocket();
          }
        }, 3000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Listen for application events
    newSocket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('exam-update', (update) => {
      setExamUpdates(update);
    });

    newSocket.on('exam-session-update', (sessionData) => {
      console.log('Exam session update:', sessionData);
    });

    newSocket.on('notification', (notification) => {
      console.log('New notification:', notification);
    });

  }, [user, token, isAuthenticated]);

  // Effect to handle authentication changes
  useEffect(() => {
    if (isAuthenticated && user && token && !connectionInitialized.current) {
      console.log('User authenticated, initializing socket connection');
      initializeSocket();
    } else if (!isAuthenticated && socketRef.current) {
      console.log('User not authenticated, cleaning up socket');
      // Clean up when user logs out
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      connectionInitialized.current = false;
    }

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, initializeSocket]); // Stable dependencies

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('SocketProvider unmounting, cleaning up');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      connectionInitialized.current = false;
    };
  }, []);

  // Stable event methods that won't cause re-renders
  const joinExamRoom = useCallback((examId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-exam', { examId });
    }
  }, [isConnected]);

  const leaveExamRoom = useCallback((examId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-exam', { examId });
    }
  }, [isConnected]);

  const updateExamProgress = useCallback((examId, progress) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('exam-progress', { examId, progress });
    }
  }, [isConnected]);

  const updateAnswer = useCallback((examId, questionId, answer) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('answer-update', { examId, questionId, answer });
    }
  }, [isConnected]);

  const monitorExam = useCallback((examId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('monitor-exam', { examId });
    }
  }, [isConnected]);

  const stopMonitoringExam = useCallback((examId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stop-monitor-exam', { examId });
    }
  }, [isConnected]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    examUpdates,
    joinExamRoom,
    leaveExamRoom,
    updateExamProgress,
    updateAnswer,
    monitorExam,
    stopMonitoringExam,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 