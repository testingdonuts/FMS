import React, { useState } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import MainLayout from '../layout/MainLayout';
    import SafeIcon from '../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    import { contactService } from '../../services/contactService';

    const {
      FiUser, FiMail, FiPhone, FiBookOpen, FiMessageSquare, FiSend,
      FiMapPin, FiClock, FiFacebook, FiInstagram, FiLinkedin, FiCheckCircle, FiAlertCircle
    } = FiIcons;

    const ContactPage = () => {
      const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: 'General Question',
        message: '',
      });
      const [formState, setFormState] = useState({
        submitting: false,
        error: '',
        success: '',
      });

      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setFormState({ submitting: true, error: '', success: '' });

        const { data, error } = await contactService.submitMessage(formData);

        if (error) {
          setFormState({ submitting: false, error: 'Failed to send message. Please try again later.', success: '' });
        } else {
          setFormState({ submitting: false, error: '', success: 'Thank you for reaching out! Our team will contact you shortly.' });
          setFormData({ name: '', email: '', phone: '', subject: 'General Question', message: '' });
        }
      };

      const socialLinks = [
        { icon: FiFacebook, href: '#', name: 'Facebook' },
        { icon: FiInstagram, href: '#', name: 'Instagram' },
        { icon: FiLinkedin, href: '#', name: 'LinkedIn' },
      ];

      return (
        <MainLayout>
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 text-center py-20 px-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-navy tracking-tight"
            >
              Contact FitMySeat
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            >
              We’re here to help you with bookings, equipment rentals, or any general questions.
            </motion.p>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                >
                  <h2 className="text-2xl font-bold text-navy mb-6">Send us a Message</h2>
                  <AnimatePresence>
                    {formState.error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                        <SafeIcon icon={FiAlertCircle} />
                        <span>{formState.error}</span>
                      </motion.div>
                    )}
                    {formState.success && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                        <SafeIcon icon={FiCheckCircle} />
                        <span>{formState.success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="relative">
                        <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div className="relative">
                        <SafeIcon icon={FiMail} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="relative">
                        <SafeIcon icon={FiPhone} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number (Optional)" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                      </div>
                       <div className="relative">
                        <SafeIcon icon={FiBookOpen} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select name="subject" value={formData.subject} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500">
                          <option>General Question</option>
                          <option>Booking Help</option>
                          <option>Equipment Rental Inquiry</option>
                          <option>Technician Support</option>
                          <option>Business Partnership</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="relative">
                        <SafeIcon icon={FiMessageSquare} className="absolute left-3 top-5 text-gray-400" />
                        <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Your Message" rows="5" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"></textarea>
                      </div>
                    </div>
                    <div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={formState.submitting} className="w-full bg-navy text-white font-semibold py-3 px-6 rounded-lg hover:bg-navy/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                        <SafeIcon icon={FiSend} />
                        <span>{formState.submitting ? 'Sending...' : 'Send Message'}</span>
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                >
                  <h3 className="text-xl font-bold text-navy mb-4">Contact Information</h3>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start space-x-3">
                      <SafeIcon icon={FiMapPin} className="text-teal-600 mt-1" />
                      <span>123 Safety Lane, Suite 100<br />Anytown, USA 12345</span>
                    </div>
                     <div className="flex items-center space-x-3">
                      <SafeIcon icon={FiPhone} className="text-teal-600" />
                      <a href="tel:+15555555555" className="hover:text-teal-700">+1 (555) 555-5555</a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <SafeIcon icon={FiMail} className="text-teal-600" />
                      <a href="mailto:support@fitmyseat.com" className="hover:text-teal-700">support@fitmyseat.com</a>
                    </div>
                     <div className="flex items-center space-x-3">
                      <SafeIcon icon={FiClock} className="text-teal-600" />
                      <span>Mon – Fri, 9 AM – 5 PM (EST)</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-navy mb-3 text-center">Follow Us</h4>
                    <div className="flex justify-center space-x-4">
                      {socialLinks.map(link => (
                        <a key={link.name} href={link.href} title={link.name} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-full hover:bg-teal-100 text-gray-600 hover:text-teal-600 transition-colors">
                          <SafeIcon icon={link.icon} className="text-xl" />
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                   <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.617154999321!2d-73.98784408459403!3d40.74844097932824!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9a4f8b9d7%3A0x9a3b6a4a6e0d3a5!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1626359051853!5m2!1sen!2sus"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    title="FitMySeat Location"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </MainLayout>
      );
    };

    export default ContactPage;