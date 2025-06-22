const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    enum: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    default: () => {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      return `${currentYear}/${nextYear}`;
    },
    validate: {
      validator: function(v) {
        // Validate format like "2025/2026" or just "2025"
        return /^\d{4}(\/\d{4})?$/.test(v);
      },
      message: 'Academic year must be in format "YYYY" or "YYYY/YYYY"'
    }
  },
  maxStudents: {
    type: Number,
    default: 40,
    min: 1,
    max: 100
  }
}, {
  timestamps: true
});

// Index for performance
classSchema.index({ name: 1 });
classSchema.index({ academicYear: 1 });

// Virtual for class category
classSchema.virtual('category').get(function() {
  return ['JSS1', 'JSS2', 'JSS3'].includes(this.name) ? 'Junior' : 'Senior';
});

// Virtual for class level (for backward compatibility)
classSchema.virtual('level').get(function() {
  return this.name;
});

// Virtual for student count
classSchema.virtual('studentCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'class',
  count: true
});

// Method to add student to class
classSchema.methods.addStudent = function(studentId) {
  if (this.students.length >= this.maxStudents) {
    throw new Error('Class has reached maximum capacity');
  }
  
  if (!this.students.includes(studentId)) {
    this.students.push(studentId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove student from class
classSchema.methods.removeStudent = function(studentId) {
  this.students = this.students.filter(id => id.toString() !== studentId.toString());
  return this.save();
};

// Method to add subject to class
classSchema.methods.addSubject = function(subjectId) {
  if (!this.subjects.includes(subjectId)) {
    this.subjects.push(subjectId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to check if class is full
classSchema.methods.isFull = function() {
  return this.students.length >= this.maxStudents;
};

// Static method to get classes by category
classSchema.statics.getByCategory = function(category) {
  const classNames = category === 'Junior' 
    ? ['JSS1', 'JSS2', 'JSS3'] 
    : ['SS1', 'SS2', 'SS3'];
  
  return this.find({ name: { $in: classNames }, isActive: true })
    .populate('subjects students classTeacher');
};

// Static method to get available classes (not full)
classSchema.statics.getAvailable = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $addFields: {
        currentStudentCount: { $size: '$students' },
        isAvailable: { $lt: [{ $size: '$students' }, '$maxStudents'] }
      }
    },
    { $match: { isAvailable: true } }
  ]);
};

// Static method to initialize all Nigerian classes
classSchema.statics.initializeNigerianClasses = async function() {
  const classNames = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
  
  for (const className of classNames) {
    const existingClass = await this.findOne({ name: className });
    if (!existingClass) {
      await this.create({
        name: className,
        description: `${className} - ${['JSS1', 'JSS2', 'JSS3'].includes(className) ? 'Junior' : 'Senior'} Secondary School`,
        maxStudents: 40
      });
    }
  }
};

// Transform output
classSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Class', classSchema); 