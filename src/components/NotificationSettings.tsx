'use client';

import React, { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notificationService';
import {
  Mail,
  MessageSquare,
  Settings,
  TestTube,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ConfigState {
  email: { configured: boolean; service: string };
  sms: { configured: boolean; service: string };
}

interface TestData {
  email: string;
  phone: string;
  studentName: string;
}

interface TestResultItem {
  type: 'email' | 'sms';
  success: boolean;
  error?: string;
}

interface TestResults {
  success: boolean;
  error?: string;
  results?: TestResultItem[];
}

export default function NotificationSettings() {
  const [config, setConfig] = useState<ConfigState>({
    email: { configured: false, service: '' },
    sms: { configured: false, service: '' },
  });
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [testing, setTesting] = useState(false);
  const [testData, setTestData] = useState<TestData>({
    email: '',
    phone: '',
    studentName: 'Test Student',
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const configData = await notificationService.testConfiguration();
      setConfig(configData);
    } catch (error) {
      console.error('Failed to load notification configuration:', error);
    }
  };

  const handleTestNotification = async () => {
    if (!testData.email && !testData.phone) {
      alert('Please enter at least an email or phone number to test');
      return;
    }
    setTesting(true);
    setTestResults(null);
    try {
      const mockStudent = {
        first_name: testData.studentName,
        last_name: 'Test',
        grade_level: '5',
        parent_email: testData.email || undefined,
        guardian_contact_number: testData.phone || undefined,
      };
      const result = await notificationService.sendAttendanceNotification(mockStudent);
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1>Notification Settings</h1>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>
          Configure and test parent notification system
        </p>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
          <Settings size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Service Configuration
        </h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: config.email.configured ? '#f0fdf4' : '#fef2f2',
              borderRadius: '8px',
              border: `1px solid ${config.email.configured ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Mail
                size={20}
                style={{
                  marginRight: '12px',
                  color: config.email.configured ? '#16a34a' : '#dc2626',
                }}
              />
              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>
                  Email Notifications
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Service: {config.email.service || 'Not configured'}
                </p>
              </div>
            </div>
            <div
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: config.email.configured ? '#dcfce7' : '#fee2e2',
                color: config.email.configured ? '#166534' : '#991b1b',
              }}
            >
              {config.email.configured ? 'Configured' : 'Not Configured'}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: config.sms.configured ? '#f0fdf4' : '#fef2f2',
              borderRadius: '8px',
              border: `1px solid ${config.sms.configured ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <MessageSquare
                size={20}
                style={{
                  marginRight: '12px',
                  color: config.sms.configured ? '#16a34a' : '#dc2626',
                }}
              />
              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>
                  SMS Notifications
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Service: {config.sms.service || 'Not configured'}
                </p>
              </div>
            </div>
            <div
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: config.sms.configured ? '#dcfce7' : '#fee2e2',
                color: config.sms.configured ? '#166534' : '#991b1b',
              }}
            >
              {config.sms.configured ? 'Configured' : 'Not Configured'}
            </div>
          </div>
        </div>
        {(!config.email.configured || !config.sms.configured) && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#fffbeb',
              borderRadius: '8px',
              border: '1px solid #fed7aa',
            }}
          >
            <h4 style={{ fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
              Configuration Required
            </h4>
            <p style={{ color: '#92400e', fontSize: '14px', marginBottom: '8px' }}>
              To enable notifications, add the following environment variables to
              your .env file:
            </p>
            <ul style={{ color: '#92400e', fontSize: '14px', paddingLeft: '20px' }}>
              {!config.email.configured && (
                <li>NEXT_PUBLIC_EMAIL_SERVICE_API_KEY=your_email_api_key</li>
              )}
              {!config.sms.configured && (
                <li>NEXT_PUBLIC_SEMAPHORE_API_KEY=your_sms_api_key</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
          <TestTube size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Test Notifications
        </h2>
        <div style={{ maxWidth: '500px' }}>
          <div className="form-group">
            <label className="form-label">Student Name (for testing)</label>
            <input
              type="text"
              className="form-input"
              value={testData.studentName}
              onChange={(e) =>
                setTestData((prev) => ({ ...prev, studentName: e.target.value }))
              }
              placeholder="Enter student name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Test Email Address</label>
            <input
              type="email"
              className="form-input"
              value={testData.email}
              onChange={(e) =>
                setTestData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Enter email to test"
              disabled={!config.email.configured}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Test Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={testData.phone}
              onChange={(e) =>
                setTestData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Enter phone number to test"
              disabled={!config.sms.configured}
            />
          </div>
          <button
            onClick={handleTestNotification}
            className="btn btn-primary"
            disabled={
              testing ||
              (!config.email.configured && !config.sms.configured)
            }
            style={{ width: '100%' }}
          >
            {testing ? 'Sending Test...' : 'Send Test Notification'}
          </button>
        </div>
        {testResults && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Test Results
            </h3>
            <div
              style={{
                padding: '16px',
                backgroundColor: testResults.success ? '#f0fdf4' : '#fef2f2',
                borderRadius: '8px',
                border: `1px solid ${testResults.success ? '#bbf7d0' : '#fecaca'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                {testResults.success ? (
                  <CheckCircle
                    size={20}
                    style={{ color: '#16a34a', marginRight: '8px' }}
                  />
                ) : (
                  <AlertCircle
                    size={20}
                    style={{ color: '#dc2626', marginRight: '8px' }}
                  />
                )}
                <span
                  style={{
                    fontWeight: '600',
                    color: testResults.success ? '#166534' : '#991b1b',
                  }}
                >
                  {testResults.success ? 'Test Successful' : 'Test Failed'}
                </span>
              </div>
              {testResults.results && testResults.results.length > 0 && (
                <div>
                  <p
                    style={{
                      fontSize: '14px',
                      marginBottom: '8px',
                      fontWeight: '500',
                    }}
                  >
                    Details:
                  </p>
                  {testResults.results.map((result, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '14px',
                        marginBottom: '4px',
                        color: result.success ? '#166534' : '#991b1b',
                      }}
                    >
                      • {result.type.toUpperCase()}:{' '}
                      {result.success
                        ? 'Sent successfully'
                        : `Failed - ${result.error ?? ''}`}
                    </div>
                  ))}
                </div>
              )}
              {testResults.error && (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#991b1b',
                    marginTop: '8px',
                  }}
                >
                  Error: {testResults.error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
