import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sla_token');
    const savedAdmin = localStorage.getItem('sla_admin');
    
    if (token && savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
      // Verify token is still valid
      authApi.getMe()
        .then(res => setAdmin(res.data))
        .catch(() => {
          localStorage.removeItem('sla_token');
          localStorage.removeItem('sla_admin');
          setAdmin(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const { access_token, admin: adminData } = response.data;
    localStorage.setItem('sla_token', access_token);
    localStorage.setItem('sla_admin', JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  };

  const register = async (email, password, name) => {
    const response = await authApi.register({ email, password, name });
    const { access_token, admin: adminData } = response.data;
    localStorage.setItem('sla_token', access_token);
    localStorage.setItem('sla_admin', JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('sla_token');
    localStorage.removeItem('sla_admin');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, register, logout }}>
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
