import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const Header = ({ onMenuClick, user }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-soft border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Logo and Brand */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="ml-4 lg:ml-0 flex items-center">
            {/* School Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src="/aderoyal-logo.png"
                  alt="Ade-Royal Group of Schools"
                  className="h-10 w-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback logo when image is not available */}
                <div className="hidden h-10 w-10 bg-royal-blue-500 rounded-xl items-center justify-center">
                  <span className="text-white font-bold text-lg">AR</span>
                </div>
              </div>
              
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-royal-blue-700">
                  Ade-Royal CBT System
                </h1>
                <p className="text-xs text-royal-wine-600 font-medium tracking-wide">
                  Group of Schools
                </p>
              </div>
              
              {/* Mobile title */}
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-royal-blue-700">
                  Ade-Royal
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 focus-ring">
            <BellIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-royal-wine-500 rounded-full border-2 border-white"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 focus-ring"
            >
              <div className="h-8 w-8 bg-royal-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 capitalize font-medium">
                  {user?.role}
                </p>
              </div>
              <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-large py-2 z-50 border border-slate-100 animate-slide-down">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {user?.role} Account
                  </p>
                </div>
                
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserCircleIcon className="h-4 w-4 mr-3 text-slate-400" />
                  Profile Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                >
                  <svg className="h-4 w-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 