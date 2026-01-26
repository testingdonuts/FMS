import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import * as FiIcons from 'react-icons/fi';
    import SafeIcon from '../common/SafeIcon';
    import supabase from '../../supabase/supabase';
    import { equipmentService } from '../../services/equipmentService';
    import toast from 'react-hot-toast';

    const { FiX, FiCalendar, FiMapPin, FiPhone, FiUser, FiAlertCircle } = FiIcons;

    export default function EquipmentRentalModal({ equipment, onClose, onSuccess }) {
      const [loading, setLoading] = useState(false);
      const [availability, setAvailability] = useState(null);
      const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        parent_first_name: '',
        parent_last_name: '',
        contact_phone: '',
        parent_address: '',
        pickup_address: '',
        return_method: 'pickup',
        notes: ''
      });

      useEffect(() => {
        loadUserProfile();
      }, []);

      useEffect(() => {
        if (formData.start_date && formData.end_date) {
          checkAvailability();
        }
      }, [formData.start_date, formData.end_date]);

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
              parent_address: profile.address || '',
              pickup_address: profile.address || ''
            }));
          }
        }
      }

      async function checkAvailability() {
        try {
          const isAvailable = await equipmentService.checkAvailability(
            equipment.id,
            formData.start_date,
            formData.end_date
          );
          setAvailability(isAvailable);
        } catch (error) {
          console.error('Availability check failed:', error);
          setAvailability(null);
        }
      }

      const calculateTotal = () => {
        if (!formData.start_date || !formData.end_date) return 0;
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return days > 0 ? days * equipment.rental_price_per_day : 0;
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (availability === false) {
          toast.error('Equipment is not available for these dates');
          return;
        }

        setLoading(true);
        try {
          const total_price = calculateTotal();
          await equipmentService.createRental({
            equipment_id: equipment.id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            total_price,
            deposit_amount: equipment.deposit_amount,
            parent_first_name: formData.parent_first_name,
            parent_last_name: formData.parent_last_name,
            contact_phone: formData.contact_phone,
            parent_address: formData.parent_address,
            pickup_address: formData.pickup_address,
            return_method: formData.return_method,
            notes: formData.notes
          });

          onSuccess();
        } catch (error) {
          console.error('Rental error:', error);
          toast.error(error.message || 'Failed to request rental');
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
                <h2 className="text-xl font-bold text-gray-900">Rent {equipment.name}</h2>
                <p className="text-sm text-gray-500">${equipment.rental_price_per_day}/day • ${equipment.deposit_amount} deposit</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <SafeIcon icon={FiX} className="text-xl text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Start Date</label>
                  <div className="relative">
                    <SafeIcon icon={FiCalendar} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">End Date</label>
                  <div className="relative">
                    <SafeIcon icon={FiCalendar} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      required
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      value={formData.end_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {availability === false && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                  <SafeIcon icon={FiAlertCircle} />
                  Equipment is unavailable for the selected dates.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">First Name</label>
                  <div className="relative">
                    <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.parent_first_name}
                      onChange={e => setFormData({ ...formData, parent_first_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Last Name</label>
                  <div className="relative">
                    <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.parent_last_name}
                      onChange={e => setFormData({ ...formData, parent_last_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Contact Phone</label>
                <div className="relative">
                  <SafeIcon icon={FiPhone} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.contact_phone}
                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Pickup/Delivery Address</label>
                <div className="relative">
                  <SafeIcon icon={FiMapPin} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.pickup_address}
                    onChange={e => setFormData({ ...formData, pickup_address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Return Method</label>
                <select
                  value={formData.return_method}
                  onChange={e => setFormData({ ...formData, return_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="pickup">I will drop it off</option>
                  <option value="dropoff">Please pick it up</option>
                </select>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="p-4 bg-indigo-50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Rental Fee</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Security Deposit</span>
                    <span>${equipment.deposit_amount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-indigo-700 pt-2 border-t border-indigo-100">
                    <span>Total Estimated</span>
                    <span>${calculateTotal() + equipment.deposit_amount}</span>
                  </div>
                </div>
              )}

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
                  disabled={loading || availability === false}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Request Rental'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      );
    }