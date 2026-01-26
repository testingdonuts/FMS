import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { serviceManagementService } from '../../services/serviceManagementService';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useBooking } from '../../context/BookingContext';
import ServiceBookingForm from '../bookings/ServiceBookingForm';

const {
  FiSearch, FiFilter, FiClock, FiDollarSign, FiCalendar, FiMapPin,
  FiTool, FiBookOpen, FiUsers, FiVideo, FiTruck,
} = FiIcons;

const ServiceBrowse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    location: searchParams.get('loc') || '',
    serviceType: '',
    maxPrice: '',
    sortBy: 'name',
  });

  const [serviceToBook, setServiceToBook] = useState(null);
  const { user } = useAuth();
  const { bookingIntent, setBookingIntent, openAuthModal } = useBooking();

  const serviceTypes = [
    { value: 'installation', label: 'Installation' },
    { value: 'inspection', label: 'Safety Check' },
    { value: 'education', label: 'Education' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'virtual_consultation', label: 'Virtual Consultation' },
    { value: 'mobile_installation', label: 'Mobile Service' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'duration', label: 'Duration' },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterAndSortServices();
  }, [services, filters]);

  const loadServices = async () => {
    setLoading(true);
    const { data, error } = await serviceManagementService.getActiveServices();
    if (data) {
      setServices(data);
    } else if (error) {
      console.error('Error loading services:', error);
    }
    setLoading(false);
  };

  const filterAndSortServices = () => {
    let filtered = [...services];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm) ||
          service.description.toLowerCase().includes(searchTerm) ||
          service.organization?.name.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          (service.organization?.address || '').toLowerCase().includes(loc) ||
          (service.organization?.zipcode || '').toLowerCase().includes(loc)
      );
    }

    if (filters.serviceType) {
      filtered = filtered.filter((service) => service.service_type === filters.serviceType);
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((service) => service.price <= parseFloat(filters.maxPrice));
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'price_low': return a.price - b.price;
        case 'price_high': return b.price - a.price;
        case 'duration': return a.duration_minutes - b.duration_minutes;
        default: return 0;
      }
    });

    setFilteredServices(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleBookService = (service) => {
    if (user) {
      setServiceToBook(service);
    } else {
      setBookingIntent({ type: 'service', item: service });
      openAuthModal();
    }
  };

  const getServiceTypeIcon = (type) => {
    switch (type) {
      case 'installation': return FiTool;
      case 'inspection': return FiSearch;
      case 'education': return FiBookOpen;
      case 'workshop': return FiUsers;
      case 'virtual_consultation': return FiVideo;
      case 'mobile_installation': return FiTruck;
      default: return FiClock;
    }
  };

  const formatServiceType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Car Seat Safety Services</h1>
          <p className="text-lg text-gray-600">Find professionals for car seat installation, safety checks, and education</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-1">
              <div className="relative">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="relative">
                <SafeIcon icon={FiMapPin} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Location..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <select
                value={filters.serviceType}
                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Service Types</option>
                {serviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="relative">
                <SafeIcon icon={FiDollarSign} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  placeholder="Max price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <SafeIcon icon={FiClock} className="mr-2" />
                        <span>{service.duration_minutes} minutes</span>
                      </div>
                      <div className="flex items-center text-green-600 font-semibold">
                        <SafeIcon icon={FiDollarSign} className="mr-1" />
                        <span>${service.price}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <SafeIcon icon={FiMapPin} className="mr-2" />
                      <span className="truncate">{service.organization?.name} • {service.organization?.address}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <SafeIcon icon={getServiceTypeIcon(service.service_type)} className="mr-1.5" />
                      {formatServiceType(service.service_type)}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBookService(service)}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <SafeIcon icon={FiCalendar} />
                    <span>Book Service</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <SafeIcon icon={FiCalendar} className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No services found</h3>
            <p className="text-gray-500">Try adjusting your filters or location.</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {serviceToBook && (
          <ServiceBookingForm
            initialService={serviceToBook}
            organizationId={serviceToBook.organization_id}
            userId={user?.id}
            onClose={() => setServiceToBook(null)}
            onSuccess={() => setServiceToBook(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceBrowse;