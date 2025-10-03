import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainDashboard from '../components/dashboard/MainDashboard';
import HRDashboard from '../components/hr/HRDashboard';
import FinancialDashboard from '../components/financial/FinancialDashboard';
import DBSVerificationManagement from '../components/hr/DBSVerificationManagement';

const DashboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainDashboard />} />
      <Route path="/hr" element={<HRDashboard />} />
      <Route path="/finance" element={<FinancialDashboard />} />
      <Route path="/hr/dbs" element={<DBSVerificationManagement />} />
    </Routes>
  );
};

export default DashboardRoutes;