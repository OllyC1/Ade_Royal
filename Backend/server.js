const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: './config.env' });

const app = express();
const server = createServer(app);

// Trust proxy for rate limiting and security
app.set('trust proxy', 1); // Trust first proxy

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = ['http://localhost:3000'];
      
      // Add production frontend URL
      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }
      
      // Add CORS_ORIGIN environment variable for production
      if (process.env.CORS_ORIGIN) {
        const corsOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
        allowedOrigins.push(...corsOrigins);
      }
      
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  allowEIO3: true
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5000',  // Allow backend self-requests
      'http://127.0.0.1:5000'   // Allow backend self-requests
    ];
    
    // Add production frontend URL
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // Add CORS_ORIGIN environment variable for production
    if (process.env.CORS_ORIGIN) {
      const corsOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
      allowedOrigins.push(...corsOrigins);
    }
    
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Debugging middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('origin') || 'none'}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  // Create default admin user
  require('./utils/createAdmin')();
  
  // Initialize Nigerian school classes
  try {
    const Class = require('./models/Class');
    await Class.initializeNigerianClasses();
    console.log('✅ Nigerian school classes initialized');
  } catch (error) {
    console.log('ℹ️ Nigerian school classes already exist or error initializing:', error.message);
  }

  // Initialize Nigerian school subjects
  try {
    const Subject = require('./models/Subject');
    await Subject.initializeNigerianSubjects();
    console.log('✅ Nigerian school subjects initialized');
  } catch (error) {
    console.log('ℹ️ Nigerian school subjects already exist or error initializing:', error.message);
  }
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Socket.io for real-time features
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining with authentication
  socket.on('join-room', (data) => {
    if (data && data.userId && data.role) {
      activeUsers.set(socket.id, { userId: data.userId, role: data.role });
      socket.join(`role-${data.role}`);
      console.log(`User ${data.userId} (${data.role}) joined with socket ${socket.id}`);
    }
  });

  // Join exam room
  socket.on('join-exam', (data) => {
    if (data && data.examId) {
      socket.join(`exam-${data.examId}`);
      console.log(`User ${socket.id} joined exam ${data.examId}`);
    }
  });

  // Leave exam room
  socket.on('leave-exam', (data) => {
    if (data && data.examId) {
      socket.leave(`exam-${data.examId}`);
      console.log(`User ${socket.id} left exam ${data.examId}`);
    }
  });

  // Handle exam timer updates
  socket.on('exam-timer-update', (data) => {
    if (data && data.examId) {
      socket.to(`exam-${data.examId}`).emit('timer-sync', data);
    }
  });

  // Handle exam progress updates
  socket.on('exam-progress', (data) => {
    if (data && data.examId) {
      socket.to(`exam-${data.examId}`).emit('progress-update', data);
    }
  });

  // Handle answer updates for auto-save
  socket.on('answer-update', (data) => {
    if (data && data.examId && data.questionId) {
      // Could implement auto-save logic here
      console.log(`Answer update for exam ${data.examId}, question ${data.questionId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const userData = activeUsers.get(socket.id);
    if (userData) {
      console.log(`User ${userData.userId} (${userData.role}) disconnected:`, reason);
      activeUsers.delete(socket.id);
    } else {
      console.log('User disconnected:', socket.id, 'Reason:', reason);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error for', socket.id, ':', error);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/student', require('./routes/student'));
app.use('/api/exam', require('./routes/exam'));
app.use('/api/subject', require('./routes/subject'));
app.use('/api/class', require('./routes/class'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Ade-Royal CBT System is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Ade-Royal CBT System Backend Started`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io }; 