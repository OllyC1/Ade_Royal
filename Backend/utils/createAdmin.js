const User = require('../models/User');

const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create default admin user
    const adminData = {
      firstName: 'System',
      lastName: 'Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@aderoyal.edu.ng',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      isActive: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Default admin user created successfully');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Password: ${adminData.password}`);
    console.log('⚠️  Please change the default password after first login');
    
  } catch (error) {
    console.error('❌ Error creating default admin user:', error.message);
  }
};

module.exports = createDefaultAdmin; 