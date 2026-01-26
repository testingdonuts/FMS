import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { equipmentService } from '../../services/equipmentService';
import { bookingService } from '../../services/bookingService';
import EquipmentCard from './EquipmentCard';
import EquipmentForm from './EquipmentForm';
import MaintenanceLogForm from './MaintenanceLogForm';

const { 
  FiPlus, FiSearch, FiFilter, FiPackage, FiCalendar, FiTool, 
  FiBarChart, FiCheckCircle, FiAlertCircle, FiClock, FiTrash2, 
  FiEdit, FiDollarSign, FiCheck, FiX, FiInfo, FiPhone, FiMapPin 
} = FiIcons;

const EquipmentManagement = ({ organizationId, userRole = 'organization' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('equipment');
  const [equipment, setEquipment] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rentalIdFilter, setRentalIdFilter] = useState(null);

  const pendingRentalsCount = rentals.filter(r => r.status === 'pending').length;

  const tabs = [
    { id: 'equipment', label: 'Equipment', icon: FiPackage },
    { 
      id: 'rentals', 
      label: 'Rental History', 
      icon: FiCalendar,
      hasNotification: pendingRentalsCount > 0 
    },
    { id: 'maintenance', label: 'Maintenance', icon: FiTool },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart }
  ];

  useEffect(() => {
    if (organizationId) {
      console.log('[EquipmentManagement] Effect triggered - activeTab:', activeTab, 'orgId:', organizationId);
      loadRentals();
      if (activeTab === 'equipment') loadEquipment();
      else if (activeTab === 'maintenance') loadMaintenance();
    }
  }, [activeTab, organizationId]);

  // Deep link handling: equipmentId/rentalId
  useEffect(() => {
    const eq = searchParams.get('equipmentId');
    const rental = searchParams.get('rentalId');
    if (eq) {
      setActiveTab('equipment');
      setSearchQuery(eq);
    } else if (rental) {
      setActiveTab('rentals');
      setRentalIdFilter(rental);
    }
  }, [searchParams]);

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchQuery]);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      console.log('[EquipmentManagement] Loading equipment for org:', organizationId);
      if (!organizationId) {
        console.error('[EquipmentManagement] No organizationId provided');
        setEquipment([]);
        return;
      }
      const { data, error } = await equipmentService.getOrganizationEquipment(organizationId);
      console.log('[EquipmentManagement] Equipment result:', { data, error });
      if (error) {
        console.error('[EquipmentManagement] Error loading equipment:', error);
      }
      if (data) setEquipment(data);
    } finally {
      setLoading(false);
    }
  };

  const loadRentals = async () => {
    if (activeTab === 'rentals') setLoading(true);
    try {
      const { data } = await equipmentService.getOrganizationRentals(organizationId);
      if (data) {
        let list = data;
        if (rentalIdFilter) {
          list = [...data].sort((a, b) => (a.id === rentalIdFilter ? -1 : b.id === rentalIdFilter ? 1 : 0));
        }
        setRentals(list);
        if (rentalIdFilter) {
          setTimeout(() => {
            const el = document.getElementById(`rental-row-${rentalIdFilter}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenance = async () => {
    setLoading(true);
    try {
      const { data } = await equipmentService.getMaintenanceLogs(organizationId);
      if (data) setMaintenanceLogs(data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRentalStatus = async (rentalId, newStatus) => {
    setLoading(true);
    try {
      const { error } = await bookingService.updateEquipmentRental(rentalId, { status: newStatus });
      if (error) throw new Error(error);
      await loadRentals();
    } catch (err) {
      alert('Failed to update rental: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterEquipment = () => {
    let filtered = [...equipment];
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredEquipment(filtered);
  };

  const handleSaveEquipment = async (equipmentData) => {
    setLoading(true);
    try {
      if (selectedEquipment) {
        await equipmentService.updateEquipment(selectedEquipment.id, equipmentData);
      } else {
        await equipmentService.createEquipment(equipmentData, organizationId);
      }
      await loadEquipment();
      setShowForm(false);
      setSelectedEquipment(null);
    } finally {
      setLoading(false);
    }
  };

  const renderEquipmentTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-navy">Equipment Inventory</h3>
          <p className="text-gray-500 text-sm">Manage your rental equipment and its status</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center space-x-2 shadow-lg shadow-blue-600/20">
          <SafeIcon icon={FiPlus} /> <span>Add Equipment</span>
        </button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map(item => (
          <EquipmentCard 
            key={item.id} 
            equipment={item} 
            onEdit={(e) => { setSelectedEquipment(e); setShowForm(true); }} 
            onDelete={async (e) => { if(confirm('Delete?')) { await equipmentService.deleteEquipment(e.id); loadEquipment(); } }} 
            userRole={userRole} 
          />
        ))}
      </div>
    </div>
  );

  const renderRentalsTab = () => (
    <div className="space-y-6">
      {pendingRentalsCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-600/20 animate-bounce">
              <SafeIcon icon={FiInfo} />
            </div>
            <div>
              <p className="text-sm text-blue-700">You have {pendingRentalsCount} equipment rental request(s) waiting for your approval.</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-navy">Rental History</h3>
        <button onClick={loadRentals} className="text-blue-600 text-sm font-bold hover:underline">Refresh List</button>
      </div>
      
      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 animate-pulse">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        </div>
      ) : rentals.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              {rentalIdFilter && (
                <caption className="caption-top p-3">
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-yellow-800 flex items-center justify-between">
                    <span className="text-sm font-bold">Filtering to rental: {rentalIdFilter}</span>
                    <button
                      className="text-sm font-bold underline"
                      onClick={() => {
                        setRentalIdFilter(null);
                        const sp = new URLSearchParams(searchParams);
                        sp.delete('rentalId');
                        setSearchParams(sp, { replace: true });
                        loadRentals();
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </caption>
              )}
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipment</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rentals.map(rental => (
                  <tr id={`rental-row-${rental.id}`} key={rental.id} className={`transition-colors ${rental.id === rentalIdFilter ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50/50'}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-navy text-sm">{rental.equipment?.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase">{rental.equipment?.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-navy">
                        {rental.parent_first_name ? `${rental.parent_first_name} ${rental.parent_last_name}` : rental.parent?.full_name}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <SafeIcon icon={FiPhone} className="mr-1 text-[10px]" />
                        {rental.contact_phone || 'N/A'}
                      </div>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-xs text-gray-700 font-medium">
                          <SafeIcon icon={FiCalendar} className="mr-1.5 text-blue-500" />
                          {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                        </div>
                        {rental.parent_address && (
                          <div className="flex items-start text-[10px] text-gray-500">
                            <SafeIcon icon={FiMapPin} className="mr-1.5 mt-0.5" />
                            <span className="max-w-[150px] truncate" title={rental.parent_address}>{rental.parent_address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        rental.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        rental.status === 'completed' ? 'bg-green-100 text-green-700' :
                        rental.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {rental.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {rental.status === 'pending' && (
                          <button 
                            onClick={() => handleUpdateRentalStatus(rental.id, 'active')}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Confirm/Approve Rental"
                          >
                            <SafeIcon icon={FiCheck} className="text-lg" />
                          </button>
                        )}
                        {rental.status === 'active' && (
                          <button 
                            onClick={() => handleUpdateRentalStatus(rental.id, 'completed')}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Mark as Returned"
                          >
                            <SafeIcon icon={FiPackage} className="text-lg" />
                          </button>
                        )}
                        {['pending', 'active'].includes(rental.status) && (
                          <button 
                            onClick={() => handleUpdateRentalStatus(rental.id, 'cancelled')}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Cancel Rental"
                          >
                            <SafeIcon icon={FiX} className="text-lg" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <SafeIcon icon={FiCalendar} className="text-5xl text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-navy">No Rental History</h3>
          <p className="text-gray-400">Once customers rent your equipment, they will appear here.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center space-x-2 transition-all relative ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <SafeIcon icon={tab.icon} />
              <span>{tab.label}</span>
              {tab.hasNotification && (
                <span className="relative flex h-2.5 w-2.5 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'equipment' && renderEquipmentTab()}
        {activeTab === 'rentals' && renderRentalsTab()}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-navy">Maintenance Logs</h3>
              <button onClick={() => setShowMaintenanceForm(true)} className="bg-navy text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2">
                <SafeIcon icon={FiPlus} /> <span>Log Service</span>
              </button>
            </div>
          </div>
        )}
        {activeTab === 'analytics' && <div className="text-center py-20 text-gray-400">Advanced equipment analytics coming soon.</div>}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <EquipmentForm equipment={selectedEquipment} onSave={handleSaveEquipment} onCancel={() => { setShowForm(false); setSelectedEquipment(null); }} isLoading={loading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EquipmentManagement;