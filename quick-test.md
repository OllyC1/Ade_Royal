# 🚀 Quick Test Guide - Ade-Royal CBT System

## ⚡ Instant Setup (5 minutes)

### 1. **Start the System**
```bash
# Terminal 1 - Backend
cd Backend
npm start

# Terminal 2 - Frontend  
cd Frontend
npm start
```

### 2. **Seed Test Data** (Optional but Recommended)
```bash
# In Backend directory
npm run seed
```

### 3. **Access the Application**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

## 🔑 **Test Accounts**

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Admin** | admin@aderoyalschools.org.ng | admin123 | System management |
| **Teacher** | teacher@aderoyalschools.org.ng | teacher123 | Create/manage exams |
| **Student** | student1@aderoyalschools.org.ng | student123 | Take exams |

---

## 🎯 **5-Minute Test Scenarios**

### **Scenario A: Student Takes Exam**
1. **Login as Student** → http://localhost:3000/login
2. **Join Active Exam** → Use code: `ENG001`
3. **Take the Quiz** → Answer questions, test timer
4. **Submit & View Results** → Check exam history

### **Scenario B: Teacher Creates Exam**
1. **Login as Teacher** → http://localhost:3000/login
2. **Create New Exam** → Add questions, set timing
3. **Monitor Live Exam** → Watch student progress
4. **Grade Theory Questions** → Review submissions

### **Scenario C: Admin Overview**
1. **Login as Admin** → http://localhost:3000/login
2. **View Dashboard** → Check system stats
3. **Manage Users** → Create/edit accounts
4. **System Analytics** → Performance metrics

---

## 🧪 **Quick Feature Tests**

### ✅ **Core Features to Verify**
- [ ] **Login/Registration** works for all roles
- [ ] **Exam Code System** - Use `ENG001` (active) or `MATH001` (upcoming)
- [ ] **Real-time Timer** - Counts down during exam
- [ ] **Auto-save** - Answers saved every 10 seconds
- [ ] **Question Navigation** - Previous/Next buttons work
- [ ] **Flag Questions** - Mark questions for review
- [ ] **Submit Exam** - Confirmation modal appears
- [ ] **View Results** - Scores and grades display
- [ ] **Responsive Design** - Works on mobile/tablet

### 🔧 **Advanced Features**
- [ ] **Socket.io** - Real-time updates work
- [ ] **Session Recovery** - Resume after disconnect
- [ ] **Prevent Cheating** - Browser restrictions active
- [ ] **Grade Theory** - Manual grading interface
- [ ] **Analytics** - Performance charts display

---

## 🐛 **Common Issues & Quick Fixes**

### **Backend Won't Start**
```bash
# Check if MongoDB is running
mongod --version

# Install dependencies
npm install

# Check port availability
netstat -an | findstr :5000
```

### **Frontend Won't Start**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check port availability  
netstat -an | findstr :3000
```

### **Database Connection Issues**
```bash
# Start MongoDB locally
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in Backend/config.env
```

### **CORS Errors**
- Ensure backend is running on port 5000
- Check frontend is on port 3000
- Verify CORS settings in backend

---

## 📱 **Mobile Testing**

### **Chrome DevTools**
1. Press `F12` → Toggle device toolbar
2. Test on iPhone/Android sizes
3. Verify touch interactions work
4. Check responsive layout

### **Real Device Testing**
1. Connect to same WiFi network
2. Access via your computer's IP:
   - Frontend: `http://YOUR_IP:3000`
   - Backend: `http://YOUR_IP:5000`

---

## 🎉 **Success Indicators**

### **System is Working When:**
- ✅ All three dashboards load correctly
- ✅ Students can join and complete exams
- ✅ Teachers can create and monitor exams  
- ✅ Real-time features update live
- ✅ Grades calculate automatically
- ✅ Mobile interface is responsive

### **Performance Benchmarks:**
- Page loads: < 3 seconds
- API responses: < 500ms
- Auto-save: < 200ms
- Real-time updates: < 100ms

---

## 🆘 **Need Help?**

### **Check Logs:**
- **Backend:** Terminal running `npm start`
- **Frontend:** Browser Developer Console (F12)
- **Database:** MongoDB logs

### **Test Data:**
- **Active Exam:** Code `ENG001` (English Quiz)
- **Upcoming Exam:** Code `MATH001` (Math Test)
- **Sample Questions:** Mix of objective and theory
- **Test Students:** student1-5@aderoyalschools.org.ng

---

**🚀 Ready to test? Start with Scenario A above!** 