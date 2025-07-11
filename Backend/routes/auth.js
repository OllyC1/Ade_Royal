const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (but role-specific registration might be restricted)
router.post('/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, password, role, studentId, teacherId, class: classId } = req.body;

    // 🔧 AUTO-GENERATE EMAIL WITH CORRECT DOMAIN
    const emailUsername = `${firstName.toLowerCase().trim()}${lastName.toLowerCase().trim()}`.replace(/\s+/g, '');
    const email = `${emailUsername}@aderoyalschools.org.ng`;

    // Check if user already exists with auto-generated email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with email ${email} already exists. Please use different names or modify existing user.`
      });
    }

    // Check for duplicate student/teacher ID
    if (studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    if (teacherId) {
      const existingTeacher = await User.findOne({ teacherId });
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Teacher ID already exists'
        });
      }
    }

    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: role || 'student'
    };

    if (studentId) userData.studentId = studentId;
    if (teacherId) userData.teacherId = teacherId;
    if (classId && role === 'student') userData.class = classId;

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          teacherId: user.teacherId,
          class: user.class
        },
        token,
        generatedEmail: email,
        loginCredentials: {
          email,
          password
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password').populate('class subjects');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          teacherId: user.teacherId,
          class: user.class,
          subjects: user.subjects,
          profileImage: user.profileImage,
          lastLogin: user.lastLogin
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('class subjects');
    
    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('phoneNumber').optional().trim(),
  body('address').optional().trim(),
  body('qualification').optional().trim(),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('dateOfJoining').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty/null values
    return new Date(value).toString() !== 'Invalid Date'; // Check if it's a valid date
  }).withMessage('Invalid date format'),
  body('dateOfBirth').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty/null values
    return new Date(value).toString() !== 'Invalid Date'; // Check if it's a valid date
  }).withMessage('Invalid date format')
], async (req, res) => {
  try {
    console.log('Profile update request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      address, 
      dateOfBirth, 
      qualification, 
      experience, 
      dateOfJoining 
    } = req.body;

    const user = await User.findById(req.user._id);

    // Update basic fields (handle empty strings as well)
    if (firstName !== undefined) user.firstName = firstName || '';
    if (lastName !== undefined) user.lastName = lastName || '';
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber || '';
    if (address !== undefined) user.address = address || '';
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth || null;

    // Only admin can change email
    if (email && user.role === 'admin') {
      // Check if email already exists for another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
      
      user.email = email.toLowerCase();
    }

    // Update teacher/admin specific fields
    if (user.role === 'teacher' || user.role === 'admin') {
      if (qualification !== undefined) user.qualification = qualification || '';
      if (experience !== undefined) user.experience = experience || 0;
      if (dateOfJoining !== undefined) user.dateOfJoining = dateOfJoining || null;
    }

    await user.save();

    // Populate the user data for response
    const updatedUser = await User.findById(user._id).populate('class subjects');

    // Log profile update for admin tracking
    console.log(`Profile updated for ${user.role}: ${user.firstName} ${user.lastName} (${user.email})`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
});

module.exports = router; 