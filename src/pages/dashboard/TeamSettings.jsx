import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import TeamMembers from '../../components/teams/TeamMembers';
import TeamInvites from '../../components/teams/TeamInvites';
import PlanBilling from '../../components/teams/PlanBilling';
import { useAuth } from '../../hooks/useAuth';

const { FiUsers, FiMail, FiCreditCard, FiMapPin, FiSettings } = FiIcons;

const TeamSettings = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('members');
  const { profile } = useAuth();

  // Listen for tab changes via URL if needed, or default
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const tabs = [
    { id: 'members', label: 'Team Members', icon: FiUsers },
    { id: 'invites', label: 'Invitations', icon: FiMail },
    { id: 'billing', label: 'Plan & Billing', icon: FiCreditCard },
    { id: 'locations', label: 'Locations', icon: FiMapPin },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return <TeamMembers />;
      case 'invites':
        return <TeamInvites />;
      case 'billing':
        return <PlanBilling />;
      case 'locations':
        return (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <SafeIcon icon={FiMapPin} className="text-4xl" />
            </div>
            <h3 className="text-2xl font-black text-navy mb-3 uppercase tracking-tighter">Multi-location Management</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium leading-relaxed">
              Manage multiple business branches and assign technicians to specific areas. This feature is currently in early access.
            </p>
            <button className="px-10 py-4 bg-navy text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-900 transition-all shadow-lg shadow-navy/10">
              Join Waitlist
            </button>
          </div>
        );
      default:
        return <TeamMembers />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-navy text-white rounded-xl">
            <SafeIcon icon={FiSettings} />
          </div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Team Management</h1>
        </div>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-11">
          Organization ID: <span className="text-navy">{profile?.organization_id?.split('-')[0]}...</span>
        </p>
      </div>

      {/* Tabs Navigation - Premium Style */}
      <div className="flex overflow-x-auto pb-4 mb-10 gap-2 no-scrollbar scroll-smooth">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
              activeTab === tab.id
                ? 'bg-navy border-navy text-white shadow-xl shadow-navy/20 translate-y-[-2px]'
                : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200 hover:text-navy shadow-sm'
            }`}
          >
            <SafeIcon icon={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pb-20"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TeamSettings;