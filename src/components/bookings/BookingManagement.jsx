import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { bookingService } from '../../services/bookingService';
import { serviceManagementService } from '../../services/serviceManagementService';
import { exportToCSV } from '../../utils/exportUtils';
import ServiceBookingForm from './ServiceBookingForm';
import BookingCard from './BookingCard';
import BookingFilterBar from './BookingFilterBar';
import CalendarView from '../calendar/CalendarView';
import supabase from '../../supabase/supabase';

const { FiPlus, FiCalendar, FiList, FiBarChart, FiDownload, FiAlertCircle } = FiIcons;

const BookingManagement = ({ organizationId, userId, userRole, onChat }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('bookings');
  const [viewMode, setViewMode] = useState('list');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null); // Added state for error handling
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    serviceId: 'all',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (userRole === 'parent' && userId) {
      loadData();
    } else if (organizationId) {
      loadData();
      loadServices();
    }
  }, [organizationId, userId, userRole]);

  // Apply deep link for specific booking (?bookingId=...)
  useEffect(() => {
    const deepId = searchParams.get('bookingId');
    if (deepId) {
      setFilters(prev => ({ ...prev, search: deepId }));
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    
    // Ensure we don't make a request with undefined parameters
    if (!userId && !organizationId) {
      setLoading(false);
      return;
    }

    try {
      let data;
      if (userRole === 'parent' && userId) {
        data = await bookingService.getParentBookings(userId);
      } else if (organizationId) {
        data = await supabase.rpc('get_organization_bookings', { p_org_id: organizationId });
      }
      
      if (data?.data) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setFetchError(error.message || 'Failed to load bookings');
    }
    setLoading(false);
  };

  const loadServices = async () => {
    const { data } = await serviceManagementService.getOrganizationServices(organizationId);
    if (data) setServices(data);
  };

  const applyFilters = () => {
    let result = [...bookings];

    if (filters.status !== 'all') result = result.filter(b => b.status === filters.status);
    if (filters.serviceId !== 'all') result = result.filter(b => b.service_id === filters.serviceId);
    if (filters.dateFrom) result = result.filter(b => new Date(b.booking_date) >= new Date(filters.dateFrom));
    if (filters.dateTo) result = result.filter(b => new Date(b.booking_date) <= new Date(filters.dateTo));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(b =>
        (b.parent_first_name?.toLowerCase().includes(q)) ||
        (b.parent_last_name?.toLowerCase().includes(q)) ||
        (b.service?.name?.toLowerCase().includes(q)) ||
        (b.id?.toLowerCase().includes(q))
      );
    }

    setFilteredBookings(result);
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const handleExport = () => {
    const exportData = filteredBookings.map(b => ({
      ID: b.id,
      Date: b.booking_date,
      Service: b.service?.name,
      Customer: `${b.parent_first_name} ${b.parent_last_name}`,
      Status: b.status,
      Price: b.total_price,
      Payment: b.payment_status
    }));
    exportToCSV(exportData, `bookings-export-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-navy">Service Bookings</h3>
          <p className="text-gray-500 text-sm">Manage appointments and view schedule</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="bg-gray-100 p-1 rounded-lg flex items-center">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500'}`}>
              <SafeIcon icon={FiList} />
            </button>
            <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500'}`}>
              <SafeIcon icon={FiCalendar} />
            </button>
          </div>
          <button onClick={handleExport} className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
            <SafeIcon icon={FiDownload} />
          </button>
          {userRole === 'parent' && (
            <button onClick={() => { setEditingBooking(null); setShowServiceForm(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2">
              <SafeIcon icon={FiPlus} />
              <span>Book</span>
            </button>
          )}
        </div>
      </div>

      <BookingFilterBar filters={filters} onFilterChange={handleFilterChange} services={services} />

      {fetchError && (
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center space-x-2 mb-4">
          <SafeIcon icon={FiAlertCircle} />
          <span>Error loading bookings: {fetchError}</span>
          <button onClick={loadData} className="ml-auto text-sm font-bold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading bookings...</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView bookings={filteredBookings} onBookingClick={(b) => { setEditingBooking(b); setShowServiceForm(true); }} />
      ) : (
        <div className="grid gap-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                userRole={userRole}
                onEdit={setEditingBooking}
                onUpdate={loadData}
                onChat={onChat} 
              />
            ))
          ) : (
            !fetchError && (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <SafeIcon icon={FiCalendar} className="text-5xl text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No bookings match your criteria</p>
              </div>
            )
          )}
        </div>
      )}

      <AnimatePresence>
        {showServiceForm || editingBooking ? (
          <ServiceBookingForm
            onClose={() => { setShowServiceForm(false); setEditingBooking(null); }}
            onSuccess={() => { setShowServiceForm(false); setEditingBooking(null); loadData(); }}
            organizationId={organizationId}
            userId={userId}
            userRole={userRole}
            bookingToEdit={editingBooking}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default BookingManagement;