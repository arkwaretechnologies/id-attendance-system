'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getSchoolById } from '@/lib/adminService';
import { User, Lock, Building2, ArrowRight } from 'lucide-react';

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

  return (
    <div className="login-page">
      <div className="login-page__shapes">
        <div className="login-page__shape login-page__shape--1" />
        <div className="login-page__shape login-page__shape--2" />
        <div className="login-page__shape login-page__shape--3" />
      </div>

      <div className="login-page__card">
        <h1 className="login-page__title">Login</h1>
        {step === 'school' && (
          <p className="login-page__subtitle">Enter your school ID to continue</p>
        )}
        {step === 'credentials' && schoolName && (
          <p className="login-page__subtitle">Sign in to {schoolName}</p>
        )}

        {error && (
          <div className="login-page__alert" role="alert">
            {error}
          </div>
        )}

        {step === 'school' ? (
          <form onSubmit={handleSchoolContinue} className="login-page__form">
            <div className="login-page__field">
              <label htmlFor="school-id" className="login-page__label">
                School ID
              </label>
              <div className="login-page__input-wrap">
                <Building2 size={20} className="login-page__input-icon" aria-hidden />
                <input
                  id="school-id"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="login-page__input"
                  value={schoolIdInput}
                  onChange={(e) => setSchoolIdInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Type your school ID"
                  required
                  disabled={validatingSchool}
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              className="login-page__btn"
              disabled={validatingSchool}
            >
              {validatingSchool ? 'Checking...' : 'Continue'}
              <ArrowRight size={18} className="login-page__btn-icon" aria-hidden />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="login-page__form">
            <div className="login-page__field">
              <label htmlFor="username" className="login-page__label">
                Username
              </label>
              <div className="login-page__input-wrap">
                <User size={20} className="login-page__input-icon" aria-hidden />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className="login-page__input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Type your username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-page__field">
              <label htmlFor="password" className="login-page__label">
                Password
              </label>
              <div className="login-page__input-wrap">
                <Lock size={20} className="login-page__input-icon" aria-hidden />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="login-page__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Type your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-page__forgot-wrap">
              <Link href="/reset-password" className="login-page__forgot">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="login-page__btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'LOGIN'}
            </button>

            <div className="login-page__bottom">
              <button
                type="button"
                onClick={handleBackToSchool}
                className="login-page__signup-link"
                disabled={loading}
              >
                Back to school ID
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
