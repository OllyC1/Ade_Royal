const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { protect, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply teacher/admin protection to all routes
router.use(protect);
router.use(teacherOrAdmin);

// @desc    Get teacher dashboard
// @route   GET /api/teacher/dashboard
// @access  Private/Teacher
router.get('/dashboard', async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get teacher's subject assignments to determine their students
    const subjects = await Subject.find({ 
      teachers: teacherId, 
      isActive: true 
    }).populate('classes');

    // Get all class IDs where this teacher teaches
    const classIds = [];
    subjects.forEach(subject => {
      subject.classes.forEach(cls => {
        if (!classIds.some(id => id.toString() === cls._id.toString())) {
          classIds.push(cls._id);
        }
      });
    });

    // Get total students in teacher's classes
    const totalStudents = await User.countDocuments({
      role: 'student',
      class: { $in: classIds },
      isActive: true
    });

    // Get teacher's exams
    const allExams = await Exam.find({ teacher: teacherId, isActive: true });
    const totalExams = allExams.length;

    // Get active exams (currently running)
    const now = new Date();
    const activeExams = allExams.filter(exam => 
      now >= new Date(exam.startTime) && now <= new Date(exam.endTime)
    ).length;

    // Get pending grading count (theory questions that need manual grading)
    let pendingGrading = 0;
    for (const exam of allExams) {
      const theoryQuestionCount = exam.embeddedQuestions?.filter(q => q.questionType === 'Theory').length || 0;
      if (theoryQuestionCount > 0) {
        const pendingAttempts = exam.attempts.filter(attempt => 
          attempt.isCompleted && 
          (attempt.gradingStatus === 'Pending' || attempt.gradingStatus === 'Partial')
        );
        pendingGrading += pendingAttempts.length;
      }
    }

    // Get recent exams (last 5)
    const recentExams = await Exam.find({ teacher: teacherId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('subject class')
      .lean();

    // Get pending grading details (actual attempts that need grading)
    const pendingGradingDetails = [];
    for (const exam of allExams) {
      const theoryQuestionCount = exam.embeddedQuestions?.filter(q => q.questionType === 'Theory').length || 0;
      if (theoryQuestionCount > 0) {
        const pendingAttempts = exam.attempts.filter(attempt => 
          attempt.isCompleted && 
          (attempt.gradingStatus === 'Pending' || attempt.gradingStatus === 'Partial')
        );
        
        for (const attempt of pendingAttempts) {
          const student = await User.findById(attempt.student).select('firstName lastName studentId email');
          if (student) {
            pendingGradingDetails.push({
              _id: attempt._id,
              exam: {
                _id: exam._id,
                title: exam.title,
                examCode: exam.examCode
              },
              student: student,
              submittedAt: attempt.submittedAt,
              theoryQuestionsCount: theoryQuestionCount,
              gradingStatus: attempt.gradingStatus
            });
          }
        }
      }
    }

    // Sort pending grading by submission time (oldest first)
    pendingGradingDetails.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

    // Get exam statistics
    const examStats = {
      totalAttempts: allExams.reduce((sum, exam) => sum + exam.attempts.length, 0),
      completedAttempts: allExams.reduce((sum, exam) => 
        sum + exam.attempts.filter(attempt => attempt.isCompleted).length, 0
      )
    };

    // Calculate average percentage across all completed attempts
    let totalPercentage = 0;
    let scoreCount = 0;
    allExams.forEach(exam => {
      exam.attempts.forEach(attempt => {
        if (attempt.isCompleted && attempt.percentage !== undefined) {
          totalPercentage += attempt.percentage;
          scoreCount++;
        }
      });
    });
    const averageScore = scoreCount > 0 ? Math.round(totalPercentage / scoreCount) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalExams,
          activeExams,
          totalStudents,
          pendingGrading
        },
        recentExams,
        pendingGradingDetails: pendingGradingDetails.slice(0, 5), // Limit to 5 for dashboard
        statistics: {
          totalAttempts: examStats.totalAttempts,
          completedAttempts: examStats.completedAttempts,
          averageScore,
          totalSubjects: subjects.length
        },
        examsByStatus: {
          draft: allExams.filter(e => e.status === 'Draft').length,
          published: allExams.filter(e => e.status === 'Published').length,
          active: activeExams,
          completed: allExams.filter(e => e.status === 'Completed').length
        }
      }
    });

  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard data'
    });
  }
});

// @desc    Get teacher's subjects
// @route   GET /api/teacher/subjects
// @access  Private/Teacher
router.get('/subjects', async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id).populate({
      path: 'subjects',
      populate: {
        path: 'classes',
        model: 'Class'
      }
    });

    res.json({
      success: true,
      data: {
        subjects: teacher.subjects
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

// @desc    Get teacher's assignments (subject-class combinations)
// @route   GET /api/teacher/assignments
// @access  Private/Teacher
router.get('/assignments', async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Find all subjects where this teacher is assigned
    const subjects = await Subject.find({ 
      teachers: teacherId, 
      isActive: true 
    }).populate('classes');

    // Create assignments array with subject-class combinations
    const assignments = [];
    
    subjects.forEach(subject => {
      subject.classes.forEach(classObj => {
        assignments.push({
          _id: `${subject._id}_${classObj._id}`,
          subject: {
            _id: subject._id,
            name: subject.name,
            code: subject.code,
            category: subject.category
          },
          class: {
            _id: classObj._id,
            name: classObj.name,
            level: classObj.level,
            section: classObj.section
          }
        });
      });
    });

    res.json({
      success: true,
      data: {
        assignments
      }
    });

  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting assignments'
    });
  }
});

// @desc    Create new question
// @route   POST /api/teacher/questions
// @access  Private/Teacher
router.post('/questions', [
  body('questionText').trim().isLength({ min: 4 }).withMessage('Question text must be at least 4 characters'),
  body('questionType').isIn(['Objective', 'Theory']).withMessage('Invalid question type'),
  body('subject').isMongoId().withMessage('Valid subject ID is required'),
  body('class').isMongoId().withMessage('Valid class ID is required'),
  body('marks').isFloat({ min: 0.5, max: 20 }).withMessage('Marks must be between 0.5 and 20'),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      questionText,
      questionType,
      subject,
      class: classId,
      marks,
      difficulty,
      options,
      explanation,
      expectedAnswer,
      keywords,
      topic,
      tags
    } = req.body;

    // Verify teacher has access to this subject
    const teacher = await User.findById(req.user._id).populate('subjects');
    const hasAccess = teacher.subjects.some(sub => sub._id.toString() === subject);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this subject'
      });
    }

    // Validate objective question options
    if (questionType === 'Objective') {
      if (!options || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Objective questions must have at least 2 options'
        });
      }

      const correctOptions = options.filter(option => option.isCorrect);
      if (correctOptions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Objective questions must have at least one correct answer'
        });
      }
    }

    const questionData = {
      questionText,
      questionType,
      subject,
      class: classId,
      teacher: req.user._id,
      marks,
      difficulty: difficulty || 'Medium',
      explanation,
      topic,
      tags: tags || []
    };

    if (questionType === 'Objective') {
      questionData.options = options;
    } else {
      questionData.expectedAnswer = expectedAnswer;
      questionData.keywords = keywords || [];
    }

    const question = new Question(questionData);
    await question.save();
    await question.populate('subject class teacher');

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: {
        question
      }
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating question'
    });
  }
});

// @desc    Get teacher's questions for selection (question bank)
// @route   GET /api/teacher/questions/for-selection
// @access  Private/Teacher
router.get('/questions/for-selection', async (req, res) => {
  try {
    const { subject, class: classId, questionType, difficulty, limit = 100, search } = req.query;

    // Build query
    let query = { teacher: req.user._id, isActive: true };
    if (subject) query.subject = subject;
    if (classId) query.class = classId;
    if (questionType) query.questionType = questionType;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const questions = await Question.find(query)
      .populate('subject class')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        questions
      }
    });

  } catch (error) {
    console.error('Get questions for selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting questions for selection'
    });
  }
});

// @desc    Get teacher's questions statistics
// @route   GET /api/teacher/questions/statistics
// @access  Private/Teacher
router.get('/questions/statistics', async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get total questions count
    const totalQuestions = await Question.countDocuments({ 
      teacher: teacherId, 
      isActive: true 
    });

    // Get questions by type
    const objectiveCount = await Question.countDocuments({ 
      teacher: teacherId, 
      questionType: 'Objective',
      isActive: true 
    });

    const theoryCount = await Question.countDocuments({ 
      teacher: teacherId, 
      questionType: 'Theory',
      isActive: true 
    });

    // Get questions by difficulty
    const difficultyStats = await Question.aggregate([
      { $match: { teacher: teacherId, isActive: true } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    // Get questions by subject
    const subjectStats = await Question.aggregate([
      { $match: { teacher: teacherId, isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
      { $project: { subject: { $arrayElemAt: ['$subject.name', 0] }, count: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalQuestions,
        questionTypes: {
          objective: objectiveCount,
          theory: theoryCount
        },
        difficultyDistribution: difficultyStats,
        subjectDistribution: subjectStats
      }
    });

  } catch (error) {
    console.error('Get questions statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting questions statistics'
    });
  }
});

// @desc    Get teacher's questions
// @route   GET /api/teacher/questions
// @access  Private/Teacher
router.get('/questions', async (req, res) => {
  try {
    const { subject, class: classId, questionType, difficulty, page = 1, limit = 10, search } = req.query;

    // Build query
    let query = { teacher: req.user._id, isActive: true };
    if (subject) query.subject = subject;
    if (classId) query.class = classId;
    if (questionType) query.questionType = questionType;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const questions = await Question.find(query)
      .populate('subject class')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting questions'
    });
  }
});

// @desc    Update question
// @route   PUT /api/teacher/questions/:id
// @access  Private/Teacher
router.put('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or you do not have permission to edit it'
      });
    }

    const {
      questionText,
      marks,
      difficulty,
      options,
      explanation,
      expectedAnswer,
      keywords,
      topic,
      tags
    } = req.body;

    // Update fields
    if (questionText) question.questionText = questionText;
    if (marks) question.marks = marks;
    if (difficulty) question.difficulty = difficulty;
    if (explanation) question.explanation = explanation;
    if (topic) question.topic = topic;
    if (tags) question.tags = tags;

    if (question.questionType === 'Objective' && options) {
      question.options = options;
    } else if (question.questionType === 'Theory') {
      if (expectedAnswer) question.expectedAnswer = expectedAnswer;
      if (keywords) question.keywords = keywords;
    }

    await question.save();
    await question.populate('subject class teacher');

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: {
        question
      }
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating question'
    });
  }
});

// @desc    Delete question
// @route   DELETE /api/teacher/questions/:id
// @access  Private/Teacher
router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or you do not have permission to delete it'
      });
    }

    // Check if question is used in any active exam
    const activeExam = await Exam.findOne({
      questions: req.params.id,
      status: { $in: ['Active', 'Published'] }
    });

    if (activeExam) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question that is used in an active exam'
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting question'
    });
  }
});

// @desc    Create new exam
// @route   POST /api/teacher/exams
// @access  Private/Teacher
router.post('/exams', [
  body('title').trim().isLength({ min: 5 }).withMessage('Exam title must be at least 5 characters'),
  body('subject').isMongoId().withMessage('Valid subject ID is required'),
  body('class').isMongoId().withMessage('Valid class ID is required'),
  body('duration').isInt({ min: 5, max: 300 }).withMessage('Duration must be between 5 and 300 minutes'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('passingMarks').isInt({ min: 0 }).withMessage('Passing marks cannot be negative'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('questions').optional().isArray({ min: 1 }).withMessage('At least one question is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      subject,
      class: classId,
      description,
      duration,
      totalMarks,
      passingMarks,
      startTime,
      endTime,
      instructions,
      examType,
      settings,
      questions,
      useQuestionBank,
      questionBankSelection
    } = req.body;

    // Verify teacher has access to this subject and class
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc || !subjectDoc.teachers.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this subject'
      });
    }

    if (!subjectDoc.classes.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'This subject is not assigned to the selected class'
      });
    }

    // Validate dates
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    if (passingMarks > totalMarks) {
      return res.status(400).json({
        success: false,
        message: 'Passing marks cannot exceed total marks'
      });
    }

    // Handle different question input formats
    let finalQuestions = [];
    
    if (useQuestionBank && questionBankSelection) {
      // New question bank approach - fetch questions from the bank
      const allQuestionIds = [
        ...(questionBankSelection.objective?.questions || []),
        ...(questionBankSelection.theory?.questions || [])
      ];
      
      if (allQuestionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one question must be selected from the question bank'
        });
      }
      
      // Fetch questions from the database
      const bankQuestions = await Question.find({
        _id: { $in: allQuestionIds },
        teacher: req.user._id,
        isActive: true
      });
      
      if (bankQuestions.length !== allQuestionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected questions were not found or you do not have access to them'
        });
      }
      
      // Convert bank questions to the expected format
      finalQuestions = bankQuestions.map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        options: q.questionType === 'Objective' ? q.options.map(opt => opt.text || opt) : [],
        correctAnswer: q.questionType === 'Objective' ? q.options.findIndex(opt => opt.isCorrect) : undefined,
        explanation: q.explanation || '',
        additionalInfo: ''
      }));
      
    } else if (questions && questions.length > 0) {
      // Legacy approach - direct questions array
      finalQuestions = questions;
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one question is required'
      });
    }

    // Validate question types based on exam type
    const objectiveQuestions = finalQuestions.filter(q => q.questionType === 'Objective');
    const theoryQuestions = finalQuestions.filter(q => q.questionType === 'Theory');

    if (examType === 'Objective' && theoryQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Objectives-only exam cannot contain theory questions'
      });
    }

    if (examType === 'Theory' && objectiveQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Theory-only exam cannot contain objective questions'
      });
    }

    // Validate each question
    for (let i = 0; i < finalQuestions.length; i++) {
      const question = finalQuestions[i];
      
      if (!question.questionText || question.questionText.trim().length < 4) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Question text must be at least 4 characters`
        });
      }

      if (!question.marks || question.marks < 1 || question.marks > 20) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Marks must be between 1 and 20`
        });
      }

      if (question.questionType === 'Objective') {
        if (!question.options || question.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Objective questions must have at least 2 options`
          });
        }

        if (question.correctAnswer === undefined || question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Please select a valid correct answer`
          });
        }

        // Check for empty options
        const filledOptions = question.options.filter(opt => opt && opt.trim() !== '');
        if (filledOptions.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: At least 2 options must be filled`
          });
        }
      }
    }

    // Calculate total marks from questions to verify
    const calculatedTotalMarks = finalQuestions.reduce((sum, q) => sum + q.marks, 0);
    
    if (calculatedTotalMarks !== totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Total marks mismatch. Expected: ${totalMarks}, Calculated: ${calculatedTotalMarks}`
      });
    }

    // Generate unique exam code
    const examCode = await Exam.generateExamCode();

    // Prepare exam data with embedded questions
    const examData = {
      title,
      examCode,
      subject,
      class: classId,
      teacher: req.user._id,
      description,
      duration,
      totalMarks,
      passingMarks,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      instructions,
      examType: examType || 'Mixed',
      settings: {
        shuffleQuestions: settings?.shuffleQuestions || false,
        shuffleOptions: settings?.shuffleOptions || false,
        allowReview: settings?.allowReview || true,
        showResults: settings?.showResults !== undefined ? settings.showResults : true,
        preventCheating: settings?.preventCheating || true,
        ...settings
      },
      allowRetakes: settings?.allowRetakes || false,
      // Store questions directly in the exam (no more question bank dependency)
      embeddedQuestions: finalQuestions.map((q, index) => ({
        questionNumber: index + 1,
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        marks: q.marks,
        options: q.questionType === 'Objective' ? q.options.filter(opt => opt && opt.trim() !== '') : [],
        correctAnswer: q.questionType === 'Objective' ? q.correctAnswer : undefined,
        explanation: q.explanation || '',
        additionalInfo: q.additionalInfo || ''
      })),
      questionCount: finalQuestions.length,
      questionTypes: {
        objective: {
          count: objectiveQuestions.length,
          totalMarks: objectiveQuestions.reduce((sum, q) => sum + q.marks, 0)
        },
        theory: {
          count: theoryQuestions.length,
          totalMarks: theoryQuestions.reduce((sum, q) => sum + q.marks, 0)
        }
      },
      status: 'Published', // Published immediately since teachers create questions directly
      useQuestionBank: useQuestionBank || false,
      questionBankSelection: useQuestionBank ? questionBankSelection : undefined
    };

    const exam = new Exam(examData);
    await exam.save();
    await exam.populate('subject class teacher');

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: {
        exam,
        examCode,
        message: `Exam code ${examCode} has been generated. Share this with your students to access the exam.`
      }
    });

  } catch (error) {
    console.error('Create exam error:', error);
    
    // Handle duplicate exam code error
    if (error.code === 11000 && error.keyPattern?.examCode) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate unique exam code. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating exam'
    });
  }
});

// @desc    Get teacher's exams
// @route   GET /api/teacher/exams
// @access  Private/Teacher
router.get('/exams', async (req, res) => {
  try {
    const { status, subject, class: classId, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { teacher: req.user._id, isActive: true };
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (classId) query.class = classId;

    const exams = await Exam.find(query)
      .populate('subject class questions')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Exam.countDocuments(query);

    res.json({
      success: true,
      data: {
        exams
      },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
      }
    });

  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting exams'
    });
  }
});

// @desc    Get single exam by ID
// @route   GET /api/teacher/exams/:id
// @access  Private/Teacher
router.get('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    }).populate('subject class');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to view it'
      });
    }

    res.json({
      success: true,
      data: {
        exam
      }
    });

  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting exam'
    });
  }
});

// @desc    Update exam
// @route   PUT /api/teacher/exams/:id
// @access  Private/Teacher
router.put('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to edit it'
      });
    }

    // Prevent editing if exam is active or completed
    if (['Active', 'Completed'].includes(exam.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit active or completed exams'
      });
    }

    const {
      title,
      description,
      duration,
      totalMarks,
      passingMarks,
      startTime,
      endTime,
      instructions,
      settings,
      questions,
      examType
    } = req.body;

    // Validate questions if provided
    if (questions && questions.length > 0) {
      const objectiveQuestions = questions.filter(q => q.questionType === 'Objective');
      const theoryQuestions = questions.filter(q => q.questionType === 'Theory');

      // Validate question types based on exam type
      if (examType === 'Objective' && theoryQuestions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Objectives-only exam cannot contain theory questions'
        });
      }

      if (examType === 'Theory' && objectiveQuestions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Theory-only exam cannot contain objective questions'
        });
      }

      // Update embedded questions
      exam.embeddedQuestions = questions.map((q, index) => ({
        questionNumber: index + 1,
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        marks: q.marks,
        options: q.questionType === 'Objective' ? q.options.filter(opt => opt && opt.trim() !== '') : [],
        correctAnswer: q.questionType === 'Objective' ? q.correctAnswer : undefined,
        explanation: q.explanation || '',
        additionalInfo: q.additionalInfo || ''
      }));

      // Update question counts and types
      exam.questionCount = questions.length;
      exam.questionTypes = {
        objective: {
          count: objectiveQuestions.length,
          totalMarks: objectiveQuestions.reduce((sum, q) => sum + q.marks, 0)
        },
        theory: {
          count: theoryQuestions.length,
          totalMarks: theoryQuestions.reduce((sum, q) => sum + q.marks, 0)
        }
      };
    }

    // Update other fields
    if (title) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (duration) exam.duration = duration;
    if (totalMarks) exam.totalMarks = totalMarks;
    if (passingMarks !== undefined) exam.passingMarks = passingMarks;
    if (startTime) exam.startTime = new Date(startTime);
    if (endTime) exam.endTime = new Date(endTime);
    if (instructions !== undefined) exam.instructions = instructions;
    if (examType) exam.examType = examType;
    if (settings) exam.settings = { ...exam.settings, ...settings };

    await exam.save();
    await exam.populate('subject class');

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: {
        exam
      }
    });

  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating exam'
    });
  }
});

// @desc    Delete exam
// @route   DELETE /api/teacher/exams/:id
// @access  Private/Teacher
router.delete('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to delete it'
      });
    }

    // Prevent deleting if exam has attempts
    if (exam.attempts && exam.attempts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete exam that has student attempts'
      });
    }

    // Soft delete by setting isActive to false
    exam.isActive = false;
    await exam.save();

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });

  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting exam'
    });
  }
});

// @desc    Add questions to exam
// @route   POST /api/teacher/exams/:id/questions
// @access  Private/Teacher
router.post('/exams/:id/questions', [
  body('questionIds').isArray().withMessage('Question IDs must be an array'),
  body('questionIds.*').isMongoId().withMessage('Invalid question ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to edit it'
      });
    }

    const { questionIds } = req.body;

    // Verify all questions belong to the teacher and match exam subject/class
    const questions = await Question.find({
      _id: { $in: questionIds },
      teacher: req.user._id,
      subject: exam.subject,
      class: exam.class,
      isActive: true
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some questions are invalid or do not match exam criteria'
      });
    }

    // Add questions to exam (avoid duplicates)
    const existingQuestionIds = exam.questions.map(id => id.toString());
    const newQuestionIds = questionIds.filter(id => !existingQuestionIds.includes(id));
    
    exam.questions.push(...newQuestionIds);

    // Update total marks and question counts
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const objectiveCount = questions.filter(q => q.questionType === 'Objective').length;
    const theoryCount = questions.filter(q => q.questionType === 'Theory').length;

    exam.totalMarks += totalMarks;
    exam.questionTypes.objective.count += objectiveCount;
    exam.questionTypes.theory.count += theoryCount;

    await exam.save();
    await exam.populate('questions');

    res.json({
      success: true,
      message: 'Questions added to exam successfully',
      data: {
        exam
      }
    });

  } catch (error) {
    console.error('Add questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding questions to exam'
    });
  }
});

// @desc    Get exam results for grading
// @route   GET /api/teacher/exams/:id/results
// @access  Private/Teacher
router.get('/exams/:id/results', async (req, res) => {
  try {
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    }).populate('attempts.student', 'firstName lastName studentId email')
    .populate('questions'); // Also populate legacy questions if they exist

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to view it'
      });
    }

    // Filter completed attempts and format them properly
    const completedAttempts = exam.attempts.filter(attempt => attempt.isCompleted);

    // Get all exam questions first
    let allExamQuestions = [];
    if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
      allExamQuestions = exam.embeddedQuestions;
    } else if (exam.questions && exam.questions.length > 0) {
      allExamQuestions = exam.questions;
    }

    // Format attempts for the frontend
    const formattedAttempts = completedAttempts.map(attempt => {
      // Create a complete list of answers including unanswered questions
      const formattedAnswers = [];
      

      // First, add all answered questions
      attempt.answers.forEach(answer => {
        let question = null;
        
        // Find the question from embedded questions or legacy questions
        if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
          question = allExamQuestions.find(q => 
            q._id?.toString() === answer.questionId?.toString() || 
            q.questionNumber === answer.questionNumber ||
            (answer.questionId && answer.questionId.includes('embedded_') && 
             answer.questionId === `embedded_${q.questionNumber}`)
          );
        } else if (exam.questions && exam.questions.length > 0) {
          question = allExamQuestions.find(q => q._id?.toString() === answer.questionId?.toString());
        }

        formattedAnswers.push({
          questionId: answer.questionId,
          questionNumber: answer.questionNumber,
          questionType: answer.questionType || question?.questionType,
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          marksObtained: answer.marksObtained || 0,
          timeSpent: answer.timeSpent,
          needsGrading: answer.needsGrading || (question?.questionType === 'Theory'),
          gradedBy: answer.gradedBy,
          gradedAt: answer.gradedAt,
          question: question ? {
            questionText: question.questionText,
            questionType: question.questionType,
            marks: question.marks,
            options: question.options || [],
            correctAnswer: question.correctAnswer,
            explanation: question.explanation
          } : {
            questionText: `Question ${answer.questionNumber}`,
            questionType: answer.questionType || 'Unknown',
            marks: 1,
            options: [],
            correctAnswer: null,
            explanation: null
          }
        });
      });

      // Then, add any unanswered questions
      allExamQuestions.forEach((question, index) => {
        const existingAnswer = formattedAnswers.find(ans => 
          ans.questionNumber === question.questionNumber ||
          ans.questionId === question._id?.toString() ||
          ans.questionId === `embedded_${question.questionNumber}`
        );
        
        if (!existingAnswer) {
          formattedAnswers.push({
            questionId: question._id?.toString() || `embedded_${question.questionNumber}`,
            questionNumber: question.questionNumber || (index + 1),
            questionType: question.questionType,
            answer: null,
            isCorrect: false,
            marksObtained: 0,
            timeSpent: 0,
            needsGrading: question.questionType === 'Theory',
            gradedBy: null,
            gradedAt: null,
            question: {
              questionText: question.questionText,
              questionType: question.questionType,
              marks: question.marks,
              options: question.options || [],
              correctAnswer: question.correctAnswer,
              explanation: question.explanation
            }
          });
        }
      });

      // Sort answers by question number
      formattedAnswers.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

      // Calculate current total score (including both auto-graded and manually graded)
      const currentTotalScore = formattedAnswers.reduce((sum, answer) => sum + (answer.marksObtained || 0), 0);
      const currentPercentage = exam.totalMarks > 0 ? (currentTotalScore / exam.totalMarks) * 100 : 0;

      return {
        _id: attempt._id,
        student: attempt.student,
        score: currentTotalScore, // Show current calculated score
        actualScore: attempt.actualScore, // Store for reference
        totalScore: currentTotalScore, // For backward compatibility
        percentage: currentPercentage, // Show current calculated percentage
        actualPercentage: attempt.actualPercentage, // Store for reference
        submittedAt: attempt.submittedAt,
        timeSpent: attempt.timeSpent,
        gradingStatus: attempt.gradingStatus,
        resultsReleased: attempt.resultsReleased || false,
        isCompleted: attempt.isCompleted,
        answers: formattedAnswers
      };
    });

    // Calculate analytics from the current attempts
    const analytics = {
      totalAttempts: formattedAttempts.length,
      averageScore: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: 0,
      completedAttempts: formattedAttempts.filter(attempt => attempt.isCompleted).length,
      pendingGrading: formattedAttempts.filter(attempt => attempt.gradingStatus === 'Pending').length
    };

    if (formattedAttempts.length > 0) {
      const scores = formattedAttempts.map(attempt => attempt.percentage || 0);
      const passingPercentage = (exam.passingMarks / exam.totalMarks) * 100;
      
      analytics.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      analytics.highestScore = Math.max(...scores);
      analytics.lowestScore = Math.min(...scores);
      analytics.passRate = (scores.filter(score => score >= passingPercentage).length / scores.length) * 100;
    }

    res.json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          examCode: exam.examCode,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          examType: exam.examType,
          embeddedQuestions: exam.embeddedQuestions // Include questions for reference
        },
        attempts: formattedAttempts,
        analytics: analytics
      }
    });

  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting exam results'
    });
  }
});

// @desc    Release exam results to students
// @route   POST /api/teacher/exams/:id/release-results
// @access  Private/Teacher
router.post('/exams/:id/release-results', async (req, res) => {
  try {
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to access it'
      });
    }

    // Note: Teachers can release results even with pending grading
    // Students with pending grading will see "Pending" status until graded

    // Update all completed attempts to show actual scores
    exam.attempts.forEach(attempt => {
      if (attempt.isCompleted) {
        // Restore actual scores
        if (attempt.actualScore !== undefined) {
          attempt.score = attempt.actualScore;
        }
        if (attempt.actualPercentage !== undefined) {
          attempt.percentage = attempt.actualPercentage;
        }
        attempt.gradingStatus = 'Completed';
        attempt.resultsReleased = true;
        attempt.resultsReleasedAt = new Date();
      }
    });

    await exam.save();

    res.json({
      success: true,
      message: 'Results released successfully. Students can now view their scores.'
    });

  } catch (error) {
    console.error('Release results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error releasing results'
    });
  }
});

// @desc    Unrelease exam results from students
// @route   POST /api/teacher/exams/:id/unrelease-results
// @access  Private/Teacher
router.post('/exams/:id/unrelease-results', async (req, res) => {
  try {
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to access it'
      });
    }

    // Update all completed attempts to hide scores from students
    exam.attempts.forEach(attempt => {
      if (attempt.isCompleted) {
        // Hide scores from students by setting resultsReleased to false
        attempt.resultsReleased = false;
        attempt.resultsUnreleasedAt = new Date();
        
        // Keep the actual scores intact for teacher reference
        // but students won't be able to see them
      }
    });

    await exam.save();

    res.json({
      success: true,
      message: 'Results unreleased successfully. Students can no longer view their scores.'
    });

  } catch (error) {
    console.error('Unrelease results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unreleasing results'
    });
  }
});

// @desc    Grade individual student answers
// @route   POST /api/teacher/exams/:id/grade-student
// @access  Private/Teacher
router.post('/exams/:id/grade-student', [
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('grades').isArray().withMessage('Grades must be an array'),
  body('grades.*.questionNumber').isInt({ min: 1 }).withMessage('Valid question number is required'),
  body('grades.*.marksObtained').isFloat({ min: 0 }).withMessage('Valid marks is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { studentId, grades } = req.body;
    
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to access it'
      });
    }

    // Find student's attempt
    const attempt = exam.attempts.find(att => 
      att.student.toString() === studentId.toString() && att.isCompleted
    );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Student attempt not found'
      });
    }

    // Update grades for each answer
    let totalScore = 0;
    grades.forEach(grade => {
      const answerIndex = attempt.answers.findIndex(ans => 
        ans.questionNumber === grade.questionNumber
      );
      
      if (answerIndex >= 0) {
        attempt.answers[answerIndex].marksObtained = grade.marksObtained;
        attempt.answers[answerIndex].isCorrect = grade.marksObtained > 0;
        attempt.answers[answerIndex].needsGrading = false;
        attempt.answers[answerIndex].gradedBy = req.user._id;
        attempt.answers[answerIndex].gradedAt = new Date();
      }
    });

    // Recalculate total score
    attempt.answers.forEach(answer => {
      totalScore += answer.marksObtained || 0;
    });

    // Store actual scores (will be revealed when results are released)
    attempt.actualScore = totalScore;
    attempt.actualPercentage = exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0;
    
    // Check if all answers have been graded
    const needsGrading = attempt.answers.some(answer => answer.needsGrading);
    if (!needsGrading) {
      attempt.gradingStatus = 'Completed';
    }

    await exam.save();

    res.json({
      success: true,
      message: 'Student answers graded successfully',
      data: {
        totalScore,
        percentage: attempt.actualPercentage,
        gradingStatus: attempt.gradingStatus
      }
    });

  } catch (error) {
    console.error('Grade student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error grading student answers'
    });
  }
});

// @desc    Update individual question grade
// @route   PUT /api/teacher/exams/:id/grade-question
// @access  Private/Teacher
router.put('/exams/:id/grade-question', [
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('questionNumber').isInt({ min: 1 }).withMessage('Valid question number is required'),
  body('marksObtained').isFloat({ min: 0 }).withMessage('Valid marks is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { studentId, questionNumber, marksObtained } = req.body;
    
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you do not have permission to access it'
      });
    }

    // Find student's attempt
    const attempt = exam.attempts.find(att => 
      att.student.toString() === studentId.toString() && att.isCompleted
    );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Student attempt not found'
      });
    }

    // Find the specific answer to update
    const answerIndex = attempt.answers.findIndex(ans => 
      ans.questionNumber === questionNumber
    );

    if (answerIndex < 0) {
      return res.status(404).json({
        success: false,
        message: 'Question answer not found'
      });
    }

    // Find the question to validate max marks
    const question = exam.embeddedQuestions.find(q => q.questionNumber === questionNumber);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in exam'
      });
    }

    // Validate marks don't exceed question's max marks
    if (marksObtained > question.marks) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed ${question.marks} for this question`
      });
    }

    // Update the specific answer
    attempt.answers[answerIndex].marksObtained = marksObtained;
    attempt.answers[answerIndex].isCorrect = marksObtained > 0;
    attempt.answers[answerIndex].needsGrading = false;
    attempt.answers[answerIndex].gradedBy = req.user._id;
    attempt.answers[answerIndex].gradedAt = new Date();

    // Recalculate total score
    let totalScore = 0;
    attempt.answers.forEach(answer => {
      totalScore += answer.marksObtained || 0;
    });

    // Update stored scores
    attempt.actualScore = totalScore;
    attempt.actualPercentage = exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0;
    
    // Check if all answers have been graded
    const needsGrading = attempt.answers.some(answer => answer.needsGrading);
    if (!needsGrading) {
      attempt.gradingStatus = 'Completed';
    }

    await exam.save();

    res.json({
      success: true,
      message: 'Question grade updated successfully',
      data: {
        questionNumber,
        marksObtained,
        totalScore,
        percentage: attempt.actualPercentage,
        gradingStatus: attempt.gradingStatus
      }
    });

  } catch (error) {
    console.error('Update question grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating question grade'
    });
  }
});

// @desc    Debug exam data
// @route   GET /api/teacher/exams/:id/debug
// @access  Private/Teacher
router.get('/exams/:id/debug', async (req, res) => {
  try {
    const exam = await Exam.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    }).populate('attempts.student', 'firstName lastName studentId email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Return complete exam data for debugging
    res.json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          embeddedQuestions: exam.embeddedQuestions,
          attempts: exam.attempts.map(attempt => ({
            _id: attempt._id,
            student: attempt.student,
            answers: attempt.answers,
            score: attempt.score,
            actualScore: attempt.actualScore,
            percentage: attempt.percentage,
            actualPercentage: attempt.actualPercentage,
            gradingStatus: attempt.gradingStatus,
            isCompleted: attempt.isCompleted
          }))
        }
      }
    });

  } catch (error) {
    console.error('Debug exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Preview random question selection
// @route   POST /api/teacher/preview-random-selection
// @access  Private/Teacher
router.post('/preview-random-selection', async (req, res) => {
  try {
    const { objective = {}, theory = {} } = req.body;

    let previewQuestions = { objective: [], theory: [] };

    // Handle objective questions
    if (objective.questions && objective.questions.length > 0 && objective.count > 0) {
      const objectiveQuestions = await Question.find({
        _id: { $in: objective.questions },
        teacher: req.user._id,
        isActive: true,
        questionType: 'Objective'
      }).populate('subject class');

      // Randomly select the requested number of questions
      const shuffled = objectiveQuestions.sort(() => 0.5 - Math.random());
      previewQuestions.objective = shuffled.slice(0, objective.count);
    }

    // Handle theory questions
    if (theory.questions && theory.questions.length > 0 && theory.count > 0) {
      const theoryQuestions = await Question.find({
        _id: { $in: theory.questions },
        teacher: req.user._id,
        isActive: true,
        questionType: 'Theory'
      }).populate('subject class');

      // Randomly select the requested number of questions
      const shuffled = theoryQuestions.sort(() => 0.5 - Math.random());
      previewQuestions.theory = shuffled.slice(0, theory.count);
    }

    res.json({
      success: true,
      data: previewQuestions
    });

  } catch (error) {
    console.error('Preview random selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating preview'
    });
  }
});

module.exports = router; 