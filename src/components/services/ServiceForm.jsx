import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSave, FiX, FiClock, FiDollarSign, FiInfo, FiTag, FiTool, FiSearch, FiBookOpen, FiUsers, FiVideo, FiTruck, FiImage, FiGlobe, FiMapPin } = FiIcons;

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
];

const ServiceForm = ({ service = null, onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
    price: 0,
    serviceType: 'installation',
    isActive: true,
    image_url: '',
    availability: {
      type: 'country',
      countryCode: 'US',
      countryName: 'United States'
    }
  });

  const serviceTypes = [
    { value: 'installation', label: 'Installation', description: 'Professional car seat installation service', icon: FiTool },
    { value: 'inspection', label: 'Inspection', description: 'Safety check of existing car seat installation', icon: FiSearch },
    { value: 'education', label: 'Education', description: 'One-on-one education about car seat safety', icon: FiBookOpen },
    { value: 'workshop', label: 'Workshop', description: 'Group workshop for multiple families', icon: FiUsers },
    { value: 'virtual_consultation', label: 'Virtual Consultation', description: 'Remote consultation via video call', icon: FiVideo },
    { value: 'mobile_installation', label: 'Mobile Installation', description: 'Installation service at customer location', icon: FiTruck },
  ];

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        durationMinutes: service.duration_minutes || 60,
        price: service.price || 0,
        serviceType: service.service_type || 'installation',
        isActive: service.is_active ?? true,
        image_url: service.image_url || '',
        availability: service.availability || { type: 'country', countryCode: 'US', countryName: 'United States' }
      });
    }
  }, [service]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAvailabilityChange = (updates) => {
    setFormData(prev => ({
      ...prev,
      availability: { ...prev.availability, ...updates }
    }));
  };

  const handleCountrySelect = (e) => {
    const country = countries.find(c => c.code === e.target.value);
    if (country) {
      handleAvailabilityChange({ countryCode: country.code, countryName: country.name });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
          <div className="flex space-x-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <SafeIcon icon={FiSave} />
              <span>{isLoading ? 'Saving...' : 'Save Service'}</span>
            </motion.button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          {/* Availability Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiGlobe} className="mr-2 text-teal-600" />
              Service Availability
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleAvailabilityChange({ type: 'worldwide' })}
                className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-all ${formData.availability.type === 'worldwide' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}
              >
                <SafeIcon icon={FiGlobe} />
                <span>Worldwide</span>
              </button>
              <button
                type="button"
                onClick={() => handleAvailabilityChange({ type: 'country' })}
                className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-all ${formData.availability.type === 'country' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}
              >
                <SafeIcon icon={FiMapPin} />
                <span>Specific Country</span>
              </button>
            </div>

            {formData.availability.type === 'country' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Select Country</label>
                <select
                  value={formData.availability.countryCode}
                  onChange={handleCountrySelect}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiInfo} className="mr-2" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left"> Service Name * </label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter service name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left"> Description * </label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={4} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Detailed description of the service" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left"> Image URL </label>
                <div className="relative">
                  <SafeIcon icon={FiImage} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="url" name="image_url" value={formData.image_url} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://example.com/image.jpg" />
                </div>
              </div>
            </div>
          </div>

          {/* Service Type */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiTag} className="mr-2" />
              Service Type
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {serviceTypes.map((type) => (
                <label key={type.value} className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-left ${formData.serviceType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`} >
                  <input type="radio" name="serviceType" value={type.value} checked={formData.serviceType === type.value} onChange={handleInputChange} className="sr-only" />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={type.icon} className={`text-xl ${formData.serviceType === type.value ? 'text-blue-600' : 'text-gray-500'}`} />
                      <h4 className="font-medium text-gray-900">{type.label}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <SafeIcon icon={FiClock} className="mr-2" />
              Duration & Pricing
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"> Duration (min) * </label>
                <input type="number" name="durationMinutes" value={formData.durationMinutes} onChange={handleInputChange} required min="15" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"> Price ($) * </label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-left">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
            <label className="text-sm font-medium text-gray-700"> Service is active and available for booking </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;