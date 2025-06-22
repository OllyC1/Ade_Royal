const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Subject code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Nigerian school system categories
  level: {
    type: String,
    enum: ['Junior', 'Senior', 'Both'],
    required: true,
    default: 'Both'
  },
  // For Senior Secondary departments
  departments: [{
    type: String,
    enum: ['Science', 'Commercial', 'Arts', 'All']
  }],
  category: {
    type: String,
    enum: [
      'Core',           // Required for all students
      'Science',        // Science department subjects
      'Commercial',     // Commercial department subjects
      'Arts',          // Arts department subjects
      'Technical',     // Technical/Vocational subjects
      'Language',      // Language subjects
      'Religious',     // Religious studies
      'Creative',      // Arts, Music, etc.
      'Social',        // Social Studies, Government, etc.
      'Elective'       // Optional subjects
    ],
    default: 'Core'
  },
  isCore: {
    type: Boolean,
    default: true
  },
  // Nigerian school system specific
  isCompulsory: {
    type: Boolean,
    default: false
  },
  // Applicable class levels
  applicableLevels: [{
    type: String,
    enum: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  credits: {
    type: Number,
    default: 1,
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6']
  },
  passingScore: {
    type: Number,
    default: 40,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100']
  }
}, {
  timestamps: true
});

// Index for better query performance
subjectSchema.index({ name: 1 });
subjectSchema.index({ code: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ level: 1 });
subjectSchema.index({ departments: 1 });
subjectSchema.index({ classes: 1 });

// Virtual for exam count
subjectSchema.virtual('examCount', {
  ref: 'Exam',
  localField: '_id',
  foreignField: 'subject',
  count: true
});

// Method to add teacher to subject
subjectSchema.methods.addTeacher = function(teacherId) {
  if (!this.teachers.includes(teacherId)) {
    this.teachers.push(teacherId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove teacher from subject
subjectSchema.methods.removeTeacher = function(teacherId) {
  this.teachers = this.teachers.filter(id => id.toString() !== teacherId.toString());
  return this.save();
};

// Method to add class to subject
subjectSchema.methods.addClass = function(classId) {
  if (!this.classes.includes(classId)) {
    this.classes.push(classId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove class from subject
subjectSchema.methods.removeClass = function(classId) {
  this.classes = this.classes.filter(id => id.toString() !== classId.toString());
  return this.save();
};

// Static method to get subjects by level
subjectSchema.statics.getByLevel = function(level) {
  return this.find({ 
    $or: [
      { level: level },
      { level: 'Both' }
    ],
    isActive: true 
  }).populate('classes teachers');
};

// Static method to get subjects by department
subjectSchema.statics.getByDepartment = function(department) {
  return this.find({ 
    departments: { $in: [department, 'All'] },
    level: { $in: ['Senior', 'Both'] },
    isActive: true 
  }).populate('classes teachers');
};

// Static method to get subjects by category
subjectSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).populate('classes teachers');
};

// Static method to get subjects for a specific class
subjectSchema.statics.getByClass = function(classId) {
  return this.find({ classes: classId, isActive: true }).populate('teachers');
};

// Static method to get compulsory subjects for a level
subjectSchema.statics.getCompulsoryByLevel = function(level) {
  const schoolLevel = ['JSS1', 'JSS2', 'JSS3'].includes(level) ? 'Junior' : 'Senior';
  return this.find({ 
    $or: [
      { level: schoolLevel },
      { level: 'Both' }
    ],
    isCompulsory: true,
    isActive: true 
  }).populate('classes teachers');
};

// Static method to initialize Nigerian school subjects
subjectSchema.statics.initializeNigerianSubjects = async function() {
  const subjects = [
    // Junior Secondary Core Subjects (JSS1-JSS3)
    {
      name: 'Mathematics',
      code: 'MTH',
      level: 'Both',
      departments: ['All'],
      category: 'Core',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'Core mathematics for all levels'
    },
    {
      name: 'English Language',
      code: 'ENG',
      level: 'Both',
      departments: ['All'],
      category: 'Core',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'English language and communication skills'
    },
    {
      name: 'Basic Science',
      code: 'BSC',
      level: 'Junior',
      departments: ['All'],
      category: 'Science',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3'],
      description: 'Introductory science concepts'
    },
    {
      name: 'Basic Technology',
      code: 'BTY',
      level: 'Junior',
      departments: ['All'],
      category: 'Technical',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3'],
      description: 'Basic technology and practical skills'
    },
    {
      name: 'Social Studies',
      code: 'SOS',
      level: 'Junior',
      departments: ['All'],
      category: 'Social',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3'],
      description: 'Social studies and citizenship education'
    },
    {
      name: 'Civic Education',
      code: 'CIV',
      level: 'Both',
      departments: ['All'],
      category: 'Social',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'Citizenship and civic responsibilities'
    },
    {
      name: 'Physical and Health Education',
      code: 'PHE',
      level: 'Junior',
      departments: ['All'],
      category: 'Core',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3'],
      description: 'Physical education and health awareness'
    },
    {
      name: 'Computer Studies',
      code: 'CMP',
      level: 'Both',
      departments: ['All'],
      category: 'Technical',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'Computer literacy and programming'
    },
    {
      name: 'Home Economics',
      code: 'HEC',
      level: 'Junior',
      departments: ['All'],
      category: 'Technical',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3'],
      description: 'Home management and life skills'
    },
    {
      name: 'Agricultural Science',
      code: 'AGR',
      level: 'Both',
      departments: ['Science', 'All'],
      category: 'Science',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'Agricultural practices and food production'
    },
    {
      name: 'French',
      code: 'FRE',
      level: 'Both',
      departments: ['Arts', 'All'],
      category: 'Language',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'French language'
    },
    {
      name: 'Fine Arts',
      code: 'ART',
      level: 'Both',
      departments: ['Arts', 'All'],
      category: 'Creative',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'Visual arts and creativity'
    },
    {
      name: 'Music',
      code: 'MUS',
      level: 'Both',
      departments: ['Arts', 'All'],
      category: 'Creative',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'Music theory and performance'
    },
    {
      name: 'Christian Religious Studies',
      code: 'CRS',
      level: 'Both',
      departments: ['Arts', 'All'],
      category: 'Religious',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'Christian religious education'
    },
    {
      name: 'Islamic Religious Studies',
      code: 'IRS',
      level: 'Both',
      departments: ['Arts', 'All'],
      category: 'Religious',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
      description: 'Islamic religious education'
    },

    // Senior Secondary Science Department
    {
      name: 'Physics',
      code: 'PHY',
      level: 'Senior',
      departments: ['Science'],
      category: 'Science',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Physics for science students'
    },
    {
      name: 'Chemistry',
      code: 'CHE',
      level: 'Senior',
      departments: ['Science'],
      category: 'Science',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Chemistry for science students'
    },
    {
      name: 'Biology',
      code: 'BIO',
      level: 'Senior',
      departments: ['Science'],
      category: 'Science',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Biology for science students'
    },
    {
      name: 'Further Mathematics',
      code: 'FMT',
      level: 'Senior',
      departments: ['Science'],
      category: 'Science',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Advanced mathematics for science students'
    },

    // Senior Secondary Commercial Department
    {
      name: 'Economics',
      code: 'ECO',
      level: 'Senior',
      departments: ['Commercial', 'Arts'],
      category: 'Commercial',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Economics principles and applications'
    },
    {
      name: 'Accounting',
      code: 'ACC',
      level: 'Senior',
      departments: ['Commercial'],
      category: 'Commercial',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Financial accounting principles'
    },
    {
      name: 'Commerce',
      code: 'COM',
      level: 'Senior',
      departments: ['Commercial'],
      category: 'Commercial',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Commercial practices and trade'
    },

    // Senior Secondary Arts Department
    {
      name: 'Literature in English',
      code: 'LIT',
      level: 'Senior',
      departments: ['Arts'],
      category: 'Arts',
      isCore: true,
      isCompulsory: true,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'English literature and analysis'
    },
    {
      name: 'Government',
      code: 'GOV',
      level: 'Senior',
      departments: ['Arts', 'Commercial'],
      category: 'Social',
      isCore: true,
      isCompulsory: false,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Government and political science'
    },
    {
      name: 'History',
      code: 'HIS',
      level: 'Senior',
      departments: ['Arts'],
      category: 'Arts',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Historical studies and analysis'
    },

    // Common Senior Secondary Electives
    {
      name: 'Geography',
      code: 'GEO',
      level: 'Senior',
      departments: ['Science', 'Arts', 'Commercial'],
      category: 'Elective',
      isCore: false,
      isCompulsory: false,
      applicableLevels: ['SS1', 'SS2', 'SS3'],
      description: 'Physical and human geography'
    }
  ];

  for (const subjectData of subjects) {
    const existingSubject = await this.findOne({ name: subjectData.name });
    if (!existingSubject) {
      await this.create(subjectData);
    }
  }
};

// Transform output
subjectSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Subject', subjectSchema); 