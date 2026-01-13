import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiMapPin, FiChevronDown } = FiIcons;

const Hero = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location: '',
    type: 'Technician'
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const path = formData.type === 'Technician' ? '/listings' : 
                 formData.type === 'Service' ? '/services' : '/equipment';
    
    const params = new URLSearchParams();
    if (formData.location) params.append('loc', formData.location);
    
    navigate(`${path}?${params.toString()}`);
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
          Book installations, rent safety equipment, or connect with experts — anywhere.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 max-w-3xl mx-auto bg-white p-4 rounded-xl shadow-2xl shadow-navy/10 border border-gray-100"
        >
          <form onSubmit={handleSearch} className="grid md:grid-cols-7 gap-2 items-center">
            <div className="md:col-span-3 relative">
              <SafeIcon icon={FiMapPin} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter location or zipcode..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="md:col-span-3 relative">
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full appearance-none bg-white pr-8 pl-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option>Technician</option>
                <option>Service</option>
                <option>Equipment</option>
              </select>
              <SafeIcon icon={FiChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="md:col-span-1 w-full bg-teal-500 text-white font-semibold py-3 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center"
            >
              <SafeIcon icon={FiSearch} />
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