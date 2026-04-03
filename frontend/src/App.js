import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, BarChart3, Package, Settings, Menu, X } from 'lucide-react';
import { ContainerProvider } from './context/ContainerContext';
import DashboardPage from './pages/DashboardPage';
import DetailPage from './pages/DetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import Header from './components/Header';
import './index.css';

import Sidebar from './components/Sidebar';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark to-dark/90 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop and Mobile */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/container/:id" element={<DetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ContainerProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e2f3a',
              color: '#e0e4e8',
              border: '1px solid #00d4aa',
            },
            success: {
              iconTheme: {
                primary: '#00d4aa',
                secondary: '#0a2b3e',
              },
            },
            error: {
              style: {
                border: '1px solid #ef4444',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0a2b3e',
              },
            },
          }}
        />
      </ContainerProvider>
    </Router>
  );
}

export default App;