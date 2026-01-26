import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { listingService } from '../../services/listingService';
import { serviceManagementService } from '../../services/serviceManagementService';
import { teamService } from '../../services/teamService';
import { chatService } from '../../services/chatService';
import ListingForm from '../listings/ListingForm';
import ListingCard from '../listings/ListingCard';
import EquipmentManagement from '../equipment/EquipmentManagement.jsx';
import ServiceManagement from '../services/ServiceManagement';
import BookingManagement from '../bookings/BookingManagement';
import AnalyticsSection from './AnalyticsSection';
import LocationManagement from './LocationManagement';
import ApiKeyManagement from './ApiKeyManagement';
import EarningsSection from './EarningsSection';
import TeamInviteModal from '../team/TeamInviteModal';
import TeamInviteList from '../team/TeamInviteList';
import TaskForm from '../tasks/TaskForm';
import { taskService } from '../../services/taskService';
import ChatWindow from '../chat/ChatWindow';
import NotificationBell from '../notifications/NotificationBell';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import OrgTasks from './OrgTasks';

const {
  FiList, FiUsers, FiPackage, FiCalendar, FiBarChart3, FiPlus, FiMessageSquare,
  FiMenu, FiX, FiLogOut, FiSettings, FiGlobe, FiUser, FiCreditCard, FiMapPin,
  FiCode, FiAlertCircle, FiZap, FiTrash2, FiTrendingUp, FiKey, FiCheckCircle, FiCheckSquare
} = FiIcons;

const OrganizationDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState(null);
  const { signOut, user, profile } = useAuth();
  const perms = usePermissions();
  const [listings, setListings] = useState([]);
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [invites, setInvites] = useState([]);
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  // Developer Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });

  const isTeams = organization?.subscription_tier === 'Teams';

  const allTabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart3 },
    { id: 'services', label: 'Services', icon: FiSettings },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar },
    { id: 'messages', label: 'Messages', icon: FiMessageSquare },
    { id: 'tasks', label: 'Tasks', icon: FiCheckSquare },
    { id: 'earnings', label: 'Earnings', icon: FiTrendingUp },
    { id: 'listings', label: 'Listings', icon: FiList },
    { id: 'equipment', label: 'Equipment', icon: FiPackage },
    { id: 'team', label: 'Team', icon: FiUsers },
    { id: 'locations', label: 'Locations', icon: FiMapPin, tier: 'Teams' },
    { id: 'api', label: 'Developer API', icon: FiCode, tier: 'Teams' },
    { id: 'subscription', label: 'Plan & Billing', icon: FiCreditCard }
  ];

  const visibleTabs = allTabs
    .filter(tab => !tab.tier || isTeams)
    .filter(tab => (tab.id === 'tasks' ? perms.canManageTeam : true));

  // Use organization.id as fallback if profile.organization_id is null (for org owners)
  const orgId = profile?.organization_id || organization?.id;
  
  console.log('[OrgDashboard] orgId:', orgId, 'profile.org_id:', profile?.organization_id, 'org?.id:', organization?.id);

  useEffect(() => {
    if (profile?.organization_id || profile?.role === 'organization') {
      loadOrgData();
    }
  }, [profile]);

  // Load listings and team data when we have orgId
  useEffect(() => {
    if (orgId) {
      loadListings();
      loadTeamData();
    }
  }, [orgId]);

  // On mount, sync activeTab from URL
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) {
      setActiveTab(t);
    }
  }, []); // Only on mount

  // When activeTab changes, sync to URL
  useEffect(() => {
    const current = searchParams.get('tab');
    if (current !== activeTab) {
      const sp = new URLSearchParams(searchParams);
      sp.set('tab', activeTab);
      setSearchParams(sp, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab === 'messages' && user?.id) {
      loadConversations();
    }
  }, [activeTab, user?.id]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    console.log('[OrgDashboard] Setting up realtime subscription for user:', user.id);
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        console.log('[OrgDashboard] New message received:', payload);
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadOrgData = async () => {
    console.log('[OrgDashboard] loadOrgData called, profile.organization_id:', profile?.organization_id, 'user.id:', user?.id);
    // First try by organization_id on profile
    if (profile?.organization_id) {
      const res = await serviceManagementService.getOrganizationById(profile.organization_id);
      console.log('[OrgDashboard] getOrganizationById result:', res);
      if (res.data) {
        setOrganization(res.data);
        return;
      }
    }
    // Fallback: get organization by owner_id for org owners
    if (user?.id) {
      console.log('[OrgDashboard] Trying getOrganizationByOwner for user:', user.id);
      const res = await serviceManagementService.getOrganizationByOwner(user.id);
      console.log('[OrgDashboard] getOrganizationByOwner result:', res);
      if (res.data) setOrganization(res.data);
    }
  };

  const loadListings = async () => {
    if (!orgId) return;
    const { data } = await listingService.getOrganizationListings(orgId);
    if (data) setListings(data);
  };

  const loadTeamData = async () => {
    if (!orgId) return;
    try {
      const [invitesRes, membersRes] = await Promise.all([
        teamService.getOrganizationInvitations(orgId),
        teamService.getTeamMembers(orgId)
      ]);
      console.log('[OrgDashboard] Team data loaded:', { invites: invitesRes.data?.length, members: membersRes.data?.length, membersError: membersRes.error });
      setInvites(invitesRes.data || []);
      setMembers(membersRes.data || []);
    } catch (err) {
      console.error('[OrgDashboard] Error loading team data:', err);
    }
  };

  const loadConversations = async () => {
    if (!user?.id) return;
    console.log('[OrgDashboard] Loading conversations for user:', user.id);
    const { data, error } = await chatService.getConversations(user.id);
    if (error) {
      console.error('[OrgDashboard] Failed to load conversations:', error);
      return;
    }
    console.log('[OrgDashboard] Conversations loaded:', data);
    setConversations(data || []);
  };

  const handleSaveListing = async (formData) => {
    setLoading(true);
    const { error } = editingListing
      ? await listingService.updateListing(editingListing.id, formData)
      : await listingService.createListing(formData, orgId);

    if (!error) {
      loadListings();
      setShowListingForm(false);
      setEditingListing(null);
    }
    setLoading(false);
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponMessage({ type: '', text: '' });

    const { data, error } = await serviceManagementService.applyDevCoupon(
      orgId,
      couponCode
    );

    if (error) {
      setCouponMessage({ type: 'error', text: error });
    } else {
      setCouponMessage({ 
        type: 'success', 
        text: `Successfully upgraded to ${data.subscription_tier} tier!` 
      });
      setCouponCode('');
      // Reload organization data to reflect new tier
      await loadOrgData();
    }

    setCouponLoading(false);
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
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg font-bold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-navy font-medium'
              }`}
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
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
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
                    <button
                      onClick={() => {
                        setEditingListing(null);
                        setShowListingForm(true);
                      }}
                      className="bg-navy text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-lg shadow-navy/20 transition-all hover:scale-105"
                    >
                      <SafeIcon icon={FiPlus} />
                      <span>Add Listing</span>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(listing => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        onEdit={(l) => {
                          setEditingListing(l);
                          setShowListingForm(true);
                        }}
                        onDelete={async (l) => {
                          if (confirm('Delete listing?')) {
                            await listingService.deleteListing(l.id);
                            loadListings();
                          }
                        }}
                        onView={() => window.open(`/#/listing/${listing.id}`, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'services' && orgId && <ServiceManagement organizationId={orgId} userRole="organization" />}
              {activeTab === 'bookings' && orgId && <BookingManagement organizationId={orgId} userId={user.id} userRole="organization" />}
              {activeTab === 'tasks' && (
                perms.canManageTeam ? (
                  orgId ? <OrgTasks organizationId={orgId} /> : <div className="text-center py-10 text-gray-400">Loading...</div>
                ) : (
                  <div className="bg-white border rounded-2xl p-8 text-center text-gray-500">
                    <p className="font-bold text-navy mb-2">Not authorized</p>
                    <p className="text-sm">You don't have permission to view Tasks. Contact your organization admin.</p>
                  </div>
                )
              )}
              {activeTab === 'equipment' && orgId && <EquipmentManagement organizationId={orgId} userRole="organization" />}
              {activeTab === 'equipment' && !orgId && (
                <div className="text-center py-20 text-gray-400">
                  <SafeIcon icon={FiPackage} className="text-5xl mx-auto mb-4 text-gray-200" />
                  <p>Loading organization data...</p>
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="grid lg:grid-cols-3 gap-6 h-[650px] text-left">
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-navy flex items-center">
                        <SafeIcon icon={FiMessageSquare} className="mr-2 text-blue-600" />
                        Inbox
                      </h3>
                      <button
                        onClick={loadConversations}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                      >
                        <SafeIcon icon={FiIcons.FiRefreshCw} className={loading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.map((conv, idx) => (
                        <button
                          key={`${conv.otherUser.id}-${conv.bookingId || 'none'}-${conv.serviceId || 'none'}-${conv.equipmentId || 'none'}-${idx}`}
                          onClick={() => setSelectedChat(conv)}
                          className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${
                            selectedChat?.otherUser?.id === conv.otherUser.id &&
                            selectedChat?.bookingId === conv.bookingId &&
                            selectedChat?.serviceId === conv.serviceId &&
                            selectedChat?.equipmentId === conv.equipmentId
                              ? 'bg-blue-50 border-l-4 border-l-blue-600'
                              : ''
                          }`}
                        >
                          <div className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center font-black text-blue-600 shadow-sm">
                            {conv.otherUser.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-sm text-navy truncate">{conv.otherUser.full_name}</p>
                              <span className="text-[10px] text-gray-400">{format(new Date(conv.timestamp), "MMM d")}</span>
                            </div>
                            <p className="text-[10px] font-bold text-blue-500 uppercase truncate mt-0.5">{conv.contextName}</p>
                            <p className="text-xs text-gray-500 truncate mt-1">{conv.lastMessage}</p>
                          </div>
                        </button>
                      ))}
                      {conversations.length === 0 && !loading && (
                        <div className="p-12 text-center text-gray-400 space-y-2">
                          <SafeIcon icon={FiMessageSquare} className="text-4xl mx-auto opacity-20" />
                          <p className="text-sm font-medium">No messages yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    {selectedChat ? (
                      <ChatWindow
                        currentUser={user}
                        recipient={selectedChat.otherUser}
                        orgId={selectedChat.orgId}
                        context={{
                          bookingId: selectedChat.bookingId,
                          serviceId: selectedChat.serviceId,
                          equipmentId: selectedChat.equipmentId,
                          name: selectedChat.contextName
                        }}
                        onClose={() => setSelectedChat(null)}
                        onMessageSent={loadConversations}
                      />
                    ) : (
                      <div className="h-full bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <SafeIcon icon={FiMessageSquare} className="text-5xl opacity-20" />
                        <p className="font-bold text-navy">Select a thread to start chatting</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                                <div className="inline-flex items-center gap-3">
                                  <button
                                    onClick={() => { setSelectedAssignee(m); setShowTaskModal(true); }}
                                    className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                                  >Assign Task</button>
                                  <button onClick={() => teamService.removeTeamMember(m.id).then(loadTeamData)} className="text-red-400 hover:text-red-600"><SafeIcon icon={FiTrash2} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <TeamInviteList
                    invitations={invites}
                    onResendInvite={id => teamService.resendInvitation(id).then(loadTeamData)}
                    onRevokeInvite={id => teamService.revokeInvitation(id).then(loadTeamData)}
                  />
                </div>
              )}

              {activeTab === 'locations' && <LocationManagement organizationId={orgId} />}
              {activeTab === 'api' && <ApiKeyManagement organizationId={orgId} />}

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

                  {/* Developer Coupon Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-[2.5rem] border-2 border-dashed border-purple-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-purple-600/20">
                        <SafeIcon icon={FiKey} className="text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-navy">Developer Access</h3>
                        <p className="text-sm text-purple-600 font-medium">Unlock Pro & Teams tier for testing</p>
                      </div>
                    </div>

                    {couponMessage.text && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-2xl border-2 flex items-center space-x-3 ${
                          couponMessage.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                        }`}
                      >
                        <SafeIcon icon={couponMessage.type === 'success' ? FiCheckCircle : FiAlertCircle} className="text-xl" />
                        <p className="font-bold text-sm">{couponMessage.text}</p>
                      </motion.div>
                    )}

                    <form onSubmit={handleApplyCoupon} className="space-y-4">
                      <div className="relative">
                        <SafeIcon icon={FiKey} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code (e.g., PRO_STAGE)"
                          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-purple-200 rounded-2xl font-mono font-bold text-navy placeholder-purple-300 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={couponLoading || !couponCode.trim()}
                        className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {couponLoading ? (
                          <>
                            <SafeIcon icon={FiZap} className="animate-spin" />
                            <span>Applying...</span>
                          </>
                        ) : (
                          <>
                            <SafeIcon icon={FiZap} />
                            <span>Apply Coupon</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-purple-200">
                      <p className="text-xs font-black text-purple-900 uppercase tracking-widest mb-3">Available Codes:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                          <p className="font-mono font-bold text-navy text-sm">PRO_STAGE</p>
                          <p className="text-[10px] text-gray-500 mt-1">Unlocks Professional</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                          <p className="font-mono font-bold text-navy text-sm">TEAM_STAGE</p>
                          <p className="text-[10px] text-gray-500 mt-1">Unlocks Teams</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start space-x-3">
                      <SafeIcon icon={FiAlertCircle} className="text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-yellow-900 uppercase tracking-wider">For Testing Only</p>
                        <p className="text-xs text-yellow-700 mt-1">These coupons are for development and staging environments. Production billing will be handled separately.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TeamInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSendInvite={(invitationData) => teamService.sendTeamInvitation(invitationData)}
        organizationId={orgId}
        currentUserId={user?.id}
      />

      <AnimatePresence>
        {showTaskModal && selectedAssignee && (
          <TaskForm
            organizationId={orgId}
            defaultValues={{ assignee_id: selectedAssignee.id }}
            onClose={() => { setShowTaskModal(false); setSelectedAssignee(null); }}
            onSave={async (values) => {
              await taskService.createTask({
                organization_id: orgId,
                assignee_id: selectedAssignee.id,
                title: values.title,
                description: values.description,
                priority: values.priority,
                due_date: values.due_date || null,
                task_type: values.task_type,
                booking_id: values.booking_id || null,
                equipment_id: values.equipment_id || null,
                rental_id: values.rental_id || null,
                context_label: values.context_label || null,
                created_by: user?.id,
              });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showListingForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] shadow-2xl relative flex flex-col overflow-hidden">
              <div className="absolute top-4 right-4 z-[210]">
                <button
                  onClick={() => {
                    setShowListingForm(false);
                    setEditingListing(null);
                  }}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors shadow-sm"
                >
                  <SafeIcon icon={FiX} className="text-xl text-gray-600" />
                </button>
              </div>
              <ListingForm
                listing={editingListing}
                onSave={handleSaveListing}
                onCancel={() => {
                  setShowListingForm(false);
                  setEditingListing(null);
                }}
                isLoading={loading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationDashboard;