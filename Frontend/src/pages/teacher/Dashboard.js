import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/teacher/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/teacher/exams/${examId}`);
      toast.success('Exam deleted successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete exam';
      toast.error(message);
    }
  };

  const getExamStatus = (exam) => {
    const now = moment();
    const startTime = moment(exam.startTime);
    const endTime = moment(exam.endTime);

    if (now.isBefore(startTime)) {
      return { status: 'upcoming', color: 'yellow', text: 'Upcoming' };
    } else if (now.isBetween(startTime, endTime)) {
      return { status: 'active', color: 'green', text: 'Active' };
    } else {
      return { status: 'ended', color: 'gray', text: 'Ended' };
    }
  };

  const copyExamCode = (examCode) => {
    navigator.clipboard.writeText(examCode);
    toast.success('Exam code copied to clipboard!');
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const overview = dashboardData?.overview || {};
  const recentExams = dashboardData?.recentExams || [];
  const pendingGradingDetails = dashboardData?.pendingGradingDetails || [];
  const statistics = dashboardData?.statistics || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your exams today.
              </p>
            </div>
            <Link
              to="/teacher/create-exam"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Exam
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalExams || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalStudents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Exams</p>
                <p className="text-2xl font-bold text-gray-900">{overview.activeExams || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Grading</p>
                <p className="text-2xl font-bold text-gray-900">{overview.pendingGrading || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Exams */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Exams</h2>
                <Link
                  to="/teacher/manage-exams"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>

            <div className="p-6">
              {recentExams.length > 0 ? (
                <div className="space-y-4">
                  {recentExams.map((exam) => {
                    const status = getExamStatus(exam);
                    
                    return (
                      <div
                        key={exam._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                                {status.text}
                              </span>
                              <button
                                onClick={() => copyExamCode(exam.examCode)}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                                title="Click to copy exam code"
                              >
                                <KeyIcon className="h-3 w-3 mr-1" />
                                {exam.examCode}
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center">
                                <AcademicCapIcon className="h-4 w-4 mr-1" />
                                {exam.subject?.name} - {exam.class?.name}
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {exam.duration} min
                              </div>
                              <div className="flex items-center">
                                <UserGroupIcon className="h-4 w-4 mr-1" />
                                {exam.attempts?.length || 0} attempts
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-500">
                              Start: {moment(exam.startTime).format('MMM DD, YYYY HH:mm')}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              to={`/teacher/exams/${exam._id}/results`}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="View results"
                            >
                              <ChartBarIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteExam(exam._id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete exam"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No exams yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first exam.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/teacher/create-exam"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Exam
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending Grading */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Pending Grading</h2>
                <Link
                  to="/teacher/results"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>

            <div className="p-6">
              {pendingGradingDetails.length > 0 ? (
                <div className="space-y-4">
                  {pendingGradingDetails.map((item) => (
                    <div
                      key={item._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {item.exam?.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Student: {item.student?.firstName} {item.student?.lastName}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Submitted: {moment(item.submittedAt).fromNow()}</span>
                            <span>Theory Questions: {item.theoryQuestionsCount || 0}</span>
                          </div>
                        </div>
                        
                        <Link
                          to={`/teacher/exams/${item.exam._id}/results`}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Grade Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending grading</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All submitted exams have been graded.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{statistics.totalAttempts || 0}</div>
              <div className="text-sm text-gray-600">Total Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{statistics.completedAttempts || 0}</div>
              <div className="text-sm text-gray-600">Completed Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{statistics.averageScore || 0}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{statistics.totalSubjects || 0}</div>
              <div className="text-sm text-gray-600">Subjects Teaching</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/teacher/create-exam"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition-colors">
                <PlusIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">Create Exam</h3>
                <p className="text-sm text-gray-600">Set up a new exam</p>
              </div>
            </Link>

            <Link
              to="/teacher/manage-exams"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-green-300 transition-all group"
            >
              <div className="bg-green-100 rounded-lg p-3 group-hover:bg-green-200 transition-colors">
                <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">Manage Exams</h3>
                <p className="text-sm text-gray-600">View and edit exams</p>
              </div>
            </Link>

            <Link
              to="/teacher/results"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-yellow-300 transition-all group"
            >
              <div className="bg-yellow-100 rounded-lg p-3 group-hover:bg-yellow-200 transition-colors">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">View Results</h3>
                <p className="text-sm text-gray-600">Check exam results</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-purple-300 transition-all group"
            >
              <div className="bg-purple-100 rounded-lg p-3 group-hover:bg-purple-200 transition-colors">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">Profile</h3>
                <p className="text-sm text-gray-600">Update your profile</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 