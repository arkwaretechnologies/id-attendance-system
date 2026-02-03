'use client';

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p style={{ marginTop: '16px', color: '#6b7280' }}>{message}</p>
    </div>
  );
}
