import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMapPin, FiPhone, FiMail, FiGlobe, FiClock, FiDollarSign, FiX, FiExternalLink, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } = FiIcons;

const ListingPreview = ({ listing, onClose }) => {
  const formatOpeningHours = (hours) => {
    if (!hours) return {};
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, index) => ({
      name: dayNames[index],
      hours: hours[day]
    }));
  };

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'facebook': return FiFacebook;
      case 'twitter': return FiTwitter;
      case 'instagram': return FiInstagram;
      case 'linkedin': return FiLinkedin;
      default: return FiGlobe;
    }
  };

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
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{listing.name}</h2>
            <p className="text-gray-600">{listing.short_description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Hero Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Logo/Main Image */}
            <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
              {listing.logo_url ? (
                <img
                  src={listing.logo_url}
                  alt={listing.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-purple-100">
                  <div className="text-center">
                    <SafeIcon icon={FiGlobe} className="text-4xl text-blue-600 mb-2" />
                    <p className="text-gray-600">{listing.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiDollarSign} className="text-green-600" />
                <span className="font-semibold text-lg">{listing.price_range}</span>
              </div>

              <div className="flex items-start space-x-3">
                <SafeIcon icon={FiMapPin} className="text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">{listing.address}</p>
                  <p className="text-gray-600">{listing.zipcode}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiPhone} className="text-green-600" />
                <span>{listing.phone}</span>
              </div>

              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiMail} className="text-purple-600" />
                <a href={`mailto:${listing.email}`} className="text-blue-600 hover:underline">
                  {listing.email}
                </a>
              </div>

              {listing.website && (
                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiGlobe} className="text-blue-600" />
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    Visit Website
                    <SafeIcon icon={FiExternalLink} className="ml-1 text-sm" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          {listing.categories && listing.categories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {listing.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {listing.full_description}
            </p>
          </div>

          {/* Opening Hours */}
          {listing.opening_hours && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Opening Hours</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-3">
                  {formatOpeningHours(listing.opening_hours).map((day, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{day.name}</span>
                      <span className="text-gray-600">
                        {day.hours?.closed ? (
                          <span className="text-red-600">Closed</span>
                        ) : (
                          `${day.hours?.open || 'N/A'} - ${day.hours?.close || 'N/A'}`
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Services */}
          {listing.services && listing.services.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Services</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {listing.services.map((service, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      {service.price && (
                        <span className="text-green-600 font-semibold">{service.price}</span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-gray-600 text-sm">{service.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {listing.gallery_urls && listing.gallery_urls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Gallery</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {listing.gallery_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {listing.video_url && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Video</h3>
              <div className="bg-gray-100 rounded-lg p-4">
                <a
                  href={listing.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  Watch Video
                  <SafeIcon icon={FiExternalLink} className="ml-1" />
                </a>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {listing.payment_methods && listing.payment_methods.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Methods</h3>
              <div className="flex flex-wrap gap-2">
                {listing.payment_methods.map((method, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {listing.faqs && listing.faqs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {listing.faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {listing.social_links && Object.values(listing.social_links).some(link => link) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Connect With Us</h3>
              <div className="flex space-x-4">
                {Object.entries(listing.social_links).map(([platform, url]) => {
                  if (!url) return null;
                  const Icon = getSocialIcon(platform);
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <SafeIcon icon={Icon} className="text-xl" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ListingPreview;