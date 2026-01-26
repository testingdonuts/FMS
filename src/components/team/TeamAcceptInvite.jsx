import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { teamService } from '../../services/teamService';

const { FiUserPlus, FiLock, FiUser, FiPhone, FiCheck, FiX, FiLoader, FiAlertCircle } = FiIcons;

const TeamAcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteCode = searchParams.get('code');
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (inviteCode) {
      validateInvitation();
    } else {
      setError('No invitation code provided');
      setLoading(false);
    }
  }, [inviteCode]);

  const validateInvitation = async () => {
    setLoading(true);
    const { data, error } = await teamService.validateInvitationCode(inviteCode);
    if (error) {
      setError(error);
    } else {
      setInvitation(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Updated validation: 8 characters minimum
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const { error: inviteError } = await teamService.acceptInvitation(inviteCode, formData);

    if (inviteError) {
      setError(inviteError);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <SafeIcon icon={FiLoader} className="text-4xl text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <SafeIcon icon={FiUserPlus} className="text-blue-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Join the Team</h2>
          <p className="text-gray-500">Invitation for {invitation?.email}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3">
            <SafeIcon icon={FiAlertCircle} className="text-xl flex-shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <SafeIcon icon={FiCheck} className="text-5xl text-green-500 mx-auto mb-4" />
            <p className="font-bold text-gray-900">Welcome aboard!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative text-left">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
              <div className="relative">
                <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="relative text-left">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Password (Min 8 chars)</label>
              <div className="relative">
                <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="relative text-left">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Confirm Password</label>
              <div className="relative">
                <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={submitting}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Creating Account...' : 'Accept & Join'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default TeamAcceptInvite;