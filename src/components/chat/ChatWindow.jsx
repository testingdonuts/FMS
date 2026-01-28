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

  useEffect(() => {
    loadMessages();
    const subscription = chatService.subscribeToMessages(currentUser.id, (msg) => {
      // Only add if it belongs to this specific conversation context/recipient
      if (msg.sender_id === recipient.id) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return () => subscription.unsubscribe();
  }, [recipient.id, context.bookingId]);

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
    <div className="flex flex-col h-[400px] sm:h-[500px] lg:h-[600px] bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="bg-navy p-3 sm:p-4 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0">
            {recipient.full_name?.charAt(0)}
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-bold text-xs sm:text-sm leading-none truncate">{recipient.full_name}</h3>
            {context.name && (
              <p className="text-[9px] sm:text-[10px] text-blue-300 font-bold uppercase tracking-wider mt-1 flex items-center truncate">
                <SafeIcon icon={FiInfo} className="mr-1 flex-shrink-0" /> <span className="truncate">{context.name}</span>
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
          <SafeIcon icon={FiX} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-navy border border-gray-100 rounded-tl-none shadow-sm'}`}>
              {msg.message}
              <p className={`text-[9px] sm:text-[10px] mt-1 ${msg.sender_id === currentUser.id ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <SafeIcon icon={FiMessageSquare} className="text-3xl sm:text-4xl mb-2" />
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Start the conversation</p>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-gray-100 flex items-center space-x-2">
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type your message..." 
          className="flex-1 bg-gray-50 border border-gray-100 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className="p-2.5 sm:p-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20"
        >
          <SafeIcon icon={FiSend} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;