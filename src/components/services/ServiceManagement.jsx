import React, { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import SafeIcon from '../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    import { serviceManagementService } from '../../services/serviceManagementService';
    import ServiceCard from './ServiceCard';
    import ServiceForm from './ServiceForm';

    const { FiPlus, FiSearch, FiFilter, FiSettings, FiBarChart } = FiIcons;

    const ServiceManagement = ({ organizationId, userRole = 'organization' }) => {
      const [services, setServices] = useState([]);
      const [filteredServices, setFilteredServices] = useState([]);
      const [loading, setLoading] = useState(false);
      const [showForm, setShowForm] = useState(false);
      const [selectedService, setSelectedService] = useState(null);
      const [searchQuery, setSearchQuery] = useState('');
      const [statusFilter, setStatusFilter] = useState('all');

      useEffect(() => {
        loadServices();
      }, [organizationId]);

      useEffect(() => {
        filterServices();
      }, [services, searchQuery, statusFilter]);

      const loadServices = async () => {
        setLoading(true);
        const { data, error } = await serviceManagementService.getOrganizationServices(organizationId);
        if (data) {
          setServices(data);
        } else if (error) {
          console.error('Error loading services:', error);
        }
        setLoading(false);
      };

      const filterServices = () => {
        let filtered = [...services];

        if (searchQuery) {
          filtered = filtered.filter(
            (service) =>
              service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.service_type.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        if (statusFilter !== 'all') {
          filtered = filtered.filter((service) => {
            switch (statusFilter) {
              case 'active':
                return service.is_active === true;
              case 'inactive':
                return service.is_active === false;
              default:
                return true;
            }
          });
        }

        setFilteredServices(filtered);
      };

      const handleSaveService = async (formData) => {
        setLoading(true);
        try {
          const servicePayload = {
            name: formData.name,
            description: formData.description,
            duration_minutes: parseInt(formData.durationMinutes, 10),
            price: parseFloat(formData.price),
            service_type: formData.serviceType,
            is_active: formData.isActive,
            image_url: formData.image_url,
          };

          if (selectedService) {
            const { error } = await serviceManagementService.updateService(selectedService.id, servicePayload);
            if (error) {
              alert('Error updating service: ' + error);
              setLoading(false);
              return;
            }
          } else {
            const { error } = await serviceManagementService.createService(servicePayload, organizationId);
            if (error) {
              alert('Error creating service: ' + error);
              setLoading(false);
              return;
            }
          }

          await loadServices();
          setShowForm(false);
          setSelectedService(null);
        } catch (error) {
          console.error('Error saving service:', error);
          alert('Error saving service. Please try again.');
        }
        setLoading(false);
      };

      const handleEditService = (service) => {
        setSelectedService(service);
        setShowForm(true);
      };

      const handleDeleteService = async (service) => {
        if (!confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
          return;
        }
        setLoading(true);
        const { error } = await serviceManagementService.deleteService(service.id);
        if (error) {
          alert('Error deleting service: ' + error);
        } else {
          await loadServices();
        }
        setLoading(false);
      };

      const handleToggleStatus = async (serviceId, isActive) => {
        setLoading(true);
        const { error } = await serviceManagementService.toggleServiceStatus(serviceId, isActive);
        if (error) {
          alert('Error updating service status: ' + error);
        } else {
          await loadServices();
        }
        setLoading(false);
      };

      const handleViewService = (service) => {
        console.log('View service:', service);
      };

      const handleCloseForm = () => {
        setShowForm(false);
        setSelectedService(null);
      };

      const getServiceStats = () => {
        const total = services.length;
        const active = services.filter(s => s.is_active).length;
        const inactive = services.filter(s => !s.is_active).length;
        const avgPrice = services.length > 0
          ? services.reduce((sum, s) => sum + parseFloat(s.price), 0) / services.length
          : 0;

        return { total, active, inactive, avgPrice };
      };

      const stats = getServiceStats();

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-xl font-semibold">Service Management</h3>
              <p className="text-gray-600">Manage your organization's services and offerings</p>
            </div>
            {userRole === 'organization' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiPlus} />
                <span>Add Service</span>
              </motion.button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Services</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <SafeIcon icon={FiSettings} className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Services</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <SafeIcon icon={FiBarChart} className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Inactive Services</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
                <SafeIcon icon={FiBarChart} className="text-red-600 text-xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avg. Price</p>
                  <p className="text-2xl font-bold text-purple-600">${stats.avgPrice.toFixed(0)}</p>
                </div>
                <SafeIcon icon={FiBarChart} className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Services</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading services...</p>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  onToggleStatus={handleToggleStatus}
                  onView={handleViewService}
                  userRole={userRole}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <SafeIcon icon={FiSettings} className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {services.length === 0 ? 'No services yet' : 'No services match your filters'}
              </h3>
              <p className="text-gray-500 mb-6">
                {services.length === 0 ? 'Add your first service to start accepting bookings' : 'Try adjusting your search or filter criteria'}
              </p>
              {services.length === 0 && userRole === 'organization' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Service
                </motion.button>
              )}
            </div>
          )}

          {/* Service Form Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <ServiceForm
                    service={selectedService}
                    onSave={handleSaveService}
                    onCancel={handleCloseForm}
                    isLoading={loading}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    };

    export default ServiceManagement;