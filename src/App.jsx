import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import EventsSelectionPage from './pages/EventsSelectionPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ParticipantsPage from './pages/ParticipantsPage.jsx';
import HeatmapPage from './pages/HeatmapPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';

function AppRoutes() {
  const { isAuthenticated, loading, selectedEventId } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-dark-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventsSelectionPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboard Routes - Require Selected Event */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {!selectedEventId ? <Navigate to="/events" /> : <Layout />}
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="participants" element={<ParticipantsPage />} />
        <Route path="heatmap" element={<HeatmapPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
      </Route>

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
}

const App = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
