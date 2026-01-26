import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { teamService } from '../services/teamService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    authService.getCurrentUser().then(({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    let isMounted = true;
    const fetchProfile = async () => {
      for (let i = 0; i < 3; i++) {
        const { data, error } = await authService.getUserProfile(user.id);
        if (data) {
          if (isMounted) {
            setProfile(data);
            setLoading(false);
          }
          return;
        }
        if (i < 2) {
          await new Promise((res) => setTimeout(res, 500));
        } else {
          console.error('Failed to fetch profile after multiple attempts:', error);
        }
      }
      if (isMounted) {
        setProfile(null);
        setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const signUp = async (email, password, userData = {}) => {
    if (userData.role === 'team_member') {
      const { data, error } = await teamService.acceptInvitation(userData.inviteCode, {
        password,
        fullName: userData.fullName,
        phone: userData.phone,
      });
      return { data, error };
    } else {
      return authService.signUp(email, password, userData);
    }
  };

  const signIn = (email, password) => authService.signIn(email, password);

  const signOut = async () => {
    await authService.signOut();
  };

  const updateProfile = async (profileData) => {
    if (!user) return { error: 'No user logged in' };
    setLoading(true);
    const { data, error } = await authService.updateUserProfile(user.id, profileData);
    if (data) {
      setProfile(data);
    }
    setLoading(false);
    return { data, error };
  };

  const sendPasswordReset = (email) => authService.resetPasswordForEmail(email);
  const resetPassword = (newPassword) => authService.updatePassword(newPassword);

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    sendPasswordReset,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};