import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../layout/MainLayout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { faqs, faqCategories } from '../../data/faqData';

const { FiSearch, FiChevronDown, FiHelpCircle } = FiIcons;

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openId, setOpenId] = useState(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero */}
        <div className="bg-navy py-20 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">How can we help?</h1>
            <div className="max-w-2xl mx-auto relative">
              <SafeIcon icon={FiSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search for answers (e.g., 'rear-facing', 'booking change')..."
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:bg-white focus:text-navy focus:ring-4 focus:ring-teal-500/20 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Categories Sidebar */}
            <div className="lg:w-64 space-y-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeCategory === 'all' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-gray-500 hover:bg-white'}`}
              >
                All Questions
              </button>
              {faqCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center space-x-3 ${activeCategory === cat.id ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-gray-500 hover:bg-white'}`}
                >
                  <SafeIcon icon={FiIcons[cat.icon]} />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="flex-1 space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => (
                    <motion.div
                      layout
                      key={faq.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                        className="w-full px-6 py-5 text-left flex justify-between items-center group"
                      >
                        <span className="font-bold text-navy group-hover:text-teal-600 transition-colors">{faq.question}</span>
                        <SafeIcon 
                          icon={FiChevronDown} 
                          className={`text-gray-400 transition-transform duration-300 ${openId === faq.id ? 'rotate-180 text-teal-500' : ''}`} 
                        />
                      </button>
                      <AnimatePresence>
                        {openId === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <SafeIcon icon={FiHelpCircle} className="text-6xl text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">No matching questions found.</p>
                    <button onClick={() => setSearchQuery('')} className="mt-4 text-teal-600 font-bold hover:underline">Clear search</button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FAQPage;