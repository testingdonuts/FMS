import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { listingService } from '../../services/listingService';
import ListingCard from './ListingCard';

const { FiSearch, FiList, FiMapPin, FiAlertCircle, FiRefreshCw } = FiIcons;

const ListingBrowse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    location: searchParams.get('loc') || '',
  });

  useEffect(() => {
    loadListings();
  }, [searchParams]);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await listingService.searchListings({
        query: searchParams.get('q'),
        location: searchParams.get('loc')
      });
      
      if (fetchError) throw new Error(fetchError);
      setListings(data || []);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (filters.query) params.q = filters.query;
    if (filters.location) params.loc = filters.location;
    setSearchParams(params);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-black text-navy mb-4 tracking-tight">Safety Organizations</h1>
          <p className="text-lg text-gray-600">Find a certified Child Passenger Safety expert near you.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-100 max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="grid md:grid-cols-7 gap-4 items-center">
            <div className="md:col-span-3 relative">
              <SafeIcon icon={FiSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                name="query" 
                placeholder="Organization name..." 
                value={filters.query} 
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div className="md:col-span-3 relative">
              <SafeIcon icon={FiMapPin} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                name="location" 
                placeholder="City, state, or zipcode..." 
                value={filters.location} 
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <button 
              type="submit" 
              className="md:col-span-1 bg-blue-600 text-white py-4 px-4 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-600/20"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="max-w-xl mx-auto bg-red-50 border border-red-100 p-6 rounded-3xl text-center">
            <SafeIcon icon={FiAlertCircle} className="text-3xl text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-800 mb-1">Unable to load listings</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadListings}
              className="flex items-center space-x-2 mx-auto px-4 py-2 bg-white border border-red-200 text-red-700 rounded-xl font-bold hover:bg-red-50 transition-all"
            >
              <SafeIcon icon={FiRefreshCw} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-80 border border-gray-100 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} showActions={false} />
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SafeIcon icon={FiList} className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-navy mb-2">No organizations found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Try adjusting your search filters or check back later for new safety experts.
            </p>
            {(filters.query || filters.location) && (
              <button 
                onClick={() => {
                  setFilters({ query: '', location: '' });
                  setSearchParams({});
                }}
                className="mt-6 text-blue-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingBrowse;