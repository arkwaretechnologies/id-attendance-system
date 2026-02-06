'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';

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

const PAGE_KEYS = [
  'dashboard',
  'students',
  'rfid',
  'scanner',
  'attendance',
  'notifications',
  'users',
  'roles',
  'enroll',
] as const;

export default function CreateRoleForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pageKeys, setPageKeys] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const togglePage = (key: string) => {
    setPageKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Role name is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
          page_keys: pageKeys,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to create role');
        return;
      }
      router.push('/roles?created=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/roles"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft size={18} />
        Back to Role Management
      </Link>

      <h1 className="flex items-center gap-3 text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
        <Shield size={32} className="text-blue-600" />
        Create Role
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Create a new role and choose which pages users with this role can access.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role name
            </label>
            <input
              id="role-name"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Teacher, Coordinator"
            />
          </div>

          <div>
            <label htmlFor="role-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <input
              id="role-desc"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this role"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Pages this role can access
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Select the pages that users with this role will see in the menu and be allowed to open.
            </p>
            <div className="flex flex-wrap gap-4">
              {PAGE_KEYS.map((key) => (
                <label
                  key={key}
                  className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <input
                    type="checkbox"
                    checked={pageKeys.includes(key)}
                    onChange={() => togglePage(key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{PAGE_LABELS[key] ?? key}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
          <Link
            href="/roles"
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  );
}
