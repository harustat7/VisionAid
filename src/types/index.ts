export interface CataractDetection {
  id: string
  patient_name: string
  patient_age: number
  image_url: string
  detection_result: 'positive' | 'negative' | 'uncertain'
  confidence_score: number
  created_at: string
  notes?: string
}

export interface DetectionResult {
  result: 'positive' | 'negative' | 'uncertain'
  confidence: number
  message: string
  modelUsed?: string
  processingTime?: number
}

export interface ModelInfo {
  name: string
  architecture: string
  inputSize: string
  accuracy: string
  description: string
}