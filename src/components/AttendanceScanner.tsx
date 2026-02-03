'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, supabase } from '@/lib/supabase';
import SemaphoreSmsService from '@/lib/semaphoreSmsService';
import {
  Scan,
  UserCheck,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { StudentProfile, Attendance } from '@/types/database';

interface StudentStatus {
  canTimeOut: boolean;
  hasTimedIn: boolean;
}

type ScanModeType = 'time_in' | 'time_out';

export default function AttendanceScanner() {
  const [rfId, setRfId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | ''>('');
  const [lastScannedStudent, setLastScannedStudent] = useState<StudentProfile | null>(null);
  const [recentScans, setRecentScans] = useState<(Attendance & { student_profile?: StudentProfile })[]>([]);
  const [sessionFilter, setSessionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(5);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showDuplicateOverlay, setShowDuplicateOverlay] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [scanMode, setScanMode] = useState<ScanModeType>('time_in');
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRecentScans();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [sessionFilter]);

  const loadRecentScans = async () => {
    try {
      const { data, error } = await db.attendance.getAll();
      if (error) throw error;
      const today = new Date().toISOString().split('T')[0];
      const todayScans =
        (data as (Attendance & { created_at?: string })[] | null)?.filter(
          (record) => record.created_at?.startsWith(today)
        ) ?? [];
      type ScanRecord = Attendance & { created_at?: string };
      const groupedScans = todayScans.reduce<Record<string, ScanRecord[]>>(
        (acc, scan) => {
          const key = scan.learner_reference_number ?? '';
          if (!acc[key]) acc[key] = [];
          acc[key].push(scan);
          return acc;
        },
        {}
      );
      const sortedScans = Object.values(groupedScans)
        .map((studentScans) =>
          studentScans.sort(
            (a, b) => (a.session_number ?? 1) - (b.session_number ?? 1)
          )
        )
        .flat()
        .slice(0, 10);
      setRecentScans(sortedScans as (Attendance & { student_profile?: StudentProfile })[]);
    } catch (err) {
      console.error('Error loading recent scans:', err);
    }
  };

  const handleScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rfId.trim()) return;

    setScanning(true);
    setMessage('');
    setMessageType('');

    try {
      const { data: student, error: studentError } =
        await db.studentProfiles.getByRfId(rfId.trim());

      if (studentError || !student) {
        setMessage(`No student found with RF ID: ${rfId}`);
        setMessageType('error');
        setLastScannedStudent(null);
        return;
      }

      const profile = student as StudentProfile;

      if (scanMode === 'time_in') {
        const timeInArgs = {
          learner_ref_number: profile.learner_reference_number ?? null,
          rfid_tag: profile.rfid_tag ?? null,
          grade_level: profile.grade_level ?? null,
          school_year: profile.school_year ?? '2024-2025',
        };
        // RPC args typed via Database; client inference expects undefined for unlisted RPCs
        const { data: timeInResult, error: timeInError } = await supabase.rpc(
          'record_time_in',
          timeInArgs as never
        );

        if (timeInError) throw timeInError;

        const resultList = timeInResult as { success?: boolean; message?: string }[] | null;
        if (resultList && resultList.length > 0) {
          const result = resultList[0];
          if (result.success) {
            setMessage(
              `✅ ${profile.first_name} ${profile.last_name} timed in successfully!`
            );
            setMessageType('success');
            setStudentStatus({ canTimeOut: true, hasTimedIn: true });
            setLastScannedStudent(profile);
            setShowSuccessOverlay(true);
            setTimeout(() => setShowSuccessOverlay(false), 1500);
          } else {
            setMessage(result.message ?? '');
            setMessageType('info');
            setStudentStatus({
              canTimeOut: result.message?.includes('time out') ?? false,
              hasTimedIn: true,
            });
            setLastScannedStudent(profile);
            setDuplicateMessage(result.message ?? '');
            setShowDuplicateOverlay(true);
            setTimeout(() => setShowDuplicateOverlay(false), 1500);
            return;
          }
        }
      } else {
        const timeOutArgs = {
          learner_ref_number: profile.learner_reference_number ?? null,
        };
        const { data: timeOutResult, error: timeOutError } = await supabase.rpc(
          'record_time_out',
          timeOutArgs as never
        );

        if (timeOutError) throw timeOutError;

        const resultList = timeOutResult as {
          success?: boolean;
          message?: string;
          duration_hours?: string | number;
        }[] | null;
        if (resultList && resultList.length > 0) {
          const result = resultList[0];
          if (result.success) {
            const duration =
              result.duration_hours != null
                ? Number(result.duration_hours).toFixed(2)
                : 'N/A';
            setMessage(
              `✅ ${profile.first_name} ${profile.last_name} timed out successfully! Duration: ${duration} hours`
            );
            setMessageType('success');
            setStudentStatus({ canTimeOut: false, hasTimedIn: true });
            setLastScannedStudent(profile);
            setShowSuccessOverlay(true);
            setTimeout(() => setShowSuccessOverlay(false), 2000);
          } else {
            setMessage(result.message ?? '');
            setMessageType('error');
            setStudentStatus({ canTimeOut: false, hasTimedIn: false });
            setLastScannedStudent(profile);
            setDuplicateMessage(result.message ?? '');
            setShowDuplicateOverlay(true);
            setTimeout(() => setShowDuplicateOverlay(false), 3000);
            return;
          }
        }
      }

      await loadRecentScans();
      await sendParentNotification(profile, scanMode);
    } catch (err) {
      setMessage('Error processing scan. Please try again.');
      setMessageType('error');
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
      setRfId('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const sendParentNotification = async (
    student: StudentProfile,
    scanType: ScanModeType
  ) => {
    try {
      const semaphoreSmsService = new SemaphoreSmsService();
      const smsResult = await semaphoreSmsService.sendAttendanceNotification(
        student,
        scanType
      );
      if (smsResult.success) {
        setMessage((prev) => `${prev} Parent notified via SMS.`);
      } else {
        setMessage((prev) => `${prev} SMS notification failed.`);
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString();
  };

  const filteredScans = useMemo(() => {
    if (sessionFilter === 'all') return recentScans;
    return recentScans.filter(
      (scan) => (scan.session_number ?? 1).toString() === sessionFilter
    );
  }, [recentScans, sessionFilter]);

  const totalPages = Math.ceil(filteredScans.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentScans = filteredScans.slice(startIndex, endIndex);

  const displayGrade = (s: StudentProfile) =>
    (s as StudentProfile & { grade?: string }).grade ?? s.grade_level;
  const displayRfId = (s: StudentProfile) =>
    (s as StudentProfile & { rf_id?: string }).rf_id ?? s.rfid_tag;
  const displayParent = (s: StudentProfile) =>
    (s as StudentProfile & { parent_name?: string }).parent_name ?? '';

  return (
    <div>
      {showSuccessOverlay && lastScannedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl text-center max-w-sm w-11/12 shadow-2xl">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Attendance Recorded!
            </h2>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                {lastScannedStudent.first_name} {lastScannedStudent.last_name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Grade: {displayGrade(lastScannedStudent)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                RF ID: {lastScannedStudent.rfid_tag}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Time: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="py-3 px-6 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-lg font-semibold">
              ✓ Present
            </div>
          </div>
        </div>
      )}

      {showDuplicateOverlay && lastScannedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl text-center max-w-sm w-11/12 shadow-2xl">
            <AlertTriangle size={64} className="text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Already Recorded!
            </h2>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                {lastScannedStudent.first_name} {lastScannedStudent.last_name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Grade: {displayGrade(lastScannedStudent)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                RF ID: {lastScannedStudent.rfid_tag}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Time: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="py-3 px-6 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-lg text-lg font-semibold">
              {duplicateMessage}
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          RF ID Scanner
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Scan student RF IDs to mark attendance
        </p>
      </div>

      <div className="card mb-8">
        <div className="text-center mb-6">
          <Scan
            size={64}
            className={`mx-auto mb-4 ${scanMode === 'time_in' ? 'text-green-500' : 'text-red-500'}`}
          />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {scanMode === 'time_in' ? 'Time In Scanner' : 'Time Out Scanner'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {scanMode === 'time_in'
              ? 'Scan student RF ID to record arrival time'
              : 'Scan student RF ID to record departure time'}
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-100 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => {
                setScanMode('time_in');
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'time_in'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Time In
            </button>
            <button
              type="button"
              onClick={() => {
                setScanMode('time_out');
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'time_out'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Time Out
            </button>
          </div>
        </div>

        <form onSubmit={handleScan} className="max-w-sm mx-auto">
          <div className="form-group">
            <input
              ref={inputRef}
              type="text"
              className="form-input text-center text-lg p-4 font-mono"
              value={rfId}
              onChange={(e) => setRfId(e.target.value)}
              placeholder="Enter RF ID (e.g., 1234567890)"
              disabled={scanning}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className={`w-full p-4 text-lg font-semibold rounded-lg transition-colors ${
              scanMode === 'time_in'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            disabled={scanning || !rfId.trim()}
          >
            {scanning
              ? 'Processing...'
              : scanMode === 'time_in'
                ? 'Record Time In'
                : 'Record Time Out'}
          </button>
        </form>

        {message && (
          <div
            className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'} mt-6 text-center`}
          >
            {messageType === 'success' && (
              <CheckCircle size={20} className="inline mr-2 align-middle" />
            )}
            {messageType === 'error' && (
              <AlertCircle size={20} className="inline mr-2 align-middle" />
            )}
            {messageType === 'info' && (
              <UserCheck size={20} className="inline mr-2 align-middle" />
            )}
            {message}
          </div>
        )}

        {lastScannedStudent && (
          <div
            className={`mt-6 p-5 rounded-lg text-center ${
              messageType === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : messageType === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              {lastScannedStudent.first_name} {lastScannedStudent.last_name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              Grade: {displayGrade(lastScannedStudent)}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              RF ID: {lastScannedStudent.rfid_tag ?? displayRfId(lastScannedStudent)}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Parent: {displayParent(lastScannedStudent)}
            </p>
            {studentStatus && (
              <div className="mt-3">
                {studentStatus.canTimeOut ? (
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                    🏫 Currently in School - Can Time Out
                  </div>
                ) : studentStatus.hasTimedIn ? (
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                    ✅ Attendance Complete
                  </div>
                ) : (
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    📝 Ready for Time In
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Today&apos;s Scans
          </h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Session:
            </label>
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Sessions</option>
              <option value="1">Session 1</option>
              <option value="2">Session 2</option>
            </select>
          </div>
        </div>

        {filteredScans.length === 0 ? (
          <div className="card text-center py-10 text-gray-600 dark:text-gray-400">
            <UserCheck size={48} className="mx-auto mb-4 opacity-50" />
            <p>
              {sessionFilter === 'all'
                ? 'No scans today yet.'
                : `No Session ${sessionFilter} scans today yet.`}
            </p>
          </div>
        ) : (
          <>
            <div
              className="grid gap-3"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              {currentScans.map((scan) => (
                <div
                  key={scan.id ?? scan.learner_reference_number ?? ''}
                  className="flex justify-between items-center p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div>
                    <h4 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
                      {scan.student_profile?.first_name}{' '}
                      {scan.student_profile?.last_name}
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                        Session {scan.session_number ?? 1}
                      </span>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Grade {scan.grade_level} • RF ID: {scan.rfid_tag}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="space-y-1">
                      {scan.time_in && (
                        <div className="text-sm">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mr-1">
                            In: {formatTime(scan.time_in)}
                          </span>
                        </div>
                      )}
                      {scan.time_out && (
                        <div className="text-sm">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                            Out: {formatTime(scan.time_out)}
                          </span>
                        </div>
                      )}
                      {!scan.time_in && !scan.time_out && (
                        <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mb-1">
                          Present
                        </div>
                      )}
                    </div>
                    {scan.time_in && scan.time_out && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        Duration:{' '}
                        {(
                          (new Date(scan.time_out).getTime() -
                            new Date(scan.time_in).getTime()) /
                          (1000 * 60 * 60)
                        ).toFixed(1)}
                        h
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium border ${
                        currentPage === page
                          ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredScans.length)} of {filteredScans.length}{' '}
              records
            </div>
          </>
        )}
      </div>
    </div>
  );
}
