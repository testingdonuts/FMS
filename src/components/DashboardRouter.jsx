import React from 'react';
import { useAuth } from '../hooks/useAuth';
import ParentDashboard from './dashboards/ParentDashboard';
import OrganizationDashboard from './dashboards/OrganizationDashboard';
import TeamMemberDashboard from './dashboards/TeamMemberDashboard';
import AdminDashboard from './dashboards/AdminDashboard'; // IMPORTED
import Homepage from './Homepage';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiAlertCircle } = FiIcons;

const DashboardRouter = () => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Homepage />;

  if (user && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl">
          <SafeIcon icon={FiAlertCircle} className="text-5xl text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-navy">Account Syncing...</h3>
          <p className="text-gray-500 mb-6">We are setting up your profile. Please refresh the page in a moment.</p>
          <button onClick={() => window.location.reload()} className="bg-navy text-white px-8 py-3 rounded-xl font-bold">Refresh Page</button>
        </div>
      </div>
    );
  }

  // Role-based routing
  const userRole = profile?.role;

  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'organization':
      return <OrganizationDashboard />;
    case 'team_member':
      return <TeamMemberDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h3 className="text-2xl font-black text-navy mb-4">Welcome to FitMySeat</h3>
            <p className="text-gray-500 mb-6">Your role is currently being processed. If this persists, please contact support.</p>
            <button onClick={signOut} className="text-red-500 font-bold hover:underline">Sign Out</button>
          </div>
        </div>
      );
  }
};

export default DashboardRouter;