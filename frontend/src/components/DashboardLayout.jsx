import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* If the current app already has a Header, we can render it here or assume App handles it. We'll render a layout topbar as a fallback. */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
