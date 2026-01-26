import React,{useState,useEffect,useRef} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import AddressAutocomplete from './AddressAutocomplete';
import * as FiIcons from 'react-icons/fi';
import {useAuth} from '../../hooks/useAuth.jsx';
import {storageService} from '../../services/storageService';
import {serviceManagementService} from '../../services/serviceManagementService';
const {FiSave,FiX,FiPlus,FiMapPin,FiArrowLeft,FiArrowRight,FiInfo,FiImage,FiClock,FiLoader,FiCheck,FiFacebook,FiInstagram,FiTwitter,FiLinkedin,FiTrash2,FiPlusCircle,FiUploadCloud,FiCamera,FiTruck,FiAlertCircle,FiCreditCard,FiStar,FiZap,FiEye,FiEyeOff,FiHelpCircle}=FiIcons;

const daysOfWeek=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const availablePaymentMethods=['Credit Card','Cash','Apple Pay','Google Pay','Bank Transfer','Venmo/Zelle'];
const availableCategories = ['Installer/Tech', 'Vehicle Modifer', 'Detailer', 'Baby Equipment Hire', 'Car Hire', 'Safety Education', 'Retailer'];

const ListingForm=({listing=null,onSave,onCancel,isLoading=false})=> {
  const {profile}=useAuth();
  const logoInputRef=useRef(null);
  const galleryInputRef=useRef(null);
  const [uploadingLogo,setUploadingLogo]=useState(false);
  const [uploadingGallery,setUploadingGallery]=useState(false);
  const [uploadError,setUploadError]=useState(null);
  const [activeTab,setActiveTab]=useState('basic');
  const [orgTier,setOrgTier]=useState('Free');
  const [formData,setFormData]=useState({name: '',short_description: '',full_description: '',phone: '',email: '',website: '',address: '',zipcode: '',status: 'draft',is_featured: false,offers_mobile_service: false,categories: [],logo_url: '',gallery_urls: [],video_url: '',tags: [],payment_methods: ['Credit Card'],opening_hours: daysOfWeek.reduce((acc,day)=> ({...acc,[day]: {open: '09:00',close: '17:00',closed: false}}),{}),social_links: {facebook: '',twitter: '',instagram: '',linkedin: ''},faqs: []});

  useEffect(()=> {
    if (listing) {
      setFormData({
        ...formData,
        ...listing,
        opening_hours: listing.opening_hours || formData.opening_hours,
        social_links: {...formData.social_links,...(listing.social_links || {})},
        gallery_urls: Array.isArray(listing.gallery_urls) ? listing.gallery_urls : [],
        payment_methods: Array.isArray(listing.payment_methods) ? listing.payment_methods : ['Credit Card'],
        categories: Array.isArray(listing.categories) ? listing.categories : [],
        faqs: Array.isArray(listing.faqs) ? listing.faqs : [],
        is_featured: listing.is_featured || false,
        status: listing.status || 'draft'
      });
    }
    if (profile?.organization_id) {
      loadOrgTier();
    }
  },[listing,profile]);

  const loadOrgTier=async ()=> {
    const {data}=await serviceManagementService.getOrganizationById(profile.organization_id);
    if (data) setOrgTier(data.subscription_tier || 'Free');
  };

  const handleLogoUpload=async (e)=> {
    const file=e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const {data,error}=await storageService.uploadFile('listings',file);
    if (!error && data?.publicUrl) {
      setFormData(prev=> ({...prev,logo_url: data.publicUrl}));
    } else {
      setUploadError(error);
    }
    setUploadingLogo(false);
  };

  const handleGalleryUpload=async (e)=> {
    const files=Array.from(e.target.files);
    if (files.length===0) return;
    setUploadingGallery(true);
    const {data,error}=await storageService.uploadMultipleFiles('listings',files);
    if (!error && data) {
      setFormData(prev=> ({...prev,gallery_urls: [...(prev.gallery_urls || []),...data]}));
    } else {
      setUploadError(error);
    }
    setUploadingGallery(false);
  };

  const togglePaymentMethod=(method)=> {
    setFormData(prev=> {
      const current=prev.payment_methods || [];
      const updated=current.includes(method) ? current.filter(m=> m !==method) : [...current,method];
      return {...prev,payment_methods: updated};
    });
  };

  const handleAddressSelect=(addressData)=> {
    setFormData(prev=> ({...prev,address: addressData.address,zipcode: addressData.zipcode || prev.zipcode}));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => {
      const isSelected = (prev.categories || []).includes(category);
      if (isSelected) {
        return { ...prev, categories: prev.categories.filter(c => c !== category) };
      } else {
        if ((prev.categories || []).length < 3) {
          return { ...prev, categories: [...(prev.categories || []), category] };
        }
      }
      return prev;
    });
  };

  const handleFaqChange = (index, field, value) => {
    setFormData(prev => {
      const newFaqs = [...(prev.faqs || [])];
      newFaqs[index] = { ...newFaqs[index], [field]: value };
      return { ...prev, faqs: newFaqs };
    });
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: '', answer: '' }]
    }));
  };

  const removeFaq = (index) => {
    setFormData(prev => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== index)
    }));
  };

  const tabs=[
    {id: 'basic',label: 'Identity',icon: FiInfo},
    {id: 'contact',label: 'Location',icon: FiMapPin},
    {id: 'ops',label: 'Operations',icon: FiClock},
    {id: 'media',label: 'Gallery & Social',icon: FiImage},
    {id: 'faqs', label: 'FAQs', icon: FiHelpCircle}
  ];

  const canBeFeatured=orgTier !=='Free';

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden text-left">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-navy tracking-tight">
              {listing ? 'Edit Listing' : 'Create New Listing'}
            </h2>
            <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-2xl w-fit">
              {tabs.map((tab)=> (
                <button
                  key={tab.id}
                  type="button"
                  onClick={()=> setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab===tab.id
                      ? 'bg-white text-navy shadow-md'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <SafeIcon icon={tab.icon} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{opacity: 0,x: 10}}
              animate={{opacity: 1,x: 0}}
              exit={{opacity: 0,x: -10}}
              transition={{duration: 0.2}}
              className="max-w-3xl mx-auto py-4"
            >
              {activeTab==='basic' && (
                <div className="space-y-6">
                  {/* STATUS & FEATURED ROW */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Public Status Toggle */}
                    <div className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${formData.status==='published' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`} >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-2xl ${formData.status==='published' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`} >
                          <SafeIcon icon={formData.status==='published' ? FiEye : FiEyeOff} />
                        </div>
                        <div>
                          <h4 className="font-black text-navy uppercase tracking-widest text-sm"> Listing Status </h4>
                          <p className={`text-xs font-bold uppercase tracking-tighter ${formData.status==='published' ? 'text-green-600' : 'text-gray-500'}`} >
                            {formData.status==='published' ? 'Publicly Visible' : 'Private Draft'}
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={()=> setFormData(p=> ({...p,status: p.status==='published' ? 'draft' : 'published'}))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.status==='published' ? 'bg-green-500' : 'bg-gray-300'}`} >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status==='published' ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {/* Featured Toggle */}
                    <div className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${formData.is_featured ? 'bg-soft-yellow/10 border-soft-yellow shadow-lg shadow-soft-yellow/5' : 'bg-gray-50 border-gray-100'}`} >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-2xl ${formData.is_featured ? 'bg-soft-yellow text-navy shadow-lg' : 'bg-gray-200 text-gray-400'}`} >
                          <SafeIcon icon={FiStar} className={formData.is_featured ? 'fill-current' : ''} />
                        </div>
                        <div>
                          <h4 className="font-black text-navy uppercase tracking-widest text-sm">Featured</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-1">Prioritize in search</p>
                        </div>
                      </div>
                      <button type="button" disabled={!canBeFeatured} onClick={()=> setFormData(p=> ({...p,is_featured: !p.is_featured}))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.is_featured ? 'bg-soft-yellow' : 'bg-gray-300'} ${!canBeFeatured && 'opacity-30 cursor-not-allowed'}`} >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_featured ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy mb-2">Business Name *</label>
                    <input type="text" value={formData.name} onChange={(e)=> setFormData(p=> ({...p,name: e.target.value}))} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy mb-2">Short Description *</label>
                    <textarea value={formData.short_description} onChange={(e)=> setFormData(p=> ({...p,short_description: e.target.value}))} maxLength={250} rows={2} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy mb-2">Full About Section *</label>
                    <textarea value={formData.full_description} onChange={(e)=> setFormData(p=> ({...p,full_description: e.target.value}))} rows={6} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy mb-2">Categories *</label>
                    <p className="text-xs text-gray-500 mb-3">Select up to 3 categories that best describe your business.</p>
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                            (formData.categories || []).includes(category)
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {(formData.categories || []).includes(category) && <SafeIcon icon={FiCheck} className="text-xs" />}
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab==='contact' && (
                <div className="space-y-6">
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 p-2 rounded-xl text-white">
                        <SafeIcon icon={FiTruck} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest"> Mobile Service </h4>
                        <p className="text-xs text-blue-600">Do you offer a mobile service?</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={formData.offers_mobile_service} onChange={(e)=> setFormData(p=> ({...p,offers_mobile_service: e.target.checked}))} className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy mb-2">Physical Location *</label>
                    <AddressAutocomplete value={formData.address} onChange={(value)=> setFormData(p=> ({...p,address: value}))} onSelect={handleAddressSelect} placeholder="Search for your business address..." required />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e)=> setFormData(p=> ({...p,phone: e.target.value}))} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="email" placeholder="Business Email" value={formData.email} onChange={(e)=> setFormData(p=> ({...p,email: e.target.value}))} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
              {activeTab==='ops' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                      <SafeIcon icon={FiCreditCard} className="text-blue-600" /> Accepted Payment Methods
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availablePaymentMethods.map(method=> (
                        <button key={method} type="button" onClick={()=> togglePaymentMethod(method)} className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${(formData.payment_methods || []).includes(method) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300'}`} >
                          <span>{method}</span>
                          {(formData.payment_methods || []).includes(method) && <SafeIcon icon={FiCheck} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                      <SafeIcon icon={FiClock} className="text-blue-600" /> Opening Hours
                    </h4>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-4">
                      {daysOfWeek.map(day=> (
                        <div key={day} className="flex items-center justify-between gap-4">
                          <span className="w-24 font-bold text-navy capitalize">{day}</span>
                          <div className="flex-1 flex items-center gap-2">
                            <input type="time" disabled={formData.opening_hours[day].closed} value={formData.opening_hours[day].open} onChange={(e)=> setFormData(p=> ({...p,opening_hours: {...p.opening_hours,[day]: {...p.opening_hours[day],open: e.target.value}}}))} className="flex-1 p-2 bg-white border border-gray-200 rounded-xl text-sm" />
                            <input type="time" disabled={formData.opening_hours[day].closed} value={formData.opening_hours[day].close} onChange={(e)=> setFormData(p=> ({...p,opening_hours: {...p.opening_hours,[day]: {...p.opening_hours[day],close: e.target.value}}}))} className="flex-1 p-2 bg-white border border-gray-200 rounded-xl text-sm" />
                          </div>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={formData.opening_hours[day].closed} onChange={(e)=> setFormData(p=> ({...p,opening_hours: {...p.opening_hours,[day]: {...p.opening_hours[day],closed: e.target.checked}}}))} className="rounded text-blue-600" />
                            <span className="text-xs font-bold text-gray-500 uppercase">Closed</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab==='media' && (
                <div className="space-y-8">
                  {/* Logo Section */}
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-left">
                    <label className="block text-xs font-black text-navy uppercase mb-4 tracking-widest"> Business Logo </label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                        {formData.logo_url ? (
                          <>
                            <img src={formData.logo_url} className="w-full h-full object-cover" alt="Logo" />
                            <button type="button" onClick={()=> setFormData(p=> ({...p,logo_url: ''}))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity" >
                              <SafeIcon icon={FiTrash2} />
                            </button>
                          </>
                        ) : uploadingLogo ? (
                          <SafeIcon icon={FiLoader} className="animate-spin text-blue-600" />
                        ) : (
                          <SafeIcon icon={FiCamera} className="text-2xl text-gray-300" />
                        )}
                      </div>
                      <button type="button" onClick={()=> logoInputRef.current.click()} disabled={uploadingLogo} className="bg-white border-2 border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-navy hover:border-blue-500 transition-all flex items-center space-x-2" >
                        <SafeIcon icon={FiUploadCloud} />
                        <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                      </button>
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                  </div>
                  {/* Gallery Section */}
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-left">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-black text-navy uppercase tracking-widest"> Photo Gallery </label>
                      <button type="button" onClick={()=> galleryInputRef.current.click()} className="text-blue-600 text-xs font-bold flex items-center space-x-1 hover:underline" >
                        <SafeIcon icon={FiPlusCircle} />
                        <span>Add Photos</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {formData.gallery_urls && formData.gallery_urls.map((url,idx)=> (
                        <div key={idx} className="aspect-square bg-white rounded-xl border border-gray-100 overflow-hidden relative group" >
                          <img src={url} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                          <button type="button" onClick={()=> setFormData(p=> ({...p,gallery_urls: p.gallery_urls.filter((_,i)=> i !==idx)}))} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" >
                            <SafeIcon icon={FiX} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
                  </div>
                  {/* Social Links Section */}
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-navy uppercase tracking-widest text-left"> Social Media Links </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <SafeIcon icon={FiFacebook} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                        <input type="url" placeholder="Facebook URL" value={formData.social_links.facebook} onChange={(e)=> setFormData(p=> ({...p,social_links: {...p.social_links,facebook: e.target.value}}))} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="relative">
                        <SafeIcon icon={FiInstagram} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-600" />
                        <input type="url" placeholder="Instagram URL" value={formData.social_links.instagram} onChange={(e)=> setFormData(p=> ({...p,social_links: {...p.social_links,instagram: e.target.value}}))} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="relative">
                        <SafeIcon icon={FiTwitter} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500" />
                        <input type="url" placeholder="Twitter URL" value={formData.social_links.twitter} onChange={(e)=> setFormData(p=> ({...p,social_links: {...p.social_links,twitter: e.target.value}}))} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="relative">
                        <SafeIcon icon={FiLinkedin} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-700" />
                        <input type="url" placeholder="LinkedIn URL" value={formData.social_links.linkedin} onChange={(e)=> setFormData(p=> ({...p,social_links: {...p.social_links,linkedin: e.target.value}}))} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'faqs' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-bold text-navy">Frequently Asked Questions</h4>
                      <p className="text-sm text-gray-500">Add questions and answers to help your customers.</p>
                    </div>
                    <button type="button" onClick={addFaq} className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100">
                      <SafeIcon icon={FiPlusCircle} />
                      <span>Add FAQ</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(formData.faqs || []).map((faq, index) => (
                      <motion.div key={index} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                        <button type="button" onClick={() => removeFaq(index)} className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-100 rounded-full">
                          <SafeIcon icon={FiTrash2} />
                        </button>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Question"
                            value={faq.question}
                            onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg font-medium"
                          />
                          <textarea
                            placeholder="Answer"
                            value={faq.answer}
                            onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                            rows={2}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex justify-between items-center flex-shrink-0">
          <button
            type="button"
            onClick={()=> setActiveTab(tabs[tabs.findIndex(t=> t.id===activeTab) - 1].id)}
            disabled={activeTab==='basic'}
            className={`flex items-center space-x-2 px-6 py-3 font-bold rounded-2xl transition-all ${
              activeTab==='basic'
                ? 'text-gray-300 opacity-50'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <SafeIcon icon={FiArrowLeft} />
            <span>Back</span>
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-white transition-all"
            >
              Cancel
            </button>
            {activeTab === tabs[tabs.length - 1].id ? (
              <button
                type="button"
                onClick={()=> onSave(formData)}
                disabled={isLoading || uploadingLogo || uploadingGallery}
                className={`flex items-center justify-center space-x-2 px-8 py-3 text-white font-bold rounded-2xl shadow-lg transition-all ${
                  formData.status==='published'
                    ? 'bg-navy hover:bg-navy/90'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isLoading ? <SafeIcon icon={FiLoader} className="animate-spin" /> : <SafeIcon icon={FiSave} />}
                <span>{formData.status==='published' ? 'Save & Publish' : 'Save as Draft'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={()=> setActiveTab(tabs[tabs.findIndex(t=> t.id===activeTab) + 1].id)}
                className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg"
              >
                <span>Next Step</span>
                <SafeIcon icon={FiArrowRight} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingForm;