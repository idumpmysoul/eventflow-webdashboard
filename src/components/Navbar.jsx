import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  MapIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const navigation = [
  { name: 'Live Map', href: '/', icon: MapIcon },
  { name: 'Participants', href: '/participants', icon: UsersIcon },
  { name: 'Heatmap', href: '/heatmap', icon: MapPinIcon },
  { name: 'Analytics', href: '/statistics', icon: ChartBarIcon },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await api.logoutUser();
    } catch (error) {
        console.error("Logout API call failed, logging out client-side.", error);
    } finally {
        logout();
        navigate('/login');
    }
  };

  // Styles matching the generated dashboard sidebar
  const linkClasses = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white";
  const activeLinkClasses = "bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300";

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20 flex-shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white">
              <img src="/logo.svg" alt="EventFlow Logo" className="h-10 w-10" /> 
              <span>EventFlow</span>
          </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Menu</div>
          <nav className="space-y-1">
              {navigation.map((item) => (
                  <NavLink
                      key={item.name}
                      to={item.href}
                      end={item.href === '/'}
                      className={({ isActive }) =>
                          `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                      }
                  >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                  </NavLink>
              ))}
          </nav>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.role || 'Organizer'}</p>
              </div>
          </div>
          <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-2 py-1"
          >
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Exit Event
          </button>
      </div>
    </aside>
  );
};

export default Navbar;
