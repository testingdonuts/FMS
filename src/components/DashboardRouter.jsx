import React from 'react';
    import {useAuth} from '../hooks/useAuth.jsx';
    import ParentDashboard from './dashboards/ParentDashboard';
    import OrganizationDashboard from './dashboards/OrganizationDashboard';
    import TeamMemberDashboard from './dashboards/TeamMemberDashboard';
    import Homepage from './Homepage';
    import SafeIcon from '../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';

    const {FiAlertCircle}=FiIcons;

    const DashboardRouter=()=> {
    const {user,profile,loading,signOut}=useAuth();

    if (loading) {
    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p className="text-gray-600">Loading your dashboard...</p>
    <p className="text-gray-400 text-sm mt-2">This should only take a moment</p>
    </div>
    </div>
    );
    }

    // If not authenticated,show the public homepage
    if (!user) {
    return <Homepage />;
    }

    // After loading,if user exists but profile doesn't,it's a critical error state.
    // This can happen if the profile creation trigger fails after sign-up.
    if (user && !profile) {
    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
    <SafeIcon icon={FiAlertCircle} className="text-5xl text-red-500 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-red-800 mb-2">Account Initialization Error</h3>
    <p className="text-red-700 mb-6">
    We couldn't load your user profile,which is required to access the dashboard. This can happen if account setup is still in progress or if an error occurred.
    </p>
    <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
    <button
    onClick={()=> window.location.reload()}
    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
    Refresh Page
    </button>
    <button
    onClick={signOut}
    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
    >
    Sign Out
    </button>
    </div>
    </div>
    </div>
    );
    }

    // Use the profile as the single source of truth for the user's role
    const userRole=profile?.role;

    switch (userRole) {
    case 'parent':
    return <ParentDashboard />;
    case 'organization':
    return <OrganizationDashboard />;
    case 'team_member':
    return <TeamMemberDashboard />;
    default:
    // This case means a profile exists but has an invalid or missing role.
    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
    <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-4">
    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
    Account Role Not Found
    </h3>
    <p className="text-yellow-700">
    Your account doesn't have a valid role assigned. Please contact support to resolve this issue.
    </p>
    </div>
    <button
    onClick={signOut}
    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
    Sign Out
    </button>
    </div>
    </div>
    );
    }
    };

    export default DashboardRouter;