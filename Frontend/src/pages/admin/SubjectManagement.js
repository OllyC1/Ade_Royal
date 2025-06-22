import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  BeakerIcon,
  BanknotesIcon,
  PaintBrushIcon,
  CheckCircleIcon,
  FunnelIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    level: 'Both',
    departments: [],
    category: 'Core',
    teachers: [],
    classes: [],
    isCore: true,
    isCompulsory: false,
    applicableLevels: [],
    credits: 1,
    passingScore: 40
  });

  // Nigerian school system constants
  const levels = [
    { value: 'Junior', label: 'Junior Secondary (JSS1-JSS3)' },
    { value: 'Senior', label: 'Senior Secondary (SS1-SS3)' },
    { value: 'Both', label: 'Both Junior & Senior' }
  ];

  const departments = [
    { value: 'All', label: 'All Departments', icon: AcademicCapIcon, color: 'blue' },
    { value: 'Science', label: 'Science Department', icon: BeakerIcon, color: 'green' },
    { value: 'Commercial', label: 'Commercial Department', icon: BanknotesIcon, color: 'yellow' },
    { value: 'Arts', label: 'Arts Department', icon: PaintBrushIcon, color: 'purple' }
  ];

  const categories = [
    'Core', 'Science', 'Commercial', 'Arts', 'Technical', 
    'Language', 'Religious', 'Creative', 'Social', 'Elective'
  ];

  const applicableLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
    fetchClasses();
  }, [levelFilter, departmentFilter, categoryFilter]);

  const fetchSubjects = async () => {
    try {
      const params = new URLSearchParams();
      if (levelFilter) params.append('level', levelFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await axios.get(`/api/admin/subjects?${params}`);
      setSubjects(response.data.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
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

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/admin/classes');
      setClasses(response.data.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const initializeSubjects = async () => {
    setInitializing(true);
    try {
      await axios.post('/api/admin/subjects/initialize');
      toast.success('Nigerian school subjects initialized successfully');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to initialize subjects');
    } finally {
      setInitializing(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/subjects', formData);
      toast.success('Subject created successfully');
      setShowAddModal(false);
      resetForm();
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleEditSubject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/subjects/${selectedSubject._id}`, formData);
      toast.success('Subject updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject? This will affect all related exams and questions.')) {
      try {
        await axios.delete(`/api/admin/subjects/${subjectId}`);
        toast.success('Subject deleted successfully');
        fetchSubjects();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete subject');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      level: 'Both',
      departments: [],
      category: 'Core',
      teachers: [],
      classes: [],
      isCore: true,
      isCompulsory: false,
      applicableLevels: [],
      credits: 1,
      passingScore: 40
    });
    setSelectedSubject(null);
  };

  const openEditModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      description: subject.description || '',
      level: subject.level || 'Both',
      departments: subject.departments || [],
      category: subject.category || 'Core',
      teachers: subject.teachers?.map(t => t._id) || [],
      classes: subject.classes?.map(c => c._id) || [],
      isCore: subject.isCore !== false,
      isCompulsory: subject.isCompulsory || false,
      applicableLevels: subject.applicableLevels || [],
      credits: subject.credits || 1,
      passingScore: subject.passingScore || 40
    });
    setShowEditModal(true);
  };

  const handleArrayFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const clearFilters = () => {
    setLevelFilter('');
    setDepartmentFilter('');
    setCategoryFilter('');
    setSearchTerm('');
  };

  // Helper function to get class level (Junior/Senior)
  const getClassLevel = (className) => {
    return ['JSS1', 'JSS2', 'JSS3'].includes(className) ? 'Junior' : 'Senior';
  };

  // Helper function to group classes by level
  const getClassesByLevel = () => {
    const juniorClasses = classes.filter(cls => getClassLevel(cls.name) === 'Junior');
    const seniorClasses = classes.filter(cls => getClassLevel(cls.name) === 'Senior');
    return { juniorClasses, seniorClasses };
  };

  // Handle level change to auto-adjust departments and applicable levels
  const handleLevelChange = (newLevel) => {
    setFormData(prev => {
      const updates = { ...prev, level: newLevel };
      
      // Auto-adjust applicable levels based on selected level
      if (newLevel === 'Junior') {
        updates.applicableLevels = ['JSS1', 'JSS2', 'JSS3'];
        updates.departments = ['All']; // Junior classes don't need specific departments
      } else if (newLevel === 'Senior') {
        updates.applicableLevels = ['SS1', 'SS2', 'SS3'];
        // Keep existing departments or default to All
        if (prev.departments.length === 0) {
          updates.departments = ['All'];
        }
      } else { // Both
        updates.applicableLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
        updates.departments = ['All'];
      }
      
      return updates;
    });
  };

  // Handle class selection with automatic department assignment
  const handleClassChange = (classId) => {
    const selectedClass = classes.find(cls => cls._id === classId);
    if (!selectedClass) return;

    const classLevel = getClassLevel(selectedClass.name);
    
    setFormData(prev => {
      const newClasses = prev.classes.includes(classId)
        ? prev.classes.filter(id => id !== classId)
        : [...prev.classes, classId];

      // Auto-adjust level and departments based on selected classes
      const selectedClasses = classes.filter(cls => newClasses.includes(cls._id));
      const hasJunior = selectedClasses.some(cls => getClassLevel(cls.name) === 'Junior');
      const hasSenior = selectedClasses.some(cls => getClassLevel(cls.name) === 'Senior');

      let newLevel = prev.level;
      let newDepartments = [...prev.departments];
      let newApplicableLevels = [...prev.applicableLevels];

      if (hasJunior && hasSenior) {
        newLevel = 'Both';
        newApplicableLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
      } else if (hasJunior) {
        newLevel = 'Junior';
        newApplicableLevels = ['JSS1', 'JSS2', 'JSS3'];
        newDepartments = ['All']; // Junior doesn't need specific departments
      } else if (hasSenior) {
        newLevel = 'Senior';
        newApplicableLevels = ['SS1', 'SS2', 'SS3'];
        // Keep existing departments for senior
      }

      return {
        ...prev,
        classes: newClasses,
        level: newLevel,
        departments: newDepartments,
        applicableLevels: newApplicableLevels
      };
    });
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group subjects by level for better organization
  const juniorSubjects = filteredSubjects.filter(s => s.level === 'Junior' || s.level === 'Both');
  const seniorSubjects = filteredSubjects.filter(s => s.level === 'Senior' || s.level === 'Both');

  const getDepartmentIcon = (department) => {
    const dept = departments.find(d => d.value === department);
    return dept?.icon || AcademicCapIcon;
  };

  const getDepartmentColor = (department) => {
    const dept = departments.find(d => d.value === department);
    return dept?.color || 'blue';
  };

  if (loading) {
    return <LoadingSpinner text="Loading subjects..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Subject Management
              </h1>
              <p className="text-gray-600">
                Manage Nigerian school subjects with departmental structure
              </p>
            </div>
            <div className="flex space-x-3">
              {subjects.length === 0 && (
                <button
                  onClick={initializeSubjects}
                  disabled={initializing}
                  className="btn-secondary flex items-center"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {initializing ? 'Initializing...' : 'Initialize Subjects'}
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Subject
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Junior Secondary</p>
                <p className="text-2xl font-bold text-gray-900">{juniorSubjects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Senior Secondary</p>
                <p className="text-2xl font-bold text-gray-900">{seniorSubjects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Core Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.filter(s => s.isCore).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Compulsory</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.filter(s => s.isCompulsory).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
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
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="form-input"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="form-input"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={clearFilters}
                className="btn-secondary w-full flex items-center justify-center"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Initialize the Nigerian school subject structure or add custom subjects.
            </p>
            <div className="mt-6">
              <button
                onClick={initializeSubjects}
                disabled={initializing}
                className="btn-primary"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {initializing ? 'Initializing...' : 'Initialize Nigerian Subjects'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Junior Secondary Subjects */}
            {juniorSubjects.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Junior Secondary Subjects (JSS1-JSS3)
                  </h3>
                  <p className="text-sm text-gray-500">
                    {juniorSubjects.length} subject{juniorSubjects.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {juniorSubjects.map((subject) => (
                      <div key={subject._id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                                <BookOpenIcon className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                                {subject.code && (
                                  <p className="text-sm text-gray-500">{subject.code}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditModal(subject)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                                title="Edit Subject"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject._id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                title="Delete Subject"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>

                          {subject.description && (
                            <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
                          )}

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Category:</span>
                              <span className="text-sm font-medium text-gray-900">{subject.category}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Type:</span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                subject.isCompulsory ? 'bg-red-100 text-red-800' : 
                                subject.isCore ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {subject.isCompulsory ? 'Compulsory' : subject.isCore ? 'Core' : 'Elective'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Teachers:</span>
                              <span className="text-sm font-medium">{subject.teachers?.length || 0}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Credits:</span>
                              <span className="text-sm font-medium">{subject.credits}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Senior Secondary Subjects by Department */}
            {seniorSubjects.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Senior Secondary Subjects (SS1-SS3)
                  </h3>
                  <p className="text-sm text-gray-500">
                    {seniorSubjects.length} subject{seniorSubjects.length !== 1 ? 's' : ''} across departments
                  </p>
                </div>
                
                <div className="p-6">
                  {departments.map(dept => {
                    const deptSubjects = seniorSubjects.filter(s => 
                      s.departments?.includes(dept.value) || s.departments?.includes('All')
                    );
                    
                    if (deptSubjects.length === 0) return null;

                    const IconComponent = dept.icon;
                    
                    return (
                      <div key={dept.value} className="mb-8 last:mb-0">
                        <div className="flex items-center mb-4">
                          <div className={`p-2 bg-${dept.color}-100 rounded-lg mr-3`}>
                            <IconComponent className={`h-6 w-6 text-${dept.color}-600`} />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {dept.label} ({deptSubjects.length})
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {deptSubjects.map((subject) => (
                            <div key={subject._id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                              <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${dept.color}-100`}>
                                      <BookOpenIcon className={`h-6 w-6 text-${dept.color}-600`} />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                                      {subject.code && (
                                        <p className="text-sm text-gray-500">{subject.code}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openEditModal(subject)}
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                                      title="Edit Subject"
                                    >
                                      <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubject(subject._id)}
                                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                      title="Delete Subject"
                                    >
                                      <TrashIcon className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>

                                {subject.description && (
                                  <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
                                )}

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Category:</span>
                                    <span className="text-sm font-medium text-gray-900">{subject.category}</span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Departments:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {subject.departments?.map(d => (
                                        <span key={d} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                          {d}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Type:</span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      subject.isCompulsory ? 'bg-red-100 text-red-800' : 
                                      subject.isCore ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {subject.isCompulsory ? 'Compulsory' : subject.isCore ? 'Core' : 'Elective'}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Teachers:</span>
                                    <span className="text-sm font-medium">{subject.teachers?.length || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Subject Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-3xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Subject</h3>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Subject Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Subject Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., MTH, ENG"
                      maxLength="10"
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
                    placeholder="Brief description of the subject..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">School Level *</label>
                    <select
                      className="form-input"
                      value={formData.level}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      required
                    >
                      {levels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Category *</label>
                    <select
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Credits</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.credits}
                      onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                      min="1"
                      max="6"
                    />
                  </div>
                </div>

                {(formData.level === 'Senior' || formData.level === 'Both') && (
                  <div>
                    <label className="form-label">
                      Departments {formData.level === 'Senior' ? '(for Senior Secondary)' : '(for Senior Secondary classes)'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {departments.map(dept => (
                        <label key={dept.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.departments.includes(dept.value)}
                            onChange={() => handleArrayFieldChange('departments', dept.value)}
                            className="mr-2"
                          />
                          {dept.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.level === 'Junior' 
                        ? 'Junior Secondary subjects are available to all students (no department selection needed)'
                        : 'Select which departments can take this subject'
                      }
                    </p>
                  </div>
                )}

                <div>
                  <label className="form-label">Applicable Class Levels</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {applicableLevels.map(level => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.applicableLevels.includes(level)}
                          onChange={() => handleArrayFieldChange('applicableLevels', level)}
                          className="mr-2"
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isCore"
                      checked={formData.isCore}
                      onChange={(e) => setFormData({...formData, isCore: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="isCore" className="text-sm font-medium text-gray-700">
                      Core Subject
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isCompulsory"
                      checked={formData.isCompulsory}
                      onChange={(e) => setFormData({...formData, isCompulsory: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="isCompulsory" className="text-sm font-medium text-gray-700">
                      Compulsory Subject
                    </label>
                  </div>

                  <div>
                    <label className="form-label">Passing Score (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Assign to Classes</label>
                  <div className="space-y-4 mt-2">
                    {/* Junior Secondary Classes */}
                    {getClassesByLevel().juniorClasses.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <AcademicCapIcon className="h-5 w-5 text-green-600 mr-2" />
                          Junior Secondary (JSS1-JSS3)
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {getClassesByLevel().juniorClasses.map(cls => (
                            <label key={cls._id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.classes.includes(cls._id)}
                                onChange={() => handleClassChange(cls._id)}
                                className="mr-2"
                              />
                              {cls.name}
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          No department selection needed - available to all JSS students
                        </p>
                      </div>
                    )}

                    {/* Senior Secondary Classes */}
                    {getClassesByLevel().seniorClasses.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <BeakerIcon className="h-5 w-5 text-blue-600 mr-2" />
                          Senior Secondary (SS1-SS3)
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {getClassesByLevel().seniorClasses.map(cls => (
                            <label key={cls._id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.classes.includes(cls._id)}
                                onChange={() => handleClassChange(cls._id)}
                                className="mr-2"
                              />
                              {cls.name}
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Department selection required above for SS students
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Assign Teachers</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {teachers.map(teacher => (
                      <label key={teacher._id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.teachers.includes(teacher._id)}
                          onChange={() => handleArrayFieldChange('teachers', teacher._id)}
                          className="mr-2"
                        />
                        {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Subject Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-3xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Subject: {selectedSubject?.name}
              </h3>
              <form onSubmit={handleEditSubject} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Subject Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Subject Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., MTH, ENG"
                      maxLength="10"
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
                    placeholder="Brief description of the subject..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">School Level *</label>
                    <select
                      className="form-input"
                      value={formData.level}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      required
                    >
                      {levels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Category *</label>
                    <select
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Credits</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.credits}
                      onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                      min="1"
                      max="6"
                    />
                  </div>
                </div>

                {(formData.level === 'Senior' || formData.level === 'Both') && (
                  <div>
                    <label className="form-label">
                      Departments {formData.level === 'Senior' ? '(for Senior Secondary)' : '(for Senior Secondary classes)'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {departments.map(dept => (
                        <label key={dept.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.departments.includes(dept.value)}
                            onChange={() => handleArrayFieldChange('departments', dept.value)}
                            className="mr-2"
                          />
                          {dept.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.level === 'Junior' 
                        ? 'Junior Secondary subjects are available to all students (no department selection needed)'
                        : 'Select which departments can take this subject'
                      }
                    </p>
                  </div>
                )}

                <div>
                  <label className="form-label">Applicable Class Levels</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {applicableLevels.map(level => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.applicableLevels.includes(level)}
                          onChange={() => handleArrayFieldChange('applicableLevels', level)}
                          className="mr-2"
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editIsCore"
                      checked={formData.isCore}
                      onChange={(e) => setFormData({...formData, isCore: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="editIsCore" className="text-sm font-medium text-gray-700">
                      Core Subject
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editIsCompulsory"
                      checked={formData.isCompulsory}
                      onChange={(e) => setFormData({...formData, isCompulsory: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="editIsCompulsory" className="text-sm font-medium text-gray-700">
                      Compulsory Subject
                    </label>
                  </div>

                  <div>
                    <label className="form-label">Passing Score (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Assign to Classes</label>
                  <div className="space-y-4 mt-2">
                    {/* Junior Secondary Classes */}
                    {getClassesByLevel().juniorClasses.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <AcademicCapIcon className="h-5 w-5 text-green-600 mr-2" />
                          Junior Secondary (JSS1-JSS3)
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {getClassesByLevel().juniorClasses.map(cls => (
                            <label key={cls._id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.classes.includes(cls._id)}
                                onChange={() => handleClassChange(cls._id)}
                                className="mr-2"
                              />
                              {cls.name}
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          No department selection needed - available to all JSS students
                        </p>
                      </div>
                    )}

                    {/* Senior Secondary Classes */}
                    {getClassesByLevel().seniorClasses.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <BeakerIcon className="h-5 w-5 text-blue-600 mr-2" />
                          Senior Secondary (SS1-SS3)
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {getClassesByLevel().seniorClasses.map(cls => (
                            <label key={cls._id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.classes.includes(cls._id)}
                                onChange={() => handleClassChange(cls._id)}
                                className="mr-2"
                              />
                              {cls.name}
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Department selection required above for SS students
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Assign Teachers</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {teachers.map(teacher => (
                      <label key={teacher._id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.teachers.includes(teacher._id)}
                          onChange={() => handleArrayFieldChange('teachers', teacher._id)}
                          className="mr-2"
                        />
                        {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
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
                    Update Subject
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

export default SubjectManagement; 