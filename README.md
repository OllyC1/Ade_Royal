# 🎓 Ade-Royal CBT System

A comprehensive Computer-Based Testing (CBT) system built for Ade-Royal Group of Schools. This full-stack application provides a complete solution for conducting online examinations with real-time monitoring, automatic grading, and detailed analytics.

## 🌟 Features

### 👨‍💼 **Admin Dashboard**
- **User Management**: Create and manage teachers and students
- **Class Management**: Organize students into classes with subject assignments
- **Subject Management**: Configure subjects, credit units, and passing scores
- **System Analytics**: Monitor exam performance and usage statistics
- **Real-time Monitoring**: Track active exams and student progress

### 👩‍🏫 **Teacher Portal**
- **Question Bank**: Create and manage objective and theory questions
- **Exam Creation**: Set up timed exams with customizable settings
- **Result Management**: Grade theory questions and review student responses
- **Performance Analytics**: Track class and individual student performance
- **Exam Monitoring**: Real-time oversight of ongoing examinations

### 🧑‍🎓 **Student Interface**
- **Exam Access**: Join exams using unique exam codes
- **Interactive Testing**: Timer-based exams with auto-save functionality
- **Resume Capability**: Continue interrupted exams from last saved point
- **Result Viewing**: Access detailed exam results and history
- **Profile Management**: Update personal information and view progress

## 🛠️ Tech Stack

### **Frontend**
- **React.js** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing
- **Context API** - State management

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing

### **Security & Performance**
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API abuse prevention
- **Express Validator** - Input validation
- **Error Boundaries** - React error handling

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd Ade_Royal
```

### 2. Backend Setup
```bash
cd Backend
npm install

# Copy and configure environment variables
cp config.env .env
# Edit .env with your MongoDB URI and other settings

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
# In a new terminal
cd Frontend
npm install

# Start the React development server
npm start
```

The frontend will run on `http://localhost:3000`

### 4. Default Admin Access
- **Email**: `admin@aderoyalschools.org.ng`
- **Password**: `admin123`

⚠️ **Important**: Change the default admin password immediately after first login.

## 📁 Project Structure

```
Ade_Royal/
├── Backend/                    # Node.js/Express backend
│   ├── models/                # Database models
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Custom middleware
│   │   ├── utils/                 # Utility functions
│   │   ├── scripts/               # Database scripts
│   │   └── server.js              # Main server file
│   └── Frontend/                   # React frontend
│       ├── src/
│       │   ├── components/        # Reusable components
│       │   ├── pages/             # Page components
│       │   ├── contexts/          # React contexts
│       │   └── utils/             # Frontend utilities
│       └── public/                # Static assets
├── DEPLOYMENT_GUIDE.md        # Deployment instructions
├── TESTING_GUIDE.md           # Testing procedures
└── start-servers.ps1          # Development startup script
```

## 🔧 Development Scripts

### PowerShell Scripts (Windows)
```bash
# Start both frontend and backend
./start-dev.ps1

# Start backend only
./start-backend.ps1

# Start frontend only
./start-frontend.ps1

# Check server status
./check-servers.ps1
```

### Manual Start
```bash
# Backend (Terminal 1)
cd Backend && npm run dev

# Frontend (Terminal 2)
cd Frontend && npm start
```

## 📊 Key Features in Detail

### **Exam Management**
- **Unique Exam Codes**: Secure access control for students
- **Timer Integration**: Automatic submission when time expires
- **Question Shuffling**: Randomize question and option order
- **Auto-save**: Save answers every 10 seconds
- **Resume Functionality**: Continue interrupted sessions

### **Question Types**
- **Objective Questions**: Multiple choice with automatic grading
- **Theory Questions**: Essay-style with manual grading interface
- **Mixed Exams**: Combine both question types
- **Media Support**: Images and formatted text in questions

### **Real-time Features**
- **Live Monitoring**: Track student progress during exams
- **Socket Connections**: Real-time updates and notifications
- **Session Management**: Handle connection interruptions gracefully

### **Analytics & Reporting**
- **Performance Metrics**: Individual and class-wide statistics
- **Grade Analytics**: Detailed breakdown of exam results
- **Usage Reports**: System activity and exam participation
- **Export Functionality**: Download results in various formats

## 🔐 Security Features

- **JWT Authentication** with secure token management
- **Password Encryption** using bcrypt hashing
- **Rate Limiting** to prevent API abuse
- **Input Validation** on all user inputs
- **CORS Protection** for cross-origin requests
- **Secure Headers** via Helmet middleware
- **Environment Variables** for sensitive configuration

## 🌐 API Documentation

The backend provides RESTful APIs for:
- **Authentication** (`/api/auth/*`)
- **Admin Operations** (`/api/admin/*`)
- **Teacher Functions** (`/api/teacher/*`)
- **Student Actions** (`/api/student/*`)

Detailed API documentation is available in the Backend README.

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d
```

### Deployment Options
- **Traditional Hosting**: VPS or dedicated server
- **Cloud Platforms**: AWS, Google Cloud, Azure
- **Container Deployment**: Docker with orchestration
- **Serverless**: Vercel (Frontend) + Railway/Render (Backend)

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## 🧪 Testing

```bash
# Backend testing
cd Backend && npm test

# Frontend testing
cd Frontend && npm test

# Run full test suite
npm run test:all
```

Refer to `TESTING_GUIDE.md` for comprehensive testing procedures.

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment steps
- **[Testing Guide](TESTING_GUIDE.md)** - Testing procedures and best practices
- **[Production Checklist](PRODUCTION_CHECKLIST.md)** - Pre-deployment verification
- **[Backend README](Backend/README.md)** - Detailed backend documentation
- **[Error Handling Guide](Frontend/ERROR_HANDLING_GUIDE.md)** - Frontend error management

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🏫 About Ade-Royal Group of Schools

This CBT system was developed specifically for Ade-Royal Group of Schools to modernize their examination process and provide a seamless, secure testing environment for both teachers and students.

## 📞 Support

For technical support, feature requests, or bug reports:
- Create an issue in this repository
- Contact the development team
- Check the documentation guides

---

**Built with ❤️ for Ade-Royal Group of Schools** - Empowering education through technology. 