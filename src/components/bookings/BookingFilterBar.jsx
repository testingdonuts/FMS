import React from 'react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiFilter, FiSearch, FiCalendar } = FiIcons;

const BookingFilterBar = ({ filters, onFilterChange, services }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        <select
          className="bg-gray-50 border border-gray-100 rounded-lg text-sm px-3 py-2"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          className="bg-gray-50 border border-gray-100 rounded-lg text-sm px-3 py-2"
          value={filters.serviceId}
          onChange={(e) => onFilterChange('serviceId', e.target.value)}
        >
          <option value="all">All Services</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div className="flex space-x-2">
          <input
            type="date"
            className="flex-1 bg-gray-50 border border-gray-100 rounded-lg text-sm px-3 py-2"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          />
          <input
            type="date"
            className="flex-1 bg-gray-50 border border-gray-100 rounded-lg text-sm px-3 py-2"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingFilterBar;