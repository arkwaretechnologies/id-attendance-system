'use client';

import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit, Shield, Mail, Lock, User } from 'lucide-react'
import { getUsersWithRoles, getPublicUsers, createUserAccount, deleteUserAccount, updateUserRole, updateUserPassword, updateUserMetadata, updateUserEmail, assignAdminRoleToCurrentUser } from '@/lib/adminService'
import { useAuth } from '@/hooks/useAuth'
import type { GetUsersWithRolesRow } from '@/types/database'

const UserManagement = () => {
  const [users, setUsers] = useState<GetUsersWithRolesRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingUser, setEditingUser] = useState<GetUsersWithRolesRow | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
    fullName: ''
  })
  const [editFormData, setEditFormData] = useState({
    role: 'user',
    fullName: '',
    email: '',
    password: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, isAdmin, userRole, refreshUserRole } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])



  // Validation functions
  const validateCreateForm = (data: { fullName: string; email: string; password: string }) => {
    const errors: Record<string, string> = {};
    
    if (!data.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (data.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };
  
  const validateEditForm = (data: { fullName: string; email: string; password?: string }) => {
    const errors: Record<string, string> = {};
    
    if (!data.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (data.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (data.password && data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      let data, error

      if (isAdmin()) {
        // Try admin RPC first
        let adminRes = await getUsersWithRoles()
        if (adminRes?.error) {
          console.warn('Admin fetch failed, falling back to public users:', adminRes.error)
          // Fallback to public users list (SECURITY DEFINER)
          const publicRes = await getPublicUsers()
          if (publicRes.error) {
            setError('Failed to fetch users: ' + (publicRes.error instanceof Error ? publicRes.error.message : String(publicRes.error)))
            return
          }
          setUsers((publicRes.data ?? []) as GetUsersWithRolesRow[])
          return
        }
        setUsers(adminRes.data || [])
      } else {
        ({ data, error } = await getPublicUsers())
        if (error) {
          setError('Failed to fetch users: ' + (error instanceof Error ? error.message : String(error)))
          return
        }
        setUsers((data ?? []) as GetUsersWithRolesRow[])
      }
    } catch (err) {
      setError('An error occurred while fetching users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateCreateForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Check if email already exists
      const existingUser = users.find(u => u.email?.toLowerCase() === formData.email.toLowerCase());
      if (existingUser) {
        setFormErrors({ email: 'A user with this email already exists' });
        return;
      }
      
      const result = await createUserAccount(
        formData.email,
        formData.password,
        formData.role,
        formData.fullName
      );
      
      if (result.error) {
        // Provide a clearer message for missing admin API setup
        const msg = (result.error instanceof Error ? result.error.message : String(result.error)) || 'Failed to create user'
        if (msg.includes('Admin API not configured') || msg.includes('not allowed')) {
          setError('User creation requires a secure admin backend. Please run database/admin-setup.sql in Supabase, then configure a serverless function with the service role key to create users, or enable user self-signup and assign roles via Update Role.');
        } else {
          setError(msg)
        }
        return;
      }
      
      // Update role if not default 'user' (only when creation succeeded)
      if (result?.data?.user?.id && formData.role !== 'user') {
        const roleResult = await updateUserRole(result.data.user.id, formData.role);
        if (roleResult.error) {
          console.warn('User created but role update failed:', roleResult.error);
          setError('User created but role assignment failed. Please update the role manually.');
        }
      }
      
      if (result?.data?.user) {
        setSuccess('User created successfully!');
        setFormData({ fullName: '', email: '', password: '', role: 'user' });
        setFormErrors({});
        setShowCreateForm(false);
        fetchUsers();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      if (errorMessage.includes('email')) {
        setFormErrors({ email: 'This email is already registered' });
      } else {
        setError(errorMessage);
      }
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      const { success, error } = await deleteUserAccount(userId)
      
      if (!success) {
        setError('Failed to delete user: ' + (error instanceof Error ? error.message : String(error)))
        return
      }
      
      setSuccess('User deleted successfully!')
      fetchUsers()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('An error occurred while deleting user')
      console.error('Error deleting user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (userData: GetUsersWithRolesRow) => {
    setEditingUser(userData)
    const metadata = userData.user_metadata as { full_name?: string } | undefined
    setEditFormData({
      role: (userData.role ?? 'user') as string,
      fullName: metadata?.full_name ?? '',
      email: userData.email ?? '',
      password: ''
    })
    setShowEditForm(true)
    setError('')
    setSuccess('')
  }

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateEditForm(editFormData);
    setEditFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    if (!editingUser) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const userId = editingUser.id;
      const currentRole = editingUser.role;
      const editMeta = editingUser.user_metadata as { full_name?: string } | undefined;
      const currentFullName = editMeta?.full_name;
      const currentEmail = editingUser.email ?? '';
      
      // Check if email already exists (excluding current user)
      if (editFormData.email !== currentEmail) {
        const existingUser = users.find(u => 
          (u.email ?? '').toLowerCase() === editFormData.email.toLowerCase() && u.id !== userId
        );
        if (existingUser) {
          setEditFormErrors({ email: 'A user with this email already exists' });
          return;
        }
      }
      
      let updateCount = 0;
      const errors = [];
      
      // Update role if changed
      if (editFormData.role !== currentRole) {
        try {
          const roleResult = await updateUserRole(userId, editFormData.role);
          if (roleResult.error) {
            errors.push('Failed to update user role');
          } else {
            updateCount++;
          }
        } catch (err) {
          errors.push('Failed to update user role');
        }
      }
      
      // Update metadata (full name) if changed
      if (editFormData.fullName !== currentFullName) {
        try {
          const metadataResult = await updateUserMetadata(userId, {
            full_name: editFormData.fullName
          });
          if (metadataResult.error) {
            errors.push('Failed to update user name');
          } else {
            updateCount++;
          }
        } catch (err) {
          errors.push('Failed to update user name');
        }
      }
      
      // Update email if changed
      if (editFormData.email !== currentEmail) {
        try {
          const emailResult = await updateUserEmail(userId, editFormData.email);
          if (emailResult.error) {
            errors.push('Failed to update user email');
          } else {
            updateCount++;
          }
        } catch (err) {
          errors.push('Failed to update user email');
        }
      }
      
      // Update password if provided
      if (editFormData.password && editFormData.password.trim()) {
        try {
          const passwordResult = await updateUserPassword(userId, editFormData.password);
          if (passwordResult.error) {
            errors.push('Failed to update user password');
          } else {
            updateCount++;
          }
        } catch (err) {
          errors.push('Failed to update user password');
        }
      }
      
      if (errors.length > 0) {
        setError(`Some updates failed: ${errors.join(', ')}`);
      } else if (updateCount > 0) {
        setSuccess('User updated successfully!');
      } else {
        setSuccess('No changes were made.');
      }
      
      setEditingUser(null);
      setEditFormData({ fullName: '', email: '', role: 'user', password: '' });
      setEditFormErrors({});
      setShowEditForm(false);
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAssignAdminRole = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await assignAdminRoleToCurrentUser();
      
      if (result.success) {
        setSuccess('Admin role assigned successfully! The page will refresh automatically.');
        // Refresh user role
        await refreshUserRole();
        // Small delay to ensure the role is updated
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError((result.error instanceof Error ? result.error.message : result.error ? String(result.error) : null) || 'Failed to assign admin role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign admin role');
      console.error('Error assigning admin role:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="flex items-center gap-3">
            <Users size={32} className="text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Manage system users and their permissions</p>

          {!isAdmin() && (
            <div className="mt-2">
              <button
                onClick={handleAssignAdminRole}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50"
              >
                <Shield size={16} />
                {loading ? 'Assigning...' : 'Assign Admin Role (Initial Setup)'}
              </button>
            </div>
          )}
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
                    if (formErrors.fullName) {
                      setFormErrors({...formErrors, fullName: ''});
                    }
                  }}
                  placeholder="Enter full name"
                  required
                />
                {formErrors.fullName && (
                  <div className="text-red-600 text-sm">{formErrors.fullName}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail size={16} className="text-gray-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors({...formErrors, email: ''});
                    }
                  }}
                  placeholder="Enter email address"
                  required
                />
                {formErrors.email && (
                  <div className="text-red-600 text-sm">{formErrors.email}</div>
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) {
                      setFormErrors({...formErrors, password: ''});
                    }
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
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({ email: '', password: '', role: 'user', fullName: '' })
                  setFormErrors({})
                  setError('')
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
            Edit User: {editingUser.email}
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
                    if (editFormErrors.fullName) {
                      setEditFormErrors({...editFormErrors, fullName: ''});
                    }
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
                  Email Address
                </label>
                <input
                  type="email"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    editFormErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={editFormData.email}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, email: e.target.value });
                    if (editFormErrors.email) {
                      setEditFormErrors({...editFormErrors, email: ''});
                    }
                  }}
                  placeholder="Enter email address"
                  required
                />
                {editFormErrors.email && (
                  <div className="text-red-600 text-sm">{editFormErrors.email}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock size={16} className="text-gray-500" />
                  New Password (optional)
                </label>
                <input
                  type="password"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    editFormErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={editFormData.password}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, password: e.target.value });
                    if (editFormErrors.password) {
                      setEditFormErrors({...editFormErrors, password: ''});
                    }
                  }}
                  placeholder="Enter new password (leave blank to keep current)"
                  minLength={6}
                />
                {editFormErrors.password && (
                  <div className="text-red-600 text-sm">{editFormErrors.password}</div>
                )}
              </div>

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
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                onClick={() => {
                  setShowEditForm(false)
                  setEditingUser(null)
                  setEditFormData({ role: 'user', fullName: '', email: '', password: '' })
                  setEditFormErrors({})
                  setError('')
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{isAdmin() ? 'Actions' : ''}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {users.map((userData) => {
                  const meta = userData.user_metadata as { full_name?: string } | undefined;
                  const fullName = meta?.full_name ?? 'N/A';
                  const initials = fullName !== 'N/A' 
                    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'NA';
                  
                  return (
                    <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate" style={{color: 'var(--color-text)'}}>{fullName}</div>
                            <div className="text-muted">{userData.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`role-badge ${
                          userData.role === 'admin' 
                            ? 'role-badge-admin' 
                            : 'role-badge-user'
                        }`}>
                          {userData.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted">
                          {new Date((userData.created_at as string) ?? '').toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
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
                            onClick={() => handleDeleteUser(userData.id)}
                            disabled={userData.id === user?.id}
                            title={userData.id === user?.id ? 'Cannot delete yourself' : 'Delete user'}
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
