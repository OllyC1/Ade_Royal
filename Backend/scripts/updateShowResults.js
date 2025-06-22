const mongoose = require('mongoose');
const Exam = require('../models/Exam');
require('dotenv').config({ path: './config.env' });

const updateShowResults = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Update all exams to have showResults: true if it's currently false
    const result = await Exam.updateMany(
      { 'settings.showResults': false },
      { $set: { 'settings.showResults': true } }
    );

    console.log(`Updated ${result.modifiedCount} exams to enable showResults`);

    // Also update any exams that don't have the showResults field at all
    const result2 = await Exam.updateMany(
      { 'settings.showResults': { $exists: false } },
      { $set: { 'settings.showResults': true } }
    );

    console.log(`Updated ${result2.modifiedCount} exams to add showResults field`);

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
updateShowResults(); 