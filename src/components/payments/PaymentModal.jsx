import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiCreditCard, FiLock, FiCheck, FiAlertCircle } = FiIcons;

const PaymentModal = ({ isOpen, onClose, item, type, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'processing' | 'success'
  
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'number') formattedValue = formatCardNumber(value);
    if (name === 'expiry') formattedValue = formatExpiry(value);
    if (name === 'cvc') formattedValue = value.replace(/[^0-9]/g, '').slice(0, 4);

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (cardData.number.length < 16) {
      setError('Please enter a valid card number');
      return;
    }
    if (cardData.cvc.length < 3) {
      setError('Invalid CVC');
      return;
    }

    setLoading(true);
    setStep('processing');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Call the actual payment handler passed from parent
      await onPaymentComplete(item.id, type);
      setStep('success');
      setTimeout(() => {
        onClose();
        setStep('input');
        setCardData({ number: '', expiry: '', cvc: '', name: '' });
      }, 2000);
    } catch (err) {
      setStep('input');
      setError('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiLock} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">Secure Payment</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>

        <div className="p-6">
          {step === 'processing' ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Processing Payment...</p>
              <p className="text-sm text-gray-500 mt-2">Please do not close this window</p>
            </div>
          ) : step === 'success' ? (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiCheck} className="text-green-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600">Your transaction has been completed.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${item?.total_price || item?.totalPrice || '0.00'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">
                    {type === 'booking' ? item?.service?.name : item?.equipment?.name}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
                  <SafeIcon icon={FiAlertCircle} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    name="name"
                    value={cardData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <div className="relative">
                    <SafeIcon icon={FiCreditCard} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="number"
                      value={cardData.number}
                      onChange={handleChange}
                      required
                      placeholder="0000 0000 0000 0000"
                      maxLength="19"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      name="expiry"
                      value={cardData.expiry}
                      onChange={handleChange}
                      required
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                    <input
                      type="text"
                      name="cvc"
                      value={cardData.cvc}
                      onChange={handleChange}
                      required
                      placeholder="123"
                      maxLength="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiLock} />
                <span>Pay Now</span>
              </motion.button>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center">
                  <SafeIcon icon={FiLock} className="mr-1" />
                  Payments are secure and encrypted
                </p>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PaymentModal;