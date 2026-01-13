import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPackage, FiCalendar, FiUser, FiMapPin, FiCheck, FiX, FiClock, FiEdit, FiCreditCard } = FiIcons;

const RentalCard = ({ rental, onUpdate, onEdit, onPay, userRole }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return FiClock;
      case 'active':
        return FiCheck;
      case 'completed':
        return FiCheck;
      case 'cancelled':
        return FiX;
      default:
        return FiClock;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDays = () => {
    const start = new Date(rental.start_date);
    const end = new Date(rental.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStatusUpdate = (newStatus) => {
    if (confirm(`Are you sure you want to ${newStatus} this rental?`)) {
      onUpdate(rental.id, { status: newStatus });
    }
  };

  const renderActions = () => {
    // Parent Actions
    if (userRole === 'parent') {
      if (['pending', 'active'].includes(rental.status)) {
        return (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            {/* Payment Button */}
            {rental.payment_status === 'unpaid' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPay(rental)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiCreditCard} />
                <span>Pay Now (${rental.total_price})</span>
              </motion.button>
            )}

            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onEdit(rental)}
                className="flex-1 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-1"
              >
                <SafeIcon icon={FiEdit} />
                <span>Edit Details</span>
              </motion.button>
              <button
                onClick={() => handleStatusUpdate('cancelled')}
                className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                {rental.status === 'active' ? 'Return Early' : 'Cancel Request'}
              </button>
            </div>
          </div>
        );
      }
      return null;
    }

    // Organization Actions
    if (['pending', 'active'].includes(rental.status)) {
      return (
        <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
          {rental.status === 'pending' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStatusUpdate('active')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Approve Rental
            </motion.button>
          )}
          {rental.status === 'active' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStatusUpdate('completed')}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark Returned
            </motion.button>
          )}
          <button
            onClick={() => handleStatusUpdate('cancelled')}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-4">
            {rental.equipment?.image_urls?.[0] && (
              <img
                src={rental.equipment.image_urls[0]}
                alt={rental.equipment.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {rental.equipment?.name}
              </h3>
              <p className="text-gray-600">{rental.equipment?.category}</p>
              <p className="text-sm text-gray-500">Rental #{rental.id.slice(0, 8)}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}
          >
            <SafeIcon icon={getStatusIcon(rental.status)} className="inline mr-1" />
            {rental.status}
          </span>
        </div>

        {/* Rental Details */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <SafeIcon icon={FiCalendar} className="mr-2" />
              <span>
                {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <SafeIcon icon={FiClock} className="mr-2" />
              <span>{calculateDays()} days</span>
            </div>
          </div>
          <div className="space-y-2">
            {rental.pickup_address && (
              <div className="flex items-center text-gray-600">
                <SafeIcon icon={FiMapPin} className="mr-2" />
                <span>{rental.pickup_address}</span>
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <SafeIcon icon={FiPackage} className="mr-2" />
              <span>Return: {rental.return_method}</span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {userRole !== 'parent' && rental.parent && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Name: {rental.parent.full_name}</p>
              <p>Email: {rental.parent.email}</p>
              {rental.parent.phone && <p>Phone: {rental.parent.phone}</p>}
            </div>
          </div>
        )}

        {/* Notes */}
        {rental.notes && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{rental.notes}</p>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center text-sm text-blue-700">
            <span>Daily Rate:</span>
            <span>${rental.equipment?.rental_price_per_day}/day</span>
          </div>
          <div className="flex justify-between items-center text-sm text-blue-700">
            <span>Duration:</span>
            <span>{calculateDays()} days</span>
          </div>
          {rental.deposit_amount > 0 && (
            <div className="flex justify-between items-center text-sm text-blue-700">
              <span>Security Deposit:</span>
              <span>${rental.deposit_amount}</span>
            </div>
          )}
          <div className="border-t border-blue-200 pt-2 mt-2">
            <div className="flex justify-between items-center font-medium text-blue-900">
              <span>Total:</span>
              <span>${rental.total_price}</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-600">Payment Status:</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium flex items-center ${
              rental.payment_status === 'paid' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {rental.payment_status === 'paid' && <SafeIcon icon={FiCheck} className="mr-1" />}
            {rental.payment_status.toUpperCase()}
          </span>
        </div>

        {/* Actions */}
        {renderActions()}

        {userRole === 'parent' && rental.status === 'pending' && (
          <div className="text-center mt-2">
            <p className="text-sm text-gray-600">
              Your rental request is pending approval.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RentalCard;