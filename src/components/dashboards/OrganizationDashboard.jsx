import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { listingService } from '../../services/listingService';
import { serviceManagementService } from '../../services/serviceManagementService';
import { teamService } from '../../services/teamService';
import ListingForm from '../listings/ListingForm';
import ListingCard from '../listings/ListingCard';
import EquipmentManagement from '../equipment/EquipmentManagement';
import ServiceManagement from '../services/ServiceManagement';
import BookingManagement from '../bookings/BookingManagement';
import AnalyticsSection from './AnalyticsSection';
import LocationManagement from './LocationManagement';
import ApiKeyManagement from './ApiKeyManagement';
import EarningsSection from './EarningsSection';
import TeamInviteModal from '../team/TeamInviteModal';
import TeamInviteList from '../team/TeamInviteList';

const { 
  FiList, FiUsers, FiPackage, FiCalendar, FiBarChart3, 
  FiPlus, FiMessageSquare, FiMenu, FiX, FiLogOut, 
  FiSettings, FiGlobe, FiUser, FiCreditCard, FiMapPin, 
  FiCode, FiAlertCircle, FiZap, FiTrash2, FiTrendingUp 
} = FiIcons;

const OrganizationDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState(null);
  const { signOut, user, profile } = useAuth();
  
  const [listings, setListings] = useState([]);
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  const [invites, setInvites] = useState([]);
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isTeams = organization?.subscription_tier === 'Teams';

  const allTabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart3 },
    { id: 'services', label: 'Services', icon: FiSettings },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar },
    { id: 'messages', label: 'Messages', icon: FiMessageSquare },
    { id: 'earnings', label: 'Earnings', icon: FiTrendingUp },
    { id: 'listings', label: 'Listings', icon: FiList },
    { id: 'equipment', label: 'Equipment', icon: FiPackage },
    { id: 'team', label: 'Team', icon: FiUsers },
    { id: 'locations', label: 'Locations', icon: FiMapPin, tier: 'Teams' },
    { id: 'api', label: 'Developer API', icon: FiCode, tier: 'Teams' },
    { id: 'subscription', label: 'Plan & Billing', icon: FiCreditCard }
  ];

  const visibleTabs = allTabs.filter(tab => !tab.tier || isTeams);

  useEffect(() => {
    if (profile?.organization_id) {
      loadOrgData();
      loadListings();
      loadTeamData();
    }
  }, [profile]);

  const loadOrgData = async () => {
    const res = await serviceManagementService.getOrganizationById(profile.organization_id);
    if (res.data) setOrganization(res.data);
  };

  const loadListings = async () => {
    const { data } = await listingService.getOrganizationListings(profile.organization_id);
    if (data) setListings(data);
  };

  const loadTeamData = async () => {
    const [invitesRes, membersRes] = await Promise.all([
      teamService.getOrganizationInvitations(profile.organization_id),
      teamService.getTeamMembers(profile.organization_id)
    ]);
    setInvites(invitesRes.data || []);
    setMembers(membersRes.data || []);
  };

  const handleSaveListing = async (formData) => {
    setLoading(true);
    const { error } = editingListing 
      ? await listingService.updateListing(editingListing.id, formData)
      : await listingService.createListing(formData, profile.organization_id);
    
    if (!error) {
      loadListings();
      setShowListingForm(false);
      setEditingListing(null);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-[100] w-64 bg-white shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none border-r border-gray-100`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
          <Link to="/home" className="flex items-center space-x-2">
            <div className="bg-navy p-2 rounded-lg"><SafeIcon icon={FiGlobe} className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-black text-navy tracking-tight">FitMySeat</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-navy transition-colors"><SafeIcon icon={FiX} className="text-2xl" /></button>
        </div>
        <nav className="mt-8 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] text-left">
          {visibleTabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-navy font-medium'}`}
            >
              <SafeIcon icon={tab.icon} className="text-lg" />
              <span className="text-sm">{tab.label}</span>
              {tab.tier === 'Teams' && <span className="ml-auto text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black">TEAMS</span>}
            </button>
          ))}
          <div className="pt-6 mt-6 border-t border-gray-100">
            <button onClick={signOut} className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold">
              <SafeIcon icon={FiLogOut} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-20 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><SafeIcon icon={FiMenu} className="text-2xl" /></button>
            <h1 className="text-xl font-black text-navy uppercase tracking-widest">{visibleTabs.find(t => t.id === activeTab)?.label}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-navy leading-none">{organization?.name || 'Organization'}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{organization?.subscription_tier} Tier</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><SafeIcon icon={FiUser} className="text-xl" /></div>
          </div>
        </header>

        {/* Dashboard Main View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-navy to-blue-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 text-left">
                      <h2 className="text-4xl font-black mb-4">Good morning, {profile?.full_name?.split(' ')[0]}!</h2>
                      <p className="text-blue-200 text-lg max-w-lg">Your business overview and performance stats are ready.</p>
                    </div>
                    {/* Quick Stats Overlay */}
                    <div className="absolute right-10 bottom-10 hidden md:block">
                      <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                        <p className="text-xs font-black text-blue-300 uppercase tracking-widest mb-1">Total Balance</p>
                        <p className="text-2xl font-black text-white">${organization?.balance?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                  <AnalyticsSection stats={{}} tier={organization?.subscription_tier} />
                </div>
              )}

              {activeTab === 'earnings' && <EarningsSection organization={organization} />}

              {activeTab === 'listings' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-navy">Business Listings</h3>
                      <p className="text-sm text-gray-500">Manage your public presence and SEO</p>
                    </div>
                    <button onClick={() => { setEditingListing(null); setShowListingForm(true); }} className="bg-navy text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-lg shadow-navy/20 transition-all hover:scale-105">
                      <SafeIcon icon={FiPlus} />
                      <span>Add Listing</span>
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(listing => (
                      <ListingCard 
                        key={listing.id} 
                        listing={listing} 
                        onEdit={(l) => { setEditingListing(l); setShowListingForm(true); }}
                        onDelete={async (l) => { if(confirm('Delete listing?')) { await listingService.deleteListing(l.id); loadListings(); }}}
                        onView={() => window.open(`/#/listing/${listing.id}`, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'services' && <ServiceManagement organizationId={profile.organization_id} userRole="organization" />}
              {activeTab === 'bookings' && <BookingManagement organizationId={profile.organization_id} userId={user.id} userRole="organization" />}
              {activeTab === 'equipment' && <EquipmentManagement organizationId={profile.organization_id} userRole="organization" />}
              
              {activeTab === 'team' && (
                <div className="space-y-8 text-left">
                  <div className="flex justify-between items-center">
                    <div><h3 className="text-xl font-bold text-navy">Team Management</h3><p className="text-sm text-gray-500">Manage staff and permissions</p></div>
                    <button onClick={() => setShowInviteModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-lg shadow-blue-600/20"><SafeIcon icon={FiPlus} /><span>Invite Member</span></button>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 font-bold text-navy">Active Team Members</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {members.map(m => (
                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-navy text-sm">{m.profile?.full_name}</td>
                              <td className="px-6 py-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase">{m.role}</span></td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => teamService.removeTeamMember(m.id).then(loadTeamData)} className="text-red-400 hover:text-red-600"><SafeIcon icon={FiTrash2} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <TeamInviteList invitations={invites} onResendInvite={id => teamService.resendInvitation(id).then(loadTeamData)} onRevokeInvite={id => teamService.revokeInvitation(id).then(loadTeamData)} />
                </div>
              )}

              {activeTab === 'locations' && <LocationManagement organizationId={profile.organization_id} />}
              {activeTab === 'api' && <ApiKeyManagement organizationId={profile.organization_id} />}
              
              {activeTab === 'subscription' && (
                <div className="max-w-4xl mx-auto space-y-8 text-left">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-gray-200 shadow-xl relative overflow-hidden">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-2">Current Plan</h3>
                    <h2 className="text-5xl font-black text-navy mb-6">{organization?.subscription_tier || 'Free'}</h2>
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Withdrawal Fee</p>
                        <p className="font-bold text-navy">3% Flat</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TeamInviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} onSendInvite={teamService.sendTeamInvitation} organizationId={profile.organization_id} />
      
      <AnimatePresence>
        {showListingForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] shadow-2xl relative flex flex-col overflow-hidden">
              <div className="absolute top-4 right-4 z-[210]">
                <button onClick={() => { setShowListingForm(false); setEditingListing(null); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors shadow-sm">
                  <SafeIcon icon={FiX} className="text-xl text-gray-600" />
                </button>
              </div>
              <ListingForm listing={editingListing} onSave={handleSaveListing} onCancel={() => { setShowListingForm(false); setEditingListing(null); }} isLoading={loading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationDashboard;