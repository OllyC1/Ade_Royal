const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'exam_submitted',
      'result_published',
      'exam_created',
      'exam_updated', 
      'exam_deleted',
      'user_registered',
      'system_announcement',
      'reminder',
      'warning'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  actionUrl: {
    type: String,
    maxlength: 500
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    await notification.populate('sender', 'firstName lastName role');
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(recipientId, notificationIds = []) {
  try {
    const query = { recipient: recipientId };
    if (notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }
    
    const result = await this.updateMany(query, { isRead: true });
    return result;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

// Static method to get user notifications with pagination
notificationSchema.statics.getUserNotifications = async function(recipientId, options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = options;

    const query = { recipient: recipientId };
    if (unreadOnly) query.isRead = false;
    if (type) query.type = type;

    const notifications = await this.find(query)
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ 
      recipient: recipientId, 
      isRead: false 
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

module.exports = mongoose.model('Notification', notificationSchema); 