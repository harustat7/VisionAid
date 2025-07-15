import { supabase } from '../lib/supabase'

export interface Patient {
  id: string
  name: string
  age: number
  email?: string
  phone?: string
  lastScan?: string
  totalScans: number
  status: 'Active' | 'Inactive'
  lastResult?: 'positive' | 'negative' | 'uncertain'
  created_at: string
}

export class PatientService {
  // Get all patients with their scan statistics
  static async getPatients(): Promise<Patient[]> {
    try {
      // Get unique patients from cataract_detections
      const { data: detections, error } = await supabase
        .from('cataract_detections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by patient and calculate statistics
      const patientMap = new Map<string, Patient>()

      detections?.forEach(detection => {
        const key = `${detection.patient_name}-${detection.patient_age}`
        
        if (!patientMap.has(key)) {
          patientMap.set(key, {
            id: key,
            name: detection.patient_name,
            age: detection.patient_age,
            totalScans: 0,
            status: 'Active',
            created_at: detection.created_at,
            lastScan: detection.created_at
          })
        }

        const patient = patientMap.get(key)!
        patient.totalScans++
        patient.lastResult = detection.detection_result
        
        // Update last scan if this is more recent
        if (new Date(detection.created_at) > new Date(patient.lastScan!)) {
          patient.lastScan = detection.created_at
        }
      })

      return Array.from(patientMap.values())
    } catch (error) {
      console.error('Error fetching patients:', error)
      throw new Error('Failed to fetch patients')
    }
  }

  // Get patient details with scan history
  static async getPatientDetails(patientName: string, patientAge: number) {
    try {
      const { data, error } = await supabase
        .from('cataract_detections')
        .select('*')
        .eq('patient_name', patientName)
        .eq('patient_age', patientAge)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching patient details:', error)
      throw new Error('Failed to fetch patient details')
    }
  }

  // Search patients
  static async searchPatients(searchTerm: string): Promise<Patient[]> {
    try {
      const { data, error } = await supabase
        .from('cataract_detections')
        .select('*')
        .ilike('patient_name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group and process similar to getPatients
      const patientMap = new Map<string, Patient>()

      data?.forEach(detection => {
        const key = `${detection.patient_name}-${detection.patient_age}`
        
        if (!patientMap.has(key)) {
          patientMap.set(key, {
            id: key,
            name: detection.patient_name,
            age: detection.patient_age,
            totalScans: 0,
            status: 'Active',
            created_at: detection.created_at,
            lastScan: detection.created_at
          })
        }

        const patient = patientMap.get(key)!
        patient.totalScans++
        patient.lastResult = detection.detection_result
        
        if (new Date(detection.created_at) > new Date(patient.lastScan!)) {
          patient.lastScan = detection.created_at
        }
      })

      return Array.from(patientMap.values())
    } catch (error) {
      console.error('Error searching patients:', error)
      throw new Error('Failed to search patients')
    }
  }
}