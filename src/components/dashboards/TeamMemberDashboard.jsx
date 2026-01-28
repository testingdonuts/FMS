import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService';
import { serviceManagementService } from '../../services/serviceManagementService';
import EquipmentManagement from '../equipment/EquipmentManagement';
import BookingManagement from '../bookings/BookingManagement';
import ChatWindow from '../chat/ChatWindow';
import TaskManagement from '../tasks/TaskManagement';
import NotificationBell from '../notifications/NotificationBell';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const {
  FiUser, FiCalendar, FiPackage, FiBookOpen, FiCheckSquare, 
  FiClock, FiMapPin, FiAlertCircle, FiMenu, FiX, FiLogOut, 
  FiTool, FiEdit, FiGlobe, FiMessageSquare
} = FiIcons;

const TeamMemberDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signOut, user, profile, updateProfile } = useAuth();
  const [teamMemberDetails, setTeamMemberDetails] = useState(null);
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [profileData, setProfileData] = useState({ fullName: '', phone: '' });
  const [organizationName, setOrganizationName] = useState('');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'schedule', label: 'My Schedule', icon: FiClock },
    { id: 'bookings', label: 'All Bookings', icon: FiCalendar },
    { id: 'messages', label: 'Messages', icon: FiMessageSquare },
    { id: 'equipment', label: 'Equipment', icon: FiPackage },
    { id: 'training', label: 'Training', icon: FiBookOpen },
    { id: 'tasks', label: 'Tasks', icon: FiCheckSquare },
  ];

  useEffect(() => {
    if (profile?.organization_id && user?.id) {
      loadDashboardData();
    }
  }, [profile, user]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const loadDashboardData = async () => {
    setLoading(true);
    const { data: memberData } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (memberData) setTeamMemberDetails(memberData);

    if (profile?.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();
      if (orgData) setOrganizationName(orgData.name);
    }

    const { data: bookingsData } = await bookingService.getServiceBookings({
      organizationId: profile.organization_id,
    });

    if (bookingsData && memberData) {
      const myBookings = bookingsData.filter(b => b.technician_id === memberData.id);
      setAssignedBookings(myBookings.sort((a,b) => new Date(a.booking_date) - new Date(b.booking_date)));
    }
    setLoading(false);
  };

  const handleStartChat = (booking) => {
    setSelectedChat({
      otherUser: { id: booking.parent_id, full_name: `${booking.parent_first_name} ${booking.parent_last_name}` },
      orgId: profile.organization_id,
      bookingId: booking.id,
      contextName: booking.service?.name
    });
    setActiveTab('messages');
  };

  const renderBookings = () => {
    if (profile?.organization_id) {
      return (
        <BookingManagement 
          organizationId={profile.organization_id} 
          userId={profile?.id || user?.id} 
          userRole="team_member"
          onChat={handleStartChat} // Fixed: Allow technicians to chat with parents
        />
      );
    }
    return (
      <div className="text-center py-12 text-gray-500">
        <SafeIcon icon={FiAlertCircle} className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Organization Access</h3>
        <p>You need to be associated with an organization to manage bookings.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>
        <nav className="mt-6 px-3 flex-1 space-y-1">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }} 
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <SafeIcon icon={tab.icon} className="text-lg" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
          <Link to="/home" className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50">
            <SafeIcon icon={FiGlobe} className="text-lg" />
            <span className="font-medium">Public Homepage</span>
          </Link>
        </nav>
        <div className="border-t border-gray-200 p-4">
          <button onClick={signOut} className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
            <SafeIcon icon={FiLogOut} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 lg:ml-0 overflow-y-auto h-screen">
        <header className="bg-white shadow-sm border-b h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8">
           <div className="flex items-center">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 sm:mr-4"><SafeIcon icon={FiMenu} className="text-xl" /></button>
             <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{tabs.find(t => t.id === activeTab)?.label}</h1>
           </div>
           <NotificationBell />
        </header>

        <div className="p-3 sm:p-6 lg:p-8">
          {activeTab === 'profile' && (
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
               <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Profile Settings</h3>
               <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
               </div>
               <button onClick={() => updateProfile({full_name: profileData.fullName, phone: profileData.phone})} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg">Save Profile</button>
            </div>
          )}
          {activeTab === 'schedule' && (
             <div className="space-y-3 sm:space-y-4">
               {assignedBookings.map(b => (
                 <div key={b.id} className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-navy text-sm sm:text-base">{b.service?.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-500">{format(new Date(b.booking_date), 'PPP p')}</p>
                    </div>
                    <button onClick={() => handleStartChat(b)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors self-end sm:self-auto"><SafeIcon icon={FiMessageSquare} /></button>
                 </div>
               ))}
             </div>
          )}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'equipment' && <EquipmentManagement organizationId={profile.organization_id} userRole="team_member" />}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              {selectedChat ? (
                <ChatWindow 
                  currentUser={user} 
                  recipient={selectedChat.otherUser} 
                  orgId={profile.organization_id} 
                  context={{ bookingId: selectedChat.bookingId, name: selectedChat.contextName }} 
                  onClose={() => setSelectedChat(null)} 
                />
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center text-gray-400">
                  <SafeIcon icon={FiMessageSquare} className="text-5xl mb-4 opacity-20" />
                  <p>Select a booking to start chatting with the parent</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <TaskManagement 
              organizationId={profile.organization_id} 
              userId={user?.id} 
              userRole="team_member" 
            />
          )}
          
          {activeTab === 'training' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Training Resources</h3>
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="border border-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <SafeIcon icon={FiBookOpen} className="text-blue-600 text-lg sm:text-xl" />
                    </div>
                    <h4 className="font-bold text-navy mb-2 text-sm sm:text-base">Car Seat Safety Certification</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Complete the CPST certification course to become a certified car seat technician.</p>
                    <a href="https://cert.safekids.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs sm:text-sm font-medium hover:underline">Start Course →</a>
                  </div>
                  <div className="border border-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <SafeIcon icon={FiTool} className="text-green-600 text-lg sm:text-xl" />
                    </div>
                    <h4 className="font-bold text-navy mb-2 text-sm sm:text-base">Installation Best Practices</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Learn the proper techniques for installing various car seat types.</p>
                    <button className="text-blue-600 text-xs sm:text-sm font-medium hover:underline">View Guide →</button>
                  </div>
                  <div className="border border-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <SafeIcon icon={FiUser} className="text-purple-600 text-lg sm:text-xl" />
                    </div>
                    <h4 className="font-bold text-navy mb-2 text-sm sm:text-base">Customer Communication</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Tips for effectively communicating with parents about car seat safety.</p>
                    <button className="text-blue-600 text-xs sm:text-sm font-medium hover:underline">Read More →</button>
                  </div>
                  <div className="border border-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <SafeIcon icon={FiAlertCircle} className="text-orange-600 text-lg sm:text-xl" />
                    </div>
                    <h4 className="font-bold text-navy mb-2 text-sm sm:text-base">Safety Recalls & Updates</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Stay updated on the latest car seat recalls and safety bulletins.</p>
                    <a href="https://www.nhtsa.gov/recalls" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs sm:text-sm font-medium hover:underline">Check Recalls →</a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMemberDashboard;