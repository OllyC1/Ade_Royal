const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { protect, studentOnly } = require('../middleware/auth');

const router = express.Router();

// Apply student protection to all routes
router.use(protect);
router.use(studentOnly);

// @desc    Get student dashboard
// @route   GET /api/student/dashboard
// @access  Private/Student
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get student with class info
    const student = await User.findById(studentId).populate('class');

    // Get available exams for student's class
    const availableExams = await Exam.find({
      class: student.class._id,
      status: 'Active',
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() },
      isActive: true
    }).populate('subject teacher');

    // Get student's exam history
    const examHistory = await Exam.find({
      'attempts.student': studentId
    }).populate('subject class');

    // Calculate statistics - only include released results
    const completedExams = examHistory.filter(exam => {
      const attempt = exam.attempts.find(att => 
        att.student.toString() === studentId.toString() && att.isCompleted
      );
      return attempt && attempt.resultsReleased && attempt.gradingStatus === 'Completed';
    });

    // Calculate average percentage instead of raw scores
    const totalPercentage = completedExams.reduce((sum, exam) => {
      const attempt = exam.attempts.find(att => 
        att.student.toString() === studentId.toString()
      );
      return sum + (attempt ? (attempt.actualPercentage || attempt.percentage || 0) : 0);
    }, 0);

    const averageScore = completedExams.length > 0 ? totalPercentage / completedExams.length : 0;

    // Get recent exam attempts with proper result filtering
    const recentAttempts = examHistory
      .map(exam => {
        const attempt = exam.attempts.find(att => 
          att.student.toString() === studentId.toString()
        );
        
        if (!attempt) return null;
        
        // Check if results have been released
        const resultsReleased = attempt.resultsReleased || false;
        const gradingStatus = attempt.gradingStatus || 'Pending';
        
        // Only show actual scores if results are released
        let displayAttempt = {
          ...attempt.toObject(),
          score: 0,
          percentage: 0,
          passed: null,
          gradingStatus: 'Pending'
        };

        if (resultsReleased && gradingStatus === 'Completed') {
          displayAttempt.score = attempt.actualScore || attempt.score || 0;
          displayAttempt.percentage = attempt.actualPercentage || attempt.percentage || 0;
          displayAttempt.passed = displayAttempt.score >= exam.passingMarks;
          displayAttempt.gradingStatus = 'Completed';
        } else {
          // Show PENDING status
          displayAttempt.score = 'PENDING';
          displayAttempt.percentage = 'PENDING';
          displayAttempt.passed = 'PENDING';
        }
        
        return { exam, attempt: displayAttempt };
      })
      .filter(item => item)
      .sort((a, b) => new Date(b.attempt.submittedAt) - new Date(a.attempt.submittedAt))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        overview: {
          availableExams: availableExams.length,
          completedExams: completedExams.length,
          averageScore: Math.round(averageScore * 100) / 100,
          totalExams: examHistory.length
        },
        availableExams,
        recentAttempts,
        student: {
          name: student.fullName,
          class: student.class.name,
          studentId: student.studentId
        }
      }
    });

  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard data'
    });
  }
});

// @desc    Join exam with exam code
// @route   POST /api/student/join-exam
// @access  Private/Student
router.post('/join-exam', [
  body('examCode').trim().isLength({ min: 6 }).withMessage('Valid exam code is required')
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

    const { examCode } = req.body;
    const studentId = req.user._id;

    // Find exam by code
    const exam = await Exam.findOne({ 
      examCode: examCode.toUpperCase(),
      isActive: true 
    }).populate('subject class teacher');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Invalid exam code'
      });
    }

    // Check if exam is currently active (within start and end time)
    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) {
      return res.status(403).json({
        success: false,
        message: 'Exam is not available at this time'
      });
    }

    // Check if student belongs to the exam's class
    const student = await User.findById(studentId).populate('class');
    if (student.class._id.toString() !== exam.class._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in the class for this exam'
      });
    }

    // Check if student has already completed the exam
    const existingAttempt = exam.attempts.find(attempt => 
      attempt.student.toString() === studentId.toString() && !attempt.isCompleted
    );
    
    const completedAttempts = exam.attempts.filter(attempt => 
      attempt.student.toString() === studentId.toString() && attempt.isCompleted
    );
    
    // Block retakes if not allowed and student has already completed
    if (completedAttempts.length > 0 && !exam.allowRetakes) {
      const latestAttempt = completedAttempts[completedAttempts.length - 1];
      return res.status(400).json({
        success: false,
        message: 'You have already completed this exam. Contact your teacher if you need to retake it.',
        canRetake: false,
        existingScore: latestAttempt.actualScore || latestAttempt.score,
        submittedAt: latestAttempt.submittedAt
      });
    }

    // Prepare questions for student (hide correct answers and sensitive info)
    let examQuestions = [];
    
    if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
      // Use embedded questions (new structure)
      examQuestions = exam.embeddedQuestions.map(question => ({
        _id: question._id || `embedded_${question.questionNumber}`,
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        questionType: question.questionType,
        marks: question.marks,
        options: question.questionType === 'Objective' ? question.options : [],
        additionalInfo: question.additionalInfo || ''
        // Hide correctAnswer, explanation for student
      }));
    } else if (exam.questions && exam.questions.length > 0) {
      // Legacy question bank structure (for backward compatibility)
      await exam.populate('questions');
      examQuestions = exam.questions.map(question => {
        const questionObj = question.toJSON();
        if (question.questionType === 'Objective') {
          questionObj.options = question.options.map(option => ({
            _id: option._id,
            text: option.text
          }));
          delete questionObj.correctAnswer;
        }
        delete questionObj.expectedAnswer;
        return questionObj;
      });
    }

    if (examQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This exam has no questions'
      });
    }

    // Shuffle questions if enabled
    if (exam.settings.shuffleQuestions) {
      for (let i = examQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [examQuestions[i], examQuestions[j]] = [examQuestions[j], examQuestions[i]];
      }
    }

    // Shuffle options if enabled
    // DISABLED: Option shuffling removed due to grading issues
    // if (exam.settings.shuffleOptions) {
    //   examQuestions.forEach(question => {
    //     if (question.questionType === 'Objective' && question.options && question.options.length > 0) {
    //       // Option shuffling logic removed
    //     }
    //   });
    // }

    res.json({
      success: true,
      message: 'Successfully joined exam',
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          examCode: exam.examCode,
          subject: exam.subject,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          instructions: exam.instructions,
          settings: exam.settings,
          questionCount: examQuestions.length,
          examType: exam.examType,
          questionTypes: exam.questionTypes
        },
        questions: examQuestions,
        canResume: existingAttempt && !existingAttempt.isCompleted,
        resumeData: existingAttempt ? {
          startTime: existingAttempt.startTime,
          answers: existingAttempt.answers,
          timeSpent: existingAttempt.timeSpent || 0
        } : null
      }
    });

  } catch (error) {
    console.error('Join exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error joining exam'
    });
  }
});

// @desc    Start exam attempt
// @route   POST /api/student/exams/:examId/start
// @access  Private/Student
router.post('/exams/:examId/start', async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if exam is currently active
    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) {
      return res.status(403).json({
        success: false,
        message: 'Exam is not available at this time'
      });
    }

    // Additional class validation for start exam endpoint
    const student = await User.findById(studentId).populate('class');
    if (student.class._id.toString() !== exam.class._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in the class for this exam'
      });
    }

    // Find active (incomplete) attempt for this student
    let existingAttempt = exam.attempts.find(attempt => 
      attempt.student.toString() === studentId.toString() && !attempt.isCompleted
    );

    const completedAttempts = exam.attempts.filter(attempt => 
      attempt.student.toString() === studentId.toString() && attempt.isCompleted
    );

    // Block retakes if not allowed and student has already completed
    if (completedAttempts.length > 0 && !exam.allowRetakes) {
      const latestAttempt = completedAttempts[completedAttempts.length - 1];
      return res.status(400).json({
        success: false,
        message: 'You have already completed this exam. Contact your teacher if you need to retake it.',
        canRetake: false,
        existingScore: latestAttempt.actualScore || latestAttempt.score,
        submittedAt: latestAttempt.submittedAt
      });
    }

    if (!existingAttempt) {
      // Create new attempt
      existingAttempt = {
        student: studentId,
        startTime: now,
        answers: [],
        isCompleted: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      exam.attempts.push(existingAttempt);
    }

    // Calculate remaining time
    const elapsedTime = existingAttempt.timeSpent || 0;
    const totalDuration = exam.duration * 60; // Convert to seconds
    const remainingTime = Math.max(0, totalDuration - elapsedTime);

    if (remainingTime <= 0) {
      // Time has expired, auto-submit if not already done
      if (!existingAttempt.isCompleted) {
        await autoSubmitExam(exam, existingAttempt, studentId);
      }
      return res.status(400).json({
        success: false,
        message: 'Exam time has expired'
      });
    }

    await exam.save();

    res.json({
      success: true,
      data: {
        attemptId: existingAttempt._id,
        remainingTime,
        answers: existingAttempt.answers,
        timeSpent: existingAttempt.timeSpent || 0
      }
    });

  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting exam'
    });
  }
});

// @desc    Save answer for a question
// @route   POST /api/student/exams/:examId/answer
// @access  Private/Student
router.post('/exams/:examId/answer', [
  body('questionId').notEmpty().withMessage('Question ID is required'),
  body('answer').custom((value, { req }) => {
    // Allow empty answers for theory questions, but require non-empty for objective
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty answers (theory questions can be saved with empty initial state)
    }
    return true;
  })
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

    const { examId } = req.params;
    const { questionId, answer, timeSpent } = req.body;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Find student's attempt
    const attempt = exam.attempts.find(att => 
      att.student.toString() === studentId.toString()
    );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    if (attempt.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Exam has already been completed'
      });
    }

    // Find the question to get the correct question number
    let questionNumber = null;
    if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
      const question = exam.embeddedQuestions.find(q => 
        q._id?.toString() === questionId.toString() || 
        questionId.includes('embedded_') && questionId === `embedded_${q.questionNumber}`
      );
      questionNumber = question ? question.questionNumber : null;
    } else if (exam.questions && exam.questions.length > 0) {
      await exam.populate('questions');
      const question = exam.questions.find(q => q._id?.toString() === questionId.toString());
      questionNumber = question ? question.questionNumber : null;
    }

    // If we can't find the question number, extract it from questionId if it's in embedded format
    if (!questionNumber && questionId.includes('embedded_')) {
      const match = questionId.match(/embedded_(\d+)/);
      if (match) {
        questionNumber = parseInt(match[1]);
      }
    }

    // Update or add answer - match by questionId OR questionNumber
    const existingAnswerIndex = attempt.answers.findIndex(ans => 
      (ans.questionId && ans.questionId.toString() === questionId.toString()) ||
      (ans.questionNumber && questionNumber && ans.questionNumber === questionNumber)
    );

    // Fallback to index-based numbering if still no question number
    if (!questionNumber) {
      questionNumber = existingAnswerIndex >= 0 ? attempt.answers[existingAnswerIndex].questionNumber : attempt.answers.length + 1;
    }

    const answerData = {
      questionId,
      questionNumber: questionNumber,
      answer,
      timeSpent: timeSpent || 0,
      answeredAt: new Date()
    };

    console.log('Saving answer:', answerData);

    if (existingAnswerIndex >= 0) {
      attempt.answers[existingAnswerIndex] = answerData;
    } else {
      attempt.answers.push(answerData);
    }

    // Update total time spent
    if (timeSpent) {
      attempt.timeSpent = (attempt.timeSpent || 0) + timeSpent;
    }

    await exam.save();

    res.json({
      success: true,
      message: 'Answer saved successfully'
    });

  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving answer'
    });
  }
});

// @desc    Submit exam
// @route   POST /api/student/exams/:examId/submit
// @access  Private/Student
router.post('/exams/:examId/submit', async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Find student's attempt
    const attempt = exam.attempts.find(att => 
      att.student.toString() === studentId.toString()
    );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    if (attempt.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Exam has already been submitted'
      });
    }

    // Calculate final score and grade the exam
    const gradingResult = await gradeExamAttempt(exam, attempt);

    // Mark as completed but hide scores until results are released
    attempt.isCompleted = true;
    attempt.submittedAt = new Date();
    attempt.score = 0; // Don't show actual score until released
    attempt.percentage = 0; // Don't show actual percentage until released
    attempt.gradingStatus = gradingResult.gradingStatus;
    
    // Store actual scores for teacher use (hidden from student)
    attempt.actualScore = gradingResult.actualScore || gradingResult.totalScore;
    attempt.actualPercentage = gradingResult.actualPercentage || gradingResult.percentage;
    
    // Check if any theory questions need grading
    const hasTheoryQuestions = gradingResult.gradedAnswers.some(ans => ans.needsGrading);
    attempt.needsGrading = hasTheoryQuestions;

    // Update answers with grading results
    attempt.answers = gradingResult.gradedAnswers;

    await exam.save();

    // Send notification to teacher
    try {
      const notificationService = req.app.locals.notificationService;
      if (notificationService) {
        await notificationService.notifyExamSubmitted({
          studentId: req.user._id,
          teacherId: exam.teacher,
          examId: exam._id,
          examTitle: exam.title,
          studentName: `${req.user.firstName} ${req.user.lastName}`
        });
      }
    } catch (notificationError) {
      console.error('Error sending submission notification:', notificationError);
      // Don't fail the submission if notification fails
    }

    // Only show basic submission confirmation - no scores or grades
    let responseData = {
      submitted: true,
      totalQuestions: gradingResult.totalQuestions,
      answeredQuestions: gradingResult.answeredQuestions,
      message: 'Exam submitted successfully. Results will be available after teacher review.'
    };

    // Never show results immediately after submission - teacher must release them
    // if (exam.settings.showResults) {
    //   responseData = {
    //     ...responseData,
    //     score: attempt.score,
    //     totalMarks: exam.totalMarks,
    //     percentage: attempt.percentage,
    //     passed: attempt.percentage >= (exam.passingMarks / exam.totalMarks * 100),
    //     gradingStatus: attempt.gradingStatus,
    //     breakdown: gradingResult.breakdown
    //   };
    // }

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting exam'
    });
  }
});

// @desc    Get exam attempt results
// @route   GET /api/student/exams/:examId/results
// @access  Private/Student
router.get('/exams/:examId/results', async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId).populate('subject questions');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Find student's attempt
    const attempt = exam.attempts.find(att => 
      att.student.toString() === studentId.toString()
    );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No exam attempt found'
      });
    }

    if (!attempt.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Exam has not been completed yet'
      });
    }

    // Check if results should be shown
    if (!exam.settings.showResults) {
      return res.status(403).json({
        success: false,
        message: 'Results are not available for this exam'
      });
    }

    // Check if results have been released by teacher
    const resultsReleased = attempt.resultsReleased || false;
    const gradingStatus = attempt.gradingStatus || 'Pending';
    
    console.log('Debug ViewResults:', {
      examId,
      studentId,
      attemptFound: !!attempt,
      isCompleted: attempt.isCompleted,
      resultsReleased,
      gradingStatus,
      showResults: exam.settings.showResults,
      embeddedQuestionsCount: exam.embeddedQuestions?.length || 0,
      regularQuestionsCount: exam.questions?.length || 0
    });

    // Only show actual scores if results are released
    let displayScore = 0;
    let displayPercentage = 0;
    let displayStatus = 'Pending';

    if (resultsReleased && gradingStatus === 'Completed') {
      displayScore = attempt.score || 0;
      displayPercentage = attempt.percentage || 0;
      displayStatus = 'Completed';
    } else {
      displayStatus = gradingStatus;
    }

    // Get question details for enhanced display
    let questionsWithDetails = [];
    if (resultsReleased) {
      // Try embeddedQuestions first (newer exams), then fall back to populated questions (older exams)
      if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
        questionsWithDetails = exam.embeddedQuestions.map(question => ({
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          questionType: question.questionType,
          marks: question.marks,
          options: question.questionType === 'Objective' ? question.options : [],
          correctAnswer: question.questionType === 'Objective' ? question.correctAnswer : undefined
        }));
      } else if (exam.questions && exam.questions.length > 0) {
        // Fallback for older exams with separate Question documents
        questionsWithDetails = exam.questions.map((question, index) => ({
          questionNumber: index + 1,
          questionText: question.questionText,
          questionType: question.questionType,
          marks: question.marks,
          options: question.questionType === 'Objective' ? question.options : [],
          correctAnswer: question.questionType === 'Objective' ? question.correctAnswer : undefined
        }));
      }
    }

    // Enhance answers with question details
    const enhancedAnswers = resultsReleased ? attempt.answers.map(answer => {
      const questionDetails = questionsWithDetails.find(q => q.questionNumber === answer.questionNumber);
      
      let studentAnswerText = answer.answer;
      let correctAnswerText = null;
      
      if (questionDetails && questionDetails.questionType === 'Objective') {
        // For objective questions, convert answer index to actual option text
        if (questionDetails.options && questionDetails.options.length > 0) {
          if (typeof answer.answer === 'number' && questionDetails.options[answer.answer]) {
            studentAnswerText = questionDetails.options[answer.answer];
          }
          
          // Get correct answer text
          if (typeof questionDetails.correctAnswer === 'number' && questionDetails.options[questionDetails.correctAnswer]) {
            correctAnswerText = questionDetails.options[questionDetails.correctAnswer];
          }
        }
      }
      
      return {
        questionNumber: answer.questionNumber,
        questionText: questionDetails?.questionText || `Question ${answer.questionNumber}`,
        questionType: questionDetails?.questionType || answer.questionType || 'Unknown',
        marks: questionDetails?.marks || 1,
        studentAnswer: answer.answer,
        studentAnswerText: studentAnswerText,
        correctAnswer: questionDetails?.correctAnswer,
        correctAnswerText: correctAnswerText,
        isCorrect: answer.isCorrect,
        marksObtained: answer.marksObtained,
        timeSpent: answer.timeSpent,
        options: questionDetails?.options || []
      };
    }) : [];

    res.json({
      success: true,
      data: {
        exam: {
          title: exam.title,
          subject: exam.subject.name,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          duration: exam.duration
        },
        attempt: {
          score: displayScore,
          percentage: displayPercentage,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent,
          gradingStatus: displayStatus,
          resultsReleased: resultsReleased,
          passed: resultsReleased ? displayPercentage >= (exam.passingMarks / exam.totalMarks * 100) : null,
          message: resultsReleased ? null : 'Results are pending teacher review and will be available once released.'
        },
        answers: enhancedAnswers
      }
    });

  } catch (error) {
    console.error('Get exam results error:', error);
    console.error('Exam ID:', examId);
    console.error('Student ID:', studentId);
    res.status(500).json({
      success: false,
      message: 'Server error getting exam results'
    });
  }
});

// @desc    Get student's exam history
// @route   GET /api/student/exam-history
// @access  Private/Student
router.get('/exam-history', async (req, res) => {
  try {
    const studentId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Find exams where student has attempts
    const exams = await Exam.find({
      'attempts.student': studentId
    })
    .populate('subject class teacher')
    .sort({ 'attempts.submittedAt': -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Exam.countDocuments({
      'attempts.student': studentId
    });

    // Format exam history
    const examHistory = exams.map(exam => {
      const attempt = exam.getStudentAttempt(studentId);
      
      // Check if results have been released
      const resultsReleased = attempt.resultsReleased || false;
      const gradingStatus = attempt.gradingStatus || 'Pending';
      
      // Only show actual scores if results are released, otherwise show PENDING
      let displayScore = 'PENDING';
      let displayPercentage = 'PENDING';
      let passed = 'PENDING';

      if (resultsReleased && gradingStatus === 'Completed') {
        displayScore = attempt.actualScore || attempt.score || 0;
        displayPercentage = attempt.actualPercentage || attempt.percentage || 0;
        passed = displayScore >= exam.passingMarks;
      }

      return {
        exam: {
          _id: exam._id,
          title: exam.title,
          subject: exam.subject,
          class: exam.class,
          teacher: exam.teacher,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks
        },
        attempt: {
          score: displayScore,
          percentage: displayPercentage,
          passed: passed,
          submittedAt: attempt.submittedAt,
          isCompleted: attempt.isCompleted,
          gradingStatus: gradingStatus,
          resultsReleased: resultsReleased
        }
      };
    });

    res.json({
      success: true,
      data: {
        examHistory,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get exam history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting exam history'
    });
  }
});

// @desc    Reset exam attempt (for testing purposes or when retakes not allowed)
// @route   DELETE /api/student/exams/:examId/reset
// @access  Private/Student
router.delete('/exams/:examId/reset', async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Additional class validation
    const student = await User.findById(studentId).populate('class');
    if (student.class._id.toString() !== exam.class._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in the class for this exam'
      });
    }

    const completedAttempts = exam.attempts.filter(attempt => 
      attempt.student.toString() === studentId.toString() && attempt.isCompleted
    );

    // If exam allows retakes, don't reset - just inform that retakes are allowed
    if (exam.allowRetakes && completedAttempts.length > 0) {
      return res.json({
        success: true,
        message: 'This exam allows retakes. You can join the exam again to start a new attempt.',
        allowsRetakes: true,
        completedAttempts: completedAttempts.length
      });
    }

    // Remove student's attempts (for testing or when retakes not allowed)
    exam.attempts = exam.attempts.filter(attempt => 
      attempt.student.toString() !== studentId.toString()
    );

    await exam.save();

    res.json({
      success: true,
      message: 'Exam attempt reset successfully. You can now retake the exam.',
      allowsRetakes: false,
      removedAttempts: completedAttempts.length
    });

  } catch (error) {
    console.error('Reset exam attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting exam attempt'
    });
  }
});

// Helper function to auto-submit exam when time expires
const autoSubmitExam = async (exam, attempt, studentId) => {
  try {
    const gradingResult = await gradeExamAttempt(exam, attempt);

    attempt.isCompleted = true;
    attempt.submittedAt = new Date();
    attempt.score = gradingResult.totalScore;
    attempt.percentage = gradingResult.percentage;
    attempt.gradingStatus = gradingResult.gradingStatus;
    attempt.answers = gradingResult.gradedAnswers;

    await exam.save();
    
    console.log(`Auto-submitted exam ${exam._id} for student ${studentId}`);
  } catch (error) {
    console.error('Auto-submit failed:', error);
  }
};

// Helper function to grade exam attempt
const gradeExamAttempt = async (exam, attempt) => {
  let totalScore = 0;
  let objectiveScore = 0;
  let theoryScore = 0;
  let objectiveQuestions = 0;
  let theoryQuestions = 0;
  let gradingStatus = 'Pending'; // Always start as pending until teacher releases results

  const gradedAnswers = [];

  try {
    // Use embedded questions if available, otherwise fall back to legacy questions
    let examQuestions = [];
    if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
      examQuestions = exam.embeddedQuestions;
    } else if (exam.questions && exam.questions.length > 0) {
      await exam.populate('questions');
      examQuestions = exam.questions;
    }

    // If no questions found, return default result
    if (examQuestions.length === 0) {
      console.warn('No questions found for exam:', exam._id);
      return {
        totalScore: 0,
        percentage: 0,
        gradingStatus: 'Pending',
        gradedAnswers: [],
        totalQuestions: 0,
        answeredQuestions: 0,
        breakdown: {
          objective: { score: 0, questions: 0, maxMarks: 0 },
          theory: { score: 0, questions: 0, maxMarks: 0 }
        }
      };
    }

    // If no answers provided (student submitted blank exam)
    if (!attempt.answers || attempt.answers.length === 0) {
      console.log('No answers provided for exam:', exam._id);
      return {
        totalScore: 0,
        percentage: 0,
        gradingStatus: 'Pending',
        gradedAnswers: [],
        totalQuestions: examQuestions.length,
        answeredQuestions: 0,
        breakdown: {
          objective: {
            score: 0,
            questions: examQuestions.filter(q => q.questionType === 'Objective').length,
            maxMarks: examQuestions
              .filter(q => q.questionType === 'Objective')
              .reduce((sum, q) => sum + (q.marks || 0), 0)
          },
          theory: {
            score: 0,
            questions: examQuestions.filter(q => q.questionType === 'Theory').length,
            maxMarks: examQuestions
              .filter(q => q.questionType === 'Theory')
              .reduce((sum, q) => sum + (q.marks || 0), 0)
          }
        }
      };
    }

    // Grade each answer
    for (const answer of attempt.answers) {
      let question;
      
      console.log('Processing answer:', { 
        questionId: answer.questionId, 
        questionNumber: answer.questionNumber,
        answer: answer.answer 
      });
      
      // Find the question (handle both embedded and legacy structures)
      if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
        // For embedded questions, match by questionNumber primarily
        question = examQuestions.find(q => {
          // Try matching by questionNumber first (most reliable for embedded questions)
          if (q.questionNumber === answer.questionNumber) {
            return true;
          }
          // Fallback to ID matching if available
          if (q._id && answer.questionId && q._id.toString() === answer.questionId.toString()) {
            return true;
          }
          // Try matching by generated ID pattern
          if (answer.questionId && answer.questionId.includes('embedded_') && 
              answer.questionId === `embedded_${q.questionNumber}`) {
            return true;
          }
          return false;
        });
      } else {
        // For legacy questions, match by ID
        question = examQuestions.find(q => q._id?.toString() === answer.questionId?.toString());
      }

      if (!question) {
        console.warn('Question not found for answer:', {
          questionId: answer.questionId,
          questionNumber: answer.questionNumber,
          availableQuestions: examQuestions.map(q => ({ 
            id: q._id, 
            number: q.questionNumber, 
            type: q.questionType 
          }))
        });
        continue;
      }

      console.log('Found matching question:', {
        questionNumber: question.questionNumber,
        questionType: question.questionType,
        marks: question.marks
      });

      const gradedAnswer = {
        ...answer,
        questionType: question.questionType
      };

      if (question.questionType === 'Objective') {
        objectiveQuestions++;
        
        // Calculate score but don't show to student until teacher releases results
        const studentAnswer = parseInt(answer.answer);
        const correctAnswer = question.correctAnswer;
        const isCorrect = !isNaN(studentAnswer) && studentAnswer === correctAnswer;
        
        console.log('Grading objective question:', {
          questionNumber: question.questionNumber,
          studentAnswer,
          correctAnswer,
          isCorrect,
          marks: question.marks
        });
        
        gradedAnswer.isCorrect = isCorrect;
        gradedAnswer.marksObtained = isCorrect ? (question.marks || 0) : 0;
        gradedAnswer.needsGrading = false; // Objective questions are auto-graded
        
        objectiveScore += gradedAnswer.marksObtained;
        totalScore += gradedAnswer.marksObtained;
      } else if (question.questionType === 'Theory') {
        theoryQuestions++;
        
        console.log('Theory question found, needs manual grading');
        
        // Theory questions need manual grading
        gradedAnswer.isCorrect = null;
        gradedAnswer.marksObtained = 0; // Will be updated during manual grading
        gradedAnswer.needsGrading = true;
      }

      gradedAnswers.push(gradedAnswer);
    }

    // Don't calculate percentage - keep as 0 until teacher releases results
    const percentage = 0; // Will be calculated when teacher releases results

    console.log('Grading summary:', {
      totalScore,
      objectiveScore,
      theoryScore,
      objectiveQuestions,
      theoryQuestions,
      gradingStatus: 'Pending'
    });

    return {
      totalScore: 0, // Don't show actual score until teacher releases
      percentage: 0, // Don't show percentage until teacher releases
      gradingStatus: 'Pending',
      gradedAnswers,
      totalQuestions: examQuestions.length,
      answeredQuestions: attempt.answers.length,
      actualScore: totalScore, // Store actual score for teacher use
      actualPercentage: exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0,
      breakdown: {
        objective: {
          score: objectiveScore,
          questions: objectiveQuestions,
          maxMarks: examQuestions
            .filter(q => q.questionType === 'Objective')
            .reduce((sum, q) => sum + (q.marks || 0), 0)
        },
        theory: {
          score: theoryScore,
          questions: theoryQuestions,
          maxMarks: examQuestions
            .filter(q => q.questionType === 'Theory')
            .reduce((sum, q) => sum + (q.marks || 0), 0)
        }
      }
    };
  } catch (error) {
    console.error('Error in gradeExamAttempt:', error);
    throw error;
  }
};

module.exports = router; 