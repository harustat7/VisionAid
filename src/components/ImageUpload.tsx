import React, { useState, useRef } from 'react'
import { Upload, X, Camera, AlertCircle, Image } from 'lucide-react'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  selectedImage: File | null
  onRemoveImage: () => void
  isProcessing?: boolean
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  selectedImage,
  onRemoveImage,
  isProcessing = false
}) => {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        onImageSelect(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith('image/')) {
        onImageSelect(file)
      }
    }
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  if (selectedImage) {
    return (
      <div className="relative group">
        <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200/60 bg-white/50 backdrop-blur-sm">
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="Selected for analysis"
            className="w-full h-64 object-cover"
          />
          {!isProcessing && (
            <button
              onClick={onRemoveImage}
              className="absolute top-3 right-3 p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
            >
              <X size={16} />
            </button>
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-white text-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-medium">Analyzing image...</p>
                <p className="text-sm text-white/80 mt-1">This may take a moment</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/60">
          <div className="flex items-center space-x-3">
            <Image className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedImage.name}</p>
              <p className="text-xs text-gray-500">{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-400 bg-blue-50/50 backdrop-blur-sm scale-[1.02]'
            : 'border-gray-300/60 hover:border-gray-400/60 hover:bg-gray-50/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-sm">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Eye Image
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">
              Drag and drop your eye image here, or click to browse your files
            </p>
            
            <button
              onClick={onButtonClick}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </button>
          </div>
          
          <div className="flex items-center justify-center text-xs text-gray-500 space-x-2">
            <AlertCircle className="h-3 w-3" />
            <span>Supports JPG, PNG, WebP • Max 10MB</span>
          </div>
        </div>
      </div>
    </div>
  )
}