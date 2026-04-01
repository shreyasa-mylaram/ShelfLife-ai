import React, { createContext, useState, useContext, useEffect } from 'react';

const ContainerContext = createContext();

export const useContainers = () => {
  const context = useContext(ContainerContext);
  if (!context) {
    throw new Error('useContainers must be used within ContainerProvider');
  }
  return context;
};

const initialContainers = [
  { 
    id: "DPW-1024A", 
    temp: 2.3, 
    threshold: 4.0, 
    status: "normal", 
    prediction: 3.1, 
    cargo: "Pharmaceuticals", 
    location: "Arabian Sea",
    humidity: 45,
    battery: 87,
    syncStatus: "synced"
  },
  { 
    id: "DPW-1024B", 
    temp: 3.8, 
    threshold: 4.0, 
    status: "warning", 
    prediction: 4.5, 
    cargo: "Fresh Produce", 
    location: "Indian Ocean",
    humidity: 68,
    battery: 92,
    syncStatus: "pending"
  },
  { 
    id: "DPW-1024C", 
    temp: 5.2, 
    threshold: 4.0, 
    status: "critical", 
    prediction: 6.8, 
    cargo: "Seafood", 
    location: "DPW Mumbai Terminal",
    humidity: 72,
    battery: 45,
    syncStatus: "pending"
  },
  { 
    id: "DPW-1024D", 
    temp: 1.8, 
    threshold: 4.0, 
    status: "normal", 
    prediction: 2.2, 
    cargo: "Vaccines", 
    location: "South China Sea",
    humidity: 38,
    battery: 94,
    syncStatus: "synced"
  },
  { 
    id: "DPW-1024E", 
    temp: 3.2, 
    threshold: 4.0, 
    status: "normal", 
    prediction: 3.9, 
    cargo: "Dairy", 
    location: "Offline Mode - Dead Zone",
    humidity: 55,
    battery: 76,
    syncStatus: "pending"
  }
];

const initialAuditLogs = [
  { timestamp: "2025-04-01 08:23:15", container: "DPW-1024A", temp: 2.3, status: "Normal" },
  { timestamp: "2025-04-01 07:45:22", container: "DPW-1024B", temp: 3.8, status: "Warning" },
  { timestamp: "2025-04-01 06:12:08", container: "DPW-1024C", temp: 5.2, status: "Critical" },
  { timestamp: "2025-04-01 05:30:44", container: "DPW-1024D", temp: 1.8, status: "Normal" },
  { timestamp: "2025-04-01 04:15:33", container: "DPW-1024E", temp: 3.2, status: "Normal" }
];

export const ContainerProvider = ({ children }) => {
  const [containers, setContainers] = useState(initialContainers);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [pendingSyncCount, setPendingSyncCount] = useState(3);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Simulate real-time temperature updates (Edge AI)
  useEffect(() => {
    const interval = setInterval(() => {
      setContainers(prevContainers => {
        return prevContainers.map(container => {
          const variation = (Math.random() - 0.5) * 0.6;
          let newTemp = Math.max(0.5, Math.min(8, container.temp + variation));
          let newPred = Math.min(9, newTemp + (Math.random() * 0.8));
          let newStatus = 'normal';
          if (newTemp > 4.2) newStatus = 'critical';
          else if (newTemp > 3.5) newStatus = 'warning';
          
          // Add to audit log if critical change
          if (newStatus === 'critical' && container.status !== 'critical') {
            setAuditLogs(prev => [{
              timestamp: new Date().toLocaleString(),
              container: container.id,
              temp: parseFloat(newTemp.toFixed(1)),
              status: 'Critical'
            }, ...prev]);
          }
          
          return {
            ...container,
            temp: parseFloat(newTemp.toFixed(1)),
            prediction: parseFloat(newPred.toFixed(1)),
            status: newStatus
          };
        });
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  const forceSync = () => {
    if (!isOnline) {
      addNotification("❌ Currently in connectivity dead zone. Data stored locally in SQLite. Will sync when container enters DP World port.", "error");
      return;
    }
    
    if (pendingSyncCount > 0) {
      setPendingSyncCount(0);
      setContainers(prev => prev.map(c => ({...c, syncStatus: "synced"})));
      const newSyncTime = new Date().toLocaleTimeString();
      setLastSyncTime(newSyncTime);
      addNotification(`📡 Syncing data to DP World Cloud...\n✅ Full audit trail uploaded. Certificate of Quality generated.`, "success");
      
      setAuditLogs(prev => [{
        timestamp: new Date().toLocaleString(),
        container: "SYSTEM",
        temp: "--",
        status: "Cloud Sync Complete"
      }, ...prev]);
    } else {
      addNotification("✅ All data synced. No pending offline records.", "success");
    }
  };

  const toggleConnectivity = () => {
    setIsOnline(prev => {
      const newState = !prev;
      if (newState) {
        addNotification("📶 Connectivity restored. Container entering DP World terminal. Ready to sync audit trail.", "success");
        setAuditLogs(logs => [{
          timestamp: new Date().toLocaleString(),
          container: "SYSTEM",
          temp: "--",
          status: "Network: Connection Restored"
        }, ...logs]);
        setTimeout(() => forceSync(), 2000);
      } else {
        addNotification("🌊 Entering connectivity dead zone. Edge AI Engine active. All data saved locally in SQLite.", "warning");
        setPendingSyncCount(prev => prev + containers.length);
        setContainers(prev => prev.map(c => ({...c, syncStatus: "pending"})));
        setAuditLogs(logs => [{
          timestamp: new Date().toLocaleString(),
          container: "SYSTEM",
          temp: "--",
          status: "Network: Dead Zone Entered"
        }, ...logs]);
      }
      return newState;
    });
  };

  return (
    <ContainerContext.Provider value={{
      containers,
      auditLogs,
      pendingSyncCount,
      isOnline,
      lastSyncTime,
      forceSync,
      toggleConnectivity,
      notifications,
      addNotification,
      removeNotification
    }}>
      {children}
    </ContainerContext.Provider>
  );
};