import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

// Added FiArrowRight to the destructuring list
const { FiMapPin, FiPhone, FiClock, FiEdit, FiEye, FiTrash2, FiGlobe, FiStar, FiZap, FiArrowRight } = FiIcons;

const ListingCard = ({ listing, onEdit, onDelete, onView, showActions = true, distance = null }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatOpeningHours = (hours) => {
    if (!hours) return 'Hours not set';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = hours[today];
    if (todayHours?.closed) return 'Closed today';
    if (todayHours?.open && todayHours?.close) return `Open ${todayHours.open} - ${todayHours.close}`;
    return 'Hours available';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`bg-white rounded-[2rem] border overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full group ${
        listing.is_featured 
          ? 'border-soft-yellow ring-4 ring-soft-yellow/10' 
          : 'border-gray-100'
      }`}
    >
      {/* Header with Logo/Image */}
      <div className="relative h-56 bg-white overflow-hidden flex items-center justify-center p-6">
        {listing.is_featured && (
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-1.5 bg-soft-yellow text-navy text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/20">
            <SafeIcon icon={FiStar} className="fill-current" />
            <span className="uppercase tracking-widest">Featured Expert</span>
          </div>
        )}

        {listing.logo_url ? (
          <img 
            src={listing.logo_url} 
            alt={listing.name} 
            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-teal-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-3 shadow-xl transform transition-transform group-hover:rotate-6">
                <SafeIcon icon={FiGlobe} className="text-blue-600 text-3xl" />
              </div>
              <div className="text-navy font-black text-sm uppercase tracking-widest">{listing.name}</div>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(listing.status)}`}>
            {listing.status}
          </span>
          {distance !== null && (
            <span className="bg-teal/90 text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-sm">
              {distance.toFixed(1)} km
            </span>
          )}
        </div>

        {listing.price_range && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs font-black text-navy shadow-lg border border-white/50">
              {listing.price_range}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-8 flex-grow flex flex-col text-left">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-navy mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {listing.name}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
            {listing.short_description}
          </p>
        </div>

        {listing.categories && listing.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {listing.categories.slice(0, 2).map((category, index) => (
              <span key={index} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {category}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-3 mb-8">
          <div className="flex items-center text-gray-500 text-xs font-medium">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3">
              <SafeIcon icon={FiMapPin} className="text-blue-500" />
            </div>
            <span className="truncate">{listing.address}</span>
          </div>
          <div className="flex items-center text-gray-500 text-xs font-medium">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3">
              <SafeIcon icon={FiClock} className="text-teal-500" />
            </div>
            <span>{formatOpeningHours(listing.opening_hours)}</span>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Update: {new Date(listing.updated_at).toLocaleDateString()}
          </div>
          
          {showActions ? (
            <div className="flex space-x-2">
              <button 
                onClick={() => onView(listing)} 
                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="View Profile"
              >
                <SafeIcon icon={FiEye} />
              </button>
              <button 
                onClick={() => onEdit(listing)} 
                className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-navy hover:text-white transition-all shadow-sm"
                title="Edit Listing"
              >
                <SafeIcon icon={FiEdit} />
              </button>
              <button 
                onClick={() => onDelete(listing)} 
                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                title="Delete"
              >
                <SafeIcon icon={FiTrash2} />
              </button>
            </div>
          ) : (
            <Link 
              to={`/listing/${listing.id}`} 
              className="flex items-center space-x-2 bg-navy text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-navy/10"
            >
              <span>Profile</span>
              <SafeIcon icon={FiArrowRight} />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;