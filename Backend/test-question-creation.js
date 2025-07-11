const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Class = require('./models/Class');
const Question = require('./models/Question');
require('dotenv').config({ path: './config.env' });

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testQuestionCreation() {
  console.log('🧪 Testing Question Creation System...\n');
  
  try {
    // 1. Check if we have teachers
    const teachers = await User.find({ role: 'teacher', isActive: true });
    console.log(`📊 Found ${teachers.length} active teachers`);
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found! Creating a test teacher...');
      
      const testTeacher = new User({
        firstName: 'Test',
        lastName: 'Teacher',
        email: 'test.teacher@aderoyal.edu.ng',
        password: 'password123',
        role: 'teacher',
        teacherId: 'T001',
        subjects: []
      });
      
      await testTeacher.save();
      console.log('✅ Test teacher created:', testTeacher.email);
      teachers.push(testTeacher);
    }
    
    // 2. Check subjects
    const subjects = await Subject.find({ isActive: true });
    console.log(`📚 Found ${subjects.length} active subjects`);
    
    if (subjects.length === 0) {
      console.log('❌ No subjects found! This is a critical issue.');
      return;
    }
    
    // 3. Check classes
    const classes = await Class.find({ isActive: true });
    console.log(`🏫 Found ${classes.length} active classes`);
    
    if (classes.length === 0) {
      console.log('❌ No classes found! This is a critical issue.');
      return;
    }
    
    // 4. Check teacher-subject assignments
    let assignmentIssues = [];
    
    for (const teacher of teachers) {
      console.log(`\n👨‍🏫 Checking teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
      
      // Check subjects assigned to this teacher
      const teacherSubjects = await Subject.find({ 
        teachers: teacher._id, 
        isActive: true 
      });
      
      console.log(`   📖 Subjects assigned via Subject.teachers: ${teacherSubjects.length}`);
      
      // Check if User.subjects array is populated
      const teacherWithSubjects = await User.findById(teacher._id).populate('subjects');
      console.log(`   📝 Subjects in User.subjects array: ${teacherWithSubjects.subjects.length}`);
      
      // Fix assignment if needed
      if (teacherSubjects.length > 0 && teacherWithSubjects.subjects.length === 0) {
        console.log(`   🔧 Fixing User.subjects array...`);
        teacherWithSubjects.subjects = teacherSubjects.map(s => s._id);
        await teacherWithSubjects.save();
        console.log(`   ✅ Fixed User.subjects array`);
      }
      
      // If teacher has no subjects assigned, assign them to some subjects
      if (teacherSubjects.length === 0) {
        console.log(`   ⚠️  Teacher has no subject assignments!`);
        assignmentIssues.push({
          teacher: teacher,
          issue: 'No subject assignments'
        });
        
        // Auto-assign to first 2 subjects and first 2 classes
        const subjectsToAssign = subjects.slice(0, 2);
        const classesToAssign = classes.slice(0, 2);
        
        for (const subject of subjectsToAssign) {
          if (!subject.teachers.includes(teacher._id)) {
            subject.teachers.push(teacher._id);
          }
          
          // Ensure classes are assigned to subject
          for (const cls of classesToAssign) {
            if (!subject.classes.includes(cls._id)) {
              subject.classes.push(cls._id);
            }
          }
          
          await subject.save();
        }
        
        // Update teacher's subjects array
        teacher.subjects = subjectsToAssign.map(s => s._id);
        await teacher.save();
        
        console.log(`   ✅ Auto-assigned teacher to ${subjectsToAssign.length} subjects`);
      }
    }
    
    // 5. Test question creation for each teacher
    console.log('\n🧪 Testing Question Creation...');
    
    for (const teacher of teachers) {
      console.log(`\n👨‍🏫 Testing for teacher: ${teacher.firstName} ${teacher.lastName}`);
      
      const teacherSubjects = await Subject.find({ 
        teachers: teacher._id, 
        isActive: true 
      }).populate('classes');
      
      if (teacherSubjects.length === 0) {
        console.log(`   ❌ No subjects assigned to this teacher`);
        continue;
      }
      
      const testSubject = teacherSubjects[0];
      const testClass = testSubject.classes[0];
      
      if (!testClass) {
        console.log(`   ❌ No classes assigned to subject: ${testSubject.name}`);
        continue;
      }
      
      // Create test question
      const testQuestion = {
        questionText: 'What is the capital of Nigeria?',
        questionType: 'Objective',
        subject: testSubject._id,
        class: testClass._id,
        teacher: teacher._id,
        marks: 1,
        difficulty: 'Easy',
        options: [
          { text: 'Lagos', isCorrect: false },
          { text: 'Abuja', isCorrect: true },
          { text: 'Kano', isCorrect: false },
          { text: 'Port Harcourt', isCorrect: false }
        ],
        explanation: 'Abuja is the capital city of Nigeria.',
        topic: 'Geography',
        tags: ['geography', 'capital', 'nigeria']
      };
      
      try {
        const question = new Question(testQuestion);
        await question.save();
        console.log(`   ✅ Successfully created test question: ${question._id}`);
        
        // Clean up test question
        await Question.findByIdAndDelete(question._id);
        console.log(`   🧹 Cleaned up test question`);
        
      } catch (error) {
        console.log(`   ❌ Failed to create test question:`, error.message);
        
        // Detailed error analysis
        if (error.message.includes('validation failed')) {
          console.log(`   📝 Validation error details:`, error.errors);
        }
      }
    }
    
    // 6. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Teachers: ${teachers.length}`);
    console.log(`   Subjects: ${subjects.length}`);
    console.log(`   Classes: ${classes.length}`);
    console.log(`   Assignment Issues: ${assignmentIssues.length}`);
    
    if (assignmentIssues.length > 0) {
      console.log('\n⚠️  ASSIGNMENT ISSUES FOUND:');
      assignmentIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.teacher.firstName} ${issue.teacher.lastName}: ${issue.issue}`);
      });
    }
    
    console.log('\n✅ Question Creation Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testQuestionCreation(); 