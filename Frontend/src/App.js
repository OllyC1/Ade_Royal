import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingState from './components/LoadingState';

// Import axios configuration
import './utils/axios';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import ExamAnalytics from './pages/admin/ExamAnalytics';
import ResultDetails from './pages/admin/ResultDetails';

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard';
import CreateExam from './pages/teacher/CreateExam';
import ExamResults from './pages/teacher/ExamResults';
import AllResults from './pages/teacher/AllResults';
import ManageExams from './pages/teacher/ManageExams';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import JoinExam from './pages/student/JoinExam';
import TakeExam from './pages/student/TakeExam';
import ExamHistory from './pages/student/ExamHistory';
import ViewResults from './pages/student/ViewResults';

// Common pages
import Profile from './pages/common/Profile';
import NotFound from './pages/common/NotFound';

// Component to handle default route redirection
const DefaultRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingState fullScreen message="Loading application..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user role
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'teacher':
      return <Navigate to="/teacher/dashboard" replace />;
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Wrapper component for pages with error boundaries
const PageWrapper = ({ children, errorMessage }) => (
  <ErrorBoundary 
    errorMessage={errorMessage}
    fallback={(error, retry) => (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {errorMessage || 'An unexpected error occurred while loading this page.'}
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={retry}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <PageWrapper errorMessage="There was an error loading the login page.">
            <Login />
            </PageWrapper>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <PageWrapper errorMessage="There was an error loading the registration page.">
            <Register />
            </PageWrapper>
          </PublicRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PageWrapper errorMessage="There was an error loading the admin dashboard.">
            <AdminDashboard />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PageWrapper errorMessage="There was an error loading user management.">
            <UserManagement />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/teachers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PageWrapper errorMessage="There was an error loading teacher management.">
            <TeacherManagement />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/classes" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PageWrapper errorMessage="There was an error loading class management.">
            <ClassManagement />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/subjects" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PageWrapper errorMessage="There was an error loading subject management.">
            <SubjectManagement />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PageWrapper errorMessage="There was an error loading exam analytics.">
            <ExamAnalytics />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/results/:examId/:studentId" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PageWrapper errorMessage="There was an error loading result details.">
              <ResultDetails />
            </PageWrapper>
          </ProtectedRoute>
        } />

        {/* Teacher routes */}
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <PageWrapper errorMessage="There was an error loading the teacher dashboard.">
            <TeacherDashboard />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/teacher/create-exam" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <PageWrapper errorMessage="There was an error loading the exam creation page.">
            <CreateExam />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/teacher/exams/:examId/edit" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <PageWrapper errorMessage="There was an error loading the exam editor.">
            <CreateExam />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/teacher/manage-exams" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <PageWrapper errorMessage="There was an error loading exam management.">
            <ManageExams />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/teacher/exams/:examId/results" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <PageWrapper errorMessage="There was an error loading exam results.">
            <ExamResults />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/teacher/results" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <PageWrapper errorMessage="There was an error loading all results.">
              <AllResults />
            </PageWrapper>
          </ProtectedRoute>
        } />

        {/* Student routes */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <PageWrapper errorMessage="There was an error loading the student dashboard.">
            <StudentDashboard />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/student/join-exam" element={
          <ProtectedRoute allowedRoles={['student']}>
            <PageWrapper errorMessage="There was an error loading the join exam page.">
            <JoinExam />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/student/exam/:examId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <PageWrapper errorMessage="There was an error loading the exam.">
            <TakeExam />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/student/history" element={
          <ProtectedRoute allowedRoles={['student']}>
            <PageWrapper errorMessage="There was an error loading exam history.">
            <ExamHistory />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/student/results/:examId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <PageWrapper errorMessage="There was an error loading exam results.">
            <ViewResults />
            </PageWrapper>
          </ProtectedRoute>
        } />

        {/* Common routes */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
            <PageWrapper errorMessage="There was an error loading your profile.">
            <Profile />
            </PageWrapper>
          </ProtectedRoute>
        } />

        {/* Default redirects */}
        <Route path="/" element={<DefaultRedirect />} />
        <Route path="*" element={
          <PageWrapper errorMessage="Page not found.">
            <NotFound />
          </PageWrapper>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary errorMessage="A critical error occurred in the application. Please refresh the page.">
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
                duration: 5000,
              },
              loading: {
                iconTheme: {
                  primary: '#3B82F6',
                  secondary: '#fff',
                },
              },
            }}
          />
      </SocketProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 