import React from 'react';
    import { Link, useLocation } from 'react-router-dom';
    import SafeIcon from '../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';

    const { 
      FiHome, 
      FiCalendar, 
      FiPackage, 
      FiMessageSquare, 
      FiSettings, 
      FiLogOut 
    } = FiIcons;

    const navItems = [
      { path: '/parent/dashboard', label: 'Dashboard', icon: FiHome },
      { path: '/parent/bookings', label: 'My Bookings', icon: FiCalendar },
      { path: '/parent/rentals', label: 'My Rentals', icon: FiPackage },
      { path: '/parent/messages', label: 'Messages', icon: FiMessageSquare },
      { path: '/parent/settings', label: 'Account Settings', icon: FiSettings },
    ];

    const ParentSidebar = () => {
      const location = useLocation();

      return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              FitMySeat
            </h1>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={item.icon} className="text-lg" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <SafeIcon icon={FiLogOut} className="text-lg" />
              Sign Out
            </button>
          </div>
        </aside>
      );
    };

    export default ParentSidebar;