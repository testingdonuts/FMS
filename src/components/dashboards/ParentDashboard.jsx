import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import BookingManagement from '../bookings/BookingManagement';
import RentalCard from '../bookings/RentalCard';
import EquipmentRentalForm from '../bookings/EquipmentRentalForm';
import PaymentModal from '../payments/PaymentModal';
import { bookingService } from '../../services/bookingService';
import { chatService } from '../../services/chatService';
import { serviceManagementService } from '../../services/serviceManagementService';
import ChatWindow from '../chat/ChatWindow';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

const { FiCalendar, FiPackage, FiCreditCard, FiUser, FiMenu, FiX, FiLogOut, FiHome, FiGlobe, FiMessageSquare, FiSettings, FiCheckCircle, FiClock, FiChevronRight, FiAlertCircle } = FiIcons;

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user, profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rental & Payment State
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentItem, setPaymentItem] = useState(null);

  const tabs = [
    { id: 'home', label: 'Overview', icon: FiHome },
    { id: 'bookings', label: 'My Bookings', icon: FiCalendar },
    { id: 'rentals', label: 'Equipment Rentals', icon: FiPackage },
    { id: 'messages', label: 'Messages', icon: FiMessageSquare },
    { id: 'payments', label: 'Payments', icon: FiCreditCard },
    { id: 'profile', label: 'Account Settings', icon: FiSettings }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [profile, user, activeTab]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages_1762600000000',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        // Always reload conversations on new message to update snippets
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadConversations = async () => {
    if (!user?.id) return;
    const { data } = await chatService.getConversations(user.id);
    if (data) setConversations(data);
  };

  const loadDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (activeTab === 'messages') {
        await loadConversations();
      } else {
        const [bookingsRes, rentalsRes] = await Promise.all([
          bookingService.getServiceBookings({ parentId: user.id }),
          bookingService.getEquipmentRentals({ renterId: user.id })
        ]);
        setBookings(bookingsRes.data || []);
        setRentals(rentalsRes.data || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (booking) => {
    const { data: org } = await serviceManagementService.getOrganizationById(booking.org_id);
    if (org) {
      setSelectedChat({
        otherUser: { id: org.owner_id, full_name: org.name },
        orgId: org.id,
        bookingId: booking.id,
        contextName: booking.service?.name
      });
      setActiveTab('messages');
    }
  };

  const handleEditRental = (rental) => {
    setEditingRental(rental);
    setShowRentalForm(true);
  };

  const handleUpdateRental = async (rentalId, updates) => {
    await bookingService.updateEquipmentRental(rentalId, updates);
    loadDashboardData();
  };

  const handlePayRental = (rental) => {
    setPaymentItem({ ...rental, type: 'rental' });
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (id, type) => {
    await bookingService.processPayment(id, type === 'equipment' ? 'rental' : 'booking');
    loadDashboardData();
    setShowPaymentModal(false);
    setPaymentItem(null);
  };

  const renderMessages = () => (
    <div className="grid lg:grid-cols-3 gap-6 h-[650px] text-left">
      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-navy flex items-center">
            <SafeIcon icon={FiMessageSquare} className="mr-2 text-blue-600" />
            Inbox
          </h3>
          <button onClick={loadConversations} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <SafeIcon icon={FiIcons.FiRefreshCw} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv, idx) => (
            <button
              key={`${conv.otherUser.id}-${conv.bookingId}-${idx}`}
              onClick={() => setSelectedChat(conv)}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${
                selectedChat?.otherUser?.id === conv.otherUser.id && 
                selectedChat?.bookingId === conv.bookingId 
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
            context={{ bookingId: selectedChat.bookingId, name: selectedChat.contextName }}
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
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none border-r border-gray-100`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
          <Link to="/home" className="flex items-center space-x-2">
            <div className="bg-navy p-2 rounded-lg"><SafeIcon icon={FiGlobe} className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-black text-navy tracking-tight">FitMySeat</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-navy transition-colors"><SafeIcon icon={FiX} className="text-2xl" /></button>
        </div>
        <nav className="mt-8 px-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-navy font-medium'}`}
            >
              <SafeIcon icon={tab.icon} className="text-lg" />
              <span className="text-sm">{tab.label}</span>
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
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-20 flex items-center justify-between px-8 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><SafeIcon icon={FiMenu} className="text-2xl" /></button>
          <h1 className="text-xl font-black text-navy">{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><SafeIcon icon={FiUser} className="text-xl" /></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === 'home' && (
                <div className="space-y-6 text-left">
                  <div className="bg-gradient-to-br from-navy to-blue-900 rounded-2xl p-8 text-white shadow-xl">
                    <h2 className="text-3xl font-bold mb-2">Hello, {profile?.full_name || 'Parent'}!</h2>
                    <p className="text-blue-200 text-lg">Manage your child's safety services in one secure place.</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <span className="text-gray-500 text-sm font-bold uppercase">Active Bookings</span>
                      <p className="text-3xl font-black text-navy">{bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <span className="text-gray-500 text-sm font-bold uppercase">Active Rentals</span>
                      <p className="text-3xl font-black text-blue-600">{rentals.filter(r => ['pending', 'active'].includes(r.status)).length}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <BookingManagement userId={user?.id} userRole="parent" onChat={handleStartChat} />
              )}

              {activeTab === 'rentals' && (
                <div className="space-y-6">
                  {rentals.length > 0 ? (
                    <div className="grid gap-4">
                      {rentals.map(rental => (
                        <RentalCard
                          key={rental.id}
                          rental={rental}
                          userRole="parent"
                          onEdit={handleEditRental}
                          onUpdate={handleUpdateRental}
                          onPay={handlePayRental}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <SafeIcon icon={FiPackage} className="text-6xl text-gray-200 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-navy mb-2">No Active Rentals</h3>
                      <p className="text-gray-500 mb-6">You haven't rented any equipment yet.</p>
                      <Link to="/equipment" className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">
                        Browse Equipment
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'messages' && renderMessages()}

              {activeTab === 'payments' && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <SafeIcon icon={FiCreditCard} className="text-6xl text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-navy">Payment History</h3>
                  <p className="text-gray-500">Your transaction history will appear here.</p>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 max-w-2xl">
                  <h3 className="text-2xl font-bold text-navy mb-6">Account Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                      <input type="text" value={profile?.full_name || ''} readOnly className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                      <input type="email" value={profile?.email || user?.email || ''} readOnly className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500" />
                    </div>
                    <div className="pt-4">
                      <button onClick={signOut} className="text-red-500 font-bold hover:underline">
                        Sign Out of Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showRentalForm && (
          <EquipmentRentalForm
            rentalToEdit={editingRental}
            onClose={() => { setShowRentalForm(false); setEditingRental(null); }}
            onSuccess={() => { setShowRentalForm(false); setEditingRental(null); loadDashboardData(); }}
            userId={user.id}
          />
        )}
        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            item={paymentItem}
            type="equipment"
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParentDashboard;