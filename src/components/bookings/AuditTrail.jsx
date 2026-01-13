import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { auditService } from '../../services/auditService';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiActivity, FiClock, FiUser } = FiIcons;

const AuditTrail = ({ bookingId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await auditService.getLogsForBooking(bookingId);
      if (data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [bookingId]);

  if (loading) return <div className="animate-pulse h-20 bg-gray-50 rounded-xl" />;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-navy uppercase tracking-wider flex items-center">
        <SafeIcon icon={FiActivity} className="mr-2" />
        Activity History
      </h4>
      <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
        {logs.map((log) => (
          <div key={log.id} className="relative pl-6">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-teal-500" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-navy capitalize">{log.action.replace('_', ' ')}</span>
              <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-1 uppercase font-medium">
                <span className="flex items-center"><SafeIcon icon={FiClock} className="mr-1" /> {format(new Date(log.created_at), 'MMM d, h:mm a')}</span>
                <span className="flex items-center"><SafeIcon icon={FiUser} className="mr-1" /> {log.actor_role}</span>
              </div>
              {log.old_status && log.new_status && (
                <p className="text-xs text-gray-600 mt-2">
                  Status changed from <span className="font-bold">{log.old_status}</span> to <span className="font-bold text-teal-600">{log.new_status}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditTrail;