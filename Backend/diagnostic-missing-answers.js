/**
 * Diagnostic Script: Missing Answers Investigation
 * 
 * This script analyzes submitted exams to find cases where students might be missing answers
 * during the submission process.
 * 
 * Usage: node diagnostic-missing-answers.js [examId]
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Exam = require('./models/Exam');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for diagnostics');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const analyzeMissingAnswers = async (examId = null) => {
  try {
    console.log('=== MISSING ANSWERS DIAGNOSTIC REPORT ===');
    console.log('Timestamp:', new Date().toISOString());
    
    let query = {};
    if (examId) {
      query._id = examId;
      console.log('Analyzing specific exam:', examId);
    } else {
      // Look at recent exams (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.createdAt = { $gte: sevenDaysAgo };
      console.log('Analyzing recent exams (last 7 days)');
    }

    const exams = await Exam.find(query)
      .populate('subject', 'name')
      .populate('class', 'name')
      .populate('teacher', 'firstName lastName')
      .lean();

    console.log(`Found ${exams.length} exams to analyze\n`);

    let totalIssues = 0;
    let totalStudentsAffected = 0;

    for (const exam of exams) {
      console.log(`\n--- EXAM: ${exam.title} ---`);
      console.log(`Subject: ${exam.subject?.name || 'Unknown'}`);
      console.log(`Class: ${exam.class?.name || 'Unknown'}`);
      console.log(`Teacher: ${exam.teacher?.firstName} ${exam.teacher?.lastName}`);
      console.log(`Total Questions: ${exam.embeddedQuestions?.length || exam.questions?.length || 0}`);
      console.log(`Total Marks: ${exam.totalMarks}`);
      
      if (!exam.attempts || exam.attempts.length === 0) {
        console.log('No attempts found for this exam');
        continue;
      }

      const completedAttempts = exam.attempts.filter(att => att.isCompleted);
      console.log(`Completed Attempts: ${completedAttempts.length}`);

      if (completedAttempts.length === 0) {
        console.log('No completed attempts to analyze');
        continue;
      }

      const totalQuestions = exam.embeddedQuestions?.length || exam.questions?.length || 0;
      let examIssues = 0;

      for (const attempt of completedAttempts) {
        try {
          // Get student info
          const student = await User.findById(attempt.student).select('firstName lastName email').lean();
          const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
          const answersCount = attempt.answers?.length || 0;
          
          console.log(`\n  Student: ${studentName}`);
          console.log(`  Email: ${student?.email || 'Unknown'}`);
          console.log(`  Submitted: ${attempt.submittedAt}`);
          console.log(`  Answers Provided: ${answersCount}/${totalQuestions}`);
          
          // Check for potential issues
          const issues = [];
          
          // Issue 1: Missing answers (answered fewer than total questions)
          if (answersCount < totalQuestions) {
            const missingCount = totalQuestions - answersCount;
            issues.push(`Missing ${missingCount} answers`);
          }
          
          // Issue 2: Duplicate question numbers
          if (attempt.answers && attempt.answers.length > 0) {
            const questionNumbers = attempt.answers.map(ans => ans.questionNumber).filter(num => num != null);
            const uniqueNumbers = [...new Set(questionNumbers)];
            if (questionNumbers.length !== uniqueNumbers.length) {
              issues.push('Duplicate question numbers detected');
            }
          }
          
          // Issue 3: Empty or null answers
          if (attempt.answers && attempt.answers.length > 0) {
            const emptyAnswers = attempt.answers.filter(ans => 
              ans.answer === null || 
              ans.answer === undefined || 
              ans.answer === '' ||
              (typeof ans.answer === 'string' && ans.answer.trim() === '')
            );
            if (emptyAnswers.length > 0) {
              issues.push(`${emptyAnswers.length} empty/null answers`);
            }
          }
          
          // Issue 4: Question ID mismatches
          if (attempt.answers && attempt.answers.length > 0 && exam.embeddedQuestions) {
            const unmatchedAnswers = attempt.answers.filter(ans => {
              if (!ans.questionNumber) return true;
              const question = exam.embeddedQuestions.find(q => q.questionNumber === ans.questionNumber);
              return !question;
            });
            if (unmatchedAnswers.length > 0) {
              issues.push(`${unmatchedAnswers.length} answers with unmatched question numbers`);
            }
          }
          
          // Issue 5: Score discrepancies
          const actualScore = attempt.actualScore || attempt.score || 0;
          const answeredQuestions = attempt.answers?.filter(ans => 
            ans.answer !== null && ans.answer !== undefined && ans.answer !== ''
          ).length || 0;
          
          if (actualScore === 0 && answeredQuestions > 0) {
            issues.push('Zero score despite having answers');
          }
          
          if (issues.length > 0) {
            console.log(`  🚨 ISSUES FOUND:`);
            issues.forEach(issue => console.log(`    - ${issue}`));
            examIssues++;
            
            // Show detailed answer breakdown for problematic attempts
            console.log(`  Answer Details:`);
            if (attempt.answers && attempt.answers.length > 0) {
              attempt.answers.forEach((ans, index) => {
                console.log(`    Q${ans.questionNumber || index + 1}: ${JSON.stringify(ans.answer)} (${ans.answeredAt || 'No timestamp'})`);
              });
            } else {
              console.log(`    No answers recorded`);
            }
          } else {
            console.log(`  ✅ No issues detected`);
          }
          
        } catch (error) {
          console.error(`  Error analyzing attempt:`, error.message);
        }
      }
      
      if (examIssues > 0) {
        console.log(`\n  EXAM SUMMARY: ${examIssues}/${completedAttempts.length} students have issues`);
        totalIssues += examIssues;
        totalStudentsAffected += examIssues;
      }
    }
    
    console.log(`\n=== DIAGNOSTIC SUMMARY ===`);
    console.log(`Total Exams Analyzed: ${exams.length}`);
    console.log(`Total Students with Issues: ${totalStudentsAffected}`);
    console.log(`Total Issues Found: ${totalIssues}`);
    
    if (totalIssues > 0) {
      console.log(`\n🚨 RECOMMENDED ACTIONS:`);
      console.log(`1. Check Render logs during exam submission times`);
      console.log(`2. Implement additional auto-save mechanisms`);
      console.log(`3. Add frontend validation before submission`);
      console.log(`4. Consider implementing submission retry logic`);
      console.log(`5. Add database transaction handling for answer saves`);
    }
    
  } catch (error) {
    console.error('Error in diagnostic analysis:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    
    const examId = process.argv[2];
    await analyzeMissingAnswers(examId);
    
  } catch (error) {
    console.error('Diagnostic script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDiagnostic completed');
  }
};

// Run the diagnostic
if (require.main === module) {
  main();
}

module.exports = { analyzeMissingAnswers }; 