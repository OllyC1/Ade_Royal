const express = require('express');
const Class = require('../models/Class');
const { protect, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all classes
// @route   GET /api/class
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { level } = req.query;

    let query = { isActive: true };
    if (level) query.level = level;

    const classes = await Class.find(query)
      .populate('subjects classTeacher', 'name firstName lastName')
      .populate('studentCount')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        classes
      }
    });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting classes'
    });
  }
});

// @desc    Get class by ID
// @route   GET /api/class/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('subjects classTeacher', 'name firstName lastName')
      .populate({
        path: 'students',
        select: 'firstName lastName email studentId'
      });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: {
        class: classData
      }
    });

  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting class'
    });
  }
});

// @desc    Get classes by level
// @route   GET /api/class/level/:level
// @access  Public
router.get('/level/:level', async (req, res) => {
  try {
    const { level } = req.params;

    const classes = await Class.getByLevel(level);

    res.json({
      success: true,
      data: {
        classes
      }
    });

  } catch (error) {
    console.error('Get classes by level error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting classes by level'
    });
  }
});

module.exports = router; 