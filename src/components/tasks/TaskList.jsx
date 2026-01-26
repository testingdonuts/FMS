import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiCheckSquare, FiClock, FiAlertTriangle, FiMoreVertical, FiEdit2, FiTrash2 } = FiIcons;

const statusBadge = (status) => {
  const map = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    blocked: 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700',
  };
  return map[status] || map.todo;
};

const priorityBadge = (priority) => {
  const map = {
    low: 'bg-gray-50 text-gray-600',
    medium: 'bg-purple-50 text-purple-700',
    high: 'bg-orange-50 text-orange-700',
    urgent: 'bg-red-50 text-red-700',
  };
  return map[priority] || map.medium;
};

const TaskList = ({ tasks = [], onUpdateStatus, onEdit, onDelete, isLoading = false }) => {
  const [openMenu, setOpenMenu] = useState(null);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white border rounded-xl">
        <SafeIcon icon={FiCheckSquare} className="text-5xl opacity-20 mx-auto mb-3" />
        <p>No tasks yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(t => (
        <div key={t.id} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-navy truncate">{t.title}</p>
            {t.description && <p className="text-sm text-gray-500 truncate">{t.description}</p>}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              {t.task_type && <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{t.task_type.replace('_',' ')}</span>}
              <span className={`px-2 py-0.5 rounded ${statusBadge(t.status)}`}>{t.status.replace('_',' ')}</span>
              <span className={`px-2 py-0.5 rounded ${priorityBadge(t.priority)}`}>{t.priority}</span>
              {t.due_date && (
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 flex items-center gap-1">
                  <SafeIcon icon={FiClock} /> {t.due_date}
                </span>
              )}
              {t.context_label && (
                <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-600">{t.context_label}</span>
              )}
              {(t.task_type === 'service_booking' && t.booking_id) && (
                <Link to={`/?tab=bookings&bookingId=${t.booking_id}`} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 underline">
                  View booking
                </Link>
              )}
              {(t.task_type === 'equipment_maintenance' && t.equipment_id) && (
                <Link to={`/?tab=equipment&equipmentId=${t.equipment_id}`} className="px-2 py-0.5 rounded bg-green-50 text-green-700 underline">
                  View equipment
                </Link>
              )}
              {(t.task_type === 'pickup' && t.rental_id) && (
                <Link to={`/?tab=equipment&tabInner=rentals&rentalId=${t.rental_id}`} className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 underline">
                  View rental
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-wrap justify-end">
            {onUpdateStatus && (
              <div className="flex items-center gap-1 flex-wrap">
                {['todo','in_progress','blocked','done'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => onUpdateStatus(t.id, s)} 
                    className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded border whitespace-nowrap ${
                      t.status===s ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title={s.replace('_',' ')}
                  >
                    <span className="hidden sm:inline">{s.replace('_',' ')}</span>
                    <span className="sm:hidden">{s === 'todo' ? '📋' : s === 'in_progress' ? '🔄' : s === 'blocked' ? '🚫' : '✅'}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Actions dropdown */}
            {(onEdit || onDelete) && (
              <div className="relative">
                <button 
                  onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)} 
                  className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-lg transition"
                >
                  <SafeIcon icon={FiMoreVertical} />
                </button>
                {openMenu === t.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                    <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                      {onEdit && (
                        <button
                          onClick={() => { setOpenMenu(null); onEdit(t); }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <SafeIcon icon={FiEdit2} /> Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => { setOpenMenu(null); onDelete(t); }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <SafeIcon icon={FiTrash2} /> Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
