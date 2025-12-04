import React from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="h-6 w-6" />
      ) : (
        <SunIcon className="h-6 w-6" />
      )}
    </button>
  );
};

export default ThemeToggleButton;
