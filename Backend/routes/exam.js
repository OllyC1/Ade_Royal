const express = require('express');
const Exam = require('../models/Exam');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get exam by code (public info only)
// @route   GET /api/exam/code/:examCode
// @access  Public
router.get('/code/:examCode', optionalAuth, async (req, res) => {
  try {
    const { examCode } = req.params;

    const exam = await Exam.findOne({ 
      examCode: examCode.toUpperCase(),
      isActive: true 
    }).populate('subject class teacher', 'name firstName lastName');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Calculate question count from embedded questions or legacy questions
    let questionCount = 0;
    if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
      questionCount = exam.embeddedQuestions.length;
    } else if (exam.questions && exam.questions.length > 0) {
      questionCount = exam.questions.length;
    }

    // Return basic exam info (no questions or sensitive data)
    res.json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          examCode: exam.examCode,
          subject: exam.subject,
          class: exam.class,
          teacher: exam.teacher,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          instructions: exam.instructions,
          startTime: exam.startTime,
          endTime: exam.endTime,
          status: exam.status,
          isCurrentlyActive: exam.isCurrentlyActive(),
          questionCount: questionCount
        }
      }
    });

  } catch (error) {
    console.error('Get exam by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting exam'
    });
  }
});

// @desc    Get active exams for a class
// @route   GET /api/exam/active/:classId
// @access  Private
router.get('/active/:classId', protect, async (req, res) => {
  try {
    const { classId } = req.params;

    const activeExams = await Exam.find({
      class: classId,
      status: 'Active',
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() },
      isActive: true
    })
    .populate('subject teacher', 'name firstName lastName')
    .select('-questions -attempts')
    .sort({ startTime: 1 });

    res.json({
      success: true,
      data: {
        exams: activeExams
      }
    });

  } catch (error) {
    console.error('Get active exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting active exams'
    });
  }
});

// @desc    Get exam statistics
// @route   GET /api/exam/:id/stats
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('subject class teacher');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if user has permission to view stats
    const isTeacher = req.user.role === 'teacher' && exam.teacher._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          subject: exam.subject,
          class: exam.class,
          teacher: exam.teacher
        },
        analytics: exam.analytics,
        totalAttempts: exam.attempts.length,
        completedAttempts: exam.attempts.filter(att => att.isCompleted).length
      }
    });

  } catch (error) {
    console.error('Get exam stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting exam statistics'
    });
  }
});

module.exports = router; 