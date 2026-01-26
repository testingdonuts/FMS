import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import * as FiIcons from 'react-icons/fi';
    import SafeIcon from '../../components/common/SafeIcon';
    import NotificationBell from '../../components/notifications/NotificationBell';
    import supabase from '../../supabase/supabase';
    import { bookingService } from '../../services/bookingService';
    import { equipmentService } from '../../services/equipmentService';
    import toast from 'react-hot-toast';

    const { FiTrendingUp, FiCalendar, FiBox, FiUsers, FiDollarSign, FiClock, FiActivity } = FiIcons;

    export default function OrgDashboard() {
      const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        activeRentals: 0,
        revenue: 0
      });
      const [recentBookings, setRecentBookings] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        fetchDashboardData();
      }, []);

      async function fetchDashboardData() {
        try {
          setLoading(true);
          const { data: { user } } = await supabase.auth.getUser();
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

          if (!profile?.organization_id) return;

          const [bookingsRes, rentalsRes] = await Promise.all([
            bookingService.getOrganizationBookings(profile.organization_id),
            equipmentService.getOrganizationRentals(profile.organization_id)
          ]);
          if (bookingsRes?.error) throw bookingsRes.error;
          if (rentalsRes?.error) throw rentalsRes.error;

          const bookings = bookingsRes?.data || [];
          const rentals = rentalsRes?.data || [];

          setRecentBookings(bookings.slice(0, 8));
          
          const revenue = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + Number(b.total_price || 0), 0) +
            rentals
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + Number(r.total_price || 0), 0);

          setStats({
            totalBookings: bookings.length,
            pendingBookings: bookings.filter(b => b.status === 'pending').length,
            activeRentals: rentals.filter(r => r.status === 'active' || r.status === 'pending').length,
            revenue
          });

        } catch (error) {
          console.error('Org dashboard error:', error);
          toast.error('Failed to load dashboard statistics');
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
        <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Organization Overview</h1>
              <p className="text-gray-500 mt-1 text-lg">Real-time performance metrics and activity.</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Live Activity
              </span>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Bookings" value={stats.totalBookings} icon={FiCalendar} color="indigo" />
            <StatCard label="Pending" value={stats.pendingBookings} icon={FiClock} color="yellow" />
            <StatCard label="Active Rentals" value={stats.activeRentals} icon={FiBox} color="blue" />
            <StatCard label="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={FiDollarSign} color="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Bookings List */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <SafeIcon icon={FiActivity} className="text-indigo-600" />
                  Recent Activity
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {recentBookings.length > 0 ? recentBookings.map(booking => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={booking.id} 
                    className="p-5 flex items-center justify-between hover:bg-gray-50 transition group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {booking.parent_first_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">
                          {booking.parent_first_name} {booking.parent_last_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{booking.service?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(booking.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        booking.status === 'confirmed' ? 'text-emerald-600' : 
                        booking.status === 'pending' ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-20 text-center text-gray-400">
                    <SafeIcon icon={FiCalendar} className="text-4xl mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No recent activity</p>
                    <p className="text-sm">New bookings will appear here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="space-y-6">
              <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Grow Your Business</h3>
                  <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                    Check your analytics to see which services are performing best this month.
                  </p>
                  <button className="w-full py-3.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition shadow-lg">
                    View Full Reports
                  </button>
                </div>
                <SafeIcon icon={FiTrendingUp} className="absolute -bottom-4 -right-4 text-9xl text-white/10 rotate-12" />
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiUsers} className="text-indigo-600" />
                  Team Pulse
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Active Technicians</span>
                    <span className="font-bold text-gray-900">4</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Service Coverage</span>
                    <span className="font-bold text-gray-900">98%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    function StatCard({ label, value, icon: Icon, color }) {
      const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        yellow: 'bg-amber-50 text-amber-600 border-amber-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100'
      };

      return (
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-all"
        >
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
            <SafeIcon icon={Icon} className="text-2xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-black text-gray-900 mt-0.5">{value}</p>
          </div>
        </motion.div>
      );
    }