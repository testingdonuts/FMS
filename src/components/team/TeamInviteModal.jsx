import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { teamService } from '../../services/teamService';

const { FiX, FiMail, FiUser, FiSend, FiUserPlus, FiAlertCircle, FiZap, FiCheckCircle } = FiIcons;

const TeamInviteModal = ({ isOpen, onClose, onSendInvite, organizationId, onUpgrade }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'technician',
  });
  const [errors, setErrors] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && organizationId) {
      loadStats();
    }
  }, [isOpen, organizationId]);

  const loadStats = async () => {
    const data = await teamService.getTeamStats(organizationId);
    setStats(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (stats?.remaining <= 0) {
      setErrors({ submit: "Your current plan limit has been reached." });
      return;
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      const result = await onSendInvite(formData);
      
      if (result?.error) {
        // If the database trigger fails (e.g., limit reached or extension missing), catch it here
        setErrors({ submit: result.error });
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (err) {
      setErrors({ submit: "An unexpected error occurred while sending the invitation." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (errors.submit) setErrors((prev) => ({ ...prev, submit: '' }));
  };

  const roleOptions = [
    { value: 'technician', label: 'Technician', description: 'Access to schedule and services.' },
    { value: 'manager', label: 'Manager', description: 'Can manage team members and reports.' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Invite Member</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <SafeIcon icon={FiCheckCircle} className="text-green-600 text-4xl" />
                </div>
                <p className="text-green-800 font-bold">Invitation Sent Successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3">
                    <SafeIcon icon={FiAlertCircle} className="text-xl flex-shrink-0 mt-0.5" />
                    <p className="font-medium">{errors.submit}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <SafeIcon icon={FiMail} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="expert@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-xs mt-2 flex items-center">
                      <SafeIcon icon={FiAlertCircle} className="mr-1" /> {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700">Assign Role</label>
                  {roleOptions.map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-start gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                        formData.role === role.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-bold text-navy text-sm">{role.label}</p>
                        <p className="text-xs text-gray-500">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <FiIcons.FiLoader className="animate-spin" /> : <SafeIcon icon={FiSend} />}
                  <span>{loading ? 'Sending...' : 'Send Invitation'}</span>
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamInviteModal;