import React, { useState, useEffect } from 'react';
    import supabase from '../../supabase/supabase';
    import { updateProfileLocation, getProfile } from '../../services/profileService';
    import SafeIcon from '../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';

    const { FiMapPin, FiSave, FiCheck, FiAlertCircle, FiLoader } = FiIcons;

    const COUNTRIES = [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'AU', name: 'Australia' },
      { code: 'IE', name: 'Ireland' },
      { code: 'NZ', name: 'New Zealand' },
    ];

    const LocationSettings = () => {
      const [loading, setLoading] = useState(true);
      const [saving, setSaving] = useState(false);
      const [userId, setUserId] = useState(null);
      const [status, setStatus] = useState({ type: '', message: '' });
      const [formData, setFormData] = useState({
        countryCode: '',
        countryName: '',
        city: '',
        state: '',
        zipcode: ''
      });

      useEffect(() => {
        const loadProfile = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            
            const profile = await getProfile(user.id);
            if (profile?.location) {
              setFormData({
                countryCode: profile.location.countryCode || '',
                countryName: profile.location.countryName || '',
                city: profile.location.city || '',
                state: profile.location.state || '',
                zipcode: profile.location.zipcode || ''
              });
            }
          } catch (error) {
            console.error('Error loading profile:', error);
          } finally {
            setLoading(false);
          }
        };

        loadProfile();
      }, []);

      const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'countryCode') {
          const country = COUNTRIES.find(c => c.code === value);
          setFormData(prev => ({
            ...prev,
            countryCode: value,
            countryName: country ? country.name : ''
          }));
        } else {
          setFormData(prev => ({ ...prev, [name]: value }));
        }
      };

      const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus({ type: '', message: '' });

        try {
          await updateProfileLocation(userId, formData);
          setStatus({ type: 'success', message: 'Location updated successfully!' });
          setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
          setStatus({ type: 'error', message: 'Failed to update location.' });
        } finally {
          setSaving(false);
        }
      };

      if (loading) {
        return (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <SafeIcon icon={FiLoader} className="text-3xl animate-spin mb-4" />
            <p>Loading your settings...</p>
          </div>
        );
      }

      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <SafeIcon icon={FiMapPin} className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Search Location</h2>
                <p className="text-sm text-gray-500">Helping us find services and equipment near you.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {status.message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${
                status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                <SafeIcon icon={status.type === 'success' ? FiCheck : FiAlertCircle} className="text-lg" />
                {status.message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-gray-50/50"
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. London"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Greater London"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Zip / Postal Code</label>
                <input
                  type="text"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleChange}
                  placeholder="e.g. SW1A 1AA"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-gray-50/50"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:scale-95"
              >
                {saving ? (
                  <><SafeIcon icon={FiLoader} className="animate-spin" /> Saving...</>
                ) : (
                  <><SafeIcon icon={FiSave} /> Save Location</>
                )}
              </button>
            </div>
          </form>
        </div>
      );
    };

    export default LocationSettings;