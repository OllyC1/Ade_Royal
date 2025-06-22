import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import moment from 'moment';

const AllResults = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    subject: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllExams();
  }, [filters]);

  const fetchAllExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/teacher/exams');
      
      if (response.data.success) {
        // Filter exams that have submissions
        const examsWithSubmissions = response.data.data.exams.filter(exam => 
          exam.attempts && exam.attempts.some(attempt => attempt.isCompleted)
        );
        setExams(examsWithSubmissions);
      } else {
        throw new Error(response.data.message || 'Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getExamStats = (exam) => {
    const submissions = exam.attempts.filter(attempt => attempt.isCompleted);
    const pendingGrading = submissions.filter(attempt => 
      attempt.gradingStatus === 'Pending' || attempt.gradingStatus === 'Partial'
    );
    const graded = submissions.filter(attempt => 
      attempt.gradingStatus === 'Completed'
    );
    
    return {
      totalSubmissions: submissions.length,
      pendingGrading: pendingGrading.length,
      graded: graded.length
    };
  };

  const getStatusBadge = (stats) => {
    if (stats.pendingGrading === 0 && stats.graded > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          All Graded
        </span>
      );
    } else if (stats.pendingGrading > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          {stats.pendingGrading} Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Submissions
        </span>
      );
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = !filters.search || 
      exam.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      exam.examCode.toLowerCase().includes(filters.search.toLowerCase());
    
    const stats = getExamStats(exam);
    const matchesStatus = !filters.status || 
      (filters.status === 'graded' && stats.pendingGrading === 0 && stats.graded > 0) ||
      (filters.status === 'pending' && stats.pendingGrading > 0) ||
      (filters.status === 'no-submissions' && stats.totalSubmissions === 0);
    
    const matchesSubject = !filters.subject || 
      exam.subject.name.toLowerCase().includes(filters.subject.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesSubject;
  });

  if (loading) {
    return <LoadingSpinner text="Loading exam results..." />;
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">Error Loading Exams</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchAllExams}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
              <p className="text-gray-600 mt-1">
                View and manage results for all your exams
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Exams
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by title or exam code..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="graded">All Graded</option>
                <option value="pending">Pending Grading</option>
                <option value="no-submissions">No Submissions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Filter by subject..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Overall Analytics */}
        {exams.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {exams.length}
                </div>
                <div className="text-sm text-blue-600">Total Exams</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {exams.reduce((sum, exam) => sum + getExamStats(exam).totalSubmissions, 0)}
                </div>
                <div className="text-sm text-green-600">Total Submissions</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {exams.reduce((sum, exam) => sum + getExamStats(exam).pendingGrading, 0)}
                </div>
                <div className="text-sm text-yellow-600">Pending Grading</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {exams.reduce((sum, exam) => sum + getExamStats(exam).graded, 0)}
                </div>
                <div className="text-sm text-purple-600">Completed Grading</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {Math.round(
                    (exams.reduce((sum, exam) => sum + getExamStats(exam).graded, 0) / 
                     Math.max(exams.reduce((sum, exam) => sum + getExamStats(exam).totalSubmissions, 0), 1)) * 100
                  )}%
                </div>
                <div className="text-sm text-indigo-600">Grading Progress</div>
              </div>
            </div>
          </div>
        )}

        {/* Exams List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Exams ({filteredExams.length})
            </h2>
          </div>

          {filteredExams.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredExams.map((exam) => {
                const stats = getExamStats(exam);
                
                return (
                  <div key={exam._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {exam.title}
                          </h3>
                          {getStatusBadge(stats)}
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1" />
                            {exam.subject?.name}
                          </div>
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {exam.class?.name}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {moment(exam.startTime).format('MMM DD, YYYY')}
                          </div>
                          <div>
                            Code: <span className="font-mono font-medium">{exam.examCode}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-600 uppercase tracking-wide">Total Submissions</p>
                            <p className="text-lg font-bold text-blue-700">{stats.totalSubmissions}</p>
                          </div>

                          <div className="bg-yellow-50 rounded-lg p-3">
                            <p className="text-xs text-yellow-600 uppercase tracking-wide">Pending Grading</p>
                            <p className="text-lg font-bold text-yellow-700">{stats.pendingGrading}</p>
                          </div>

                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-green-600 uppercase tracking-wide">Graded</p>
                            <p className="text-lg font-bold text-green-700">{stats.graded}</p>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Total Marks</p>
                            <p className="text-lg font-bold text-gray-700">{exam.totalMarks}</p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col items-end space-y-2">
                        {stats.totalSubmissions > 0 && (
                          <Link
                            to={`/teacher/exams/${exam._id}/results`}
                            className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <ChartBarIcon className="h-4 w-4 mr-2" />
                            View Results
                          </Link>
                        )}

                        <Link
                          to={`/teacher/manage-exams`}
                          className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Manage Exam
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exam results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.status || filters.subject 
                  ? 'Try adjusting your filters or create some exams first.'
                  : 'Create some exams and wait for student submissions to see results here.'
                }
              </p>
              <div className="mt-6">
                <Link
                  to="/teacher/create-exam"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create New Exam
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AllResults; 