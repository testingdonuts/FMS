import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { equipmentService } from '../../services/equipmentService';
import { serviceManagementService } from '../../services/serviceManagementService';
import { calculatePlatformFee } from '../../utils/feeUtils';
import { useAuth } from '../../hooks/useAuth';

const { FiX, FiCalendar, FiDollarSign, FiInfo, FiCreditCard, FiCheck, FiMessageSquare, FiAlertCircle, FiUser, FiPhone, FiMapPin, FiArrowRight } = FiIcons;

const EquipmentRentalModal = ({ isOpen, onClose, equipment, onRentalComplete, userId }) => {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
    parentFirstName: '',
    parentLastName: '',
    contactPhone: '',
    parentAddress: ''
  });
  const [pricing, setPricing] = useState({ 
    dailyRate: 0, 
    totalDays: 0, 
    totalPrice: 0, 
    platformFee: 0, 
    depositAmount: 0 
  });
  const [availability, setAvailability] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orgTier, setOrgTier] = useState('Free');

  useEffect(() => {
    if (equipment) {
      setPricing(prev => ({
        ...prev,
        dailyRate: equipment.rental_price_per_day,
        depositAmount: equipment.deposit_amount || 0
      }));
      loadOrgTier();
    }
    if (profile) {
      const names = profile.full_name?.split(' ') || ['', ''];
      setFormData(prev => ({
        ...prev,
        parentFirstName: names[0] || '',
        parentLastName: names.slice(1).join(' ') || '',
        contactPhone: profile.phone || '',
        parentAddress: ''
      }));
    }
  }, [equipment, profile]);

  const loadOrgTier = async () => {
    if (!equipment?.organization_id) return;
    const { data } = await serviceManagementService.getOrganizationById(equipment.organization_id);
    if (data) setOrgTier(data.subscription_tier || 'Free');
  };

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      calculatePricingDetails();
      checkAvailability();
    }
  }, [formData.startDate, formData.endDate, orgTier]);

  const calculatePricingDetails = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (days > 0) {
      const subtotal = equipment.rental_price_per_day * days;
      const fee = calculatePlatformFee(subtotal, orgTier);
      setPricing(prev => ({ ...prev, totalDays: days, totalPrice: subtotal, platformFee: fee }));
    } else {
      setPricing(prev => ({ ...prev, totalDays: 0, totalPrice: 0, platformFee: 0 }));
    }
  };

  const checkAvailability = async () => {
    if (!equipment || !formData.startDate || !formData.endDate) return;
    setCheckingAvailability(true);
    const { data, error } = await equipmentService.checkAvailability(
      equipment.id,
      formData.startDate,
      formData.endDate
    );
    if (error) {
      setError('Error checking availability');
    } else {
      setAvailability(data);
      if (!data) setError('Equipment is not available for these dates');
      else setError('');
    }
    setCheckingAvailability(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.startDate || !formData.endDate) {
        setError('Please select both start and end dates');
        return;
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        setError('End date must be after start date');
        return;
      }
      if (!availability) {
        setError('Equipment is not available for selected dates');
        return;
      }
    }
    if (step === 2) {
      if (!formData.parentFirstName || !formData.parentLastName || !formData.contactPhone || !formData.parentAddress) {
        setError('Please provide all contact information including address');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmitRental = async () => {
    setLoading(true);
    setError('');
    try {
      const rentalData = {
        equipmentId: equipment.id,
        organizationId: equipment.organization_id,
        renterId: userId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalPrice: pricing.totalPrice,
        platformFee: pricing.platformFee,
        depositAmount: pricing.depositAmount,
        status: 'pending',
        notes: formData.notes,
        parentFirstName: formData.parentFirstName,
        parentLastName: formData.parentLastName,
        contactPhone: formData.contactPhone,
        parentAddress: formData.parentAddress
      };

      const { data, error: submitError } = await equipmentService.createRental(rentalData);

      if (submitError) {
        setError(submitError);
      } else {
        setStep(4);
        setTimeout(() => {
          onRentalComplete(data);
          onClose();
          resetModal();
        }, 2500);
      }
    } catch (err) {
      setError('Failed to create rental. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setFormData(prev => ({ ...prev, startDate: '', endDate: '', notes: '' }));
    setError('');
  };

  if (!equipment) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <SafeIcon icon={FiCalendar} />
                </div>
                <h2 className="text-2xl font-black text-navy">Rent Equipment</h2>
              </div>
              <button onClick={() => { onClose(); resetModal(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <SafeIcon icon={FiX} className="text-xl text-gray-400" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-8 px-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {step > num ? <SafeIcon icon={FiCheck} /> : num}
                  </div>
                  {num < 3 && <div className={`h-1 flex-1 mx-2 rounded-full ${step > num ? 'bg-blue-600' : 'bg-gray-100'}`} />}
                </div>
              ))}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-600">
                <SafeIcon icon={FiAlertCircle} className="flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </motion.div>
            )}

            <div className="text-left">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6">
                    <h3 className="font-bold text-navy mb-1">{equipment.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">${equipment.rental_price_per_day} per day</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-navy uppercase tracking-widest">Start Date</label>
                      <input type="date" name="startDate" min={new Date().toISOString().split('T')[0]} value={formData.startDate} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-navy uppercase tracking-widest">End Date</label>
                      <input type="date" name="endDate" min={formData.startDate || new Date().toISOString().split('T')[0]} value={formData.endDate} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                    </div>
                  </div>
                  {checkingAvailability && (
                    <div className="flex items-center space-x-2 text-blue-600 py-2">
                      <FiIcons.FiLoader className="animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-widest">Checking availability...</span>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-navy uppercase tracking-widest">First Name</label>
                      <div className="relative">
                        <SafeIcon icon={FiUser} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" name="parentFirstName" value={formData.parentFirstName} onChange={handleInputChange} className="w-full pl-10 p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-navy uppercase tracking-widest">Last Name</label>
                      <div className="relative">
                        <SafeIcon icon={FiUser} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" name="parentLastName" value={formData.parentLastName} onChange={handleInputChange} className="w-full pl-10 p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-navy uppercase tracking-widest">Contact Phone</label>
                    <div className="relative">
                      <SafeIcon icon={FiPhone} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} className="w-full pl-10 p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-navy uppercase tracking-widest">Home Address</label>
                    <div className="relative">
                      <SafeIcon icon={FiMapPin} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" name="parentAddress" value={formData.parentAddress} onChange={handleInputChange} placeholder="Street, City, State, ZIP" className="w-full pl-10 p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Rental Duration:</span>
                      <span className="font-bold text-navy">{pricing.totalDays} Days</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Subtotal:</span>
                      <span className="font-bold text-navy">${pricing.totalPrice.toFixed(2)}</span>
                    </div>
                    {/* Platform Fee removed from total calculation for parent, but stored internally */}
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-lg font-black text-navy">Total Due:</span>
                      {/* Only Total Price + Deposit. Fee is internal. */}
                      <span className="text-2xl font-black text-blue-600">
                        ${(pricing.totalPrice + pricing.depositAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-navy uppercase tracking-widest flex items-center">
                      <SafeIcon icon={FiMessageSquare} className="mr-2" /> Special Instructions
                    </label>
                    <textarea placeholder="Any specific requests or info about your vehicle..." name="notes" value={formData.notes} onChange={handleInputChange} rows={4} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                    <SafeIcon icon={FiInfo} className="text-blue-600 mt-1" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      By clicking "Complete Rental", you agree to the rental terms and conditions of {equipment.organization?.name || 'the provider'}.
                    </p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SafeIcon icon={FiCheck} className="text-4xl" />
                  </div>
                  <h3 className="text-2xl font-black text-navy mb-2">Request Sent!</h3>
                  <p className="text-gray-500">The organization has been notified and will confirm your rental shortly.</p>
                </motion.div>
              )}
            </div>

            {step < 4 && (
              <div className="flex space-x-3 mt-10 pt-6 border-t border-gray-50">
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)} className="flex-1 py-4 px-6 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all">
                    Back
                  </button>
                )}
                <button onClick={step === 3 ? handleSubmitRental : handleNextStep} disabled={loading || (step === 1 && checkingAvailability)} className="flex-[2] bg-blue-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-2 disabled:opacity-50" >
                  {loading ? (
                    <FiIcons.FiLoader className="animate-spin" />
                  ) : (
                    <>
                      <span>{step === 3 ? 'Complete Rental' : 'Next Step'}</span>
                      {step < 3 && <FiArrowRight />}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EquipmentRentalModal;