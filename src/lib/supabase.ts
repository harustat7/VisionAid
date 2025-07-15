import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      cataract_detections: {
        Row: {
          id: string
          patient_name: string
          patient_age: number
          image_url: string
          detection_result: 'positive' | 'negative' | 'uncertain'
          confidence_score: number
          created_at: string
          notes?: string
        }
        Insert: {
          id?: string
          patient_name: string
          patient_age: number
          image_url: string
          detection_result: 'positive' | 'negative' | 'uncertain'
          confidence_score: number
          created_at?: string
          notes?: string
        }
        Update: {
          id?: string
          patient_name?: string
          patient_age?: number
          image_url?: string
          detection_result?: 'positive' | 'negative' | 'uncertain'
          confidence_score?: number
          created_at?: string
          notes?: string
        }
      }
      detections: {
        Row: {
          id: string
          user_id: string | null
          image_url: string | null
          result: string | null
          confidence: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          image_url?: string | null
          result?: string | null
          confidence?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          image_url?: string | null
          result?: string | null
          confidence?: number | null
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string | null
          target_table: string | null
          description: string | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action?: string | null
          target_table?: string | null
          description?: string | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string | null
          target_table?: string | null
          description?: string | null
          timestamp?: string | null
        }
      }
    }
  }
}