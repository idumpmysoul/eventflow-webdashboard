
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    UsersIcon,
    MapIcon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
    MapPinIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const navigation = [
    { name: 'Live Map', href: '/', icon: MapIcon },
    { name: 'Participants', href: '/participants', icon: UsersIcon },
    { name: 'Heatmap', href: '/heatmap', icon: MapPinIcon },
    { name: 'Laporan', href: '/reports', icon: ExclamationTriangleIcon },
    { name: 'Analytics', href: '/statistics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const Navbar = () => {
const { user, selectEvent } = useAuth();
const navigate = useNavigate();

const handleExitEvent = () => {
    // Clear the selected event ID in context
    selectEvent(null);
    // Redirect to the event selection page
    navigate('/events');
};

    // Styles matching the generated dashboard sidebar
    const linkClasses = [
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        "text-gray-500 dark:text-slate-400",
        "hover:bg-gray-100 dark:hover:bg-slate-800",
        "hover:text-black dark:hover:text-white",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:z-10"
    ].join(' ');
    const activeLinkClasses = [
        "bg-indigo-100 dark:bg-indigo-600/10",
        "text-indigo-600 dark:text-indigo-400",
        "hover:bg-indigo-200 dark:hover:bg-indigo-600/20",
        "hover:text-indigo-700 dark:hover:text-indigo-300",
        "focus:bg-indigo-200 dark:focus:bg-indigo-600/20"
    ].join(' ');

return (
<aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col z-20 flex-shrink-0">
    <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-black dark:text-white">
            <img src="/logo.svg" alt="EventFlow Logo" className="h-10 w-10" />
            <span>EventFlow</span>
        </div>
    </div>

    <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase mb-2">Menu</div>
        <nav className="space-y-1">
            {navigation.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive, isPending }) =>
                        [
                            linkClasses,
                            isActive ? activeLinkClasses : '',
                            isPending ? 'opacity-70' : ''
                        ].join(' ')
                    }
                    tabIndex={0}
                >
                    <item.icon className="w-5 h-5" />
                    <span className="truncate">{item.name}</span>
                </NavLink>
            ))}
        </nav>
    </div>

            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {user ? (
                        <>
                            <div className="flex items-center gap-3 mb-4 px-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-black dark:text-white truncate">{user?.name || 'User'}</p>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.role || 'Organizer'}</p>
                                    </div>
                            </div>
                            <button 
                                    onClick={handleExitEvent} 
                                    className="w-full flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors px-2 py-1"
                            >
                                    <ArrowRightOnRectangleIcon className="w-4 h-4" /> Exit Event
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-gray-500 dark:text-slate-400 text-sm">Not registered?</span>
                            <button
                                type="button"
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold underline text-sm"
                                onClick={() => navigate('/register-organizer')}
                            >
                                Register as Organizer
                            </button>
                        </div>
                    )}
            </div>
    </aside>
  );
};

export default Navbar;