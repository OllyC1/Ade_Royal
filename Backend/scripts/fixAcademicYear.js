const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

async function fixAcademicYear() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the classes collection directly
    const db = mongoose.connection.db;
    const classesCollection = db.collection('classes');

    // Find all classes with number academicYear
    const classesWithNumberYear = await classesCollection.find({
      academicYear: { $type: "number" }
    }).toArray();

    console.log(`📋 Found ${classesWithNumberYear.length} classes with numeric academicYear`);

    // Update each class
    for (const classDoc of classesWithNumberYear) {
      const numericYear = classDoc.academicYear;
      const nextYear = numericYear + 1;
      const stringYear = `${numericYear}/${nextYear}`;

      await classesCollection.updateOne(
        { _id: classDoc._id },
        { $set: { academicYear: stringYear } }
      );

      console.log(`✅ Updated ${classDoc.name}: ${numericYear} → ${stringYear}`);
    }

    // Also fix any classes that might have just a single year as string
    const classesWithSingleYear = await classesCollection.find({
      academicYear: { $regex: /^\d{4}$/ }
    }).toArray();

    console.log(`📋 Found ${classesWithSingleYear.length} classes with single year format`);

    for (const classDoc of classesWithSingleYear) {
      const singleYear = parseInt(classDoc.academicYear);
      const nextYear = singleYear + 1;
      const rangeYear = `${singleYear}/${nextYear}`;

      await classesCollection.updateOne(
        { _id: classDoc._id },
        { $set: { academicYear: rangeYear } }
      );

      console.log(`✅ Updated ${classDoc.name}: ${singleYear} → ${rangeYear}`);
    }

    console.log('🎉 Academic year migration completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing academic year:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the migration
fixAcademicYear(); 