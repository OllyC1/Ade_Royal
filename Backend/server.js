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

// CORS configuration - Fixed for production deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://ade-royal.vercel.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Add CORS_ORIGIN environment variable for production
    if (process.env.CORS_ORIGIN) {
      const corsOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
      allowedOrigins.push(...corsOrigins);
    }
    
    // Log the origin for debugging
    console.log(`CORS check - Origin: ${origin}, Allowed: ${allowedOrigins.includes(origin)}`);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log rejected origins for debugging
      console.log(`CORS rejected origin: ${origin}`);
      callback(null, true); // Allow all origins temporarily for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-Request-ID', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Additional manual CORS headers for extra compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins or all if not specified
  if (origin === 'https://ade-royal.vercel.app' || 
      origin === 'http://localhost:3000' || 
      origin === 'http://127.0.0.1:3000' ||
      !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Request-ID, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

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

// Initialize notification service
const NotificationService = require('./utils/notificationService');
const notificationService = new NotificationService();

// Store notification service in app locals for access in routes
app.locals.notificationService = notificationService;

// Socket.io for real-time features
const activeUsers = new Map();

// Set the Socket.IO instance in notification service
notificationService.setIO(io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining with authentication
  socket.on('join-room', (data) => {
    if (data && data.userId && data.role) {
      activeUsers.set(socket.id, { userId: data.userId, role: data.role });
      socket.join(`role-${data.role}`);
      socket.join(`user-${data.userId}`); // Join user-specific room for notifications
      console.log(`User ${data.userId} (${data.role}) joined with socket ${socket.id}`);
      
      // Send current notification count
      notificationService.sendNotificationCount(data.userId);
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.1-teacher-fix' // Added version for deployment trigger
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notifications', require('./routes/notifications'));
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
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeConnections: io.engine.clientsCount || 0
  });
});

// Keep-alive mechanism - ping ourselves every 10 minutes
if (process.env.NODE_ENV === 'production') {
  const https = require('https');
  
  function selfPing() {
    const url = process.env.RENDER_EXTERNAL_URL || 'https://ade-royal-cbt-backend.onrender.com';
    
    https.get(`${url}/api/health`, (res) => {
      console.log(`[${new Date().toISOString()}] Self-ping successful: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Self-ping failed:`, err.message);
    });
  }
  
  // Ping every 12 minutes (just before the 15-minute sleep)
  setInterval(selfPing, 12 * 60 * 1000);
  console.log('Self-ping keep-alive enabled');
}

// Memory monitoring and cleanup
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    
    if (usedMB > 400) { // Render free tier has ~512MB limit
      console.warn(`High memory usage: ${usedMB}MB - forcing garbage collection`);
      if (global.gc) {
        global.gc();
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
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