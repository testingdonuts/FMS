import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import AddressAutocomplete from '../listings/AddressAutocomplete';
import * as FiIcons from 'react-icons/fi';
import { locationService } from '../../services/locationService';

const { FiMapPin, FiPlus, FiTrash2, FiEdit, FiPhone, FiCheck } = FiIcons;

const LocationManagement = ({ organizationId }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    phone: ''
  });

  useEffect(() => {
    loadLocations();
  }, [organizationId]);

  const loadLocations = async () => {
    const { data } = await locationService.getLocations(organizationId);
    if (data) setLocations(data);
    setLoading(false);
  };

  const handleAddressSelect = (addressData) => {
    setFormData(prev => ({
      ...prev,
      address: addressData.address,
      city: addressData.city || prev.city,
      state: addressData.state || prev.state,
      zipcode: addressData.zipcode || prev.zipcode
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await locationService.createLocation(organizationId, formData);
    if (!error) {
      loadLocations();
      setShowForm(false);
      setFormData({ name: '', address: '', city: '', state: '', zipcode: '', phone: '' });
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-navy">Manage Locations</h3>
          <p className="text-sm text-gray-500">Add and manage multiple business branches</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-navy text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-lg shadow-navy/20"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Location</span>
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              placeholder="Location Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-2 p-3 bg-gray-50 border border-gray-100 rounded-xl"
              required
            />

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Search Address
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
                onSelect={handleAddressSelect}
                placeholder="Start typing to search..."
                required
              />
            </div>

            <input
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="p-3 bg-gray-50 border border-gray-100 rounded-xl"
            />
            <input
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="p-3 bg-gray-50 border border-gray-100 rounded-xl"
            />
            <input
              placeholder="ZIP Code"
              value={formData.zipcode}
              onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
              className="p-3 bg-gray-50 border border-gray-100 rounded-xl"
            />
            <input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="p-3 bg-gray-50 border border-gray-100 rounded-xl"
            />

            <div className="col-span-2 flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold"
              >
                Save Location
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {locations.map(loc => (
          <div
            key={loc.id}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start"
          >
            <div className="flex items-start space-x-3">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                <SafeIcon icon={FiMapPin} />
              </div>
              <div>
                <h4 className="font-bold text-navy">{loc.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{loc.address}</p>
                {loc.city && loc.state && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {loc.city}, {loc.state} {loc.zipcode}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-2 text-[10px] uppercase font-bold text-blue-500">
                  <SafeIcon icon={FiPhone} />
                  <span>{loc.phone || 'No phone'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => locationService.deleteLocation(loc.id).then(loadLocations)}
              className="text-red-400 hover:text-red-600 p-2"
            >
              <SafeIcon icon={FiTrash2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationManagement;