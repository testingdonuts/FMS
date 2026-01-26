import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { integrationService } from '../../services/integrationService';

const { FiCode, FiPlus, FiTrash2, FiCopy, FiCheck, FiAlertCircle } = FiIcons;

const ApiKeyManagement = ({ organizationId }) => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState(null);
  const [keyName, setKeyName] = useState('');

  useEffect(() => {
    loadKeys();
  }, [organizationId]);

  const loadKeys = async () => {
    const { data } = await integrationService.getApiKeys(organizationId);
    if (data) setKeys(data);
    setLoading(false);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const { data } = await integrationService.generateKey(organizationId, keyName);
    if (data) {
      setNewKey(data.secret);
      loadKeys();
      setKeyName('');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-navy">Developer API</h3>
          <p className="text-sm text-gray-500">Integrate FitMySeat with your custom software</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-navy mb-4 flex items-center">
          <SafeIcon icon={FiPlus} className="mr-2 text-blue-600" />
          Generate New API Key
        </h4>
        <form onSubmit={handleGenerate} className="flex gap-3">
          <input 
            placeholder="Key Name (e.g. My Website App)" 
            value={keyName} 
            onChange={e => setKeyName(e.target.value)}
            className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl"
            required
          />
          <button type="submit" className="bg-navy text-white px-6 py-3 rounded-xl font-bold">Generate</button>
        </form>

        {newKey && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
            <p className="text-xs font-black text-teal-700 uppercase mb-2">Copy your key now. It won't be shown again!</p>
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-teal-100 font-mono text-sm">
              <span className="truncate mr-4">{newKey}</span>
              <button onClick={() => { navigator.clipboard.writeText(newKey); alert('Copied!'); }} className="text-teal-600"><SafeIcon icon={FiCopy} /></button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50">
          <h4 className="font-bold text-navy">Active API Keys</h4>
        </div>
        <div className="divide-y divide-gray-50">
          {keys.map(k => (
            <div key={k.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <SafeIcon icon={FiCode} />
                </div>
                <div>
                  <p className="font-bold text-navy text-sm">{k.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Prefix: {k.key_prefix} • Created: {new Date(k.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => integrationService.revokeKey(k.id).then(loadKeys)} className="text-red-400 hover:text-red-600 p-2">
                <SafeIcon icon={FiTrash2} />
              </button>
            </div>
          ))}
          {keys.length === 0 && (
            <div className="p-12 text-center text-gray-400 italic text-sm">No API keys generated yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManagement;