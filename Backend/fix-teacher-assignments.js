const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Class = require('./models/Class');
require('dotenv').config({ path: './config.env' });

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixTeacherAssignments() {
  console.log('🔧 Fixing Teacher Assignment Issues...\n');
  
  try {
    // Get all teachers
    const teachers = await User.find({ role: 'teacher', isActive: true });
    console.log(`Found ${teachers.length} teachers`);
    
    // Get all subjects and classes
    const subjects = await Subject.find({ isActive: true });
    const classes = await Class.find({ isActive: true });
    
    console.log(`Found ${subjects.length} subjects and ${classes.length} classes`);
    
    if (subjects.length === 0 || classes.length === 0) {
      console.log('❌ No subjects or classes found. Please initialize them first.');
      return;
    }
    
    let fixedCount = 0;
    
    for (const teacher of teachers) {
      console.log(`\n👨‍🏫 Processing: ${teacher.firstName} ${teacher.lastName}`);
      
      // Check if teacher has any subject assignments
      const assignedSubjects = await Subject.find({ 
        teachers: teacher._id, 
        isActive: true 
      });
      
      if (assignedSubjects.length === 0) {
        console.log(`   ⚠️  No subject assignments found. Auto-assigning...`);
        
        // Auto-assign teacher to first 3 subjects
        const subjectsToAssign = subjects.slice(0, 3);
        const classesToAssign = classes.slice(0, 3);
        
        for (const subject of subjectsToAssign) {
          // Add teacher to subject
          if (!subject.teachers.includes(teacher._id)) {
            subject.teachers.push(teacher._id);
          }
          
          // Ensure classes are assigned to subject
          for (const cls of classesToAssign) {
            if (!subject.classes.includes(cls._id)) {
              subject.classes.push(cls._id);
            }
          }
          
          await subject.save();
          console.log(`   ✅ Assigned to subject: ${subject.name}`);
        }
        
        // Update teacher's subjects array
        teacher.subjects = subjectsToAssign.map(s => s._id);
        await teacher.save();
        
        fixedCount++;
        console.log(`   ✅ Fixed assignments for ${teacher.firstName} ${teacher.lastName}`);
      } else {
        console.log(`   ✅ Already has ${assignedSubjects.length} subject assignments`);
        
        // Sync User.subjects array with Subject.teachers
        const teacherWithSubjects = await User.findById(teacher._id).populate('subjects');
        if (teacherWithSubjects.subjects.length !== assignedSubjects.length) {
          teacherWithSubjects.subjects = assignedSubjects.map(s => s._id);
          await teacherWithSubjects.save();
          console.log(`   🔧 Synced User.subjects array`);
        }
      }
    }
    
    console.log(`\n📊 Summary: Fixed assignments for ${fixedCount} teachers`);
    console.log('✅ Teacher assignment fix complete!');
    
  } catch (error) {
    console.error('❌ Error fixing assignments:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the fix
fixTeacherAssignments(); 