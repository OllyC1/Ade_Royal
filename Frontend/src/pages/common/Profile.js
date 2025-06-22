import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  UserIcon,
  KeyIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    qualification: '',
    experience: 0,
    dateOfJoining: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      const profile = response.data.data.user;
      setUserProfile(profile);
      
      // Populate form data
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        qualification: profile.qualification || '',
        experience: profile.experience || 0,
        dateOfJoining: profile.dateOfJoining ? profile.dateOfJoining.split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      // Create update data object and filter out empty strings (except for fields that can be empty)
      const updateData = {};
      
      // Basic fields
      if (formData.firstName !== undefined) updateData.firstName = formData.firstName;
      if (formData.lastName !== undefined) updateData.lastName = formData.lastName;
      if (formData.phoneNumber !== undefined) updateData.phoneNumber = formData.phoneNumber;
      if (formData.address !== undefined) updateData.address = formData.address;
      if (formData.dateOfBirth !== undefined && formData.dateOfBirth !== '') {
        updateData.dateOfBirth = formData.dateOfBirth;
      }
      
      // Only admin can change email
      if (currentUser.role === 'admin' && formData.email !== undefined) {
        updateData.email = formData.email;
      }
      
      // Teacher/Admin specific fields
      if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
        if (formData.qualification !== undefined) updateData.qualification = formData.qualification;
        if (formData.experience !== undefined) updateData.experience = formData.experience;
        if (formData.dateOfJoining !== undefined && formData.dateOfJoining !== '') {
          updateData.dateOfJoining = formData.dateOfJoining;
        }
      }
      
      console.log('Profile update data being sent:', updateData);
      const response = await axios.put('/api/auth/profile', updateData);
      
      setUserProfile(response.data.data.user);
      setEditMode(false);
      toast.success('Profile updated successfully!');
      
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordMode(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    // Reset form data to original values
    setFormData({
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      email: userProfile.email || '',
      phoneNumber: userProfile.phoneNumber || '',
      address: userProfile.address || '',
      dateOfBirth: userProfile.dateOfBirth ? userProfile.dateOfBirth.split('T')[0] : '',
      qualification: userProfile.qualification || '',
      experience: userProfile.experience || 0,
      dateOfJoining: userProfile.dateOfJoining ? userProfile.dateOfJoining.split('T')[0] : ''
    });
  };

  const cancelPasswordChange = () => {
    setPasswordMode(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!userProfile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load profile</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your profile information</p>
            </div>
            <div className="flex space-x-3">
              {!editMode && !passwordMode && (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn-secondary flex items-center"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setPasswordMode(true)}
                    className="btn-primary flex items-center"
                  >
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Change Password
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-20 w-20">
              <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-gray-600" />
              </div>
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-bold text-gray-900">
                {userProfile.fullName}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {userProfile.role}
                {userProfile.role === 'student' && userProfile.studentId && ` • ID: ${userProfile.studentId}`}
                {userProfile.role === 'teacher' && userProfile.teacherId && ` • ID: ${userProfile.teacherId}`}
              </p>
              {userProfile.class && (
                <p className="text-sm text-gray-500">
                  Class: {userProfile.class.name}
                </p>
              )}
            </div>
          </div>

          {/* Edit Profile Form */}
          {editMode ? (
            <div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Note:</span> All fields are optional. You can update only the fields you want to change.
                  {currentUser.role !== 'admin' && ' Email changes require admin assistance.'}
                </p>
              </div>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={currentUser.role !== 'admin'}
                  placeholder="Enter email address"
                />
                {currentUser.role !== 'admin' ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact admin if needed.
                  </p>
                ) : (
                  <p className="text-xs text-blue-500 mt-1">
                    As an admin, you can edit all profile fields including email.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Teacher-specific fields */}
              {(userProfile.role === 'teacher' || userProfile.role === 'admin') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              )}

              {(userProfile.role === 'teacher' || userProfile.role === 'admin') && (
                <div>
                  <label className="form-label">Date of Joining</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateOfJoining}
                    onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-secondary flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
            </div>
          ) : passwordMode ? (
            /* Change Password Form */
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="form-label">Current Password *</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="form-input pr-10"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="form-input pr-10"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input pr-10"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelPasswordChange}
                  className="btn-secondary flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                >
                  <KeyIcon className="h-5 w-5 mr-2" />
                  Change Password
                </button>
              </div>
            </form>
          ) : (
            /* Display Profile Information */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{userProfile.email}</p>
                </div>
                
                {userProfile.phoneNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <p className="text-gray-900">{userProfile.phoneNumber}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userProfile.dateOfBirth && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <p className="text-gray-900">
                      {new Date(userProfile.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {userProfile.lastLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Login
                    </label>
                    <p className="text-gray-900">
                      {new Date(userProfile.lastLogin).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Teacher-specific information */}
              {(userProfile.role === 'teacher' || userProfile.role === 'admin') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userProfile.qualification && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qualification
                      </label>
                      <p className="text-gray-900">{userProfile.qualification}</p>
                    </div>
                  )}

                  {userProfile.experience !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experience
                      </label>
                      <p className="text-gray-900">{userProfile.experience} years</p>
                    </div>
                  )}
                </div>
              )}

              {userProfile.dateOfJoining && (userProfile.role === 'teacher' || userProfile.role === 'admin') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Joining
                  </label>
                  <p className="text-gray-900">
                    {new Date(userProfile.dateOfJoining).toLocaleDateString()}
                  </p>
                </div>
              )}

              {userProfile.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <p className="text-gray-900">{userProfile.address}</p>
                </div>
              )}

              {/* Student class information */}
              {userProfile.role === 'student' && userProfile.class && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <p className="text-gray-900">{userProfile.class.name}</p>
                </div>
              )}

              {/* Teacher subjects */}
              {userProfile.role === 'teacher' && userProfile.subjects && userProfile.subjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjects
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.subjects.map(subject => (
                      <span
                        key={subject._id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Created
              </label>
              <p className="text-gray-900">
                {new Date(userProfile.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <span className={`px-3 py-1 text-sm rounded-full ${
                userProfile.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {userProfile.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {currentUser.role !== 'admin' && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> If you forget your password, contact the administrator 
                to generate a new password for you from the user management system.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile; 