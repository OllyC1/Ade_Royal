const express = require('express');
const Subject = require('../models/Subject');
const { protect, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all subjects
// @route   GET /api/subject
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, class: classId } = req.query;

    let query = { isActive: true };
    if (category) query.category = category;
    if (classId) query.classes = classId;

    const subjects = await Subject.find(query)
      .populate('classes teachers', 'name firstName lastName')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        subjects
      }
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting subjects'
    });
  }
});

// @desc    Get subject by ID
// @route   GET /api/subject/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('classes teachers', 'name firstName lastName');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      data: {
        subject
      }
    });

  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting subject'
    });
  }
});

module.exports = router; 