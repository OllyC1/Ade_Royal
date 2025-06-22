import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  AcademicCapIcon,
  PencilIcon,
  UserGroupIcon,
  UserIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [assigningSubjects, setAssigningSubjects] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    classTeacher: '',
    subjects: [],
    maxStudents: 40
  });

  // Fixed Nigerian class levels
  const classLevels = [
    { value: 'JSS1', label: 'JSS 1 (Junior Secondary 1)', category: 'Junior' },
    { value: 'JSS2', label: 'JSS 2 (Junior Secondary 2)', category: 'Junior' },
    { value: 'JSS3', label: 'JSS 3 (Junior Secondary 3)', category: 'Junior' },
    { value: 'SS1', label: 'SS 1 (Senior Secondary 1)', category: 'Senior' },
    { value: 'SS2', label: 'SS 2 (Senior Secondary 2)', category: 'Senior' },
    { value: 'SS3', label: 'SS 3 (Senior Secondary 3)', category: 'Senior' }
  ];

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/admin/classes');
      setClasses(response.data.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/api/admin/users?role=teacher&limit=100');
      setTeachers(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/api/admin/subjects');
      setSubjects(response.data.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const initializeClasses = async () => {
    setInitializing(true);
    try {
      await axios.post('/api/admin/classes/initialize');
      toast.success('Nigerian school classes initialized successfully');
      fetchClasses();
    } catch (error) {
      toast.error('Failed to initialize classes');
    } finally {
      setInitializing(false);
    }
  };

  const autoAssignSubjects = async () => {
    setAssigningSubjects(true);
    try {
      const response = await axios.post('/api/admin/classes/assign-subjects');
      toast.success(response.data.message);
      setClasses(response.data.data.classes || []);
    } catch (error) {
      toast.error('Failed to auto-assign subjects to classes');
    } finally {
      setAssigningSubjects(false);
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/classes/${selectedClass._id}`, formData);
      toast.success('Class updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update class');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      classTeacher: '',
      subjects: [],
      maxStudents: 40
    });
    setSelectedClass(null);
  };

  const openEditModal = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      description: classItem.description || '',
      classTeacher: classItem.classTeacher?._id || '',
      subjects: classItem.subjects?.map(s => s._id) || [],
      maxStudents: classItem.maxStudents || 40
    });
    setShowEditModal(true);
  };

  const handleSubjectChange = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId]
    }));
  };

  const getClassCategory = (className) => {
    return ['JSS1', 'JSS2', 'JSS3'].includes(className) ? 'Junior' : 'Senior';
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = !levelFilter || cls.name === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  // Group classes by category for better organization
  const juniorClasses = filteredClasses.filter(cls => getClassCategory(cls.name) === 'Junior');
  const seniorClasses = filteredClasses.filter(cls => getClassCategory(cls.name) === 'Senior');

  if (loading) {
    return <LoadingSpinner text="Loading classes..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Class Management
              </h1>
              <p className="text-gray-600">
                Manage Nigerian school classes (JSS1-SS3) with subjects and teachers
              </p>
            </div>
            <div className="flex space-x-3">
              {classes.length > 0 && (
                <button
                  onClick={autoAssignSubjects}
                  disabled={assigningSubjects}
                  className="btn-secondary flex items-center"
                >
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  {assigningSubjects ? 'Assigning...' : 'Auto-Assign Subjects'}
                </button>
              )}
              {classes.length === 0 && (
                <button
                  onClick={initializeClasses}
                  disabled={initializing}
                  className="btn-primary flex items-center"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {initializing ? 'Initializing...' : 'Initialize Classes'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length}/6</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Junior Classes</p>
                <p className="text-2xl font-bold text-gray-900">{juniorClasses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Senior Classes</p>
                <p className="text-2xl font-bold text-gray-900">{seniorClasses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classes.reduce((sum, cls) => sum + (cls.studentsCount || cls.students?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <select
                className="form-input"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {classLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLevelFilter('');
                }}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Initialize the Nigerian school class structure (JSS1-SS3).
            </p>
            <div className="mt-6">
              <button
                onClick={initializeClasses}
                disabled={initializing}
                className="btn-primary"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {initializing ? 'Initializing...' : 'Initialize Classes'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Junior Secondary Classes */}
            {juniorClasses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Junior Secondary School (JSS)
                  </h3>
                  <p className="text-sm text-gray-500">
                    {juniorClasses.length} class{juniorClasses.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {juniorClasses.map((classItem) => (
                      <div key={classItem._id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                                <AcademicCapIcon className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {classItem.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Junior Secondary {classItem.name.slice(-1)}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => openEditModal(classItem)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                              title="Edit Class"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Students:</span>
                              <div className="flex items-center space-x-1">
                                <UserGroupIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {classItem.studentsCount || classItem.students?.length || 0}/{classItem.maxStudents}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Subjects:</span>
                              <div className="flex items-center space-x-1">
                                <BookOpenIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {classItem.subjects?.length || 0}
                                </span>
                              </div>
                            </div>

                            {/* Display subject names if any */}
                            {classItem.subjects && classItem.subjects.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Assigned Subjects:</p>
                                <div className="flex flex-wrap gap-1">
                                  {classItem.subjects.slice(0, 3).map((subject) => (
                                    <span
                                      key={subject._id}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                    >
                                      {subject.name}
                                    </span>
                                  ))}
                                  {classItem.subjects.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{classItem.subjects.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {classItem.classTeacher && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Class Teacher:</span>
                                <div className="flex items-center space-x-1">
                                  <UserIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium">
                                    {classItem.classTeacher.firstName} {classItem.classTeacher.lastName}
                                  </span>
                                </div>
                              </div>
                            )}

                            {classItem.description && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-600">{classItem.description}</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Academic Year: {classItem.academicYear}</span>
                              <span>Max: {classItem.maxStudents}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Senior Secondary Classes */}
            {seniorClasses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Senior Secondary School (SS)
                  </h3>
                  <p className="text-sm text-gray-500">
                    {seniorClasses.length} class{seniorClasses.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {seniorClasses.map((classItem) => (
                      <div key={classItem._id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {classItem.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Senior Secondary {classItem.name.slice(-1)}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => openEditModal(classItem)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                              title="Edit Class"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Students:</span>
                              <div className="flex items-center space-x-1">
                                <UserGroupIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {classItem.studentsCount || classItem.students?.length || 0}/{classItem.maxStudents}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Subjects:</span>
                              <div className="flex items-center space-x-1">
                                <BookOpenIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {classItem.subjects?.length || 0}
                                </span>
                              </div>
                            </div>

                            {/* Display subject names if any */}
                            {classItem.subjects && classItem.subjects.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Assigned Subjects:</p>
                                <div className="flex flex-wrap gap-1">
                                  {classItem.subjects.slice(0, 3).map((subject) => (
                                    <span
                                      key={subject._id}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                    >
                                      {subject.name}
                                    </span>
                                  ))}
                                  {classItem.subjects.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{classItem.subjects.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {classItem.classTeacher && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Class Teacher:</span>
                                <div className="flex items-center space-x-1">
                                  <UserIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium">
                                    {classItem.classTeacher.firstName} {classItem.classTeacher.lastName}
                                  </span>
                                </div>
                              </div>
                            )}

                            {classItem.description && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-600">{classItem.description}</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Academic Year: {classItem.academicYear}</span>
                              <span>Max: {classItem.maxStudents}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Class Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit {selectedClass?.name} Class
              </h3>
              <form onSubmit={handleEditClass} className="space-y-4">
                <div>
                  <label className="form-label">Class Name</label>
                  <input
                    type="text"
                    className="form-input bg-gray-50"
                    value={selectedClass?.name || ''}
                    readOnly
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Class names are fixed in the Nigerian school system
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Class Teacher</label>
                    <select
                      className="form-input"
                      value={formData.classTeacher}
                      onChange={(e) => setFormData({...formData, classTeacher: e.target.value})}
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(teacher => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Maximum Students</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description for the class..."
                  />
                </div>

                <div>
                  <label className="form-label">Subjects</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {subjects.map(subject => (
                      <label key={subject._id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.subjects.includes(subject._id)}
                          onChange={() => handleSubjectChange(subject._id)}
                          className="mr-2"
                        />
                        {subject.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassManagement; 