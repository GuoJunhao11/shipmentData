import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 检查管理员登录状态
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
    setLoading(false);
  }, []);

  // 管理员登录
  const adminLogin = (password) => {
    // 简单的管理员密码验证
    if (password === 'admin123') {
      localStorage.setItem('isAdmin', 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  // 管理员登出
  const adminLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
  };

  const value = {
    isAdmin,
    adminLogin,
    adminLogout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};