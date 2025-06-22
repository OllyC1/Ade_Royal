const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Set Socket.IO instance
  setIO(io) {
    this.io = io;
  }

  // Create and send notification
  async createAndSendNotification({
    recipientId,
    senderId = null,
    type,
    title,
    message,
    data = {},
    priority = 'normal',
    actionUrl = null,
    expiresAt = null,
    sendRealTime = true
  }) {
    try {
      // Create notification in database
      const notificationData = {
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        data,
        priority,
        actionUrl,
        expiresAt
      };

      const notification = await Notification.createNotification(notificationData);

      // Send real-time notification if Socket.IO is available
      if (sendRealTime && this.io) {
        this.sendRealTimeNotification(recipientId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error in createAndSendNotification:', error);
      throw error;
    }
  }

  // Send real-time notification via Socket.IO
  sendRealTimeNotification(recipientId, notification) {
    try {
      if (!this.io) {
        console.warn('Socket.IO not available for real-time notification');
        return;
      }

      // Send to specific user's room
      this.io.to(`user-${recipientId}`).emit('new-notification', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          sender: notification.sender
        }
      });

      // Also send notification count update
      this.sendNotificationCount(recipientId);
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  // Send updated notification count
  async sendNotificationCount(recipientId) {
    try {
      if (!this.io) return;

      const unreadCount = await Notification.countDocuments({
        recipient: recipientId,
        isRead: false
      });

      this.io.to(`user-${recipientId}`).emit('notification-count', {
        unreadCount
      });
    } catch (error) {
      console.error('Error sending notification count:', error);
    }
  }

  // Send notification to multiple recipients
  async sendBulkNotifications({
    recipientIds,
    senderId = null,
    type,
    title,
    message,
    data = {},
    priority = 'normal',
    actionUrl = null,
    expiresAt = null
  }) {
    try {
      const notifications = [];
      
      for (const recipientId of recipientIds) {
        const notification = await this.createAndSendNotification({
          recipientId,
          senderId,
          type,
          title,
          message,
          data,
          priority,
          actionUrl,
          expiresAt,
          sendRealTime: true
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error in sendBulkNotifications:', error);
      throw error;
    }
  }

  // Notification templates for common scenarios
  async notifyExamSubmitted({ studentId, teacherId, examId, examTitle, studentName }) {
    return await this.createAndSendNotification({
      recipientId: teacherId,
      senderId: studentId,
      type: 'exam_submitted',
      title: 'New Exam Submission',
      message: `${studentName} has submitted their exam: ${examTitle}`,
      data: { examId, studentId, studentName },
      priority: 'normal',
      actionUrl: `/teacher/results/${examId}`
    });
  }

  async notifyResultPublished({ teacherId, studentIds, examId, examTitle, teacherName }) {
    const notifications = [];
    
    for (const studentId of studentIds) {
      const notification = await this.createAndSendNotification({
        recipientId: studentId,
        senderId: teacherId,
        type: 'result_published',
        title: 'Exam Results Published',
        message: `Results for "${examTitle}" have been published by ${teacherName}`,
        data: { examId, teacherId, teacherName },
        priority: 'high',
        actionUrl: `/student/results/${examId}`
      });
      notifications.push(notification);
    }

    return notifications;
  }

  async notifyExamCreated({ teacherId, studentIds, examId, examTitle, teacherName, scheduledDate }) {
    const notifications = [];
    
    for (const studentId of studentIds) {
      const notification = await this.createAndSendNotification({
        recipientId: studentId,
        senderId: teacherId,
        type: 'exam_created',
        title: 'New Exam Scheduled',
        message: `A new exam "${examTitle}" has been scheduled by ${teacherName}`,
        data: { examId, teacherId, teacherName, scheduledDate },
        priority: 'normal',
        actionUrl: `/student/exams/${examId}`
      });
      notifications.push(notification);
    }

    return notifications;
  }

  async notifySystemAnnouncement({ recipientIds, title, message, priority = 'high', senderId = null }) {
    return await this.sendBulkNotifications({
      recipientIds,
      senderId,
      type: 'system_announcement',
      title,
      message,
      priority,
      actionUrl: '/announcements'
    });
  }

  // Get user notifications
  async getUserNotifications(recipientId, options = {}) {
    return await Notification.getUserNotifications(recipientId, options);
  }

  // Mark notifications as read
  async markAsRead(recipientId, notificationIds = []) {
    const result = await Notification.markAsRead(recipientId, notificationIds);
    
    // Send updated count in real-time
    if (this.io) {
      this.sendNotificationCount(recipientId);
    }
    
    return result;
  }

  // Delete old notifications (cleanup job)
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });
      
      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 