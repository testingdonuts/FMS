import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiMapPin } = FiIcons;

const Hero = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Initialize Google Places Autocomplete
    if (typeof window !== 'undefined' && window.google && locationInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['(regions)'], // Cities, postcodes, regions
        fields: ['formatted_address', 'geometry', 'address_components']
      });
      
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
          setLocation(place.formatted_address || place.name);
          setCoordinates({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
        }
      });
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.append('loc', location);
    if (coordinates) {
      params.append('lat', coordinates.lat);
      params.append('lng', coordinates.lng);
    }
    params.append('radius', '20'); // Default 20km radius
    
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <section className="relative bg-white pt-24 pb-32">
      <div className="absolute inset-0">
        <img
          src="https://lyviotqeplrrdxnfdolb.supabase.co/storage/v1/object/sign/CPSTDoc/Test1.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNDk1ZTQwYy0xOTNkLTRkMmMtOTk5NC1kMzdjMTJlNDFhNDkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJDUFNURG9jL1Rlc3QxLmpwZyIsImlhdCI6MTc2MjI1ODI0MCwiZXhwIjoyMDc3NjE4MjQwfQ.i3jfDmyQYuPIAqQZZLIpbTkfLpIQYgjkzSvVuiD2WoE"
          alt="Parent and technician installing a car seat"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-white tracking-tight"
        >
          Find a Child Passenger Safety Expert Near You
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-gray-200 max-w-3xl mx-auto"
        >
          Search by location to find certified technicians, safety services, and equipment rentals in your area.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 max-w-2xl mx-auto bg-white p-3 rounded-2xl shadow-2xl shadow-navy/10 border border-gray-100"
        >
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <SafeIcon icon={FiMapPin} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={locationInputRef}
                type="text"
                placeholder="Enter suburb, city, or postcode..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-gray-800 placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-lg shadow-blue-600/20"
            >
              <SafeIcon icon={FiSearch} />
              <span className="hidden sm:inline">Search Listings</span>
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 flex justify-center items-center space-x-4"
        >
          <Link
            to="/listings"
            className="px-8 py-3 bg-navy text-white font-semibold rounded-lg hover:bg-navy/90 transition-colors shadow-lg"
          >
            Find an Expert
          </Link>
          <Link
            to="/pricing"
            className="px-8 py-3 bg-white text-navy font-semibold rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 shadow-lg"
          >
            List Your Business
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;