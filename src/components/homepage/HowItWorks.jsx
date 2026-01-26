import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiCalendar, FiCheckCircle } = FiIcons;

const HowItWorks = () => {
  const steps = [
    {
      icon: FiSearch,
      title: "Search",
      description: "Find an expert technician, service, or rental equipment in your area using our simple search.",
    },
    {
      icon: FiCalendar,
      title: "Book",
      description: "Choose a service, select a convenient date and time, and book your appointment in minutes.",
    },
    {
      icon: FiCheckCircle,
      title: "Fit",
      description: "Get your child's car seat professionally installed or inspected for peace of mind.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get peace of mind in three simple steps.
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 hidden md:block" aria-hidden="true"></div>
          <div className="relative grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-teal-100 text-teal-600 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold">
                    <SafeIcon icon={step.icon} />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-navy mb-3">{index + 1}. {step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;