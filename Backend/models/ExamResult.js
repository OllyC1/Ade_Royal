const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: String,
      required: function() {
        return this.questionType === 'objective';
      }
    },
    textAnswer: {
      type: String,
      required: function() {
        return this.questionType === 'theory';
      }
    },
    questionType: {
      type: String,
      enum: ['objective', 'theory'],
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    points: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true,
    default: 0
  },
  wrongAnswers: {
    type: Number,
    required: true,
    default: 0
  },
  unanswered: {
    type: Number,
    required: true,
    default: 0
  },
  timeSpent: {
    type: Number, // Total time spent in seconds
    required: true,
    default: 0
  },
  startedAt: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'auto-submitted', 'incomplete'],
    default: 'completed'
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    required: true
  },
  passed: {
    type: Boolean,
    required: true,
    default: false
  },
  feedback: {
    type: String
  },
  teacherRemarks: {
    type: String
  },
  isGraded: {
    type: Boolean,
    default: true
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
examResultSchema.index({ student: 1, exam: 1 }, { unique: true });
examResultSchema.index({ exam: 1 });
examResultSchema.index({ student: 1 });
examResultSchema.index({ submittedAt: -1 });
examResultSchema.index({ score: -1 });

// Virtual for percentage
examResultSchema.virtual('percentage').get(function() {
  return this.score;
});

// Method to calculate grade based on score
examResultSchema.methods.calculateGrade = function() {
  if (this.score >= 80) return 'A';
  if (this.score >= 70) return 'B';
  if (this.score >= 60) return 'C';
  if (this.score >= 50) return 'D';
  return 'F';
};

// Method to check if passed
examResultSchema.methods.checkPassed = function(passingScore = 50) {
  return this.score >= passingScore;
};

// Pre-save middleware to calculate grade and passed status
examResultSchema.pre('save', function(next) {
  this.grade = this.calculateGrade();
  this.passed = this.checkPassed();
  next();
});

// Static method to get student performance
examResultSchema.statics.getStudentPerformance = async function(studentId, options = {}) {
  const { subject, class: classId, startDate, endDate } = options;
  
  let matchQuery = { student: studentId };
  
  if (subject || classId || startDate || endDate) {
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'exams',
          localField: 'exam',
          foreignField: '_id',
          as: 'examInfo'
        }
      },
      { $unwind: '$examInfo' }
    ];
    
    if (subject) {
      pipeline.push({ $match: { 'examInfo.subject': subject } });
    }
    if (classId) {
      pipeline.push({ $match: { 'examInfo.class': classId } });
    }
    if (startDate || endDate) {
      let dateMatch = {};
      if (startDate) dateMatch.$gte = startDate;
      if (endDate) dateMatch.$lte = endDate;
      pipeline.push({ $match: { submittedAt: dateMatch } });
    }
    
    return this.aggregate(pipeline);
  }
  
  return this.find(matchQuery).populate('exam');
};

// Static method to get class performance
examResultSchema.statics.getClassPerformance = async function(classId, examId = null) {
  let matchQuery = {};
  
  const pipeline = [
    {
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examInfo'
      }
    },
    { $unwind: '$examInfo' },
    { $match: { 'examInfo.class': classId } }
  ];
  
  if (examId) {
    pipeline.push({ $match: { exam: examId } });
  }
  
  pipeline.push({
    $group: {
      _id: null,
      averageScore: { $avg: '$score' },
      highestScore: { $max: '$score' },
      lowestScore: { $min: '$score' },
      totalStudents: { $sum: 1 },
      passedStudents: {
        $sum: { $cond: [{ $gte: ['$score', 50] }, 1, 0] }
      }
    }
  });
  
  return this.aggregate(pipeline);
};

// Static method to get exam analytics
examResultSchema.statics.getExamAnalytics = async function(examId) {
  return this.aggregate([
    { $match: { exam: examId } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score' },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' },
        passRate: {
          $avg: { $cond: [{ $gte: ['$score', 50] }, 1, 0] }
        },
        averageTimeSpent: { $avg: '$timeSpent' }
      }
    }
  ]);
};

module.exports = mongoose.model('ExamResult', examResultSchema); 