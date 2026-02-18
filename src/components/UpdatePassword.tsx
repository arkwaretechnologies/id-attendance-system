'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function UpdatePassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState<boolean | null>(null);
  const { updatePassword, supabase } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken =
      searchParams.get('access_token') ?? hashParams.get('access_token');
    const refreshToken =
      searchParams.get('refresh_token') ?? hashParams.get('refresh_token');
    const type = searchParams.get('type') ?? hashParams.get('type');

    if (type === 'recovery' && accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => {
          setRecoveryReady(true);
          router.replace('/update-password', { scroll: false });
        })
        .catch(() => {
          setRecoveryReady(false);
        });
    } else {
      setRecoveryReady((prev) => (prev === null ? false : prev));
    }
  }, [searchParams, router, supabase.auth]);

  useEffect(() => {
    if (recoveryReady === false) {
      router.replace('/reset-password');
    }
  }, [recoveryReady, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password) {
      setError('Please enter a new password');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { error: updateError } = await updatePassword(password);
    if (updateError) {
      setError((updateError as Error).message ?? 'Failed to update password');
    } else {
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 3000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page__card">
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={64} style={{ color: '#10b981', marginBottom: '1.5rem' }} />
            <h1 className="auth-page__title">Password Updated Successfully!</h1>
            <p className="auth-page__subtitle" style={{ marginBottom: '1.5rem' }}>
              Your password has been updated successfully. You will be redirected
              to the login page shortly.
            </p>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
            <p className="auth-page__subtitle" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              Redirecting in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (recoveryReady !== true) {
    return (
      <div className="auth-page">
        <div className="auth-page__card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <h1 className="auth-page__title">
              {recoveryReady === false ? 'Redirecting...' : 'Checking recovery link...'}
            </h1>
            <p className="auth-page__subtitle">
              {recoveryReady === false
                ? 'Taking you back to reset password.'
                : 'Please wait.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Lock size={48} style={{ color: '#06b6d4', marginBottom: '1rem' }} />
          <h1 className="auth-page__title">Update Your Password</h1>
          <p className="auth-page__subtitle">
            Please enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="new-password" className="form-label">
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your new password"
                required
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirm-password" className="form-label">
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-page__btn" disabled={loading}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
