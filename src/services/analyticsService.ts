import { supabase } from '../lib/supabase'

export interface AnalyticsData {
  totalScans: number
  positiveCases: number
  negativeCases: number
  uncertainCases: number
  successRate: number
  monthlyTrend: Array<{ month: string; scans: number; positive: number }>
  recentActivity: Array<{
    patient: string
    result: 'positive' | 'negative' | 'uncertain'
    time: string
    confidence: string
  }>
}

export class AnalyticsService {
  static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      // Get all detections
      const { data: detections, error } = await supabase
        .from('cataract_detections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const totalScans = detections?.length || 0
      const positiveCases = detections?.filter(d => d.detection_result === 'positive').length || 0
      const negativeCases = detections?.filter(d => d.detection_result === 'negative').length || 0
      const uncertainCases = detections?.filter(d => d.detection_result === 'uncertain').length || 0
      
      const successRate = totalScans > 0 ? ((negativeCases / totalScans) * 100) : 0

      // Get recent activity (last 10)
      const recentActivity = detections?.slice(0, 10).map(detection => ({
        patient: detection.patient_name,
        result: detection.detection_result,
        time: this.getTimeAgo(detection.created_at),
        confidence: `${(detection.confidence_score * 100).toFixed(0)}%`
      })) || []

      // Calculate monthly trend (last 6 months)
      const monthlyTrend = this.calculateMonthlyTrend(detections || [])

      return {
        totalScans,
        positiveCases,
        negativeCases,
        uncertainCases,
        successRate,
        monthlyTrend,
        recentActivity
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      throw new Error('Failed to fetch analytics data')
    }
  }

  private static getTimeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours === 1) return '1 hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return date.toLocaleDateString()
  }

  private static calculateMonthlyTrend(detections: any[]): Array<{ month: string; scans: number; positive: number }> {
    const monthlyData = new Map<string, { scans: number; positive: number }>()
    
    detections.forEach(detection => {
      const date = new Date(detection.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { scans: 0, positive: 0 })
      }
      
      const data = monthlyData.get(monthKey)!
      data.scans++
      if (detection.detection_result === 'positive') {
        data.positive++
      }
    })

    // Convert to array and sort by month
    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        ...data
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6) // Last 6 months
  }
}