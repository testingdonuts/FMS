import React from 'react';
import SafeIcon from './SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiGlobe } = FiIcons;

/**
 * Reusable LocationBadge component for Service and Equipment cards.
 * @param {Object} availability - The availability object { type: 'country' | 'worldwide', countryCode?: string, countryName?: string }
 */
const LocationBadge = ({ availability, className = "" }) => {
  if (!availability || !availability.type) return null;

  const isWorldwide = availability.type === 'worldwide';
  
  // Helper to get flag emoji from ISO country code
  const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  const label = isWorldwide 
    ? "Available worldwide" 
    : `Available in ${availability.countryName || availability.countryCode}`;

  return (
    <div 
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm text-[11px] font-medium text-navy ${className}`}
      aria-label={label}
      title={label}
    >
      {isWorldwide ? (
        <SafeIcon icon={FiGlobe} className="text-teal-600 text-xs" />
      ) : (
        <span className="text-sm leading-none" role="img" aria-hidden="true">
          {getFlagEmoji(availability.countryCode)}
        </span>
      )}
      <span className="truncate max-w-[100px]">
        {isWorldwide ? "Worldwide" : (availability.countryName || availability.countryCode)}
      </span>
    </div>
  );
};

export default LocationBadge;