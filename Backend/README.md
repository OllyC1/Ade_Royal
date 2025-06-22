# Ade-Royal CBT System Backend

A comprehensive Computer-Based Testing (CBT) system backend built with Node.js, Express, and MongoDB for Ade-Royal Group of Schools.

## Features

### 🔧 Core Features
- **Multi-role Authentication** (Admin, Teacher, Student)
- **Exam Management** with unique exam codes
- **Question Bank** (Objective & Theory questions)
- **Real-time Exam Sessions** with timer and auto-save
- **Resume Functionality** for interrupted sessions
- **Auto-grading** for objective questions
- **Manual grading** interface for theory questions
- **Comprehensive Analytics** and reporting
- **Class & Subject Management**

### 👩‍🏫 Teacher Features
- Create and manage exams
- Upload questions (Objective/Theory)
- Set exam schedules and duration
- Review and grade theory responses
- View student performance analytics

### 🧑‍🎓 Student Features
- Join exams using exam codes
- Timer-based exam sessions
- Auto-save answers every 10 seconds
- Resume from last point if disconnected
- View exam results and history

### 🧑‍💼 Admin Features
- Manage users (Teachers/Students)
- Create classes and subjects
- Assign teachers to subjects
- System-wide analytics
- Real-time exam monitoring

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Security**: Helmet, Rate Limiting, CORS
- **Validation**: Express Validator

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp config.env .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ade_royal_cbt
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   NODE_ENV=development
   
   # Admin Default Credentials
   ADMIN_EMAIL=admin@aderoyal.edu.ng
   ADMIN_PASSWORD=admin123
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using MongoDB directly
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "studentId": "STU001",
  "class": "class_id_here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

#### Create User
```http
POST /api/admin/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "teacher",
  "teacherId": "TCH001",
  "subjects": ["subject_id_1", "subject_id_2"]
}
```

#### Create Class
```http
POST /api/admin/classes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "SS1",
  "level": "Senior",
  "description": "Senior Secondary 1",
  "subjects": ["subject_id_1", "subject_id_2"]
}
```

#### Create Subject
```http
POST /api/admin/subjects
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Mathematics",
  "code": "MATH",
  "description": "General Mathematics",
  "category": "Core",
  "classes": ["class_id_1", "class_id_2"],
  "creditUnit": 3,
  "passingScore": 40
}
```

### Teacher Endpoints

#### Create Question
```http
POST /api/teacher/questions
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "questionText": "What is 2 + 2?",
  "questionType": "Objective",
  "subject": "subject_id",
  "class": "class_id",
  "marks": 1,
  "difficulty": "Easy",
  "options": [
    {"text": "3", "isCorrect": false},
    {"text": "4", "isCorrect": true},
    {"text": "5", "isCorrect": false},
    {"text": "6", "isCorrect": false}
  ],
  "explanation": "Basic addition: 2 + 2 = 4"
}
```

#### Create Exam
```http
POST /api/teacher/exams
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "title": "Mathematics Mid-term Exam",
  "subject": "subject_id",
  "class": "class_id",
  "description": "Mid-term examination for Mathematics",
  "duration": 60,
  "totalMarks": 50,
  "passingMarks": 20,
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T17:00:00Z",
  "instructions": "Answer all questions carefully",
  "examType": "Mixed",
  "settings": {
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "showResultsImmediately": false,
    "allowReview": true
  }
}
```

### Student Endpoints

#### Join Exam
```http
POST /api/student/join-exam
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "examCode": "EXAM123"
}
```

#### Start Exam
```http
POST /api/student/exams/:examId/start
Authorization: Bearer <student_token>
```

#### Save Answer
```http
POST /api/student/exams/:examId/answer
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "questionId": "question_id",
  "answer": "Option B",
  "timeSpent": 30
}
```

#### Submit Exam
```http
POST /api/student/exams/:examId/submit
Authorization: Bearer <student_token>
```

## Database Models

### User Model
- Multi-role support (admin, teacher, student)
- Encrypted passwords
- Exam session tracking
- Profile management

### Exam Model
- Unique exam codes
- Timer and scheduling
- Question management
- Analytics tracking
- Student attempts

### Question Model
- Objective and Theory types
- Media attachments support
- Statistics tracking
- Difficulty levels

### Class & Subject Models
- Hierarchical organization
- Teacher assignments
- Student enrollment

## Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **CORS Protection** for cross-origin requests
- **Helmet** for security headers
- **Input Validation** using express-validator

## Real-time Features

- **Socket.io Integration** for live exam monitoring
- **Timer Synchronization** across clients
- **Auto-save** functionality every 10 seconds
- **Session Recovery** for interrupted connections

## Error Handling

- Comprehensive error middleware
- Structured error responses
- Development vs Production error details
- Logging for debugging

## Default Admin Account

When the server starts for the first time, a default admin account is created:

- **Email**: admin@aderoyal.edu.ng
- **Password**: admin123

⚠️ **Important**: Change the default password immediately after first login.

## Development

### Running in Development Mode
```bash
npm run dev
```

This uses nodemon for automatic server restarts on file changes.

### Testing
```bash
npm test
```

### Code Structure
```
Backend/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── config.env       # Environment configuration
├── server.js        # Main server file
└── package.json     # Dependencies
```

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-super-secure-jwt-secret
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start server.js --name "ade-royal-cbt"
pm2 startup
pm2 save
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Ade-Royal Group of Schools CBT System** - Empowering education through technology. 