import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { listingService } from '../../services/listingService';
import { serviceManagement } from '../../services/serviceManagement';
import { equipmentService } from '../../services/equipmentService';
import { useAuth } from '../../hooks/useAuth';

const { 
  FiEdit3, FiTrash2, FiPlus, FiSettings, FiPackage, 
  FiTool, FiCheck, FiX, FiMoreVertical, FiExternalLink,
  FiMapPin, FiClock, FiDollarSign
} = FiIcons;

const Operations = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      loadData();
    }
  }, [profile, activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'services') {
      const { data } = await serviceManagement.getServices(profile.organization_id);
      setServices(data || []);
    } else {
      const { data } = await equipmentService.getEquipment(profile.organization_id);
      setEquipment(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Mobile-Optimized Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-navy tracking-tight">Operations</h1>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Manage your offerings</p>
          </div>
          
          {/* Mobile Action Button */}
          <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-blue-200 shadow-lg active:scale-95 transition-transform md:w-auto w-full min-h-[44px]">
            <SafeIcon icon={FiPlus} />
            <span>Add New {activeTab === 'services' ? 'Service' : 'Item'}</span>
          </button>
        </div>

        {/* Responsive Tabs */}
        <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'services', label: 'Services', icon: FiTool },
            { id: 'equipment', label: 'Equipment', icon: FiPackage }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-black whitespace-nowrap transition-all min-h-[44px] ${
                activeTab === tab.id 
                ? 'bg-navy text-white shadow-lg shadow-navy/20' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <SafeIcon icon={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-400 font-bold text-sm">Syncing latest data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {activeTab === 'services' ? (
                services.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))
              ) : (
                equipment.map(item => (
                  <EquipmentCard key={item.id} item={item} />
                ))
              )}
            </AnimatePresence>
          </div>
        )}

        {!loading && (activeTab === 'services' ? services : equipment).length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <SafeIcon icon={activeTab === 'services' ? FiTool : FiPackage} className="text-2xl text-gray-300" />
            </div>
            <h3 className="font-black text-navy">No {activeTab} yet</h3>
            <p className="text-gray-400 text-sm mt-1">Start by adding your first {activeTab.slice(0, -1)}.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const ServiceCard = ({ service }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${service.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
        <SafeIcon icon={FiTool} className="text-xl" />
      </div>
      <div className="flex gap-1">
        <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <SafeIcon icon={FiEdit3} />
        </button>
        <button className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <SafeIcon icon={FiTrash2} />
        </button>
      </div>
    </div>

    <h3 className="font-black text-navy text-lg leading-tight mb-2">{service.name}</h3>
    <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{service.description}</p>

    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
      <div className="flex items-center gap-2">
        <SafeIcon icon={FiClock} className="text-blue-400 text-xs" />
        <span className="text-xs font-bold text-gray-600">{service.duration_minutes}m</span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <SafeIcon icon={FiDollarSign} className="text-green-500 text-xs" />
        <span className="text-sm font-black text-navy">${service.price}</span>
      </div>
    </div>
    
    <div className="mt-4">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
        service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${service.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
        {service.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>
  </motion.div>
);

const EquipmentCard = ({ item }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group"
  >
    {item.image_urls?.[0] ? (
      <div className="h-40 overflow-hidden relative">
        <img 
          src={item.image_urls[0]} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black text-navy uppercase">
          {item.category}
        </div>
      </div>
    ) : (
      <div className="h-40 bg-gray-50 flex items-center justify-center">
        <SafeIcon icon={FiPackage} className="text-4xl text-gray-200" />
      </div>
    )}

    <div className="p-5 text-left">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-black text-navy text-lg flex-1 mr-2">{item.name}</h3>
        <span className="text-blue-600 font-black text-sm">${item.rental_price_per_day}/day</span>
      </div>
      
      <p className="text-gray-500 text-xs mb-4 line-clamp-1">{item.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
            item.availability_status ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {item.availability_status ? 'Available' : 'Rented'}
          </span>
          <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-[10px] font-black uppercase">
            {item.current_condition}
          </span>
        </div>
        
        <div className="flex gap-1">
          <button className="p-2 text-gray-400 hover:text-blue-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <SafeIcon icon={FiEdit3} />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

export default Operations;