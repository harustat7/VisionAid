import { supabase } from '../lib/supabase'
import { DetectionResult } from '../types'
import { AuditService } from './auditService'
import { NotificationService } from './notificationService'

export class CataractDetectionService {
  static async uploadImage(file: File): Promise<string> {
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload a valid image file (JPG, PNG, WebP)')
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image size must be less than 10MB')
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error('Unsupported file format. Please use JPG, PNG, or WebP')
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `images/${fileName}`

    const { error } = await supabase.storage
      .from('cataract-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    const { data } = supabase.storage
      .from('cataract-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  static async analyzeImage(imageUrl: string): Promise<DetectionResult & { modelUsed?: string; processingTime?: number }> {
    try {
      console.log('Starting cataract detection analysis for:', imageUrl)
      
      // Call edge function for cataract detection
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-cataract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Cataract analysis failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log('Cataract analysis completed:', result)
      
      return result
    } catch (error) {
      console.error('Cataract analysis error:', error)
      
      // Enhanced error handling
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to cataract analysis service. Please check your internet connection and try again.')
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('Analysis timeout: The cataract analysis is taking longer than expected. Please try again with a smaller image.')
      }
      
      throw new Error(`Cataract analysis failed: ${error.message}`)
    }
  }

  static async saveDetection(data: {
    patientName: string
    patientAge: number
    imageUrl: string
    result: DetectionResult & { modelUsed?: string; processingTime?: number }
    notes?: string
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Save to cataract_detections table
      const { error: cataractError } = await supabase
        .from('cataract_detections')
        .insert({
          patient_name: data.patientName,
          patient_age: data.patientAge,
          image_url: data.imageUrl,
          detection_result: data.result.result,
          confidence_score: data.result.confidence,
          notes: data.notes || `Cataract detection analysis completed for ${data.patientName}`
        })

      if (cataractError) {
        console.error('Save error:', cataractError)
        throw new Error(`Failed to save cataract analysis: ${cataractError.message}`)
      }

      // Also save to detections table for user tracking
      if (user) {
        const { error: detectionError } = await supabase
          .from('detections')
          .insert({
            user_id: user.id,
            image_url: data.imageUrl,
            result: data.result.result,
            confidence: data.result.confidence
          })

        if (detectionError) {
          console.error('Detection save error:', detectionError)
        }

        // Log audit trail
        await AuditService.logAction(
          user.id,
          'CREATE',
          'cataract_detections',
          `Analyzed eye image for cataract detection - patient ${data.patientName}, result: ${data.result.result}`
        )

        // Send email notification if enabled
        try {
          const shouldSendEmail = await NotificationService.shouldSendNotification(user.id, 'email')
          if (shouldSendEmail && user.email) {
            await NotificationService.sendAnalysisNotification(
              user.email,
              data.patientName,
              data.result.result,
              data.result.confidence
            )
          }
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError)
          // Don't throw error for notification failures
        }
      }
    } catch (error) {
      console.error('Save detection error:', error)
      throw new Error(`Save failed: ${error.message}`)
    }
  }

  // Utility method to validate image before upload
  static validateImage(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select an image file' }
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image must be smaller than 10MB' }
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Please use JPG, PNG, or WebP format' }
    }
    
    return { valid: true }
  }

  // Get analysis statistics
  static async getAnalysisStats(): Promise<{
    total: number
    positive: number
    negative: number
    uncertain: number
  }> {
    try {
      const { data, error } = await supabase
        .from('cataract_detections')
        .select('detection_result')

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        positive: data?.filter(d => d.detection_result === 'positive').length || 0,
        negative: data?.filter(d => d.detection_result === 'negative').length || 0,
        uncertain: data?.filter(d => d.detection_result === 'uncertain').length || 0
      }

      return stats
    } catch (error) {
      console.error('Stats error:', error)
      return { total: 0, positive: 0, negative: 0, uncertain: 0 }
    }
  }
}