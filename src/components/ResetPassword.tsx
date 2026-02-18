'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError((resetError as Error).message ?? 'Failed to send reset link');
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page__card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
            <h1 className="auth-page__title">Check Your Email</h1>
            <p className="auth-page__subtitle" style={{ marginBottom: '1rem' }}>
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="auth-page__subtitle" style={{ fontSize: '0.875rem' }}>
              Please check your email and click the link to reset your password.
              Don&apos;t forget to check your spam folder if you don&apos;t see it
              in your inbox.
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/login" className="auth-page__btn">
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Mail size={48} style={{ color: '#06b6d4', marginBottom: '1rem' }} />
          <h1 className="auth-page__title">Reset Password</h1>
          <p className="auth-page__subtitle">
            Enter your email address and we&apos;ll send you a link to reset your
            password
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="reset-email" className="form-label">
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Type your email"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="auth-page__btn"
            style={{ marginBottom: '1.25rem' }}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/login"
            style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
