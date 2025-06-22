import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ClockIcon,
  TrophyIcon,
  EyeIcon,
  CalendarIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import moment from 'moment';

const ExamHistory = () => {
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    subject: '',
    status: '',
    dateRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchExamHistory();
  }, [currentPage, filters]);

  const fetchExamHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      const response = await axios.get(`/api/student/exam-history?${params}`);
      setExamHistory(response.data.data.examHistory);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching exam history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      status: '',
      dateRange: ''
    });
    setCurrentPage(1);
  };

  const getStatusBadge = (attempt) => {
    if (!attempt.isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          In Progress
        </span>
      );
    }

    // Check if results are pending
    if (attempt.score === 'PENDING' || attempt.passed === 'PENDING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Pending Review
        </span>
      );
    }

    if (attempt.passed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Passed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Failed
      </span>
    );
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  if (loading && examHistory.length === 0) {
    return <LoadingSpinner text="Loading exam history..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam History</h1>
              <p className="text-gray-600 mt-1">
                View your past exam results and performance
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Subjects</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Time</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                    <option value="last3months">Last 3 Months</option>
                    <option value="last6months">Last 6 Months</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Exam History List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner w-8 h-8"></div>
            </div>
          ) : examHistory.length > 0 ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Exam Results
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {examHistory.map((item) => (
                  <div key={item.exam._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.exam.title}
                          </h3>
                          {getStatusBadge(item.attempt)}
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1" />
                            {item.exam.subject?.name}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {moment(item.attempt.submittedAt).format('MMM DD, YYYY')}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {moment(item.attempt.submittedAt).format('HH:mm')}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Score</p>
                            {item.attempt.score === 'PENDING' ? (
                              <p className="text-lg font-bold text-yellow-600">PENDING</p>
                            ) : (
                            <p className={`text-lg font-bold ${getScoreColor(item.attempt.percentage)}`}>
                              {item.attempt.score}/{item.exam.totalMarks}
                            </p>
                            )}
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Percentage</p>
                            {item.attempt.percentage === 'PENDING' ? (
                              <p className="text-lg font-bold text-yellow-600">PENDING</p>
                            ) : (
                            <p className={`text-lg font-bold ${getScoreColor(item.attempt.percentage)}`}>
                              {item.attempt.percentage.toFixed(1)}%
                            </p>
                            )}
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Grade</p>
                            {item.attempt.percentage === 'PENDING' ? (
                              <p className="text-lg font-bold text-yellow-600">PENDING</p>
                            ) : (
                            <p className={`text-lg font-bold ${getScoreColor(item.attempt.percentage)}`}>
                              {getGrade(item.attempt.percentage)}
                            </p>
                            )}
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Passing Mark</p>
                            <p className="text-lg font-bold text-gray-900">
                              {item.exam.passingMarks}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col items-end space-y-2">
                        {item.attempt.isCompleted && (
                          <Link
                            to={`/student/results/${item.exam._id}`}
                            className="flex items-center px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        )}

                        {item.attempt.passed && (
                          <div className="flex items-center text-green-600">
                            <TrophyIcon className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">Passed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exam history</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't completed any exams yet. Take your first exam to see results here.
              </p>
              <div className="mt-6">
                <Link
                  to="/student/join-exam"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Join an Exam
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Performance Summary */}
        {examHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {examHistory.length}
                </div>
                <div className="text-sm text-gray-600">Total Exams</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {examHistory.filter(item => item.attempt.passed === true).length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {(() => {
                    const releasedResults = examHistory.filter(item => 
                      item.attempt.percentage !== 'PENDING' && typeof item.attempt.percentage === 'number'
                    );
                    return releasedResults.length > 0 
                      ? (releasedResults.reduce((sum, item) => sum + item.attempt.percentage, 0) / releasedResults.length).toFixed(1)
                      : '0.0';
                  })()}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const releasedResults = examHistory.filter(item => 
                      item.attempt.percentage !== 'PENDING' && typeof item.attempt.percentage === 'number'
                    );
                    return releasedResults.length > 0 
                      ? Math.max(...releasedResults.map(item => item.attempt.percentage)).toFixed(1)
                      : '0.0';
                  })()}%
                </div>
                <div className="text-sm text-gray-600">Best Score</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExamHistory; 