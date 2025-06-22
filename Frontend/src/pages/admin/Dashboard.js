import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // Set default data to prevent errors
      setDashboardData({
        overview: {
          totalStudents: 0,
          totalTeachers: 0,
          totalExams: 0,
          activeExams: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  const stats = dashboardData?.overview || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            System overview and management tools
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.totalStudents || 0) + (stats.totalTeachers || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExams || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeExams || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Real-time Exam Activity</h2>
          </div>
          <div className="p-6">
            {dashboardData?.recentActivities?.recentExams?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentActivities.recentExams.map((exam) => {
                  const now = new Date();
                  const startTime = new Date(exam.startTime);
                  const endTime = new Date(exam.endTime);
                  const isActive = now >= startTime && now <= endTime;
                  const timeRemaining = isActive ? Math.max(0, Math.floor((endTime - now) / (1000 * 60))) : 0;
                  
                  return (
                    <div key={exam._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <div>
                          <h3 className="font-medium text-gray-900">{exam.title}</h3>
                          <p className="text-sm text-gray-600">
                            {exam.subject?.name} • {exam.class?.name} • Code: {exam.examCode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isActive ? (
                          <div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                              {timeRemaining} min remaining
                            </p>
                          </div>
                        ) : now < startTime ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent exam activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Exam activity will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Student Results Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Classes */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Classes</h2>
            </div>
            <div className="p-6">
              {dashboardData?.analytics?.classDistribution?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.analytics.classDistribution.slice(0, 5).map((classData, index) => (
                    <div key={classData._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{classData._id}</span>
                      </div>
                      <span className="text-sm text-gray-600">{classData.count} students</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No class data available</p>
              )}
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Subject Exam Distribution</h2>
            </div>
            <div className="p-6">
              {dashboardData?.analytics?.subjectExamDistribution?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.analytics.subjectExamDistribution.slice(0, 5).map((subjectData) => (
                    <div key={subjectData._id} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{subjectData._id}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (subjectData.count / Math.max(...dashboardData.analytics.subjectExamDistribution.map(s => s.count))) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{subjectData.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No subject data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button 
              onClick={() => navigate('/admin/users')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition-colors">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-medium text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-600">Add or edit users</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin/teachers')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-purple-300 transition-all group"
            >
              <div className="bg-purple-100 rounded-lg p-3 group-hover:bg-purple-200 transition-colors">
                <AcademicCapIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-medium text-gray-900">Manage Teachers</h3>
                <p className="text-sm text-gray-600">Teacher profiles</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin/classes')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-green-300 transition-all group"
            >
              <div className="bg-green-100 rounded-lg p-3 group-hover:bg-green-200 transition-colors">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-medium text-gray-900">Manage Classes</h3>
                <p className="text-sm text-gray-600">Configure classes</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin/subjects')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-orange-300 transition-all group"
            >
              <div className="bg-orange-100 rounded-lg p-3 group-hover:bg-orange-200 transition-colors">
                <ClipboardDocumentListIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-medium text-gray-900">Manage Subjects</h3>
                <p className="text-sm text-gray-600">Configure subjects</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin/analytics')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-yellow-300 transition-all group"
            >
              <div className="bg-yellow-100 rounded-lg p-3 group-hover:bg-yellow-200 transition-colors">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-medium text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600">System performance</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard; 