'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { FileText, Calendar, Filter, Download, Search } from 'lucide-react';
import type { Attendance, StudentProfile } from '@/types/database';

interface AttendanceWithProfile extends Attendance {
  student_profile?: StudentProfile | null;
}

interface FilterState {
  studentId: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

export default function AttendanceRecords() {
  const [records, setRecords] = useState<AttendanceWithProfile[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceWithProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    studentId: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...records];
    if (filters.studentId) {
      filtered = filtered.filter(
        (record) => record.learner_reference_number === filters.studentId
      );
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (record) =>
          record.created_at &&
          new Date(record.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (record) =>
          record.created_at && new Date(record.created_at) <= toDate
      );
    }
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((record) => {
        const studentName = `${record.student_profile?.first_name ?? ''} ${record.student_profile?.last_name ?? ''}`.toLowerCase();
        return (
          studentName.includes(searchLower) ||
          (record.rfid_tag?.toLowerCase().includes(searchLower) ?? false)
        );
      });
    }
    setFilteredRecords(filtered);
  }, [records, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: attendanceData, error: attendanceError } = await db.attendance.getAll();
      if (attendanceError) throw attendanceError;
      const { data: studentsData, error: studentsError } = await db.studentProfiles.getAll();
      if (studentsError) throw studentsError;
      setRecords((attendanceData as AttendanceWithProfile[]) || []);
      setStudents((studentsData as StudentProfile[]) || []);
    } catch (err) {
      setError('Failed to load attendance records');
      console.error('Load records error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      studentId: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: '',
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Student Name', 'Grade', 'RF ID', 'Status'];
    const csvData = filteredRecords.map((record) => [
      record.created_at ? new Date(record.created_at).toLocaleDateString() : '',
      record.created_at ? new Date(record.created_at).toLocaleTimeString() : '',
      `${record.student_profile?.first_name ?? ''} ${record.student_profile?.last_name ?? ''}`,
      record.student_profile?.grade_level ?? '',
      record.rfid_tag ?? '',
      'Present',
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return { date: '', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const getAttendanceStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const todayCount = filteredRecords.filter(
      (record) => record.created_at?.startsWith(today)
    ).length;
    const weekCount = filteredRecords.filter(
      (record) => record.created_at && new Date(record.created_at) >= thisWeek
    ).length;
    return {
      total: filteredRecords.length,
      today: todayCount,
      week: weekCount,
    };
  };

  if (loading) {
    return <LoadingSpinner message="Loading attendance records..." />;
  }

  const stats = getAttendanceStats();

  return (
    <div>
      <div className="mb-8">
        <h1>Attendance Records</h1>
        <p className="text-lg text-muted">View and manage attendance history</p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="card text-center">
          <h3 className="text-2xl font-bold stats-total">{stats.total}</h3>
          <p className="text-muted">Total Records</p>
        </div>
        <div className="card text-center">
          <h3 className="text-2xl font-bold stats-today">{stats.today}</h3>
          <p className="text-muted">Today</p>
        </div>
        <div className="card text-center">
          <h3 className="text-2xl font-bold stats-week">{stats.week}</h3>
          <p className="text-muted">This Week</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-5 flex items-center">
          <Filter size={20} className="mr-2" />
          Filters
        </h2>
        <div className="filter-grid">
          <div className="form-group">
            <label className="form-label flex items-center">
              <Search size={16} className="mr-2" />
              Search Student
            </label>
            <input
              type="text"
              name="searchTerm"
              className="form-input"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Search by name or RF ID"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Student</label>
            <select
              name="studentId"
              className="form-input"
              value={filters.studentId}
              onChange={handleFilterChange}
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option
                  key={student.learner_reference_number ?? student.id}
                  value={student.learner_reference_number ?? ''}
                >
                  {student.first_name} {student.last_name} - {student.grade_level}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label flex items-center">
              <Calendar size={16} className="mr-2" />
              From Date
            </label>
            <input
              type="date"
              name="dateFrom"
              className="form-input"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label flex items-center">
              <Calendar size={16} className="mr-2" />
              To Date
            </label>
            <input
              type="date"
              name="dateTo"
              className="form-input"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        <div className="button-row">
          <button onClick={clearFilters} className="btn btn-secondary">
            Clear Filters
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-primary flex items-center gap-2"
            disabled={filteredRecords.length === 0}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <FileText size={24} className="mr-2" />
          Records ({filteredRecords.length})
        </h2>
        {filteredRecords.length === 0 ? (
          <div className="text-center p-10 text-muted">
            <FileText size={48} className="mb-4 opacity-50" />
            <p>No attendance records found.</p>
            {Object.values(filters).some((v) => v) ? (
              <p>Try adjusting your filters or clearing them.</p>
            ) : (
              <p>Records will appear here when students scan their RF IDs.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="hide-mobile p-3 text-left font-semibold">Time</th>
                  <th className="p-3 text-left font-semibold">Student</th>
                  <th className="hide-mobile p-3 text-left font-semibold">Grade</th>
                  <th className="hide-mobile p-3 text-left font-semibold">RF ID</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const { date, time } = formatDateTime(record.created_at);
                  return (
                    <tr key={record.id ?? record.learner_reference_number ?? ''}>
                      <td className="p-3">
                        <div>{date}</div>
                        <div className="hide-mobile text-xs text-muted">{time}</div>
                      </td>
                      <td className="hide-mobile p-3">{time}</td>
                      <td className="p-3">
                        <div className="font-semibold">
                          {record.student_profile?.first_name}{' '}
                          {record.student_profile?.last_name}
                        </div>
                        <div className="text-xs text-muted block show-mobile">
                          {record.student_profile?.grade_level} • {record.rfid_tag}
                        </div>
                      </td>
                      <td className="hide-mobile p-3">
                        {record.student_profile?.grade_level}
                      </td>
                      <td className="hide-mobile p-3 font-mono">
                        {record.rfid_tag}
                      </td>
                      <td className="p-3">
                        <span className="status-present">Present</span>
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
