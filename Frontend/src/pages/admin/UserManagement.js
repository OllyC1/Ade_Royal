import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    teacherId: '',
    class: '',
    subjects: [],
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    qualification: '',
    experience: 0,
    dateOfJoining: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchClasses();
    fetchSubjects();
  }, [currentPage, searchTerm, roleFilter, classFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(classFilter && { class: classFilter })
      });

      console.log('Fetching users with params:', params.toString());
      const response = await axios.get(`/api/admin/users?${params}`);
      console.log('Users fetch response:', response.data);
      
      if (response.data.success && response.data.data) {
        setUsers(response.data.data.users || []);
        setTotalPages(response.data.data.pagination?.pages || 1);
        console.log('Users set:', response.data.data.users?.length || 0);
      } else {
        console.error('Invalid response format:', response.data);
        toast.error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to load users. Please refresh the page.');
      }
    } finally {
      setLoading(false);
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

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/api/admin/subjects');
      setSubjects(response.data.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const generateCredentials = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please enter first name and last name first');
      return;
    }

    const firstName = formData.firstName.toLowerCase().trim();
    const lastName = formData.lastName.toLowerCase().trim();
    
    // Auto-generate email in the format: firstnamelastname@aderoyal.edu.ng
    const emailUsername = `${firstName}${lastName}`.replace(/\s+/g, '');
    const email = `${emailUsername}@aderoyal.edu.ng`;
    
    // Generate a simple password: firstname + 3 random digits
    const randomNum = Math.floor(Math.random() * 900) + 100; // 3-digit number
    const password = `${firstName}${randomNum}`;
    
    // Generate optional IDs (user can modify or leave empty)
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const randomId = Math.floor(Math.random() * 900) + 100;
    const teacherId = `TCH${currentYear}${randomId}`;
    const studentId = `STU${currentYear}${randomId}`;
    
    setFormData(prev => ({
      ...prev,
      email,
      password,
      // Set optional IDs but don't require them
      ...(formData.role === 'teacher' && { teacherId }),
      ...(formData.role === 'student' && { studentId })
    }));

    toast.success('Login credentials generated successfully!');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    
    if (!formData.password.trim()) {
      toast.error('Password is required');
      return;
    }
    
    if (formData.role === 'student' && !formData.class) {
      toast.error('Class is required for students');
      return;
    }

    try {
      console.log('Creating user with data:', formData);
      const response = await axios.post('/api/admin/users', formData);
      console.log('User creation response:', response.data);
      
      const { user, generatedEmail, loginCredentials } = response.data.data;
      
      // Show success message with login credentials
      toast.success(
        `${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} created successfully!\n\n` +
        `Login Email: ${generatedEmail}\n` +
        `Password: ${loginCredentials.password}\n\n` +
        `Please share these credentials with the user.`,
        { duration: 8000 }
      );
      
      // Close modal and reset form
      setShowAddModal(false);
      resetForm();
      
      // Refresh the users list
      console.log('Refreshing users list...');
      await fetchUsers();
      
    } catch (error) {
      console.error('User creation error:', error);
      
      // Show detailed error message
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        toast.error(`Validation errors: ${errorMessages}`);
      } else {
        toast.error('Failed to create user. Please check your input and try again.');
      }
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/users/${selectedUser._id}`, formData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    try {
      // Update teacher assignments
      await axios.put(`/api/admin/teachers/${selectedUser._id}/assignments`, {
        assignments: assignments
      });
      toast.success('Teacher assignments updated successfully');
      setShowAssignModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update assignments');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
      studentId: '',
      teacherId: '',
      class: '',
      subjects: [],
      phoneNumber: '',
      address: '',
      dateOfBirth: '',
      qualification: '',
      experience: 0,
      dateOfJoining: ''
    });
    setSelectedUser(null);
    setAssignments([]);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      studentId: user.studentId || '',
      teacherId: user.teacherId || '',
      class: user.class?._id || '',
      subjects: user.subjects?.map(s => s._id) || [],
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      qualification: user.qualification || '',
      experience: user.experience || 0,
      dateOfJoining: user.dateOfJoining ? user.dateOfJoining.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const openAssignModal = async (teacher) => {
    setSelectedUser(teacher);
    setShowAssignModal(true);
    
    // Get current assignments
    try {
      const response = await axios.get(`/api/admin/teachers/${teacher._id}/assignments`);
      setAssignments(response.data.data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  };

  const addAssignment = () => {
    setAssignments([...assignments, { subject: '', class: '' }]);
  };

  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    setAssignments(newAssignments);
  };

  const handleSubjectChange = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId]
    }));
  };

  const resetPassword = async (userId) => {
    if (window.confirm('Generate new password for this user?')) {
      try {
        const response = await axios.post(`/api/admin/users/${userId}/reset-password`);
        toast.success(`New password: ${response.data.data.newPassword}`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage students, teachers, and their assignments
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'student').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'teacher').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
            <select
              className="form-input"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setClassFilter('');
                setCurrentPage(1);
              }}
              className="btn-secondary flex items-center justify-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Users ({users.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class/Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.studentId || user.teacherId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === 'student' ? (
                        user.class?.name || 'Not assigned'
                      ) : user.role === 'teacher' ? (
                        `${user.subjects?.length || 0} subjects`
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit User"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {user.role === 'teacher' && (
                          <button
                            onClick={() => openAssignModal(user)}
                            className="text-green-600 hover:text-green-900"
                            title="Manage Assignments"
                          >
                            <ClipboardDocumentListIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => resetPassword(user._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Reset Password"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.firstName}
                        onChange={(e) => {
                          setFormData({...formData, firstName: e.target.value});
                          // Auto-generate email when names change
                          if (e.target.value && formData.lastName) {
                            const emailUsername = `${e.target.value.toLowerCase().trim()}${formData.lastName.toLowerCase().trim()}`.replace(/\s+/g, '');
                            const email = `${emailUsername}@aderoyal.edu.ng`;
                            setFormData(prev => ({...prev, firstName: e.target.value, email}));
                          }
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.lastName}
                        onChange={(e) => {
                          setFormData({...formData, lastName: e.target.value});
                          // Auto-generate email when names change
                          if (formData.firstName && e.target.value) {
                            const emailUsername = `${formData.firstName.toLowerCase().trim()}${e.target.value.toLowerCase().trim()}`.replace(/\s+/g, '');
                            const email = `${emailUsername}@aderoyal.edu.ng`;
                            setFormData(prev => ({...prev, lastName: e.target.value, email}));
                          }
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Role *</label>
                    <select
                      className="form-input"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      required
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Email * (Auto-generated)</label>
                      <input
                        type="email"
                        className="form-input bg-gray-50"
                        value={formData.email}
                        readOnly
                        placeholder="Enter first and last name to generate email"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email will be auto-generated as: firstnamelastname@aderoyal.edu.ng
                      </p>
                    </div>
                    <div>
                      <label className="form-label">Password *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Enter password or generate one"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={generateCredentials}
                      className="btn-secondary"
                      disabled={!formData.firstName || !formData.lastName}
                    >
                      Generate Password & IDs
                    </button>
                  </div>

                  {formData.role === 'student' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Student ID (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.studentId}
                          onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                          placeholder="Auto-generated or enter custom ID"
                        />
                      </div>
                      <div>
                        <label className="form-label">Class *</label>
                        <select
                          className="form-input"
                          value={formData.class}
                          onChange={(e) => setFormData({...formData, class: e.target.value})}
                          required
                        >
                          <option value="">Select Class</option>
                          {classes.map(cls => (
                            <option key={cls._id} value={cls._id}>{cls.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {formData.role === 'teacher' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Teacher ID (Optional)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.teacherId}
                            onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                            placeholder="Auto-generated or enter custom ID"
                          />
                        </div>
                        <div>
                          <label className="form-label">Qualification</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.qualification}
                            onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                            placeholder="e.g., B.Sc Mathematics"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Experience (years)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="form-label">Date of Joining</label>
                          <input
                            type="date"
                            className="form-input"
                            value={formData.dateOfJoining}
                            onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-gray-200 flex justify-end space-x-3 pt-4">
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
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={handleEditUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter new password or leave blank"
                    />
                  </div>

                  {formData.role === 'student' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Student ID</label>
                        <input
                          type="text"
                          className="form-input bg-gray-50"
                          value={formData.studentId}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="form-label">Class *</label>
                        <select
                          className="form-input"
                          value={formData.class}
                          onChange={(e) => setFormData({...formData, class: e.target.value})}
                          required
                        >
                          <option value="">Select Class</option>
                          {classes.map(cls => (
                            <option key={cls._id} value={cls._id}>{cls.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {formData.role === 'teacher' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Teacher ID</label>
                          <input
                            type="text"
                            className="form-input bg-gray-50"
                            value={formData.teacherId}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="form-label">Qualification</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.qualification}
                            onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Experience (years)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="form-label">Date of Joining</label>
                          <input
                            type="date"
                            className="form-input"
                            value={formData.dateOfJoining}
                            onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-gray-200 flex justify-end space-x-3 pt-4">
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
                      Update User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Teacher Assignment Modal */}
        {showAssignModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Assignments - {selectedUser.firstName} {selectedUser.lastName}
                </h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={handleAssignTeacher} className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium text-gray-900">Subject-Class Assignments</h4>
                      <button
                        type="button"
                        onClick={addAssignment}
                        className="btn-secondary text-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Assignment
                      </button>
                    </div>

                    {assignments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No assignments yet. Click "Add Assignment" to start.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {assignments.map((assignment, index) => (
                          <div key={index} className="grid grid-cols-5 gap-4 items-end p-4 border rounded-lg">
                            <div className="col-span-2">
                              <label className="form-label">Subject</label>
                              <select
                                className="form-input"
                                value={assignment.subject}
                                onChange={(e) => updateAssignment(index, 'subject', e.target.value)}
                                required
                              >
                                <option value="">Select Subject</option>
                                {subjects.map(subject => (
                                  <option key={subject._id} value={subject._id}>
                                    {subject.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="form-label">Class</label>
                              <select
                                className="form-input"
                                value={assignment.class}
                                onChange={(e) => updateAssignment(index, 'class', e.target.value)}
                                required
                              >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                  <option key={cls._id} value={cls._id}>
                                    {cls.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => removeAssignment(index)}
                                className="btn-danger w-full"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-gray-200 flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssignModal(false);
                        setAssignments([]);
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Assignments
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement; 