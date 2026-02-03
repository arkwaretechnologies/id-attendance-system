'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

type StatusType = 'loading' | 'success' | 'error';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useAuth();
  const [status, setStatus] = useState<StatusType>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(
          typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const urlType = searchParams.get('type');
        const urlToken = searchParams.get('token');

        if (type === 'signup' || urlType === 'signup') {
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to dashboard...');
            setTimeout(() => router.replace('/dashboard'), 2000);
          } else if (urlToken) {
            const { error } = await supabase.auth.verifyOtp({
              token_hash: urlToken,
              type: 'signup',
            });
            if (error) throw error;
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to dashboard...');
            setTimeout(() => router.replace('/dashboard'), 2000);
          } else {
            throw new Error('Invalid confirmation link');
          }
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error ? error.message : 'Failed to confirm email. Please try again.'
        );
      }
    };

    handleAuthCallback();
  }, [router, searchParams, supabase]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader
              size={48}
              className="animate-spin"
              style={{ color: '#3b82f6', marginBottom: '16px' }}
            />
            <h1>Confirming Email</h1>
            <p style={{ color: '#6b7280' }}>
              Please wait while we confirm your email address...
            </p>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle
              size={48}
              style={{ color: '#10b981', marginBottom: '16px' }}
            />
            <h1>Email Confirmed!</h1>
            <p style={{ color: '#6b7280' }}>{message}</p>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle
              size={48}
              style={{ color: '#ef4444', marginBottom: '16px' }}
            />
            <h1>Confirmation Failed</h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>{message}</p>
            <button
              onClick={() => router.replace('/login')}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Go to Login
            </button>
          </>
        );
      default:
        return null;
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
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
