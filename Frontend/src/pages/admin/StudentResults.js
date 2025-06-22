import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    class: '',
    student: '',
    examType: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });
  const [analytics, setAnalytics] = useState({
    totalResults: 0,
    averageScore: 0,
    passRate: 0,
    totalStudents: 0,
    totalExams: 0
  });
  const [selectedResult, setSelectedResult] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

      setClasses(classesRes.data.data.classes || []);
      setSubjects(subjectsRes.data.data.subjects || []);
      setStudents(studentsRes.data.data.users || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    }
  };

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );

      const response = await axios.get(`/api/admin/results?${params}&limit=50`);
      setResults(response.data.data.results || []);
      setAnalytics(response.data.data.analytics || analytics);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      // Reset student filter when class changes
      ...(field === 'class' && { student: '' })
    }));
  };

  const exportResults = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );

      const response = await axios.get(`/api/admin/results/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_results_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Results exported successfully');
    } catch (error) {
      toast.error('Failed to export results');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      class: '',
      student: '',
      examType: '',
      dateFrom: '',
      dateTo: '',
      status: ''
    });
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const filteredStudents = students.filter(student => 
    !filters.class || student.class?._id === filters.class
  );

  if (loading) {
    return <LoadingSpinner text="Loading student results..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Student Results Overview
              </h1>
              <p className="text-gray-600">
                View and analyze all student exam results across subjects and classes
              </p>
            </div>
            <button
              onClick={exportResults}
              disabled={exporting}
              className="btn-primary flex items-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {exporting ? 'Exporting...' : 'Export Results'}
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Results</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalResults}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageScore?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.passRate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exams</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalExams}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="form-label">Class</label>
              <select
                className="form-input"
                value={filters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
              >
                <option value="">All Classes</option>
                {classes
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="form-label">Subject</label>
              <select
                className="form-input"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(subject => (
                    <option key={subject._id} value={subject._id}>{subject.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="form-label">Student</label>
              <select
                className="form-input"
                value={filters.student}
                onChange={(e) => handleFilterChange('student', e.target.value)}
                disabled={!filters.class}
              >
                <option value="">All Students</option>
                {filteredStudents
                  .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                  .map(student => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} ({student.studentId})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="form-label">Exam Type</label>
              <select
                className="form-input"
                value={filters.examType}
                onChange={(e) => handleFilterChange('examType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Objective">Objective</option>
                <option value="Theory">Theory</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="graded">Graded</option>
                <option value="pending">Pending Grading</option>
              </select>
            </div>

            <div className="flex items-end">
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

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Results ({results.length})
            </h3>
          </div>
          
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
                    Subject/Class
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.length > 0 ? (
                  results.map((result) => {
                    const percentage = (result.totalScore / result.exam?.totalMarks) * 100;
                    const grade = getGradeLetter(percentage);
                    const gradeColor = getGradeColor(percentage);
                    
                    return (
                      <tr key={result._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-600" />
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {result.exam?.subject?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.exam?.class?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {result.totalScore}/{result.exam?.totalMarks}
                          </div>
                          <div className="text-sm text-gray-500">
                            {percentage.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${gradeColor}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(result.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.isGraded 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.isGraded ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Graded
                              </>
                            ) : (
                              <>
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedResult(result);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No exam results match your current filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Result Detail Modal */}
        {showDetailModal && selectedResult && (
          <div className="modal-overlay">
            <div className="modal-content max-w-4xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Result Details - {selectedResult.student?.firstName} {selectedResult.student?.lastName}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Student Information</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="text-sm text-gray-900">
                          {selectedResult.student?.firstName} {selectedResult.student?.lastName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Student ID</dt>
                        <dd className="text-sm text-gray-900">{selectedResult.student?.studentId}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Class</dt>
                        <dd className="text-sm text-gray-900">{selectedResult.exam?.class?.name}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Exam Information</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Title</dt>
                        <dd className="text-sm text-gray-900">{selectedResult.exam?.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Subject</dt>
                        <dd className="text-sm text-gray-900">{selectedResult.exam?.subject?.name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Score</dt>
                        <dd className="text-sm text-gray-900">
                          {selectedResult.totalScore}/{selectedResult.exam?.totalMarks} (
                          {((selectedResult.totalScore / selectedResult.exam?.totalMarks) * 100).toFixed(1)}%)
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Answers */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Answers</h4>
                  <div className="space-y-4">
                    {selectedResult.answers?.map((answer, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Question {index + 1}
                          </h5>
                          <p className="text-gray-700 mb-3">
                            {answer.question?.questionText}
                          </p>
                        </div>
                        
                        {answer.question?.questionType === 'Objective' ? (
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Student Answer:</span>
                              <span className={`ml-2 px-2 py-1 rounded ${
                                answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {answer.selectedOption}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Correct Answer:</span>
                              <span className="ml-2 text-green-600">
                                {answer.question?.options?.find(opt => opt.isCorrect)?.text}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-3">
                              <span className="font-medium text-sm">Student Answer:</span>
                              <div className="mt-1 p-3 bg-gray-50 rounded border">
                                {answer.textAnswer || 'No answer provided'}
                              </div>
                            </div>
                            {answer.feedback && (
                              <div>
                                <span className="font-medium text-sm">Teacher Feedback:</span>
                                <div className="mt-1 p-3 bg-blue-50 rounded border">
                                  {answer.feedback}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-3 text-sm">
                          <span className="font-medium">Score:</span>
                          <span className="ml-2">
                            {answer.score}/{answer.question?.marks} marks
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentResults; 