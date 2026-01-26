import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheck, FiCalendar, FiClock, FiMapPin, FiPhone, FiMail, FiUser, FiCar, FiPrint, FiDownload, FiShare2, FiX } = FiIcons;

const BookingConfirmation = ({ booking, onClose, onNewBooking }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Booking Confirmation - FitMySeat',
      text: `My car seat service booking for ${formatDate(booking.booking_date)} at ${formatTime(booking.booking_date)}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Booking Confirmation: ${shareData.text}`);
      alert('Booking details copied to clipboard!');
    }
  };

  const handleDownload = () => {
    const bookingDetails = `
BOOKING CONFIRMATION
====================

Booking ID: ${booking.id}
Service: ${booking.service?.name || 'Car Seat Service'}
Date: ${formatDate(booking.booking_date)}
Time: ${formatTime(booking.booking_date)}
Address: ${booking.service_address}
Total: $${booking.total_price}

Parent: ${booking.parent_first_name} ${booking.parent_last_name}
Phone: ${booking.contact_phone}
${booking.child_name ? `Child: ${booking.child_name}${booking.child_age ? ` (${booking.child_age} years)` : ''}` : ''}
Vehicle: ${booking.vehicle_info}

${booking.notes ? `Notes: ${booking.notes}` : ''}

Thank you for choosing FitMySeat!
    `.trim();

    const blob = new Blob([bookingDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-confirmation-${booking.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!booking) {
    return null;
  }

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
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-green-50 border-b border-green-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="bg-green-500 p-3 rounded-full">
                <SafeIcon icon={FiCheck} className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">Booking Confirmed!</h2>
                <p className="text-green-700">Your appointment has been successfully scheduled</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl text-green-600" />
            </button>
          </div>
        </div>

        {/* Booking Details */}
        <div className="p-6 space-y-6">
          {/* Booking ID and Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-blue-900">Booking Reference</h3>
                <p className="text-blue-700 font-mono text-lg">#{booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-blue-900">Status</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                  <SafeIcon icon={FiClock} className="mr-1" />
                  Pending Confirmation
                </span>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Service Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <SafeIcon icon={FiUser} className="text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{booking.service?.name || 'Car Seat Service'}</p>
                    <p className="text-gray-600 text-sm">{booking.service?.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiCalendar} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{formatDate(booking.booking_date)}</p>
                    <p className="text-gray-600 text-sm">Appointment Date</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiClock} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{formatTime(booking.booking_date)}</p>
                    <p className="text-gray-600 text-sm">Appointment Time</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <SafeIcon icon={FiMapPin} className="text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{booking.service_address}</p>
                    <p className="text-gray-600 text-sm">Service Location</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Contact Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiUser} className="text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.parent_first_name} {booking.parent_last_name}
                    </p>
                    <p className="text-gray-600 text-sm">Parent/Guardian</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiPhone} className="text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{booking.contact_phone}</p>
                    <p className="text-gray-600 text-sm">Contact Number</p>
                  </div>
                </div>

                {booking.child_name && (
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiUser} className="text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.child_name}
                        {booking.child_age && ` (${booking.child_age} years)`}
                      </p>
                      <p className="text-gray-600 text-sm">Child</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiCar} className="text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">{booking.vehicle_info}</p>
                    <p className="text-gray-600 text-sm">Vehicle Information</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
              <p className="text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-green-900">Total Amount</h3>
              <p className="text-2xl font-bold text-green-900">${booking.total_price}</p>
            </div>
            <p className="text-green-700 text-sm mt-1">Payment will be collected at the time of service</p>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">What Happens Next?</h3>
            <div className="space-y-2 text-blue-700 text-sm">
              <div className="flex items-start space-x-2">
                <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <p>Our team will review your booking and confirm the appointment within 2 hours</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <p>You'll receive a confirmation call or text message with final details</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <p>Our certified technician will arrive at the scheduled time</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                <p>Payment is due at the completion of service</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Need to Make Changes?</h3>
            <p className="text-yellow-700 text-sm mb-3">
              If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiPhone} className="text-yellow-600" />
                <span className="text-yellow-700">(555) 987-6543</span>
              </div>
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiMail} className="text-yellow-600" />
                <span className="text-yellow-700">support@fitmyseat.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SafeIcon icon={FiPrint} />
              <span>Print</span>
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SafeIcon icon={FiDownload} />
              <span>Download</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SafeIcon icon={FiShare2} />
              <span>Share</span>
            </button>
            
            <div className="flex-1"></div>
            
            <button
              onClick={onNewBooking}
              className="flex items-center justify-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <SafeIcon icon={FiCalendar} />
              <span>Book Another Service</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BookingConfirmation;