import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiEye, FiCreditCard, FiCheck } = FiIcons;

const HowItWorks = () => {
  const steps = [
    {
      icon: FiSearch,
      title: "Search Events",
      description: "Browse thousands of events and venues to find what you're looking for.",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop"
    },
    {
      icon: FiEye,
      title: "Preview Your View",
      description: "See exactly what your view will be like from any seat with our 3D preview.",
      image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop"
    },
    {
      icon: FiCreditCard,
      title: "Secure Payment",
      description: "Complete your booking with our secure payment system in just a few clicks.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop"
    },
    {
      icon: FiCheck,
      title: "Enjoy the Event",
      description: "Get instant confirmation and enjoy your perfectly selected seat at the event.",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Finding your perfect seat is easier than ever. Follow these simple steps 
            to book your ideal seat for any event.
          </p>
        </motion.div>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex items-center mb-6">
                  <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    {index + 1}
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <SafeIcon icon={step.icon} className="text-blue-600 text-2xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {step.description}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Learn More
                </motion.button>
              </div>
              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    className="rounded-2xl shadow-2xl w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl"></div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;