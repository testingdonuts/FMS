import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { chatService } from '../../services/chatService';

const { FiSend, FiX, FiUser, FiInfo, FiMessageSquare } = FiIcons;

const ChatWindow = ({ currentUser, recipient, orgId, context = {}, onClose, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  const doesMessageMatchThread = (msg) => {
    const bookingId = context?.bookingId || null;
    const serviceId = context?.serviceId || null;
    const equipmentId = context?.equipmentId || null;

    // If we are in a specific thread (booking/service/equipment), only show messages in that thread.
    // If no context is provided, this is a general thread.
    return (msg.booking_id || null) === bookingId &&
      (msg.service_id || null) === serviceId &&
      (msg.equipment_id || null) === equipmentId;
  };

  useEffect(() => {
    loadMessages();
    const subscription = chatService.subscribeToMessages(currentUser.id, (msg) => {
      // Only add if it belongs to this specific conversation context/recipient
      if (msg.sender_id === recipient.id && doesMessageMatchThread(msg)) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return () => subscription.unsubscribe();
  }, [currentUser.id, recipient.id, context.bookingId, context.serviceId, context.equipmentId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const { data } = await chatService.getMessages(currentUser.id, recipient.id, context);
    if (data) setMessages(data);
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { data } = await chatService.sendMessage(
      currentUser.id,
      recipient.id,
      orgId,
      newMessage,
      context
    );

    if (data) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      // Notify parent component to refresh the conversation list
      if (onMessageSent) onMessageSent(data);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="bg-navy p-4 text-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">
            {recipient.full_name?.charAt(0)}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm leading-none">{recipient.full_name}</h3>
            {context.name && (
              <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mt-1 flex items-center">
                <SafeIcon icon={FiInfo} className="mr-1" /> {context.name}
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <SafeIcon icon={FiX} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-navy border border-gray-100 rounded-tl-none shadow-sm'}`}>
              {msg.message}
              <p className={`text-[10px] mt-1 ${msg.sender_id === currentUser.id ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <SafeIcon icon={FiMessageSquare} className="text-4xl mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">Start the conversation</p>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex items-center space-x-2">
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type your message..." 
          className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20"
        >
          <SafeIcon icon={FiSend} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;