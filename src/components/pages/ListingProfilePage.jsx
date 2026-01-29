import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../layout/MainLayout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { listingService } from '../../services/listingService';
import { serviceManagementService } from '../../services/serviceManagementService';
import { equipmentService } from '../../services/equipmentService';
import { useAuth } from '../../hooks/useAuth';
import ChatWindow from '../chat/ChatWindow';

const { 
  FiPhone, FiMail, FiGlobe, FiMapPin, FiClock, FiCreditCard, 
  FiChevronDown, FiStar, FiAward, FiMessageSquare, FiX,
  FiFacebook, FiInstagram, FiTwitter, FiLinkedin
} = FiIcons;

const ListingProfilePage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [listing, setListing] = useState(null);
  const [services, setServices] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchListingData = async () => {
      setLoading(true);
      try {
        const { data: listingData, error: listingError } = await listingService.getListingById(id);
        if (listingError) throw new Error(listingError);
        setListing(listingData);

        if (listingData?.organization_id) {
          const [servicesRes, equipmentRes] = await Promise.all([
            serviceManagementService.getActiveServices(listingData.organization_id),
            equipmentService.getOrganizationEquipment(listingData.organization_id)
          ]);
          setServices(servicesRes.data || []);
          const availableEquip = (equipmentRes.data || []).filter(e => e.availability_status === true);
          setEquipment(availableEquip);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListingData();
  }, [id]);

  if (loading) return <MainLayout><div className="text-center p-20 font-bold text-navy">Loading Profile...</div></MainLayout>;
  if (error || !listing) return <MainLayout><div className="text-center p-20 text-red-500 font-bold">Error: {error || "Listing not found"}</div></MainLayout>;

  return (
    <MainLayout>
      <div className="bg-white">
        <HeroSection listing={listing} />
        <QuickInfoBar listing={listing} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-12 text-left">
            <div className="lg:col-span-2 space-y-12">
              <AboutSection listing={listing} />
              {services.length > 0 && <ServicesSection services={services} />}
              {equipment.length > 0 && <EquipmentSection equipment={equipment} />}
              <GallerySection listing={listing} />
              <FaqSection listing={listing} />
            </div>
            <div className="lg:col-span-1">
              <Sidebar 
                listing={listing} 
                user={user} 
                profile={profile} 
                onOpenChat={() => setShowChat(true)} 
              />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showChat && (
          <div className="fixed bottom-6 right-6 z-50 w-[400px]">
            <ChatWindow 
              currentUser={user} 
              recipient={{ id: listing.organization.owner_id, full_name: listing.name }} 
              orgId={listing.organization_id} 
              onClose={() => setShowChat(false)} 
            />
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

const HeroSection = ({ listing }) => (
  <div className="relative h-80 bg-navy overflow-hidden">
    <img 
      src={listing.gallery_urls?.[0] || 'https://images.unsplash.com/photo-1519641763486-b33c69a5840d?fit=crop&w=1200&h=400&q=80'} 
      alt="banner" 
      className="w-full h-full object-cover opacity-40" 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
    <div className="absolute bottom-0 left-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-end space-x-6">
        <div className="w-32 h-32 bg-white rounded-2xl shadow-2xl border-4 border-white overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
          <img src={listing.logo_url || 'https://via.placeholder.com/150'} alt="logo" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="text-left">
          <h1 className="text-4xl font-black text-white tracking-tight">{listing.name}</h1>
          <div className="flex items-center space-x-2 text-blue-200 mt-2 font-medium">
            <SafeIcon icon={FiMapPin} />
            <span>{listing.address}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const QuickInfoBar = ({ listing }) => (
  <div className="bg-gray-50 border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 text-xs font-bold uppercase tracking-wider text-center">
        <a href={`tel:${listing.phone}`} className="flex items-center justify-center space-x-2 text-navy hover:text-blue-600 transition-colors"><SafeIcon icon={FiPhone} /><span>{listing.phone}</span></a>
        <a href={`mailto:${listing.email}`} className="flex items-center justify-center space-x-2 text-navy hover:text-blue-600 transition-colors"><SafeIcon icon={FiMail} /><span>Email</span></a>
        <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 text-navy hover:text-blue-600 transition-colors"><SafeIcon icon={FiGlobe} /><span>Website</span></a>
        <div className="flex items-center justify-center space-x-2 text-gray-500"><SafeIcon icon={FiClock} /><span>9am - 5pm</span></div>
        <div className="flex items-center justify-center space-x-2 text-green-600"><SafeIcon icon={FiCreditCard} /><span>{listing.price_range || 'Contact Us'}</span></div>
      </div>
    </div>
  </div>
);

const AboutSection = ({ listing }) => (
  <div className="bg-white">
    <h2 className="text-2xl font-black text-navy mb-4">About {listing.name}</h2>
    <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">{listing.full_description}</p>
  </div>
);

const ServicesSection = ({ services }) => (
  <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
    <h2 className="text-2xl font-black text-navy mb-6 flex items-center">
      <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3"><FiIcons.FiZap className="text-white text-sm" /></span>
      Services Offered
    </h2>
    <div className="grid md:grid-cols-2 gap-6">
      {services.map(service => (
        <div key={service.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-navy text-lg">{service.name}</h3>
            <div className="text-xl font-black text-blue-600">${service.price}</div>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const EquipmentSection = ({ equipment }) => (
  <div className="bg-blue-50/30 p-8 rounded-3xl border border-blue-100">
    <h2 className="text-2xl font-black text-navy mb-6 flex items-center">
      <span className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center mr-3"><FiIcons.FiPackage className="text-white text-sm" /></span>
      Equipment Rentals
    </h2>
    <div className="grid md:grid-cols-2 gap-6">
      {equipment.map(item => (
        <div key={item.id} className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiIcons.FiPackage className="text-blue-600 text-2xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-navy">{item.name}</h3>
            <div className="text-sm font-black text-teal-600 mt-1">${item.rental_price_per_day}/day</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GallerySection = ({ listing }) => {
  if (!listing.gallery_urls || listing.gallery_urls.length === 0) return null;
  return (
    <div>
      <h2 className="text-2xl font-black text-navy mb-6">Gallery</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {listing.gallery_urls.map((url, index) => (
          <img key={index} src={url} alt="gallery" className="w-full h-48 object-cover rounded-2xl shadow-md border-2 border-white" />
        ))}
      </div>
    </div>
  );
};

const FaqSection = ({ listing }) => {
  const [openFaq, setOpenFaq] = useState(null);
  if (!listing.faqs || listing.faqs.length === 0) return null;
  return (
    <div>
      <h2 className="text-2xl font-black text-navy mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {listing.faqs.map((faq, index) => (
          <div key={index} className="bg-gray-50 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-bold text-navy">{faq.question}</h3>
              <SafeIcon icon={FiChevronDown} className={`transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openFaq === index && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-200/50">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const Sidebar = ({ listing, user, profile, onOpenChat }) => {
  const socialPlatforms = [
    { key: 'facebook', icon: FiFacebook, color: 'text-blue-600' },
    { key: 'instagram', icon: FiInstagram, color: 'text-pink-600' },
    { key: 'twitter', icon: FiTwitter, color: 'text-sky-500' },
    { key: 'linkedin', icon: FiLinkedin, color: 'text-blue-700' }
  ];

  const hasSocials = listing.social_links && Object.values(listing.social_links).some(link => link);

  return (
    <aside className="sticky top-24 space-y-6">
      <div className="bg-navy rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <FiIcons.FiCalendar className="text-8xl" />
        </div>
        <h3 className="text-2xl font-black mb-2 relative z-10">Ready to book?</h3>
        <p className="text-blue-200 mb-8 relative z-10">Secure your appointment with {listing.name} in just a few clicks.</p>
        
        <div className="space-y-4 relative z-10">
          <button className="w-full bg-blue-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">
            Book a Service
          </button>
          
          {user && profile?.role === 'parent' && (
            <button 
              onClick={onOpenChat}
              className="w-full bg-white/10 border border-white/20 text-white font-bold py-4 px-6 rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={FiMessageSquare} />
              <span>Message Business</span>
            </button>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <div className="flex items-center justify-center space-x-1 mb-2">
            {[...Array(5)].map((_, i) => <SafeIcon key={i} icon={FiStar} className="text-soft-yellow fill-current text-sm" />)}
          </div>
          <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Highly Rated Professional</p>
        </div>
      </div>

      {/* SOCIAL MEDIA SECTION */}
      {hasSocials && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <p className="text-navy font-black text-xs uppercase tracking-widest mb-4">Connect on Social</p>
          <div className="flex flex-wrap gap-3">
            {socialPlatforms.map(platform => {
              const url = listing.social_links?.[platform.key];
              if (!url) return null;
              return (
                <a 
                  key={platform.key} 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${platform.color} hover:bg-gray-100 transition-colors shadow-sm`}
                >
                  <SafeIcon icon={platform.icon} />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {listing.accreditation_certificate_url && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <SafeIcon icon={FiAward} className="text-2xl" />
          </div>
          <p className="text-navy font-black text-sm uppercase tracking-wider">Verified Accreditation</p>
          <a href={listing.accreditation_certificate_url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold hover:underline mt-2 inline-block">View Certificate</a>
        </div>
      )}

      {/* PAYMENT METHODS SECTION */}
      {listing.payment_methods && listing.payment_methods.length > 0 && (
        <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 shadow-sm">
          <p className="text-navy font-black text-xs uppercase tracking-widest mb-4">Accepted Payments</p>
          <div className="flex flex-wrap gap-2">
            {listing.payment_methods.map(method => (
              <span key={method} className="px-3 py-1 bg-white border border-gray-200 text-navy font-bold text-[10px] rounded-lg shadow-sm">
                {method}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default ListingProfilePage;