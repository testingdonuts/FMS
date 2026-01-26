import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiClock, FiCheck, FiX, FiCalendar } = FiIcons;

const OperationsStep = ({ formData, setFormData }) => {
  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours?.[day],
          isOpen: !prev.opening_hours?.[day]?.isOpen,
          open: prev.opening_hours?.[day]?.open || '09:00',
          close: prev.opening_hours?.[day]?.close || '17:00'
        }
      }
    }));
  };

  const handleTimeChange = (day, type, value) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours?.[day],
          [type]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-black text-navy uppercase tracking-tighter">Operating Hours</h3>
        <p className="text-gray-500 text-sm font-medium">Set your availability so customers can book the right time slots.</p>
      </div>

      {/* Hours Type Selection */}
      <div className="flex gap-4 p-1 bg-gray-100 rounded-2xl mb-8">
        {['custom', '24_7'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFormData(p => ({ ...p, hours_type: type }))}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              formData.hours_type === type
                ? 'bg-white text-navy shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {type === 'custom' ? 'Custom Hours' : 'Open 24/7'}
          </button>
        ))}
      </div>

      {formData.hours_type === 'custom' && (
        <div className="grid grid-cols-1 gap-3">
          {days.map((day) => {
            const dayData = formData.opening_hours?.[day] || { isOpen: false };
            const isOpen = dayData.isOpen;
            
            return (
              <motion.div 
                key={day}
                layout
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isOpen 
                    ? 'border-blue-200 bg-white shadow-sm ring-1 ring-blue-50' 
                    : 'border-gray-100 bg-gray-50/50 opacity-80'
                }`}
              >
                <div className="flex flex-col gap-4">
                  {/* Row 1: Day Name & Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isOpen ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        <SafeIcon icon={FiCalendar} className="text-sm" />
                      </div>
                      <span className={`font-black text-sm uppercase tracking-tight ${isOpen ? 'text-navy' : 'text-gray-400'}`}>
                        {day}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        isOpen ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isOpen ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 2: Time Inputs (Only if open) */}
                  {isOpen ? (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-2 pt-2 border-t border-blue-50"
                    >
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Opens</label>
                        <input
                          type="time"
                          value={dayData.open || '09:00'}
                          onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="pt-4 text-gray-300 font-bold">-</div>
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Closes</label>
                        <input
                          type="time"
                          value={dayData.close || '17:00'}
                          onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-1">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Store Closed</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OperationsStep;