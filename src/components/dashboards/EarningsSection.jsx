import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { payoutService } from '../../services/payoutService';
import { format } from 'date-fns';

const { FiDollarSign, FiArrowUpRight, FiClock, FiCheckCircle, FiAlertCircle, FiPlus } = FiIcons;

const EarningsSection = ({ organization }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [details, setDetails] = useState({ accountName: '', accountNumber: '', bankName: '' });

  useEffect(() => {
    if (organization?.id) loadHistory();
  }, [organization]);

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await payoutService.getPayoutHistory(organization.id);
    if (data) setHistory(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) > organization.balance) {
      alert('Insufficient balance');
      return;
    }
    const { error } = await payoutService.requestPayout(organization.id, parseFloat(amount), method, details);
    if (!error) {
      setShowRequestForm(false);
      loadHistory();
      setAmount('');
      // In a real app, we'd trigger a reload of the organization data to update the balance display
      window.location.reload(); 
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Balance Card */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Available for Withdrawal</p>
          <h2 className="text-5xl font-black text-navy">${organization?.balance?.toFixed(2) || '0.00'}</h2>
          <p className="text-xs text-gray-400 mt-2 flex items-center">
            <SafeIcon icon={FiAlertCircle} className="mr-1" />
            A 3% platform fee is deducted at the time of payout.
          </p>
        </div>
        <button 
          onClick={() => setShowRequestForm(true)}
          disabled={!organization?.balance || organization.balance <= 0}
          className="bg-navy text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 shadow-lg hover:bg-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SafeIcon icon={FiArrowUpRight} />
          <span>Request Payout</span>
        </button>
      </div>

      {/* Payout Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-navy mb-6">Request Withdrawal</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Amount to Withdraw (Gross)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    max={organization.balance}
                    className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="0.00"
                    required
                  />
                </div>
                {amount && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500 uppercase">Platform Fee (3%)</span>
                      <span className="text-red-500">-${(amount * 0.03).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black">
                      <span className="text-navy uppercase">Net Payout</span>
                      <span className="text-blue-600">${(amount * 0.97).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Account Holder Name</label>
                <input 
                  type="text" 
                  value={details.accountName} 
                  onChange={e => setDetails({...details, accountName: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Account Number / IBAN</label>
                <input 
                  type="text" 
                  value={details.accountNumber} 
                  onChange={e => setDetails({...details, accountNumber: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold">Submit Request</button>
                <button type="button" onClick={() => setShowRequestForm(false)} className="px-6 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h4 className="font-bold text-navy">Payout History</h4>
          <span className="text-xs font-bold text-gray-400 uppercase">Transparency Log</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Gross</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right text-red-400">Fee (3%)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right text-blue-600">Net Payout</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-navy text-sm">{format(new Date(req.created_at), 'MMM d, yyyy')}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">{req.payout_method.replace('_', ' ')}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-600 text-sm">${req.amount_gross.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-medium text-red-400 text-sm">-${req.fee_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-black text-blue-600 text-sm">${req.amount_net.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                      req.status === 'paid' ? 'bg-green-100 text-green-700' : 
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic text-sm">No payout requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EarningsSection;