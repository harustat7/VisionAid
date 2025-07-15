import React, { useState } from 'react'
import { User, Calendar } from 'lucide-react'

interface PatientFormProps {
  onSubmit: (data: { patientName: string; patientAge: number }) => void
  isProcessing?: boolean
}

export const PatientForm: React.FC<PatientFormProps> = ({ onSubmit, isProcessing = false }) => {
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (patientName.trim() && patientAge) {
      onSubmit({
        patientName: patientName.trim(),
        patientAge: parseInt(patientAge)
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
          Patient Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            id="patientName"
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter patient name"
            required
            disabled={isProcessing}
          />
        </div>
      </div>

      <div>
        <label htmlFor="patientAge" className="block text-sm font-medium text-gray-700 mb-1">
          Patient Age
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            id="patientAge"
            type="number"
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter age"
            min="1"
            max="120"
            required
            disabled={isProcessing}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !patientName.trim() || !patientAge}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Processing...' : 'Analyze Image'}
      </button>
    </form>
  )
}