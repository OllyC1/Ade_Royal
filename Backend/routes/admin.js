const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { protect, adminOnly } = require('../middleware/auth');
const assignSubjectsToClasses = require('../utils/assignSubjectsToClasses');

const router = express.Router();

// Apply admin protection to all routes
router.use(protect);
router.use(adminOnly);

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalSubjects = await Subject.countDocuments({ isActive: true });
    const totalClasses = await Class.countDocuments({ isActive: true });
    const totalExams = await Exam.countDocuments({ isActive: true });
    const activeExams = await Exam.countDocuments({ 
      status: 'Active',
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    });

    // Get recent activities
    const recentStudents = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('class');

    const recentExams = await Exam.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('subject class teacher');

    // Get class-wise student distribution
    const classDistribution = await User.aggregate([
      { $match: { role: 'student', isActive: true } },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: '$classInfo' },
      {
        $group: {
          _id: '$classInfo.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get subject-wise exam distribution
    const subjectExamDistribution = await Exam.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      { $unwind: '$subjectInfo' },
      {
        $group: {
          _id: '$subjectInfo.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get exam performance analytics
    const examAnalytics = await Exam.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          averageScore: { $avg: '$analytics.averageScore' },
          totalAttempts: { $sum: '$analytics.totalAttempts' },
          averagePassRate: { $avg: '$analytics.passRate' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalTeachers,
          totalSubjects,
          totalClasses,
          totalExams,
          activeExams
        },
        recentActivities: {
          recentStudents,
          recentExams
        },
        analytics: {
          classDistribution,
          subjectExamDistribution,
          examPerformance: examAnalytics[0] || {
            totalExams: 0,
            averageScore: 0,
            totalAttempts: 0,
            averagePassRate: 0
          }
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard data'
    });
  }
});

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const { role, class: classId, page = 1, limit = 10, search } = req.query;

    // Build query
    let query = {};
    if (role) query.role = role;
    if (classId) query.class = classId;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['class', 'subjects'],
      sort: { createdAt: -1 }
    };

    const users = await User.find(query)
      .populate('class subjects')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users'
    });
  }
});

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private/Admin
router.post('/users', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
  // Class is required for students
  body('class').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) {
      throw new Error('Class is required for students');
    }
    return true;
  })
], async (req, res) => {
  try {
    // 🔍 DEBUG: Log the complete request body
    console.log('🚀 USER CREATION REQUEST RECEIVED:');
    console.log('==================================');
    console.log('📦 Full req.body:', JSON.stringify(req.body, null, 2));
    console.log('🔤 req.body.firstName:', `"${req.body.firstName}"`);
    console.log('🔤 req.body.lastName:', `"${req.body.lastName}"`);
    console.log('📧 req.body.email:', `"${req.body.email}"`);
    console.log('🔑 req.body.password:', `"${req.body.password}"`);
    console.log('👤 req.body.role:', `"${req.body.role}"`);
    console.log('==================================');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, password, role, studentId, teacherId, class: classId, subjects } = req.body;

    // 🔍 DEBUG: Log extracted values
    console.log('🔍 EXTRACTED VALUES:');
    console.log('firstName:', `"${firstName}"`);
    console.log('lastName:', `"${lastName}"`);

    // 🔍 DEBUG: Check if frontend sent an email field
    if (req.body.email) {
      console.log('⚠️  FRONTEND SENT EMAIL FIELD:', `"${req.body.email}"`);
      console.log('🔄 Backend will IGNORE this and generate its own email');
    }

    // Auto-generate email based on first and last name
    const emailUsername = `${firstName.toLowerCase().trim()}${lastName.toLowerCase().trim()}`.replace(/\s+/g, '');
    const email = `${emailUsername}@aderoyalschools.org.ng`;

    // 🔍 DEBUG: Log email generation process
    console.log('📧 EMAIL GENERATION:');
    console.log('emailUsername:', `"${emailUsername}"`);
    console.log('generated email:', `"${email}"`);
    console.log('==================================');

    // Check if user already exists with this auto-generated email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with email ${email} already exists. Please use different names or modify existing user.`
      });
    }

    // Check for duplicate IDs only if provided
    if (studentId && studentId.trim()) {
      const existingStudent = await User.findOne({ studentId: studentId.trim() });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    if (teacherId && teacherId.trim()) {
      const existingTeacher = await User.findOne({ teacherId: teacherId.trim() });
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Teacher ID already exists'
        });
      }
    }

    // Validate class exists if provided
    if (classId) {
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(400).json({
          success: false,
          message: 'Selected class does not exist'
        });
      }
    }

    // Create user data with auto-generated email
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      password,
      role
    };

    // Add optional fields only if provided and not empty
    if (studentId && studentId.trim()) userData.studentId = studentId.trim();
    if (teacherId && teacherId.trim()) userData.teacherId = teacherId.trim();
    if (classId && role === 'student') userData.class = classId;
    if (subjects && Array.isArray(subjects) && role === 'teacher') userData.subjects = subjects;

    // 🔍 DEBUG: Log final user data before saving
    console.log('💾 USER DATA TO BE SAVED:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('==================================');

    const user = new User(userData);
    
    try {
      await user.save();
      console.log('✅ User saved successfully');
    } catch (saveError) {
      console.log('❌ User save error:', saveError);
      throw saveError;
    }

    // Populate the created user
    await user.populate('class subjects');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user,
        generatedEmail: email,
        loginCredentials: {
          email,
          password
        }
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating user'
    });
  }
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, studentId, teacherId, class: classId, subjects, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for duplicate email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (studentId) user.studentId = studentId;
    if (teacherId) user.teacherId = teacherId;
    if (classId) user.class = classId;
    if (subjects) user.subjects = subjects;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();
    await user.populate('class subjects');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private/Admin
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new password
    const newPassword = `${user.firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
    
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        newPassword
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password'
    });
  }
});

// @desc    Get teacher assignments
// @route   GET /api/admin/teachers/:id/assignments
// @access  Private/Admin
router.get('/teachers/:id/assignments', async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get subjects where this teacher is assigned
    const subjects = await Subject.find({ 
      teachers: teacher._id,
      isActive: true 
    }).populate('classes');

    // Create assignments array with subject-class combinations
    const assignments = [];
    
    subjects.forEach(subject => {
      subject.classes.forEach(classObj => {
        assignments.push({
          subject: subject._id,
          class: classObj._id
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
    console.error('Get teacher assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting teacher assignments'
    });
  }
});

// @desc    Update teacher assignments
// @route   PUT /api/admin/teachers/:id/assignments
// @access  Private/Admin
router.put('/teachers/:id/assignments', async (req, res) => {
  try {
    const { assignments } = req.body;
    const teacherId = req.params.id;

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Remove teacher from all existing assignments
    await Subject.updateMany(
      { teachers: teacherId },
      { $pull: { teachers: teacherId } }
    );

    // Add teacher to new assignments
    const subjectClassPairs = {};
    assignments.forEach(assignment => {
      if (!subjectClassPairs[assignment.subject]) {
        subjectClassPairs[assignment.subject] = [];
      }
      subjectClassPairs[assignment.subject].push(assignment.class);
    });

    // Update subjects with new teacher assignments
    for (const [subjectId, classIds] of Object.entries(subjectClassPairs)) {
      const subject = await Subject.findById(subjectId);
      if (subject) {
        // Add teacher to subject
        if (!subject.teachers.includes(teacherId)) {
          subject.teachers.push(teacherId);
        }
        
        // Ensure all classes are in the subject's classes array
        classIds.forEach(classId => {
          if (!subject.classes.includes(classId)) {
            subject.classes.push(classId);
          }
        });
        
        await subject.save();
      }
    }

    // Update teacher's subjects list
    const assignedSubjects = Object.keys(subjectClassPairs);
    teacher.subjects = assignedSubjects;
    await teacher.save();

    res.json({
      success: true,
      message: 'Teacher assignments updated successfully'
    });

  } catch (error) {
    console.error('Update teacher assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating teacher assignments'
    });
  }
});

// @desc    Get all classes
// @route   GET /api/admin/classes
// @access  Private/Admin
router.get('/classes', async (req, res) => {
  try {
    // Initialize classes if they don't exist
    await Class.initializeNigerianClasses();
    
    // Get all classes with proper population
    const classes = await Class.find({ isActive: true })
      .populate({
        path: 'subjects',
        select: 'name code level category',
        match: { isActive: true }
      })
      .populate({
        path: 'classTeacher',
        select: 'firstName lastName email teacherId',
        match: { isActive: true }
      })
      .sort({ name: 1 });

    // Get student counts for each class and add sample students
    const classesWithStudents = await Promise.all(
      classes.map(async (classItem) => {
        // Get actual student count
        const studentsCount = await User.countDocuments({ 
          class: classItem._id, 
          role: 'student',
          isActive: true 
        });

        // Get sample students for display (first 5)
        const sampleStudents = await User.find({ 
          class: classItem._id, 
          role: 'student',
          isActive: true 
        })
        .select('firstName lastName email studentId')
        .limit(5)
        .sort({ firstName: 1 });

        // Return class with student information
        return {
          ...classItem.toObject(),
          studentsCount,
          students: sampleStudents
        };
      })
    );

    res.json({
      success: true,
      data: {
        classes: classesWithStudents
      }
    });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting classes'
    });
  }
});

// @desc    Create/Initialize Nigerian school classes
// @route   POST /api/admin/classes/initialize
// @access  Private/Admin
router.post('/classes/initialize', async (req, res) => {
  try {
    await Class.initializeNigerianClasses();
    
    const classes = await Class.find()
      .populate('subjects classTeacher')
      .sort({ name: 1 });

    res.json({
      success: true,
      message: 'Nigerian school classes initialized successfully',
      data: {
        classes
      }
    });

  } catch (error) {
    console.error('Initialize classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error initializing classes'
    });
  }
});

// @desc    Update class (Nigerian school structure)
// @route   PUT /api/admin/classes/:id
// @access  Private/Admin
router.put('/classes/:id', async (req, res) => {
  try {
    const { description, classTeacher, subjects, maxStudents } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
    }

    const classToUpdate = await Class.findById(req.params.id);
    if (!classToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Update fields (name cannot be changed as it's fixed)
    if (description !== undefined) {
      classToUpdate.description = description;
    }
    
    // Handle classTeacher - more flexible validation
    if (classTeacher !== undefined) {
      if (classTeacher === '' || classTeacher === null || classTeacher === 'null') {
        classToUpdate.classTeacher = null;
      } else {
        // Check if it's a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(classTeacher)) {
          // Verify the teacher exists
          const teacher = await User.findOne({ 
            _id: classTeacher, 
            role: 'teacher',
            isActive: true 
          });
          if (!teacher) {
            return res.status(400).json({
              success: false,
              message: 'Selected teacher not found or inactive'
            });
          }
          classToUpdate.classTeacher = classTeacher;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid class teacher ID format'
          });
        }
      }
    }
    
    // Handle subjects array with better validation
    if (subjects !== undefined) {
      if (Array.isArray(subjects)) {
        // Filter out empty strings and validate ObjectIds
        const validSubjects = subjects.filter(id => id && id.trim() !== '');
        
        // Validate all subject IDs
        for (const subjectId of validSubjects) {
          if (!mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json({
              success: false,
              message: `Invalid subject ID: ${subjectId}`
            });
          }
        }
        
        // Verify all subjects exist
        if (validSubjects.length > 0) {
          const existingSubjects = await Subject.find({ 
            _id: { $in: validSubjects },
            isActive: true 
          });
          
          if (existingSubjects.length !== validSubjects.length) {
            return res.status(400).json({
              success: false,
              message: 'One or more subjects not found or inactive'
            });
          }
        }
        
        classToUpdate.subjects = validSubjects;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Subjects must be an array'
        });
      }
    }
    
    // Handle maxStudents with proper validation
    if (maxStudents !== undefined) {
      const maxStudentsNum = parseInt(maxStudents);
      if (isNaN(maxStudentsNum) || maxStudentsNum < 1 || maxStudentsNum > 200) {
        return res.status(400).json({
          success: false,
          message: 'Max students must be a number between 1 and 200'
        });
      }
      classToUpdate.maxStudents = maxStudentsNum;
    }

    // Save the updated class
    await classToUpdate.save();
    
    // Populate with comprehensive data and error handling
    await classToUpdate.populate([
      {
        path: 'subjects',
        select: 'name code level category',
        match: { isActive: true }
      },
      {
        path: 'classTeacher',
        select: 'firstName lastName email teacherId',
        match: { isActive: true }
      }
    ]);

    // Get students count separately to ensure accuracy
    const studentsCount = await User.countDocuments({ 
      class: classToUpdate._id, 
      role: 'student',
      isActive: true 
    });

    // Get sample students for display
    const sampleStudents = await User.find({ 
      class: classToUpdate._id, 
      role: 'student',
      isActive: true 
    })
    .select('firstName lastName email studentId')
    .limit(5)
    .sort({ firstName: 1 });

    // Prepare response with student information
    const responseClass = {
      ...classToUpdate.toObject(),
      studentsCount,
      students: sampleStudents
    };

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: {
        class: responseClass
      }
    });

  } catch (error) {
    console.error('Update class error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate value error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Delete class (not recommended for Nigerian school structure)
// @route   DELETE /api/admin/classes/:id
// @access  Private/Admin
router.delete('/classes/:id', async (req, res) => {
  try {
    const classToDelete = await Class.findById(req.params.id);
    if (!classToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if there are students in this class
    const studentsInClass = await User.countDocuments({ class: req.params.id, role: 'student' });
    if (studentsInClass > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class. There are ${studentsInClass} students assigned to this class.`
      });
    }

    // For Nigerian school system, we don't actually delete core classes
    if (['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].includes(classToDelete.name)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete core Nigerian school classes. You can only update them.'
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting class'
    });
  }
});

// @desc    Get all subjects
// @route   GET /api/admin/subjects
// @access  Private/Admin
router.get('/subjects', async (req, res) => {
  try {
    const { level, department, category } = req.query;
    
    let query = {};
    if (level) {
      query.$or = [
        { level: level },
        { level: 'Both' }
      ];
    }
    if (department) {
      query.departments = { $in: [department, 'All'] };
    }
    if (category) {
      query.category = category;
    }

    const subjects = await Subject.find(query)
      .populate('classes teachers')
      .sort({ level: 1, category: 1, name: 1 });

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

// @desc    Initialize Nigerian school subjects
// @route   POST /api/admin/subjects/initialize
// @access  Private/Admin
router.post('/subjects/initialize', async (req, res) => {
  try {
    await Subject.initializeNigerianSubjects();
    
    const subjects = await Subject.find()
      .populate('classes teachers')
      .sort({ level: 1, category: 1, name: 1 });

    res.json({
      success: true,
      message: 'Nigerian school subjects initialized successfully',
      data: {
        subjects
      }
    });

  } catch (error) {
    console.error('Initialize subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error initializing subjects'
    });
  }
});

// @desc    Get subjects by level
// @route   GET /api/admin/subjects/level/:level
// @access  Private/Admin
router.get('/subjects/level/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const subjects = await Subject.getByLevel(level);

    res.json({
      success: true,
      data: {
        subjects
      }
    });

  } catch (error) {
    console.error('Get subjects by level error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting subjects by level'
    });
  }
});

// @desc    Get subjects by department
// @route   GET /api/admin/subjects/department/:department
// @access  Private/Admin
router.get('/subjects/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    const subjects = await Subject.getByDepartment(department);

    res.json({
      success: true,
      data: {
        subjects
      }
    });

  } catch (error) {
    console.error('Get subjects by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting subjects by department'
    });
  }
});

// @desc    Create new subject
// @route   POST /api/admin/subjects
// @access  Private/Admin
router.post('/subjects', [
  body('name').trim().isLength({ min: 2 }).withMessage('Subject name must be at least 2 characters'),
  body('code').optional({ checkFalsy: true }).trim().isLength({ min: 2 }).withMessage('Subject code must be at least 2 characters when provided'),
  body('level').optional().isIn(['Junior', 'Senior', 'Both']).withMessage('Invalid level'),
  body('departments').optional().isArray().withMessage('Departments must be an array'),
  body('category').optional().isIn(['Core', 'Science', 'Commercial', 'Arts', 'Technical', 'Language', 'Religious', 'Creative', 'Social', 'Elective']).withMessage('Invalid category')
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
      name, 
      code, 
      description, 
      level,
      departments,
      category,
      classes, 
      teachers, 
      isCore, 
      isCompulsory,
      applicableLevels,
      credits,
      passingScore
    } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ 
      $or: [
        { name },
        ...(code && code.trim() ? [{ code: code.toUpperCase() }] : [])
      ]
    });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this name or code already exists'
      });
    }

    const subjectData = {
      name,
      code: code && code.trim() ? code.toUpperCase() : undefined,
      description,
      level: level || 'Both',
      departments: departments || [],
      category: category || 'Core',
      classes: classes || [],
      teachers: teachers || [],
      isCore: isCore !== false,
      isCompulsory: isCompulsory || false,
      applicableLevels: applicableLevels || [],
      credits: credits || 1,
      passingScore: passingScore || 40
    };

    const subject = new Subject(subjectData);
    await subject.save();
    await subject.populate('classes teachers');

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: {
        subject
      }
    });

  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating subject'
    });
  }
});

// @desc    Update subject
// @route   PUT /api/admin/subjects/:id
// @access  Private/Admin
router.put('/subjects/:id', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Subject name must be at least 2 characters'),
  body('code').optional({ checkFalsy: true }).trim().isLength({ min: 2 }).withMessage('Subject code must be at least 2 characters when provided'),
  body('level').optional().isIn(['Junior', 'Senior', 'Both']).withMessage('Invalid level'),
  body('departments').optional().isArray().withMessage('Departments must be an array'),
  body('category').optional().isIn(['Core', 'Science', 'Commercial', 'Arts', 'Technical', 'Language', 'Religious', 'Creative', 'Social', 'Elective']).withMessage('Invalid category')
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
      name, 
      code, 
      description, 
      level,
      departments,
      category,
      classes, 
      teachers, 
      isCore, 
      isCompulsory,
      applicableLevels,
      credits,
      passingScore
    } = req.body;

    const subjectToUpdate = await Subject.findById(req.params.id);
    if (!subjectToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if new name or code already exists (if being changed)
    const checkDuplicates = [];
    
    if (name && name.trim() && name.trim() !== subjectToUpdate.name) {
      checkDuplicates.push({ name: name.trim() });
    }
    
    if (code && code.trim() && code.trim().toUpperCase() !== subjectToUpdate.code) {
      checkDuplicates.push({ code: code.trim().toUpperCase() });
    }
    
    if (checkDuplicates.length > 0) {
      const existingSubject = await Subject.findOne({ 
        _id: { $ne: req.params.id },
        $or: checkDuplicates
      });
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject with this name or code already exists'
        });
      }
    }

    // Update fields
    if (name) subjectToUpdate.name = name;
    if (code !== undefined) subjectToUpdate.code = code && code.trim() ? code.toUpperCase() : undefined;
    if (description !== undefined) subjectToUpdate.description = description;
    if (level) subjectToUpdate.level = level;
    if (departments) subjectToUpdate.departments = departments;
    if (category) subjectToUpdate.category = category;
    if (classes) subjectToUpdate.classes = classes;
    if (teachers) subjectToUpdate.teachers = teachers;
    if (isCore !== undefined) subjectToUpdate.isCore = isCore;
    if (isCompulsory !== undefined) subjectToUpdate.isCompulsory = isCompulsory;
    if (applicableLevels) subjectToUpdate.applicableLevels = applicableLevels;
    if (credits) subjectToUpdate.credits = credits;
    if (passingScore) subjectToUpdate.passingScore = passingScore;

    await subjectToUpdate.save();
    await subjectToUpdate.populate('classes teachers');

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: {
        subject: subjectToUpdate
      }
    });

  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating subject'
    });
  }
});

// @desc    Delete subject
// @route   DELETE /api/admin/subjects/:id
// @access  Private/Admin
router.delete('/subjects/:id', async (req, res) => {
  try {
    const subjectToDelete = await Subject.findById(req.params.id);
    if (!subjectToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if there are exams for this subject
    const examsCount = await Exam.countDocuments({ subject: req.params.id });
    if (examsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject. There are ${examsCount} exams associated with this subject.`
      });
    }

    // Remove subject from teachers
    await User.updateMany(
      { subjects: req.params.id },
      { $pull: { subjects: req.params.id } }
    );

    // Remove subject from classes
    await Class.updateMany(
      { subjects: req.params.id },
      { $pull: { subjects: req.params.id } }
    );

    await Subject.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });

  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting subject'
    });
  }
});

// @desc    Assign teacher to subject
// @route   POST /api/admin/assign-teacher
// @access  Private/Admin
router.post('/assign-teacher', [
  body('teacherId').isMongoId().withMessage('Valid teacher ID is required'),
  body('subjectId').isMongoId().withMessage('Valid subject ID is required')
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

    const { teacherId, subjectId } = req.body;

    // Verify teacher exists and is a teacher
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Add teacher to subject
    await subject.addTeacher(teacherId);

    // Add subject to teacher
    if (!teacher.subjects.includes(subjectId)) {
      teacher.subjects.push(subjectId);
      await teacher.save();
    }

    res.json({
      success: true,
      message: 'Teacher assigned to subject successfully'
    });

  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning teacher'
    });
  }
});

// @desc    Get exam analytics
// @route   GET /api/admin/exam-analytics
// @access  Private/Admin
router.get('/exam-analytics', async (req, res) => {
  try {
    const { startDate, endDate, subject, class: classId } = req.query;

    // Build match query
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (subject) matchQuery.subject = subject;
    if (classId) matchQuery.class = classId;

    // Get exam statistics
    const examStats = await Exam.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          totalAttempts: { $sum: '$analytics.totalAttempts' },
          averageScore: { $avg: '$analytics.averageScore' },
          averagePassRate: { $avg: '$analytics.passRate' }
        }
      }
    ]);

    // Get performance by subject
    const subjectPerformance = await Exam.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      { $unwind: '$subjectInfo' },
      {
        $group: {
          _id: '$subjectInfo.name',
          examCount: { $sum: 1 },
          averageScore: { $avg: '$analytics.averageScore' },
          totalAttempts: { $sum: '$analytics.totalAttempts' }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    // Get performance by class
    const classPerformance = await Exam.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: '$classInfo' },
      {
        $group: {
          _id: '$classInfo.name',
          examCount: { $sum: 1 },
          averageScore: { $avg: '$analytics.averageScore' },
          totalAttempts: { $sum: '$analytics.totalAttempts' }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: examStats[0] || {
          totalExams: 0,
          totalAttempts: 0,
          averageScore: 0,
          averagePassRate: 0
        },
        subjectPerformance,
        classPerformance
      }
    });

  } catch (error) {
    console.error('Exam analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting exam analytics'
    });
  }
});

// @desc    Get exam results with filtering
// @route   GET /api/admin/results
// @access  Private/Admin
router.get('/results', async (req, res) => {
  try {
    const { subject, class: classId, student, dateRange, page = 1, limit = 50 } = req.query;

    // Build match query for exams
    let examMatchQuery = {};
    
    if (subject) {
      examMatchQuery.subject = new mongoose.Types.ObjectId(subject);
    }
    if (classId) {
      examMatchQuery.class = new mongoose.Types.ObjectId(classId);
    }
    
    // Date range filtering
    let attemptMatchQuery = {};
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
      }
      
      if (startDate) {
        attemptMatchQuery['attempts.submittedAt'] = { $gte: startDate };
      }
    }

    if (student) {
      attemptMatchQuery['attempts.student'] = new mongoose.Types.ObjectId(student);
    }

    // Only include completed attempts with released results
    attemptMatchQuery['attempts.isCompleted'] = true;
    attemptMatchQuery['attempts.resultsReleased'] = true;

    // Aggregate exam attempts
    const pipeline = [
      { $match: examMatchQuery },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: '$attempts' },
      { $match: attemptMatchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'attempts.student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          _id: '$attempts._id',
          score: {
            $cond: {
              if: { $gt: ['$attempts.actualScore', 0] },
              then: '$attempts.actualScore',
              else: '$attempts.score'
        }
      },
          percentage: {
            $cond: {
              if: { $gt: ['$attempts.actualPercentage', 0] },
              then: '$attempts.actualPercentage',
              else: '$attempts.percentage'
            }
          },
          submittedAt: '$attempts.submittedAt',
          gradingStatus: '$attempts.gradingStatus',
          timeSpent: '$attempts.timeSpent',
        student: {
          _id: '$studentInfo._id',
          firstName: '$studentInfo.firstName',
          lastName: '$studentInfo.lastName',
          studentId: '$studentInfo.studentId'
        },
        exam: {
            _id: '$_id',
            title: '$title',
            examCode: '$examCode',
            totalMarks: '$totalMarks',
            passingMarks: '$passingMarks',
            subject: { $arrayElemAt: ['$subjectInfo', 0] },
            class: { $arrayElemAt: ['$classInfo', 0] }
          }
        }
      },
      { $sort: { submittedAt: -1 } }
    ];

    // Get total count for pagination
    const totalPipeline = [...pipeline];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Exam.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute the aggregation
    const results = await Exam.aggregate(pipeline);

    // Calculate analytics
    const analyticsQuery = [
      { $match: examMatchQuery },
      { $unwind: '$attempts' },
      { $match: attemptMatchQuery },
      {
        $project: {
          totalMarks: 1,
          passingMarks: 1,
          percentage: {
            $cond: {
              if: { $gt: ['$attempts.actualPercentage', 0] },
              then: '$attempts.actualPercentage',
              else: '$attempts.percentage'
            }
          },
          score: {
            $cond: {
              if: { $gt: ['$attempts.actualScore', 0] },
              then: '$attempts.actualScore',
              else: '$attempts.score'
            }
          }
        }
      },
      {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          totalScore: { $sum: '$score' },
          totalPossible: { $sum: '$totalMarks' },
          passCount: {
            $sum: {
              $cond: [
                { $gte: ['$percentage', { $multiply: [{ $divide: ['$passingMarks', '$totalMarks'] }, 100] }] },
                1,
                0
              ]
          }
        }
      }
      },
      {
        $addFields: {
          passRate: { $multiply: [{ $divide: ['$passCount', '$totalExams'] }, 100] }
        }
      }
    ];

    const analyticsResult = await Exam.aggregate(analyticsQuery);
    const analytics = analyticsResult[0] || {
      totalExams: 0,
      averageScore: 0,
      passRate: 0
    };

    // Get top performers
    const topPerformersQuery = [
      { $match: examMatchQuery },
      { $unwind: '$attempts' },
      { $match: attemptMatchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'attempts.student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $project: {
          'attempts.student': 1,
          studentInfo: 1,
          classInfo: 1,
          percentage: {
            $cond: {
              if: { $gt: ['$attempts.actualPercentage', 0] },
              then: '$attempts.actualPercentage',
              else: '$attempts.percentage'
            }
          },
          score: {
            $cond: {
              if: { $gt: ['$attempts.actualScore', 0] },
              then: '$attempts.actualScore',
              else: '$attempts.score'
            }
          }
        }
      },
      {
      $group: {
          _id: '$attempts.student',
          firstName: { $first: { $arrayElemAt: ['$studentInfo.firstName', 0] } },
          lastName: { $first: { $arrayElemAt: ['$studentInfo.lastName', 0] } },
          class: { $first: { $arrayElemAt: ['$classInfo', 0] } },
          averageScore: { $avg: '$percentage' },
          totalScore: { $sum: '$score' },
        examCount: { $sum: 1 }
      }
      },
      { $sort: { averageScore: -1 } },
      { $limit: 10 }
    ];

    const topPerformers = await Exam.aggregate(topPerformersQuery);

    res.json({
      success: true,
      data: {
        results,
        analytics: {
          totalExams: analytics.totalExams || 0,
          averageScore: analytics.averageScore || 0,
          passRate: analytics.passRate || 0,
        topPerformers
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalResults: total,
          hasNextPage: parseInt(page) * parseInt(limit) < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting results'
    });
  }
});

// @desc    Get detailed result for a specific exam and student
// @route   GET /api/admin/results/:examId/:studentId
// @access  Private/Admin
router.get('/results/:examId/:studentId', async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam or student ID'
      });
    }

    // Find the exam and specific student attempt
    const exam = await Exam.findById(examId)
      .populate('subject', 'name')
      .populate('class', 'name')
      .populate('teacher', 'firstName lastName');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Find the specific attempt for this student
    const attempt = exam.attempts.find(
      att => att.student.toString() === studentId && att.isCompleted
    );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Result not found for this student'
      });
    }

    // Get student information
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Prepare the result data
    const resultData = {
      _id: attempt._id,
      score: attempt.actualScore > 0 ? attempt.actualScore : attempt.score,
      percentage: attempt.actualPercentage > 0 ? attempt.actualPercentage : attempt.percentage,
      timeSpent: attempt.timeSpent,
      submittedAt: attempt.submittedAt,
      gradingStatus: attempt.gradingStatus,
      autoGradedMarks: attempt.autoGradedMarks,
      manualGradedMarks: attempt.manualGradedMarks,
      needsGrading: attempt.needsGrading,
      resultsReleased: attempt.resultsReleased,
      resultsReleasedAt: attempt.resultsReleasedAt,
      gradedBy: attempt.gradedBy,
      gradedAt: attempt.gradedAt,
      answers: attempt.answers,
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        email: student.email
      },
      exam: {
        _id: exam._id,
        title: exam.title,
        examCode: exam.examCode,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        duration: exam.duration,
        questionCount: exam.embeddedQuestions?.length || exam.questions?.length || 0,
        subject: exam.subject,
        class: exam.class,
        teacher: exam.teacher,
        startTime: exam.startTime,
        endTime: exam.endTime,
        status: exam.status
      }
    };

    res.json({
      success: true,
      data: resultData
    });

  } catch (error) {
    console.error('Get result details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting result details'
    });
  }
});

// @desc    Export exam results
// @route   GET /api/admin/results/export
// @access  Private/Admin
router.get('/results/export', async (req, res) => {
  try {
    const { subject, class: classId, student, dateRange } = req.query;

    // Build the same query as the results endpoint
    let matchQuery = {};
    
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
      }
      
      if (startDate) {
        matchQuery.submittedAt = { $gte: startDate };
      }
    }

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
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'examInfo.subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      { $unwind: '$subjectInfo' },
      {
        $lookup: {
          from: 'classes',
          localField: 'examInfo.class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: '$classInfo' }
    ];

    // Add filters
    if (subject) {
      pipeline.push({ $match: { 'examInfo.subject': new mongoose.Types.ObjectId(subject) } });
    }
    if (classId) {
      pipeline.push({ $match: { 'examInfo.class': new mongoose.Types.ObjectId(classId) } });
    }
    if (student) {
      pipeline.push({ $match: { 'student': new mongoose.Types.ObjectId(student) } });
    }
    if (matchQuery.submittedAt) {
      pipeline.push({ $match: matchQuery });
    }

    pipeline.push({
      $project: {
        studentName: { $concat: ['$studentInfo.firstName', ' ', '$studentInfo.lastName'] },
        studentId: '$studentInfo.studentId',
        examTitle: '$examInfo.title',
        examCode: '$examInfo.examCode',
        subject: '$subjectInfo.name',
        class: '$classInfo.name',
        score: 1,
        grade: {
          $switch: {
            branches: [
              { case: { $gte: ['$score', 80] }, then: 'A' },
              { case: { $gte: ['$score', 70] }, then: 'B' },
              { case: { $gte: ['$score', 60] }, then: 'C' },
              { case: { $gte: ['$score', 50] }, then: 'D' }
            ],
            default: 'F'
          }
        },
        submittedAt: 1
      }
    });

    pipeline.push({ $sort: { submittedAt: -1 } });

    const ExamResult = require('../models/ExamResult');
    const results = await ExamResult.aggregate(pipeline);

    // Convert to CSV
    const csvHeader = 'Student Name,Student ID,Exam Title,Exam Code,Subject,Class,Score,Grade,Date\n';
    const csvData = results.map(result => {
      return [
        result.studentName,
        result.studentId,
        result.examTitle,
        result.examCode,
        result.subject,
        result.class,
        result.score.toFixed(1),
        result.grade,
        new Date(result.submittedAt).toLocaleDateString()
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=exam_results.csv');
    res.send(csv);

  } catch (error) {
    console.error('Export results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting results'
    });
  }
});

// @desc    Assign subjects to classes automatically
// @route   POST /api/admin/classes/assign-subjects
// @access  Private/Admin
router.post('/classes/assign-subjects', async (req, res) => {
  try {
    const assignmentCount = await assignSubjectsToClasses();
    
    // Return updated classes with populated subjects and proper student data
    const classes = await Class.find({ isActive: true })
      .populate({
        path: 'subjects',
        select: 'name code level category',
        match: { isActive: true }
      })
      .populate({
        path: 'classTeacher',
        select: 'firstName lastName email teacherId',
        match: { isActive: true }
      })
      .sort({ name: 1 });

    // Get student counts for each class
    const classesWithStudents = await Promise.all(
      classes.map(async (classItem) => {
        // Get actual student count
        const studentsCount = await User.countDocuments({ 
          class: classItem._id, 
          role: 'student',
          isActive: true 
        });

        // Get sample students for display (first 5)
        const sampleStudents = await User.find({ 
          class: classItem._id, 
          role: 'student',
          isActive: true 
        })
        .select('firstName lastName email studentId')
        .limit(5)
        .sort({ firstName: 1 });

        // Return class with student information
        return {
          ...classItem.toObject(),
          studentsCount,
          students: sampleStudents
        };
      })
    );

    res.json({
      success: true,
      message: `Successfully assigned subjects to classes. ${assignmentCount} assignments made.`,
      data: {
        classes: classesWithStudents,
        assignmentCount
      }
    });

  } catch (error) {
    console.error('Auto-assign subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error auto-assigning subjects to classes'
    });
  }
});

module.exports = router; 