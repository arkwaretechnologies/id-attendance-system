'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getSchoolById } from '@/lib/adminService';
import { LogIn, User, Lock, Building2, ArrowRight, ArrowLeft } from 'lucide-react';

type Step = 'school' | 'credentials';

export default function Login() {
  const [step, setStep] = useState<Step>('school');
  const [schoolIdInput, setSchoolIdInput] = useState('');
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validatingSchool, setValidatingSchool] = useState(false);
  const { signIn, loading } = useAuth();

  const handleSchoolContinue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const raw = schoolIdInput.trim();
    const id = raw ? Number(raw) : NaN;
    if (!Number.isInteger(id) || id <= 0) {
      setError('Please enter a valid school ID (positive number).');
      return;
    }
    setValidatingSchool(true);
    try {
      const { data, error: fetchError } = await getSchoolById(id);
      if (fetchError || !data) {
        setError('School ID not found. Please check the ID and try again.');
        return;
      }
      setSchoolName(data.school_name ?? null);
      setStep('credentials');
    } finally {
      setValidatingSchool(false);
    }
  };

  const handleBackToSchool = () => {
    setStep('school');
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const raw = schoolIdInput.trim();
    const schoolId = raw ? Number(raw) : NaN;
    if (!Number.isInteger(schoolId) || schoolId <= 0) {
      setError('Invalid school ID. Please go back and enter a valid school ID.');
      return;
    }

    if (!username.trim() || !password) {
      setError('Please fill in username and password.');
      return;
    }

    const { error: signInError } = await signIn(schoolId, username.trim(), password);
    if (signInError) {
      setError((signInError as Error).message ?? 'Sign in failed.');
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    zIndex: 0,
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    margin: '20px',
    position: 'relative',
    zIndex: 1,
  };

  return (
    <div style={containerStyle}>
      <div className="card" style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <LogIn size={48} style={{ color: '#3b82f6', marginBottom: '16px' }} />
          <h1>Welcome Back</h1>
          <p style={{ color: '#6b7280' }}>
            {step === 'school'
              ? 'Enter your school ID to continue'
              : 'Sign in to your ID Attendance System account'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {step === 'school' ? (
          <form onSubmit={handleSchoolContinue}>
            <div className="form-group">
              <label className="form-label">
                <Building2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                School ID
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-input"
                value={schoolIdInput}
                onChange={(e) => setSchoolIdInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your school ID"
                required
                disabled={validatingSchool}
                autoFocus
              />
            </div>
            <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '20px' }}
                disabled={validatingSchool}
              >
              {validatingSchool ? 'Checking...' : (
                <>
                  Continue
                  <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                </>
              )}
            </button>
          </form>
        ) : (
          <>
            {schoolName && (
              <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                School: <strong>{schoolName}</strong> (ID: {schoolIdInput})
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '12px' }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '20px' }}
                onClick={handleBackToSchool}
                disabled={loading}
              >
                <ArrowLeft size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Back to school ID
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link
                href="/reset-password"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Forgot your password?
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
