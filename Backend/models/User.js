const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student'
  },
  studentId: {
    type: String,
    sparse: true,
    unique: true
  },
  teacherId: {
    type: String,
    sparse: true,
    unique: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: function() {
      return this.role === 'student';
    }
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    min: 0
  },
  dateOfJoining: {
    type: Date
  },
  parentContact: {
    name: String,
    phone: String,
    email: String
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  examSessions: [{
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam'
    },
    startTime: Date,
    endTime: Date,
    timeRemaining: Number,
    answers: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      answer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      timeSpent: Number
    }],
    score: Number,
    isCompleted: {
      type: Boolean,
      default: false
    },
    isSubmitted: {
      type: Boolean,
      default: false
    },
    submittedAt: Date
  }]
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ teacherId: 1 });
userSchema.index({ class: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to get user's active exam session
userSchema.methods.getActiveExamSession = function(examId) {
  return this.examSessions.find(session => 
    session.examId.toString() === examId.toString() && 
    !session.isCompleted
  );
};

// Method to update exam session
userSchema.methods.updateExamSession = function(examId, updateData) {
  const sessionIndex = this.examSessions.findIndex(session => 
    session.examId.toString() === examId.toString()
  );
  
  if (sessionIndex !== -1) {
    Object.assign(this.examSessions[sessionIndex], updateData);
  } else {
    this.examSessions.push({
      examId,
      ...updateData
    });
  }
  
  return this.save();
};

// Transform output
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 