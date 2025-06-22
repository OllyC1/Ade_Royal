const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

const seedTestData = async () => {
  try {
    console.log('🌱 Seeding test data...');

    // Clear existing data
    await User.deleteMany({ email: { $ne: 'admin@aderoyal.edu.ng' } });
    await Class.deleteMany({});
    await Subject.deleteMany({});
    await Question.deleteMany({});
    await Exam.deleteMany({});

    // Create Test Classes
    const classes = await Class.insertMany([
      { name: 'JSS1', level: 'Junior', description: 'Junior Secondary School 1' },
      { name: 'JSS2', level: 'Junior', description: 'Junior Secondary School 2' },
      { name: 'JSS3', level: 'Junior', description: 'Junior Secondary School 3' },
      { name: 'SS1', level: 'Senior', description: 'Senior Secondary School 1' },
      { name: 'SS2', level: 'Senior', description: 'Senior Secondary School 2' },
      { name: 'SS3', level: 'Senior', description: 'Senior Secondary School 3' },
    ]);

    console.log('✅ Classes created');

    // Create Subjects
    const subjects = await Subject.insertMany([
      { name: 'Mathematics', code: 'MATH', description: 'Mathematics subject' },
      { name: 'English Language', code: 'ENG', description: 'English Language subject' },
      { name: 'Physics', code: 'PHY', description: 'Physics subject' },
      { name: 'Chemistry', code: 'CHEM', description: 'Chemistry subject' },
      { name: 'Biology', code: 'BIO', description: 'Biology subject' },
      { name: 'Computer Science', code: 'CS', description: 'Computer Science subject' },
    ]);

    console.log('✅ Subjects created');

    // Create Test Teacher
    const teacher = await User.create({
      firstName: 'John',
      lastName: 'Teacher',
      email: 'teacher@aderoyal.edu.ng',
      password: 'teacher123', // Let the User model's pre-save middleware hash this
      role: 'teacher',
      teacherId: 'TCH001',
      subjects: [subjects[0]._id, subjects[1]._id], // Math and English
      isActive: true,
    });

    console.log('✅ Test teacher created');

    // Create Test Students
    const students = [];
    
    for (let i = 1; i <= 5; i++) {
      const student = await User.create({
        firstName: `Student${i}`,
        lastName: 'Test',
        email: `student${i}@aderoyal.edu.ng`,
        password: 'student123', // Let the User model's pre-save middleware hash this
        role: 'student',
        studentId: `STD00${i}`,
        class: classes[0]._id, // JSS1
        isActive: true,
      });
      students.push(student);
    }

    console.log('✅ Test students created');

    // Create Sample Questions for Mathematics
    const mathQuestions = await Question.insertMany([
      {
        questionText: 'What is 2 + 2?',
        questionType: 'Objective',
        subject: subjects[0]._id, // Mathematics
        class: classes[0]._id, // JSS1
        teacher: teacher._id,
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false },
          { text: '6', isCorrect: false },
        ],
        correctAnswer: '4',
        marks: 2,
        difficulty: 'Easy',
        createdBy: teacher._id,
      },
      {
        questionText: 'Solve for x: 2x + 5 = 15',
        questionType: 'Objective',
        subject: subjects[0]._id,
        class: classes[0]._id,
        teacher: teacher._id,
        options: [
          { text: 'x = 5', isCorrect: true },
          { text: 'x = 10', isCorrect: false },
          { text: 'x = 7', isCorrect: false },
          { text: 'x = 3', isCorrect: false },
        ],
        correctAnswer: 'x = 5',
        marks: 3,
        difficulty: 'Medium',
        createdBy: teacher._id,
      },
      {
        questionText: 'What is the area of a circle with radius 5cm? (Use π = 3.14)',
        questionType: 'Objective',
        subject: subjects[0]._id,
        class: classes[0]._id,
        teacher: teacher._id,
        options: [
          { text: '78.5 cm²', isCorrect: true },
          { text: '31.4 cm²', isCorrect: false },
          { text: '15.7 cm²', isCorrect: false },
          { text: '25 cm²', isCorrect: false },
        ],
        correctAnswer: '78.5 cm²',
        marks: 4,
        difficulty: 'Medium',
        createdBy: teacher._id,
      },
      {
        questionText: 'Explain the Pythagorean theorem and provide an example of its application.',
        questionType: 'Theory',
        subject: subjects[0]._id,
        class: classes[0]._id,
        teacher: teacher._id,
        marks: 10,
        difficulty: 'Hard',
        createdBy: teacher._id,
        expectedAnswer: 'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.',
      },
      {
        questionText: 'Solve the quadratic equation: x² - 5x + 6 = 0. Show all working steps.',
        questionType: 'Theory',
        subject: subjects[0]._id,
        class: classes[0]._id,
        teacher: teacher._id,
        marks: 8,
        difficulty: 'Hard',
        createdBy: teacher._id,
        expectedAnswer: 'Using factorization: (x-2)(x-3) = 0, therefore x = 2 or x = 3',
      },
    ]);

    console.log('✅ Mathematics questions created');

    // Create Sample Questions for English
    const englishQuestions = await Question.insertMany([
      {
        questionText: 'Which of the following is a noun?',
        questionType: 'Objective',
        subject: subjects[1]._id, // English
        class: classes[0]._id, // JSS1
        teacher: teacher._id,
        options: [
          { text: 'Run', isCorrect: false },
          { text: 'Beautiful', isCorrect: false },
          { text: 'Book', isCorrect: true },
          { text: 'Quickly', isCorrect: false },
        ],
        correctAnswer: 'Book',
        marks: 2,
        difficulty: 'Easy',
        createdBy: teacher._id,
      },
      {
        questionText: 'What is the past tense of "go"?',
        questionType: 'Objective',
        subject: subjects[1]._id,
        class: classes[0]._id,
        teacher: teacher._id,
        options: [
          { text: 'Goed', isCorrect: false },
          { text: 'Went', isCorrect: true },
          { text: 'Gone', isCorrect: false },
          { text: 'Going', isCorrect: false },
        ],
        correctAnswer: 'Went',
        marks: 2,
        difficulty: 'Easy',
        createdBy: teacher._id,
      },
      {
        questionText: 'Write a short essay (150 words) about the importance of education.',
        questionType: 'Theory',
        subject: subjects[1]._id,
        class: classes[0]._id,
        teacher: teacher._id,
        marks: 15,
        difficulty: 'Medium',
        createdBy: teacher._id,
        expectedAnswer: 'Education is fundamental for personal development, critical thinking, and societal progress.',
      },
    ]);

    console.log('✅ English questions created');

    // Create Sample Exam
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1); // Start in 1 hour
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2); // End 2 hours after start

    const sampleExam = await Exam.create({
      title: 'Mathematics Mid-Term Test',
      description: 'Sample mathematics exam for testing purposes',
      subject: subjects[0]._id,
      class: classes[0]._id,
      teacher: teacher._id,
      questions: mathQuestions.map(q => q._id),
      duration: 60, // 60 minutes
      totalMarks: mathQuestions.reduce((sum, q) => sum + q.marks, 0),
      passingMarks: 15,
      startTime: startTime,
      endTime: endTime,
      instructions: 'Read all questions carefully. Answer all questions. Show your working for theory questions.',
      examCode: 'MATH001',
      isActive: true,
      allowReview: true,
      shuffleQuestions: true,
      shuffleOptions: true,
    });

    console.log('✅ Sample exam created');

    // Create another exam that's currently active
    const activeStartTime = new Date();
    activeStartTime.setMinutes(activeStartTime.getMinutes() - 30); // Started 30 minutes ago
    
    const activeEndTime = new Date();
    activeEndTime.setHours(activeEndTime.getHours() + 1); // Ends in 1 hour

    const activeExam = await Exam.create({
      title: 'English Language Quiz',
      description: 'Active English quiz for immediate testing',
      subject: subjects[1]._id,
      class: classes[0]._id,
      teacher: teacher._id,
      questions: englishQuestions.map(q => q._id),
      duration: 45,
      totalMarks: englishQuestions.reduce((sum, q) => sum + q.marks, 0),
      passingMarks: 10,
      startTime: activeStartTime,
      endTime: activeEndTime,
      instructions: 'This is an active exam. You can join immediately for testing.',
      examCode: 'ENG001',
      isActive: true,
      allowReview: true,
      shuffleQuestions: false,
      shuffleOptions: false,
    });

    console.log('✅ Active exam created');

    console.log('\n🎉 Test data seeding completed successfully!');
    console.log('\n📋 Test Accounts Created:');
    console.log('👨‍🏫 Teacher: teacher@aderoyal.edu.ng / teacher123');
    console.log('👨‍🎓 Students: student1@aderoyal.edu.ng to student5@aderoyal.edu.ng / student123');
    console.log('\n📚 Sample Exams:');
    console.log(`📝 Mathematics Mid-Term Test - Code: ${sampleExam.examCode} (Starts in 1 hour)`);
    console.log(`📝 English Language Quiz - Code: ${activeExam.examCode} (Active now!)`);
    console.log('\n🚀 You can now test the system with this sample data!');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
};

module.exports = seedTestData; 