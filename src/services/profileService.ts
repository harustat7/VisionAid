import { supabase } from '../lib/supabase'

export interface UserProfile {
  id: string
  full_name: string | null
  role: string | null
  email: string
  phone?: string
  location?: string
  bio?: string
  specialization?: string
  experience?: string
  license?: string
  avatar_url?: string
  created_at: string
}

export interface ProfileStats {
  totalScans: number
  patientsHelped: number
  successRate: number
  yearsExperience: number
}

export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Get user data from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw profileError
      }

      return {
        id: userId,
        full_name: profile?.full_name || user?.user_metadata?.full_name || null,
        role: profile?.role || 'doctor',
        email: user?.email || '',
        phone: user?.user_metadata?.phone || '',
        created_at: user?.created_at || new Date().toISOString(),
        // Additional fields would be stored in profiles table
        location: '',
        bio: '',
        specialization: 'Ophthalmologist',
        experience: '5+ years',
        license: 'MD-12345'
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      // Update or insert profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: updates.full_name,
          role: updates.role
        })

      if (error) throw error

      // Update auth metadata if needed
      if (updates.full_name || updates.phone) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: updates.full_name,
            phone: updates.phone
          }
        })
        if (authError) throw authError
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw new Error('Failed to update profile')
    }
  }

  static async getProfileStats(userId: string): Promise<ProfileStats> {
    try {
      // Get user's detection statistics
      const { data: detections, error } = await supabase
        .from('detections')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const totalScans = detections?.length || 0
      const successfulScans = detections?.filter(d => d.result === 'negative').length || 0
      const uniquePatients = new Set(detections?.map(d => d.id)).size

      return {
        totalScans,
        patientsHelped: uniquePatients,
        successRate: totalScans > 0 ? (successfulScans / totalScans) * 100 : 0,
        yearsExperience: 8 // This would be calculated from profile data
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error)
      return {
        totalScans: 0,
        patientsHelped: 0,
        successRate: 0,
        yearsExperience: 0
      }
    }
  }
}