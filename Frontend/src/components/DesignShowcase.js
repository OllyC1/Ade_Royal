import React from 'react';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const DesignShowcase = () => {
  return (
    <div className="min-h-screen bg-royal-pattern py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-royal-blue-700">
            Ade-Royal Group of Schools
          </h1>
          <p className="text-xl text-royal-wine-600 font-medium">
            Professional Computer Based Testing System
          </p>
          <p className="text-slate-600 max-w-2xl mx-auto">
            A beautifully designed, student-friendly examination system that reflects the quality and prestige of Ade-Royal Group of Schools.
          </p>
        </div>

        {/* Blue Theme Section */}
        <div className="space-y-6">
          <div className="academic-header-blue">
            <h2 className="page-title-white">Blue Theme Elements</h2>
            <p className="page-subtitle-white">Professional and trustworthy design elements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-gradient-blue hover-lift-blue">
              <div className="flex items-center space-x-4">
                <AcademicCapIcon className="h-10 w-10 text-royal-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-800">Academic Excellence</h3>
                  <p className="text-sm text-slate-600">Comprehensive examination management</p>
                </div>
              </div>
            </div>

            <div className="card-blue">
              <div className="text-center">
                <BookOpenIcon className="h-12 w-12 text-royal-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-2">Study Materials</h3>
                <p className="text-sm text-slate-600">Access to quality resources</p>
              </div>
            </div>

            <div className="card">
              <div className="text-center">
                <div className="grade-display-blue mb-2">85%</div>
                <p className="text-sm text-slate-600">Average Score</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Primary Blue Button</button>
            <button className="btn-outline-blue">Outline Blue Button</button>
            <div className="status-active-blue">Active Status</div>
          </div>
        </div>

        {/* Wine Theme Section */}
        <div className="space-y-6">
          <div className="academic-header-wine">
            <h2 className="page-title-white">Wine Theme Elements</h2>
            <p className="page-subtitle-white">Elegant and sophisticated design elements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-gradient-wine hover-lift-wine">
              <div className="flex items-center space-x-4">
                <TrophyIcon className="h-10 w-10 text-royal-wine-600" />
                <div>
                  <h3 className="font-semibold text-slate-800">Achievement Awards</h3>
                  <p className="text-sm text-slate-600">Recognition and excellence</p>
                </div>
              </div>
            </div>

            <div className="card-wine">
              <div className="text-center">
                <ClipboardDocumentListIcon className="h-12 w-12 text-royal-wine-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-2">Exam Results</h3>
                <p className="text-sm text-slate-600">Detailed performance analytics</p>
              </div>
            </div>

            <div className="card">
              <div className="text-center">
                <div className="grade-display-wine mb-2">92%</div>
                <p className="text-sm text-slate-600">Top Performance</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="btn-primary-wine">Primary Wine Button</button>
            <button className="btn-outline-wine">Outline Wine Button</button>
            <div className="status-active-wine">Active Status</div>
          </div>
        </div>

        {/* Combined Elements Section */}
        <div className="space-y-6">
          <div className="page-header">
            <h2 className="page-title">Combined Design Elements</h2>
            <p className="page-subtitle">Harmonious use of both themes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Dashboard Preview */}
            <div className="card hover-lift">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-royal-blue-700">Student Dashboard</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Available Exams</span>
                  <span className="font-semibold text-royal-blue-600">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completed</span>
                  <span className="font-semibold text-royal-wine-600">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Average Score</span>
                  <span className="font-semibold text-green-600">85.2%</span>
                </div>
              </div>
            </div>

            {/* Teacher Dashboard Preview */}
            <div className="card hover-lift">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-royal-wine-700">Teacher Dashboard</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Active Exams</span>
                  <span className="font-semibold text-royal-blue-600">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Students Enrolled</span>
                  <span className="font-semibold text-royal-wine-600">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completion Rate</span>
                  <span className="font-semibold text-green-600">94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Elements */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 text-center">Form Elements</h2>
          
          <div className="max-w-md mx-auto card">
            <div className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="student@aderoyal.edu.ng"
                />
              </div>
              
              <div>
                <label className="form-label">Class Selection</label>
                <select className="form-input">
                  <option>Select your class</option>
                  <option>JSS 1A</option>
                  <option>JSS 2B</option>
                  <option>SS 3C</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <button className="btn-primary flex-1">Save Changes</button>
                <button className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 pt-12 border-t border-slate-200">
          <div className="flex items-center justify-center space-x-3">
            <div className="h-12 w-12 bg-royal-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AR</span>
            </div>
            <div>
              <h3 className="font-bold text-royal-blue-700">Ade-Royal Group of Schools</h3>
              <p className="text-sm text-royal-wine-600">Excellence in Education</p>
            </div>
          </div>
          <p className="text-slate-600">
            Professional, student-friendly, and beautifully designed examination system
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesignShowcase; 