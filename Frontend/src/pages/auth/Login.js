import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { handleError, handleFormError, withErrorHandling } from '../../utils/errorHandler';
import { ButtonLoader } from '../../components/LoadingState';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Clear any corrupted localStorage data on component mount
  React.useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData && userData !== 'undefined') {
        JSON.parse(userData);
      } else if (userData === 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.log('Clearing corrupted localStorage data');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const result = await withErrorHandling(
        () => login(formData.email, formData.password),
        {
          loadingState: { setLoading: setIsLoading },
          context: 'user login',
          showToast: false, // We'll handle success message manually
        }
      );
      
      if (result.success) {
        const userRole = result.user?.role;
        let redirectPath = from;
        
        // If coming from root or login, redirect to role-specific dashboard
        if (from === '/' || from === '/login') {
          switch (userRole) {
            case 'admin':
              redirectPath = '/admin/dashboard';
              break;
            case 'teacher':
              redirectPath = '/teacher/dashboard';
              break;
            case 'student':
              redirectPath = '/student/dashboard';
              break;
            default:
              redirectPath = '/login';
          }
        }
        
        toast.success(`Welcome back, ${result.user?.firstName || 'User'}!`);
        navigate(redirectPath, { replace: true });
      } else {
        toast.error(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      // Handle form validation errors
      const fieldErrors = handleFormError(error, setErrors);
      
      if (Object.keys(fieldErrors).length === 0) {
        // Not a validation error, show general error
        handleError(error, {
          context: 'login',
          customMessage: 'Unable to sign in. Please check your credentials and try again.'
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-royal-pattern py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* School Logo */}
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-white shadow-soft mb-6">
            <img
              src="/aderoyal-logo.png"
              alt="Ade-Royal Group of Schools"
              className="h-12 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden h-12 w-12 bg-gradient-to-br from-royal-blue-500 to-royal-wine-500 rounded-xl items-center justify-center">
              <span className="text-white font-bold text-xl">AR</span>
            </div>
          </div>
          
                      {/* School Name & System Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-royal-blue-700">
                Ade-Royal Group of Schools
              </h1>
              <p className="text-sm text-royal-wine-600 font-medium">
                Computer Based Testing System
              </p>
            </div>
          
          <h2 className="mt-8 text-center text-3xl font-bold text-slate-800">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Sign in to access your examination portal
          </p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-soft p-8 space-y-6">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`form-input ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter your school email address"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`form-input pr-12 ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <ButtonLoader
                loading={isLoading}
                type="submit"
                className="btn-primary w-full flex justify-center py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m0 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign in to Portal
                </span>
              </ButtonLoader>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => toast.info('Please contact the school administrator to create your account.', {
                  duration: 4000,
                  icon: '📚'
                })}
                className="font-semibold text-royal-blue-600 hover:text-royal-blue-700 transition-colors cursor-pointer"
              >
                Register here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 