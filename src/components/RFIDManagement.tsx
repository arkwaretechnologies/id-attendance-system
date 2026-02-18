'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import type { StudentProfile } from '@/types/database';
import { Search, Tag, Users, AlertCircle, CheckCircle, X, Edit3, Trash2, Plus } from 'lucide-react';

const PAGE_SIZE = 50;
const ROW_HEIGHT = 56;

const RFIDManagement = () => {
  const { schoolId } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    schoolYear: '',
    gradeLevel: '',
  });
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [newRfId, setNewRfId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const buildParams = useCallback(
    (cursor: string | null) => {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (filters.schoolYear) params.set('schoolYear', filters.schoolYear);
      if (filters.gradeLevel) params.set('gradeLevel', filters.gradeLevel);
      if (cursor) params.set('cursor', cursor);
      return params;
    },
    [searchTerm, filters.schoolYear, filters.gradeLevel]
  );

  const loadStudents = useCallback(
    async (reset: boolean, cursor: string | null) => {
      if (reset) {
        setNextCursor(null);
        setHasMore(true);
      }
      const isInitial = reset || students.length === 0;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);
      setError('');
      try {
        const params = buildParams(cursor);
        params.set('_t', String(Date.now()));
        const res = await fetch(`/api/students/rfid-search?${params}`, {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? 'Failed to load students');
        const list = (result.students ?? []) as StudentProfile[];
        const newCursor = result.next_cursor ?? null;
        const more = Boolean(result.has_more);
        if (reset) {
          setStudents(list);
        } else {
          setStudents((prev) => [...prev, ...list]);
        }
        setNextCursor(newCursor);
        setHasMore(more);
      } catch (err) {
        setError('Failed to load students: ' + (err as Error).message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams]
  );

  const reloadStudents = useCallback(() => {
    loadStudents(true, null);
  }, [loadStudents]);

  useEffect(() => {
    loadInitialData();
  }, [schoolId]);

  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/students/filters', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load filters');
      setSchoolYears(Array.isArray(data.schoolYears) ? data.schoolYears : []);
      setGradeLevels(Array.isArray(data.gradeLevels) ? data.gradeLevels : []);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadStudents(true, null);
  }, [schoolId, searchTerm, filters.schoolYear, filters.gradeLevel, loadStudents]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading || !nextCursor) return;
    setLoadingMore(true);
    setError('');
    const params = buildParams(nextCursor);
    params.set('_t', String(Date.now()));
    fetch(`/api/students/rfid-search?${params}`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result.students) return;
        const list = (result.students ?? []) as StudentProfile[];
        setStudents((prev) => [...prev, ...list]);
        setNextCursor(result.next_cursor ?? null);
        setHasMore(Boolean(result.has_more));
      })
      .catch((err) => setError('Failed to load more: ' + (err as Error).message))
      .finally(() => setLoadingMore(false));
  }, [hasMore, loadingMore, loading, nextCursor, buildParams]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ schoolYear: '', gradeLevel: '' });
  };

  const openAssignModal = (student: StudentProfile) => {
    setSelectedStudent(student);
    setNewRfId(student.rfid_tag || '');
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedStudent(null);
    setNewRfId('');
    setAssignLoading(false);
  };

  const handleAssignRfId = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const student = selectedStudent;
    if (!student || !newRfId.trim()) return;

    try {
      setAssignLoading(true);
      setError('');
      setSuccess('');

      if (newRfId.trim() !== student.rfid_tag) {
        const checkRes = await fetch(
          `/api/students/check-rfid?rfid=${encodeURIComponent(newRfId.trim())}`,
          { credentials: 'include' }
        );
        const checkData = await checkRes.json();
        const existing = checkData.student as { id: string; first_name?: string; last_name?: string } | null;
        if (existing && existing.id !== student.id) {
          throw new Error(`RFID ${newRfId} is already assigned to ${existing.first_name ?? ''} ${existing.last_name ?? ''}`);
        }
      }

      const patchRes = await fetch(`/api/students/${student.id}/rfid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rfid_tag: newRfId.trim() }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error ?? 'Failed to update RFID');

      setSuccess(`RFID successfully ${student.rfid_tag ? 'updated' : 'assigned'} for ${student.first_name} ${student.last_name}`);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id ? { ...s, rfid_tag: newRfId.trim() } : s
        )
      );
      closeAssignModal();
      reloadStudents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveRfId = async (student: StudentProfile) => {
    if (!confirm(`Are you sure you want to remove the RFID tag from ${student.first_name} ${student.last_name}?`)) return;

    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/students/${student.id}/rfid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rfid_tag: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove RFID');

      setSuccess(`RFID tag removed from ${student.first_name} ${student.last_name}`);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, rfid_tag: null } : s))
      );
      reloadStudents();
    } catch (err) {
      setError('Failed to remove RFID: ' + (err as Error).message);
    }
  };

  const getRfIdStatus = (student: StudentProfile) => {
    if (student.rfid_tag) {
      return { status: 'assigned', className: 'text-green-500', icon: CheckCircle, text: 'Assigned' };
    }
    return { status: 'unassigned', className: 'text-amber-500', icon: AlertCircle, text: 'Not Assigned' };
  };

  const rowVirtualizer = useVirtualizer({
    count: students.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !hasMore || loadingMore || !nextCursor) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMore();
    }
  }, [hasMore, loadingMore, nextCursor, loadMore]);

  if (loading && students.length === 0) {
    return <LoadingSpinner message="Loading students..." />;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">RFID Management</h1>
        <p className="text-lg text-primary-600 dark:text-gray-400">Assign and manage RFID tags for students</p>
      </div>

      {success && (
        <div className="alert alert-success mb-6">
          <CheckCircle size={20} className="mr-2" />
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <div className="card mb-6" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <h2 className="text-xl font-bold text-primary-700 dark:text-gray-200 mb-5 flex items-center">
          <Search size={20} className="mr-2" />
          Search Students
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name or LRN"
            />
          </div>
          <div className="form-group">
            <label className="form-label">School Year</label>
            <select name="schoolYear" className="form-input" value={filters.schoolYear} onChange={handleFilterChange}>
              <option value="">All School Years</option>
              {schoolYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Grade Level</label>
            <select name="gradeLevel" className="form-input" value={filters.gradeLevel} onChange={handleFilterChange}>
              <option value="">All Grade Levels</option>
              {gradeLevels.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          <div className="form-group flex items-end">
            <button type="button" className="btn btn-secondary w-full" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-primary-700 dark:text-gray-200 flex items-center">
            <Users size={20} className="mr-2" />
            Students {students.length > 0 && `(${students.length}${hasMore ? '+' : ''})`}
          </h2>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-10 text-gray-700 dark:text-gray-300">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No students found</p>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <>
            <div
              className="rfid-table-header grid grid-cols-[minmax(80px,1fr)_minmax(120px,2fr)_minmax(70px,1fr)_minmax(80px,1fr)_minmax(90px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] gap-2 px-3 py-2 text-left text-xs font-semibold uppercase border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-t-lg"
            >
              <span>LRN</span>
              <span>Student Name</span>
              <span className="hide-mobile">Grade</span>
              <span className="hide-mobile">School Year</span>
              <span>Status</span>
              <span>RFID Tag</span>
              <span>Actions</span>
            </div>
            <div
              ref={scrollContainerRef}
              className="overflow-auto overflow-x-auto border-b border-gray-200 dark:border-gray-700 rounded-b-lg"
              style={{ minHeight: 320, maxHeight: '60vh' }}
              onScroll={handleScroll}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const student = students[virtualRow.index];
                  if (!student) return null;
                  const rfidStatus = getRfIdStatus(student);
                  const StatusIcon = rfidStatus.icon;
                  return (
                    <div
                      key={student.id}
                      className="absolute left-0 w-full grid grid-cols-[minmax(80px,1fr)_minmax(120px,2fr)_minmax(70px,1fr)_minmax(80px,1fr)_minmax(90px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] gap-2 px-3 py-2 items-center border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                      style={{
                        height: ROW_HEIGHT,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <span className="truncate">{student.learner_reference_number || 'N/A'}</span>
                      <span className="truncate">
                        {student.last_name}, {student.first_name} {student.middle_name} {student.extension_name}
                      </span>
                      <span className="hide-mobile truncate">{student.grade_level || 'N/A'}</span>
                      <span className="hide-mobile truncate">{student.school_year || 'N/A'}</span>
                      <span className={`flex items-center ${rfidStatus.className}`}>
                        <StatusIcon size={16} className="mr-1.5 flex-shrink-0" />
                        <span className="font-medium truncate">{rfidStatus.text}</span>
                      </span>
                      <span className="truncate">
                        {student.rfid_tag ? (
                          <span className="font-mono text-sm dark:text-white bg-teal-100 dark:bg-teal-700 px-2 py-0.5 rounded">
                            {student.rfid_tag}
                          </span>
                        ) : (
                          <span className="text-red-900 dark:text-gray-400 italic">Not assigned</span>
                        )}
                      </span>
                      <span className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => openAssignModal(student)}
                          title={student.rfid_tag ? 'Update RFID' : 'Assign RFID'}
                        >
                          {student.rfid_tag ? <Edit3 size={14} /> : <Plus size={14} />}
                        </button>
                        {student.rfid_tag && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveRfId(student)}
                            title="Remove RFID"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {loadingMore && (
              <div className="flex justify-center py-3 text-sm text-gray-500 dark:text-gray-400">
                Loading more...
              </div>
            )}
          </>
        )}
      </div>

      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeAssignModal}>
          <div className="rfid-modal bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="rfid-modal-title text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Tag size={20} className="mr-2" />
                {selectedStudent.rfid_tag ? 'Update' : 'Assign'} RFID Tag
              </h3>
              <button onClick={closeAssignModal} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close">
                <X size={24} />
              </button>
            </div>
            <div>
              <div className="rfid-modal-info-box mb-5 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h4 className="rfid-modal-info-title text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Student Information</h4>
                <p className="rfid-modal-info-text text-sm text-gray-900 dark:text-gray-200"><strong>Name:</strong> {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.last_name} {selectedStudent.extension_name}</p>
                <p className="rfid-modal-info-text text-sm text-gray-900 dark:text-gray-200"><strong>LRN:</strong> {selectedStudent.learner_reference_number || 'N/A'}</p>
                <p className="rfid-modal-info-text text-sm text-gray-900 dark:text-gray-200"><strong>Grade:</strong> {selectedStudent.grade_level || 'N/A'}</p>
                <p className="rfid-modal-info-text text-sm text-gray-900 dark:text-gray-200"><strong>School Year:</strong> {selectedStudent.school_year || 'N/A'}</p>
                {selectedStudent.rfid_tag && (
                  <p className="rfid-modal-info-text text-sm text-gray-900 dark:text-gray-200"><strong>Current RFID:</strong> <span className="font-mono">{selectedStudent.rfid_tag}</span></p>
                )}
              </div>
              <form onSubmit={handleAssignRfId}>
                <div className="form-group">
                  <label className="form-label text-gray-900 dark:text-gray-300">RFID Tag</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    value={newRfId}
                    onChange={(e) => setNewRfId(e.target.value)}
                    placeholder="Enter RFID tag (e.g., 1234567890)"
                    required
                    disabled={assignLoading}
                  />
                  <p className="rfid-modal-help text-sm text-gray-600 dark:text-gray-400 mt-1">Enter the RFID tag number to assign to this student</p>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" className="btn btn-secondary" onClick={closeAssignModal} disabled={assignLoading}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={assignLoading || !newRfId.trim()}>
                    {assignLoading ? 'Saving...' : selectedStudent.rfid_tag ? 'Update RFID' : 'Assign RFID'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIDManagement;
