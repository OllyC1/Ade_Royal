const express = require('express');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type
    };

    const result = await Notification.getUserNotifications(req.user._id, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/count
// @access  Private
router.get('/count', protect, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification count',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
router.put('/read', protect, async (req, res) => {
  try {
    const { notificationIds = [] } = req.body;

    const result = await Notification.markAsRead(req.user._id, notificationIds);

    // If notification service is available, send real-time update
    if (req.app.locals.notificationService) {
      req.app.locals.notificationService.sendNotificationCount(req.user._id);
    }

    res.json({
      success: true,
      message: notificationIds.length > 0 
        ? 'Selected notifications marked as read'
        : 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Send real-time count update
    if (req.app.locals.notificationService) {
      req.app.locals.notificationService.sendNotificationCount(req.user._id);
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Send real-time count update
    if (req.app.locals.notificationService) {
      req.app.locals.notificationService.sendNotificationCount(req.user._id);
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Clear all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
router.delete('/read', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      isRead: true
    });

    res.json({
      success: true,
      message: `${result.deletedCount} read notifications cleared`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Clear read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear read notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 