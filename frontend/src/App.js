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

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-dark-card rounded-lg border border-gray-700"
      >
        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Navigation */}
      <nav className={`
        fixed left-0 top-0 h-full w-64 bg-dark-card border-r border-gray-700 z-40
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-primary">Shelf Life AI</h1>
              <p className="text-xs text-gray-500">Freshness Guaranteed</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive(item.path) 
                      ? 'bg-primary/20 text-primary border border-primary/50' 
                      : 'text-gray-400 hover:bg-dark-lighter hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="active-nav"
                      className="ml-auto w-1 h-6 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark to-dark/90">
      <Navigation />
      <div className="lg:ml-64">
        <Header />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/container/:id" element={<DetailPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AnimatePresence>
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