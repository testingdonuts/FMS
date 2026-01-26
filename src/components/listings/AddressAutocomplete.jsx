import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMapPin, FiLoader } = FiIcons;

/**
 * OpenStreetMap-based address autocomplete component
 * @param {string} value - Current input value
 * @param {function} onChange - Callback when value changes
 * @param {function} onSelect - Callback when suggestion is selected
 * @param {string} placeholder - Input placeholder text
 * @param {string} className - Additional CSS classes
 * @param {boolean} required - Whether field is required
 */
const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search for address...",
  className = "",
  required = false
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from OpenStreetMap Nominatim API
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&addressdetails=1` +
        `&limit=5`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch suggestions');

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    const formattedAddress = suggestion.display_name;
    onChange(formattedAddress);
    
    if (onSelect) {
      onSelect({
        address: formattedAddress,
        lat: suggestion.lat,
        lon: suggestion.lon,
        city: suggestion.address?.city || suggestion.address?.town || '',
        state: suggestion.address?.state || '',
        zipcode: suggestion.address?.postcode || '',
        country: suggestion.address?.country || ''
      });
    }

    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Format display name for better readability
  const formatDisplayName = (suggestion) => {
    const parts = suggestion.display_name.split(',');
    if (parts.length > 3) {
      return parts.slice(0, 3).join(',') + '...';
    }
    return suggestion.display_name;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <SafeIcon 
          icon={FiMapPin} 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
          autoComplete="off"
        />
        {loading && (
          <SafeIcon 
            icon={FiLoader} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" 
          />
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id || index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 flex items-start space-x-3"
                >
                  <SafeIcon 
                    icon={FiMapPin} 
                    className="text-blue-500 mt-1 flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">
                      {formatDisplayName(suggestion)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {suggestion.type}
                      {suggestion.address?.country && ` • ${suggestion.address.country}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-medium">
                Powered by OpenStreetMap
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      {showSuggestions && !loading && suggestions.length === 0 && value.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 text-center"
        >
          <p className="text-sm text-gray-500">No locations found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
        </motion.div>
      )}
    </div>
  );
};

export default AddressAutocomplete;