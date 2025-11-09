import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ParticipantsPage from './pages/ParticipantsPage.jsx';
import HeatmapPage from './pages/HeatmapPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';

const App = () => {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="participants" element={<ParticipantsPage />} />
            <Route path="heatmap" element={<HeatmapPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;