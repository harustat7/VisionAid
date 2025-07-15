import React, { useState } from 'react'
import { Layout } from '../components/Layout'
import { ImageUpload } from '../components/ImageUpload'
import { PatientForm } from '../components/PatientForm'
import { ResultCard } from '../components/ResultCard'
import { HistoryList } from '../components/HistoryList'
import { StatsCards } from '../components/StatsCards'
import { CataractDetectionService } from '../services/cataractDetection'
import { DetectionResult } from '../types'
import { AlertCircle, Upload, Calendar, Activity, Eye, Sparkles, ArrowRight } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<(DetectionResult & { modelUsed?: string; processingTime?: number }) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const handleImageSelect = (file: File) => {
    const validation = CataractDetectionService.validateImage(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file')
      return
    }

    setSelectedImage(file)
    setResult(null)
    setError(null)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setResult(null)
    setError(null)
  }

  const handleAnalysis = async (patientData: { patientName: string; patientAge: number }) => {
    if (!selectedImage) return

    setIsProcessing(true)
    setError(null)

    try {
      console.log('Starting cataract detection analysis...')
      
      const imageUrl = await CataractDetectionService.uploadImage(selectedImage)
      console.log('Image uploaded successfully:', imageUrl)
      
      const analysisResult = await CataractDetectionService.analyzeImage(imageUrl)
      console.log('Cataract analysis completed:', analysisResult)
      
      await CataractDetectionService.saveDetection({
        patientName: patientData.patientName,
        patientAge: patientData.patientAge,
        imageUrl,
        result: analysisResult
      })

      setResult(analysisResult)
    } catch (err) {
      console.error('Cataract analysis error:', err)
      setError(err instanceof Error ? err.message : 'Cataract analysis failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNewAnalysis = () => {
    setSelectedImage(null)
    setResult(null)
    setError(null)
    setShowUploadModal(false)
  }

  const handleQuickScan = () => {
    setShowUploadModal(true)
    setResult(null)
    setError(null)
  }

  const handleSchedule = () => {
    alert('Schedule feature: This would open a calendar interface to book appointments with patients.')
  }

  const handleActivity = () => {
    window.location.href = '/analytics'
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Monitor your cataract detection activities and patient insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleQuickScan}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <Upload className="h-4 w-4 mr-2" />
              Quick Scan
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Analysis Panel */}
          <div className="xl:col-span-2 space-y-8">
            {/* Quick Actions */}
            {/* Removed quick action cards (New Scan, Schedule, Activity) as requested */}

            {/* Main Analysis Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60 p-8 shadow-lg">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Cataract Detection Analysis
                  </h2>
                </div>
                <Sparkles className="h-5 w-5 text-amber-400 ml-auto" />
              </div>
              
              {error && (
                <div className="mb-8 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-red-700 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {!result ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                      <h3 className="text-lg font-semibold text-gray-900">Upload Eye Image</h3>
                    </div>
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      selectedImage={selectedImage}
                      onRemoveImage={handleRemoveImage}
                      isProcessing={isProcessing}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                      <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
                    </div>
                    <PatientForm
                      onSubmit={handleAnalysis}
                      isProcessing={isProcessing}
                    />
                  </div>
                </div>
              ) : (
                <ResultCard
                  result={result}
                  onNewAnalysis={handleNewAnalysis}
                />
              )}
            </div>
          </div>

          {/* History Sidebar */}
          <div className="xl:col-span-1">
            <HistoryList />
          </div>
        </div>

        {/* Quick Scan Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/60">
              <div className="p-6 border-b border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                      <Eye className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Quick Cataract Scan</h3>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100/80 rounded-xl"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                      <span className="text-red-700 font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {!result ? (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Upload Eye Image</h4>
                      <ImageUpload
                        onImageSelect={handleImageSelect}
                        selectedImage={selectedImage}
                        onRemoveImage={handleRemoveImage}
                        isProcessing={isProcessing}
                      />
                    </div>
                    
                    {selectedImage && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h4>
                        <PatientForm
                          onSubmit={handleAnalysis}
                          isProcessing={isProcessing}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <ResultCard
                    result={result}
                    onNewAnalysis={handleNewAnalysis}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}