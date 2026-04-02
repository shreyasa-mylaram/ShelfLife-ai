import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Activity, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { name: 'Fleet Analytics', path: '/analytics', icon: <Activity className="w-5 h-5 mr-3" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <Package className="w-6 h-6 text-blue-500 mr-2" />
        <h1 className="text-xl font-bold">ShelfLife AI</h1>
      </div>
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="font-bold text-sm">DP</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">DP World Admin</p>
            <p className="text-xs text-gray-500">Fleet Operations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
