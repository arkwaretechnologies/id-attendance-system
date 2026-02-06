'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Shield, Plus, Trash2, Edit } from 'lucide-react';
import type { RoleWithPages } from '@/types/database';

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  rfid: 'RFID Management',
  scanner: 'Scanner',
  attendance: 'Records',
  notifications: 'Notifications',
  users: 'User Management',
  roles: 'Role Management',
  enroll: 'Enroll',
};

export default function RoleManagement() {
  const searchParams = useSearchParams();
  const [roles, setRoles] = useState<RoleWithPages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RoleWithPages | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPageKeys, setFormPageKeys] = useState<string[]>([]);

  const pageKeysList = ['dashboard', 'students', 'rfid', 'scanner', 'attendance', 'notifications', 'users', 'roles', 'enroll'] as const;

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setSuccess('Role created successfully.');
      setTimeout(() => setSuccess(''), 4000);
    }
  }, [searchParams]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/roles', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to fetch roles');
        return;
      }
      const data = await res.json();
      setRoles(data.roles ?? []);
    } catch (err) {
      setError('An error occurred while fetching roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormDescription('');
    setFormPageKeys([]);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (role: RoleWithPages) => {
    setEditing(role);
    setFormName(role.name);
    setFormDescription(role.description ?? '');
    setFormPageKeys(role.page_keys ?? []);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const togglePage = (key: string) => {
    setFormPageKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = formName.trim();
    if (!name) {
      setError('Role name is required.');
      return;
    }

    try {
      setLoading(true);
      if (editing) {
        const res = await fetch(`/api/roles/${editing.role_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            description: formDescription.trim() || null,
            page_keys: formPageKeys,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? 'Failed to update role');
          return;
        }
        setSuccess('Role updated successfully.');
      } else {
        const res = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            description: formDescription.trim() || null,
            page_keys: formPageKeys,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? 'Failed to create role');
          return;
        }
        setSuccess('Role created successfully.');
      }
      setShowForm(false);
      fetchRoles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role: RoleWithPages) => {
    if (!window.confirm(`Delete role "${role.name}"? Users with this role must be reassigned first.`)) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/roles/${role.role_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete role');
        return;
      }
      setSuccess('Role deleted.');
      fetchRoles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="flex items-center gap-3">
            <Shield size={32} className="text-blue-600" />
            Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Create roles and choose which pages each role can view
          </p>
        </div>
        <Link
          href="/roles/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Create Role
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit Role' : 'New Role'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Teacher, Reviewer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pages this role can view
              </label>
              <div className="flex flex-wrap gap-4">
                {pageKeysList.map((key) => (
                  <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPageKeys.includes(key)}
                      onChange={() => togglePage(key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{PAGE_LABELS[key] ?? key}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : editing ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden" style={{ backgroundColor: 'var(--color-card)' }}>
        <h3 className="text-xl font-semibold p-6 pb-0" style={{ color: 'var(--color-text)' }}>
          Roles
        </h3>
        {loading && !showForm ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : roles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No roles yet.</p>
            <Link
              href="/roles/create"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              <Plus size={16} />
              Create your first role
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Pages</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {roles.map((role) => (
                  <tr key={role.role_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text)' }}>{role.name}</td>
                    <td className="px-6 py-4 text-muted">{role.description || '—'}</td>
                    <td className="px-6 py-4 text-muted">
                      {role.page_keys?.length
                        ? role.page_keys.map((k) => PAGE_LABELS[k] ?? k).join(', ')
                        : 'None'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-action btn-action-primary"
                          onClick={() => openEdit(role)}
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-action-danger"
                          onClick={() => handleDelete(role)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
