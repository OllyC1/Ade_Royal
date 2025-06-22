import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const ViewResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if results were passed via navigation state
    if (location.state?.examResult) {
      setResults({
        fromNavigation: true,
        data: location.state.examResult
      });
      setLoading(false);
    } else {
      fetchResults();
    }
  }, [examId]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`/api/student/exams/${examId}/results`);
      setResults({
        fromNavigation: false,
        data: response.data.data
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load results';
      toast.error(message);
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  if (loading) {
    return <LoadingSpinner text="Loading results..." />;
  }

  if (!results) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Available</h2>
          <p className="text-gray-600 mb-4">
            Exam results are not available at this time.
          </p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // Handle navigation state results (immediate results after submission)
  if (results.fromNavigation) {
    const data = results.data;
    
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted</h1>
                <p className="text-gray-600">Your exam has been successfully submitted.</p>
              </div>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Results Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {data.answeredQuestions || 0}
                </div>
                <div className="text-sm text-gray-600">Questions Answered</div>
                <div className="text-xs text-gray-500">out of {data.totalQuestions || 0}</div>
              </div>
              
              {data.score !== undefined && (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {data.score}
                    </div>
                    <div className="text-sm text-gray-600">Score</div>
                    <div className="text-xs text-gray-500">out of {data.totalMarks}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${getGradeColor(data.percentage)}`}>
                      {data.percentage}%
                    </div>
                    <div className="text-sm text-gray-600">Percentage</div>
                    <div className="text-xs text-gray-500">Grade: {getGradeLetter(data.percentage)}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${data.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {data.passed ? 'PASS' : 'FAIL'}
                    </div>
                    <div className="text-sm text-gray-600">Result</div>
                  </div>
                </>
              )}
            </div>

            {data.gradingStatus === 'Pending' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Manual Grading Required</h3>
                    <p className="text-sm text-yellow-700">
                      Your exam contains theory questions that require manual grading by your teacher. 
                      Final results will be available once grading is complete.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.breakdown && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-4">Score Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.breakdown.objective.questions > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-green-600 mb-2">Objective Questions</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Questions:</span>
                          <span>{data.breakdown.objective.questions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span>{data.breakdown.objective.score}/{data.breakdown.objective.maxMarks}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {data.breakdown.theory.questions > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-purple-600 mb-2">Theory Questions</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Questions:</span>
                          <span>{data.breakdown.theory.questions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="text-yellow-600">Pending Grading</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Handle fetched results (detailed results)
  const { exam, attempt, answers } = results.data;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h1>
              <p className="text-gray-600">{exam.subject} • Results</p>
            </div>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Results Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Exam Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {attempt.score}
              </div>
              <div className="text-sm text-gray-600">Your Score</div>
              <div className="text-xs text-gray-500">out of {exam.totalMarks}</div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${getGradeColor(attempt.percentage)}`}>
                {attempt.percentage}%
              </div>
              <div className="text-sm text-gray-600">Percentage</div>
              <div className="text-xs text-gray-500">Grade: {getGradeLetter(attempt.percentage)}</div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                {attempt.passed ? 'PASS' : 'FAIL'}
              </div>
              <div className="text-sm text-gray-600">Result</div>
              <div className="text-xs text-gray-500">Pass mark: {exam.passingMarks}</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatTime(attempt.timeSpent)}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
              <div className="text-xs text-gray-500">Duration: {exam.duration} min</div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="font-medium text-gray-600">Submitted:</span>
                <span className="ml-2">{new Date(attempt.submittedAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Grading Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  attempt.gradingStatus === 'Complete' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {attempt.gradingStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-Question Results */}
        {answers && answers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Question Details</h2>
            
            <div className="space-y-6">
              {answers.map((answer, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {/* Question Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Question {answer.questionNumber}
                      </span>
                      <span className="text-sm text-gray-600">
                          {answer.marks} marks
                      </span>
                      <span className="text-xs text-gray-500">
                        Time: {formatTime(answer.timeSpent || 0)}
                      </span>
                        {answer.questionType && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {answer.questionType}
                          </span>
                        )}
                    </div>
                    
                    {answer.isCorrect !== null && (
                      <div className={`flex items-center ${
                        answer.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {answer.isCorrect ? (
                          <CheckCircleIcon className="h-5 w-5 mr-1" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {answer.isCorrect ? 'Correct' : 'Incorrect'}
                            ({answer.marksObtained || 0}/{answer.marks})
                        </span>
                      </div>
                    )}
                    
                    {answer.isCorrect === null && (
                      <div className="text-yellow-600">
                        <ClockIcon className="h-5 w-5 mr-1 inline" />
                        <span className="text-sm font-medium">Pending Review</span>
                      </div>
                    )}
                  </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-4">
                    {/* Question Text */}
                    {answer.questionText && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{answer.questionText}</p>
                      </div>
                    )}

                    {/* For Objective Questions */}
                    {answer.questionType === 'Objective' && answer.options && answer.options.length > 0 && (
                      <div className="space-y-4">
                        {/* Show all options with highlighting */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
                          <div className="space-y-2">
                            {answer.options.map((option, optionIndex) => {
                              const isStudentAnswer = answer.studentAnswer === optionIndex;
                              const isCorrectAnswer = answer.correctAnswer === optionIndex;
                              
                              let optionClass = "p-3 rounded-lg border ";
                              if (isCorrectAnswer && isStudentAnswer) {
                                optionClass += "bg-green-50 border-green-300 text-green-800";
                              } else if (isCorrectAnswer) {
                                optionClass += "bg-green-50 border-green-300 text-green-700";
                              } else if (isStudentAnswer) {
                                optionClass += "bg-red-50 border-red-300 text-red-700";
                              } else {
                                optionClass += "bg-gray-50 border-gray-200 text-gray-700";
                              }

                              return (
                                <div key={optionIndex} className={optionClass}>
                                  <div className="flex items-center justify-between">
                                    <span className="flex-1">
                                      <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                                      {option}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      {isStudentAnswer && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          Your Answer
                                        </span>
                                      )}
                                      {isCorrectAnswer && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                          Correct Answer
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-medium text-gray-700">Your Answer:</span>
                              <span className={`ml-2 ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {String.fromCharCode(65 + answer.studentAnswer)} - {answer.studentAnswerText}
                              </span>
                            </div>
                            {!answer.isCorrect && answer.correctAnswerText && (
                              <div>
                                <span className="font-medium text-gray-700">Correct Answer:</span>
                                <span className="ml-2 text-green-600">
                                  {String.fromCharCode(65 + answer.correctAnswer)} - {answer.correctAnswerText}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* For Theory Questions */}
                    {answer.questionType === 'Theory' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <h4 className="font-medium text-blue-900 mb-2">Your Answer:</h4>
                          <p className="text-blue-800 whitespace-pre-wrap">{answer.studentAnswerText}</p>
                        </div>
                        
                        {answer.isCorrect === null && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                              <div>
                                <p className="text-sm text-yellow-800">
                                  This theory question is pending manual grading by your teacher.
                                  The score will be updated once grading is complete.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* For other question types */}
                    {answer.questionType !== 'Objective' && answer.questionType !== 'Theory' && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                          <span className="font-medium">Your Answer:</span> {answer.studentAnswerText}
                    </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ViewResults; 