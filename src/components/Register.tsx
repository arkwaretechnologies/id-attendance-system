'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export default function Register() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await signUp(formData.email, formData.password, {
        role: formData.role,
      });
      if (signUpError) {
        setError((signUpError as Error).message ?? 'Registration failed');
      }
    } catch {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

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
          <UserPlus size={48} style={{ color: '#3b82f6', marginBottom: '16px' }} />
          <h1>Create Account</h1>
          <p style={{ color: '#6b7280' }}>Join the ID Attendance System</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Role
            </label>
            <select
              name="role"
              className="form-input"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ color: '#6b7280' }}>Already have an account? </span>
          <Link
            href="/login"
            style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
