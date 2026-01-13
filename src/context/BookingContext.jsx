import React, { createContext, useState, useContext } from 'react';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [bookingIntent, setBookingIntent] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMetadata, setAuthMetadata] = useState({ preferredRole: null, initialMode: 'login' });

  const openAuthModal = (options = {}) => {
    setAuthMetadata({
      preferredRole: options.role || null,
      initialMode: options.mode || 'login'
    });
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthMetadata({ preferredRole: null, initialMode: 'login' });
  };

  const value = {
    bookingIntent,
    setBookingIntent,
    isAuthModalOpen,
    authMetadata,
    openAuthModal,
    closeAuthModal,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};