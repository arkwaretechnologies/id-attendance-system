'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { Attendance } from '@/types/database';

interface WeeklyDay {
  date: string;
  count: number;
  day: string;
}

interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  totalAttendance: number;
  attendanceRate: number;
  weeklyAttendance: WeeklyDay[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todayAttendance: 0,
    totalAttendance: 0,
    attendanceRate: 0,
    weeklyAttendance: [],
  });
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: students, error: studentsError } = await db.studentProfiles.getAll();
      if (studentsError) throw studentsError;
      const { data: attendance, error: attendanceError } = await db.attendance.getAll();
      if (attendanceError) throw attendanceError;

      const today = new Date().toISOString().split('T')[0];
      const todayAttendance =
        (attendance as Attendance[] | null)?.filter((record) =>
          record.created_at?.startsWith(today)
        ).length ?? 0;

      const studentCount = (students as unknown[] | null)?.length ?? 0;
      const attendanceRate =
        studentCount > 0 ? Math.round((todayAttendance / studentCount) * 100) : 0;

      const weeklyAttendance: WeeklyDay[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayAttendance = (attendance as Attendance[] | null)?.filter(
          (record) => record.created_at?.startsWith(dateStr)
        ).length ?? 0;
        weeklyAttendance.push({
          date: dateStr,
          count: dayAttendance,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        });
      }

      setStats({
        totalStudents: studentCount,
        todayAttendance,
        totalAttendance: (attendance as Attendance[] | null)?.length ?? 0,
        attendanceRate,
        weeklyAttendance,
      });
      setRecentAttendance((attendance as Attendance[])?.slice(0, 10) ?? []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const studentProfile = (r: Attendance) =>
    (r as Attendance & { student_profile?: { first_name?: string; last_name?: string; rfid_tag?: string } })
      .student_profile;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-heading">
          Welcome back, {user?.fullname ?? user?.email ?? user?.username}
        </h1>
        <p className="page-subtitle">
          Here&apos;s what&apos;s happening with your attendance system today.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="card" style={{ textAlign: 'center' }}>
          <Users size={48} style={{ color: 'var(--gradient-start)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {stats.totalStudents}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Total Students</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <UserCheck size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {stats.todayAttendance}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Today&apos;s Attendance</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <Calendar size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {stats.totalAttendance}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Total Records</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <TrendingUp size={48} style={{ color: 'var(--gradient-mid)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {stats.attendanceRate}%
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Today&apos;s Rate</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          <TrendingUp size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Weekly Attendance
        </h2>
        <div
          className="chart-container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            height: '200px',
            padding: '20px 0',
            borderBottom: '2px solid #e5e7eb',
            overflowX: 'auto',
          }}
        >
          {stats.weeklyAttendance.map((day) => {
            const maxCount = Math.max(...stats.weeklyAttendance.map((d) => d.count), 1);
            const height = (day.count / maxCount) * 150;
            const isToday = day.date === new Date().toISOString().split('T')[0];
            return (
              <div
                key={day.date}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '40px',
                    height: `${height}px`,
                    backgroundColor: isToday ? 'var(--gradient-start)' : 'var(--border-color)',
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'center',
                    color: isToday ? 'white' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    paddingBottom: '4px',
                  }}
                >
                  {day.count > 0 ? day.count : ''}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: isToday ? 'var(--gradient-start)' : 'var(--text-secondary)',
                  }}
                >
                  {day.day}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: '16px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}
        >
          Last 7 days attendance • Today highlighted in blue
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
          <Clock size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Recent Attendance
        </h2>
        {recentAttendance.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--text-secondary)',
            }}
          >
            <UserCheck size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No attendance records yet.</p>
            <p>Students will appear here when they scan their RF IDs.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    Student
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    RF ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    Time
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((record, index) => {
                  const profile = studentProfile(record);
                  return (
                    <tr
                      key={record.id ?? record.learner_reference_number ?? index}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor:
                          index % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        {profile?.first_name} {profile?.last_name}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                        {profile?.rfid_tag ?? (record as Attendance & { rfid_tag?: string }).rfid_tag}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {formatDateTime(record.created_at)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                          }}
                        >
                          Present
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
