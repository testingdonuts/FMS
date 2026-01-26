import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import ReactECharts from 'echarts-for-react';

const { FiEye, FiTarget, FiTrendingUp, FiUsers } = FiIcons;

const AnalyticsSection = ({ stats, tier }) => {
  const isPro = tier === 'Professional' || tier === 'Teams';

  if (!isPro) {
    return (
      <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 text-center">
        <SafeIcon icon={FiTrendingUp} className="text-4xl text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-navy mb-2">Unlock Advanced Analytics</h3>
        <p className="text-blue-700 mb-6">Upgrade to Professional to see listing views, conversion rates, and engagement insights.</p>
        <button className="bg-navy text-white px-6 py-2 rounded-lg font-bold">Upgrade Now</button>
      </div>
    );
  }

  const chartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    yAxis: { type: 'value' },
    series: [{
      data: [120, 200, 150, 80, 70, 110, 130],
      type: 'line',
      smooth: true,
      color: '#14b8a6'
    }]
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-bold uppercase">Listing Views</span>
            <SafeIcon icon={FiEye} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-navy">{stats.listing_views || 0}</p>
          <div className="mt-2 flex items-center text-xs text-green-600">
            <SafeIcon icon={FiTrendingUp} className="mr-1" />
            <span>+12% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-bold uppercase">Conversion Rate</span>
            <SafeIcon icon={FiTarget} className="text-teal-500" />
          </div>
          <p className="text-2xl font-black text-navy">{parseFloat(stats.conversion_rate || 0).toFixed(1)}%</p>
          <p className="text-[10px] text-gray-400 mt-1">Visitors to Bookings</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-bold uppercase">Repeat Customers</span>
            <SafeIcon icon={FiUsers} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-navy">18%</p>
          <p className="text-[10px] text-gray-400 mt-1">Based on historical data</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-navy mb-6">Engagement Trends (Last 7 Days)</h4>
        <ReactECharts option={chartOption} style={{ height: '300px' }} />
      </div>
    </div>
  );
};

export default AnalyticsSection;