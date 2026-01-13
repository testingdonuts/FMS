import React from 'react';
import { format } from 'date-fns';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiClock, FiAlertCircle } = FiIcons;

const TimeSlotPicker = ({ selectedTime, onSelect, bookedSlots = [], loading = false }) => {
  const slots = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const formatDisplayTime = (time) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 animate-pulse py-3">
        <div className="w-4 h-4 rounded-full bg-gray-200"></div>
        <span className="text-sm">Checking available slots...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((time) => {
        const isBooked = bookedSlots.includes(time);
        const isSelected = selectedTime === time;

        return (
          <button
            key={time}
            type="button"
            disabled={isBooked}
            onClick={() => onSelect(time)}
            className={`
              p-2.5 text-sm font-medium rounded-lg border transition-all
              ${isBooked 
                ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                : isSelected
                  ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-teal-500 hover:text-teal-600'
              }
            `}
          >
            {formatDisplayTime(time)}
            {isBooked && (
              <span className="block text-[10px] uppercase tracking-tighter opacity-60">Booked</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotPicker;