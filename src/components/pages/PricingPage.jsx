import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../layout/MainLayout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useBooking } from '../../context/BookingContext';

const { FiCheck, FiArrowRight, FiTag, FiTrendingDown } = FiIcons;

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { openAuthModal } = useBooking();

  const plans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      description: 'Perfect for individual technicians getting started.',
      features: [
        'Full business listing',
        'Online fitment bookings',
        'Basic hire/equipment management',
        'Customer comms',
        'AI Chatbot & FAQ support',
        'Community support forum',
        'Payment processing',
        'Booking management',
        '3% platform fee',
      ],
      cta: 'Get Started for Free',
      popular: false,
    },
    {
      name: 'Professional',
      monthlyPrice: 6,
      description: 'Enhanced visibility and tools for growing businesses.',
      features: [
        'Everything in Free',
        'Featured listings',
        'Full hire/equipment management',
        'Advanced analytics & insights',
        'Live chat with your clients',
        'Automatic client reminders',
        'Priority email/chat support',
        '2.5% platform fee',
      ],
      cta: 'Start Pro Plan',
      popular: true,
    },
    {
      name: 'Teams',
      monthlyPrice: 12,
      description: 'Advanced management for larger organizations.',
      features: [
        'Everything in Professional',
        'Unlimited team members',
        'Multi-location management',
        'Role & permission management',
        'Multi-location support',
        'Centralized billing & reporting',
        'API / Custom integrations*',
        '2.25% platform fee',
      ],
      cta: 'Choose Teams',
      popular: false,
    },
  ];

  const calculateAnnual = (monthly) => {
    const original = monthly * 12;
    const discount = original * 0.2;
    const final = original - discount;
    return { original, discount, final };
  };

  const handleCtaClick = (plan) => {
    // Lead directly to Organization Sign Up
    openAuthModal({ role: 'organization', mode: 'signup' });
  };

  return (
    <MainLayout>
      <div className="bg-white">
        <div className="text-center py-20 px-4 bg-gray-50 border-b border-gray-200">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-navy tracking-tight"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Choose the plan that fits your business size. Save 20% by switching to annual billing.
          </motion.p>

          <div className="mt-10 flex justify-center">
            <div className="bg-white p-1.5 rounded-2xl flex items-center space-x-1 shadow-xl border border-gray-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                  billingCycle === 'monthly' ? 'bg-navy text-white shadow-lg' : 'text-gray-500 hover:text-navy'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all relative ${
                  billingCycle === 'yearly' ? 'bg-navy text-white shadow-lg' : 'text-gray-500 hover:text-navy'
                }`}
              >
                12 Months – Pay Upfront
                <span className="absolute -top-4 -right-4 bg-teal-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-md animate-bounce">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, index) => {
              const { original, discount, final } = calculateAnnual(plan.monthlyPrice);
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col bg-white rounded-3xl p-8 border-2 transition-all hover:scale-[1.02] ${
                    plan.popular
                      ? 'border-teal-500 shadow-2xl relative ring-8 ring-teal-500/5'
                      : 'border-gray-100 shadow-xl'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-teal-500 text-white text-xs font-bold px-5 py-2 rounded-full uppercase tracking-widest shadow-lg flex items-center space-x-2">
                        <SafeIcon icon={FiTrendingDown} />
                        <span>Most Popular Value</span>
                      </span>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-navy">{plan.name}</h3>
                    <div className="mt-6 min-h-[100px] flex flex-col justify-center">
                      {billingCycle === 'monthly' || plan.monthlyPrice === 0 ? (
                        <div className="flex items-baseline">
                          <span className="text-5xl font-black text-navy">${plan.monthlyPrice}</span>
                          <span className="text-gray-400 ml-2 font-medium">/ month</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-400">
                            <span className="text-lg line-through font-medium">${original.toFixed(2)}</span>
                            <span className="text-xs font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-md uppercase">
                              Save 20%
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="text-5xl font-black text-navy">${final.toFixed(2)}</span>
                            <span className="text-gray-400 ml-2 font-medium">/ year</span>
                          </div>
                          <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">
                            Total Savings: ${discount.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start space-x-3 group">
                        <div className="mt-1 bg-teal-50 rounded-full p-0.5 group-hover:bg-teal-500 group-hover:text-white transition-all">
                          <SafeIcon icon={FiCheck} className="text-teal-600 group-hover:text-white text-sm" />
                        </div>
                        <span className="text-gray-700 text-sm leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handleCtaClick(plan)}
                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 group ${
                      plan.popular
                        ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-xl shadow-teal-500/20'
                        : 'bg-navy text-white hover:bg-navy/90 shadow-lg'
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <SafeIcon icon={FiArrowRight} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                    <p className="mt-4 text-center text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                      Single upfront payment
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-20 bg-navy rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <SafeIcon icon={FiTag} className="text-teal-400 text-4xl mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">Enterprise Custom Solutions</h2>
              <p className="text-gray-400 mb-8">
                Need more than 50 team members or multi-national support? We offer custom pricing for large organizations.
              </p>
              <button className="bg-white text-navy px-10 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                Contact Sales Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PricingPage;