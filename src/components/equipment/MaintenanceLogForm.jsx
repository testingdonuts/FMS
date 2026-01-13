import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const { FiSave, FiX, FiTool, FiCalendar, FiUser, FiFileText } = FiIcons;

const MaintenanceLogForm = ({ onClose, onSave, equipmentList, maintenanceToEdit = null, isLoading = false }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    equipmentId: '',
    type: 'Routine',
    serviceDate: new Date().toISOString().split('T')[0],
    cost: 0,
    performedBy: '',
    status: 'Completed',
    description: ''
  });

  useEffect(() => {
    if (maintenanceToEdit) {
      setFormData({
        equipmentId: maintenanceToEdit.equipment_id,
        type: maintenanceToEdit.type,
        serviceDate: maintenanceToEdit.service_date,
        cost: maintenanceToEdit.cost || 0,
        performedBy: maintenanceToEdit.performed_by || '',
        status: maintenanceToEdit.status,
        description: maintenanceToEdit.description || ''
      });
    } else if (profile?.full_name) {
      // Auto-populate technician name for new logs if available
      setFormData(prev => ({ ...prev, performedBy: profile.full_name }));
    }
  }, [maintenanceToEdit, profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
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
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiTool} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              {maintenanceToEdit ? 'Edit Maintenance Log' : 'Log Maintenance'}
            </h3>
          </div>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600">
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Equipment Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
              <select
                name="equipmentId"
                value={formData.equipmentId}
                onChange={handleChange}
                required
                disabled={!!maintenanceToEdit}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Equipment</option>
                {equipmentList.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Routine">Routine</option>
                  <option value="Repair">Repair</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <div className="relative">
                  <SafeIcon icon={FiCalendar} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Performed By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
                <div className="relative">
                  <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleChange}
                    placeholder="Technician Name"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="relative">
                <SafeIcon icon={FiFileText} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Details about the work performed..."
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <SafeIcon icon={FiSave} />
                <span>{isLoading ? 'Saving...' : 'Save Log'}</span>
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MaintenanceLogForm;