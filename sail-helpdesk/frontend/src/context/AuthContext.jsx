import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sail_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sail_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          const u = res.data.user;
          // Normalize keys — Oracle returns uppercase, direct login returns lowercase
          const normalized = {
            user_id:     u.USER_ID     || u.user_id,
            employee_id: u.EMPLOYEE_ID || u.employee_id,
            full_name:   u.FULL_NAME   || u.full_name,
            email:       u.EMAIL       || u.email,
            role:        u.ROLE        || u.role,
            dept_id:     u.DEPT_ID     || u.dept_id,
            dept_name:   u.DEPT_NAME   || u.dept_name,
            designation: u.DESIGNATION || u.designation,
            phone:       u.PHONE       || u.phone,
          };
          setUser(normalized);
          localStorage.setItem('sail_user', JSON.stringify(normalized));
        })
        .catch(() => {
          localStorage.removeItem('sail_token');
          localStorage.removeItem('sail_user');
          setUser(null);
        })
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, []);

  const login = useCallback(async (employee_id, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { employee_id, password });
      const { token, user: u } = res.data;
      localStorage.setItem('sail_token', token);
      localStorage.setItem('sail_user', JSON.stringify(u));
      setUser(u);
      toast.success(`Welcome back, ${u.full_name?.split(' ')[0]}!`);
      return { success: true, user: u };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sail_token');
    localStorage.removeItem('sail_user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  // Admin = ADMIN, SUPERADMIN, or AGENT
  const isAdmin = ['ADMIN','SUPERADMIN','AGENT'].includes(user?.role);
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, initializing, login, logout, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
