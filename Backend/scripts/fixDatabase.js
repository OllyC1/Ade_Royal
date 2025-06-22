const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

async function fixDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Drop the entire subjects collection to start fresh
    try {
      await mongoose.connection.db.collection('subjects').drop();
      console.log('✅ Dropped entire subjects collection');
    } catch (error) {
      console.log('ℹ️ Subjects collection may not exist:', error.message);
    }

    // Recreate the collection with proper indexes
    const subjectsCollection = mongoose.connection.db.collection('subjects');
    
    // Create sparse unique index for code field (allows multiple null values)
    await subjectsCollection.createIndex(
      { code: 1 }, 
      { 
        unique: true, 
        sparse: true,
        background: true
      }
    );
    console.log('✅ Created sparse unique index for code field');

    // Create other useful indexes
    await subjectsCollection.createIndex({ name: 1 }, { unique: true });
    await subjectsCollection.createIndex({ level: 1 });
    await subjectsCollection.createIndex({ category: 1 });
    await subjectsCollection.createIndex({ departments: 1 });
    console.log('✅ Created additional indexes');

    console.log('🎉 Database fixed successfully!');
    console.log('⚠️ Please restart the server to reinitialize Nigerian subjects');

  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

fixDatabase(); 