import { supabase } from '../lib/supabase'

export interface NotificationSettings {
  emailNotifications: boolean
  reportNotifications: boolean
}

export class NotificationService {
  // Send email notification
  static async sendEmailNotification(
    to: string,
    subject: string,
    message: string,
    type: 'analysis' | 'report' | 'general' = 'general'
  ): Promise<void> {
    try {
      // Call edge function for sending emails
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          message,
          type
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to send notification')
      }

      console.log('Email notification sent successfully')
    } catch (error) {
      console.error('Failed to send email notification:', error)
      throw error
    }
  }

  // Send analysis completion notification
  static async sendAnalysisNotification(
    userEmail: string,
    patientName: string,
    result: 'positive' | 'negative' | 'uncertain',
    confidence: number
  ): Promise<void> {
    const subject = `Cataract Analysis Complete - ${patientName}`
    
    let message = `
Dear Healthcare Professional,

The cataract detection analysis for patient ${patientName} has been completed.

Analysis Results:
- Result: ${result === 'positive' ? 'Cataract Detected' : result === 'negative' ? 'No Cataract Detected' : 'Uncertain'}
- Confidence: ${(confidence * 100).toFixed(1)}%

${result === 'positive' 
  ? 'Immediate consultation with an ophthalmologist is recommended for further evaluation and treatment planning.'
  : result === 'negative'
  ? 'The eye appears healthy. Continue with routine eye care and regular examinations.'
  : 'Uncertain results detected. Consider retaking the scan or professional evaluation.'
}

Please log into VisionAid to view the complete analysis report.

Best regards,
VisionAid Team

---
This is an automated notification from VisionAid Cataract Detection System.
    `.trim()

    await this.sendEmailNotification(userEmail, subject, message, 'analysis')
  }

  // Send report generation notification
  static async sendReportNotification(
    userEmail: string,
    reportTitle: string,
    reportType: string
  ): Promise<void> {
    const subject = `Report Generated - ${reportTitle}`
    
    const message = `
Dear Healthcare Professional,

Your requested report has been generated and is ready for download.

Report Details:
- Title: ${reportTitle}
- Type: ${reportType}
- Generated: ${new Date().toLocaleDateString()}

Please log into VisionAid to download your report.

Best regards,
VisionAid Team

---
This is an automated notification from VisionAid Cataract Detection System.
    `.trim()

    await this.sendEmailNotification(userEmail, subject, message, 'report')
  }

  // Get user notification settings
  static async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const saved = localStorage.getItem(`visionaid_notifications_${userId}`)
      if (saved) {
        return JSON.parse(saved)
      }
      
      // Default settings
      return {
        emailNotifications: true,
        reportNotifications: true
      }
    } catch (error) {
      console.error('Failed to get notification settings:', error)
      return {
        emailNotifications: true,
        reportNotifications: true
      }
    }
  }

  // Save user notification settings
  static async saveNotificationSettings(
    userId: string,
    settings: NotificationSettings
  ): Promise<void> {
    try {
      localStorage.setItem(`visionaid_notifications_${userId}`, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      throw error
    }
  }

  // Check if notifications should be sent
  static async shouldSendNotification(
    userId: string,
    type: 'email' | 'report'
  ): Promise<boolean> {
    try {
      const settings = await this.getNotificationSettings(userId)
      
      if (type === 'email') {
        return settings.emailNotifications
      } else if (type === 'report') {
        return settings.reportNotifications
      }
      
      return false
    } catch (error) {
      console.error('Failed to check notification settings:', error)
      return false
    }
  }
}