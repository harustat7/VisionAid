import React from 'react'
import { Eye, Sparkles } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg`}>
          <Eye className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
        </div>
      </div>
      {showText && (
        <div>
          <h1 className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
            VisionAid
          </h1>
          <p className="text-xs text-gray-500 -mt-1">AI Eye Health</p>
        </div>
      )}
    </div>
  )
}