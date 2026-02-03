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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div
          className="card"
          style={{ width: '100%', maxWidth: '400px', margin: '20px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <CheckCircle
              size={64}
              style={{ color: '#10b981', marginBottom: '24px' }}
            />
            <h1>Password Updated Successfully!</h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Your password has been updated successfully. You will be redirected
              to the login page shortly.
            </p>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p
              style={{
                color: '#6b7280',
                fontSize: '14px',
                marginTop: '16px',
              }}
            >
              Redirecting in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (recoveryReady !== true) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div
          className="card"
          style={{ width: '100%', maxWidth: '400px', margin: '20px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <h1>{recoveryReady === false ? 'Redirecting...' : 'Checking recovery link...'}</h1>
            <p style={{ color: '#6b7280' }}>
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: '400px', margin: '20px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Lock size={48} style={{ color: '#4f46e5', marginBottom: '16px' }} />
          <h1>Update Your Password</h1>
          <p style={{ color: '#6b7280' }}>
            Please enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
              }}
            >
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                }}
                placeholder="Enter new password"
                required
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
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
              }}
            >
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                }}
                placeholder="Confirm new password"
                required
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
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#4f46e5',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
