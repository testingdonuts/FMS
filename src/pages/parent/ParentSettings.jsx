import React, { useState, useEffect } from 'react';
import LocationSettings from '../../components/settings/LocationSettings';
import AddressAutocomplete from '../../components/listings/AddressAutocomplete';
import SafeIcon from '../../components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../../supabase/supabase';
import { getProfile, updateProfile } from '../../services/profileService';

const { FiUser, FiSettings, FiBell, FiMapPin, FiSave, FiCheck, FiAlertCircle, FiLoader } = FiIcons;

const ParentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        
        const profileData = await getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || '',
            email: user.email || '',
            phone: profileData.phone || '',
            address: profileData.address || ''
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (addressData) => {
    setFormData(prev => ({ ...prev, address: addressData.address }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      // Update profile with new data including address
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setStatus({ type: 'error', message: 'Failed to update profile.' });
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500">Manage your profile and preferences to improve your experience.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <SafeIcon icon={FiUser} className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-500">Update your personal information</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                  title="Email cannot be changed here"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-gray-50/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                  onSelect={handleAddressSelect}
                  placeholder="Search for your address..."
                  className="w-full"
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
                  <><SafeIcon icon={FiSave} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Location Section */}
        <LocationSettings />

        {/* Placeholder for other settings */}
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <SafeIcon icon={FiBell} className="text-gray-400 text-xl" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">Notification Preferences</h3>
          <p className="text-xs text-gray-500 mt-1">Coming soon: Choose how we notify you about bookings.</p>
        </div>
      </div>
    </div>
  );
};

export default ParentSettings;