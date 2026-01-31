import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { listingService } from '../../services/listingService';
import ListingCard from './ListingCard';

const { FiSearch, FiList, FiMapPin, FiAlertCircle, FiRefreshCw, FiSliders, FiNavigation } = FiIcons;

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const RADIUS_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 200, label: '200 km' },
  { value: 0, label: 'Anywhere' },
];

const ListingBrowse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  const [filters, setFilters] = useState({
    location: searchParams.get('loc') || '',
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null,
    radius: parseInt(searchParams.get('radius')) || 20,
    query: searchParams.get('query') || '',
  });

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && locationInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['(regions)'],
        fields: ['formatted_address', 'geometry', 'address_components']
      });
      
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
          const newFilters = {
            ...filters,
            location: place.formatted_address || place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          setFilters(newFilters);
          updateSearchParams(newFilters);
        }
      });
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, []);

  // Filter listings when filters or listings change
  useEffect(() => {
    filterListingsByRadius();
  }, [listings, filters.lat, filters.lng, filters.radius, filters.query]);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load ALL published listings - we'll filter by radius client-side
      const { data, error: fetchError } = await listingService.getPublishedListings(500);
      
      if (fetchError) throw new Error(fetchError);
      setListings(data || []);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterListingsByRadius = () => {
    let filtered = listings;

    // Filter by search query if provided
    if (filters.query) {
      const searchLower = filters.query.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.name?.toLowerCase().includes(searchLower) ||
        listing.description?.toLowerCase().includes(searchLower) ||
        listing.services?.some(service => service.toLowerCase().includes(searchLower)) ||
        listing.categories?.some(category => category.toLowerCase().includes(searchLower))
      );
    }

    if (!filters.lat || !filters.lng || filters.radius === 0) {
      // No location filter or "Anywhere" selected - show all filtered results
      setFilteredListings(filtered);
      return;
    }

    // Filter and sort by distance
    const withDistance = filtered
      .filter(listing => listing.latitude && listing.longitude)
      .map(listing => ({
        ...listing,
        distance: calculateDistance(filters.lat, filters.lng, listing.latitude, listing.longitude)
      }))
      .filter(listing => listing.distance <= filters.radius)
      .sort((a, b) => {
        // Featured first, then by distance
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return a.distance - b.distance;
      });

    // Also include listings without coordinates if they match the location text
    const withoutCoords = filtered.filter(listing => {
      if (listing.latitude && listing.longitude) return false;
      const searchLoc = filters.location.toLowerCase();
      return listing.address?.toLowerCase().includes(searchLoc) ||
             listing.zipcode?.toLowerCase().includes(searchLoc);
    });

    setFilteredListings([...withDistance, ...withoutCoords]);
  };

  const updateSearchParams = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.query) params.set('query', newFilters.query);
    if (newFilters.location) params.set('loc', newFilters.location);
    if (newFilters.lat) params.set('lat', newFilters.lat.toString());
    if (newFilters.lng) params.set('lng', newFilters.lng.toString());
    if (newFilters.radius) params.set('radius', newFilters.radius.toString());
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateSearchParams(filters);
    filterListingsByRadius();
  };

  const handleRadiusChange = (newRadius) => {
    const newFilters = { ...filters, radius: newRadius };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  const clearLocationFilter = () => {
    const newFilters = { location: '', lat: null, lng: null, radius: 20, query: filters.query };
    setFilters(newFilters);
    setSearchParams(newFilters.query ? `?query=${newFilters.query}` : '');
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
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SafeIcon icon={FiSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="What service, equipment, or expert are you looking for?" 
                  value={filters.query} 
                  onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SafeIcon icon={FiMapPin} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  ref={locationInputRef}
                  type="text" 
                  placeholder="Enter suburb, city, or postcode..." 
                  value={filters.location} 
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <SafeIcon icon={FiNavigation} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={filters.radius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="appearance-none pl-10 pr-8 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                  >
                    {RADIUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <SafeIcon icon={FiSliders} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white py-4 px-6 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-600/20 flex items-center space-x-2"
                >
                  <SafeIcon icon={FiSearch} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Active Filters */}
        {(filters.location || filters.query) && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {filters.query && (
              <>
                <span className="text-gray-500">Searching for</span>
                <span className="font-bold text-navy">"{filters.query}"</span>
              </>
            )}
            {filters.location && (
              <>
                {filters.query && <span className="text-gray-500">within</span>}
                <span className="text-gray-500">{filters.query ? 'results' : 'Showing results'} within</span>
                <span className="font-bold text-navy">{filters.radius === 0 ? 'any distance' : `${filters.radius} km`}</span>
                <span className="text-gray-500">of</span>
                <span className="font-bold text-navy">{filters.location}</span>
              </>
            )}
            <button onClick={clearLocationFilter} className="ml-2 text-red-500 hover:text-red-600 font-medium">
              Clear
            </button>
          </div>
        )}

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

        {/* Results Count */}
        {!loading && !error && (
          <div className="text-center text-gray-500">
            Found <span className="font-bold text-navy">{filteredListings.length}</span> organization{filteredListings.length !== 1 ? 's' : ''}
            {filters.query && ` matching "${filters.query}"`}
            {filters.location && ` near ${filters.location}`}
            {!filters.query && !filters.location && ' available'}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-80 border border-gray-100 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.map(listing => (
              <ListingCard 
                key={listing.id} 
                listing={listing} 
                showActions={false} 
                distance={listing.distance}
              />
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SafeIcon icon={FiList} className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-navy mb-2">No organizations found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {filters.query 
                ? `No organizations found matching "${filters.query}"${filters.location ? ` near ${filters.location}` : ''}. Try different search terms.`
                : filters.location 
                  ? `No certified experts found within ${filters.radius} km of ${filters.location}. Try increasing the radius.`
                  : 'Try searching for a service, equipment, or expert to find safety providers near you.'}
            </p>
            {filters.location && (
              <button 
                onClick={clearLocationFilter}
                className="mt-6 text-blue-600 font-bold hover:underline"
              >
                Clear location filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingBrowse;