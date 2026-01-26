import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { aiChatService } from '../../services/aiChatService';
import { useAuth } from '../../hooks/useAuth.jsx';

const { FiMessageCircle, FiX, FiSend, FiUser, FiCpu, FiInfo, FiShield } = FiIcons;

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hi! I'm your FitMySeat safety assistant. I can help with safety tips, pricing, or finding a technician. How can I help you today?", 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { profile } = useAuth();
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiChatService.getResponse(input, profile?.role || 'parent');
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: response.text,
        sender: 'bot',
        type: response.type,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        sender: 'bot',
        type: 'error',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy p-5 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-teal-500 p-2 rounded-xl shadow-lg shadow-teal-500/20">
                  <SafeIcon icon={FiShield} className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Safety Assistant</h3>
                  <div className="flex items-center text-[10px] text-teal-400">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-1 animate-pulse" />
                    Online & Ready
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm ${
                      msg.sender === 'user' ? 'bg-teal-600 text-white ml-2' : 'bg-white text-navy mr-2 border border-gray-100'
                    }`}>
                      <SafeIcon icon={msg.sender === 'user' ? FiUser : FiCpu} />
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm transition-all ${
                      msg.sender === 'user' 
                        ? 'bg-teal-600 text-white rounded-tr-none' 
                        : msg.type === 'error'
                          ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                          : 'bg-white text-navy rounded-tl-none border border-gray-100'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                      
                      {msg.type === 'faq' && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center">
                          <SafeIcon icon={FiInfo} className="mr-1" />
                          Source: Verified FAQ
                        </div>
                      )}
                      {msg.type === 'llm' && (
                        <div className="mt-2 pt-2 border-t border-gray-50 text-[9px] text-gray-300 font-medium uppercase tracking-wider">
                          AI Generated Response
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce delay-75" />
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce delay-150" />
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Assistant is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about child safety or pricing..."
                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-all disabled:opacity-50 disabled:scale-95 shadow-lg shadow-teal-500/20"
              >
                <SafeIcon icon={FiSend} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-navy text-white p-4 rounded-2xl shadow-2xl flex items-center space-x-3 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
          <SafeIcon icon={isOpen ? FiX : FiMessageCircle} className="text-2xl" />
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full border-2 border-navy" />
          )}
        </div>
        {!isOpen && (
          <span className="font-bold text-sm pr-2 relative z-10">Need Help?</span>
        )}
      </motion.button>
    </div>
  );
};

export default ChatbotWidget;