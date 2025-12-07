import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    const savedEventId = localStorage.getItem('selectedEventId');

    // Check token validity (simple: missing/empty/expired)
    let validToken = !!savedToken;
    // Optionally: decode JWT and check exp (if you want strict expiry)
    // If token is missing or empty, force logout
    if (!validToken) {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedEventId');
    } else {
      setToken(savedToken);
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setIsAuthenticated(true);
    }

    if (savedEventId) {
      setSelectedEventId(savedEventId);
    }

    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedEventId');
    setToken(null);
    setUser(null);
    setSelectedEventId(null);
    setIsAuthenticated(false);
  };

  const selectEvent = (eventId) => {
    localStorage.setItem('selectedEventId', eventId);
    setSelectedEventId(eventId);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        selectedEventId,
        login,
        logout,
        selectEvent,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
