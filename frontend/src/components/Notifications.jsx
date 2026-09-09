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
          className={`flex items-start justify-between p-4 rounded-xl shadow-lg border ${
            note.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
            note.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            note.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-white border-teal-200 text-slate-800'
          } backdrop-blur-md transition-all duration-300 transform translate-x-0`}
        >
          <div className="flex-1 mr-3 text-sm font-medium whitespace-pre-wrap">{note.message}</div>
          <button 
            onClick={() => removeNotification(note.id)}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
