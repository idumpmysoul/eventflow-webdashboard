import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ThemeToggleButton from './ThemeToggleButton.jsx';

const Layout = () => {
  return (
    <div className="flex h-screen w-screen">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ThemeToggleButton />
    </div>
  );
};

export default Layout;