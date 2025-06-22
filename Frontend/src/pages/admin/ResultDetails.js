import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResultDetails = () => {
  const { examId, studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get initial state data if available
  const { examTitle, studentName } = location.state || {};

  useEffect(() => {
    fetchResultDetails();
  }, [examId, studentId]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/admin/results/${examId}/${studentId}`);
      setResult(response.data.data);
    } catch (error) {
      console.error('Error fetching result details:', error);
      setError(error);
      
      if (error.response?.status === 404) {
        toast.error('Result not found');
      } else {
        toast.error('Failed to load result details');
      }
    } finally {
      setLoading(false);
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

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/analytics')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Analytics
            </button>
          </div>
          <LoadingSpinner text="Loading result details..." />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <button
            onClick={() => navigate('/admin/analytics')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Analytics
          </button>
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to load result details</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error.response?.status === 404 
                ? 'The requested result could not be found.' 
                : 'There was an error loading the result details.'}
            </p>
            <div className="mt-4 space-x-3">
              <button
                onClick={fetchResultDetails}
                className="btn-primary"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="btn-secondary"
              >
                Back to Analytics
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!result) {
    return (
      <Layout>
        <div className="space-y-6">
          <button
            onClick={() => navigate('/admin/analytics')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Analytics
          </button>
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Result not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The requested result details could not be found.
            </p>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="mt-4 btn-primary"
            >
              Back to Analytics
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const displayScore = (result) => {
    const score = result.score || 0;
    const percentage = result.percentage || 0;
    const totalMarks = result.exam?.totalMarks || 0;
    
    const displayPercentage = percentage || (totalMarks > 0 ? (score / totalMarks) * 100 : 0);
    
    return {
      scoreText: totalMarks > 0 ? `${score}/${totalMarks}` : `${score}`,
      percentage: displayPercentage,
      percentageText: `${displayPercentage.toFixed(1)}%`
    };
  };

  const scoreInfo = displayScore(result);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/analytics')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Analytics
          </button>
        </div>

        {/* Result Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {examTitle || result.exam?.title || 'Exam Result'}
              </h1>
              <p className="text-gray-600">
                Student: {studentName || `${result.student?.firstName} ${result.student?.lastName}`}
              </p>
              <p className="text-sm text-gray-500">
                Student ID: {result.student?.studentId}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-4 py-2 text-lg font-bold rounded-lg ${getScoreColor(scoreInfo.percentage)}`}>
                {scoreInfo.percentageText}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {scoreInfo.scoreText}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Grade</p>
                <p className="text-2xl font-bold text-gray-900">{getGrade(scoreInfo.percentage)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(result.timeSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <AcademicCapIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subject</p>
                <p className="text-lg font-bold text-gray-900">{result.exam?.subject?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <UserIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Class</p>
                <p className="text-lg font-bold text-gray-900">{result.exam?.class?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Exam Code:</span>
                <span className="font-medium">{result.exam?.examCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{result.answers?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Marks:</span>
                <span className="font-medium">{result.exam?.totalMarks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passing Marks:</span>
                <span className="font-medium">{result.exam?.passingMarks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{result.exam?.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  scoreInfo.percentage >= (result.exam?.passingMarks / result.exam?.totalMarks * 100)
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {scoreInfo.percentage >= (result.exam?.passingMarks / result.exam?.totalMarks * 100) ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted At:</span>
                <span className="font-medium">
                  {new Date(result.submittedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Grading Status:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  result.gradingStatus === 'Completed' 
                    ? 'bg-green-100 text-green-800' 
                    : result.gradingStatus === 'Partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {result.gradingStatus}
                </span>
              </div>
              {result.gradedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Graded At:</span>
                  <span className="font-medium">
                    {new Date(result.gradedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {result.autoGradedMarks > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto Graded:</span>
                  <span className="font-medium">{result.autoGradedMarks} marks</span>
                </div>
              )}
              {result.manualGradedMarks > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Manual Graded:</span>
                  <span className="font-medium">{result.manualGradedMarks} marks</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question-wise Performance */}
        {result.answers && result.answers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Question-wise Performance</h3>
            <div className="space-y-4">
              {result.answers.map((answer, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Question {answer.questionNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({answer.questionType})
                        </span>
                        {answer.isCorrect ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Marks: {answer.marksObtained || 0}
                        {answer.timeSpent && (
                          <span className="ml-4">Time: {formatTime(answer.timeSpent)}</span>
                        )}
                      </div>
                      {answer.needsGrading && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full mt-2">
                          Needs Manual Grading
                        </span>
                      )}
                    </div>
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

export default ResultDetails; 