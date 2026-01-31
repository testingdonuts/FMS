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
    category: '',
    location: ''
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const categories = [
    { value: '', label: 'Select Category' },
    { value: '77', label: 'Additional Needs/OT' },
    { value: '76', label: 'Automotive' },
    { value: '75', label: 'Baby Equipment Hire' },
    { value: '74', label: 'Car Hire' },
    { value: '73', label: 'Detailers / Cleaning Services' },
    { value: '72', label: 'Family Services' },
    { value: '71', label: 'Installer/Techs' },
    { value: '70', label: 'Manufacturers' },
    { value: '69', label: 'Retail' },
    { value: '68', label: 'Vehicle Modifiers' },
  ];

  // Sample suggestions for the query field
  const suggestions = [
    'Melbourne',
    'Severance s02',
    'acri.com.au',
    'business provider',
    'sweet',
    'https://promisedgardenltd.com/'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchData({ ...searchData, [name]: value });
    if (name === 'query') {
      if (value.length > 0) {
        setFilteredSuggestions(suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchData({ ...searchData, query: suggestion });
    setShowSuggestions(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchData.query || searchData.category || searchData.location) {
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
            <form className="bg-white rounded-2xl shadow-lg mb-8 px-4 py-3" onSubmit={handleSearch}>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
                {/* Query Field */}
                <div className="relative flex-1 w-full md:w-auto">
                  <input
                    id="query"
                    name="query"
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchData.query}
                    onChange={handleChange}
                    onFocus={() => searchData.query && setShowSuggestions(true)}
                    autoComplete="off"
                    className="w-full border-0 border-b-2 border-blue-400 focus:ring-0 focus:border-blue-600 pl-4 pr-4 py-3 bg-transparent text-gray-900 placeholder-gray-400"
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <ul className="absolute left-0 mt-2 w-full bg-black text-white rounded-lg shadow-lg z-20">
                      {filteredSuggestions.map((suggestion, idx) => (
                        <li
                          key={idx}
                          className="px-4 py-2 cursor-pointer hover:bg-blue-600"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Category Field */}
                <div className="relative flex-1 w-full md:w-auto md:mx-2">
                  <select
                    id="category"
                    name="category"
                    value={searchData.category}
                    onChange={handleChange}
                    className="w-full border-0 border-b-2 border-blue-400 focus:ring-0 focus:border-blue-600 pl-4 pr-8 py-3 bg-transparent text-gray-900"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    <FiIcons.FiChevronDown />
                  </span>
                </div>
                {/* Location Field */}
                <div className="relative flex-1 w-full md:w-auto">
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Address, city, postcode"
                    value={searchData.location}
                    onChange={handleChange}
                    className="w-full border-0 border-b-2 border-blue-400 focus:ring-0 focus:border-blue-600 pl-4 pr-4 py-3 bg-transparent text-gray-900 placeholder-gray-400"
                    autoComplete="off"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiIcons.FiMapPin />
                  </span>
                </div>
                {/* Filter Icon */}
                <button
                  type="button"
                  className="mx-2 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                  tabIndex={-1}
                  aria-label="Filter"
                >
                  <FiIcons.FiFilter size={20} />
                </button>
                {/* Search Button */}
                <button
                  type="submit"
                  className="ml-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FiIcons.FiSearch className="mr-2" /> Search Listing
                </button>
              </div>
            </form>

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