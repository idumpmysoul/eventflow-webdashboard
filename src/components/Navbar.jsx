  import React from 'react';
  import { NavLink, useNavigate } from 'react-router-dom';
  import {
    HomeIcon,
    UsersIcon,
    MapIcon,
    ChartBarIcon,
    SunIcon,
    MoonIcon,
    FireIcon,
    ArrowRightOnRectangleIcon
  } from '@heroicons/react/24/outline';
  import { useTheme } from '../contexts/ThemeContext';
  import { useAuth } from '../contexts/AuthContext';
  import api from '../services/api';


  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Participants', href: '/participants', icon: UsersIcon },
    { name: 'Heatmap', href: '/heatmap', icon: MapIcon },
    { name: 'Statistics', href: '/statistics', icon: ChartBarIcon },
  ];

  const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
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

    const linkClasses = "flex items-center px-3 py-2 text-muted-foreground dark:text-dark-muted-foreground hover:bg-muted-background dark:hover:bg-dark-muted-background hover:text-foreground dark:hover:text-dark-foreground rounded-lg transition-colors duration-150";
    const activeLinkClasses = "bg-muted-background dark:bg-dark-muted-background text-primary dark:text-dark-primary font-semibold";

    return (
      <nav className="w-64 p-4 border-r border-border dark:border-dark-border bg-card dark:bg-dark-card flex flex-col flex-shrink-0">
        <div className="flex items-center space-x-3 mb-8 px-2">
          <img src="/logo.svg" alt="EventFlow Logo" className="h-10 w-10" />
          <span className="text-xl font-bold text-foreground dark:text-dark-foreground">
            EventFlow
          </span>
        </div>
        <div className="flex-1 flex flex-col space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `${linkClasses} ${isActive ? activeLinkClasses : ''}`
              }
            >
              <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="px-3 py-2 text-sm text-muted-foreground dark:text-dark-muted-foreground border-t border-border dark:border-dark-border mt-2 pt-4">
              <p>Welcome,</p>
              <p className="font-semibold text-foreground dark:text-dark-foreground truncate">{user?.name || user?.email}</p>
          </div>
          <button
              onClick={handleLogout}
              className="flex items-center justify-start w-full px-3 py-2 rounded-lg transition-colors duration-150 text-muted-foreground hover:bg-muted-background hover:text-foreground dark:text-dark-muted-foreground dark:hover:bg-dark-muted-background dark:hover:text-dark-foreground"
              aria-label="Logout"
          >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              <span>Logout</span>
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-start w-full px-3 py-2 rounded-lg transition-colors duration-150 text-muted-foreground hover:bg-muted-background hover:text-foreground dark:text-dark-muted-foreground dark:hover:bg-dark-muted-background dark:hover:text-dark-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5 mr-3" />
            ) : (
              <SunIcon className="h-5 w-5 mr-3" />
            )}
            <span>Switch Theme</span>
          </button>
          <div className="pt-4 mt-2 border-t border-border dark:border-dark-border text-center text-xs text-muted-foreground dark:text-dark-muted-foreground">
            <p>&copy; 2024 EventFlow Inc.</p>
            <p>v1.1.0</p>
          </div>
        </div>
      </nav>
    );
  };

  export default Navbar;
