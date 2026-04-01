import React from 'react';
import { useContainers } from '../context/ContainerContext';
import { X } from 'lucide-react';

const Notifications = () => {
  const { notifications, removeNotification } = useContainers();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
      {notifications.map((note) => (
        <div 
          key={note.id} 
          className={`flex items-start justify-between p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border ${
            note.type === 'error' ? 'bg-red-900/40 border-red-500 text-red-50' :
            note.type === 'success' ? 'bg-green-900/40 border-green-500 text-green-50' :
            note.type === 'warning' ? 'bg-yellow-900/40 border-yellow-500 text-yellow-50' :
            'bg-dark-card border-primary text-gray-200'
          } backdrop-blur-md transition-all duration-300 transform translate-x-0`}
        >
          <div className="flex-1 mr-3 text-sm whitespace-pre-wrap">{note.message}</div>
          <button 
            onClick={() => removeNotification(note.id)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
