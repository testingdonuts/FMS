import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiCheck, FiSettings, FiShield } = FiIcons;

const COOKIE_CONSENT_KEY = 'fitmyseat_cookie_consent';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    functional: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const parsed = JSON.parse(savedConsent);
        setPreferences(parsed);
      } catch (e) {
        // Invalid saved data, show banner again
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (prefs) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);

    // Trigger consent events for analytics/marketing if accepted
    if (prefs.analytics && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
    if (prefs.marketing && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: 'granted'
      });
    }
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true
    });
  };

  const handleAcceptEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      functional: false,
      marketing: false
    });
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const togglePreference = (key) => {
    if (key === 'essential') return; // Can't toggle essential
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Backdrop for settings modal */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setShowSettings(false)}
            />
          )}

          {/* Main Banner */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4"
          >
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              
              {!showSettings ? (
                /* Simple Banner View */
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Icon and Text */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <SafeIcon icon={FiShield} className="text-teal-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="font-bold text-navy text-sm sm:text-base">We value your privacy 🇪🇺🇬🇧🇺🇸</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mt-1">
                          We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                          We comply with EU GDPR, UK GDPR, and US state privacy laws (CCPA/CPRA). 
                          <Link to="/cookies" className="text-teal-600 hover:underline ml-1">Cookie Policy</Link> | 
                          <Link to="/privacy" className="text-teal-600 hover:underline ml-1">Privacy Policy</Link>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          <span className="hidden sm:inline">🇺🇸 California/US: </span>
                          <button 
                            onClick={handleAcceptEssential}
                            className="text-red-600 hover:underline font-medium"
                          >
                            Do Not Sell or Share My Personal Information
                          </button>
                        </p>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
                      <button
                        onClick={() => setShowSettings(true)}
                        className="px-4 py-2.5 text-gray-600 border border-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <SafeIcon icon={FiSettings} />
                        <span>Customize</span>
                      </button>
                      <button
                        onClick={handleAcceptEssential}
                        className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                      >
                        Essential Only
                      </button>
                      <button
                        onClick={handleAcceptAll}
                        className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
                      >
                        <SafeIcon icon={FiCheck} />
                        <span>Accept All</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Detailed Settings View */
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-navy text-lg">Cookie Preferences</h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <SafeIcon icon={FiX} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    {/* Essential */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                      <div>
                        <p className="font-semibold text-green-800 text-sm">Essential Cookies</p>
                        <p className="text-green-600 text-xs">Required for the website to function properly</p>
                      </div>
                      <div className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                        Always On
                      </div>
                    </div>

                    {/* Analytics */}
                    <div 
                      onClick={() => togglePreference('analytics')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        preferences.analytics ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div>
                        <p className={`font-semibold text-sm ${preferences.analytics ? 'text-blue-800' : 'text-gray-700'}`}>
                          Analytics Cookies
                        </p>
                        <p className={`text-xs ${preferences.analytics ? 'text-blue-600' : 'text-gray-500'}`}>
                          Help us understand how visitors use our site
                        </p>
                      </div>
                      <div className={`w-12 h-6 rounded-full p-1 transition-colors ${preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${preferences.analytics ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Functional */}
                    <div 
                      onClick={() => togglePreference('functional')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        preferences.functional ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div>
                        <p className={`font-semibold text-sm ${preferences.functional ? 'text-purple-800' : 'text-gray-700'}`}>
                          Functional Cookies
                        </p>
                        <p className={`text-xs ${preferences.functional ? 'text-purple-600' : 'text-gray-500'}`}>
                          Remember your preferences and personalization
                        </p>
                      </div>
                      <div className={`w-12 h-6 rounded-full p-1 transition-colors ${preferences.functional ? 'bg-purple-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${preferences.functional ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* Marketing */}
                    <div 
                      onClick={() => togglePreference('marketing')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        preferences.marketing ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div>
                        <p className={`font-semibold text-sm ${preferences.marketing ? 'text-orange-800' : 'text-gray-700'}`}>
                          Marketing Cookies
                        </p>
                        <p className={`text-xs ${preferences.marketing ? 'text-orange-600' : 'text-gray-500'}`}>
                          Used to deliver relevant advertisements
                        </p>
                      </div>
                      <div className={`w-12 h-6 rounded-full p-1 transition-colors ${preferences.marketing ? 'bg-orange-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${preferences.marketing ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={handleAcceptEssential}
                      className="flex-1 px-4 py-2.5 text-gray-600 border border-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                    >
                      Reject All Optional
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 px-4 py-2.5 bg-navy text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors"
                    >
                      Accept All
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    <span className="block sm:inline">🇪🇺 EU/UK: We require explicit consent for non-essential cookies.</span>
                    <span className="block sm:inline sm:ml-1">🇺🇸 US: You may opt out of sale/sharing.</span>
                  </p>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    View our full <Link to="/cookies" className="text-teal-600 hover:underline">Cookie Policy</Link> and <Link to="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Export a hook to check cookie consent status
export const useCookieConsent = () => {
  const [consent, setConsent] = useState({
    essential: true,
    analytics: false,
    functional: false,
    marketing: false
  });

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (saved) {
      try {
        setConsent(JSON.parse(saved));
      } catch (e) {
        // Use defaults
      }
    }

    // Check for Global Privacy Control (GPC) signal - CCPA/CPRA compliance
    if (navigator.globalPrivacyControl) {
      // User has GPC enabled, treat as opt-out of sale/sharing
      setConsent(prev => ({
        ...prev,
        marketing: false
      }));
    }
  }, []);

  return consent;
};

export default CookieConsent;
