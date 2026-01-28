import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Hero from './homepage/Hero';
import HowItWorks from './homepage/HowItWorks';
import Testimonials from './homepage/Testimonials';
import SafeIcon from '../common/SafeIcon';
import LocationBadge from '../common/LocationBadge';
import * as FiIcons from 'react-icons/fi';
import { listingService } from '../services/listingService';
import { serviceManagementService } from '../services/serviceManagementService';
import { equipmentService } from '../services/equipmentService';
import { useAuth } from '../hooks/useAuth';
import { useBooking } from '../context/BookingContext';
import ServiceBookingForm from './bookings/ServiceBookingForm';
import EquipmentRentalModal from './equipment/EquipmentRentalModal';
import { getServiceImage } from '../utils/serviceDefaults';

const { FiStar, FiArrowRight, FiShield, FiTool, FiSearch, FiBookOpen, FiUsers, FiVideo, FiTruck, FiClock } = FiIcons;

const FeaturedBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      const { data, error } = await listingService.getPublishedListings(3);
      if (data) {
        setBusinesses(data);
      } else {
        console.error("Failed to fetch featured businesses:", error);
      }
      setLoading(false);
    };
    fetchListings();
  }, []);

  const renderSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center animate-pulse">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-3"></div>
      <div className="h-5 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
      <div className="h-5 bg-gray-200 rounded w-1/4 mx-auto"></div>
    </div>
  );

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">Trusted Safety Organisations</h2>
          <Link to="/listings" className="text-teal-600 font-semibold flex items-center space-x-1">
            <span>View All Organisations</span>
            <SafeIcon icon={FiArrowRight} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {loading ? (
            [...Array(3)].map((_, index) => <div key={index}>{renderSkeleton()}</div>)
          ) : (
            businesses.map((biz, index) => (
              <motion.div
                key={biz.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                  {biz.logo_url ? (
                    <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                  ) : (
                    <SafeIcon icon={FiShield} className="text-3xl text-teal-600" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-navy mb-1">{biz.name}</h3>
                <p className="text-gray-500 mb-3">{biz.address}</p>
                <div className="flex justify-center items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <SafeIcon key={i} icon={FiStar} className="text-soft-yellow fill-current" />
                  ))}
                </div>
                <Link to={`/listing/${biz.id}`} className="font-semibold text-teal-600 hover:text-teal-700">
                  View Profile
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const PopularServices = ({ onBookService }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data, error } = await serviceManagementService.getActiveServices();
      if (data) {
        setServices(data.slice(0, 3));
      } else {
        console.error("Failed to fetch popular services:", error);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  const getServiceIcon = (type) => {
    switch (type) {
      case 'installation': return FiTool;
      case 'inspection': return FiSearch;
      case 'education': return FiBookOpen;
      case 'workshop': return FiUsers;
      case 'virtual_consultation': return FiVideo;
      case 'mobile_installation': return FiTruck;
      default: return FiClock;
    }
  }

  const renderSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 w-full bg-gray-200"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">Book a Service</h2>
          <Link to="/services" className="text-teal-600 font-semibold flex items-center space-x-1">
            <span>Explore All Services</span>
            <SafeIcon icon={FiArrowRight} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {loading ? (
            [...Array(3)].map((_, index) => <div key={index}>{renderSkeleton()}</div>)
          ) : (
            services.map((service, index) => (
              <motion.div
                key={service.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden group flex flex-col h-full hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getServiceImage(service)}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = getServiceImage({ service_type: 'default' }); }}
                  />
                  
                  {/* Location Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <LocationBadge availability={service.availability} />
                  </div>

                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm">
                    <SafeIcon icon={getServiceIcon(service.service_type)} className="text-teal-600 text-xl" />
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold text-navy mb-2 line-clamp-1">{service.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm flex-grow">{service.description}</p>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Price</span>
                      <span className="font-bold text-navy text-lg">${service.price}</span>
                    </div>
                    <button
                      onClick={() => onBookService(service)}
                      className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg font-medium hover:bg-teal-100 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const AvailableEquipment = ({ onRentEquipment }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      const { data, error } = await equipmentService.getAvailableEquipment();
      if (data) {
        setEquipment(data.slice(0, 3));
      } else {
        console.error("Failed to fetch available equipment:", error);
      }
      setLoading(false);
    };
    fetchEquipment();
  }, []);

  const renderSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 w-full bg-gray-200"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">Rent Safety Equipment</h2>
          <Link to="/equipment" className="text-teal-600 font-semibold flex items-center space-x-1">
            <span>View All Equipment</span>
            <SafeIcon icon={FiArrowRight} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {loading ? (
            [...Array(3)].map((_, index) => <div key={index}>{renderSkeleton()}</div>)
          ) : (
            equipment.map((item, index) => (
              <motion.div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                  <img
                    src={item.image_urls?.[0] || `https://images.unsplash.com/photo-1519641763486-b33c69a5840d?fit=crop&w=400&h=300&q=80&seed=${item.id}`}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Location Badge */}
                  <div className="absolute top-4 left-4 z-10 text-xs">
                    <LocationBadge availability={item.availability} />
                  </div>

                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-xs font-semibold text-navy">
                    {item.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-navy mb-2">{item.name}</h3>
                  <p className="text-gray-500 mb-4 text-sm line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-teal-600 font-bold">${item.rental_price_per_day}<span className="text-gray-400 text-sm font-normal">/day</span></span>
                    <button
                      onClick={() => onRentEquipment(item)}
                      className="font-semibold text-navy hover:text-teal-600 transition-colors"
                    >
                      Rent Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const JoinBanner = () => (
  <section className="bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-navy rounded-2xl p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Are You a CPST Organisation?</h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8 relative z-10">
          Join FitMySeat and list your technicians, services, and equipment rentals to connect with families near you.
        </p>
        <Link
          to="/pricing"
          className="bg-teal-500 text-white font-semibold py-3 px-8 rounded-lg hover:bg-teal-600 transition-colors inline-block relative z-10"
        >
          View Pricing & Plans
        </Link>
      </div>
    </div>
  </section>
);

const Homepage = () => {
  const { user } = useAuth();
  const { bookingIntent, setBookingIntent, openAuthModal } = useBooking();
  const [serviceToBook, setServiceToBook] = useState(null);
  const [equipmentToRent, setEquipmentToRent] = useState(null);

  useEffect(() => {
    if (user && bookingIntent) {
      if (bookingIntent.type === 'service') {
        setServiceToBook(bookingIntent.item);
      } else if (bookingIntent.type === 'equipment') {
        setEquipmentToRent(bookingIntent.item);
      }
      setBookingIntent(null);
    }
  }, [user, bookingIntent, setBookingIntent]);

  const handleBookService = (service) => {
    if (user) {
      setServiceToBook(service);
    } else {
      setBookingIntent({ type: 'service', item: service });
      openAuthModal();
    }
  };

  const handleRentEquipment = (equipment) => {
    if (user) {
      setEquipmentToRent(equipment);
    } else {
      setBookingIntent({ type: 'equipment', item: equipment });
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main>
        <Hero />
        <FeaturedBusinesses />
        <PopularServices onBookService={handleBookService} />
        <AvailableEquipment onRentEquipment={handleRentEquipment} />
        <HowItWorks />
        <Testimonials />
        <JoinBanner />
      </main>
      <Footer />
      <AnimatePresence>
        {serviceToBook && (
          <ServiceBookingForm
            initialService={serviceToBook}
            organizationId={serviceToBook.organization_id}
            userId={user?.id}
            onClose={() => setServiceToBook(null)}
            onSuccess={() => { setServiceToBook(null); }}
          />
        )}
      </AnimatePresence>
      <EquipmentRentalModal
        isOpen={!!equipmentToRent}
        onClose={() => setEquipmentToRent(null)}
        equipment={equipmentToRent}
        onRentalComplete={() => { setEquipmentToRent(null); }}
        userId={user?.id}
      />
    </div>
  );
};

export default Homepage;