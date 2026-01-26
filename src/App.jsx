import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardRouter from './components/DashboardRouter';
import Homepage from './components/Homepage';
import TeamAcceptInvite from './components/team/TeamAcceptInvite';
import { AuthProvider } from './hooks/useAuth.jsx';
import { BookingProvider } from './context/BookingContext';
import ServicesPage from './components/pages/ServicesPage';
import EquipmentPage from './components/pages/EquipmentPage';
import PricingPage from './components/pages/PricingPage';
import BlogPage from './components/pages/BlogPage';
import ListingsPage from './components/pages/ListingsPage';
import ListingProfilePage from './components/pages/ListingProfilePage';
import ContactPage from './components/pages/ContactPage';
import FAQPage from './components/pages/FAQPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/home" element={<Homepage />} />
              <Route path="/invite" element={<TeamAcceptInvite />} />
              <Route path="/listings" element={<ListingsPage />} />
              <Route path="/listing/:id" element={<ListingProfilePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/" element={<DashboardRouter />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;