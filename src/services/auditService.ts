import { supabase } from '../lib/supabase'

export interface AuditLog {
  id: string
  user_id: string | null
  action: string | null
  target_table: string | null
  description: string | null
  timestamp: string | null
}

export class AuditService {
  static async logAction(
    userId: string | null,
    action: string,
    targetTable: string,
    description: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action,
          target_table: targetTable,
          description,
          timestamp: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error logging audit action:', error)
      // Don't throw error for audit logging failures
    }
  }

  static async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }
  }

  static async getUserAuditLogs(userId: string, limit: number = 20): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user audit logs:', error)
      return []
    }
  }
}