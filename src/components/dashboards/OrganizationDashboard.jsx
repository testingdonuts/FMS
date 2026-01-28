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
import TaskManagement from '../tasks/TaskManagement';
import ChatWindow from '../chat/ChatWindow';
import NotificationBell from '../notifications/NotificationBell';
import { supabase } from '../../lib/supabase';

const { 
  FiList, FiUsers, FiPackage, FiCalendar, FiBarChart3, 
  FiPlus, FiMessageSquare, FiMenu, FiX, FiLogOut, 
  FiSettings, FiGlobe, FiUser, FiCreditCard, FiMapPin, 
  FiCode, FiAlertCircle, FiZap, FiTrash2, FiTrendingUp,
  FiCheckSquare, FiGift, FiCheck
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
  const [selectedChat, setSelectedChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });

  const isTeams = organization?.subscription_tier === 'Teams';

  const allTabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart3 },
    { id: 'services', label: 'Services', icon: FiSettings },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar },
    { id: 'tasks', label: 'Tasks', icon: FiCheckSquare },
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
      loadConversations();
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

  const loadConversations = async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        parent:parent_id(id, full_name, email),
        last_message:chat_messages(content, created_at, sender_id)
      `)
      .eq('organization_id', profile.organization_id)
      .order('updated_at', { ascending: false });
    setConversations(data || []);
  };

  const handleStartChat = (conversation) => {
    setSelectedChat({
      otherUser: conversation.parent,
      orgId: profile.organization_id,
      bookingId: conversation.booking_id,
      contextName: conversation.context_name
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }
    
    setCouponLoading(true);
    setCouponMessage({ type: '', text: '' });
    
    const { data, error } = await serviceManagementService.applyDevCoupon(profile.organization_id, couponCode.trim());
    
    setCouponLoading(false);
    
    if (error) {
      setCouponMessage({ type: 'error', text: error });
    } else {
      setCouponMessage({ type: 'success', text: `Successfully upgraded to ${data.subscription_tier} tier!` });
      setCouponCode('');
      setOrganization(data);
    }
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
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><SafeIcon icon={FiMenu} className="text-xl sm:text-2xl" /></button>
            <h1 className="text-base sm:text-xl font-black text-navy uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">{visibleTabs.find(t => t.id === activeTab)?.label}</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NotificationBell />
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-navy leading-none">{organization?.name || 'Organization'}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{organization?.subscription_tier} Tier</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><SafeIcon icon={FiUser} className="text-lg sm:text-xl" /></div>
          </div>
        </header>

        {/* Dashboard Main View */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 bg-gray-50/50">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-8">
                  <div className="bg-gradient-to-br from-navy to-blue-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 text-left">
                      <h2 className="text-2xl sm:text-4xl font-black mb-2 sm:mb-4">Good morning, {profile?.full_name?.split(' ')[0]}!</h2>
                      <p className="text-blue-200 text-sm sm:text-lg max-w-lg">Your business overview and performance stats are ready.</p>
                    </div>
                    {/* Quick Stats Overlay */}
                    <div className="absolute right-4 sm:right-10 bottom-4 sm:bottom-10 hidden lg:block">
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-navy">Business Listings</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Manage your public presence and SEO</p>
                    </div>
                    <button onClick={() => { setEditingListing(null); setShowListingForm(true); }} className="bg-navy text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-lg shadow-navy/20 transition-all hover:scale-105 w-full sm:w-auto justify-center">
                      <SafeIcon icon={FiPlus} />
                      <span>Add Listing</span>
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              {activeTab === 'tasks' && <TaskManagement organizationId={profile.organization_id} userId={user?.id} userRole="organization" />}
              
              {activeTab === 'messages' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h3 className="text-xl font-bold text-navy">Messages</h3>
                    <p className="text-sm text-gray-500">Communicate with parents and customers</p>
                  </div>
                  <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-1 bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden max-h-[300px] lg:max-h-[500px]">
                      <div className="p-3 sm:p-4 border-b border-gray-100 font-bold text-navy text-sm sm:text-base">Conversations</div>
                      <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                        {conversations.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                            <SafeIcon icon={FiMessageSquare} className="text-4xl mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No conversations yet</p>
                          </div>
                        ) : (
                          conversations.map(conv => (
                            <button
                              key={conv.id}
                              onClick={() => handleStartChat(conv)}
                              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedChat?.bookingId === conv.booking_id ? 'bg-blue-50' : ''}`}
                            >
                              <p className="font-bold text-navy text-sm">{conv.parent?.full_name || 'Parent'}</p>
                              <p className="text-xs text-gray-400 truncate">{conv.context_name || 'General inquiry'}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 min-h-[500px]">
                      {selectedChat ? (
                        <ChatWindow 
                          currentUser={user} 
                          recipient={selectedChat.otherUser} 
                          orgId={profile.organization_id} 
                          context={{ bookingId: selectedChat.bookingId, name: selectedChat.contextName }} 
                          onClose={() => setSelectedChat(null)} 
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                          <SafeIcon icon={FiMessageSquare} className="text-5xl mb-4 opacity-20" />
                          <p className="text-center">Select a conversation or start one from a booking</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'team' && (
                <div className="space-y-6 sm:space-y-8 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div><h3 className="text-lg sm:text-xl font-bold text-navy">Team Management</h3><p className="text-xs sm:text-sm text-gray-500">Manage staff and permissions</p></div>
                    <button onClick={() => setShowInviteModal(true)} className="bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-lg shadow-blue-600/20 w-full sm:w-auto justify-center"><SafeIcon icon={FiPlus} /><span>Invite Member</span></button>
                  </div>
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-4 sm:p-6 border-b border-gray-50 font-bold text-navy">Active Team Members</div>
                    <div className="overflow-x-auto -mx-px">
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
                <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 text-left">
                  <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-gray-200 shadow-xl relative overflow-hidden">
                    <h3 className="text-xs sm:text-sm font-black text-blue-600 uppercase tracking-widest mb-2">Current Plan</h3>
                    <h2 className="text-3xl sm:text-5xl font-black text-navy mb-4 sm:mb-6">{organization?.subscription_tier || 'Free'}</h2>
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Withdrawal Fee</p>
                        <p className="font-bold text-navy">3% Flat</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Developer Coupon Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-purple-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <SafeIcon icon={FiGift} className="text-purple-600 text-sm sm:text-base" />
                      </div>
                      <div>
                        <h3 className="font-black text-navy text-sm sm:text-base">Developer Coupon</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Have a dev/staging code? Apply it here</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code (e.g., PRO_STAGE)"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono uppercase"
                        disabled={couponLoading}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {couponLoading ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <>
                            <SafeIcon icon={FiCheck} />
                            Apply
                          </>
                        )}
                      </button>
                    </div>
                    
                    {couponMessage.text && (
                      <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${
                        couponMessage.type === 'success' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {couponMessage.text}
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 bg-white/50 rounded-xl border border-purple-100">
                      <p className="text-xs text-gray-500 font-medium">
                        <span className="font-black text-purple-600">Available Dev Codes:</span>
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-500">
                        <li><code className="bg-gray-100 px-2 py-0.5 rounded font-mono">PRO_STAGE</code> → Upgrade to Professional tier</li>
                        <li><code className="bg-gray-100 px-2 py-0.5 rounded font-mono">TEAM_STAGE</code> → Upgrade to Teams tier</li>
                      </ul>
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