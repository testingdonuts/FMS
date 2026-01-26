import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { eventService } from '../services/eventService';

const { FiSearch, FiCalendar, FiMapPin, FiClock, FiUsers } = FiIcons;

const EventSearch = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await eventService.getAllEvents();
    if (data) {
      setEvents(data);
      setFilteredEvents(data);
    }
    if (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    const { data, error } = await eventService.searchEvents(searchQuery, selectedDate);
    if (data) {
      setFilteredEvents(data);
    }
    if (error) {
      console.error('Error searching events:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Your Perfect Event</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events, venues, or artists"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <SafeIcon icon={FiCalendar} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search Events'}
          </motion.button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative h-48">
              <img
                src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                ${event.price_range_min} - ${event.price_range_max}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-500">
                  <SafeIcon icon={FiCalendar} className="mr-2" />
                  <span>{formatDate(event.date)} at {formatTime(event.date)}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <SafeIcon icon={FiMapPin} className="mr-2" />
                  <span>{event.venues_fm7x9k2p1q?.name}, {event.venues_fm7x9k2p1q?.city}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <SafeIcon icon={FiUsers} className="mr-2" />
                  <span>Capacity: {event.venues_fm7x9k2p1q?.capacity}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Available Seats</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  View Seats
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiSearch} className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No events found</h3>
          <p className="text-gray-500">Try adjusting your search criteria or browse all events</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventSearch;