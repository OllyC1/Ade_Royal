const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    minlength: [3, 'Question text must be at least 3 characters']
  },
  questionType: {
    type: String,
    enum: ['Objective', 'Theory'],
    required: [true, 'Question type is required']
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
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  marks: {
    type: Number,
    required: [true, 'Marks is required'],
    min: [0.5, 'Marks must be at least 0.5'],
    max: [20, 'Marks cannot exceed 20']
  },
  // For Objective Questions
  options: [{
    text: {
      type: String,
      required: function() {
        return this.questionType === 'Objective';
      },
      trim: true,
      maxlength: [500, 'Option text cannot exceed 500 characters']
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: String,
    required: function() {
      return this.questionType === 'Objective';
    },
    trim: true
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, 'Explanation cannot exceed 1000 characters']
  },
  // For Theory Questions
  expectedAnswer: {
    type: String,
    trim: true,
    maxlength: [5000, 'Expected answer cannot exceed 5000 characters']
  },
  keywords: [{
    type: String,
    trim: true
  }],
  // Media attachments
  image: {
    type: String,
    default: null
  },
  audio: {
    type: String,
    default: null
  },
  // Question metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  topic: {
    type: String,
    trim: true,
    maxlength: [100, 'Topic cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  // Question statistics
  statistics: {
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 },
    difficultyRating: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for better query performance
questionSchema.index({ subject: 1 });
questionSchema.index({ class: 1 });
questionSchema.index({ teacher: 1 });
questionSchema.index({ questionType: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ topic: 1 });

// Virtual for success rate
questionSchema.virtual('successRate').get(function() {
  if (this.statistics.totalAttempts === 0) return 0;
  return (this.statistics.correctAttempts / this.statistics.totalAttempts) * 100;
});

// Pre-save middleware for objective questions validation
questionSchema.pre('save', function(next) {
  if (this.questionType === 'Objective') {
    // Ensure at least 2 options
    if (this.options.length < 2) {
      return next(new Error('Objective questions must have at least 2 options'));
    }
    
    // Ensure at least one correct answer
    const correctOptions = this.options.filter(option => option.isCorrect);
    if (correctOptions.length === 0) {
      return next(new Error('Objective questions must have at least one correct answer'));
    }
    
    // Set correctAnswer to the text of the first correct option
    this.correctAnswer = correctOptions[0].text;
  }
  
  next();
});

// Method to check if answer is correct (for objective questions)
questionSchema.methods.checkAnswer = function(studentAnswer) {
  if (this.questionType === 'Objective') {
    return this.correctAnswer.toLowerCase().trim() === studentAnswer.toLowerCase().trim();
  }
  
  // For theory questions, manual grading is required
  return null;
};

// Method to update statistics
questionSchema.methods.updateStatistics = function(isCorrect, timeSpent) {
  this.statistics.totalAttempts += 1;
  if (isCorrect) {
    this.statistics.correctAttempts += 1;
  }
  
  // Update average time spent
  const totalTime = this.statistics.averageTimeSpent * (this.statistics.totalAttempts - 1) + timeSpent;
  this.statistics.averageTimeSpent = totalTime / this.statistics.totalAttempts;
  
  // Update usage count
  this.usageCount += 1;
  
  return this.save();
};

// Method to shuffle options (for objective questions)
questionSchema.methods.getShuffledOptions = function() {
  if (this.questionType !== 'Objective') return [];
  
  const shuffled = [...this.options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Static method to get questions by difficulty
questionSchema.statics.getByDifficulty = function(difficulty, subject, classId) {
  const query = { difficulty, isActive: true };
  if (subject) query.subject = subject;
  if (classId) query.class = classId;
  
  return this.find(query).populate('subject class teacher');
};

// Static method to get random questions
questionSchema.statics.getRandomQuestions = function(count, filters = {}) {
  const query = { isActive: true, ...filters };
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: count } },
    {
      $lookup: {
        from: 'subjects',
        localField: 'subject',
        foreignField: '_id',
        as: 'subject'
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: 'class',
        foreignField: '_id',
        as: 'class'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'teacher',
        foreignField: '_id',
        as: 'teacher'
      }
    }
  ]);
};

// Transform output
questionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    // Don't expose correct answer in API responses unless specifically requested
    if (ret.questionType === 'Objective' && !ret.showCorrectAnswer) {
      delete ret.correctAnswer;
      if (ret.options && Array.isArray(ret.options)) {
        ret.options = ret.options.map(option => ({
          text: option.text,
          _id: option._id
        }));
      }
    }
    return ret;
  }
});

module.exports = mongoose.model('Question', questionSchema); 