'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LogOut,
  Home,
  Users,
  Scan,
  FileText,
  Bell,
  Settings,
  Tag,
  Menu,
  X,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';

export default function Navbar() {
  const { user, userRole, allowedPages, signOut } = useAuth();
  const can = (pageKey: string) => allowedPages.length === 0 || allowedPages.includes(pageKey);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path ? 'nav-link active' : 'nav-link';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-content">
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <Link href="/dashboard" className="topbar-brand">
            ID Attendance System
          </Link>
          <div className="topbar-user">
            <button
              className="hamburger-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              style={{ marginRight: '12px' }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <span className="user-email">{user?.email ?? user?.username}</span>
          </div>
        </div>
      </div>

      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <nav className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-brand" onClick={closeSidebar}>
            ID Attendance System
          </Link>
          <button className="sidebar-close" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-nav">
          {can('dashboard') && (
            <Link
              href="/dashboard"
              className={isActive('/dashboard') || isActive('/')}
              onClick={closeSidebar}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          )}

          {can('students') && (
            <Link href="/students" className={isActive('/students')} onClick={closeSidebar}>
              <Users size={20} />
              <span>Students</span>
            </Link>
          )}

          {can('rfid') && (
            <Link href="/rfid" className={isActive('/rfid')} onClick={closeSidebar}>
              <Tag size={20} />
              <span>RFID Management</span>
            </Link>
          )}

          {can('scanner') && (
            <Link href="/scanner" className={isActive('/scanner')} onClick={closeSidebar}>
              <Scan size={20} />
              <span>Scanner</span>
            </Link>
          )}

          {can('attendance') && (
            <Link href="/attendance" className={isActive('/attendance')} onClick={closeSidebar}>
              <FileText size={20} />
              <span>Records</span>
            </Link>
          )}

          {can('notifications') && (
            <Link
              href="/notifications"
              className={isActive('/notifications')}
              onClick={closeSidebar}
            >
              <Bell size={20} />
              <span>Notifications</span>
            </Link>
          )}

          {can('users') && (
            <Link href="/users" className={isActive('/users')} onClick={closeSidebar}>
              <Settings size={20} />
              <span>User Management</span>
            </Link>
          )}

          {can('roles') && (
            <Link href="/roles" className={isActive('/roles')} onClick={closeSidebar}>
              <Shield size={20} />
              <span>Role Management</span>
            </Link>
          )}

          {can('enroll') && (
            <Link href="/enroll" className={isActive('/enroll')} onClick={closeSidebar}>
              <Users size={20} />
              <span>Enroll</span>
            </Link>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-email">{user?.email ?? user?.username}</span>
          </div>
          <button onClick={handleSignOut} className="sidebar-logout-btn">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
