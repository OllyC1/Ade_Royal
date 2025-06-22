const Class = require('../models/Class');
const Subject = require('../models/Subject');

const assignSubjectsToClasses = async () => {
  try {
    console.log('🔄 Starting automatic subject-to-class assignment...');

    // Get all classes and subjects
    const classes = await Class.find({});
    const subjects = await Subject.find({});

    if (classes.length === 0 || subjects.length === 0) {
      console.log('⚠️ No classes or subjects found to assign');
      return;
    }

    let assignmentCount = 0;

    for (const classItem of classes) {
      const classLevel = ['JSS1', 'JSS2', 'JSS3'].includes(classItem.name) ? 'Junior' : 'Senior';
      
      // Find subjects appropriate for this class level
      const appropriateSubjects = subjects.filter(subject => {
        // Include subjects that are for this level or for 'Both' levels
        return subject.level === classLevel || subject.level === 'Both';
      });

      // Get current subject IDs for this class
      const currentSubjectIds = classItem.subjects.map(id => id.toString());
      
      // Add new subjects that aren't already assigned
      let addedSubjects = 0;
      for (const subject of appropriateSubjects) {
        const subjectId = subject._id.toString();
        
        // Add subject to class if not already assigned
        if (!currentSubjectIds.includes(subjectId)) {
          classItem.subjects.push(subject._id);
          addedSubjects++;
        }
        
        // Add class to subject if not already assigned
        const currentClassIds = subject.classes.map(id => id.toString());
        if (!currentClassIds.includes(classItem._id.toString())) {
          subject.classes.push(classItem._id);
          await subject.save();
        }
      }

      if (addedSubjects > 0) {
        await classItem.save();
        assignmentCount += addedSubjects;
        console.log(`✅ Assigned ${addedSubjects} subjects to ${classItem.name}`);
      }
    }

    console.log(`🎉 Assignment complete! Total: ${assignmentCount} subject-class relationships created`);
    return assignmentCount;

  } catch (error) {
    console.error('❌ Error assigning subjects to classes:', error);
    throw error;
  }
};

module.exports = assignSubjectsToClasses; 