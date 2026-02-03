// Parent Notification Service
// Handles email and SMS notifications when students scan their RFID

import SemaphoreSmsService from './semaphoreSmsService';
import type { StudentProfile } from '@/types/database';

interface NotificationResultItem {
  type: 'email' | 'sms';
  success: boolean;
  error?: string;
}

interface SendAttendanceNotificationResult {
  success: boolean;
  results?: NotificationResultItem[];
  error?: string;
}

interface AttendanceMessage {
  email: string;
  sms: string;
}

class NotificationService {
  emailApiKey: string | undefined;
  emailServiceUrl: string;
  semaphoreSmsService: SemaphoreSmsService;

  constructor() {
    this.emailApiKey = process.env.NEXT_PUBLIC_EMAIL_SERVICE_API_KEY;
    this.emailServiceUrl = 'https://api.emailjs.com/api/v1.0/email/send';
    this.semaphoreSmsService = new SemaphoreSmsService();
  }

  async sendAttendanceNotification(
    student: Pick<
      StudentProfile,
      'first_name' | 'last_name' | 'parent_email' | 'guardian_contact_number' | 'grade_level'
    >,
    timestamp: string = new Date().toISOString()
  ): Promise<SendAttendanceNotificationResult> {
    const message = this.createAttendanceMessage(student, timestamp);
    const results: NotificationResultItem[] = [];

    try {
      if (student.parent_email && this.emailApiKey) {
        const emailResult = await this.sendEmail(
          student.parent_email,
          `${student.first_name} Arrived at School`,
          message.email
        );
        results.push({
          type: 'email',
          success: emailResult.success,
          error: emailResult.error,
        });
      }

      if (student.guardian_contact_number) {
        const smsResult = await this.semaphoreSmsService.sendAttendanceNotification(
          student,
          'time_in',
          new Date(timestamp)
        );
        results.push({
          type: 'sms',
          success: smsResult.success,
          error: smsResult.error,
        });
      }

      console.log('Notification sent:', {
        student: `${student.first_name} ${student.last_name}`,
        timestamp,
        results,
      });

      return {
        success: results.some((r) => r.success),
        results,
      };
    } catch (error) {
      console.error('Notification service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      };
    }
  }

  createAttendanceMessage(
    student: Pick<StudentProfile, 'first_name' | 'last_name' | 'grade_level'>,
    timestamp: string
  ): AttendanceMessage {
    const time = new Date(timestamp).toLocaleTimeString();
    const date = new Date(timestamp).toLocaleDateString();

    return {
      email: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">School Attendance Notification</h2>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">✅ ${student.first_name} ${student.last_name} has arrived at school</h3>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Grade:</strong> ${student.grade_level ?? ''}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This is an automated message from the school attendance system.</p>
        </div>
      `,
      sms: `🏫 ${student.first_name} ${student.last_name} arrived at school at ${time} on ${date}. Grade: ${student.grade_level ?? ''}`,
    };
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.emailApiKey) {
      console.warn('Email API key not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const response = await fetch(this.emailServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'your_service_id',
          template_id: 'your_template_id',
          user_id: this.emailApiKey,
          template_params: {
            to_email: to,
            subject: subject,
            message: htmlContent,
          },
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error(`Email service responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async testConfiguration(): Promise<{
    email: { configured: boolean; service: string };
    sms: { configured: boolean; service: string };
  }> {
    const config = {
      email: {
        configured: !!this.emailApiKey,
        service: 'EmailJS (or your preferred service)',
      },
      sms: {
        configured: this.semaphoreSmsService.testConfiguration().configured,
        service: this.semaphoreSmsService.testConfiguration().service,
      },
    };

    console.log('Notification service configuration:', config);
    return config;
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
