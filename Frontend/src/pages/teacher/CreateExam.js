import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  AcademicCapIcon,
  BookOpenIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateExam = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Check if we're in edit mode
  const isEditMode = Boolean(params.examId);
  const [isLoadingExam, setIsLoadingExam] = useState(isEditMode);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    examType: '', // 'Objective', 'Theory', 'Mixed'
    duration: 60,
    totalMarks: 0,
    passingMarks: 0,
    startTime: '',
    endTime: '',
    instructions: 'Read all questions carefully before answering.\nAnswer all questions.\nShow your working for theory questions.',
    settings: {
      shuffleQuestions: true,
      allowReview: true,
      preventCheating: true,
      allowRetakes: false
    }
  });
  
  // UNIFIED STATE for question management
  const [examQuestionPool, setExamQuestionPool] = useState({
    objective: [], // will store full question objects
    theory: [], // will store full question objects
  });

  const [questionSelection, setQuestionSelection] = useState({
    objective: { count: 0 },
    theory: { count: 0 },
  });

  // State for question creation modal
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'Objective',
    subject: '',
    class: '',
    marks: 1,
    difficulty: 'Medium',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    explanation: '',
    expectedAnswer: '',
    keywords: '',
    topic: '',
    tags: '',
  });
  
  // State for question bank selection modal
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [questionBankFilters, setQuestionBankFilters] = useState({
    subject: '',
    class: '',
    questionType: '',
    search: '',
  });
  const [questionBankLoading, setQuestionBankLoading] = useState(false);
  const [questionBankQuestions, setQuestionBankQuestions] = useState([]);

  // State for preview
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState({ objective: [], theory: [] });

  // Helper state for the question bank modal selections
  const [selectedFromBankIds, setSelectedFromBankIds] = useState({ objective: [], theory: [] });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Validation rules based on backend requirements
  const validateField = (fieldName, value, formData) => {
    const errors = {};

    switch (fieldName) {
      case 'title':
        if (!value || value.trim().length < 5) {
          errors.title = 'Exam title must be at least 5 characters';
        }
        break;
      
      case 'subject':
        if (!value) {
          errors.subject = 'Subject is required';
        }
        break;
        
      case 'class':
        if (!value) {
          errors.class = 'Class is required';
        }
        break;
        
      case 'duration':
        const duration = parseInt(value);
        if (!duration || duration < 5 || duration > 300) {
          errors.duration = 'Duration must be between 5 and 300 minutes';
        }
        break;
        
      case 'totalMarks':
        const totalMarks = parseInt(value);
        if (!totalMarks || totalMarks < 1) {
          errors.totalMarks = 'Total marks must be at least 1';
        }
        break;
        
      case 'passingMarks':
        const passingMarks = parseInt(value);
        const total = parseInt(formData.totalMarks) || 0;
        if (passingMarks < 0) {
          errors.passingMarks = 'Passing marks cannot be negative';
        } else if (passingMarks > total) {
          errors.passingMarks = 'Passing marks cannot exceed total marks';
        }
        break;
        
      case 'startTime':
        if (!value) {
          errors.startTime = 'Start time is required';
        }
        break;
        
      case 'endTime':
        if (!value) {
          errors.endTime = 'End time is required';
        } else if (formData.startTime && new Date(value) <= new Date(formData.startTime)) {
          errors.endTime = 'End time must be after start time';
        }
        break;
        
      case 'examType':
        if (!value) {
          errors.examType = 'Exam type is required';
        }
        break;
    }

    return errors;
  };

  // Real-time validation function
  const validateForm = (data = formData) => {
    let allErrors = {};

    // Only validate specific fields that have validation rules
    const fieldsToValidate = ['title', 'subject', 'class', 'duration', 'totalMarks', 'passingMarks', 'startTime', 'endTime'];
    
    fieldsToValidate.forEach(fieldName => {
      const fieldErrors = validateField(fieldName, data[fieldName], data);
      allErrors = { ...allErrors, ...fieldErrors };
    });

    // Additional validations - but only in step 2 or later
    if (currentStep >= 2) {
      if (examQuestionPool.objective.length + examQuestionPool.theory.length === 0) {
        allErrors.questions = 'At least one question is required';
      }

      if (questionSelection.objective.count + questionSelection.theory.count === 0) {
        allErrors.questionSelection = 'Please select at least one question for students to answer';
      }
    }

    // Debug log to see what's happening
    console.log('Validation data:', data);
    console.log('Validation errors:', allErrors);

    setValidationErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  // Handle form field changes with validation
  const handleFieldChange = (fieldName, value) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    
    // Clear previous error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    // Validate this field and related fields
    const fieldErrors = validateField(fieldName, value, newFormData);
    
    // Special case: if changing total marks, also validate passing marks
    if (fieldName === 'totalMarks' && newFormData.passingMarks) {
      const passingErrors = validateField('passingMarks', newFormData.passingMarks, newFormData);
      Object.assign(fieldErrors, passingErrors);
    }
    
    // Special case: if changing start time, also validate end time
    if (fieldName === 'startTime' && newFormData.endTime) {
      const endTimeErrors = validateField('endTime', newFormData.endTime, newFormData);
      Object.assign(fieldErrors, endTimeErrors);
    }

    if (Object.keys(fieldErrors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...fieldErrors }));
    }
  };

  useEffect(() => {
    fetchTeacherAssignments();
    if (isEditMode) {
      fetchExamForEdit();
    }
  }, []);

  useEffect(() => {
    // Calculate total marks when questions change
    const totalMarks = examQuestionPool.objective.length + examQuestionPool.theory.length;
    setFormData(prev => ({
      ...prev,
      totalMarks,
      passingMarks: Math.floor(totalMarks * 0.5) // Default to 50%
    }));
  }, [examQuestionPool]);

  // Calculate estimated total marks for the exam based on the random selection counts
  useEffect(() => {
    const calculateMarks = (pool, selectionCount) => {
      if (pool.length === 0 || selectionCount === 0) return 0;
      
      // Check if all questions in the pool have the same marks
      const uniqueMarks = [...new Set(pool.map(q => q.marks))];
      
      if (uniqueMarks.length === 1) {
        // All questions have the same marks - precise calculation
        return uniqueMarks[0] * selectionCount;
      } else {
        // Different marks - use average (with warning shown in UI)
        const totalMarksInPool = pool.reduce((sum, q) => sum + q.marks, 0);
        const avgMarks = totalMarksInPool / pool.length;
        return Math.round(avgMarks * selectionCount);
      }
    };

    const objectiveTotalMarks = calculateMarks(examQuestionPool.objective, questionSelection.objective.count);
    const theoryTotalMarks = calculateMarks(examQuestionPool.theory, questionSelection.theory.count);

    const totalMarks = objectiveTotalMarks + theoryTotalMarks;

    setFormData(prev => ({
      ...prev,
      totalMarks,
      passingMarks: Math.floor(totalMarks * 0.5)
    }));
  }, [examQuestionPool, questionSelection]);

  const fetchTeacherAssignments = async () => {
    try {
      const response = await axios.get('/api/teacher/assignments');
      setTeacherAssignments(response.data.data.assignments || []);
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
      toast.error('Failed to load your assigned classes and subjects');
    }
  };

  const fetchExamForEdit = async () => {
    try {
      setIsLoadingExam(true);
      const response = await axios.get(`/api/teacher/exams/${params.examId}`);
      const exam = response.data.data.exam;
      
      // Populate form with existing exam data
      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        subject: exam.subject?._id || '',
        class: exam.class?._id || '',
        examType: exam.examType || '',
        duration: exam.duration || 60,
        totalMarks: exam.totalMarks || 0,
        passingMarks: exam.passingMarks || 0,
        startTime: exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '',
        endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
        instructions: exam.instructions || 'Read all questions carefully before answering.\nAnswer all questions.\nShow your working for theory questions.',
        settings: {
          shuffleQuestions: exam.settings?.shuffleQuestions || true,
          allowReview: exam.settings?.allowReview || true,
          preventCheating: exam.settings?.preventCheating || true,
          allowRetakes: exam.allowRetakes || false,
          ...exam.settings
        }
      });
      
      // Populate questions if they exist
      if (exam.embeddedQuestions && exam.embeddedQuestions.length > 0) {
        setExamQuestionPool({
          objective: exam.embeddedQuestions.filter(q => q.questionType === 'Objective'),
          theory: exam.embeddedQuestions.filter(q => q.questionType === 'Theory')
        });
      }
      
      // Handle question bank exams
      if (exam.useQuestionBank && exam.questionBankSelection) {
        setQuestionSelection({
          objective: {
            count: exam.questionBankSelection.objective?.count || 0
          },
          theory: {
            count: exam.questionBankSelection.theory?.count || 0
          }
        });
        setExamQuestionPool({
          objective: exam.questionBankSelection.objective?.questions || [],
          theory: exam.questionBankSelection.theory?.questions || []
        });
      }
      
    } catch (error) {
      console.error('Error fetching exam for edit:', error);
      toast.error('Failed to load exam data');
      navigate('/teacher/manage-exams');
    } finally {
      setIsLoadingExam(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();

    // Run full validation
    setIsValidating(true);
    const isValid = validateForm();
    
    if (!isValid) {
      setIsValidating(false);
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    // Additional specific validations
    const totalQuestionsInPool = examQuestionPool.objective.length + examQuestionPool.theory.length;
    if (totalQuestionsInPool === 0) {
      toast.error('Please add at least one question to the pool.');
      setIsValidating(false);
      return;
    }

    if (questionSelection.objective.count > examQuestionPool.objective.length || questionSelection.theory.count > examQuestionPool.theory.length) {
      toast.error('Selection count cannot exceed the number of questions in the pool.');
      setIsValidating(false);
      return;
    }

    const totalSelected = questionSelection.objective.count + questionSelection.theory.count;
    if (totalSelected === 0) {
      toast.error('Please select at least one question for the students to answer.');
      setIsValidating(false);
      return;
    }

    setLoading(true);
    try {
      const examData = {
        ...formData,
        useQuestionBank: true, // Always true in the new model
        questionBankSelection: {
          objective: {
            questions: examQuestionPool.objective.map(q => q._id),
            count: questionSelection.objective.count,
          },
          theory: {
            questions: examQuestionPool.theory.map(q => q._id),
            count: questionSelection.theory.count,
          },
        },
      };
      
      // The totalMarks should be recalculated on the server or passed accurately
      const getAverageMarks = (pool) => {
        if (pool.length === 0) return 0;
        const totalMarksInPool = pool.reduce((sum, q) => sum + q.marks, 0);
        return totalMarksInPool / pool.length;
      };
      const avgObjectiveMarks = getAverageMarks(examQuestionPool.objective);
      const avgTheoryMarks = getAverageMarks(examQuestionPool.theory);
      examData.totalMarks = Math.round(avgObjectiveMarks * questionSelection.objective.count) + Math.round(avgTheoryMarks * questionSelection.theory.count);

      let response;
      if (isEditMode) {
        // Update existing exam
        response = await axios.put(`/api/teacher/exams/${params.examId}`, examData);
        toast.success('Exam updated successfully!');
      } else {
        // Create new exam
        response = await axios.post('/api/teacher/exams', examData);
        const { examCode } = response.data.data;
        toast.success(
          `Exam created successfully!\n\nExam Code: ${examCode}\n\nStudents can use this code to access the exam when it becomes active.`,
          { duration: 8000 }
        );
      }
      
      navigate('/teacher/manage-exams');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} exam`);
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      questionText: '',
      questionType: formData.examType === 'Mixed' ? 'Objective' : formData.examType,
      subject: '',
      class: '',
      marks: 1,
      difficulty: 'Medium',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      explanation: '',
      expectedAnswer: '',
      keywords: '',
      topic: '',
      tags: '',
    });
    setShowCreateQuestionModal(false);
  };

  const handleAddNewQuestion = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentQuestion.questionText.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (currentQuestion.questionType === 'Objective') {
      const filledOptions = currentQuestion.options.filter(opt => opt.text.trim() !== '');
      if (filledOptions.length < 2) {
        toast.error('Objective questions need at least 2 options');
        return;
      }
      if (!currentQuestion.options.some(opt => opt.isCorrect)) {
        toast.error('Please select a correct answer');
        return;
      }
    }

    setLoading(true);
    try {
      const questionData = {
        ...currentQuestion,
        subject: formData.subject,
        class: formData.class,
        keywords: Array.isArray(currentQuestion.keywords) ? currentQuestion.keywords : currentQuestion.keywords.split(',').map(k => k.trim()).filter(k => k),
        tags: Array.isArray(currentQuestion.tags) ? currentQuestion.tags : currentQuestion.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      const response = await axios.post('/api/teacher/questions', questionData);
      const newQuestion = response.data.data.question;
      
      const type = newQuestion.questionType.toLowerCase();
      setExamQuestionPool(prev => {
        const newPool = { ...prev, [type]: [...prev[type], newQuestion] };
        setQuestionSelection({
          objective: { count: newPool.objective.length },
          theory: { count: newPool.theory.length },
        });
        return newPool;
      });

      toast.success('New question created and added to the exam pool!');
      setShowCreateQuestionModal(false);
      resetQuestionForm();

    } catch (error) {
      console.error('Question creation error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to create question';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        errorMessage = validationErrors.map(err => err.msg).join(', ');
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectFromBank = () => {
    const selectedObjectiveQuestions = questionBankQuestions.filter(q => 
      selectedFromBankIds.objective.includes(q._id)
    );
    const selectedTheoryQuestions = questionBankQuestions.filter(q => 
      selectedFromBankIds.theory.includes(q._id)
    );

    const newPool = {
      objective: [...examQuestionPool.objective],
      theory: [...examQuestionPool.theory],
    };

    selectedObjectiveQuestions.forEach(q => {
      if (!newPool.objective.some(p => p._id === q._id)) {
        newPool.objective.push(q);
      }
    });
    selectedTheoryQuestions.forEach(q => {
      if (!newPool.theory.some(p => p._id === q._id)) {
        newPool.theory.push(q);
      }
    });

    setExamQuestionPool(newPool);
    setQuestionSelection({
        objective: { count: newPool.objective.length },
        theory: { count: newPool.theory.length },
    });
    toast.success(`Added ${selectedObjectiveQuestions.length} objective and ${selectedTheoryQuestions.length} theory questions to the pool.`);
    setShowQuestionBankModal(false);
  };

  const handleDeleteQuestionFromPool = (questionId, type) => {
    setExamQuestionPool(prev => ({
      ...prev,
      [type]: prev[type].filter(q => q._id !== questionId)
    }));
    toast.success('Question removed from pool');
  };

  const handleEditQuestion = (index) => {
    const question = examQuestionPool[currentQuestion.questionType.toLowerCase()][index];
    setCurrentQuestion(question);
    setShowCreateQuestionModal(true);
  };

  const handleDeleteQuestion = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setExamQuestionPool(prev => ({
        ...prev,
        [currentQuestion.questionType.toLowerCase()]: prev[currentQuestion.questionType.toLowerCase()].filter((_, i) => i !== index)
      }));
      toast.success('Question deleted');
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate only step 1 fields
      const step1Errors = {};
      const step1Fields = ['title', 'subject', 'class', 'duration', 'startTime', 'endTime', 'examType'];
      
      step1Fields.forEach(fieldName => {
        const fieldErrors = validateField(fieldName, formData[fieldName], formData);
        Object.assign(step1Errors, fieldErrors);
      });
      
      // Debug log
      console.log('Step 1 validation - Current formData:', formData);
      console.log('Step 1 validation - Errors found:', step1Errors);
      
      if (Object.keys(step1Errors).length > 0) {
        setValidationErrors(step1Errors);
        toast.error('Please fix all validation errors before proceeding');
        return;
      }
      
      // Additional step 1 checks
      if (!formData.title || !formData.subject || !formData.class || !formData.examType) {
        toast.error('Please fill in all required fields including exam type');
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2 - questions
      const totalQuestionsInPool = examQuestionPool.objective.length + examQuestionPool.theory.length;
      if (totalQuestionsInPool === 0) {
        toast.error('Please add at least one question to the pool');
        return;
      }
      
      const totalSelected = questionSelection.objective.count + questionSelection.theory.count;
      if (totalSelected === 0) {
        toast.error('Please select at least one question for students to answer');
        return;
      }
      
      // Validate selection doesn't exceed pool size
      if (questionSelection.objective.count > examQuestionPool.objective.length) {
        toast.error('Objective question selection exceeds available questions in pool');
        return;
      }
      
      if (questionSelection.theory.count > examQuestionPool.theory.length) {
        toast.error('Theory question selection exceeds available questions in pool');
        return;
      }
      
      // Check for inconsistent marks
      const objectiveMarks = [...new Set(examQuestionPool.objective.map(q => q.marks))];
      const theoryMarks = [...new Set(examQuestionPool.theory.map(q => q.marks))];
      
      if (objectiveMarks.length > 1 || theoryMarks.length > 1) {
        toast.error('Warning: Questions have inconsistent marks. This may cause unfair scoring for different students.');
        // Don't return - allow them to continue but warn them
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const generateExamCode = () => {
    const assignment = teacherAssignments.find(a => 
      a.subject._id === formData.subject && a.class._id === formData.class
    );
    const timestamp = Date.now().toString().slice(-4);
    const code = `${assignment?.subject?.code || 'EXAM'}${timestamp}`;
    return code;
  };

  // Get unique classes and subjects from teacher assignments
  const assignedClasses = [...new Map(
    teacherAssignments.map(a => [a.class._id, a.class])
  ).values()];

  const assignedSubjects = formData.class 
    ? teacherAssignments
        .filter(a => a.class._id === formData.class)
        .map(a => a.subject)
    : [];

  // Function to fetch questions for question bank selection
  const fetchQuestionBankQuestions = async () => {
    try {
      setQuestionBankLoading(true);
      const params = new URLSearchParams({
        ...questionBankFilters,
        limit: 100 // Get more questions for selection
      });

      const response = await axios.get(`/api/teacher/questions/for-selection?${params}`);
      setQuestionBankQuestions(response.data.data.questions || []);
    } catch (error) {
      console.error('Error fetching question bank questions:', error);
      toast.error('Failed to load questions from question bank');
    } finally {
      setQuestionBankLoading(false);
    }
  };

  // Function to open question bank selection modal
  const openQuestionBankModal = () => {
    setSelectedFromBankIds({ objective: [], theory: [] });
    setQuestionBankFilters({
      subject: formData.subject,
      class: formData.class,
      questionType: '',
      search: ''
    });
    setShowQuestionBankModal(true);
    fetchQuestionBankQuestions();
  };

  // Re-fetch questions when filters change
  useEffect(() => {
    if (showQuestionBankModal) {
      fetchQuestionBankQuestions();
    }
  }, [questionBankFilters, showQuestionBankModal]);

  // Function to handle question selection in modal
  const handleBankCheckboxChange = (questionId, questionType, isSelected) => {
    setSelectedFromBankIds(prev => {
      const type = questionType.toLowerCase();
      return {
        ...prev,
        [type]: isSelected 
          ? [...prev[type], questionId]
          : prev[type].filter(id => id !== questionId)
      };
    });
  };

  // Function to fetch preview
  const fetchRandomPreview = async () => {
    if (examQuestionPool.objective.length === 0 && examQuestionPool.theory.length === 0) return;
    setPreviewLoading(true);
    try {
      const response = await axios.post('/api/teacher/preview-random-selection', {
        objective: {
          questions: examQuestionPool.objective,
          count: questionSelection.objective.count
        },
        theory: {
          questions: examQuestionPool.theory,
          count: questionSelection.theory.count
        }
      });
      setPreviewQuestions(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch random preview');
      setPreviewQuestions({ objective: [], theory: [] });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Fetch preview when pool or count changes
  useEffect(() => {
    if (examQuestionPool.objective.length > 0 || examQuestionPool.theory.length > 0) {
      fetchRandomPreview();
    } else {
      setPreviewQuestions({ objective: [], theory: [] });
    }
  }, [examQuestionPool, questionSelection]);

  // Helper component for the question pool list
  const QuestionPoolItem = ({ question, type, onDelete }) => (
    <div className="flex items-center justify-between p-2 border rounded-md">
      <div className="flex items-center">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full mr-3 ${type === 'objective' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
        <p className="text-sm text-gray-800">{question.questionText}</p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(question._id, type)}
        className="text-red-500 hover:text-red-700"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

  if (loading || isLoadingExam) {
    return <LoadingSpinner text={isEditMode ? "Loading exam..." : "Creating exam..."} />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isEditMode ? 'Edit Exam' : 'Create New Exam'}
              </h1>
              <p className="text-gray-600">
                {isEditMode 
                  ? 'Update your exam questions and settings' 
                  : 'Create questions directly and generate an exam code for students'
                }
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of 3
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Exam Setup</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Add Questions</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Review & Publish</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateExam}>
          {/* Step 1: Exam Setup */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Class and Subject Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Select Your Assigned Class & Subject</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Class *</label>
                    <select
                      className={`form-input ${validationErrors.class ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      value={formData.class}
                      onChange={(e) => {
                        handleFieldChange('class', e.target.value);
                        setFormData({...formData, class: e.target.value, subject: ''});
                        setExamQuestionPool({
                          objective: [],
                          theory: []
                        });
                      }}
                      required
                    >
                      <option value="">Select Class</option>
                      {assignedClasses.map(cls => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.class ? (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.class}</p>
                    ) : assignedClasses.length === 0 ? (
                      <p className="text-sm text-red-600 mt-1">
                        You don't have any assigned classes. Contact admin.
                      </p>
                    ) : null}
                  </div>
                  
                  <div>
                    <label className="form-label">Subject *</label>
                    <select
                      className={`form-input ${validationErrors.subject ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      value={formData.subject}
                      onChange={(e) => {
                        handleFieldChange('subject', e.target.value);
                        setFormData({...formData, subject: e.target.value});
                        setExamQuestionPool({
                          objective: [],
                          theory: []
                        });
                      }}
                      required
                      disabled={!formData.class}
                    >
                      <option value="">Select Subject</option>
                      {assignedSubjects.map(subject => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.subject ? (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.subject}</p>
                    ) : formData.class && assignedSubjects.length === 0 ? (
                      <p className="text-sm text-red-600 mt-1">
                        No subjects assigned for this class.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Exam Type Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Choose Exam Type</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.examType === 'Objective' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="examType"
                      value="Objective"
                      checked={formData.examType === 'Objective'}
                      onChange={(e) => {
                        setFormData({...formData, examType: e.target.value});
                        setExamQuestionPool({
                          objective: [],
                          theory: []
                        });
                      }}
                      className="sr-only"
                    />
                    <CheckCircleIcon className="h-12 w-12 text-blue-600 mb-2" />
                    <span className="text-lg font-medium text-gray-900">Objectives Only</span>
                    <span className="text-sm text-gray-500 text-center mt-1">
                      Multiple choice questions with auto-grading
                    </span>
                  </label>

                  <label className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.examType === 'Theory' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="examType"
                      value="Theory"
                      checked={formData.examType === 'Theory'}
                      onChange={(e) => {
                        setFormData({...formData, examType: e.target.value});
                        setExamQuestionPool({
                          objective: [],
                          theory: []
                        });
                      }}
                      className="sr-only"
                    />
                    <DocumentTextIcon className="h-12 w-12 text-green-600 mb-2" />
                    <span className="text-lg font-medium text-gray-900">Theory Only</span>
                    <span className="text-sm text-gray-500 text-center mt-1">
                      Written answers requiring manual grading
                    </span>
                  </label>

                  <label className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.examType === 'Mixed' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="examType"
                      value="Mixed"
                      checked={formData.examType === 'Mixed'}
                      onChange={(e) => {
                        setFormData({...formData, examType: e.target.value});
                        setExamQuestionPool({
                          objective: [],
                          theory: []
                        });
                      }}
                      className="sr-only"
                    />
                    <DocumentDuplicateIcon className="h-12 w-12 text-purple-600 mb-2" />
                    <span className="text-lg font-medium text-gray-900">Mixed</span>
                    <span className="text-sm text-gray-500 text-center mt-1">
                      Both objectives and theory questions
                    </span>
                  </label>
                </div>
              </div>

              {/* Basic Exam Details */}
              {formData.examType && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Exam Details</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">Exam Title *</label>
                        <input
                          type="text"
                          className={`form-input ${validationErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={formData.title}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="e.g., Mathematics Mid-Term Test"
                          required
                        />
                        {validationErrors.title && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="form-label">Duration (minutes) *</label>
                        <input
                          type="number"
                          className={`form-input ${validationErrors.duration ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={formData.duration}
                          onChange={(e) => handleFieldChange('duration', parseInt(e.target.value))}
                          min="5"
                          max="300"
                          required
                        />
                        {validationErrors.duration && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.duration}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Brief description of the exam..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">Start Date & Time *</label>
                        <input
                          type="datetime-local"
                          className={`form-input ${validationErrors.startTime ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={formData.startTime}
                          onChange={(e) => handleFieldChange('startTime', e.target.value)}
                          required
                        />
                        {validationErrors.startTime ? (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.startTime}</p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Exam code will only work after this time
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="form-label">End Date & Time *</label>
                        <input
                          type="datetime-local"
                          className={`form-input ${validationErrors.endTime ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={formData.endTime}
                          onChange={(e) => handleFieldChange('endTime', e.target.value)}
                          required
                        />
                        {validationErrors.endTime ? (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.endTime}</p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Exam code will stop working after this time
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Instructions for Students</label>
                      <textarea
                        className="form-input"
                        rows="4"
                        value={formData.instructions}
                        onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                        placeholder="Instructions for students..."
                      />
                    </div>

                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">Exam Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.settings.shuffleQuestions}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: {...formData.settings, shuffleQuestions: e.target.checked}
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Shuffle Questions</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.settings.allowReview}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: {...formData.settings, allowReview: e.target.checked}
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Allow Review Before Submit</span>
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.settings.allowRetakes}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: {...formData.settings, allowRetakes: e.target.checked}
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Allow Retakes 
                            <span className="text-xs text-gray-500 block">Students can retake after completion</span>
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.settings.preventCheating}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: {...formData.settings, preventCheating: e.target.checked}
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Enable Anti-Cheating</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Add Questions */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Step 2: Build Question Pool</h3>
              <p className="text-gray-600 mb-6">Add questions to your exam by creating new ones or selecting from your question bank. Newly created questions are automatically saved to your bank for future use.</p>
              
              <div className="flex items-center space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => setShowCreateQuestionModal(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Question
                </button>
                <button
                  type="button"
                  onClick={openQuestionBankModal}
                  className="btn-secondary"
                >
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Select from Bank
                </button>
              </div>

              {/* Question Pool List */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">
                  Exam Pool ({examQuestionPool.objective.length + examQuestionPool.theory.length} questions)
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {examQuestionPool.objective.map((q, index) => (
                    <QuestionPoolItem key={q._id || index} question={q} type="objective" onDelete={handleDeleteQuestionFromPool} />
                  ))}
                  {examQuestionPool.theory.map((q, index) => (
                    <QuestionPoolItem key={q._id || index} question={q} type="theory" onDelete={handleDeleteQuestionFromPool} />
                  ))}
                  {(examQuestionPool.objective.length + examQuestionPool.theory.length) === 0 && (
                    <p className="text-gray-500 text-center py-4">Your question pool is empty.</p>
                  )}
                </div>
              </div>
              
              {/* Marks Consistency Check */}
              {(examQuestionPool.objective.length > 0 || examQuestionPool.theory.length > 0) && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-6">
                  <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    Marks Distribution Check
                  </h4>
                  
                  {examQuestionPool.objective.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-yellow-800">Objective Questions Marks:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {[...new Set(examQuestionPool.objective.map(q => q.marks))].map(mark => (
                          <span key={mark} className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {examQuestionPool.objective.filter(q => q.marks === mark).length} questions × {mark} mark{mark !== 1 ? 's' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {examQuestionPool.theory.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-yellow-800">Theory Questions Marks:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {[...new Set(examQuestionPool.theory.map(q => q.marks))].map(mark => (
                          <span key={mark} className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {examQuestionPool.theory.filter(q => q.marks === mark).length} questions × {mark} mark{mark !== 1 ? 's' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Warning for inconsistent marks */}
                  {([...new Set(examQuestionPool.objective.map(q => q.marks))].length > 1 || 
                    [...new Set(examQuestionPool.theory.map(q => q.marks))].length > 1) && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                      <p className="text-sm text-red-800 font-medium">⚠️ Warning: Inconsistent Marks Detected</p>
                      <p className="text-xs text-red-700 mt-1">
                        For fair random selection, all questions of the same type should have the same marks. 
                        Different students will get different total marks if questions have varying marks.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Randomization Controls */}
              <div className="bg-white p-4 rounded-lg border mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Set Randomization for Students</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Objective Questions to Select</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      max={examQuestionPool.objective.length}
                      value={questionSelection.objective.count}
                      onChange={(e) => setQuestionSelection(prev => ({ ...prev, objective: { count: parseInt(e.target.value) || 0 } }))}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Students will get {questionSelection.objective.count} random questions from the pool of {examQuestionPool.objective.length}.
                      {examQuestionPool.objective.length > 0 && (
                        <div className="mt-1">
                          {[...new Set(examQuestionPool.objective.map(q => q.marks))].length === 1 ? (
                            <span className="text-green-600 font-medium">
                              = {[...new Set(examQuestionPool.objective.map(q => q.marks))][0] * questionSelection.objective.count} marks total
                            </span>
                          ) : (
                            <span className="text-orange-600 font-medium">
                              ≈ {Math.round((examQuestionPool.objective.reduce((sum, q) => sum + q.marks, 0) / examQuestionPool.objective.length) * questionSelection.objective.count)} marks (estimated)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Theory Questions to Select</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      max={examQuestionPool.theory.length}
                      value={questionSelection.theory.count}
                      onChange={(e) => setQuestionSelection(prev => ({ ...prev, theory: { count: parseInt(e.target.value) || 0 } }))}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Students will get {questionSelection.theory.count} random questions from the pool of {examQuestionPool.theory.length}.
                      {examQuestionPool.theory.length > 0 && (
                        <div className="mt-1">
                          {[...new Set(examQuestionPool.theory.map(q => q.marks))].length === 1 ? (
                            <span className="text-green-600 font-medium">
                              = {[...new Set(examQuestionPool.theory.map(q => q.marks))][0] * questionSelection.theory.count} marks total
                            </span>
                          ) : (
                            <span className="text-orange-600 font-medium">
                              ≈ {Math.round((examQuestionPool.theory.reduce((sum, q) => sum + q.marks, 0) / examQuestionPool.theory.length) * questionSelection.theory.count)} marks (estimated)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Random Preview */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-6">
                <div className="flex items-center mb-2">
                  <EyeIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-yellow-900">Random Preview ({questionSelection.objective.count + questionSelection.theory.count} questions)</span>
                  <button
                    type="button"
                    className="ml-auto btn-secondary btn-xs"
                    onClick={fetchRandomPreview}
                    disabled={previewLoading}
                  >
                    Refresh Preview
                  </button>
                </div>
                {previewLoading ? (
                  <LoadingSpinner text="Generating preview..." />
                ) : (
                  <div className="space-y-2">
                    {previewQuestions.objective.map((q, idx) => (
                      <div key={q._id} className="border rounded p-2 bg-white">
                        <span className="font-bold text-blue-700 mr-2">Obj {idx + 1}.</span>
                        <span>{q.questionText}</span>
                        <span className="ml-2 text-xs text-gray-500">({q.marks} mark{q.marks !== 1 ? 's' : ''})</span>
                      </div>
                    ))}
                    {previewQuestions.theory.map((q, idx) => (
                      <div key={q._id} className="border rounded p-2 bg-white">
                        <span className="font-bold text-green-700 mr-2">Theory {idx + 1}.</span>
                        <span>{q.questionText}</span>
                        <span className="ml-2 text-xs text-gray-500">({q.marks} mark{q.marks !== 1 ? 's' : ''})</span>
                      </div>
                    ))}
                    {(previewQuestions.objective.length === 0 && previewQuestions.theory.length === 0) && (
                      <div className="text-sm text-gray-500">No questions to preview. Adjust your selection.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Create */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Review & Create Exam</h2>
              
              <div className="space-y-6">
                {/* Exam Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Exam Details</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Title</dt>
                        <dd className="text-sm text-gray-900">{formData.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Type</dt>
                        <dd className="text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            formData.examType === 'Objective' ? 'bg-blue-100 text-blue-800' :
                            formData.examType === 'Theory' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {formData.examType}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Subject</dt>
                        <dd className="text-sm text-gray-900">
                          {assignedSubjects.find(s => s._id === formData.subject)?.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Class</dt>
                        <dd className="text-sm text-gray-900">
                          {assignedClasses.find(c => c._id === formData.class)?.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Duration</dt>
                        <dd className="text-sm text-gray-900">{formData.duration} minutes</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Exam Code</dt>
                        <dd className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                          {generateExamCode()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Scoring</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Total Marks</label>
                        <input
                          type="number"
                          className="form-input bg-gray-50"
                          value={formData.totalMarks}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="form-label">Passing Marks</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.passingMarks}
                          onChange={(e) => setFormData({...formData, passingMarks: parseInt(e.target.value)})}
                          min="0"
                          max={formData.totalMarks}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Summary */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    {examQuestionPool.objective.length > 0 || examQuestionPool.theory.length > 0 ? 'Question Bank Selection Summary' : `Question Summary (${examQuestionPool.objective.length + examQuestionPool.theory.length} questions)`}
                  </h3>
                  
                  {examQuestionPool.objective.length > 0 || examQuestionPool.theory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {questionSelection.objective.count}
                        </div>
                        <div className="text-sm text-blue-600">Objective Questions</div>
                        <div className="text-xs text-blue-500 mt-1">
                          {questionSelection.objective.count} marks | Random selection
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {questionSelection.theory.count}
                        </div>
                        <div className="text-sm text-green-600">Theory Questions</div>
                        <div className="text-xs text-green-500 mt-1">
                          {questionSelection.theory.count} marks | Random selection
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {formData.totalMarks}
                        </div>
                        <div className="text-sm text-purple-600">Total Marks</div>
                        <div className="text-xs text-purple-500 mt-1">
                          Each student gets different questions
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {examQuestionPool.objective.length}
                        </div>
                        <div className="text-sm text-blue-600">Objective Questions</div>
                        <div className="text-xs text-blue-500 mt-1">Auto-graded</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {examQuestionPool.theory.length}
                        </div>
                        <div className="text-sm text-green-600">Theory Questions</div>
                        <div className="text-xs text-green-500 mt-1">Manual grading required</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {formData.totalMarks}
                        </div>
                        <div className="text-sm text-purple-600">Total Marks</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Schedule */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Available From</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(formData.startTime).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Available Until</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(formData.endTime).toLocaleString()}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <KeyIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        After creating the exam, share the code <strong>{generateExamCode()}</strong> with your students. 
                        The exam will only be accessible during the scheduled time.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/teacher/manage-exams')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn-primary"
                    disabled={
                      (currentStep === 1 && (!formData.title || !formData.subject || !formData.class || !formData.examType)) ||
                      (currentStep === 2 && examQuestionPool.objective.length === 0 && examQuestionPool.theory.length === 0)
                    }
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || (examQuestionPool.objective.length === 0 && examQuestionPool.theory.length === 0)}
                  >
                    {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Exam' : 'Create Exam & Get Code')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Add/Edit Question Modal */}
        {showCreateQuestionModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add New Question
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-6">
                  {/* Question Type Selection for Mixed Exams */}
                  {formData.examType === 'Mixed' && (
                    <div>
                      <label className="form-label">Question Type *</label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                          currentQuestion.questionType === 'Objective' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}>
                          <input
                            type="radio"
                            value="Objective"
                            checked={currentQuestion.questionType === 'Objective'}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, questionType: e.target.value})}
                            className="sr-only"
                          />
                          <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
                          <div>
                            <span className="font-medium">Objective</span>
                            <p className="text-xs text-gray-500">Multiple choice with auto-grading</p>
                          </div>
                        </label>
                        
                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                          currentQuestion.questionType === 'Theory' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200'
                        }`}>
                          <input
                            type="radio"
                            value="Theory"
                            checked={currentQuestion.questionType === 'Theory'}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, questionType: e.target.value})}
                            className="sr-only"
                          />
                          <DocumentTextIcon className="h-6 w-6 text-green-600 mr-3" />
                          <div>
                            <span className="font-medium">Theory</span>
                            <p className="text-xs text-gray-500">Written answer requiring manual grading</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Question Text */}
                  <div>
                    <label className="form-label">Question Text *</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      value={currentQuestion.questionText}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, questionText: e.target.value})}
                      placeholder="Enter your question here..."
                      required
                    />
                  </div>

                  {/* Marks */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Options for Objective Questions */}
                  {currentQuestion.questionType === 'Objective' && (
                    <div>
                      <label className="form-label">Answer Options *</label>
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={option.isCorrect}
                              onChange={() => {
                                const newOptions = [...currentQuestion.options];
                                newOptions[index] = { ...option, isCorrect: !option.isCorrect };
                                setCurrentQuestion({...currentQuestion, options: newOptions});
                              }}
                              className="text-green-600 focus:ring-green-500"
                              disabled={!option.text.trim()}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <input
                              type="text"
                              className="form-input flex-1"
                              value={option.text}
                              onChange={(e) => {
                                const newOptions = [...currentQuestion.options];
                                newOptions[index] = { ...option, text: e.target.value };
                                setCurrentQuestion({...currentQuestion, options: newOptions});
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select the radio button next to the correct answer. At least 2 options are required.
                      </p>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div>
                    <label className="form-label">Additional Information (Optional)</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={currentQuestion.explanation}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                      placeholder="Explanation for the correct answer (will be shown to students after submission if enabled)..."
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 flex justify-end space-x-3 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateQuestionModal(false);
                      resetQuestionForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewQuestion}
                    className="btn-primary"
                  >
                    Add Question
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Bank Selection Modal */}
        {showQuestionBankModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-4xl">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Select Questions from Question Bank</h3>
                  <button
                    type="button"
                    onClick={() => setShowQuestionBankModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                {/* Filters */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center space-x-4">
                    <div className="flex-1">
                        <label className="form-label">Filter by Class</label>
                        <select
                            className="form-input"
                            value={questionBankFilters.class}
                            onChange={(e) => setQuestionBankFilters(prev => ({ ...prev, class: e.target.value }))}
                        >
                            <option value="">All My Classes</option>
                            {teacherAssignments.map(a => a.class).filter((c, i, self) => self.findIndex(s => s._id === c._id) === i).map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="form-label">Search by Keyword</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., photosynthesis, algebra"
                            value={questionBankFilters.search}
                            onChange={(e) => setQuestionBankFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="mb-4 flex items-center justify-center space-x-2">
                    {(['All', 'Objective', 'Theory']).map(type => (
                        <button
                            key={type}
                            type="button"
                            className={`px-3 py-1 text-sm font-medium rounded-full ${questionBankFilters.questionType === (type === 'All' ? '' : type) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => setQuestionBankFilters(prev => ({ ...prev, questionType: type === 'All' ? '' : type }))}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                
                {/* Questions List */}
                {questionBankLoading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner text="Loading questions..." />
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {questionBankQuestions.length > 0 ? (
                      questionBankQuestions.map((question) => (
                        <div key={question._id} className="border rounded-lg p-4">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 mt-1">
                              <input
                                type="checkbox"
                                checked={selectedFromBankIds[question.questionType.toLowerCase()].includes(question._id)}
                                onChange={(e) => handleBankCheckboxChange(
                                  question._id, 
                                  question.questionType.toLowerCase(), 
                                  e.target.checked
                                )}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  question.questionType === 'Objective' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {question.questionType}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {question.marks} mark{question.marks !== 1 ? 's' : ''}
                                </span>
                                {question.difficulty && (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                    question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {question.difficulty}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-gray-900 mb-2">{question.questionText}</p>
                              
                              {question.topic && (
                                <p className="text-sm text-gray-500">
                                  Topic: {question.topic}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Try adjusting your filters or add questions to your question bank first.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Selection Summary */}
                {questionBankQuestions.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Selection Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-blue-600">
                          Objective Questions: {questionSelection.objective.count}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-600">
                          Theory Questions: {questionSelection.theory.count}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                        onClick={() => setShowQuestionBankModal(false)}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSelectFromBank}
                        className="btn-primary"
                        disabled={selectedFromBankIds.objective.length === 0 && selectedFromBankIds.theory.length === 0}
                    >
                        Add to Pool
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateExam; 