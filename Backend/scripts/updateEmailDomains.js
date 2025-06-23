const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateEmailDomains = async () => {
  try {
    console.log('🔄 Starting email domain update...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all users with old domain
    const usersWithOldDomain = await User.find({
      email: { $regex: /@aderoyal\.edu\.ng$/ }
    });

    console.log(`📊 Found ${usersWithOldDomain.length} users with old domain`);

    if (usersWithOldDomain.length === 0) {
      console.log('✅ No users found with old domain. All emails are up to date!');
      await mongoose.connection.close();
      return;
    }

    // Update each user's email
    let updatedCount = 0;
    for (const user of usersWithOldDomain) {
      const oldEmail = user.email;
      const newEmail = oldEmail.replace('@aderoyal.edu.ng', '@aderoyalschools.org.ng');
      
      console.log(`🔄 Updating: ${oldEmail} → ${newEmail}`);
      
      // Check if new email already exists
      const existingUser = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
      if (existingUser) {
        console.log(`⚠️  Skipping ${oldEmail} - ${newEmail} already exists`);
        continue;
      }

      // Update the user's email
      user.email = newEmail;
      await user.save();
      updatedCount++;
    }

    console.log(`✅ Successfully updated ${updatedCount} email addresses`);
    console.log('🎉 Email domain update completed!');
    
    // Display summary
    console.log('\n📋 Summary:');
    console.log(`- Users found with old domain: ${usersWithOldDomain.length}`);
    console.log(`- Users successfully updated: ${updatedCount}`);
    console.log(`- Users skipped (duplicates): ${usersWithOldDomain.length - updatedCount}`);

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error updating email domains:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the update if this file is executed directly
if (require.main === module) {
  updateEmailDomains();
}

module.exports = updateEmailDomains; 