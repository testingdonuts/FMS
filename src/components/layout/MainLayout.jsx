import React from 'react';
import Header from '../Header';
import Footer from '../Footer';
import ChatbotWidget from '../chatbot/ChatbotWidget';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <Header />
      <main className="flex-grow bg-white">
        {children}
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default MainLayout;