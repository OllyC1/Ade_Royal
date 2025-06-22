import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  KeyIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const ManageExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    subject: '',
    search: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, [filters]);

  const fetchExams = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/api/teacher/exams?${params}`);
      setExams(response.data.data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
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

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/teacher/exams/${examId}`);
        toast.success('Exam deleted successfully');
        fetchExams();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete exam');
      }
    }
  };

  const handleViewDetails = (exam) => {
    setSelectedExam(exam);
    setShowDetailsModal(true);
  };

  const handlePreviewExam = (exam) => {
    setSelectedExam(exam);
    setShowPreviewModal(true);
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) {
      return { status: 'upcoming', color: 'yellow', text: 'Upcoming' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'active', color: 'green', text: 'Active' };
    } else {
      return { status: 'ended', color: 'gray', text: 'Ended' };
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const copyExamCode = (examCode) => {
    navigator.clipboard.writeText(examCode);
    toast.success('Exam code copied to clipboard!');
  };

  if (loading) {
    return <LoadingSpinner text="Loading exams..." />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Manage Exams
              </h1>
              <p className="text-gray-600">
                View and manage your created exams
              </p>
            </div>
            <Link
              to="/teacher/create-exam"
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Exam
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Search</label>
              <input
                type="text"
                placeholder="Search exams..."
                className="form-input"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
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
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', subject: '', search: '' })}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Exams List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Exams ({exams.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {exams.length > 0 ? (
              exams.map((exam) => {
                const status = getExamStatus(exam);
                
                return (
                  <div key={exam._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {exam.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                            {status.text}
                          </span>
                          <button
                            onClick={() => copyExamCode(exam.examCode)}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            title="Click to copy exam code"
                          >
                            <KeyIcon className="h-3 w-3 mr-1" />
                            {exam.examCode}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                            {exam.subject?.name} - {exam.class?.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {exam.duration} minutes
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            {exam.attempts?.length || 0} attempts
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <ChartBarIcon className="h-4 w-4 mr-2" />
                            {exam.totalMarks} marks ({exam.questionCount || exam.embeddedQuestions?.length || 0} questions)
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Start:</span> {new Date(exam.startTime).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">End:</span> {new Date(exam.endTime).toLocaleString()}
                          </div>
                        </div>

                        {exam.description && (
                          <p className="mt-2 text-sm text-gray-600">
                            {exam.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Link
                          to={`/teacher/exams/${exam._id}/results`}
                          className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                          title="View Results"
                        >
                          <ChartBarIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handlePreviewExam(exam)}
                          className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                          title="Preview Exam"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(exam)}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="View Details"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </button>
                        <Link
                          to={`/teacher/exams/${exam._id}/edit`}
                          className="p-2 text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md"
                          title="Edit Exam"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteExam(exam._id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete Exam"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No exams found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first exam.
                </p>
                <div className="mt-6">
                  <Link
                    to="/teacher/create-exam"
                    className="btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Exam
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exam Details Modal */}
        {showDetailsModal && selectedExam && (
          <div className="modal-overlay">
            <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Exam Details: {selectedExam.title}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Exam Code</dt>
                          <dd className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {selectedExam.examCode}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Subject</dt>
                          <dd className="text-sm text-gray-900">{selectedExam.subject?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Class</dt>
                          <dd className="text-sm text-gray-900">{selectedExam.class?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Type</dt>
                          <dd className="text-sm text-gray-900">{selectedExam.examType}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Duration</dt>
                          <dd className="text-sm text-gray-900">{selectedExam.duration} minutes</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Scoring</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Total Marks</dt>
                          <dd className="text-sm text-gray-900">{selectedExam.totalMarks}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Passing Marks</dt>
                          <dd className="text-sm text-gray-900">{selectedExam.passingMarks}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Total Questions</dt>
                          <dd className="text-sm text-gray-900">
                            {selectedExam.questionCount || selectedExam.embeddedQuestions?.length || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Objective Questions</dt>
                          <dd className="text-sm text-gray-900">
                            {selectedExam.questionTypes?.objective?.count || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Theory Questions</dt>
                          <dd className="text-sm text-gray-900">
                            {selectedExam.questionTypes?.theory?.count || 0}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Start Time</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedExam.startTime).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">End Time</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedExam.endTime).toLocaleString()}
                        </dd>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {selectedExam.instructions && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Instructions</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedExam.instructions}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Questions Preview */}
                  {selectedExam.embeddedQuestions && selectedExam.embeddedQuestions.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Questions Preview</h4>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {selectedExam.embeddedQuestions.slice(0, 5).map((question, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-medium text-gray-900">Q{question.questionNumber}</span>
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
                            </div>
                            <p className="text-sm text-gray-900">
                              {question.questionText.substring(0, 100)}
                              {question.questionText.length > 100 && '...'}
                            </p>
                          </div>
                        ))}
                        {selectedExam.embeddedQuestions.length > 5 && (
                          <p className="text-sm text-gray-500 text-center">
                            And {selectedExam.embeddedQuestions.length - 5} more questions...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 flex justify-end space-x-3 pt-4 mt-6">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <Link
                    to={`/teacher/exams/${selectedExam._id}/results`}
                    className="btn-primary"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    View Results
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exam Preview Modal */}
        {showPreviewModal && selectedExam && (
          <div className="modal-overlay">
            <div className="modal-content max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Preview: {selectedExam.title}
                  </h3>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                {/* Exam Header */}
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedExam.title}</h1>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Subject:</span> {selectedExam.subject?.name}
                      </div>
                      <div>
                        <span className="font-medium">Class:</span> {selectedExam.class?.name}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {selectedExam.duration} minutes
                      </div>
                      <div>
                        <span className="font-medium">Total Marks:</span> {selectedExam.totalMarks}
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      <span className="font-medium">Exam Code:</span> 
                      <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">
                        {selectedExam.examCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {selectedExam.instructions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Instructions:</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedExam.instructions}
                    </div>
                  </div>
                )}

                {/* Questions */}
                {selectedExam.embeddedQuestions && selectedExam.embeddedQuestions.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Questions ({selectedExam.embeddedQuestions.length})
                    </h3>
                    
                    {selectedExam.embeddedQuestions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                              Question {question.questionNumber}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              question.questionType === 'Objective' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {question.questionType}
                            </span>
                            <span className="text-sm text-gray-600">
                              {question.marks} mark{question.marks !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-gray-900 text-base leading-relaxed">
                            {question.questionText}
                          </p>
                        </div>

                        {question.questionType === 'Objective' && question.options.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Options:</p>
                            {question.options.map((option, optIndex) => (
                              <div 
                                key={optIndex} 
                                className={`flex items-center p-3 rounded-lg border ${
                                  optIndex === question.correctAnswer 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-300 mr-3 text-sm font-medium">
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span className="text-gray-900">{option}</span>
                                {optIndex === question.correctAnswer && (
                                  <span className="ml-auto text-green-600 text-sm font-medium">✓ Correct Answer</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.additionalInfo && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Additional Info:</span> {question.additionalInfo}
                            </p>
                          </div>
                        )}

                        {question.explanation && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Explanation:</span> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No questions available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This exam doesn't have any questions yet.
                    </p>
                  </div>
                )}

                <div className="sticky bottom-0 bg-white border-t border-gray-200 flex justify-end space-x-3 pt-4 mt-6">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <Link
                    to={`/teacher/exams/${selectedExam._id}/edit`}
                    className="btn-primary"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    Edit Exam
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageExams; 