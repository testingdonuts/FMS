import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMail, FiClock, FiCheck, FiX, FiRefreshCw, FiTrash2, FiUser } = FiIcons;

const TeamInviteList = ({ 
  invitations, 
  onResendInvite, 
  onRevokeInvite, 
  isLoading = false 
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return FiClock;
      case 'accepted':
        return FiCheck;
      case 'expired':
      case 'revoked':
        return FiX;
      default:
        return FiMail;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      case 'revoked':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <SafeIcon icon={FiMail} className="text-4xl text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Invitations Sent</h3>
        <p className="text-gray-500">Team invitations will appear here once you send them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
      
      <div className="space-y-3">
        {invitations.map((invitation, index) => (
          <motion.div
            key={invitation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              {/* Invitation Info */}
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <SafeIcon icon={FiUser} className="text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{invitation.email}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                      <SafeIcon icon={getStatusIcon(invitation.status)} className="inline mr-1" />
                      {invitation.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Role: <span className="font-medium">{invitation.role.replace('_', ' ')}</span></p>
                    <p>
                      Invited by: <span className="font-medium">
                        {invitation.invited_by_profile?.full_name || 'Unknown'}
                      </span>
                    </p>
                    <p>Sent: {formatDate(invitation.created_at)}</p>
                    {invitation.expires_at && (
                      <p className={isExpired(invitation.expires_at) ? 'text-red-600' : ''}>
                        Expires: {formatDate(invitation.expires_at)}
                        {isExpired(invitation.expires_at) && ' (Expired)'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                  <>
                    <button
                      onClick={() => onResendInvite(invitation.id)}
                      disabled={isLoading}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Resend invitation"
                    >
                      <SafeIcon icon={FiRefreshCw} />
                    </button>
                    <button
                      onClick={() => onRevokeInvite(invitation.id)}
                      disabled={isLoading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Revoke invitation"
                    >
                      <SafeIcon icon={FiTrash2} />
                    </button>
                  </>
                )}

                {(invitation.status === 'expired' || isExpired(invitation.expires_at)) && (
                  <button
                    onClick={() => onResendInvite(invitation.id)}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Resend
                  </button>
                )}

                {invitation.status === 'accepted' && (
                  <span className="text-green-600 text-sm font-medium">Joined successfully</span>
                )}

                {invitation.status === 'revoked' && (
                  <span className="text-gray-500 text-sm">Revoked</span>
                )}
              </div>
            </div>

            {/* Invitation Code (for debugging/manual sharing) */}
            {invitation.status === 'pending' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Invite Code: {invitation.invite_code}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(invitation.invite_code)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TeamInviteList;