import React, { useState } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Link } from 'react-router-dom';
    import SafeIcon from '../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    import { useAuth } from '../hooks/useAuth';
    import { useBooking } from '../context/BookingContext';
    import AuthModal from './AuthModal';

    const { FiMenu, FiX, FiLogIn, FiUser, FiLogOut, FiShield } = FiIcons;

    const Header = () => {
      const [isMenuOpen, setIsMenuOpen] = useState(false);
      const { isAuthModalOpen, openAuthModal, closeAuthModal } = useBooking();
      const { user, profile, signOut } = useAuth();

      const navLinks = [
        { name: 'Listings', href: '/listings' },
        { name: 'Services', href: '/services' },
        { name: 'Equipment', href: '/equipment' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Blog', href: '/blog' },
      ];

      const handleSignOut = async () => {
        await signOut();
      };

      const getUserName = () => profile?.full_name || user?.email;

      return (
        <>
          <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                {/* Logo */}
                <Link to="/home" className="flex items-center space-x-2">
                  <div className="bg-navy p-2 rounded-lg">
                    <SafeIcon icon={FiShield} className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-navy">FitMySeat</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="text-gray-600 hover:text-navy font-medium transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>

                {/* Desktop CTAs */}
                <div className="hidden md:flex items-center space-x-4">
                  {user ? (
                    <div className="flex items-center space-x-2">
                      <Link to="/" className="font-medium text-navy">{getUserName()}</Link>
                      <button onClick={handleSignOut} title="Sign Out" className="p-2 text-gray-600 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"><SafeIcon icon={FiLogOut} /></button>
                    </div>
                  ) : (
                    <>
                      <button onClick={openAuthModal} className="text-gray-600 hover:text-navy font-medium transition-colors">
                        Sign In
                      </button>
                      <Link
                        to="/pricing"
                        className="bg-navy text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-navy/90 transition-colors"
                      >
                        List Your Business
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <SafeIcon icon={isMenuOpen ? FiX : FiMenu} className="text-2xl text-navy" />
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white border-b border-gray-200"
              >
                <nav className="flex flex-col space-y-2 p-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
                    {user ? (
                      <>
                        <Link
                          to="/"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <SafeIcon icon={FiUser} /><span>{getUserName()}</span>
                        </Link>
                        <button onClick={handleSignOut} className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <SafeIcon icon={FiLogOut} /><span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            openAuthModal();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          <SafeIcon icon={FiLogIn} /><span>Sign In</span>
                        </button>
                        <Link
                          to="/pricing"
                          className="block w-full text-center bg-navy text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-navy/90 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          List Your Business
                        </Link>
                      </>
                    )}
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
          <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
        </>
      );
    };

    export default Header;