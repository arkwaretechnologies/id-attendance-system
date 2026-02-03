import type { StudentProfile } from '@/types/database';

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  status?: string;
  recipient?: string;
  message?: string;
  senderName?: string;
  network?: string;
  error?: string;
  errorCode?: string | number;
}

export interface SendAttendanceNotificationResult {
  success: boolean;
  error?: string;
}

/**
 * Client-side SMS service. Calls Next.js API routes to send via Semaphore
 * (avoids CORS and keeps API key server-side).
 */

class SemaphoreSmsService {
  defaultSenderName: string;

  constructor() {
    this.defaultSenderName = 'ARKWARE';
  }

  async sendSMS(
    phoneNumber: string,
    message: string,
    senderName: string | null = null
  ): Promise<SendSMSResult> {
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          message,
          senderName: senderName ?? this.defaultSenderName,
        }),
      });

      const result = (await response.json()) as SendSMSResult & { messageId?: string };
      if (response.ok && result.success) {
        return {
          success: true,
          messageId: result.messageId,
          status: result.status,
          recipient: result.recipient,
        };
      }
      return {
        success: false,
        error: result.error ?? 'Failed to send SMS',
        errorCode: result.errorCode,
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.startsWith('63')) {
      return cleaned.substring(2);
    } else if (cleaned.startsWith('09')) {
      return cleaned;
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
      return `0${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return cleaned;
    } else {
      return `0${cleaned}`;
    }
  }

  createAttendanceMessage(
    studentData: Pick<StudentProfile, 'first_name' | 'last_name'>,
    action: 'time_in' | 'time_out',
    timestamp: Date
  ): string {
    const timeStr = timestamp.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const dateStr = timestamp.toLocaleDateString('en-PH');
    const actionText = action === 'time_in' ? 'arrived at' : 'left';

    return `Hello! Your child ${studentData.first_name} ${studentData.last_name} has ${actionText} school at ${timeStr} on ${dateStr}.`;
  }

  async sendAttendanceNotification(
    studentData: Pick<StudentProfile, 'first_name' | 'last_name' | 'guardian_contact_number'> & { student_id?: string },
    action: 'time_in' | 'time_out',
    timestamp: Date = new Date()
  ): Promise<SendAttendanceNotificationResult> {
    try {
      if (!studentData.guardian_contact_number) {
        console.warn(
          'No guardian contact number found for student:',
          (studentData as { student_id?: string }).student_id
        );
        return {
          success: false,
          error: 'No guardian contact number available',
        };
      }

      const response = await fetch('/api/sms/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentData: {
            first_name: studentData.first_name,
            last_name: studentData.last_name,
            guardian_contact_number: studentData.guardian_contact_number,
          },
          action,
          timestamp: timestamp.toISOString(),
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string };
      return {
        success: response.ok && !!result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Error sending attendance notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  testConfiguration(): {
    configured: boolean;
    service: string;
    defaultSender: string;
  } {
    return {
      configured: true,
      service: 'Semaphore SMS (via API)',
      defaultSender: this.defaultSenderName,
    };
  }
}

export default SemaphoreSmsService;
