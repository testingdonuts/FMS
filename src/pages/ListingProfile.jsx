import React, { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import * as FiIcons from 'react-icons/fi';
    import { motion, AnimatePresence } from 'framer-motion';
    import supabase from '../supabase/supabase';
    import SafeIcon from '../components/common/SafeIcon';
    import ServiceBookingModal from '../components/bookings/ServiceBookingModal';
    import EquipmentRentalModal from '../components/rentals/EquipmentRentalModal';
    import toast from 'react-hot-toast';

    const { 
      FiMapPin, FiPhone, FiMail, FiGlobe, FiClock, 
      FiCheckCircle, FiStar, FiShare2, FiHeart,
      FiTool, FiBox, FiChevronRight, FiInfo
    } = FiIcons;

    export default function ListingProfile() {
      const { id } = useParams();
      const navigate = useNavigate();
      const [listing, setListing] = useState(null);
      const [services, setServices] = useState([]);
      const [equipment, setEquipment] = useState([]);
      const [loading, setLoading] = useState(true);
      const [activeTab, setActiveTab] = useState('services');
      const [selectedService, setSelectedService] = useState(null);
      const [selectedEquipment, setSelectedEquipment] = useState(null);
      const [isBookingOpen, setIsBookingOpen] = useState(false);
      const [isRentalOpen, setIsRentalOpen] = useState(false);

      useEffect(() => {
        fetchListingData();
      }, [id]);

      async function fetchListingData() {
        try {
          setLoading(true);
          
          // Fetch listing details
          const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select('*, organizations(*)')
            .eq('id', id)
            .single();

          if (listingError) throw listingError;
          setListing(listingData);

          const orgId = listingData.organization_id;

          // Fetch services
          const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('organization_id', orgId)
            .eq('is_active', true);
          
          setServices(servicesData || []);

          // Fetch equipment
          const { data: equipmentData } = await supabase
            .from('equipment')
            .select('*')
            .eq('organization_id', orgId)
            .eq('availability_status', true);
          
          setEquipment(equipmentData || []);

        } catch (error) {
          console.error('Error fetching listing:', error);
          toast.error('Failed to load listing details');
        } finally {
          setLoading(false);
        }
      }

      const handleBookService = (service) => {
        const checkAuth = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error('Please log in to book a service');
            navigate('/login');
            return;
          }
          setSelectedService(service);
          setIsBookingOpen(true);
        };
        checkAuth();
      };

      const handleRentEquipment = (item) => {
        const checkAuth = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error('Please log in to rent equipment');
            navigate('/login');
            return;
          }
          setSelectedEquipment(item);
          setIsRentalOpen(true);
        };
        checkAuth();
      };

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        );
      }

      if (!listing) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <SafeIcon icon={FiInfo} className="text-6xl text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Listing Not Found</h1>
            <p className="text-gray-600 mt-2">The listing you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/directory')}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Back to Directory
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 pb-12">
          {/* Hero Section */}
          <div className="relative h-64 md:h-96 bg-gray-900">
            {listing.gallery_urls?.[0] ? (
              <img 
                src={listing.gallery_urls[0]} 
                alt={listing.name}
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-40" />
            )}
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 md:h-32 md:w-32 bg-white rounded-2xl shadow-xl p-2 flex-shrink-0">
                      <img 
                        src={listing.logo_url || "https://images.unsplash.com/photo-1594498259353-60a39083163a?w=128&h=128&fit=crop"} 
                        alt={listing.name}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-md">
                        {listing.name}
                      </h1>
                      <div className="flex items-center gap-4 mt-2 text-indigo-100">
                        <span className="flex items-center gap-1">
                          <SafeIcon icon={FiStar} className="text-yellow-400 fill-current" />
                          <span className="font-bold text-white">4.9</span> (120+ reviews)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <SafeIcon icon={FiMapPin} />
                          {listing.address || 'Location on request'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition border border-white/20">
                      <SafeIcon icon={FiHeart} className="text-xl" />
                    </button>
                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition border border-white/20">
                      <SafeIcon icon={FiShare2} className="text-xl" />
                    </button>
                    <button 
                      onClick={() => handleBookService(services[0])}
                      disabled={services.length === 0}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {listing.full_description || listing.short_description}
                  </p>
                  
                  {listing.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {listing.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* Services & Equipment Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex border-b border-gray-100">
                    <button 
                      onClick={() => setActiveTab('services')}
                      className={`flex-1 py-4 text-center font-bold transition ${activeTab === 'services' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <SafeIcon icon={FiTool} />
                        Services ({services.length})
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('equipment')}
                      className={`flex-1 py-4 text-center font-bold transition ${activeTab === 'equipment' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <SafeIcon icon={FiBox} />
                        Equipment ({equipment.length})
                      </div>
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === 'services' ? (
                      <div className="grid grid-cols-1 gap-4">
                        {services.length > 0 ? services.map(service => (
                          <div key={service.id} className="group p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex gap-4">
                              <div className="h-16 w-16 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                                <SafeIcon icon={FiTool} className="text-2xl" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{service.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-1">{service.description}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-indigo-600 font-bold">${service.price}</span>
                                  <span className="text-gray-400 text-sm flex items-center gap-1">
                                    <SafeIcon icon={FiClock} /> {service.duration_minutes}m
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleBookService(service)}
                              className="px-6 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition whitespace-nowrap"
                            >
                              Book Now
                            </button>
                          </div>
                        )) : (
                          <div className="text-center py-12 text-gray-500">
                            No services listed yet.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {equipment.length > 0 ? equipment.map(item => (
                          <div key={item.id} className="group p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                            <div className="aspect-square rounded-lg bg-gray-100 mb-4 overflow-hidden relative">
                              {item.image_urls?.[0] ? (
                                <img src={item.image_urls[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <SafeIcon icon={FiBox} className="text-4xl" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur rounded text-xs font-bold text-indigo-600">
                                {item.category}
                              </div>
                            </div>
                            <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <span className="text-indigo-600 font-bold">${item.rental_price_per_day}</span>
                                <span className="text-gray-500 text-sm">/day</span>
                              </div>
                              <button 
                                onClick={() => handleRentEquipment(item)}
                                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
                              >
                                Rent
                              </button>
                            </div>
                          </div>
                        )) : (
                          <div className="col-span-2 text-center py-12 text-gray-500">
                            No equipment available for rent.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Contact Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <SafeIcon icon={FiGlobe} className="text-indigo-600" />
                    Contact Info
                  </h3>
                  <div className="space-y-4">
                    {listing.address && (
                      <div className="flex gap-4">
                        <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                          <SafeIcon icon={FiMapPin} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Address</p>
                          <p className="text-sm text-gray-600">{listing.address}</p>
                        </div>
                      </div>
                    )}
                    {listing.phone && (
                      <div className="flex gap-4">
                        <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                          <SafeIcon icon={FiPhone} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Phone</p>
                          <p className="text-sm text-gray-600">{listing.phone}</p>
                        </div>
                      </div>
                    )}
                    {listing.email && (
                      <div className="flex gap-4">
                        <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                          <SafeIcon icon={FiMail} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{listing.email}</p>
                        </div>
                      </div>
                    )}
                    {listing.website && (
                      <div className="flex gap-4">
                        <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                          <SafeIcon icon={FiGlobe} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Website</p>
                          <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                            Visit Site
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Opening Hours */}
                {listing.opening_hours && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <SafeIcon icon={FiClock} className="text-indigo-600" />
                      Opening Hours
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(listing.opening_hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between items-center text-sm">
                          <span className="capitalize text-gray-500">{day}</span>
                          <span className={`font-medium ${hours.closed ? 'text-red-500' : 'text-gray-900'}`}>
                            {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modals */}
          <AnimatePresence>
            {isBookingOpen && selectedService && (
              <ServiceBookingModal
                service={selectedService}
                onClose={() => setIsBookingOpen(false)}
                onSuccess={() => {
                  setIsBookingOpen(false);
                  toast.success('Service booked successfully!');
                }}
              />
            )}

            {isRentalOpen && selectedEquipment && (
              <EquipmentRentalModal
                equipment={selectedEquipment}
                onClose={() => setIsRentalOpen(false)}
                onSuccess={() => {
                  setIsRentalOpen(false);
                  toast.success('Rental request submitted!');
                }}
              />
            )}
          </AnimatePresence>
        </div>
      );
    }