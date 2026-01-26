import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { eventService } from '../services/eventService';
import EventSearch from './EventSearch';

const { FiSearch, FiCalendar, FiUsers, FiStar } = FiIcons;

const Hero = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchData, setSearchData] = useState({
    query: '',
    date: ''
  });

  const handleSearch = async () => {
    if (searchData.query || searchData.date) {
      setShowSearch(true);
    }
  };

  if (showSearch) {
    return <EventSearch />;
  }

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find Your
              <span className="text-blue-600 block">Perfect Seat</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover and book the ideal seating for any event, venue, or occasion. 
              From concerts to conferences, we help you find the seat that fits just right.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Event or Venue"
                    value={searchData.query}
                    onChange={(e) => setSearchData({ ...searchData, query: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <SafeIcon icon={FiCalendar} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={searchData.date}
                    onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Search Seats
                </motion.button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">10K+</div>
                <div className="text-gray-600">Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">500K+</div>
                <div className="text-gray-600">Seats Booked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">4.9</div>
                <div className="text-gray-600 flex items-center justify-center">
                  <SafeIcon icon={FiStar} className="text-yellow-400 mr-1" />
                  Rating
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop"
                alt="Theater seating"
                className="rounded-2xl shadow-2xl w-full"
              />
              
              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -top-6 -left-6 bg-white rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <SafeIcon icon={FiUsers} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Available</div>
                    <div className="text-sm text-gray-600">247 seats</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <SafeIcon icon={FiStar} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Premium</div>
                    <div className="text-sm text-gray-600">Best view</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-2xl transform rotate-3 -z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-yellow-200 to-pink-200 rounded-2xl transform -rotate-3 -z-20"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;