import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Eye, Download, Share, Clock, Cpu } from 'lucide-react'
import { DetectionResult } from '../types'

interface ResultCardProps {
  result: DetectionResult & { modelUsed?: string; processingTime?: number }
  onNewAnalysis: () => void
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onNewAnalysis }) => {
  const getResultIcon = () => {
    switch (result.result) {
      case 'positive':
        return <XCircle className="h-16 w-16 text-red-500" />
      case 'negative':
        return <CheckCircle className="h-16 w-16 text-green-500" />
      case 'uncertain':
        return <AlertTriangle className="h-16 w-16 text-amber-500" />
    }
  }

  const getResultColor = () => {
    switch (result.result) {
      case 'positive':
        return 'from-red-50 to-red-100 border-red-200 text-red-800'
      case 'negative':
        return 'from-green-50 to-green-100 border-green-200 text-green-800'
      case 'uncertain':
        return 'from-amber-50 to-amber-100 border-amber-200 text-amber-800'
    }
  }

  const getResultText = () => {
    switch (result.result) {
      case 'positive':
        return 'Cataract Detected'
      case 'negative':
        return 'No Cataract Detected'
      case 'uncertain':
        return 'Uncertain Result'
    }
  }

  const getConfidenceColor = () => {
    if (result.confidence >= 0.8) return 'text-green-600'
    if (result.confidence >= 0.6) return 'text-amber-600'
    return 'text-red-600'
  }

  const getConfidenceBarColor = () => {
    if (result.confidence >= 0.8) return 'from-green-500 to-green-600'
    if (result.confidence >= 0.6) return 'from-amber-500 to-amber-600'
    return 'from-red-500 to-red-600'
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/60 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-8 border-b border-gray-200/60">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {getResultIcon()}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Analysis Complete
          </h3>
          <div className={`inline-flex items-center px-8 py-4 rounded-2xl border-2 bg-gradient-to-r ${getResultColor()} shadow-sm`}>
            <span className="font-bold text-lg">{getResultText()}</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-8 space-y-8">
        {/* Confidence Score */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200/60">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">Confidence Level</span>
            <span className={`font-bold text-xl ${getConfidenceColor()}`}>
              {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getConfidenceBarColor()} shadow-sm`}
              style={{ width: `${result.confidence * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Analysis Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/60">
            <div className="flex items-center space-x-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Model</span>
            </div>
            <p className="text-sm text-blue-700">{result.modelUsed || 'AI Analysis'}</p>
          </div>
          
          <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-200/60">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Processing</span>
            </div>
            <p className="text-sm text-purple-700">{result.processingTime ? `${(result.processingTime / 1000).toFixed(1)}s` : '2.3s'}</p>
          </div>
        </div>

        {/* Clinical Recommendation */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-6 border border-blue-200/60">
          <h4 className="font-bold text-blue-900 mb-3 flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Clinical Recommendation
          </h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            {result.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onNewAnalysis}
            className="flex-1 flex items-center justify-center py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            <Eye className="h-5 w-5 mr-2" />
            New Analysis
          </button>
          <button className="flex items-center justify-center py-4 px-6 bg-gray-100/80 text-gray-700 rounded-2xl hover:bg-gray-200/80 transition-all duration-200 font-medium border border-gray-200/60">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
          <button className="flex items-center justify-center py-4 px-6 bg-gray-100/80 text-gray-700 rounded-2xl hover:bg-gray-200/80 transition-all duration-200 font-medium border border-gray-200/60">
            <Share className="h-5 w-5 mr-2" />
            Share
          </button>
        </div>

        {/* Medical Disclaimer */}
        <div className="text-xs text-gray-500 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
          <p className="font-semibold text-amber-800 mb-2 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Important Medical Notice
          </p>
          <p className="leading-relaxed text-amber-700">
            This AI analysis is for screening purposes only and should not replace professional medical diagnosis. 
            Always consult with a qualified ophthalmologist for definitive diagnosis and treatment recommendations.
          </p>
        </div>
      </div>
    </div>
  )
}