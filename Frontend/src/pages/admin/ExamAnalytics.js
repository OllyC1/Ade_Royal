import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  TrophyIcon,
  EyeIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const ExamAnalytics = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    class: '',
    student: '',
    examType: '',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [analytics, setAnalytics] = useState({
    averageScore: 0,
    totalExams: 0,
    passRate: 0,
    topPerformers: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [classesRes, subjectsRes, studentsRes] = await Promise.all([
        axios.get('/api/admin/classes'),
        axios.get('/api/admin/subjects'),
        axios.get('/api/admin/users?role=student&limit=1000')
      ]);

      setClasses(classesRes.data.data?.classes || []);
      setSubjects(subjectsRes.data.data?.subjects || []);
      setStudents(studentsRes.data.data?.users || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.class) params.append('class', filters.class);
      if (filters.student) params.append('student', filters.student);
      if (filters.examType) params.append('examType', filters.examType);
      if (filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);

      const response = await axios.get(`/api/admin/results?${params}`);
      const data = response.data.data;
      
      setResults(data.results || []);
      setAnalytics({
        averageScore: data.analytics?.averageScore || 0,
        totalExams: data.analytics?.totalExams || 0,
        passRate: data.analytics?.passRate || 0,
        topPerformers: data.analytics?.topPerformers || []
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      class: '',
      student: '',
      examType: '',
      dateRange: 'all'
    });
    setSearchTerm('');
  };

  const exportResults = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await axios.get(`/api/admin/results/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam_results_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Results exported successfully');
    } catch (error) {
      console.error('Error exporting results:', error);
      toast.error('Failed to export results');
    } finally {
      setExportLoading(false);
    }
  };

  const viewResultDetails = (result) => {
    try {
      if (!result?.exam?._id || !result?.student?._id) {
        toast.error('Invalid result data');
        return;
      }

      // Navigate to detailed result view
      navigate(`/admin/results/${result.exam._id}/${result.student._id}`, {
        state: { 
          examTitle: result.exam.title,
          studentName: `${result.student.firstName} ${result.student.lastName}`
        }
      });
    } catch (error) {
      console.error('Error navigating to result details:', error);
      toast.error('Unable to view result details');
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGrade = (percentage) => {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  // Enhanced search functionality
  const filteredResults = results.filter(result => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const searchFields = [
      result.student?.firstName,
      result.student?.lastName,
      result.student?.studentId,
      result.exam?.title,
      result.exam?.examCode,
      result.exam?.subject?.name,
      result.exam?.class?.name,
      `${result.student?.firstName} ${result.student?.lastName}`.trim()
    ].filter(Boolean);

    return searchFields.some(field => 
      field.toLowerCase().includes(searchLower)
    );
  });

  // Display score and percentage properly
  const displayScore = (result) => {
    const score = result.score || 0;
    const percentage = result.percentage || 0;
    const totalMarks = result.exam?.totalMarks || 0;
    
    // Use percentage if available, otherwise calculate from score and total marks
    const displayPercentage = percentage || (totalMarks > 0 ? (score / totalMarks) * 100 : 0);
    
    return {
      scoreText: totalMarks > 0 ? `${score}/${totalMarks}` : `${score}`,
      percentage: displayPercentage,
      percentageText: `${displayPercentage.toFixed(1)}%`
    };
  };

  if (loading && results.length === 0) {
    return <LoadingSpinner text="Loading exam analytics..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Student Results & Analytics
              </h1>
              <p className="text-gray-600">
                Monitor exam performance and analyze student results
              </p>
            </div>
            <button
              onClick={exportResults}
              disabled={exportLoading}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {exportLoading ? 'Exporting...' : 'Export Results'}
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageScore.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalExams}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <TrophyIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.passRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <UserGroupIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredResults.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="form-label">Subject</label>
              <select
                className="form-input"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Class</label>
              <select
                className="form-input"
                value={filters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Student</label>
              <select
                className="form-input"
                value={filters.student}
                onChange={(e) => handleFilterChange('student', e.target.value)}
              >
                <option value="">All Students</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Date Range</label>
              <select
                className="form-input"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>

            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students, exams..."
                  className="form-input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="btn-secondary flex items-center w-full justify-center"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        {analytics.topPerformers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.topPerformers.slice(0, 3).map((performer, index) => (
                  <div key={performer._id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {performer.firstName} {performer.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {performer.class?.name} • Avg: {performer.averageScore?.toFixed(1)}%
                      </p>
                    </div>
                    <TrophyIcon className={`h-6 w-6 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-500' :
                      'text-orange-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Exam Results</h2>
              {searchTerm && (
                <p className="text-sm text-gray-600">
                  Showing {filteredResults.length} of {results.length} results
                </p>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <LoadingSpinner text="Loading results..." />
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result) => {
                    const scoreInfo = displayScore(result);
                    return (
                    <tr key={result._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {result.student?.firstName?.[0]}{result.student?.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {result.student?.firstName} {result.student?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.student?.studentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.exam?.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.exam?.examCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.exam?.subject?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.exam?.class?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(scoreInfo.percentage)}`}>
                              {scoreInfo.percentageText}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {scoreInfo.scoreText}
                        </span>
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(scoreInfo.percentage)}`}>
                            {getGrade(scoreInfo.percentage)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(result.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                            onClick={() => viewResultDetails(result)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="View detailed results"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.values(filters).some(f => f && f !== 'all') || searchTerm
                  ? 'Try adjusting your filters or search terms.'
                  : 'No exam results available yet.'}
              </p>
              {(Object.values(filters).some(f => f && f !== 'all') || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 btn-secondary"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExamAnalytics; 