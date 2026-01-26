import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { useAuth } from '../../hooks/useAuth.jsx';
import { supabase } from '../../supabase/supabase';

const { 
  FiCreditCard, FiZap, FiCheck, FiInfo, FiTrendingUp, 
  FiUsers, FiDollarSign, FiCalendar, FiArrowRight 
} = FiIcons;

const PlanBilling = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [stats, setStats] = useState(null);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    if (profile?.organization_id) {
      loadBillingData();
    }
  }, [profile?.organization_id]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();
      
      setOrg(orgData);

      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);
      
      setTeamCount(count || 0);

      const { data: statsData } = await supabase.rpc('get_booking_stats', {
        p_org_id: profile.organization_id,
        p_from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        p_to_date: new Date().toISOString()
      });

      if (statsData?.[0]) setStats(statsData[0]);

    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Essential features for solo technicians',
      features: ['1 Location', 'Solo Management', 'Standard Support', '3% Platform Fee'],
      limit: 1,
      color: 'gray'
    },
    {
      name: 'Professional',
      price: '$49',
      description: 'Perfect for small growing teams',
      features: ['Up to 5 Team Members', 'Multi-location Support', 'Priority Support', 'Advanced Analytics'],
      limit: 5,
      color: 'blue'
    },
    {
      name: 'Teams',
      price: '$149',
      description: 'Scale your business with zero limits',
      features: ['Unlimited Members', 'API Access', 'Custom Integrations', 'Dedicated Account Manager'],
      limit: 999,
      color: 'navy'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.name === (org?.subscription_tier || 'Free')) || plans[0];
  const teamLimit = currentPlan.limit;
  const usagePercentage = (teamCount / teamLimit) * 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Overview */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 bg-navy text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-4 inline-block">
                    Current Plan
                  </span>
                  <h2 className="text-4xl font-black mb-2">{currentPlan.name}</h2>
                  <p className="text-blue-100 font-medium text-sm">{currentPlan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black">{currentPlan.price}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">per month</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Plan Features</h3>
                  <ul className="space-y-3">
                    {currentPlan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm font-bold text-navy">
                        <div className="bg-green-100 text-green-600 p-1 rounded-full">
                          <SafeIcon icon={FiCheck} className="text-[10px]" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Usage</h3>
                    <span className="text-[10px] font-black text-navy whitespace-nowrap">
                      {teamCount} / {teamLimit === 999 ? '∞' : teamLimit} Members
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      className={`h-full rounded-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                    {org?.subscription_tier === 'Free' 
                      ? "Upgrade to Professional to add team members and technicians."
                      : `You are using ${Math.round(usagePercentage)}% of your team capacity.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <SafeIcon icon={FiDollarSign} />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</span>
              </div>
              <p className="text-2xl font-black text-navy">${org?.balance?.toLocaleString() || '0.00'}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                  <SafeIcon icon={FiTrendingUp} />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Gross</span>
              </div>
              <p className="text-2xl font-black text-navy">${stats?.gross_revenue?.toLocaleString() || '0.00'}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <SafeIcon icon={FiZap} />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Fees</span>
              </div>
              <p className="text-2xl font-black text-navy">${stats?.total_fees?.toLocaleString() || '0.00'}</p>
            </div>
          </div>
        </div>

        {/* Upgrade / Billing Actions */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-navy uppercase tracking-widest mb-6">Payment Method</h3>
            <div className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl mb-6">
              <div className="p-3 bg-gray-50 rounded-xl">
                <SafeIcon icon={FiCreditCard} className="text-2xl text-navy" />
              </div>
              <div>
                <p className="text-sm font-black text-navy">•••• •••• •••• 4242</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Expires 12/26</p>
              </div>
            </div>
            <button className="w-full py-4 bg-gray-50 text-navy font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-colors">
              Update Method
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-100">
            <h3 className="text-lg font-black mb-2">Need more power?</h3>
            <p className="text-xs font-medium text-blue-100 mb-6 leading-relaxed">
              Unlock multi-location management and unlimited team members with the Teams plan.
            </p>
            <button className="w-full py-4 bg-white text-blue-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              Upgrade Now <SafeIcon icon={FiArrowRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanBilling;