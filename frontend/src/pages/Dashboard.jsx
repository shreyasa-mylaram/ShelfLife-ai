import React, { useState } from 'react';
import StatsCards from '../components/StatsCards';
import FleetGrid from '../components/FleetGrid';
import AuditTrail from '../components/AuditTrail';

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <>
      <StatsCards activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <FleetGrid filter={activeFilter} />
      <div className="mt-8">
        <AuditTrail dashboardFilter={activeFilter} />
      </div>
    </>
  );
};

export default Dashboard;
