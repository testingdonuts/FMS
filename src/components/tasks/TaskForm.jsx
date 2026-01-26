import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { bookingService } from '../../services/bookingService';
import { equipmentService } from '../../services/equipmentService';

const { FiX, FiSave, FiCalendar, FiFlag, FiChevronRight, FiChevronLeft } = FiIcons;

const TaskForm = ({ onClose, onSave, organizationId, defaultValues = {}, initialData = null, assigneeOptions = null }) => {
  // Use initialData for editing, fallback to defaultValues for new task
  const prefill = initialData || defaultValues;
  const isEditMode = !!initialData;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: prefill.title || '',
    description: prefill.description || '',
    priority: prefill.priority || 'medium',
    due_date: prefill.due_date || '',
    task_type: prefill.task_type || 'other',
    booking_id: prefill.booking_id || '',
    equipment_id: prefill.equipment_id || '',
    rental_id: prefill.rental_id || '',
    context_label: prefill.context_label || '',
    assignee_id: prefill.assignee_id || (assigneeOptions?.[0]?.id || ''),
  });

  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load bookings and equipment when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        if (organizationId) {
          console.log('TaskForm: Loading data for org:', organizationId);
          
          const bookingsResult = await bookingService.getOrganizationBookings(organizationId);
          console.log('Bookings loaded:', bookingsResult);
          if (bookingsResult?.data) setBookings(bookingsResult.data);
          if (bookingsResult?.error) console.error('Bookings error:', bookingsResult.error);

          const equipmentResult = await equipmentService.getOrganizationEquipment(organizationId);
          console.log('Equipment loaded:', equipmentResult);
          if (equipmentResult?.data) setEquipment(equipmentResult.data);
          if (equipmentResult?.error) console.error('Equipment error:', equipmentResult.error);

          const rentalsResult = await equipmentService.getOrganizationRentals(organizationId);
          console.log('Rentals loaded:', rentalsResult);
          if (rentalsResult?.data) setRentals(rentalsResult.data);
          if (rentalsResult?.error) console.error('Rentals error:', rentalsResult.error);
        } else {
          console.warn('TaskForm: organizationId not provided');
        }
      } catch (err) {
        console.error('Failed to load task form data:', err);
      }
    };
    loadData();
  }, [organizationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[TaskForm] handleSubmit called, current step:', step, 'form:', form);
    
    // Only submit on step 3
    if (step !== 3) {
      console.log('[TaskForm] NOT on step 3, blocking submission. Step is:', step);
      return;
    }
    
    console.log('[TaskForm] On step 3, proceeding with save');
    setLoading(true);
    try {
      console.log('[TaskForm] Submitting task:', form);
      const result = await onSave(form);
      console.log('[TaskForm] Task saved successfully:', result);
      onClose?.();
    } catch (err) {
      console.error('[TaskForm] Error saving task:', err);
      alert('Error saving task: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1 && assigneeOptions) return form.assignee_id;
    if (step === 2) return form.task_type && form.title;
    // Step 3: validate required links based on task type
    if (step === 3) {
      if (form.task_type === 'service_booking' && !form.booking_id) return false;
      if (form.task_type === 'equipment_maintenance' && !form.equipment_id) return false;
    }
    return true;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100/50">
          <div>
            <h3 className="font-bold text-navy text-lg">{isEditMode ? 'Edit Task' : 'Assign Task'}</h3>
            <p className="text-sm text-gray-600 mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-navy transition"><SafeIcon icon={FiX} className="text-xl" /></button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 flex">
          <div className={`bg-blue-600 transition-all ${step >= 1 ? 'flex-1' : 'flex-0'}`}></div>
          <div className={`bg-blue-600 transition-all ${step >= 2 ? 'flex-1' : 'flex-0'}`}></div>
          <div className={`bg-blue-600 transition-all ${step >= 3 ? 'flex-1' : 'flex-0'}`}></div>
        </div>

        <form onSubmit={handleSubmit} onKeyPress={(e) => { if (e.key === 'Enter' && step < 3) e.preventDefault(); }} className="p-6">
          {/* Step 1: Assignee & Task Type */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {assigneeOptions && (
                <div>
                  <label className="block text-sm font-bold text-navy mb-2">Who should do this task?</label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition" 
                    value={form.assignee_id} 
                    onChange={(e) => setForm({...form, assignee_id: e.target.value})}
                  >
                    <option value="">Select team member...</option>
                    {assigneeOptions.map(a => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-navy mb-2">What type of task is this?</label>
                <select 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition" 
                  value={form.task_type} 
                  onChange={(e) => setForm({...form, task_type: e.target.value})}
                >
                  <option value="service_booking">📅 Booked Service</option>
                  <option value="equipment_maintenance">🔧 Equipment Maintenance</option>
                  <option value="pickup">📦 Pickup</option>
                  <option value="other">📝 Other / Custom</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* Step 2: Task Details */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-navy mb-2">Task Title *</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition" 
                  placeholder="e.g. Follow up with customer"
                  value={form.title} 
                  onChange={(e) => setForm({...form, title: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-navy mb-2">Description</label>
                <textarea 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition" 
                  placeholder="Add any details about this task..."
                  rows={3} 
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})} 
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Context & Scheduling */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {/* Booking selection for service_booking/pickup */}
              {(form.task_type === 'service_booking' || form.task_type === 'pickup') && (
                <div>
                  <label className="block text-sm font-bold text-navy mb-2">
                    Link to Booking {form.task_type === 'service_booking' ? <span className="text-red-500">*</span> : '(optional)'}
                  </label>
                  <select 
                    className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition ${
                      form.task_type === 'service_booking' && !form.booking_id ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    value={form.booking_id} 
                    onChange={(e) => setForm({...form, booking_id: e.target.value})}
                  >
                    <option value="">— Select a booking —</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.service_name} ({new Date(b.booking_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Equipment selection for equipment_maintenance/pickup */}
              {(form.task_type === 'equipment_maintenance' || form.task_type === 'pickup') && (
                <div>
                  <label className="block text-sm font-bold text-navy mb-2">
                    Link to Equipment {form.task_type === 'equipment_maintenance' ? <span className="text-red-500">*</span> : '(optional)'}
                  </label>
                  <select 
                    className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition ${
                      form.task_type === 'equipment_maintenance' && !form.equipment_id ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    value={form.equipment_id} 
                    onChange={(e) => setForm({...form, equipment_id: e.target.value})}
                  >
                    <option value="">— Select equipment —</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.category})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rental selection for pickup */}
              {form.task_type === 'pickup' && (
                <div>
                  <label className="block text-sm font-bold text-navy mb-2">Link to Rental (optional)</label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition" 
                    value={form.rental_id} 
                    onChange={(e) => setForm({...form, rental_id: e.target.value})}
                  >
                    <option value="">— No rental linked —</option>
                    {rentals.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.equipment?.name} - {r.parent_first_name} ({new Date(r.start_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-navy mb-2">Context Label</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition" 
                  placeholder="e.g. Pickup from Parent Smith at 3pm"
                  value={form.context_label} 
                  onChange={(e) => setForm({...form, context_label: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-navy mb-2 flex items-center space-x-1">
                    <SafeIcon icon={FiFlag} className="text-sm" />
                    <span>Priority</span>
                  </label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition" 
                    value={form.priority} 
                    onChange={(e) => setForm({...form, priority: e.target.value})}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-navy mb-2 flex items-center space-x-1">
                    <SafeIcon icon={FiCalendar} className="text-sm" />
                    <span>Due Date</span>
                  </label>
                  <input 
                    type="date" 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition" 
                    value={form.due_date} 
                    onChange={(e) => setForm({...form, due_date: e.target.value})} 
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            {step > 1 && (
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-300 transition"
              >
                <SafeIcon icon={FiChevronLeft} />
                <span>Back</span>
              </button>
            )}
            {step < 3 ? (
              <button 
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <SafeIcon icon={FiChevronRight} />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={loading || !canProceed()}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiSave} />
                <span>{loading ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create Task')}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default TaskForm;
