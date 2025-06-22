const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Exam title cannot exceed 200 characters']
  },
  examCode: {
    type: String,
    required: [true, 'Exam code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [6, 'Exam code must be at least 6 characters'],
    maxlength: [12, 'Exam code cannot exceed 12 characters']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Exam duration is required'],
    min: [5, 'Exam duration must be at least 5 minutes'],
    max: [300, 'Exam duration cannot exceed 300 minutes']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks cannot be negative']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  instructions: {
    type: String,
    trim: true,
    default: 'Read all questions carefully before answering. Choose the best answer for objective questions.'
  },
  // Legacy field for backward compatibility (keep existing exams working)
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  // New embedded questions for direct question creation
  embeddedQuestions: [{
    questionNumber: {
      type: Number,
      required: true
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [4, 'Question text must be at least 4 characters']
    },
    questionType: {
      type: String,
      enum: ['Objective', 'Theory'],
      required: [true, 'Question type is required']
    },
    marks: {
      type: Number,
      required: [true, 'Question marks is required'],
      min: [1, 'Question marks must be at least 1'],
      max: [20, 'Question marks cannot exceed 20']
    },
    options: [{
      type: String,
      trim: true
    }],
    correctAnswer: {
      type: Number,
      min: 0
    },
    explanation: {
      type: String,
      trim: true
    },
    additionalInfo: {
      type: String,
      trim: true
    }
  }],
  questionCount: {
    type: Number,
    default: 0
  },
  allowedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  examType: {
    type: String,
    enum: ['Objective', 'Theory', 'Mixed'],
    default: 'Mixed'
  },
  questionTypes: {
    objective: {
      count: { type: Number, default: 0 },
      totalMarks: { type: Number, default: 0 }
    },
    theory: {
      count: { type: Number, default: 0 },
      totalMarks: { type: Number, default: 0 }
    }
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    preventCheating: {
      type: Boolean,
      default: true
    },
    fullScreenMode: {
      type: Boolean,
      default: false
    },
    autoSubmit: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Active', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowRetakes: {
    type: Boolean,
    default: false,
    comment: 'Allow students to retake the exam after completion'
  },
  attempts: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startTime: Date,
    endTime: Date,
    timeSpent: Number,
    score: Number,
    percentage: Number,
    answers: [{
      questionNumber: Number,
      questionType: String,
      answer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      marksObtained: Number,
      timeSpent: Number,
      needsGrading: { type: Boolean, default: false },
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      gradedAt: { type: Date }
    }],
    isCompleted: {
      type: Boolean,
      default: false
    },
    submittedAt: Date,
    ipAddress: String,
    userAgent: String,
    gradingStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Completed'],
      default: 'Pending'
    },
    autoGradedMarks: { type: Number, default: 0 },
    manualGradedMarks: { type: Number, default: 0 },
    actualScore: { type: Number, default: 0 },
    actualPercentage: { type: Number, default: 0 },
    resultsReleased: { type: Boolean, default: false },
    resultsReleasedAt: { type: Date },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: { type: Date },
    needsGrading: { type: Boolean, default: false }
  }],
  // Question bank selection for random question generation
  useQuestionBank: {
    type: Boolean,
    default: false
  },
  questionBankSelection: {
    objective: {
      questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }],
      count: { type: Number, default: 0 }
    },
    theory: {
      questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }],
      count: { type: Number, default: 0 }
    }
  },
  analytics: {
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    lowestScore: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for better query performance
examSchema.index({ examCode: 1 });
examSchema.index({ subject: 1 });
examSchema.index({ class: 1 });
examSchema.index({ teacher: 1 });
examSchema.index({ status: 1 });
examSchema.index({ startTime: 1, endTime: 1 });

// Virtual for question count (for backward compatibility)
examSchema.virtual('questionCountVirtual').get(function() {
  return this.embeddedQuestions?.length || this.questions?.length || 0;
});

// Virtual for duration in hours and minutes
examSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

// Method to check if exam is currently active
examSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.status === 'Published' && 
         now >= this.startTime && 
         now <= this.endTime;
};

// Method to check if exam is available for a student
examSchema.methods.isAvailableForStudent = function(studentId) {
  if (!this.isCurrentlyActive()) return false;
  
  // If no specific students are allowed, it's available for all students in the class
  if (this.allowedStudents.length === 0) return true;
  
  return this.allowedStudents.some(id => id.toString() === studentId.toString());
};

// Method to add student attempt
examSchema.methods.addAttempt = function(attemptData) {
  this.attempts.push(attemptData);
  this.analytics.totalAttempts = this.attempts.length;
  
  // Update analytics
  const completedAttempts = this.attempts.filter(attempt => attempt.isCompleted);
  if (completedAttempts.length > 0) {
    const percentages = completedAttempts.map(attempt => attempt.percentage || 0);
    this.analytics.averageScore = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    this.analytics.highestScore = Math.max(...percentages);
    this.analytics.lowestScore = Math.min(...percentages);
    this.analytics.passRate = (completedAttempts.filter(attempt => 
      attempt.score >= this.passingMarks).length / completedAttempts.length) * 100;
  }
  
  return this.save();
};

// Method to get student's attempt
examSchema.methods.getStudentAttempt = function(studentId) {
  return this.attempts.find(attempt => 
    attempt.student.toString() === studentId.toString()
  );
};

// Static method to generate unique exam code
examSchema.statics.generateExamCode = async function() {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existingExam = await this.findOne({ examCode: code });
    if (!existingExam) {
      isUnique = true;
    }
  }
  
  return code;
};

// Pre-save middleware to validate dates
examSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    return next(new Error('End time must be after start time'));
  }
  
  if (this.passingMarks > this.totalMarks) {
    return next(new Error('Passing marks cannot exceed total marks'));
  }
  
  next();
});

// Transform output
examSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Exam', examSchema); 