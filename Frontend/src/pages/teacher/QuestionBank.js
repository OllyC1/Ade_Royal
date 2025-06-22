import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    subject: '',
    class: '',
    questionType: '',
    difficulty: '',
    search: ''
  });
  const [formData, setFormData] = useState({
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
      { text: '', isCorrect: false }
    ],
    explanation: '',
    expectedAnswer: '',
    keywords: '',
    topic: '',
    tags: ''
  });
  const [questionBankLoading, setQuestionBankLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
    fetchClasses();
    fetchStatistics();
  }, [currentPage, filters]);

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      const response = await axios.get(`/api/teacher/questions?${params}`);
      setQuestions(response.data.data.questions);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/api/teacher/subjects');
      setSubjects(response.data.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/admin/classes');
      setClasses(response.data.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/teacher/questions/statistics');
      setStatistics(response.data.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const questionData = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      if (formData.questionType === 'Objective') {
        const correctOptions = formData.options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          toast.error('Please select at least one correct answer');
          return;
        }
      }

      await axios.post('/api/teacher/questions', questionData);
      toast.success('Question created successfully');
      setShowAddModal(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create question');
    }
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault();
    try {
      const questionData = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      await axios.put(`/api/teacher/questions/${selectedQuestion._id}`, questionData);
      toast.success('Question updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/teacher/questions/${questionId}`);
        toast.success('Question deleted successfully');
        fetchQuestions();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete question');
      }
    }
  };

  const resetForm = () => {
    setFormData({
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
        { text: '', isCorrect: false }
      ],
      explanation: '',
      expectedAnswer: '',
      keywords: '',
      topic: '',
      tags: ''
    });
    setSelectedQuestion(null);
  };

  const openEditModal = (question) => {
    setSelectedQuestion(question);
    setFormData({
      questionText: question.questionText,
      questionType: question.questionType,
      subject: question.subject._id,
      class: question.class._id,
      marks: question.marks,
      difficulty: question.difficulty,
      options: question.options || [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      explanation: question.explanation || '',
      expectedAnswer: question.expectedAnswer || '',
      keywords: question.keywords?.join(', ') || '',
      topic: question.topic || '',
      tags: question.tags?.join(', ') || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (question) => {
    setSelectedQuestion(question);
    setShowViewModal(true);
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: '', isCorrect: false }]
    });
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setCurrentPage(1);
  };

  if (loading) {
    return <LoadingSpinner text="Loading questions..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Question Bank
              </h1>
              <p className="text-gray-600">
                Create and manage your exam questions
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Question
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Bank Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.total.count}
                </div>
                <div className="text-sm text-blue-600">Total Questions</div>
                <div className="text-xs text-blue-500 mt-1">
                  {statistics.total.totalMarks} total marks
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.objective.count}
                </div>
                <div className="text-sm text-green-600">Objective Questions</div>
                <div className="text-xs text-green-500 mt-1">
                  {statistics.objective.totalMarks} marks | Auto-graded
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics.theory.count}
                </div>
                <div className="text-sm text-purple-600">Theory Questions</div>
                <div className="text-xs text-purple-500 mt-1">
                  {statistics.theory.totalMarks} marks | Manual grading
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.keys(statistics.bySubject).length}
                </div>
                <div className="text-sm text-yellow-600">Subjects</div>
                <div className="text-xs text-yellow-500 mt-1">
                  Across {Object.keys(statistics.byClass).length} classes
                </div>
              </div>
            </div>
            
            {/* Difficulty Distribution */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Difficulty Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-blue-600 mb-2">Objective Questions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Easy</span>
                      <span className="font-medium">{statistics.objective.byDifficulty.Easy || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medium</span>
                      <span className="font-medium">{statistics.objective.byDifficulty.Medium || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hard</span>
                      <span className="font-medium">{statistics.objective.byDifficulty.Hard || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">Theory Questions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Easy</span>
                      <span className="font-medium">{statistics.theory.byDifficulty.Easy || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medium</span>
                      <span className="font-medium">{statistics.theory.byDifficulty.Medium || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hard</span>
                      <span className="font-medium">{statistics.theory.byDifficulty.Hard || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="form-input pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="form-label">Subject</label>
              <select
                className="form-input"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
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
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={filters.questionType}
                onChange={(e) => handleFilterChange('questionType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Objective">Objective</option>
                <option value="Theory">Theory</option>
              </select>
            </div>

            <div>
              <label className="form-label">Difficulty</label>
              <select
                className="form-input"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    subject: '',
                    class: '',
                    questionType: '',
                    difficulty: '',
                    search: ''
                  });
                  setCurrentPage(1);
                }}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Questions ({questions.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {questions.length > 0 ? (
              questions.map((question) => (
                <div key={question._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          question.questionType === 'Objective' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {question.questionType}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span className="text-sm text-gray-600">
                          {question.marks} mark{question.marks !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {question.questionText.substring(0, 100)}
                        {question.questionText.length > 100 && '...'}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{question.subject?.name}</span>
                        <span>•</span>
                        <span>{question.class?.name}</span>
                        {question.topic && (
                          <>
                            <span>•</span>
                            <span>{question.topic}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => openViewModal(question)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(question)}
                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question._id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first question.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Question Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-4xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Question</h3>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Question Type</label>
                    <select
                      className="form-input"
                      value={formData.questionType}
                      onChange={(e) => setFormData({...formData, questionType: e.target.value})}
                      required
                    >
                      <option value="Objective">Objective</option>
                      <option value="Theory">Theory</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Difficulty</label>
                    <select
                      className="form-input"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      required
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Subject</label>
                    <select
                      className="form-input"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Class</label>
                    <select
                      className="form-input"
                      value={formData.class}
                      onChange={(e) => setFormData({...formData, class: e.target.value})}
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Marks</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.marks}
                      onChange={(e) => setFormData({...formData, marks: parseFloat(e.target.value)})}
                      min="0.5"
                      max="20"
                      step="0.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Topic (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                      placeholder="e.g., Algebra, Grammar"
                    />
                  </div>
                  <div>
                    <label className="form-label">Tags (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="Comma separated"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Question Text</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    value={formData.questionText}
                    onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                    placeholder="Enter your question here..."
                    required
                  />
                </div>

                {formData.questionType === 'Objective' ? (
                  <div>
                    <label className="form-label">Answer Options</label>
                    <div className="space-y-3">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            className="form-input flex-1"
                            value={option.text}
                            onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                          {formData.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {formData.options.length < 6 && (
                        <button
                          type="button"
                          onClick={addOption}
                          className="btn-secondary text-sm"
                        >
                          Add Option
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Expected Answer (Optional)</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={formData.expectedAnswer}
                        onChange={(e) => setFormData({...formData, expectedAnswer: e.target.value})}
                        placeholder="Provide a sample answer or key points..."
                      />
                    </div>
                    <div>
                      <label className="form-label">Keywords for Grading (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.keywords}
                        onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                        placeholder="Comma separated keywords"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Explanation (Optional)</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.explanation}
                    onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                    placeholder="Explain the correct answer..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-4xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Question</h3>
              <form onSubmit={handleEditQuestion} className="space-y-4">
                {/* Same form structure as Add Modal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Difficulty</label>
                    <select
                      className="form-input"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      required
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Marks</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.marks}
                      onChange={(e) => setFormData({...formData, marks: parseFloat(e.target.value)})}
                      min="0.5"
                      max="20"
                      step="0.5"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Question Text</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    value={formData.questionText}
                    onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                    required
                  />
                </div>

                {formData.questionType === 'Objective' ? (
                  <div>
                    <label className="form-label">Answer Options</label>
                    <div className="space-y-3">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            className="form-input flex-1"
                            value={option.text}
                            onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Expected Answer</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={formData.expectedAnswer}
                        onChange={(e) => setFormData({...formData, expectedAnswer: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="form-label">Keywords for Grading</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.keywords}
                        onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                        placeholder="Comma separated keywords"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Question Modal */}
        {showViewModal && selectedQuestion && (
          <div className="modal-overlay">
            <div className="modal-content max-w-3xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Question Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedQuestion.questionType === 'Objective' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedQuestion.questionType}
                  </span>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    selectedQuestion.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedQuestion.difficulty}
                  </span>
                  <span className="text-sm text-gray-600">
                    {selectedQuestion.marks} mark{selectedQuestion.marks !== 1 ? 's' : ''}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Question</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedQuestion.questionText}</p>
                </div>

                {selectedQuestion.questionType === 'Objective' && selectedQuestion.options && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Options</h4>
                    <div className="space-y-2">
                      {selectedQuestion.options.map((option, index) => (
                        <div key={index} className={`flex items-center space-x-2 p-2 rounded ${
                          option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}>
                          {option.isCorrect && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                          <span className={option.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}>
                            {String.fromCharCode(65 + index)}. {option.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuestion.questionType === 'Theory' && selectedQuestion.expectedAnswer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Expected Answer</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedQuestion.expectedAnswer}</p>
                  </div>
                )}

                {selectedQuestion.explanation && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Explanation</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedQuestion.explanation}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Subject:</span>
                    <span className="ml-2 text-gray-700">{selectedQuestion.subject?.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Class:</span>
                    <span className="ml-2 text-gray-700">{selectedQuestion.class?.name}</span>
                  </div>
                  {selectedQuestion.topic && (
                    <div>
                      <span className="font-medium text-gray-900">Topic:</span>
                      <span className="ml-2 text-gray-700">{selectedQuestion.topic}</span>
                    </div>
                  )}
                  {selectedQuestion.tags?.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900">Tags:</span>
                      <span className="ml-2 text-gray-700">{selectedQuestion.tags.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedQuestion);
                  }}
                  className="btn-primary"
                >
                  Edit Question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuestionBank; 