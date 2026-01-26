import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import { format } from 'date-fns';

const { 
  FiUsers, FiShield, FiDollarSign, FiCheckCircle, FiXCircle, 
  FiClock, FiTrendingUp, FiActivity, FiBriefcase, FiAlertCircle 
} = FiIcons;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    if (activeTab === 'overview') {
      const { data } = await adminService.getGlobalStats();
      setStats(data);
    } else if (activeTab === 'payouts') {
      const { data } = await adminService.getAllPayouts();
      setPayouts(data || []);
    } else if (activeTab === 'organizations') {
      const { data } = await adminService.getAllOrganizations();
      setOrgs(data || []);
    }
    setLoading(false);
  };

  const handlePayoutAction = async (id, status) => {
    const { error } = await adminService.updatePayoutStatus(id, status);
    if (!error) loadAdminData();
  };

  const handleOrgVerification = async (id, status) => {
    const { error } = await adminService.updateOrgVerification(id, status);
    if (!error) loadAdminData();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-left">
      <header className="bg-navy p-8 text-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Platform Control</h1>
            <p className="text-blue-300 font-bold text-sm">Super Admin Dashboard</p>
          </div>
          <div className="flex gap-4">
            {['overview', 'organizations', 'payouts'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                  activeTab === tab ? 'bg-white text-navy shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === 'overview' && stats && (
                <div className="grid md:grid-cols-4 gap-6">
                  <StatCard icon={FiTrendingUp} label="Platform Revenue" value={`$${stats.total_platform_revenue}`} color="text-green-600" />
                  <StatCard icon={FiClock} label="Pending Payouts" value={`$${stats.pending_payout_amount}`} color="text-blue-600" />
                  <StatCard icon={FiBriefcase} label="Org Applications" value={stats.pending_verifications} color="text-yellow-600" />
                  <StatCard icon={FiUsers} label="Total Users" value={stats.total_users} color="text-purple-600" />
                </div>
              )}

              {activeTab === 'payouts' && (
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-6 text-left text-[10px] font-black uppercase text-gray-400">Organization</th>
                        <th className="p-6 text-right text-[10px] font-black uppercase text-gray-400">Net Amount</th>
                        <th className="p-6 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                        <th className="p-6 text-right text-[10px] font-black uppercase text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payouts.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-6">
                            <p className="font-bold text-navy">{p.organization_name}</p>
                            <p className="text-xs text-gray-400">{format(new Date(p.created_at), 'MMM d, yyyy')}</p>
                          </td>
                          <td className="p-6 text-right font-black text-blue-600">${p.amount_net}</td>
                          <td className="p-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            {p.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handlePayoutAction(p.id, 'paid')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><SafeIcon icon={FiCheckCircle} /></button>
                                <button onClick={() => handlePayoutAction(p.id, 'rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><SafeIcon icon={FiXCircle} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'organizations' && (
                <div className="grid md:grid-cols-2 gap-6">
                  {orgs.map(org => (
                    <div key={org.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                        <h3 className="font-black text-navy text-lg">{org.name}</h3>
                        <p className="text-xs text-gray-500">{org.owner?.full_name} ({org.owner?.email})</p>
                        <div className="mt-4 flex gap-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${org.verification_status === 'verified' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {org.verification_status}
                          </span>
                        </div>
                      </div>
                      {org.verification_status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleOrgVerification(org.id, 'verified')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Verify</button>
                          <button onClick={() => handleOrgVerification(org.id, 'rejected')} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
    <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 ${color}`}>
      <SafeIcon icon={icon} className="text-2xl" />
    </div>
    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-navy">{value}</p>
  </div>
);

export default AdminDashboard;