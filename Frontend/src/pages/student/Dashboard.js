import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout/Layout';
import LoadingState, { CardLoader } from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { handleError, withErrorHandling, withRetry } from '../../utils/errorHandler';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  TrophyIcon,
  AcademicCapIcon,
  PlayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '../../utils/axios';
import moment from 'moment';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      const data = await withErrorHandling(
        () => withRetry(() => apiRequest.get('/api/student/dashboard'), 3, 1000),
        {
          loadingState: { setLoading },
          context: 'student dashboard',
          showToast: false, // We'll handle errors manually
        }
      );
      
      setDashboardData(data.data);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      setError(error);
      handleError(error, {
        context: 'student dashboard',
        customMessage: 'Unable to load dashboard data. Please check your connection and try again.',
        showToast: retryCount === 0 // Only show toast on first error
      });
    }
  }, [retryCount]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchDashboardData();
  };

  const getStatusBadge = (exam) => {
    if (!exam?.startTime || !exam?.endTime) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
    }

    const now = moment();
    const startTime = moment(exam.startTime);
    const endTime = moment(exam.endTime);

    if (now.isBefore(startTime)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Upcoming
        </span>
      );
    } else if (now.isBetween(startTime, endTime)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Ended
        </span>
      );
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleExamStart = (examId) => {
    try {
      toast.success('Starting exam...');
      // The Link component will handle navigation
    } catch (error) {
      handleError(error, {
        context: 'exam start',
        customMessage: 'Unable to start exam. Please try again.'
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
          
          {/* Stats skeleton */}
          <CardLoader count={4} />
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardLoader count={2} />
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <Layout>
        <ErrorState 
          error={error} 
          onRetry={handleRetry}
          title="Unable to load dashboard"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="academic-header-blue">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="page-title-white">
                Welcome back, {user?.firstName || 'Student'}!
              </h1>
              <p className="page-subtitle-white">
                Class: {dashboardData?.student?.class || 'N/A'} | ID: {dashboardData?.student?.studentId || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Today</p>
              <p className="text-lg font-semibold text-white">
                {moment().format('MMMM DD, YYYY')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-gradient-blue hover-lift-blue">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-8 w-8 text-royal-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Available Exams</p>
                <p className="text-2xl font-bold text-slate-800">
                  {dashboardData?.overview?.availableExams || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card-gradient-wine hover-lift-wine">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-8 w-8 text-royal-wine-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Exams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.overview?.completedExams || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.overview?.averageScore || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.overview?.totalExams || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Exams */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Available Exams</h2>
                <Link
                  to="/student/join-exam"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Join Exam
                </Link>
              </div>
            </div>
            <div className="p-6">
              {dashboardData?.availableExams?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.availableExams.slice(0, 3).map((exam) => (
                    <div
                      key={exam._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{exam.title || 'Untitled Exam'}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {exam.subject?.name || 'Unknown Subject'} • {exam.duration || 0} minutes
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {exam.startTime ? moment(exam.startTime).format('MMM DD, YYYY HH:mm') : 'TBD'} - 
                            {exam.endTime ? moment(exam.endTime).format('HH:mm') : 'TBD'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(exam)}
                          {exam.startTime && exam.endTime && 
                           moment().isBetween(moment(exam.startTime), moment(exam.endTime)) && (
                            <Link
                              to="/student/join-exam"
                              onClick={() => handleExamStart(exam._id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <PlayIcon className="h-4 w-4 mr-1" />
                              Start
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {dashboardData.availableExams.length > 3 && (
                    <div className="text-center">
                      <Link
                        to="/student/join-exam"
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                      >
                        View all available exams
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No available exams</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Check back later for new exams.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Exam Results */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Results</h2>
                <Link
                  to="/student/history"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {dashboardData?.recentAttempts?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentAttempts.slice(0, 3).map((item) => (
                    <div
                      key={item.attempt?._id || Math.random()}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.exam?.title || 'Unknown Exam'}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.exam?.subject?.name || 'Unknown Subject'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Submitted: {item.attempt?.submittedAt ? 
                              moment(item.attempt.submittedAt).format('MMM DD, YYYY HH:mm') : 
                              'Unknown'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          {item.attempt?.score === 'PENDING' || !item.attempt?.score ? (
                            <>
                              <p className="text-lg font-bold text-yellow-600">
                                PENDING
                              </p>
                              <p className="text-sm text-yellow-600">
                                Awaiting Release
                              </p>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </>
                          ) : (
                            <>
                          <p className={`text-lg font-bold ${getScoreColor(item.attempt.percentage || 0)}`}>
                                {item.attempt.score || 0}/{item.exam?.totalMarks || 0}
                          </p>
                          <p className={`text-sm ${getScoreColor(item.attempt.percentage || 0)}`}>
                            {(item.attempt.percentage || 0).toFixed(1)}%
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            item.attempt.passed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.attempt.passed ? 'Passed' : 'Failed'}
                          </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {dashboardData.recentAttempts.length > 3 && (
                    <div className="text-center">
                      <Link
                        to="/student/history"
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                      >
                        View all results
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No exam results</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Complete an exam to see your results here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/student/join-exam"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <PlayIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Join Exam</h3>
                <p className="text-sm text-gray-500">Enter exam code to start</p>
              </div>
            </Link>

            <Link
              to="/student/history"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <ClockIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Exam History</h3>
                <p className="text-sm text-gray-500">View past exam results</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <EyeIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Profile</h3>
                <p className="text-sm text-gray-500">Update your information</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Show retry notification if there was an error but we recovered */}
        {error && dashboardData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Some data may be outdated due to connection issues. 
                  <button 
                    onClick={handleRetry}
                    className="ml-2 font-medium underline hover:text-yellow-800"
                  >
                    Refresh now
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard; 