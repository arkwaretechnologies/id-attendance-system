'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import type { ScanSchedule } from '@/types/database';

function formatTime(t: string): string {
  if (!t) return '--:--';
  const parts = String(t).split(':');
  const h = parts[0] ?? '0';
  const m = parts[1] ?? '0';
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

/** Normalize input to HH:mm for display and submission. */
function toTimeValue(t: string): string {
  const match = String(t).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function ScheduleManagement() {
  const [schedule, setSchedule] = useState<ScanSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [timeIn, setTimeIn] = useState('08:00');
  const [timeOut, setTimeOut] = useState('09:00');
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/schedule', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to load schedule');
        setSchedule([]);
        return;
      }
      setSchedule(Array.isArray(data.schedule) ? data.schedule : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const tIn = toTimeValue(timeIn);
    const tOut = toTimeValue(timeOut);

    if (!trimmedName) {
      setError('Session name is required.');
      return;
    }
    if (!tIn) {
      setError('Please enter a valid time in (e.g. 08:00).');
      return;
    }
    if (!tOut) {
      setError('Please enter a valid time out (e.g. 09:00).');
      return;
    }
    if (tOut <= tIn) {
      setError('Time out must be after time in.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          time_in: tIn,
          time_out: tOut,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to save session');
        return;
      }
      setName('');
      setTimeIn('08:00');
      setTimeOut('09:00');
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this session from the schedule?')) return;
    setError('');
    try {
      const res = await fetch(`/api/schedule/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to delete session');
        return;
      }
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="flex items-center gap-3 text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
        <Clock size={32} className="text-indigo-600" />
        Scan Schedule
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Add scanning sessions with time in and time out. Sessions cannot overlap.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Add session
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label htmlFor="schedule-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session name
            </label>
            <input
              id="schedule-name"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning session, Period 1"
            />
          </div>
          <div>
            <label htmlFor="schedule-time-in" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time in
            </label>
            <input
              id="schedule-time-in"
              type="time"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={timeIn}
              onChange={(e) => setTimeIn(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="schedule-time-out" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time out
            </label>
            <input
              id="schedule-time-out"
              type="time"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5 font-medium disabled:opacity-50"
          disabled={submitLoading}
        >
          <Plus size={18} />
          {submitLoading ? 'Saving...' : 'Add session'}
        </button>
      </form>

      <div className="card overflow-hidden p-0">
        <h2 className="text-lg font-semibold px-6 py-4 border-b border-gray-200 dark:border-gray-600" style={{ color: 'var(--color-text)' }}>
          Sessions
        </h2>
        {loading ? (
          <p className="px-6 py-8 text-gray-500 dark:text-gray-400">Loading...</p>
        ) : schedule.length === 0 ? (
          <p className="px-6 py-8 text-gray-500 dark:text-gray-400">No sessions yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
            {schedule.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {session.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {formatTime(session.time_in)} – {formatTime(session.time_out)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(session.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove session"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
