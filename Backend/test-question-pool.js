const mongoose = require('mongoose');
const Question = require('./models/Question');
const Exam = require('./models/Exam');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Class = require('./models/Class');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ade_royal_cbt', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testQuestionPool() {
  try {
    console.log('🧪 Testing Question Pool Functionality...\n');

    // Get a teacher
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.log('❌ No teacher found');
      return;
    }
    console.log(`✅ Found teacher: ${teacher.name}`);

    // Get a subject and class
    const subject = await Subject.findOne();
    const classDoc = await Class.findOne();
    
    if (!subject || !classDoc) {
      console.log('❌ No subject or class found');
      return;
    }
    console.log(`✅ Found subject: ${subject.name}, class: ${classDoc.name}`);

    // Create some test questions
    const testQuestions = [
      {
        questionText: 'What is 2 + 2?',
        questionType: 'Objective',
        marks: 2,
        correctAnswer: '4',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false },
          { text: '6', isCorrect: false }
        ],
        subject: subject._id,
        class: classDoc._id,
        teacher: teacher._id,
        difficulty: 'Easy'
      },
      {
        questionText: 'What is 3 + 3?',
        questionType: 'Objective',
        marks: 2,
        correctAnswer: '6',
        options: [
          { text: '5', isCorrect: false },
          { text: '6', isCorrect: true },
          { text: '7', isCorrect: false },
          { text: '8', isCorrect: false }
        ],
        subject: subject._id,
        class: classDoc._id,
        teacher: teacher._id,
        difficulty: 'Easy'
      },
      {
        questionText: 'Explain the concept of addition.',
        questionType: 'Theory',
        marks: 5,
        expectedAnswer: 'Addition is the process of combining numbers to find their sum.',
        subject: subject._id,
        class: classDoc._id,
        teacher: teacher._id,
        difficulty: 'Medium'
      },
      {
        questionText: 'What is 4 + 4?',
        questionType: 'Objective',
        marks: 2,
        correctAnswer: '8',
        options: [
          { text: '6', isCorrect: false },
          { text: '7', isCorrect: false },
          { text: '8', isCorrect: true },
          { text: '9', isCorrect: false }
        ],
        subject: subject._id,
        class: classDoc._id,
        teacher: teacher._id,
        difficulty: 'Easy'
      }
    ];

    // Save questions
    const savedQuestions = await Question.insertMany(testQuestions);
    console.log(`✅ Created ${savedQuestions.length} test questions`);

    // Test question pool selection
    const objectiveQuestions = savedQuestions.filter(q => q.questionType === 'Objective');
    const theoryQuestions = savedQuestions.filter(q => q.questionType === 'Theory');

    const questionPool = {
      objective: {
        questions: objectiveQuestions.map(q => q._id),
        totalMarks: objectiveQuestions.reduce((sum, q) => sum + q.marks, 0)
      },
      theory: {
        questions: theoryQuestions.map(q => q._id),
        totalMarks: theoryQuestions.reduce((sum, q) => sum + q.marks, 0)
      }
    };

    const questionSelection = {
      objective: {
        count: 2, // Select 2 out of 3 objective questions
        totalMarks: Math.round((questionPool.objective.totalMarks / objectiveQuestions.length) * 2)
      },
      theory: {
        count: 1, // Select 1 out of 1 theory question
        totalMarks: questionPool.theory.totalMarks
      }
    };

    console.log('\n📊 Question Pool Summary:');
    console.log(`Objective: ${questionPool.objective.questions.length} questions, ${questionPool.objective.totalMarks} total marks`);
    console.log(`Theory: ${questionPool.theory.questions.length} questions, ${questionPool.theory.totalMarks} total marks`);

    console.log('\n🎯 Selection Summary:');
    console.log(`Objective: ${questionSelection.objective.count} questions, ${questionSelection.objective.totalMarks} total marks`);
    console.log(`Theory: ${questionSelection.theory.count} questions, ${questionSelection.theory.totalMarks} total marks`);

    // Test exam creation with question pool
    const examData = {
      title: 'Test Question Pool Exam',
      subject: subject._id,
      class: classDoc._id,
      description: 'Testing question pool functionality',
      duration: 30,
      totalMarks: questionSelection.objective.totalMarks + questionSelection.theory.totalMarks,
      passingMarks: 5,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      instructions: 'Test instructions',
      examType: 'Mixed',
      useQuestionBank: true,
      questionBankSelection: {
        objective: {
          count: questionSelection.objective.count,
          totalMarks: questionSelection.objective.totalMarks,
          questions: questionPool.objective.questions
        },
        theory: {
          count: questionSelection.theory.count,
          totalMarks: questionSelection.theory.totalMarks,
          questions: questionPool.theory.questions
        }
      }
    };

    const exam = new Exam({
      ...examData,
      teacher: teacher._id,
      status: 'Draft'
    });

    await exam.save();
    console.log('\n✅ Created exam with question pool');

    // Test random question generation
    const randomQuestions = await exam.generateRandomQuestions();
    console.log('\n🎲 Generated Random Questions:');
    console.log(`Objective: ${randomQuestions.objective.length} questions`);
    console.log(`Theory: ${randomQuestions.theory.length} questions`);

    // Verify counts match selection
    if (randomQuestions.objective.length === questionSelection.objective.count &&
        randomQuestions.theory.length === questionSelection.theory.count) {
      console.log('✅ Random question generation works correctly!');
    } else {
      console.log('❌ Random question generation failed!');
    }

    // Clean up
    await Question.deleteMany({ _id: { $in: savedQuestions.map(q => q._id) } });
    await Exam.findByIdAndDelete(exam._id);
    console.log('\n🧹 Cleaned up test data');

    console.log('\n🎉 Question Pool Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testQuestionPool(); 