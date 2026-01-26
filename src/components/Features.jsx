import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMapPin, FiEye, FiShield, FiZap, FiHeart, FiTrendingUp } = FiIcons;

const Features = () => {
  const features = [
    {
      icon: FiMapPin,
      title: "Interactive Seat Maps",
      description: "View detailed 3D seat maps with real-time availability and pricing for every venue.",
      color: "blue"
    },
    {
      icon: FiEye,
      title: "View from Seat",
      description: "See exactly what your view will be like with our 360° seat preview technology.",
      color: "green"
    },
    {
      icon: FiShield,
      title: "Secure Booking",
      description: "Book with confidence using our secure payment system and instant confirmation.",
      color: "purple"
    },
    {
      icon: FiZap,
      title: "Instant Booking",
      description: "Reserve your perfect seat in seconds with our lightning-fast booking system.",
      color: "yellow"
    },
    {
      icon: FiHeart,
      title: "Personalized Recommendations",
      description: "Get seat suggestions based on your preferences and booking history.",
      color: "red"
    },
    {
      icon: FiTrendingUp,
      title: "Price Tracking",
      description: "Monitor seat prices and get notified when your desired seats go on sale.",
      color: "indigo"
    }
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    indigo: "bg-indigo-100 text-indigo-600"
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose FitMySeat?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We make finding and booking the perfect seat simple, secure, and seamless. 
            Discover features designed to enhance your event experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color]} flex items-center justify-center mb-6`}>
                <SafeIcon icon={feature.icon} className="text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;