import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSave, FiX, FiUpload, FiTrash2, FiPackage, FiDollarSign, FiInfo, FiCamera, FiImage, FiGlobe, FiMapPin } = FiIcons;

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

const EquipmentForm = ({ equipment = null, onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    rentalPricePerDay: '',
    depositAmount: '',
    currentCondition: 'Good',
    availabilityStatus: true,
    imageUrls: [],
    specifications: {},
    availability: {
      type: 'country',
      countryCode: 'US',
      countryName: 'United States'
    }
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const categoryOptions = ['Sports Equipment', 'Training Accessories', 'Safety Gear', 'Audio/Visual Equipment', 'Furniture', 'Technology', 'Other'];
  const conditionOptions = [
    { value: 'New', label: 'New' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Damaged', label: 'Damaged' },
  ];

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        description: equipment.description || '',
        category: equipment.category || '',
        rentalPricePerDay: equipment.rental_price_per_day || '',
        depositAmount: equipment.deposit_amount || '',
        currentCondition: equipment.current_condition || 'Good',
        availabilityStatus: equipment.availability_status ?? true,
        imageUrls: equipment.image_urls || [],
        specifications: equipment.specifications || {},
        availability: equipment.availability || { type: 'country', countryCode: 'US', countryName: 'United States' }
      });
    }
  }, [equipment]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

  const renderBasicInfo = () => (
    <div className="space-y-6 text-left">
      {/* Availability Selection */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Rental Availability</label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => handleAvailabilityChange({ type: 'worldwide' })}
            className={`p-2.5 rounded-lg border-2 flex items-center justify-center space-x-2 transition-all text-sm ${formData.availability.type === 'worldwide' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}
          >
            <SafeIcon icon={FiGlobe} />
            <span>Worldwide</span>
          </button>
          <button
            type="button"
            onClick={() => handleAvailabilityChange({ type: 'country' })}
            className={`p-2.5 rounded-lg border-2 flex items-center justify-center space-x-2 transition-all text-sm ${formData.availability.type === 'country' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}
          >
            <SafeIcon icon={FiMapPin} />
            <span>Country Specific</span>
          </button>
        </div>

        {formData.availability.type === 'country' && (
          <select
            value={formData.availability.countryCode}
            onChange={handleCountrySelect}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
          >
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2"> Equipment Name * </label>
        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2"> Category * </label>
        <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" >
          <option value="">Select a category</option>
          {categoryOptions.map(category => (<option key={category} value={category}>{category}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{equipment ? 'Edit Equipment' : 'Add New Equipment'}</h2>
          <div className="flex space-x-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <SafeIcon icon={FiSave} />
              <span>{isLoading ? 'Saving...' : 'Save Equipment'}</span>
            </motion.button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button type="button" onClick={() => setActiveTab('basic')} className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Basic Info</button>
            <button type="button" onClick={() => setActiveTab('pricing')} className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'pricing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Pricing</button>
          </nav>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          {activeTab === 'basic' ? renderBasicInfo() : (
            <div className="space-y-6 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"> Rental Price per Day * </label>
                <input type="number" name="rentalPricePerDay" value={formData.rentalPricePerDay} onChange={handleInputChange} required min="0" step="0.01" className="w-full p-3 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"> Security Deposit </label>
                <input type="number" name="depositAmount" value={formData.depositAmount} onChange={handleInputChange} min="0" step="0.01" className="w-full p-3 border border-gray-200 rounded-lg" />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default EquipmentForm;