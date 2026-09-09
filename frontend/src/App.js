import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ContainerProvider } from './context/ContainerContext';
import DashboardPage from './pages/DashboardPage';
import DetailPage from './pages/DetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import Header from './components/Header';
import './index.css';

import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Primary Left Navigation Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ease-in-out shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative bg-[#f8f9fc]">
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

      {/* Right Tactical Ops Sidebar (Hidden on smaller viewports, visible on desktop) */}
      <RightSidebar />
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
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
              fontWeight: '600',
              fontSize: '13px',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ecfdf5',
              },
            },
            error: {
              style: {
                border: '1px solid #fecdd3',
              },
              iconTheme: {
                primary: '#e11d48',
                secondary: '#fff1f2',
              },
            },
          }}
        />
      </ContainerProvider>
    </Router>
  );
}

export default App;