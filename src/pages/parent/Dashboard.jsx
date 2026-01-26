import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import * as FiIcons from 'react-icons/fi';
    import SafeIcon from '../../components/common/SafeIcon';
    import { bookingService } from '../../services/bookingService';
    import { equipmentService } from '../../services/equipmentService';
    import toast from 'react-hot-toast';
    import { useAuth } from '../../hooks/useAuth.jsx';
    import supabase from '../../supabase/supabase';

    const { FiCalendar, FiBox, FiClock, FiCheckCircle, FiChevronRight, FiAlertCircle } = FiIcons;

    export default function ParentDashboard() {
      const [bookings, setBookings] = useState([]);
      const [rentals, setRentals] = useState([]);
      const [loading, setLoading] = useState(true);
      const { user } = useAuth();

      useEffect(() => {
        fetchDashboardData();
      }, [user]);

      async function fetchDashboardData() {
        try {
          setLoading(true);
          if (!user?.id) {
            setBookings([]);
            setRentals([]);
            return;
          }
          const [bookingsData, rentalsData] = await Promise.all([
            bookingService.getParentBookings(user?.id),
            supabase.rpc('get_parent_rentals', { p_parent_id: user?.id })
          ]);
          if (bookingsData?.error) throw bookingsData.error;
          if (rentalsData?.error) throw rentalsData.error;
          setBookings(bookingsData.data || []);
          setRentals(rentalsData.data || []);
        } catch (error) {
          console.error('Dashboard load error:', error);
          toast.error('Failed to load dashboard data');
        } finally {
          setLoading(false);
        }
      }

      if (loading) {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        );
      }

      return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Dashboard</h1>
              <p className="text-gray-500 mt-1 text-lg">Manage your upcoming services and equipment.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Service Bookings Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <SafeIcon icon={FiCalendar} className="text-indigo-600" />
                  Service Bookings
                </h2>
                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {bookings.length} Total
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {bookings.length > 0 ? bookings.map(booking => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={booking.id} 
                    className="p-5 hover:bg-gray-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                          <SafeIcon icon={FiCalendar} className="text-xl" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{booking.service?.name}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <SafeIcon icon={FiCalendar} className="text-gray-400" />
                              {new Date(booking.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <SafeIcon icon={FiClock} className="text-gray-400" />
                              {new Date(booking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-16 text-center">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SafeIcon icon={FiCalendar} className="text-3xl text-gray-300" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg">No bookings yet</p>
                    <p className="text-gray-500 text-sm mt-1">Services you book will appear here.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Equipment Rentals Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <SafeIcon icon={FiBox} className="text-indigo-600" />
                  Equipment Rentals
                </h2>
                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {rentals.length} Total
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {rentals.length > 0 ? rentals.map(rental => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={rental.id} 
                    className="p-5 hover:bg-gray-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                          <SafeIcon icon={FiBox} className="text-xl" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{rental.equipment?.name}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <SafeIcon icon={FiCalendar} className="text-gray-400" />
                              {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={rental.status} />
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-16 text-center">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SafeIcon icon={FiBox} className="text-3xl text-gray-300" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg">No rentals yet</p>
                    <p className="text-gray-500 text-sm mt-1">Items you rent will appear here.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      );
    }

    function StatusBadge({ status }) {
      const styles = {
        confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        completed: 'bg-blue-100 text-blue-700 border-blue-200',
        cancelled: 'bg-rose-100 text-rose-700 border-rose-200'
      };

      return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
          {status}
        </span>
      );
    }