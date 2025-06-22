import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { joinExamRoom, leaveExamRoom } = useSocket();

  // Core exam state
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // UI state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuestionPanel, setShowQuestionPanel] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());

  // New state for section-based navigation
  const [currentSection, setCurrentSection] = useState('objective'); // 'objective', 'theory', or 'all'
  const [sectionQuestions, setSectionQuestions] = useState({
    objective: [],
    theory: [],
    all: []
  });

  // Refs for timers
  const examTimerRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    initializeExam();
    
    // Cleanup on unmount
    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (examData && examData._id) leaveExamRoom(examData._id);
    };
  }, [examId]);

  // Initialize exam from location state or fetch
  const initializeExam = async () => {
    try {
      let examInfo = location.state?.examData;
      
      console.log('TakeExam - Initializing exam with data:', examInfo); // Debug log
      
      if (!examInfo) {
        // If no exam data in state, we need to redirect back to join exam
        // since we need the exam code to fetch exam data
        console.error('TakeExam - No exam data found in location state'); // Debug log
        toast.error('No exam data found. Please join the exam again.');
        navigate('/student/join-exam');
        return;
      }

      console.log('TakeExam - Setting exam data:', examInfo.exam); // Debug log
      console.log('TakeExam - Setting questions:', examInfo.questions); // Debug log
      
      setExamData(examInfo.exam);
      setQuestions(examInfo.questions);
      
      // Organize questions by sections for Mixed exams
      const objectiveQuestions = examInfo.questions.filter(q => q.questionType === 'Objective');
      const theoryQuestions = examInfo.questions.filter(q => q.questionType === 'Theory');
      
      setSectionQuestions({
        objective: objectiveQuestions,
        theory: theoryQuestions,
        all: examInfo.questions
      });

      // Set initial section based on exam type
      if (examInfo.exam.examType === 'Mixed') {
        if (objectiveQuestions.length > 0) {
          setCurrentSection('objective');
        } else if (theoryQuestions.length > 0) {
          setCurrentSection('theory');
        }
      } else {
        setCurrentSection('all');
      }

      // Check if student can resume
      if (examInfo.canResume && examInfo.resumeData) {
        const resumeConfirm = window.confirm(
          'You have a previous attempt for this exam. Would you like to resume where you left off?'
        );
        
        if (resumeConfirm) {
          // Load previous answers
          const answersMap = {};
          examInfo.resumeData.answers.forEach(answer => {
            answersMap[answer.questionId] = answer.answer;
          });
          setAnswers(answersMap);
          
          // Find the last answered question
          const lastAnsweredIndex = examInfo.questions.findIndex(q => 
            !answersMap[q._id]
          );
          if (lastAnsweredIndex > 0) {
            setCurrentQuestionIndex(lastAnsweredIndex);
          }
        }
      }

      // Start the exam session - pass exam data directly instead of relying on state
      console.log('TakeExam - Starting exam session...'); // Debug log
      await startExamSession(examInfo.exam);
      
    } catch (error) {
      console.error('TakeExam - Initialization error:', error); // Debug log
      const message = error.response?.data?.message || 'Failed to initialize exam';
      toast.error(message);
      navigate('/student/join-exam');
    } finally {
      setLoading(false);
    }
  };

  const startExamSession = async (examDataParam = examData) => {
    try {
      // Use the passed exam data or fall back to state
      const actualExamId = examDataParam._id;
      console.log('TakeExam - Starting session for exam ID:', actualExamId); // Debug log
      
      const response = await axios.post(`/api/student/exams/${actualExamId}/start`);
      
      if (response.data.success) {
        const { remainingTime, answers: existingAnswers } = response.data.data;
        
        console.log('TakeExam - Session started successfully, remaining time:', remainingTime); // Debug log
        
        setTimeRemaining(remainingTime);
        setExamStarted(true);
        
        // Load existing answers if any
        if (existingAnswers && existingAnswers.length > 0) {
          const answersMap = {};
          existingAnswers.forEach(answer => {
            answersMap[answer.questionId] = answer.answer;
          });
          setAnswers(prev => ({ ...prev, ...answersMap }));
        }

        // Start timers
        startExamTimer();
        startAutoSave();
        
        // Join exam room for real-time updates
        joinExamRoom(actualExamId);
        
        // Prevent navigation
        setupNavigationPrevention();
        
        toast.success('Exam session started!');
      }
    } catch (error) {
      console.error('TakeExam - Start session error:', error); // Debug log
      throw error;
    }
  };

  const startExamTimer = () => {
    examTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startAutoSave = () => {
    autoSaveTimerRef.current = setInterval(() => {
      autoSaveAnswer();
    }, 10000); // Auto-save every 10 seconds
  };

  const setupNavigationPrevention = () => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Your exam is in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    const handlePopState = (e) => {
      e.preventDefault();
      const confirmLeave = window.confirm('Are you sure you want to leave the exam? Your progress will be auto-saved and submitted.');
      if (confirmLeave) {
        handleSubmit(true); // Force submit
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  };

  const autoSaveAnswer = useCallback(async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || answers[currentQuestion._id] === undefined || answers[currentQuestion._id] === null || autoSaveStatus === 'saving' || !examData) {
      return;
    }

    setAutoSaveStatus('saving');
    try {
      await axios.post(`/api/student/exams/${examData._id}/answer`, {
        questionId: currentQuestion._id,
        answer: answers[currentQuestion._id],
        timeSpent: 30 // Approximate time spent on question
      });
      
      setAutoSaveStatus('saved');
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  }, [answers, currentQuestionIndex, questions, examData, autoSaveStatus]);

  const saveAnswerImmediate = async (questionId, answer) => {
    if (!examData) return;
    
    setAutoSaveStatus('saving');
    try {
      await axios.post(`/api/student/exams/${examData._id}/answer`, {
        questionId: questionId,
        answer: answer,
        timeSpent: 30
      });
      
      setAutoSaveStatus('saved');
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Save answer failed:', error);
    }
  };

  const handleAnswerChange = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion._id]: answer
    }));
    setAutoSaveStatus('modified');
    
    // For objective questions, save immediately. For theory questions, use debounced saving
    if (currentQuestion.questionType === 'Objective') {
      setTimeout(() => saveAnswerImmediate(currentQuestion._id, answer), 100);
    } else {
      // For theory questions, clear existing timeout and set a new one (debounced)
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => saveAnswerImmediate(currentQuestion._id, answer), 1000);
    }
  };

  const goToQuestion = (index, section = null) => {
    const targetSection = section || currentSection;
    const targetQuestions = sectionQuestions[targetSection];
    
    if (index >= 0 && index < targetQuestions.length) {
      // Find the global index of this question
      const globalIndex = questions.findIndex(q => q._id === targetQuestions[index]._id);
      setCurrentQuestionIndex(globalIndex);
      setShowQuestionPanel(false);
    }
  };

  const goToNextQuestion = () => {
    const currentSectionQuestions = sectionQuestions[currentSection];
    const currentQuestionInSection = currentSectionQuestions.findIndex(
      q => q._id === questions[currentQuestionIndex]._id
    );
    
    if (currentQuestionInSection < currentSectionQuestions.length - 1) {
      goToQuestion(currentQuestionInSection + 1);
    } else if (examData.examType === 'Mixed') {
      // Auto-switch to next section if available
      if (currentSection === 'objective' && sectionQuestions.theory.length > 0) {
        setCurrentSection('theory');
        goToQuestion(0, 'theory');
      }
    }
  };

  const goToPreviousQuestion = () => {
    const currentSectionQuestions = sectionQuestions[currentSection];
    const currentQuestionInSection = currentSectionQuestions.findIndex(
      q => q._id === questions[currentQuestionIndex]._id
    );
    
    if (currentQuestionInSection > 0) {
      goToQuestion(currentQuestionInSection - 1);
    } else if (examData.examType === 'Mixed') {
      // Auto-switch to previous section if available
      if (currentSection === 'theory' && sectionQuestions.objective.length > 0) {
        setCurrentSection('objective');
        goToQuestion(sectionQuestions.objective.length - 1, 'objective');
      }
    }
  };

  const switchSection = (section) => {
    if (sectionQuestions[section].length > 0) {
      setCurrentSection(section);
      goToQuestion(0, section);
    }
  };

  const getCurrentSectionQuestions = () => {
    return sectionQuestions[currentSection];
  };

  const getCurrentQuestionInSection = () => {
    const currentSectionQuestions = getCurrentSectionQuestions();
    return currentSectionQuestions.findIndex(q => q._id === questions[currentQuestionIndex]._id);
  };

  const toggleFlag = () => {
    const currentQuestion = questions[currentQuestionIndex];
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion._id)) {
        newSet.delete(currentQuestion._id);
      } else {
        newSet.add(currentQuestion._id);
      }
      return newSet;
    });
  };

  const handleTimeExpiry = () => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    
    toast.error('Time is up! Your exam will be auto-submitted.');
    handleSubmit(true); // Force submit
  };

  const handleSubmit = async (forced = false) => {
    if (!forced) {
      setShowSubmitModal(true);
      return;
    }

    if (!examData) {
      toast.error('Exam data not available. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      // Save current answer before submitting
      await autoSaveAnswer();
      
      const response = await axios.post(`/api/student/exams/${examData._id}/submit`);
      
      if (response.data.success) {
        // Clear timers
        if (examTimerRef.current) clearInterval(examTimerRef.current);
        if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
        
        // Leave exam room
        leaveExamRoom(examData._id);
        
        const { data } = response.data;
        
        toast.success('Exam submitted successfully!');
        
        // Navigate to results if available, otherwise to dashboard
        if (examData.settings.showResults && data.score !== undefined) {
          navigate(`/student/results/${examData._id}`, {
            state: { examResult: data }
          });
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit exam';
      toast.error(message);
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 300) return 'text-red-600'; // Last 5 minutes
    if (timeRemaining <= 900) return 'text-yellow-600'; // Last 15 minutes
    return 'text-green-600';
  };

  const getQuestionStatus = (index) => {
    const question = questions[index];
    if (!question) return 'unanswered';
    
    if (answers[question._id]) {
      return flaggedQuestions.has(question._id) ? 'answered-flagged' : 'answered';
    }
    return flaggedQuestions.has(question._id) ? 'flagged' : 'unanswered';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered': return 'bg-green-500 text-white';
      case 'answered-flagged': return 'bg-yellow-500 text-white';
      case 'flagged': return 'bg-yellow-300 text-gray-800';
      case 'current': return 'bg-blue-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!examStarted || !examData || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Unable to start exam. Please try again.</p>
          <button
            onClick={() => navigate('/student/join-exam')}
            className="mt-4 btn-primary"
          >
            Back to Join Exam
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const currentSectionQuestions = getCurrentSectionQuestions();
  const currentQuestionInSection = getCurrentQuestionInSection();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">{examData.title}</h1>
              {examData.examType === 'Mixed' ? (
                <span className="text-sm text-gray-500">
                  {currentSection === 'objective' ? 'Objective' : currentSection === 'theory' ? 'Theory' : 'All'} Section - 
                  Question {currentQuestionInSection + 1} of {currentSectionQuestions.length}
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Auto-save status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  autoSaveStatus === 'saved' ? 'bg-green-500' :
                  autoSaveStatus === 'saving' ? 'bg-yellow-500' :
                  autoSaveStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {autoSaveStatus === 'saved' ? 'Saved' :
                   autoSaveStatus === 'saving' ? 'Saving...' :
                   autoSaveStatus === 'error' ? 'Error saving' : 'Modified'}
                </span>
              </div>
              
              {/* Timer */}
              <div className={`flex items-center space-x-2 ${getTimerColor()}`}>
                <ClockIcon className="h-5 w-5" />
                <span className="font-mono text-lg font-medium">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              {/* Progress */}
              <div className="text-sm text-gray-600">
                {answeredCount}/{questions.length} answered
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Section Tabs for Mixed Exams */}
          {examData.examType === 'Mixed' && (
            <div className="flex space-x-1 mt-3">
              {sectionQuestions.objective.length > 0 && (
                <button
                  onClick={() => switchSection('objective')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentSection === 'objective'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">📝</span>
                  Objective Questions ({sectionQuestions.objective.length})
                </button>
              )}
              {sectionQuestions.theory.length > 0 && (
                <button
                  onClick={() => switchSection('theory')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentSection === 'theory'
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">📄</span>
                  Theory Questions ({sectionQuestions.theory.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel (Mobile: Collapsible, Desktop: Fixed) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  {examData.examType === 'Mixed' ? 
                    `${currentSection === 'objective' ? 'Objective' : currentSection === 'theory' ? 'Theory' : 'All'} Questions` : 
                    'Questions'
                  }
                </h3>
                <button
                  onClick={() => setShowQuestionPanel(!showQuestionPanel)}
                  className="lg:hidden text-gray-500"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className={`grid grid-cols-5 lg:grid-cols-4 gap-2 ${showQuestionPanel ? 'block' : 'hidden lg:block'}`}>
                {currentSectionQuestions.map((question, index) => {
                  const globalIndex = questions.findIndex(q => q._id === question._id);
                  const status = globalIndex === currentQuestionIndex ? 'current' : getQuestionStatus(globalIndex);
                  
                  return (
                    <button
                      key={question._id}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${getStatusColor(status)}`}
                      title={`Question ${index + 1} - ${status}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Flagged</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Section Summary for Mixed Exams */}
              {examData.examType === 'Mixed' && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Section Progress</h4>
                  <div className="space-y-2 text-xs">
                    {sectionQuestions.objective.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-600">Objective:</span>
                        <span>{sectionQuestions.objective.filter(q => answers[q._id]).length}/{sectionQuestions.objective.length}</span>
                      </div>
                    )}
                    {sectionQuestions.theory.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">Theory:</span>
                        <span>{sectionQuestions.theory.filter(q => answers[q._id]).length}/{sectionQuestions.theory.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {examData.examType === 'Mixed' ? 
                        `${currentSection === 'objective' ? 'Obj' : currentSection === 'theory' ? 'Theory' : 'Q'} ${currentQuestionInSection + 1}` :
                        `Question ${currentQuestionIndex + 1}`
                      }
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentQuestion.questionType === 'Objective' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {currentQuestion.questionType}
                    </span>
                    <span className="text-sm text-gray-600">
                      {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <h2 className="text-lg text-gray-900 leading-relaxed">
                    {currentQuestion.questionText}
                  </h2>
                  
                  {currentQuestion.additionalInfo && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Additional Info:</strong> {currentQuestion.additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={toggleFlag}
                  className={`ml-4 p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(currentQuestion._id)
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                  }`}
                  title="Flag for review"
                >
                  <FlagIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Answer Input */}
              <div className="mb-8">
                {currentQuestion.questionType === 'Objective' ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                          answers[currentQuestion._id] === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion._id}`}
                          value={index}
                          checked={answers[currentQuestion._id] === index}
                          onChange={() => handleAnswerChange(index)}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-900">
                          <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={answers[currentQuestion._id] || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Enter your answer here..."
                      className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      This is a theory question. Your answer will be manually graded by your teacher.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionInSection === 0 && (currentSection === 'objective' || examData.examType !== 'Mixed')}
                  className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5 mr-2" />
                  Previous
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Submit Exam
                  </button>
                  
                  {(currentQuestionInSection < currentSectionQuestions.length - 1 || 
                    (examData.examType === 'Mixed' && currentSection === 'objective' && sectionQuestions.theory.length > 0)) && (
                    <button
                      onClick={goToNextQuestion}
                      className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Next
                      <ChevronRightIcon className="h-5 w-5 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Exam Submission
            </h3>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
              </p>
              
              {examData.examType === 'Mixed' && (
                <div className="text-sm bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700 mb-1">Section Breakdown:</div>
                  {sectionQuestions.objective.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Objective:</span>
                      <span>{sectionQuestions.objective.filter(q => answers[q._id]).length}/{sectionQuestions.objective.length}</span>
                    </div>
                  )}
                  {sectionQuestions.theory.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-purple-600">Theory:</span>
                      <span>{sectionQuestions.theory.filter(q => answers[q._id]).length}/{sectionQuestions.theory.length}</span>
                    </div>
                  )}
                </div>
              )}
              
              {answeredCount < questions.length && (
                <p className="text-yellow-600">
                  <strong>Warning:</strong> You have {questions.length - answeredCount} unanswered questions.
                </p>
              )}
              
              {flaggedQuestions.size > 0 && (
                <p className="text-blue-600">
                  You have {flaggedQuestions.size} flagged question{flaggedQuestions.size !== 1 ? 's' : ''} for review.
                </p>
              )}
              
              <p className="text-gray-600">
                <strong>Time remaining:</strong> {formatTime(timeRemaining)}
              </p>
              
              <p className="text-red-600 font-medium">
                Once submitted, you cannot make any changes to your answers.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Continue Exam
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam; 