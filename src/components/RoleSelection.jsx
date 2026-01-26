import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiBriefcase, FiUser, FiCheck } = FiIcons;

const RoleSelection = ({ onRoleSelect, selectedRole }) => {
  const roles = [
    {
      id: 'parent',
      title: 'Parent/Guardian',
      icon: FiUsers,
      description: 'Book events, manage rentals, and handle payments for your family',
      features: ['Event Bookings', 'Equipment Rentals', 'Payment Management', 'Family Profile'],
    },
    {
      id: 'organization',
      title: 'Organization/Business Owner',
      icon: FiBriefcase,
      description: 'Manage your CPST organization, listings, and team members',
      features: ['Business Profile', 'Team Management', 'Equipment Inventory', 'Analytics Dashboard'],
    },
    {
      id: 'team_member',
      title: 'Team Member',
      icon: FiUser,
      description: 'Join an existing organization using an invitation code.',
      features: ['Access Schedule', 'View Bookings', 'Collaborate with Team'],
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Role</h3>
      <div className="grid gap-4">
        {roles.map((role) => (
          <motion.div
            key={role.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRoleSelect(role.id)}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedRole === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div
                className={`p-3 rounded-lg ${
                  selectedRole === role.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <SafeIcon icon={role.icon} className="text-xl" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{role.title}</h4>
                  {selectedRole === role.id && <SafeIcon icon={FiCheck} className="text-blue-500" />}
                </div>
                <p className="text-gray-600 text-sm mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-2">
                  {role.features.map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelection;