'use client';

import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit, Shield, Mail, Lock, User, Phone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { PublicUserListItem } from '@/types/database'

const UserManagement = () => {
  const [users, setUsers] = useState<PublicUserListItem[]>([])
  const [roleOptions, setRoleOptions] = useState<string[]>(['admin', 'reviewer'])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingUser, setEditingUser] = useState<PublicUserListItem | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'reviewer',
    email_address: '',
    contact_no: ''
  })
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    role: 'reviewer',
    email_address: '',
    contact_no: '',
    password: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetch('/api/roles', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : { roles: [] })
      .then((data) => {
        const names = (data.roles ?? []).map((r: { name: string }) => r.name)
        if (names.length > 0) setRoleOptions(names)
      })
      .catch(() => {})
  }, [])



  const validateCreateForm = (data: { username: string; fullName: string; password: string }) => {
    const errors: Record<string, string> = {};
    if (!data.username.trim()) {
      errors.username = 'Username is required';
    } else if (data.username.trim().length < 2) {
      errors.username = 'Username must be at least 2 characters';
    }
    if (!data.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (data.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    if (!data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const validateEditForm = (data: { fullName: string; password?: string }) => {
    const errors: Record<string, string> = {};
    if (!data.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (data.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    if (data.password && data.password.length > 0 && data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/users', { credentials: 'include' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to fetch users')
        return
      }
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch (err) {
      setError('An error occurred while fetching users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateCreateForm({
      username: formData.username,
      fullName: formData.fullName,
      password: formData.password,
    });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const existingUser = users.find(
      (u) => u.username.toLowerCase() === formData.username.trim().toLowerCase()
    );
    if (existingUser) {
      setFormErrors({ username: 'A user with this username already exists' });
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          fullname: formData.fullName.trim(),
          role: formData.role,
          email_address: formData.email_address.trim() || null,
          contact_no: formData.contact_no.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to create user');
        return;
      }
      setSuccess('User created successfully!');
      setFormData({
        username: '',
        password: '',
        fullName: '',
        role: roleOptions[0] ?? 'reviewer',
        email_address: '',
        contact_no: '',
      });
      setFormErrors({});
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete user');
        return;
      }
      setSuccess('User deleted successfully!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred while deleting user');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userData: PublicUserListItem) => {
    setEditingUser(userData);
    setEditFormData({
      fullName: userData.fullname,
      role: userData.role ?? roleOptions[0] ?? 'reviewer',
      email_address: userData.email_address ?? '',
      contact_no: userData.contact_no ?? '',
      password: '',
    });
    setShowEditForm(true);
    setError('');
    setSuccess('');
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateEditForm({
      fullName: editFormData.fullName,
      password: editFormData.password,
    });
    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!editingUser) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const body: Record<string, unknown> = {
        fullname: editFormData.fullName.trim(),
        role: editFormData.role,
        email_address: editFormData.email_address.trim() || null,
        contact_no: editFormData.contact_no.trim() || null,
      };
      if (editFormData.password && editFormData.password.trim()) {
        body.password = editFormData.password;
      }
      const res = await fetch(`/api/users/${editingUser.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to update user');
        return;
      }
      setSuccess('User updated successfully!');
      setEditingUser(null);
      setEditFormData({ fullName: '', role: 'reviewer', email_address: '', contact_no: '', password: '' });
      setEditFormErrors({});
      setShowEditForm(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="flex items-center gap-3">
            <Users size={32} className="text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Manage system users and their permissions</p>
        </div>
        {isAdmin() && (
        <button
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus size={18} />
          Create User
        </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          {success}
        </div>
      )}

      {showCreateForm && isAdmin() && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-6 mb-8">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-6">
            <Plus size={20} className="text-blue-600" />
            Create New User
          </h3>
          
          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <User size={16} className="text-gray-500" />
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                  }}
                  placeholder="Enter username"
                  required
                />
                {formErrors.username && (
                  <div className="text-red-600 text-sm">{formErrors.username}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <User size={16} className="text-gray-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                  }}
                  placeholder="Enter full name"
                  required
                />
                {formErrors.fullName && (
                  <div className="text-red-600 text-sm">{formErrors.fullName}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock size={16} className="text-gray-500" />
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                  }}
                  placeholder="Enter password (min. 6 characters)"
                  required
                  minLength={6}
                />
                {formErrors.password && (
                  <div className="text-red-600 text-sm">{formErrors.password}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Shield size={16} className="text-gray-500" />
                  Role
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail size={16} className="text-gray-500" />
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={formData.email_address}
                  onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Phone size={16} className="text-gray-500" />
                  Contact No. (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={formData.contact_no}
                  onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ username: '', password: '', fullName: '', role: roleOptions[0] ?? 'reviewer', email_address: '', contact_no: '' });
                  setFormErrors({});
                  setError('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}


      {showEditForm && editingUser && isAdmin() && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-6 mb-8">
          <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-6">
            <Edit size={20} className="text-blue-600" />
            Edit User: {editingUser.username}
          </div>
          
          <form onSubmit={handleUpdateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <User size={16} className="text-gray-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    editFormErrors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={editFormData.fullName}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, fullName: e.target.value });
                    if (editFormErrors.fullName) setEditFormErrors({ ...editFormErrors, fullName: '' });
                  }}
                  placeholder="Enter full name"
                  required
                />
                {editFormErrors.fullName && (
                  <div className="text-red-600 text-sm">{editFormErrors.fullName}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail size={16} className="text-gray-500" />
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={editFormData.email_address}
                  onChange={(e) => setEditFormData({ ...editFormData, email_address: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Phone size={16} className="text-gray-500" />
                  Contact No. (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={editFormData.contact_no}
                  onChange={(e) => setEditFormData({ ...editFormData, contact_no: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock size={16} className="text-gray-500" />
                  New Password (optional)
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    editFormErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={editFormData.password}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, password: e.target.value });
                    if (editFormErrors.password) setEditFormErrors({ ...editFormErrors, password: '' });
                  }}
                  placeholder="Leave blank to keep current password"
                  minLength={6}
                />
                {editFormErrors.password && (
                  <div className="text-red-600 text-sm">{editFormErrors.password}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Shield size={16} className="text-gray-500" />
                  Role
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingUser(null);
                  setEditFormData({ role: roleOptions[0] ?? 'reviewer', fullName: '', email_address: '', contact_no: '', password: '' });
                  setEditFormErrors({});
                  setError('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl shadow-sm p-6" style={{backgroundColor: 'var(--color-card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)'}}>
        <h3 className="text-xl font-semibold mb-6" style={{color: 'var(--color-text)'}}>Existing Users</h3>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{isAdmin() ? 'Actions' : ''}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {users.map((userData) => {
                  const fullName = userData.fullname || 'N/A';
                  const initials = fullName !== 'N/A'
                    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'NA';
                  const isCurrentUser = user?.user_id === userData.user_id;
                  return (
                    <tr key={userData.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{fullName}</div>
                            <div className="text-muted">{userData.username}</div>
                            {userData.email_address && (
                              <div className="text-muted text-xs">{userData.email_address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`role-badge ${
                          userData.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'
                        }`}>
                          {userData.role || 'reviewer'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted">{userData.contact_no || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted">
                          {userData.created_at
                            ? new Date(userData.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin() && (
                          <div className="flex space-x-2">
                            <button
                              className="btn-action btn-action-primary"
                              onClick={() => handleEditUser(userData)}
                            >
                              <Edit size={12} />
                              Edit
                            </button>
                            <button
                              className="btn-action btn-action-danger"
                              onClick={() => handleDeleteUser(userData.user_id)}
                              disabled={isCurrentUser}
                              title={isCurrentUser ? 'Cannot delete yourself' : 'Delete user'}
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement
