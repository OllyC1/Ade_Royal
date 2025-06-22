import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const ExamResults = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [analytics, setAnalytics] = useState({
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    highestScore: 0,
    lowestScore: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradingScores, setGradingScores] = useState({});
  const [isReleasing, setIsReleasing] = useState(false);
  
  // New state for release/unrelease functionality
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showUnreleaseModal, setShowUnreleaseModal] = useState(false);
  const [releaseAction, setReleaseAction] = useState('release'); // 'release' or 'unrelease'

  const navigate = useNavigate();

  useEffect(() => {
    if (examId) {
      fetchExamResults();
    }
  }, [examId, filters]);

  const fetchExamResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/teacher/exams/${examId}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Exam results response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch exam results');
      }

      if (data.success) {
        console.log('✅ Exam results loaded:', {
          exam: data.data.exam,
          attempts: data.data.attempts,
          totalAttempts: data.data.attempts?.length || 0
        });
        
        setExam(data.data.exam);
        setResults(data.data.attempts || []);
        setAnalytics(data.data.analytics || analytics);
      } else {
        throw new Error(data.message || 'Failed to fetch exam results');
      }
    } catch (error) {
      console.error('Error fetching exam results:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleGradeTheoryQuestion = async (resultId, questionId, score, feedback) => {
    try {
      await axios.put(`/api/teacher/results/${resultId}/grade`, {
        questionId,
        score,
        feedback
      });
      toast.success('Question graded successfully');
      fetchExamResults();
      setShowGradingModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to grade question');
    }
  };

  const exportResults = async () => {
    try {
      const response = await axios.get(`/api/teacher/exams/${examId}/results/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exam?.title || 'exam'}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Results exported successfully');
    } catch (error) {
      toast.error('Failed to export results');
    }
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

  const filteredResults = results.filter(result => {
    const matchesSearch = !filters.search || 
      result.student.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
      result.student.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
      result.student.studentId.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || 
      (filters.status === 'graded' && result.isGraded) ||
      (filters.status === 'pending' && !result.isGraded);
    
    return matchesSearch && matchesStatus;
  });

  const handleGradeSubmit = async () => {
    try {
      const grades = Object.entries(gradingScores).map(([questionNumber, marksObtained]) => ({
        questionNumber: parseInt(questionNumber),
        marksObtained: parseFloat(marksObtained) || 0
      }));

      const response = await fetch(`/api/teacher/exams/${examId}/grade-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: selectedResult.student._id,
          grades: grades
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Student graded successfully');
        setShowGradingModal(false);
        setGradingScores({});
        fetchExamResults(); // Refresh results
      } else {
        toast.error(data.message || 'Failed to grade student');
      }
    } catch (error) {
      console.error('Error grading student:', error);
      toast.error('Failed to grade student');
    }
  };

  const handleReleaseResults = async (action = 'release') => {
    try {
      setIsReleasing(true);
      
      const endpoint = action === 'release' ? 'release-results' : 'unrelease-results';
      const response = await fetch(`/api/teacher/exams/${examId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const message = action === 'release' 
          ? 'Results released successfully! Students can now view their scores.'
          : 'Results unreleased successfully! Students can no longer view their scores.';
        toast.success(message);
        fetchExamResults(); // Refresh results
        setShowReleaseModal(false);
        setShowUnreleaseModal(false);
      } else {
        toast.error(data.message || `Failed to ${action} results`);
      }
    } catch (error) {
      console.error(`Error ${action}ing results:`, error);
      toast.error(`Failed to ${action} results`);
    } finally {
      setIsReleasing(false);
    }
  };

  const openReleaseModal = (action) => {
    setReleaseAction(action);
    if (action === 'release') {
      setShowReleaseModal(true);
    } else {
      setShowUnreleaseModal(true);
    }
  };

  const getResultsStatus = () => {
    if (!results || results.length === 0) return null;
    
    const releasedResults = results.filter(result => result.resultsReleased);
    const totalResults = results.length;
    
    if (releasedResults.length === 0) {
      return { status: 'not_released', message: 'Results not released to students' };
    } else if (releasedResults.length === totalResults) {
      return { status: 'fully_released', message: 'Results released to all students' };
    } else {
      return { status: 'partially_released', message: `Results released to ${releasedResults.length}/${totalResults} students` };
    }
  };

  const handleScoreChange = (questionNumber, value, maxMarks) => {
    const numValue = parseFloat(value);
    
    // Validate the score
    if (value === '') {
      // Allow empty value for clearing
      setGradingScores(prev => ({
        ...prev,
        [questionNumber]: ''
      }));
      return;
    }
    
    if (isNaN(numValue)) {
      toast.error('Please enter a valid number');
      return;
    }
    
    if (numValue < 0) {
      toast.error('Score cannot be negative');
      return;
    }
    
    if (numValue > maxMarks) {
      toast.error(`Score cannot exceed maximum marks (${maxMarks})`);
      return;
    }
    
    setGradingScores(prev => ({
      ...prev,
      [questionNumber]: numValue
    }));
  };

  if (loading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">Error Loading Results</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchExamResults}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!exam) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Exam not found</h3>
          <p className="text-gray-500">The exam you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {exam?.title} - Results
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-gray-600">
                  Exam Code: {exam?.examCode} | Total Marks: {exam?.totalMarks}
                </p>
                {/* Results Status Indicator */}
                {(() => {
                  const status = getResultsStatus();
                  if (!status) return null;
                  
                  return (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status.status === 'fully_released' 
                        ? 'bg-green-100 text-green-700'
                        : status.status === 'partially_released'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {status.status === 'fully_released' && '✅ '}
                      {status.status === 'partially_released' && '⚠️ '}
                      {status.status === 'not_released' && '🔒 '}
                      {status.message}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex space-x-4">
              {(() => {
                const status = getResultsStatus();
                const hasReleasedResults = status?.status === 'fully_released' || status?.status === 'partially_released';
                
                return (
                  <>
                    {hasReleasedResults ? (
                      <button
                        onClick={() => openReleaseModal('unrelease')}
                        disabled={isReleasing}
                        className={`px-6 py-2 rounded font-medium ${
                          isReleasing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-red-600 hover:bg-red-700'
                        } text-white`}
                      >
                        {isReleasing ? 'Processing...' : 'Unrelease Results'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openReleaseModal('release')}
                        disabled={isReleasing}
                        className={`px-6 py-2 rounded font-medium ${
                          isReleasing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                      >
                        {isReleasing ? 'Releasing...' : 'Release Results'}
                      </button>
                    )}
                    
                    {hasReleasedResults && (
                      <button
                        onClick={() => openReleaseModal('release')}
                        disabled={isReleasing}
                        className={`px-6 py-2 rounded font-medium border-2 ${
                          isReleasing 
                            ? 'border-gray-400 text-gray-400 cursor-not-allowed' 
                            : 'border-green-600 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        Re-release Results
                      </button>
                    )}
                  </>
                );
              })()}
              
              <button
                onClick={() => navigate('/teacher/manage-exams')}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{analytics.totalAttempts || 0}</div>
              <div className="text-sm text-blue-600">Total Attempts</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">{analytics.averageScore?.toFixed(1) || 0}%</div>
              <div className="text-sm text-green-600">Average Score</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{analytics.passRate?.toFixed(1) || 0}%</div>
              <div className="text-sm text-purple-600">Pass Rate</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">{analytics.highestScore?.toFixed(1) || 0}%</div>
              <div className="text-sm text-yellow-600">Highest Score</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-red-600">{analytics.lowestScore?.toFixed(1) || 0}%</div>
              <div className="text-sm text-red-600">Lowest Score</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{analytics.pendingGrading || 0}</div>
              <div className="text-sm text-orange-600">Pending Grading</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Search Students</label>
              <input
                type="text"
                placeholder="Search by name or student ID..."
                className="form-input"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            
            <div>
              <label className="form-label">Grading Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Results</option>
                <option value="graded">Fully Graded</option>
                <option value="pending">Pending Grading</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', search: '' })}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Student Results ({filteredResults.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Taken
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => {
                    const score = result.score || result.totalScore || 0;
                    const percentage = score && exam.totalMarks ? (score / exam.totalMarks) * 100 : 0;
                    const grade = getGradeLetter(percentage);
                    const gradeColor = getGradeColor(percentage);
                    const isGraded = result.gradingStatus === 'Completed';
                    
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
                                {result.student.firstName} {result.student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {result.student.studentId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {score}/{exam.totalMarks}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isGraded
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isGraded ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Completed
                              </>
                            ) : (
                              <>
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {result.gradingStatus || 'Pending'}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.timeSpent ? `${Math.floor(result.timeSpent / 60)}m ${result.timeSpent % 60}s` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(result.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                console.log('🔍 Opening grading modal for result:', {
                                  student: result.student,
                                  answers: result.answers,
                                  answersCount: result.answers?.length || 0
                                });
                                setSelectedResult(result);
                                setShowGradingModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View/Grade Answers"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {!isGraded && (
                              <button
                                onClick={() => {
                                  setSelectedResult(result);
                                  setShowGradingModal(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Grade Theory Questions"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No students have submitted this exam yet.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grading Modal */}
        {showGradingModal && selectedResult && (
          <div className="modal-overlay">
            <div className="modal-content max-w-5xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Grade Answers - {selectedResult.student.firstName} {selectedResult.student.lastName}
                </h3>
                <button
                  onClick={() => setShowGradingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Debug info */}
                {!selectedResult.answers || selectedResult.answers.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800">
                      No answers found for this student. This might be because:
                    </p>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                      <li>The student didn't submit any answers</li>
                      <li>The exam data is not loading properly</li>
                      <li>There's an issue with the question/answer mapping</li>
                    </ul>
                    <div className="mt-3 text-xs text-gray-600">
                      Debug info: {selectedResult.answers ? `${selectedResult.answers.length} answers` : 'No answers array'}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Section-based display for Mixed exams */}
                    {(() => {
                      const objectiveCount = selectedResult.answers?.filter(answer => answer.question?.questionType === 'Objective').length || 0;
                      const theoryCount = selectedResult.answers?.filter(answer => answer.question?.questionType === 'Theory').length || 0;
                      const isMixedExam = exam?.examType === 'Mixed' || (objectiveCount > 0 && theoryCount > 0);
                      return isMixedExam;
                    })() ? (
                      <div className="space-y-8">
                        {/* Objective Questions Section */}
                        {selectedResult.answers?.filter(answer => answer.question?.questionType === 'Objective').length > 0 && (
                          <div>
                            <div className="flex items-center mb-4">
                              <span className="text-lg font-semibold text-green-700">📝 Objective Questions</span>
                              <div className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                {selectedResult.answers?.filter(answer => answer.question?.questionType === 'Objective').length} questions
                              </div>
                            </div>
                            <div className="space-y-4">
                              {selectedResult.answers
                                ?.filter(answer => answer.question?.questionType === 'Objective')
                                .map((answer, index) => (
                                <div key={`obj-${index}`} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                  <div className="mb-4">
                                    <h4 className="font-medium text-gray-900 mb-2">
                                      Objective Question {index + 1}
                                    </h4>
                                    <p className="text-gray-700 mb-3">
                                      {answer.question?.questionText}
                                    </p>
                                    
                                    <div className="space-y-2">
                                      <div className="text-sm">
                                        <span className="font-medium">Student Answer:</span>
                                        <span className={`ml-2 px-2 py-1 rounded ${
                                          answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {answer.answer !== undefined && answer.answer !== null && answer.question?.options?.[answer.answer] 
                                            ? `Option ${parseInt(answer.answer) + 1}: ${answer.question.options[answer.answer]}`
                                            : answer.answer || 'No answer provided'}
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="font-medium">Correct Answer:</span>
                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                          {answer.question?.correctAnswer !== undefined && answer.question?.options?.[answer.question.correctAnswer]
                                            ? `Option ${answer.question.correctAnswer + 1}: ${answer.question.options[answer.question.correctAnswer]}`
                                            : 'Not available'}
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="font-medium">Score:</span>
                                        <span className={`ml-2 px-2 py-1 rounded ${
                                          answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {answer.marksObtained || 0}/{answer.question?.marks || 0}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Theory Questions Section */}
                        {selectedResult.answers?.filter(answer => answer.question?.questionType === 'Theory').length > 0 && (
                          <div>
                            <div className="flex items-center mb-4">
                              <span className="text-lg font-semibold text-purple-700">📄 Theory Questions</span>
                              <div className="ml-4 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                {selectedResult.answers?.filter(answer => answer.question?.questionType === 'Theory').length} questions
                              </div>
                            </div>
                            <div className="space-y-4">
                              {selectedResult.answers
                                ?.filter(answer => answer.question?.questionType === 'Theory')
                                .map((answer, index) => (
                                <div key={`theory-${index}`} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                                  <div className="mb-4">
                                    <h4 className="font-medium text-gray-900 mb-2">
                                      Theory Question {index + 1}
                                    </h4>
                                    <p className="text-gray-700 mb-3">
                                      {answer.question?.questionText}
                                    </p>
                                    
                                    <div className="space-y-3">
                                      <div className="text-sm">
                                        <span className="font-medium">Student Answer:</span>
                                        <div className="mt-2 p-3 bg-white rounded border min-h-[100px]">
                                          {answer.answer || 'No answer provided'}
                                        </div>
                                      </div>
                                      <div className="text-sm">
                                        <label className="block font-medium text-gray-700 mb-1">
                                          Marks Obtained (Max: {answer.question?.marks || 0})
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          max={answer.question?.marks || 0}
                                          step="0.5"
                                          value={gradingScores[answer.questionNumber] || answer.marksObtained || ''}
                                          onChange={(e) => handleScoreChange(answer.questionNumber, e.target.value, answer.question?.marks || 0)}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          placeholder="Enter marks"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Original single-section layout for non-Mixed exams
                      <div className="space-y-6">
                        {selectedResult.answers?.map((answer, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">
                                Question {index + 1}
                              </h4>
                              <p className="text-gray-700 mb-3">
                                {answer.question?.questionText}
                              </p>
                              
                              {answer.question?.questionType === 'Theory' ? (
                                <div className="space-y-3">
                                  <div className="text-sm">
                                    <span className="font-medium">Student Answer:</span>
                                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                                      {answer.answer || 'No answer provided'}
                                    </div>
                                  </div>
                                  <div className="text-sm">
                                    <label className="block font-medium text-gray-700 mb-1">
                                      Marks Obtained (Max: {answer.question?.marks || 0})
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={answer.question?.marks || 0}
                                      step="0.5"
                                      value={gradingScores[answer.questionNumber] || answer.marksObtained || ''}
                                      onChange={(e) => handleScoreChange(answer.questionNumber, e.target.value, answer.question?.marks || 0)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Enter marks"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium">Student Answer:</span>
                                    <span className={`ml-2 px-2 py-1 rounded ${
                                      answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {answer.answer !== undefined && answer.answer !== null && answer.question?.options?.[answer.answer] 
                                        ? `Option ${parseInt(answer.answer) + 1}: ${answer.question.options[answer.answer]}`
                                        : answer.answer || 'No answer provided'}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Correct Answer:</span>
                                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                      {answer.question?.correctAnswer !== undefined && answer.question?.options?.[answer.question.correctAnswer]
                                        ? `Option ${answer.question.correctAnswer + 1}: ${answer.question.options[answer.question.correctAnswer]}`
                                        : 'Not available'}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Score:</span>
                                    <span className={`ml-2 px-2 py-1 rounded ${
                                      answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {answer.marksObtained || 0}/{answer.question?.marks || 0}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <button
                  onClick={() => setShowGradingModal(false)}
                  className="mr-3 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={handleGradeSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Grading
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Release Results Confirmation Modal */}
        {showReleaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Release Results
              </h3>
              
              <div className="space-y-3 mb-6">
                <p className="text-gray-600">
                  Are you sure you want to release the results for this exam?
                </p>
                
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>What happens when you release results:</strong>
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                    <li>Students will be able to view their scores</li>
                    <li>Students can see detailed question-by-question breakdown</li>
                    <li>You can still unrelease results later if needed</li>
                    <li>Students will receive notifications about their results</li>
                  </ul>
                </div>

                {analytics.pendingGrading > 0 && (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="text-yellow-800 text-sm">
                      <strong>⚠️ Warning:</strong> There are {analytics.pendingGrading} students with pending grading.
                      Their results will show as "Pending" until you complete grading.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReleaseModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReleaseResults('release')}
                  disabled={isReleasing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isReleasing ? 'Releasing...' : 'Release Results'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unrelease Results Confirmation Modal */}
        {showUnreleaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Unrelease Results
              </h3>
              
              <div className="space-y-3 mb-6">
                <p className="text-gray-600">
                  Are you sure you want to unrelease the results for this exam?
                </p>
                
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-sm text-red-800">
                    <strong>What happens when you unrelease results:</strong>
                  </p>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    <li>Students will no longer be able to view their scores</li>
                    <li>All student access to results will be revoked</li>
                    <li>You can make additional changes and re-release later</li>
                    <li>Students will not receive any notification about this action</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>💡 Tip:</strong> Use this if you need to make corrections to grades or want to prevent students from seeing results temporarily.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUnreleaseModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReleaseResults('unrelease')}
                  disabled={isReleasing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isReleasing ? 'Processing...' : 'Unrelease Results'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExamResults; 