import React, { useState, useRef } from 'react';
import AddressAutocomplete from '../listings/AddressAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiChevronDown, FiFilter, FiX, FiClock } = FiIcons;

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'installer', label: 'Installer/Techs' },
  { value: 'retailer', label: 'Retailers' },
  { value: 'rental', label: 'Equipment Rental' },
  { value: 'training', label: 'Training Centers' },
];

const MOBILE_SERVICE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];


const RADIUS_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 200, label: '200 km' },
  { value: 0, label: 'Anywhere' },
];

const Hero = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('installer');
  const [coordinates, setCoordinates] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    zipcode: '',
    mobileService: '',
    openNow: false,
    radius: 20,
  });


  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.append('loc', location);
    if (coordinates) {
      params.append('lat', coordinates.lat);
      params.append('lng', coordinates.lng);
    }
    if (category) params.append('category', category);
    if (filters.zipcode) params.append('zipcode', filters.zipcode);
    if (filters.mobileService) params.append('mobile', filters.mobileService);
    if (filters.openNow) params.append('openNow', 'true');
    params.append('radius', filters.radius);
    navigate(`/listings?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setFilters({
      zipcode: '',
      mobileService: '',
      openNow: false,
    });
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
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
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
          className="mt-10 max-w-4xl mx-auto bg-white p-4 sm:p-5 rounded-2xl shadow-2xl shadow-navy/10 border border-gray-100"
        >
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-0">
            {/* What are you looking for - Label + Dropdown */}
            <div className="flex items-center gap-3 px-5 py-4 lg:py-0 border-b lg:border-b-0 lg:border-r border-gray-200 shrink-0">
              <span className="text-sm text-gray-500 whitespace-nowrap">What are you looking for?</span>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none bg-transparent pr-8 py-2 text-gray-800 font-semibold focus:outline-none cursor-pointer border-none text-base"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <SafeIcon icon={FiChevronDown} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
              </div>
            </div>

            {/* Location Input */}
            <div className="flex-1 relative flex items-center border-b lg:border-b-0 lg:border-r border-gray-200 px-5 min-w-[200px]">
              <AddressAutocomplete
                value={location}
                onChange={setLocation}
                onSelect={(place) => {
                  setLocation(place.address);
                  setCoordinates({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
                }}
                placeholder="Address, city, postcode"
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 text-base"
              />
            </div>

            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="hidden lg:flex items-center justify-center w-14 h-14 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 shrink-0"
              title="More filters"
            >
              <SafeIcon icon={FiFilter} className="w-5 h-5" />
            </button>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-blue-500 text-white font-semibold py-4 px-8 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap shrink-0"
            >
              <SafeIcon icon={FiSearch} className="w-5 h-5" />
              <span>Search Listing</span>
            </button>
          </form>
        </motion.div>

        {/* More Filters Modal */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
                className="fixed inset-0 bg-black/30 z-40"
              />
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-full max-w-md overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">More Filters</h3>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
                  >
                    <SafeIcon icon={FiX} className="w-4 h-4" />
                  </button>
                </div>


                {/* Content */}
                <div className="px-6 py-5 space-y-5">
                  {/* Zip/Post Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zip/Post Code</label>
                    <input
                      type="text"
                      value={filters.zipcode}
                      onChange={(e) => setFilters(prev => ({ ...prev, zipcode: e.target.value }))}
                      placeholder="Enter zip or post code"
                      className="w-full px-4 py-3 border-b border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-transparent"
                    />
                  </div>

                  {/* Mobile Service */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Service</label>
                    <div className="relative">
                      <select
                        value={filters.mobileService}
                        onChange={(e) => setFilters(prev => ({ ...prev, mobileService: e.target.value }))}
                        className="w-full appearance-none px-4 py-3 border-b border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-transparent cursor-pointer pr-10"
                      >
                        {MOBILE_SERVICE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <SafeIcon icon={FiChevronDown} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                    </div>
                  </div>

                  {/* Radius */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Radius</label>
                    <div className="relative">
                      <select
                        value={filters.radius}
                        onChange={e => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                        className="w-full appearance-none px-4 py-3 border-b border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-transparent cursor-pointer pr-10"
                      >
                        {RADIUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <SafeIcon icon={FiChevronDown} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                    </div>
                  </div>

                  {/* Open Now */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-900">Open Now</span>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.openNow}
                          onChange={(e) => setFilters(prev => ({ ...prev, openNow: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${filters.openNow ? 'bg-blue-500' : 'bg-gray-200'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${filters.openNow ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <SafeIcon icon={FiClock} className="w-4 h-4" />
                        <span>Open Now</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="bg-blue-500 text-white font-semibold py-2.5 px-8 rounded-lg hover:bg-blue-600 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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