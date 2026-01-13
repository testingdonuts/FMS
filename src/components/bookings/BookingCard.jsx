import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiCalendar, FiClock, FiUser, FiPhone, FiMapPin, 
  FiCar, FiCheck, FiX, FiEdit, FiCreditCard, FiMessageSquare, FiSettings
} = FiIcons;

const BookingCard = ({ booking, onUpdate, onEdit, onPay, onChat, userRole }) => {
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const renderActions = () => {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
        {/* Unified Chat Button for both roles */}
        <button 
          onClick={() => onChat(booking)} 
          className="flex-1 min-w-[120px] bg-navy text-white py-2 px-4 rounded-lg hover:bg-navy/90 transition-colors flex items-center justify-center space-x-2 text-sm font-bold"
        >
          <SafeIcon icon={FiMessageSquare} />
          <span>Message</span>
        </button>

        {/* Parent Actions */}
        {userRole === 'parent' && booking.payment_status === 'unpaid' && booking.status !== 'cancelled' && (
          <button 
            onClick={() => onPay(booking)} 
            className="flex-1 min-w-[120px] bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm font-bold"
          >
            <SafeIcon icon={FiCreditCard} />
            <span>Pay Now (${booking.total_price})</span>
          </button>
        )}

        {userRole === 'parent' && ['pending', 'confirmed'].includes(booking.status) && (
          <button 
            onClick={() => onEdit(booking)} 
            className="p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center justify-center"
            title="Edit Booking Details"
          >
            <SafeIcon icon={FiEdit} />
          </button>
        )}

        {/* Organization & Team Actions - NEW: Added Manage Button */}
        {(userRole === 'organization' || userRole === 'team_member') && (
          <button 
            onClick={() => onEdit(booking)} 
            className="flex-1 min-w-[120px] bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm font-bold"
          >
            <SafeIcon icon={FiSettings} />
            <span>Manage</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 text-left"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black text-navy">{booking.service?.name || 'Service Booking'}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Ref: #{booking.id.slice(0, 8)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <SafeIcon icon={FiCalendar} className="mr-2 text-blue-500" />
            <span>{formatDate(booking.booking_date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <SafeIcon icon={FiClock} className="mr-2 text-blue-500" />
            <span>{formatTime(booking.booking_date)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <SafeIcon icon={FiCar} className="mr-2 text-blue-500" />
            <span>{booking.vehicle_info || 'No vehicle info'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <SafeIcon icon={FiMapPin} className="mr-2 text-blue-500" />
            <span className="truncate">{booking.service_address || 'No address provided'}</span>
          </div>
        </div>
      </div>

      {renderActions()}
    </motion.div>
  );
};

export default BookingCard;