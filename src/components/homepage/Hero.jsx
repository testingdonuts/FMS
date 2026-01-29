import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiMapPin, FiChevronDown, FiFilter } = FiIcons;

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'installer', label: 'Installer/Techs' },
  { value: 'retailer', label: 'Retailers' },
  { value: 'rental', label: 'Equipment Rental' },
  { value: 'training', label: 'Training Centers' },
];

const Hero = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('installer');
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
    if (category) params.append('category', category);
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
          className="mt-10 max-w-3xl mx-auto bg-white p-2 sm:p-3 rounded-2xl shadow-2xl shadow-navy/10 border border-gray-100"
        >
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* What are you looking for - Label + Dropdown */}
            <div className="flex items-center gap-3 px-4 py-3 sm:py-0 border-b sm:border-b-0 sm:border-r border-gray-200">
              <span className="text-sm text-gray-500 whitespace-nowrap hidden md:inline">What are you looking for?</span>
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none bg-transparent pr-8 py-2 text-gray-800 font-medium focus:outline-none cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <SafeIcon icon={FiChevronDown} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Location Input */}
            <div className="flex-1 relative flex items-center border-b sm:border-b-0 sm:border-r border-gray-200 px-2">
              <input
                ref={locationInputRef}
                type="text"
                placeholder="Address, city, postcode"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full py-3 px-2 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Filter Button */}
            <button
              type="button"
              className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
              title="More filters"
            >
              <SafeIcon icon={FiFilter} className="w-5 h-5" />
            </button>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <SafeIcon icon={FiSearch} className="w-5 h-5" />
              <span>Search Listing</span>
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