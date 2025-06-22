import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose, userRole }) => {
  const location = useLocation();

  const navigationItems = {
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon, description: 'Overview & Analytics' },
      { name: 'User Management', href: '/admin/users', icon: UsersIcon, description: 'Manage Users' },
      { name: 'Class Management', href: '/admin/classes', icon: AcademicCapIcon, description: 'Manage Classes' },
      { name: 'Subject Management', href: '/admin/subjects', icon: BookOpenIcon, description: 'Manage Subjects' },
      { name: 'Exam Analytics', href: '/admin/analytics', icon: ChartBarIcon, description: 'View Reports' },
    ],
    teacher: [
      { name: 'Dashboard', href: '/teacher/dashboard', icon: HomeIcon, description: 'Your Overview' },
      { name: 'Create Exam', href: '/teacher/create-exam', icon: PlusCircleIcon, description: 'New Examination' },
      { name: 'Manage Exams', href: '/teacher/manage-exams', icon: ClipboardDocumentListIcon, description: 'All Examinations' },
      { name: 'Exam Results', href: '/teacher/results', icon: DocumentTextIcon, description: 'View Results' },
    ],
    student: [
      { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon, description: 'Your Overview' },
      { name: 'Join Exam', href: '/student/join-exam', icon: PlusCircleIcon, description: 'Take Examination' },
      { name: 'Exam History', href: '/student/history', icon: ClockIcon, description: 'Past Examinations' },
    ],
  };

  const items = navigationItems[userRole] || [];

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-large transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-slate-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 bg-light-pattern">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="/aderoyal-logo.png"
                alt="Ade-Royal Group of Schools"
                className="h-8 w-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
                              {/* Fallback logo */}
                <div className="hidden h-8 w-8 bg-royal-blue-500 rounded-lg items-center justify-center">
                  <span className="text-white font-bold text-sm">AR</span>
                </div>
            </div>
                          <div>
                <span className="text-lg font-bold text-royal-blue-700">
                  Ade-Royal
                </span>
                <p className="text-xs text-royal-wine-600 font-medium">
                  CBT System
                </p>
              </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-royal-blue-500 text-white shadow-medium'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                                      <Icon
                      className={`mr-4 h-5 w-5 transition-colors duration-200 ${
                        active
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-royal-blue-600'
                      }`}
                  />
                  <div className="flex-1">
                    <div className={`font-semibold ${active ? 'text-white' : 'text-slate-800'}`}>
                      {item.name}
                    </div>
                    <div className={`text-xs ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User role indicator */}
        <div className="p-4 border-t border-slate-200">
          <div className="bg-light-pattern rounded-xl p-4 border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-royal-wine-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {userRole?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Logged in as
                </p>
                <p className="text-sm font-bold text-slate-800 capitalize">
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 