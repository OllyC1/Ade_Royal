import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BookOpenIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    teacherId: '',
    subjects: [],
    phoneNumber: '',
    address: '',
    qualification: '',
    experience: '',
    dateOfJoining: ''
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, [currentPage, searchTerm]);

  const fetchTeachers = async () => {
    try {
      const params = new URLSearchParams({
        role: 'teacher',
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await axios.get(`/api/admin/users?${params}`);
      setTeachers(response.data.data.users);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
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

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const teacherData = {
        ...formData,
        role: 'teacher'
      };
      await axios.post('/api/admin/users', teacherData);
      toast.success('Teacher created successfully');
      setShowAddModal(false);
      resetForm();
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    }
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/users/${selectedTeacher._id}`, formData);
      toast.success('Teacher updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${teacherId}`);
        toast.success('Teacher deleted successfully');
        fetchTeachers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      teacherId: '',
      subjects: [],
      phoneNumber: '',
      address: '',
      qualification: '',
      experience: '',
      dateOfJoining: ''
    });
    setSelectedTeacher(null);
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      password: '',
      teacherId: teacher.teacherId || '',
      subjects: teacher.subjects?.map(s => s._id) || [],
      phoneNumber: teacher.phoneNumber || '',
      address: teacher.address || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience || '',
      dateOfJoining: teacher.dateOfJoining ? new Date(teacher.dateOfJoining).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  const handleSubjectChange = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId]
    }));
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.teacherId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner text="Loading teachers..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Teacher Management
              </h1>
              <p className="text-gray-600">
                Manage teachers and their subject assignments
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Teacher
            </button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                className="form-input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeachers.map((teacher) => (
            <div key={teacher._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Teacher Avatar and Basic Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0 h-12 w-12">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {teacher.teacherId || 'No ID assigned'}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 truncate">{teacher.email}</span>
                  </div>
                  {teacher.phoneNumber && (
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{teacher.phoneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Subjects */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpenIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Subjects:</span>
                  </div>
                  {teacher.subjects?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.slice(0, 2).map(subject => (
                        <span key={subject._id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {subject.name}
                        </span>
                      ))}
                      {teacher.subjects.length > 2 && (
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          +{teacher.subjects.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No subjects assigned</span>
                  )}
                </div>

                {/* Status */}
                <div className="mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {teacher.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => openViewModal(teacher)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(teacher)}
                    className="flex-1 btn-primary text-sm py-2"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(teacher._id)}
                    className="px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTeachers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new teacher.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
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
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Teacher Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Teacher</h3>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Teacher ID</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.teacherId}
                      onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                      placeholder="e.g., TCH001"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>

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
                    <label className="form-label">Date of Joining</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dateOfJoining}
                      onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Qualification</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.qualification}
                      onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                      placeholder="e.g., B.Ed, M.Sc"
                    />
                  </div>
                  <div>
                    <label className="form-label">Experience (years)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.experience}
                      onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Assign Subjects</label>
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
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Teacher Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Teacher</h3>
              <form onSubmit={handleEditTeacher} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Teacher ID</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.teacherId}
                      onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

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
                    <label className="form-label">Date of Joining</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dateOfJoining}
                      onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Qualification</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.qualification}
                      onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="form-label">Experience (years)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.experience}
                      onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Assign Subjects</label>
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
                    Update Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Teacher Modal */}
        {showViewModal && selectedTeacher && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Teacher Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedTeacher.firstName} {selectedTeacher.lastName}
                    </h4>
                    <p className="text-gray-600">{selectedTeacher.teacherId || 'No ID assigned'}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedTeacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTeacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h5>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-900">{selectedTeacher.email}</span>
                    </div>
                    {selectedTeacher.phoneNumber && (
                      <div className="flex items-center space-x-3">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedTeacher.phoneNumber}</span>
                      </div>
                    )}
                    {selectedTeacher.address && (
                      <div className="flex items-center space-x-3">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedTeacher.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Professional Information</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTeacher.qualification && (
                      <div>
                        <p className="text-xs text-gray-500">Qualification</p>
                        <p className="text-sm text-gray-900">{selectedTeacher.qualification}</p>
                      </div>
                    )}
                    {selectedTeacher.experience && (
                      <div>
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="text-sm text-gray-900">{selectedTeacher.experience} years</p>
                      </div>
                    )}
                    {selectedTeacher.dateOfJoining && (
                      <div>
                        <p className="text-xs text-gray-500">Date of Joining</p>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedTeacher.dateOfJoining).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Assigned Subjects</h5>
                  {selectedTeacher.subjects?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTeacher.subjects.map(subject => (
                        <span key={subject._id} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                          {subject.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No subjects assigned</p>
                  )}
                </div>

                {/* Account Info */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Account Information</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-gray-900">
                        {new Date(selectedTeacher.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-gray-900">
                        {new Date(selectedTeacher.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedTeacher);
                  }}
                  className="btn-primary"
                >
                  Edit Teacher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherManagement; 