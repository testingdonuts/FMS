import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

const { 
  FiUsers, FiShield, FiDollarSign, FiCheckCircle, FiXCircle, 
  FiClock, FiTrendingUp, FiActivity, FiBriefcase, FiAlertCircle,
  FiEye, FiUserX, FiUserCheck, FiFileText, FiEdit, FiLogOut,
  FiSettings, FiMail, FiMessageSquare, FiBell, FiSend, FiTrash2,
  FiPlus, FiX, FiBarChart2, FiPieChart, FiCalendar, FiToggleLeft, FiToggleRight,
  FiBookOpen, FiImage, FiStar, FiSave, FiUpload
} = FiIcons;

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // New state for additional features
  const [analytics, setAnalytics] = useState([]);
  const [settings, setSettings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketStats, setTicketStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketResponses, setTicketResponses] = useState([]);
  const [newResponse, setNewResponse] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', body: '', selectedUsers: [] });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'info', target_audience: 'all' });
  
  // Blog state
  const [blogPosts, setBlogPosts] = useState([]);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Safety Guides',
    featured_image: '',
    author_name: '',
    is_published: false,
    is_featured: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    if (activeTab === 'overview') {
      const { data } = await adminService.getGlobalStats();
      setStats(data);
    } else if (activeTab === 'payouts') {
      const { data } = await adminService.getAllPayouts();
      setPayouts(data || []);
    } else if (activeTab === 'organizations') {
      const { data } = await adminService.getAllOrganizations();
      setOrgs(data || []);
    } else if (activeTab === 'users') {
      const { data } = await adminService.getAllUsers();
      setUsers(data || []);
    } else if (activeTab === 'activity') {
      const { data } = await adminService.getRecentActivity();
      setActivity(data || []);
    } else if (activeTab === 'analytics') {
      const { data } = await adminService.getRevenueAnalytics(30);
      setAnalytics(data || []);
    } else if (activeTab === 'settings') {
      const { data } = await adminService.getSettings();
      setSettings(data || []);
    } else if (activeTab === 'tickets') {
      const [ticketsRes, statsRes] = await Promise.all([
        adminService.getAllTickets(),
        adminService.getTicketStats()
      ]);
      setTickets(ticketsRes.data || []);
      setTicketStats(statsRes.data);
    } else if (activeTab === 'announcements') {
      const { data } = await adminService.getAnnouncements();
      setAnnouncements(data || []);
    } else if (activeTab === 'emails') {
      const [usersRes, logsRes] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getEmailLogs()
      ]);
      setUsers(usersRes.data || []);
      setEmailLogs(logsRes.data || []);
    } else if (activeTab === 'blog') {
      const { data } = await adminService.getBlogPosts();
      setBlogPosts(data || []);
    }
    setLoading(false);
  };

  const handlePayoutAction = async (id, status) => {
    const { error } = await adminService.updatePayoutStatus(id, status);
    if (!error) loadAdminData();
  };

  const handleOrgVerification = async (id, status) => {
    const { error } = await adminService.updateOrgVerification(id, status, adminNotes);
    if (!error) {
      loadAdminData();
      setSelectedOrg(null);
      setAdminNotes('');
    }
  };

  const handleUserAction = async (userId, action) => {
    if (action === 'suspend') {
      const reason = prompt('Enter suspension reason:');
      if (reason) {
        const { error } = await adminService.suspendUser(userId, reason);
        if (!error) loadAdminData();
      }
    } else if (action === 'activate') {
      const { error } = await adminService.activateUser(userId);
      if (!error) loadAdminData();
    }
  };

  // New handlers for additional features
  const handleSettingUpdate = async (key, value) => {
    const { error } = await adminService.updateSetting(key, value);
    if (!error) loadAdminData();
  };

  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    const { data } = await adminService.getTicketResponses(ticket.id);
    setTicketResponses(data || []);
  };

  const handleTicketStatusUpdate = async (ticketId, status) => {
    const { error } = await adminService.updateTicketStatus(ticketId, status);
    if (!error) {
      loadAdminData();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    }
  };

  const handleAddResponse = async () => {
    if (!newResponse.trim() || !selectedTicket) return;
    const { error } = await adminService.addTicketResponse(selectedTicket.id, newResponse);
    if (!error) {
      setNewResponse('');
      const { data } = await adminService.getTicketResponses(selectedTicket.id);
      setTicketResponses(data || []);
    }
  };

  const handleCreateAnnouncement = async () => {
    const { error } = await adminService.createAnnouncement(newAnnouncement);
    if (!error) {
      setShowAnnouncementModal(false);
      setNewAnnouncement({ title: '', content: '', type: 'info', target_audience: 'all' });
      loadAdminData();
    }
  };

  const handleToggleAnnouncement = async (id, isActive) => {
    const { error } = await adminService.updateAnnouncement(id, { is_active: !isActive });
    if (!error) loadAdminData();
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      const { error } = await adminService.deleteAnnouncement(id);
      if (!error) loadAdminData();
    }
  };

  // Blog handlers
  const handleOpenBlogModal = (post = null) => {
    if (post) {
      setEditingPost(post);
      setBlogForm({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        category: post.category || 'Safety Guides',
        featured_image: post.featured_image || '',
        author_name: post.author_name || '',
        is_published: post.is_published || false,
        is_featured: post.is_featured || false
      });
    } else {
      setEditingPost(null);
      setBlogForm({
        title: '',
        excerpt: '',
        content: '',
        category: 'Safety Guides',
        featured_image: '',
        author_name: '',
        is_published: false,
        is_featured: false
      });
    }
    setShowBlogModal(true);
  };

  const handleSaveBlogPost = async () => {
    if (!blogForm.title || !blogForm.content || !blogForm.author_name) {
      alert('Please fill in title, content, and author name');
      return;
    }
    
    let result;
    if (editingPost) {
      result = await adminService.updateBlogPost(editingPost.id, blogForm);
    } else {
      result = await adminService.createBlogPost(blogForm);
    }
    
    if (!result.error) {
      setShowBlogModal(false);
      setEditingPost(null);
      loadAdminData();
    }
  };

  const handleToggleBlogPublished = async (id, isPublished) => {
    const { error } = await adminService.toggleBlogPostPublished(id, !isPublished);
    if (!error) loadAdminData();
  };

  const handleToggleBlogFeatured = async (id, isFeatured) => {
    const { error } = await adminService.toggleBlogPostFeatured(id, !isFeatured);
    if (!error) loadAdminData();
  };

  const handleDeleteBlogPost = async (id) => {
    if (window.confirm('Delete this blog post? This cannot be undone.')) {
      const { error } = await adminService.deleteBlogPost(id);
      if (!error) loadAdminData();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    
    setUploadingImage(true);
    const { data, error } = await adminService.uploadBlogImage(file);
    setUploadingImage(false);
    
    if (error) {
      alert('Upload failed: ' + error);
    } else {
      setBlogForm({ ...blogForm, featured_image: data });
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.body || emailData.selectedUsers.length === 0) {
      alert('Please fill all fields and select at least one user');
      return;
    }
    const { error } = await adminService.sendBulkEmail(
      emailData.selectedUsers,
      emailData.subject,
      emailData.body
    );
    if (!error) {
      setShowEmailModal(false);
      setEmailData({ subject: '', body: '', selectedUsers: [] });
      loadAdminData();
    }
  };

  const toggleUserSelection = (userId) => {
    setEmailData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-left">
      <header className="bg-navy p-4 sm:p-6 lg:p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter">Platform Control</h1>
              <p className="text-blue-300 font-bold text-xs sm:text-sm">Super Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <SafeIcon icon={menuOpen ? FiX : FiIcons.FiMenu} className="text-xl" />
              </button>
              <button
                onClick={signOut}
                className="hidden sm:flex px-4 py-2 rounded-full font-bold text-sm transition-all bg-red-500/20 text-red-200 hover:bg-red-500/40 items-center gap-2"
              >
                <SafeIcon icon={FiLogOut} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
          
          {/* Desktop tabs */}
          <div className="hidden lg:flex flex-wrap gap-2 mt-4">
            {['overview', 'analytics', 'organizations', 'users', 'payouts', 'tickets', 'announcements', 'blog', 'emails', 'settings', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full font-bold text-xs transition-all ${
                  activeTab === tab ? 'bg-white text-navy shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div className="lg:hidden mt-4 bg-white/10 backdrop-blur-lg rounded-2xl p-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {['overview', 'analytics', 'organizations', 'users', 'payouts', 'tickets', 'announcements', 'blog', 'emails', 'settings', 'activity'].map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setMenuOpen(false); }}
                  className={`px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                    activeTab === tab ? 'bg-white text-navy shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button
                onClick={signOut}
                className="col-span-3 sm:col-span-4 mt-2 px-4 py-2 rounded-xl font-bold text-sm transition-all bg-red-500/30 text-red-200 hover:bg-red-500/40 flex items-center justify-center gap-2"
              >
                <SafeIcon icon={FiLogOut} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === 'overview' && stats && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    <StatCard icon={FiTrendingUp} label="Platform Revenue" value={`$${stats.total_platform_revenue || 0}`} color="text-green-600" />
                    <StatCard icon={FiClock} label="Pending Payouts" value={`$${stats.pending_payout_amount || 0}`} color="text-blue-600" />
                    <StatCard icon={FiBriefcase} label="Org Applications" value={stats.pending_verifications || 0} color="text-yellow-600" />
                    <StatCard icon={FiUsers} label="Total Users" value={stats.total_users || 0} color="text-purple-600" />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-black text-navy mb-4">Quick Stats</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Total Organizations</span>
                          <span className="font-bold text-navy">{stats.total_orgs || 0}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Total Bookings</span>
                          <span className="font-bold text-navy">{stats.total_bookings || 0}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Active Rentals</span>
                          <span className="font-bold text-navy">{stats.active_rentals || 0}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-500">Verified Organizations</span>
                          <span className="font-bold text-green-600">{stats.verified_orgs || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-black text-navy mb-4">Pending Actions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <SafeIcon icon={FiAlertCircle} className="text-yellow-600" />
                            <span className="text-sm font-medium">Org Verifications</span>
                          </div>
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                            {stats.pending_verifications || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <SafeIcon icon={FiDollarSign} className="text-blue-600" />
                            <span className="text-sm font-medium">Payout Requests</span>
                          </div>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                            {stats.pending_payouts || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-navy">Revenue Analytics (Last 30 Days)</h2>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="h-64 flex items-end gap-1">
                      {analytics.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-teal-500 rounded-t"
                            style={{ height: `${Math.max(4, (day.total_revenue / Math.max(...analytics.map(d => d.total_revenue || 1))) * 200)}px` }}
                            title={`$${day.total_revenue} - ${day.date}`}
                          />
                          {i % 5 === 0 && (
                            <span className="text-[8px] text-gray-400 mt-1 rotate-45">{format(new Date(day.date), 'M/d')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border">
                      <p className="text-xs text-gray-400 uppercase">Total Revenue</p>
                      <p className="text-2xl font-black text-navy">${analytics.reduce((sum, d) => sum + Number(d.total_revenue || 0), 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border">
                      <p className="text-xs text-gray-400 uppercase">Total Bookings</p>
                      <p className="text-2xl font-black text-navy">{analytics.reduce((sum, d) => sum + Number(d.total_bookings || 0), 0)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border">
                      <p className="text-xs text-gray-400 uppercase">New Users</p>
                      <p className="text-2xl font-black text-navy">{analytics.reduce((sum, d) => sum + Number(d.new_users || 0), 0)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border">
                      <p className="text-xs text-gray-400 uppercase">New Organizations</p>
                      <p className="text-2xl font-black text-navy">{analytics.reduce((sum, d) => sum + Number(d.new_organizations || 0), 0)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Organizations Tab */}
              {activeTab === 'organizations' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-black text-navy">Organization Management</h2>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">Organization</th>
                        <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">Owner</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                        <th className="p-4 text-right text-[10px] font-black uppercase text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orgs.map(org => (
                        <tr key={org.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-bold text-navy">{org.name}</p>
                            <p className="text-xs text-gray-400">{org.business_type}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{org.owner?.full_name || 'N/A'}</p>
                            <p className="text-xs text-gray-400">{org.owner?.email}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              org.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                              org.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {org.verification_status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {org.verification_status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleOrgVerification(org.id, 'verified')}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                >
                                  <SafeIcon icon={FiCheckCircle} />
                                </button>
                                <button
                                  onClick={() => handleOrgVerification(org.id, 'rejected')}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                >
                                  <SafeIcon icon={FiXCircle} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orgs.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                      <SafeIcon icon={FiBriefcase} className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>No organizations found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-black text-navy">User Management</h2>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">User</th>
                        <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">Role</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                        <th className="p-4 text-right text-[10px] font-black uppercase text-gray-400">Joined</th>
                        <th className="p-4 text-right text-[10px] font-black uppercase text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-bold text-navy">{user.full_name || 'No Name'}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                              {user.role || 'user'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              user.status === 'active' ? 'bg-green-100 text-green-700' :
                              user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td className="p-4 text-right text-xs text-gray-400">
                            {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {user.status !== 'suspended' ? (
                                <button
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                  title="Suspend User"
                                >
                                  <SafeIcon icon={FiUserX} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                  title="Activate User"
                                >
                                  <SafeIcon icon={FiUserCheck} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                      <SafeIcon icon={FiUsers} className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>No users found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Payouts Tab */}
              {activeTab === 'payouts' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-black text-navy">Payout Management</h2>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">Organization</th>
                        <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">Amount</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                        <th className="p-4 text-right text-[10px] font-black uppercase text-gray-400">Date</th>
                        <th className="p-4 text-right text-[10px] font-black uppercase text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payouts.map(payout => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-bold text-navy">{payout.organization_name}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-green-600">${payout.amount}</p>
                            <p className="text-xs text-gray-400">Fee: ${payout.fee_amount}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                              payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="p-4 text-right text-xs text-gray-400">
                            {payout.created_at ? format(new Date(payout.created_at), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            {payout.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handlePayoutAction(payout.id, 'paid')}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                >
                                  <SafeIcon icon={FiCheckCircle} />
                                </button>
                                <button
                                  onClick={() => handlePayoutAction(payout.id, 'rejected')}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                >
                                  <SafeIcon icon={FiXCircle} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {payouts.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                      <SafeIcon icon={FiDollarSign} className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>No payout requests</p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-navy">Platform Settings</h2>
                  <div className="bg-white rounded-3xl border shadow-sm divide-y">
                    {settings.map(setting => {
                      const rawValue = setting.value;
                      const displayValue = typeof rawValue === 'string' 
                        ? rawValue.replace(/^"|"$/g, '') 
                        : JSON.stringify(rawValue);
                      const isBoolean = displayValue === 'true' || displayValue === 'false';
                      
                      return (
                        <div key={setting.key} className="p-5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-navy">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                            <p className="text-sm text-gray-400">{setting.description}</p>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{setting.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {isBoolean ? (
                              <button
                                onClick={() => handleSettingUpdate(setting.key, displayValue === 'true' ? 'false' : 'true')}
                                className={`p-2 rounded-lg ${displayValue === 'true' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                              >
                                <SafeIcon icon={displayValue === 'true' ? FiToggleRight : FiToggleLeft} className="text-xl" />
                              </button>
                            ) : (
                              <input
                                type="text"
                                value={displayValue}
                                onChange={(e) => handleSettingUpdate(setting.key, e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg w-48 text-right"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {settings.length === 0 && (
                    <div className="bg-white p-12 rounded-2xl border text-center text-gray-400">
                      <SafeIcon icon={FiSettings} className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>No settings found. Run the database script to add default settings.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tickets Tab */}
              {activeTab === 'tickets' && (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-black text-navy">Support Tickets</h2>
                      {ticketStats && (
                        <div className="flex gap-4 text-sm">
                          <span className="text-red-600 font-bold">{ticketStats.open_tickets} Open</span>
                          <span className="text-yellow-600 font-bold">{ticketStats.in_progress_tickets} In Progress</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {tickets.map(ticket => (
                        <div 
                          key={ticket.id} 
                          onClick={() => handleTicketSelect(ticket)}
                          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedTicket?.id === ticket.id ? 'border-blue-500 shadow-lg' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-navy">{ticket.subject}</p>
                              <p className="text-sm text-gray-500">
                                {ticket.user?.full_name || 'Anonymous'} • {ticket.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>{ticket.priority}</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                ticket.status === 'open' ? 'bg-red-100 text-red-700' :
                                ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{ticket.status}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {tickets.length === 0 && (
                        <div className="bg-white p-12 rounded-2xl border text-center text-gray-400">
                          <SafeIcon icon={FiMessageSquare} className="text-4xl mx-auto mb-3 opacity-50" />
                          <p>No support tickets</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border p-5">
                    {selectedTicket ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-black text-navy">{selectedTicket.subject}</h3>
                          <select
                            value={selectedTicket.status}
                            onChange={(e) => handleTicketStatusUpdate(selectedTicket.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_response">Waiting Response</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        <p className="text-sm text-gray-600">{selectedTicket.description}</p>
                        
                        <div className="border-t pt-4 space-y-3 max-h-64 overflow-y-auto">
                          {ticketResponses.map(resp => (
                            <div key={resp.id} className={`p-3 rounded-lg ${resp.is_admin_response ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                              <p className="text-sm">{resp.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{resp.user?.full_name} • {format(new Date(resp.created_at), 'MMM d, h:mm a')}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newResponse}
                            onChange={(e) => setNewResponse(e.target.value)}
                            placeholder="Type a response..."
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          />
                          <button onClick={handleAddResponse} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                            <SafeIcon icon={FiSend} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-12">
                        <SafeIcon icon={FiMessageSquare} className="text-3xl mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Select a ticket to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="bg-white rounded-3xl border shadow-sm">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-black text-navy">Recent Activity</h2>
                  </div>
                  <div className="divide-y">
                    {activity.map(log => (
                      <div key={log.id} className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <SafeIcon icon={FiActivity} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-navy">{log.action}</p>
                          <p className="text-xs text-gray-400">{log.user?.full_name || 'System'}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {log.created_at ? format(new Date(log.created_at), 'MMM d, h:mm a') : ''}
                        </span>
                      </div>
                    ))}
                    {activity.length === 0 && (
                      <div className="p-12 text-center text-gray-400">
                        <SafeIcon icon={FiActivity} className="text-4xl mx-auto mb-3 opacity-50" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Announcements Tab */}
              {activeTab === 'announcements' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-navy">Platform Announcements</h2>
                    <button 
                      onClick={() => setShowAnnouncementModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                      <SafeIcon icon={FiPlus} /> New Announcement
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {announcements.map(ann => (
                      <div key={ann.id} className={`bg-white p-5 rounded-2xl border shadow-sm ${!ann.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              ann.type === 'warning' ? 'bg-yellow-100' :
                              ann.type === 'error' ? 'bg-red-100' :
                              ann.type === 'success' ? 'bg-green-100' :
                              'bg-blue-100'
                            }`}>
                              <SafeIcon icon={FiBell} className={`${
                                ann.type === 'warning' ? 'text-yellow-600' :
                                ann.type === 'error' ? 'text-red-600' :
                                ann.type === 'success' ? 'text-green-600' :
                                'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-navy">{ann.title}</h3>
                                {ann.is_pinned && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">Pinned</span>}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span>For: {ann.target_audience}</span>
                                <span>•</span>
                                <span>{format(new Date(ann.created_at), 'MMM d, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleToggleAnnouncement(ann.id, ann.is_active)}
                              className={`p-2 rounded-lg ${ann.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}
                            >
                              <SafeIcon icon={ann.is_active ? FiToggleRight : FiToggleLeft} />
                            </button>
                            <button 
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            >
                              <SafeIcon icon={FiTrash2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="bg-white p-12 rounded-2xl border text-center text-gray-400">
                        <SafeIcon icon={FiBell} className="text-4xl mx-auto mb-3 opacity-50" />
                        <p>No announcements yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emails Tab */}
              {activeTab === 'emails' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-navy">Email Communications</h2>
                    <button 
                      onClick={() => setShowEmailModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                      <SafeIcon icon={FiMail} /> Compose Email
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-black text-navy">Recent Email Activity</h3>
                    </div>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">Recipient</th>
                          <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">Subject</th>
                          <th className="p-4 text-left text-[10px] font-black uppercase text-gray-400">Type</th>
                          <th className="p-4 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                          <th className="p-4 text-right text-[10px] font-black uppercase text-gray-400">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {emailLogs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="p-4">
                              <p className="font-bold text-navy text-sm">{log.recipient?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{log.recipient_email}</p>
                            </td>
                            <td className="p-4 text-sm text-gray-600">{log.subject}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">{log.email_type}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                log.status === 'sent' ? 'bg-green-100 text-green-600' :
                                log.status === 'failed' ? 'bg-red-100 text-red-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>{log.status}</span>
                            </td>
                            <td className="p-4 text-right text-xs text-gray-400">
                              {format(new Date(log.created_at), 'MMM d, h:mm a')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {emailLogs.length === 0 && (
                      <div className="p-12 text-center text-gray-400">
                        <SafeIcon icon={FiMail} className="text-4xl mx-auto mb-3 opacity-50" />
                        <p>No emails sent yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Blog Management Tab */}
              {activeTab === 'blog' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-navy">Blog Management</h2>
                      <p className="text-sm text-gray-500">{blogPosts.length} posts total • {blogPosts.filter(p => p.is_published).length} published</p>
                    </div>
                    <button 
                      onClick={() => handleOpenBlogModal()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                      <SafeIcon icon={FiPlus} /> New Post
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {blogPosts.map(post => (
                      <div key={post.id} className={`bg-white p-5 rounded-2xl border shadow-sm flex gap-4 ${!post.is_published ? 'opacity-70' : ''}`}>
                        {post.featured_image && (
                          <img 
                            src={post.featured_image} 
                            alt={post.title}
                            className="w-32 h-24 object-cover rounded-xl flex-shrink-0"
                          />
                        )}
                        {!post.featured_image && (
                          <div className="w-32 h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <SafeIcon icon={FiImage} className="text-gray-300 text-2xl" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-navy truncate">{post.title}</h3>
                                {post.is_featured && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs flex items-center gap-1">
                                    <SafeIcon icon={FiStar} className="text-[10px]" /> Featured
                                  </span>
                                )}
                                {!post.is_published && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Draft</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                By {post.author_name} • {post.category} • {post.view_count || 0} views
                              </p>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{post.excerpt}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button 
                                onClick={() => handleToggleBlogFeatured(post.id, post.is_featured)}
                                className={`p-2 rounded-lg ${post.is_featured ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'}`}
                                title={post.is_featured ? 'Remove from featured' : 'Mark as featured'}
                              >
                                <SafeIcon icon={FiStar} />
                              </button>
                              <button 
                                onClick={() => handleToggleBlogPublished(post.id, post.is_published)}
                                className={`p-2 rounded-lg ${post.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}
                                title={post.is_published ? 'Unpublish' : 'Publish'}
                              >
                                <SafeIcon icon={post.is_published ? FiToggleRight : FiToggleLeft} />
                              </button>
                              <button 
                                onClick={() => handleOpenBlogModal(post)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                title="Edit post"
                              >
                                <SafeIcon icon={FiEdit} />
                              </button>
                              <button 
                                onClick={() => handleDeleteBlogPost(post.id)}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                title="Delete post"
                              >
                                <SafeIcon icon={FiTrash2} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                            <span>Created: {format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                            {post.published_at && (
                              <>
                                <span>•</span>
                                <span>Published: {format(new Date(post.published_at), 'MMM d, yyyy')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {blogPosts.length === 0 && (
                      <div className="bg-white p-12 rounded-2xl border text-center text-gray-400">
                        <SafeIcon icon={FiBookOpen} className="text-4xl mx-auto mb-3 opacity-50" />
                        <p>No blog posts yet</p>
                        <button 
                          onClick={() => handleOpenBlogModal()}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
                        >
                          Create First Post
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-navy">New Announcement</h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <SafeIcon icon={FiX} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
              <textarea
                placeholder="Content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newAnnouncement.type}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
                <select
                  value={newAnnouncement.target_audience}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target_audience: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                >
                  <option value="all">All Users</option>
                  <option value="parents">Parents Only</option>
                  <option value="organizations">Organizations Only</option>
                  <option value="team_members">Team Members Only</option>
                </select>
              </div>
              <button
                onClick={handleCreateAnnouncement}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
              >
                Post Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-navy">Compose Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <SafeIcon icon={FiX} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">Select Recipients</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailData.selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{user.full_name || user.email}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{emailData.selectedUsers.length} selected</p>
              </div>
              <input
                type="text"
                placeholder="Subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
              <textarea
                placeholder="Email body..."
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
              <button
                onClick={handleSendEmail}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <SafeIcon icon={FiSend} /> Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Post Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-navy">
                {editingPost ? 'Edit Blog Post' : 'New Blog Post'}
              </h3>
              <button 
                onClick={() => { setShowBlogModal(false); setEditingPost(null); }} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-600 mb-1 block">Title *</label>
                <input
                  type="text"
                  placeholder="Enter post title"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 mb-1 block">Author Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Dr. Jane Smith"
                    value={blogForm.author_name}
                    onChange={(e) => setBlogForm({ ...blogForm, author_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600 mb-1 block">Category</label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  >
                    <option value="Safety Guides">Safety Guides</option>
                    <option value="Installation Tips">Installation Tips</option>
                    <option value="Milestones">Milestones</option>
                    <option value="Travel">Travel</option>
                    <option value="News">News</option>
                    <option value="Product Reviews">Product Reviews</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-600 mb-1 block">Featured Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or upload below"
                    value={blogForm.featured_image}
                    onChange={(e) => setBlogForm({ ...blogForm, featured_image: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl"
                  />
                  <label className={`px-4 py-3 rounded-xl font-bold text-sm cursor-pointer flex items-center gap-2 ${
                    uploadingImage ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}>
                    <SafeIcon icon={FiUpload} />
                    {uploadingImage ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {blogForm.featured_image && (
                  <div className="relative mt-2">
                    <img 
                      src={blogForm.featured_image} 
                      alt="Preview" 
                      className="h-32 w-full object-cover rounded-lg"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <button
                      type="button"
                      onClick={() => setBlogForm({ ...blogForm, featured_image: '' })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <SafeIcon icon={FiX} className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-600 mb-1 block">Excerpt</label>
                <textarea
                  placeholder="Brief summary shown in post lists..."
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-600 mb-1 block">Content *</label>
                <textarea
                  placeholder="Full blog post content... (Markdown supported)"
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm"
                />
              </div>
              
              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blogForm.is_published}
                    onChange={(e) => setBlogForm({ ...blogForm, is_published: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Publish immediately</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blogForm.is_featured}
                    onChange={(e) => setBlogForm({ ...blogForm, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Featured post</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowBlogModal(false); setEditingPost(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBlogPost}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <SafeIcon icon={FiSave} /> {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
    <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 ${color}`}>
      <SafeIcon icon={icon} className="text-2xl" />
    </div>
    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-navy">{value}</p>
  </div>
);

export default AdminDashboard;
