'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError((signInError as Error).message ?? 'Sign in failed');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: 0,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <LogIn size={48} style={{ color: '#3b82f6', marginBottom: '16px' }} />
          <h1>Welcome Back</h1>
          <p style={{ color: '#6b7280' }}>
            Sign in to your ID Attendance System account
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
            style={{ width: '100%', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
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
      </div>
    </div>
  );
}
