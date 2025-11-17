import React from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground shadow-lg hover:bg-muted-background dark:hover:bg-dark-muted-background transition-colors border border-border dark:border-dark-border"
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
