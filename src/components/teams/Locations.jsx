import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase/supabase';

const { 
  FiMapPin, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, 
  FiGlobe, FiNavigation, FiMap, FiLayout 
} = FiIcons;

const Locations = () => {
  const { profile } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    phone: '',
    is_primary: false
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (profile?.organization_id) {
      loadLocations();
    }
  }, [profile?.organization_id]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_locations_1763000000000')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        organization_id: profile.organization_id,
        ...formData
      };

      let error;
      if (editingId) {
        const { error: updateError } = await supabase
          .from('organization_locations_1763000000000')
          .update(payload)
          .eq('id', editingId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('organization_locations_1763000000000')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      setShowForm(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        phone: '',
        is_primary: false
      });
      setEditingId(null);
      loadLocations();
    } catch (err) {
      console.error('Error saving location:', err);
      alert('Failed to save location');
    }
  };

  const handleEdit = (loc) => {
    setFormData({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zipcode: loc.zipcode,
      phone: loc.phone,
      is_primary: loc.is_primary
    });
    setEditingId(loc.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      const { error } = await supabase
        .from('organization_locations_1763000000000')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      loadLocations();
    } catch (err) {
      console.error('Error deleting location:', err);
    }
  };

  const getMapUrl = (address, city, state) => {
    const query = encodeURIComponent(`${address}, ${city}, ${state}`);
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-navy uppercase tracking-tight">Manage Locations</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Add and manage multiple business branches</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              address: '',
              city: '',
              state: '',
              zipcode: '',
              phone: '',
              is_primary: false
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Location</span>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-black text-navy">Location Details</h3>
                    {editingId && <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Editing</span>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Downtown Branch"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street Address"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors font-medium outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zipcode</label>
                      <input
                        type="text"
                        value={formData.zipcode}
                        onChange={e => setFormData({ ...formData, zipcode: e.target.value })}
                        placeholder="12345"
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="is_primary"
                      checked={formData.is_primary}
                      onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="is_primary" className="text-sm font-bold text-navy cursor-pointer">
                      Set as Primary Location
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                      {editingId ? 'Update Location' : 'Save Location'}
                    </button>
                  </div>
                </div>

                {/* Google Maps Preview */}
                <div className="relative h-full min-h-[300px] bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-100">
                  {(formData.address || formData.city) ? (
                    <div className="absolute inset-0">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src={getMapUrl(formData.address, formData.city, formData.state)}
                        className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
                      ></iframe>
                      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-gray-600 flex items-center gap-1.5">
                        <SafeIcon icon={FiMapPin} className="text-red-500" />
                        Preview
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <SafeIcon icon={FiMap} className="text-2xl text-gray-300" />
                      </div>
                      <p className="font-bold">Map Preview</p>
                      <p className="text-xs mt-1 max-w-[200px]">Enter an address and city to see the location on the map</p>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(loc => (
          <motion.div
            key={loc.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group bg-white rounded-3xl border transition-all hover:shadow-lg overflow-hidden flex flex-col ${
              loc.is_primary ? 'border-blue-200 shadow-blue-100' : 'border-gray-100 shadow-sm'
            }`}
          >
            {/* List View Map Preview */}
            <div className="h-32 bg-gray-100 relative overflow-hidden">
               <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={getMapUrl(loc.address, loc.city, loc.state)}
                  className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100 pointer-events-none"
                ></iframe>
                {loc.is_primary && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm flex items-center gap-1">
                    <SafeIcon icon={FiCheck} /> Primary
                  </div>
                )}
            </div>

            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${loc.is_primary ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                    <SafeIcon icon={FiMapPin} className="text-xl" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy text-lg leading-tight">{loc.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{loc.city}, {loc.state}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <SafeIcon icon={FiNavigation} className="text-gray-300 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {loc.address}<br />
                    {loc.city}, {loc.state} {loc.zipcode}
                  </p>
                </div>
                {loc.phone && (
                  <div className="flex items-center gap-3">
                    <SafeIcon icon={FiGlobe} className="text-gray-300 shrink-0" />
                    <p className="text-sm text-gray-600 font-medium">{loc.phone}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                <button
                  onClick={() => handleEdit(loc)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-navy py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
                >
                  <SafeIcon icon={FiEdit2} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <SafeIcon icon={FiTrash2} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        
        {locations.length === 0 && !loading && !showForm && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <SafeIcon icon={FiMapPin} className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-gray-500">No locations added</h3>
            <p className="text-sm text-gray-400 mt-1">Add your first business location to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Locations;