const mongoose = require('mongoose');
require('dotenv').config({ path: '../config.env' });

// Import models
const Exam = require('../models/Exam');

const fixExistingResults = async () => {
  try {
    console.log('🔧 Starting to fix existing exam results...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all exams with completed attempts
    const exams = await Exam.find({
      'attempts.isCompleted': true
    });

    console.log(`📋 Found ${exams.length} exams with completed attempts`);

    let updatedCount = 0;

    for (const exam of exams) {
      let examUpdated = false;

      for (const attempt of exam.attempts) {
        if (attempt.isCompleted) {
          // Add missing fields for existing attempts
          if (attempt.resultsReleased === undefined) {
            attempt.resultsReleased = false; // Default to not released
            examUpdated = true;
          }

          if (attempt.actualScore === undefined && attempt.score !== undefined) {
            attempt.actualScore = attempt.score; // Store current score as actual score
            examUpdated = true;
          }

          if (attempt.actualPercentage === undefined && attempt.percentage !== undefined) {
            attempt.actualPercentage = attempt.percentage; // Store current percentage as actual
            examUpdated = true;
          }

          if (attempt.needsGrading === undefined) {
            // Check if exam has theory questions
            const hasTheoryQuestions = exam.embeddedQuestions?.some(q => q.questionType === 'Theory') ||
                                     exam.questions?.some(q => q.questionType === 'Theory');
            attempt.needsGrading = hasTheoryQuestions;
            examUpdated = true;
          }

          // Reset displayed scores to 0 if results haven't been released
          if (!attempt.resultsReleased) {
            if (attempt.score !== 0) {
              attempt.score = 0;
              examUpdated = true;
            }
            if (attempt.percentage !== 0) {
              attempt.percentage = 0;
              examUpdated = true;
            }
          }

          // Add missing fields to answers
          if (attempt.answers) {
            for (const answer of attempt.answers) {
              if (answer.needsGrading === undefined) {
                // Check if this is a theory question
                const question = exam.embeddedQuestions?.find(q => 
                  q.questionNumber === answer.questionNumber
                );
                answer.needsGrading = question?.questionType === 'Theory';
                examUpdated = true;
              }
            }
          }
        }
      }

      if (examUpdated) {
        await exam.save();
        updatedCount++;
        console.log(`✅ Updated exam: ${exam.title} (${exam.examCode})`);
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} exams`);
    console.log('📝 Summary of changes made:');
    console.log('   - Added resultsReleased field (default: false)');
    console.log('   - Added actualScore and actualPercentage fields');
    console.log('   - Added needsGrading fields');
    console.log('   - Reset displayed scores to 0 for unreleased results');
    console.log('   - Added needsGrading to answer objects');

  } catch (error) {
    console.error('❌ Error fixing existing results:', error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run the fix script
fixExistingResults().then(() => {
  console.log('🏁 Fix script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fix script failed:', error);
  process.exit(1);
});

module.exports = fixExistingResults; 