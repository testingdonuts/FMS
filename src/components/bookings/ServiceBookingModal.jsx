import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import * as FiIcons from 'react-icons/fi';
    import SafeIcon from '../common/SafeIcon';
    import supabase from '../../supabase/supabase';
    import { bookingService } from '../../services/bookingService';
    import toast from 'react-hot-toast';

    const { FiX, FiCalendar, FiClock, FiMapPin, FiPhone, FiUser, FiInfo, FiCheck } = FiIcons;

    export default function ServiceBookingModal({ service, onClose, onSuccess }) {
      const [loading, setLoading] = useState(false);
      const [loadingSlots, setLoadingSlots] = useState(false);
      const [availableSlots, setAvailableSlots] = useState([]);
      const [formData, setFormData] = useState({
        booking_date: '',
        booking_time: '',
        parent_first_name: '',
        parent_last_name: '',
        contact_phone: '',
        service_address: '',
        vehicle_info: '',
        notes: ''
      });

      useEffect(() => {
        loadUserProfile();
      }, []);

      useEffect(() => {
        if (formData.booking_date) {
          fetchSlots();
        }
      }, [formData.booking_date]);

      async function loadUserProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            const [firstName, ...lastName] = (profile.full_name || '').split(' ');
            setFormData(prev => ({
              ...prev,
              parent_first_name: firstName || '',
              parent_last_name: lastName.join(' ') || '',
              contact_phone: profile.phone || '',
              service_address: profile.address || ''
            }));
          }
        }
      }

      async function fetchSlots() {
        setLoadingSlots(true);
        try {
          const slots = await bookingService.getAvailableSlots(service.id, formData.booking_date);
          setAvailableSlots(slots);
          // Auto-select first slot if available
          if (slots.length > 0) {
            setFormData(prev => ({ ...prev, booking_time: slots[0] }));
          }
        } catch (error) {
          console.error('Failed to fetch slots:', error);
          toast.error('Could not load time slots');
        } finally {
          setLoadingSlots(false);
        }
      }

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.booking_time) {
          toast.error('Please select a time slot');
          return;
        }

        setLoading(true);
        try {
          const combinedDateTime = new Date(`${formData.booking_date}T${formData.booking_time}`);
          
          await bookingService.createBooking({
            service_id: service.id,
            org_id: service.organization_id,
            booking_date: combinedDateTime.toISOString(),
            parent_first_name: formData.parent_first_name,
            parent_last_name: formData.parent_last_name,
            contact_phone: formData.contact_phone,
            service_address: formData.service_address,
            vehicle_info: formData.vehicle_info,
            notes: formData.notes,
            total_price: service.price
          });

          onSuccess();
        } catch (error) {
          console.error('Booking error:', error);
          toast.error(error.message || 'Failed to book service');
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Book {service.name}</h2>
                <p className="text-sm text-gray-500">${service.price} • {service.duration_minutes} minutes</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <SafeIcon icon={FiX} className="text-xl text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">1. Select Date</label>
                  <div className="relative">
                    <SafeIcon icon={FiCalendar} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.booking_date}
                      onChange={e => setFormData({ ...formData, booking_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {formData.booking_date && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">2. Select Time Slot</label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-indigo-600 py-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span className="text-sm">Checking available slots...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableSlots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setFormData({ ...formData, booking_time: slot })}
                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-1 ${
                              formData.booking_time === slot
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >
                            {formData.booking_time === slot && <SafeIcon icon={FiCheck} className="text-xs" />}
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-700 text-sm flex items-center gap-2">
                        <SafeIcon icon={FiInfo} />
                        No slots available for this date. Please try another day.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-4">
                <label className="text-sm font-semibold text-gray-700">3. Contact Details</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="First Name"
                        value={formData.parent_first_name}
                        onChange={e => setFormData({ ...formData, parent_first_name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Last Name"
                        value={formData.parent_last_name}
                        onChange={e => setFormData({ ...formData, parent_last_name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <SafeIcon icon={FiPhone} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={formData.contact_phone}
                      onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <SafeIcon icon={FiMapPin} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Service / Meeting Address"
                      value={formData.service_address}
                      onChange={e => setFormData({ ...formData, service_address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Additional notes or vehicle info..."
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.booking_time}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      );
    }