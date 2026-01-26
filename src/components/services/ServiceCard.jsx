import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import LocationBadge from '../../common/LocationBadge';
import * as FiIcons from 'react-icons/fi';
import { getServiceImage } from '../../utils/serviceDefaults';

const { FiClock, FiDollarSign, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiCheck, FiX, FiTool, FiSearch, FiBookOpen, FiUsers, FiVideo, FiTruck } = FiIcons;

const ServiceCard = ({ service, onEdit, onDelete, onToggleStatus, onView, userRole = 'organization' }) => {
  const getServiceTypeIcon = (type) => {
    switch (type) {
      case 'installation': return FiTool;
      case 'inspection': return FiSearch;
      case 'education': return FiBookOpen;
      case 'workshop': return FiUsers;
      case 'virtual_consultation': return FiVideo;
      case 'mobile_installation': return FiTruck;
      default: return FiClock;
    }
  };

  const formatServiceType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const imageUrl = getServiceImage(service);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Image Header */}
      <div className="relative h-48 bg-gray-100 group">
        <img
          src={imageUrl}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
        <div className="hidden absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
          <SafeIcon icon={getServiceTypeIcon(service.service_type)} className="text-4xl text-gray-400" />
        </div>
        
        {/* Location Badge */}
        <div className="absolute top-3 left-3 z-10">
          <LocationBadge availability={service.availability} />
        </div>

        {/* Type Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center text-white space-x-2">
            <SafeIcon icon={getServiceTypeIcon(service.service_type)} className="text-sm" />
            <span className="text-sm font-medium">{formatServiceType(service.service_type)}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {service.is_active ? (
            <span className="px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-md text-xs font-semibold shadow-sm flex items-center">
              <SafeIcon icon={FiCheck} className="mr-1 text-xs" /> Active
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-500/90 backdrop-blur-sm text-white rounded-md text-xs font-semibold shadow-sm flex items-center">
              <SafeIcon icon={FiX} className="mr-1 text-xs" /> Inactive
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{service.name}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{service.description}</p>

        {/* Details */}
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center">
            <SafeIcon icon={FiClock} className="mr-2 text-blue-500" />
            <span>{service.duration_minutes} min</span>
          </div>
          <div className="font-bold text-gray-900">
            ${service.price}
          </div>
        </div>

        {/* Actions */}
        {userRole === 'organization' && (
          <div className="flex justify-end items-center pt-3 border-t border-gray-100 gap-2">
            <button
              onClick={() => onToggleStatus(service.id, !service.is_active)}
              className={`p-2 rounded-full transition-colors ${service.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
              title={service.is_active ? 'Deactivate service' : 'Activate service'}
            >
              <SafeIcon icon={service.is_active ? FiToggleRight : FiToggleLeft} className="text-xl" />
            </button>
            <button
              onClick={() => onEdit(service)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Edit service"
            >
              <SafeIcon icon={FiEdit} className="text-lg" />
            </button>
            <button
              onClick={() => onDelete(service)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Delete service"
            >
              <SafeIcon icon={FiTrash2} className="text-lg" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ServiceCard;