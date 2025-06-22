# 🧪 CBT System Testing Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### 1. Setup & Installation

```bash
# Clone and setup
git clone <your-repo>
cd Ade_Royal

# Backend setup
cd Backend
npm install
npm start  # Runs on http://localhost:5000

# Frontend setup (new terminal)
cd Frontend
npm install
npm start  # Runs on http://localhost:3000
```

### 2. Environment Configuration

Create `Backend/config.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ade-royal-cbt
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

## 🔐 **Default Login Credentials**

### Admin Account
- **Email:** admin@aderoyalschools.org.ng
- **Password:** admin123

### Test Teacher Account
- **Email:** teacher@aderoyalschools.org.ng
- **Password:** teacher123

### Test Student Account
- **Email:** student@aderoyalschools.org.ng
- **Password:** student123

## 📋 **Testing Scenarios**

### **Scenario 1: Admin Workflow**

1. **Login as Admin**
   - Go to http://localhost:3000/login
   - Use admin credentials above
   - Should redirect to admin dashboard

2. **Create Classes & Subjects**
   - Navigate to Classes management
   - Create: JSS1, JSS2, JSS3, SSS1, SSS2, SSS3
   - Create subjects: Mathematics, English, Physics, Chemistry, Biology

3. **Manage Users**
   - Create teacher accounts
   - Create student accounts
   - Assign teachers to subjects
   - Assign students to classes

### **Scenario 2: Teacher Workflow**

1. **Login as Teacher**
   - Use teacher credentials
   - Access teacher dashboard

2. **Create Questions**
   - Navigate to Questions management
   - Create objective questions with 4 options
   - Create theory questions
   - Test different subjects

3. **Create Exam**
   - Go to Create Exam
   - Fill exam details:
     - Title: "Mathematics Mid-Term Test"
     - Subject: Mathematics
     - Duration: 60 minutes
     - Start/End times
     - Passing marks: 50
   - Add questions (mix of objective and theory)
   - Generate exam code
   - Publish exam

4. **Monitor Live Exam**
   - View active exams
   - Monitor student progress in real-time
   - Check auto-save functionality

5. **Grade Theory Questions**
   - Access pending grading
   - Review student theory answers
   - Assign marks
   - Add feedback

### **Scenario 3: Student Workflow**

1. **Register/Login as Student**
   - Register new account or use test credentials
   - Select appropriate class

2. **Join Exam**
   - Use exam code from teacher
   - Or select from available exams
   - Review exam details before starting

3. **Take Exam**
   - Answer objective questions (radio buttons)
   - Answer theory questions (text areas)
   - Test navigation between questions
   - Test flagging questions for review
   - Verify auto-save (check every 10 seconds)
   - Test timer functionality
   - Submit exam

4. **View Results**
   - Check exam history
   - View detailed results
   - Check performance analytics

## 🧪 **Specific Features to Test**

### **Authentication & Authorization**
- [ ] User registration with role selection
- [ ] Login with email/password
- [ ] JWT token persistence
- [ ] Role-based route protection
- [ ] Logout functionality
- [ ] Password validation

### **Exam Management**
- [ ] Exam creation with all fields
- [ ] Question bank management
- [ ] Exam code generation (unique)
- [ ] Exam scheduling (start/end times)
- [ ] Question shuffling
- [ ] Option randomization

### **Real-time Features**
- [ ] Live exam monitoring
- [ ] Auto-save every 10 seconds
- [ ] Socket.io connections
- [ ] Real-time student count
- [ ] Live progress updates

### **Timer & Session Management**
- [ ] Exam timer countdown
- [ ] Auto-submit when time expires
- [ ] Session recovery after disconnect
- [ ] Prevent page refresh during exam
- [ ] Browser back button handling

### **Grading System**
- [ ] Auto-grading objective questions
- [ ] Manual grading for theory questions
- [ ] Score calculation
- [ ] Pass/fail determination
- [ ] Grade assignment (A, B, C, D, F)

### **Data Persistence**
- [ ] Answer auto-save
- [ ] Session state recovery
- [ ] Exam attempt tracking
- [ ] Result storage
- [ ] Analytics data

## 🔍 **Testing Tools & Methods**

### **Manual Testing**
1. **Cross-browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (responsive design)

2. **Device Testing**
   - Desktop (1920x1080, 1366x768)
   - Tablet (768x1024)
   - Mobile (375x667, 414x896)

3. **Network Testing**
   - Slow 3G simulation
   - Offline/online scenarios
   - Connection interruption during exam

### **API Testing with Postman**

Create Postman collection with these endpoints:

```javascript
// Authentication
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

// Exams
GET /api/exam/active/:classId
GET /api/exam/code/:examCode
POST /api/student/join-exam
POST /api/student/exams/:examId/start
POST /api/student/exams/:examId/answer
POST /api/student/exams/:examId/submit

// Teacher
GET /api/teacher/dashboard
POST /api/teacher/exams
GET /api/teacher/exams/:examId
PUT /api/teacher/exams/:examId
DELETE /api/teacher/exams/:examId

// Admin
GET /api/admin/dashboard
GET /api/admin/users
POST /api/admin/users
```

### **Load Testing**
```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery config
artillery quick --count 10 --num 5 http://localhost:5000/api/auth/login
```

## 🐛 **Common Issues & Solutions**

### **Backend Issues**
- **MongoDB Connection:** Ensure MongoDB is running
- **Port Conflicts:** Change PORT in config.env
- **CORS Errors:** Check frontend URL in CORS config

### **Frontend Issues**
- **API Connection:** Verify backend URL in axios config
- **Build Errors:** Clear node_modules and reinstall
- **Socket Connection:** Check Socket.io server URL

### **Exam Issues**
- **Timer Not Working:** Check JavaScript permissions
- **Auto-save Failing:** Verify network connection
- **Questions Not Loading:** Check exam data structure

## 📊 **Performance Benchmarks**

### **Expected Performance**
- Page load time: < 3 seconds
- API response time: < 500ms
- Auto-save response: < 200ms
- Real-time updates: < 100ms latency

### **Scalability Targets**
- Concurrent users: 100+ students
- Simultaneous exams: 10+
- Questions per exam: 100+
- Database queries: < 100ms

## 🔒 **Security Testing**

### **Authentication Security**
- [ ] JWT token expiration
- [ ] Password hashing verification
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection

### **Exam Security**
- [ ] Exam code uniqueness
- [ ] Time-based access control
- [ ] Answer encryption in transit
- [ ] Session hijacking prevention
- [ ] Cheating prevention measures

## 📈 **Analytics Testing**

### **Dashboard Metrics**
- [ ] Student performance analytics
- [ ] Exam completion rates
- [ ] Average scores by subject
- [ ] Time spent per question
- [ ] Most difficult questions

### **Reporting Features**
- [ ] Export results to CSV/PDF
- [ ] Generate performance reports
- [ ] Class-wise analytics
- [ ] Subject-wise performance
- [ ] Trend analysis

## ✅ **Testing Checklist**

### **Pre-deployment**
- [ ] All unit tests pass
- [ ] Integration tests complete
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Performance benchmarks met
- [ ] Security vulnerabilities addressed
- [ ] Database migrations tested
- [ ] Backup/restore procedures verified

### **Post-deployment**
- [ ] Production environment tested
- [ ] SSL certificates verified
- [ ] CDN performance checked
- [ ] Monitoring alerts configured
- [ ] Error logging functional
- [ ] User feedback collected

## 🚨 **Emergency Scenarios**

### **During Live Exam**
1. **Server Crash:** Students can resume from last saved state
2. **Network Issues:** Auto-save ensures minimal data loss
3. **Timer Issues:** Manual time extension by teacher
4. **Question Errors:** Real-time question updates

### **Recovery Procedures**
1. **Database Backup:** Automated daily backups
2. **Session Recovery:** Redis-based session storage
3. **Rollback Plan:** Version-controlled deployments
4. **Communication:** Email/SMS notifications to users

---

## 🎯 **Success Criteria**

The system passes testing when:
- ✅ All user roles can complete their workflows
- ✅ Exams run smoothly without interruption
- ✅ Data integrity is maintained throughout
- ✅ Performance meets specified benchmarks
- ✅ Security measures are effective
- ✅ User experience is intuitive and responsive

---

**Happy Testing! 🚀**

For issues or questions, check the logs in:
- Backend: `Backend/logs/`
- Frontend: Browser Developer Console
- Database: MongoDB logs 