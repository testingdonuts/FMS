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
        <SafeIcon icon={FiBell} className="text-xl" />
        {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden" >
              <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-navy">Notifications</h3>
                <button onClick={() => setIsOpen(false)}><SafeIcon icon={FiX} className="text-gray-400" /></button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 border-b border-gray-50 flex items-start space-x-3 transition-colors ${!n.is_read ? 'bg-teal-50/30' : 'bg-white'}`} onClick={() => handleMarkRead(n.id)}>
                      <div className={`mt-1 p-1.5 rounded-lg ${!n.is_read ? 'text-teal-600 bg-white' : 'text-gray-400'}`}>
                        <SafeIcon icon={getIcon(n.type)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${!n.is_read ? 'text-navy' : 'text-gray-600'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
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