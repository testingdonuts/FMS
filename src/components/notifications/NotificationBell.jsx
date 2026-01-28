import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { notificationService } from '../../services/notificationService';
import { format } from 'date-fns';

const { FiBell, FiX, FiInfo, FiCheckCircle, FiAlertTriangle } = FiIcons;

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data } = await notificationService.getMyNotifications();
    if (data) setNotifications(data);
  };

  const handleMarkRead = async (id) => {
    await notificationService.markAsRead(id);
    loadNotifications();
  };

  const getIcon = (type) => {
    if (type.includes('confirmed') || type.includes('completed')) return FiCheckCircle;
    if (type.includes('rejected') || type.includes('cancelled')) return FiAlertTriangle;
    return FiInfo;
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600 hover:text-navy relative transition-colors">
        <SafeIcon icon={FiBell} className="text-lg sm:text-xl" />
        {unreadCount > 0 && <span className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto mt-2 sm:w-80 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[80vh] sm:max-h-none" >
              <div className="p-3 sm:p-4 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-navy text-sm sm:text-base">Notifications</h3>
                <button onClick={() => setIsOpen(false)}><SafeIcon icon={FiX} className="text-gray-400" /></button>
              </div>
              <div className="max-h-72 sm:max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 sm:p-4 border-b border-gray-50 flex items-start space-x-2 sm:space-x-3 transition-colors ${!n.is_read ? 'bg-teal-50/30' : 'bg-white'}`} onClick={() => handleMarkRead(n.id)}>
                      <div className={`mt-0.5 sm:mt-1 p-1 sm:p-1.5 rounded-lg ${!n.is_read ? 'text-teal-600 bg-white' : 'text-gray-400'}`}>
                        <SafeIcon icon={getIcon(n.type)} className="text-sm sm:text-base" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs sm:text-sm font-bold truncate ${!n.is_read ? 'text-navy' : 'text-gray-600'}`}>{n.title}</p>
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1 font-medium">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 sm:p-8 text-center text-gray-400 text-xs sm:text-sm">No notifications yet</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;