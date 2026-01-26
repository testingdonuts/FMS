import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth.jsx';
import { useBooking } from '../context/BookingContext';
import { teamService } from '../services/teamService';
import RoleSelection from './RoleSelection';

const { FiX, FiMail, FiLock, FiUser, FiPhone, FiArrowLeft, FiAlertCircle, FiKey, FiCheck } = FiIcons;

const AuthModal = ({ isOpen, onClose }) => {
  const { authMetadata } = useBooking();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'reset'
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: '',
    organizationName: '',
    inviteCode: '',
  });

  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const { signIn, signUp, sendPasswordReset, resetPassword, loading } = useAuth();

  useEffect(() => {
    if (isOpen) {
      const { preferredRole, initialMode } = authMetadata;
      setMode(initialMode || 'login');
      if (preferredRole) {
        setFormData(prev => ({ ...prev, role: preferredRole }));
        setShowRoleSelection(false);
      } else if (initialMode === 'signup') {
        setShowRoleSelection(true);
      }
    }
  }, [isOpen, authMetadata]);

  const validateForm = () => {
    const errors = {};
    if (!formData.email && mode !== 'reset') {
      errors.email = 'Email is required';
    } else if (mode !== 'reset' && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (mode !== 'forgot') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
    }

    if (mode === 'signup') {
      if (!formData.fullName) {
        errors.fullName = 'Full name is required';
      }
      if (!formData.role) {
        errors.role = 'Please select your role';
      }
      if (formData.role === 'organization' && !formData.organizationName) {
        errors.organizationName = 'Organization name is required';
      }
      if (formData.role === 'team_member' && !formData.inviteCode) {
        errors.inviteCode = 'Invitation code is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) return;

    if (mode === 'login') {
      const { error } = await signIn(formData.email, formData.password);
      if (error) setError(error);
      else onClose();
    } else if (mode === 'signup') {
      if (!formData.role) {
        setShowRoleSelection(true);
        return;
      }

      let signUpData = {
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        organizationName: formData.organizationName,
        inviteCode: formData.inviteCode
      };

      if (formData.role === 'team_member') {
        const { data: inviteData, error: inviteError } = await teamService.validateInvitationCode(formData.inviteCode);
        if (inviteError || !inviteData) {
          setError(inviteError || 'Invalid invitation code');
          return;
        }
        signUpData.organizationId = inviteData.organization_id;
        signUpData.teamRole = inviteData.role;
      }

      const { error } = await signUp(formData.email, formData.password, signUpData);
      if (error) setError(error);
      else {
        setError('Account created successfully! Please check your email to verify your account.');
        setTimeout(onClose, 3000);
      }
    } else if (mode === 'forgot') {
      const { error } = await sendPasswordReset(formData.email);
      if (error) setError(error);
      else {
        setError('Recovery link sent! Please check your email.');
        setTimeout(() => setMode('login'), 3000);
      }
    } else if (mode === 'reset') {
      const { error } = await resetPassword(formData.password);
      if (error) setError(error);
      else {
        setError('Password updated successfully!');
        setTimeout(() => setMode('login'), 3000);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    setShowRoleSelection(false);
  };

  const resetInputState = () => {
    setFormData(prev => ({ ...prev, email: '', password: '' }));
    setError('');
    setValidationErrors({});
    setShowRoleSelection(false);
  };

  const renderInput = (name, type, placeholder, icon, required = false) => (
    <div>
      <div className="relative">
        <SafeIcon icon={icon} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          required={required}
          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors[name] ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
      </div>
      {validationErrors[name] && (
        <p className="text-red-600 text-sm mt-1 flex items-center">
          <SafeIcon icon={FiAlertCircle} className="mr-1" /> {validationErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              {(showRoleSelection || mode === 'forgot') && (
                <button onClick={() => { if(mode === 'forgot') setMode('login'); else setShowRoleSelection(false); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <SafeIcon icon={FiArrowLeft} className="text-xl" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {showRoleSelection ? 'Choose Your Role' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Recover Password' : 'New Password'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><SafeIcon icon={FiX} className="text-xl" /></button>
            </div>

            {error && (
              <div className={`mb-4 p-3 border rounded-lg flex items-start gap-3 ${error.includes('sent') || error.includes('successfully') ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <SafeIcon icon={error.includes('successfully') || error.includes('sent') ? FiCheck : FiAlertCircle} className="text-xl mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {showRoleSelection && mode === 'signup' ? (
              <RoleSelection onRoleSelect={handleRoleSelect} selectedRole={formData.role} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <button type="button" onClick={() => setShowRoleSelection(true)} className={`w-full p-3 border rounded-lg text-left ${formData.role ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                      {formData.role ? `Selected: ${formData.role}` : 'Click to select your role...'}
                    </button>
                    {renderInput('fullName', 'text', 'Full Name', FiUser, true)}
                    {formData.role === 'organization' && renderInput('organizationName', 'text', 'Organization Name', FiUser, true)}
                    {formData.role === 'team_member' && renderInput('inviteCode', 'text', 'Invitation Code', FiKey, true)}
                  </>
                )}

                {mode !== 'reset' && renderInput('email', 'email', 'Email Address', FiMail, true)}
                {mode !== 'forgot' && renderInput('password', 'password', mode === 'reset' ? 'New Password' : 'Password', FiLock, true)}
                
                {mode === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => setMode('forgot')} className="text-sm text-blue-600 font-bold hover:underline">Forgot Password?</button>
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Update Password'}
                </motion.button>
              </form>
            )}

            {!showRoleSelection && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetInputState(); }} className="text-blue-600 font-bold">
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;