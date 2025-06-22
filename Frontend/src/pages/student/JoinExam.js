import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout/Layout';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  AcademicCapIcon,
  PlayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const JoinExam = () => {
  const [examCode, setExamCode] = useState('');
  const [examInfo, setExamInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [availableExams, setAvailableExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const fetchAvailableExams = async () => {
    try {
      const response = await axios.get(`/api/exam/active/${user.class._id}`);
      setAvailableExams(response.data.data.exams);
    } catch (error) {
      console.error('Error fetching available exams:', error);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleVerifyCode = async (code = examCode) => {
    if (!code.trim()) {
      toast.error('Please enter an exam code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/exam/code/${code.toUpperCase()}`);
      setExamInfo(response.data.data.exam);
      toast.success('Exam found! Review the details below.');
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid exam code';
      toast.error(message);
      setExamInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinExam = async () => {
    if (!examInfo) return;

    setJoining(true);
    try {
      console.log('JoinExam - Attempting to join exam:', examInfo.examCode); // Debug log
      const response = await axios.post('/api/student/join-exam', {
        examCode: examInfo.examCode
      });

      if (response.data.success) {
        const { exam, questions, canResume, resumeData } = response.data.data;
        
        console.log('JoinExam - Successfully joined exam, data received:', { exam, questions, canResume, resumeData }); // Debug log
        
        toast.success('Successfully joined exam!');
        
        // Navigate to exam with data
        navigate(`/student/exam/${exam._id}`, {
          state: { 
            examData: { exam, questions, canResume, resumeData }
          }
        });
      }
    } catch (error) {
      console.error('JoinExam - Join error:', error); // Debug log
      const message = error.response?.data?.message || 'Failed to join exam';
      
      // Check if the error is about already completing the exam
      if (message.includes('already completed')) {
        const errorData = error.response?.data;
        
        if (errorData?.canRetake === false) {
          // Show existing score and submission info - no reset option for students
          toast.error(
            `You have already completed this exam on ${new Date(errorData.submittedAt).toLocaleString()}. ` +
            `Your score: ${errorData.existingScore || 'Pending'}. ` +
            `Contact your teacher if you need to retake this exam.`
          );
        } else {
          // Exam allows retakes
          const confirmRetake = window.confirm(
            'You have already completed this exam, but retakes are allowed. Would you like to start a new attempt?'
          );
          
          if (confirmRetake) {
            // For retakes, we don't need to reset, just try joining again
            await handleJoinExam();
            return;
          }
        }
      }
      
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  const handleQuickJoin = async (exam) => {
    setJoining(true);
    try {
      const response = await axios.post('/api/student/join-exam', {
        examCode: exam.examCode
      });

      if (response.data.success) {
        const { exam: examData, questions, canResume, resumeData } = response.data.data;
        
        toast.success('Successfully joined exam!');
        
        // Navigate to exam with data  
        navigate(`/student/exam/${examData._id}`, {
          state: { 
            examData: { exam: examData, questions, canResume, resumeData }
          }
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join exam';
      
      // Check if the error is about already completing the exam
      if (message.includes('already completed')) {
        const errorData = error.response?.data;
        
        if (errorData?.canRetake === false) {
          // Show existing score and submission info - no reset option for students
          toast.error(
            `You have already completed this exam on ${new Date(errorData.submittedAt).toLocaleString()}. ` +
            `Your score: ${errorData.existingScore || 'Pending'}. ` +
            `Contact your teacher if you need to retake this exam.`
          );
        } else {
          // Exam allows retakes
          const confirmRetake = window.confirm(
            'You have already completed this exam, but retakes are allowed. Would you like to start a new attempt?'
          );
          
          if (confirmRetake) {
            // For retakes, we don't need to reset, just try joining again
            await handleQuickJoin(exam);
            return;
          }
        }
      }
      
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  const resetExamAttempt = async (examId) => {
    try {
      console.log('JoinExam - Resetting attempt for exam ID:', examId); // Debug log
      const response = await axios.delete(`/api/student/exams/${examId}/reset`);
      
      if (response.data.success) {
        const { allowsRetakes, message } = response.data;
        
        toast.success(message);
        console.log('JoinExam - Reset response:', response.data); // Debug log
        
        // If the exam allows retakes, we don't need to reset - just try joining again
        if (allowsRetakes) {
          toast.info('You can now join the exam again to start a new attempt.');
          setTimeout(() => {
            if (examInfo) {
              handleJoinExam();
            } else {
              const exam = availableExams.find(e => e._id === examId);
              if (exam) {
                handleQuickJoin(exam);
              }
            }
          }, 1000);
        } else {
          // Attempts were actually reset, can rejoin
          setTimeout(() => {
            if (examInfo) {
              console.log('JoinExam - Rejoining exam via examInfo:', examInfo); // Debug log
              handleJoinExam();
            } else {
              // Find the exam from available exams and retry
              const exam = availableExams.find(e => e._id === examId);
              if (exam) {
                console.log('JoinExam - Rejoining exam via availableExams:', exam); // Debug log
                handleQuickJoin(exam);
              } else {
                console.error('JoinExam - Could not find exam to rejoin'); // Debug log
              }
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('JoinExam - Reset error:', error); // Debug log
      const message = error.response?.data?.message || 'Failed to reset exam attempt';
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

  const canJoinExam = (exam) => {
    const now = moment();
    const startTime = moment(exam.startTime);
    const endTime = moment(exam.endTime);
    return now.isBetween(startTime, endTime);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Exam</h1>
          <p className="text-gray-600">
            Enter an exam code to join an exam or select from available exams below.
          </p>
        </div>

        {/* Exam Code Input */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Exam Code</h2>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                placeholder="Enter exam code (e.g., EXAM123)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength={12}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyCode();
                  }
                }}
              />
            </div>
            <button
              onClick={() => handleVerifyCode()}
              disabled={loading || !examCode.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="loading-spinner w-5 h-5"></div>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Verify
                </>
              )}
            </button>
          </div>

          {/* Exam Information */}
          {examInfo && (
            <div className="mt-6 border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{examInfo.title}</h3>
                  <p className="text-gray-600 mt-1">{examInfo.subject?.name}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  examInfo.isCurrentlyActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {examInfo.isCurrentlyActive ? 'Active' : 'Not Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    Duration: {examInfo.duration} minutes
                  </span>
                </div>
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    Total Marks: {examInfo.totalMarks}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">
                    Questions: {examInfo.questionCount}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Exam Schedule:</h4>
                <p className="text-sm text-gray-600">
                  Start: {moment(examInfo.startTime).format('MMMM DD, YYYY [at] HH:mm')}
                </p>
                <p className="text-sm text-gray-600">
                  End: {moment(examInfo.endTime).format('MMMM DD, YYYY [at] HH:mm')}
                </p>
              </div>

              {examInfo.instructions && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {examInfo.instructions}
                  </p>
                </div>
              )}

              {examInfo.isCurrentlyActive ? (
                <button
                  onClick={handleJoinExam}
                  disabled={joining}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {joining ? (
                    <div className="loading-spinner w-5 h-5 mr-2"></div>
                  ) : (
                    <PlayIcon className="h-5 w-5 mr-2" />
                  )}
                  {joining ? 'Joining...' : 'Join Exam'}
                </button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      This exam is not currently active. Please check the schedule above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Available Exams */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Available Exams</h2>
            <p className="text-gray-600 mt-1">
              Click on any exam below to join directly.
            </p>
          </div>
          
          <div className="p-6">
            {loadingExams ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner w-8 h-8"></div>
              </div>
            ) : availableExams.length > 0 ? (
              <div className="space-y-4">
                {availableExams.map((exam) => {
                  const status = getExamStatus(exam);
                  const canJoin = canJoinExam(exam);
                  
                  return (
                    <div
                      key={exam._id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {exam.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                              {status.text}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{exam.subject?.name}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {exam.duration} minutes
                            </div>
                            <div className="flex items-center">
                              <AcademicCapIcon className="h-4 w-4 mr-1" />
                              {exam.totalMarks} marks
                            </div>
                            <div>
                              Code: <span className="font-mono">{exam.examCode}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 text-sm text-gray-500">
                            <p>Start: {moment(exam.startTime).format('MMM DD, YYYY HH:mm')}</p>
                            <p>End: {moment(exam.endTime).format('MMM DD, YYYY HH:mm')}</p>
                          </div>
                        </div>
                        
                        <div className="ml-6">
                          {canJoin ? (
                            <button
                              onClick={() => handleQuickJoin(exam)}
                              disabled={joining}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {joining ? (
                                <div className="loading-spinner w-4 h-4 mr-2"></div>
                              ) : (
                                <PlayIcon className="h-4 w-4 mr-2" />
                              )}
                              Join
                            </button>
                          ) : (
                            <button
                              disabled
                              className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed"
                            >
                              {status.status === 'upcoming' ? 'Not Started' : 'Ended'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No available exams</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no active exams available for your class at the moment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Exam codes are usually 6-12 characters long and provided by your teacher</p>
            <p>• Make sure you have a stable internet connection before starting</p>
            <p>• You can only join exams during their scheduled time</p>
            <p>• Contact your teacher if you're having trouble accessing an exam</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JoinExam; 