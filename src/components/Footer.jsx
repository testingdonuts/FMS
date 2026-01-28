import React from 'react';
    import { Link } from 'react-router-dom';
    import SafeIcon from '../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';

    const { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiShield } = FiIcons;

    const Footer = () => {
      const navLinks = {
        'Company': [
          { name: 'About Us', href: '/about' },
          { name: 'Blog', href: '/blog' },
          { name: 'Contact', href: '/contact' },
        ],
        'For Parents': [
          { name: 'Find a Technician', href: '/technicians' },
          { name: 'Book a Service', href: '/services' },
          { name: 'Rent Equipment', href: '/equipment' },
        ],
        'For Organisations': [
          { name: 'List Your Business', href: '/pricing' },
          { name: 'How It Works', href: '/how-it-works-org' },
          { name: 'FAQ', href: '/faq' },
        ],
      };

      const socialLinks = [
        { icon: FiFacebook, href: '#' },
        { icon: FiInstagram, href: '#' },
        { icon: FiTwitter, href: '#' },
        { icon: FiLinkedin, href: '#' },
      ];

      return (
        <footer className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="space-y-4 md:col-span-2 lg:col-span-1">
                <Link to="/home" className="flex items-center space-x-2">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <SafeIcon icon={FiShield} className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">FitMySeat</span>
                </Link>
                <p className="text-gray-400 leading-relaxed">
                  Your trusted partner for child passenger safety.
                </p>
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <a key={index} href={social.href} className="text-gray-400 hover:text-white transition-colors">
                      <SafeIcon icon={social.icon} className="text-xl" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Navigation Links */}
              {Object.entries(navLinks).map(([title, links]) => (
                <div key={title}>
                  <h4 className="text-lg font-semibold mb-4">{title}</h4>
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li key={link.name}>
                        <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
              <p className="text-gray-400">© {new Date().getFullYear()} FitMySeat. All rights reserved.</p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 md:mt-0">
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </footer>
      );
    };

    export default Footer;