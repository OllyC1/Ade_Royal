const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seedTestData = require('../utils/seedTestData');
const createDefaultAdmin = require('../utils/createAdmin');

// Load environment variables
dotenv.config({ path: './config.env' });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ade-royal-cbt');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const runSeeder = async () => {
  try {
    console.log('🚀 Starting database seeding...\n');
    
    // Connect to database
    await connectDB();
    
    // Create default admin first
    console.log('👑 Creating default admin...');
    await createDefaultAdmin();
    
    // Seed test data
    await seedTestData();
    
    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n🌐 You can now access the application at:');
    console.log('Frontend: http://localhost:3000');
    console.log('Backend: http://localhost:5000');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the seeder
runSeeder(); 