import React, { useEffect, useState } from 'react'
import { Eye, TrendingUp, Users, FileText } from 'lucide-react'
import { CataractDetectionService } from '../services/cataractDetection'

export const StatsCards: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    uncertain: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await CataractDetectionService.getAnalysisStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const cards = [
    {
      title: 'Total Scans',
      value: stats.total,
      icon: Eye,
      color: 'blue',
      description: 'This month'
    },
    {
      title: 'Cases Detected',
      value: stats.positive,
      icon: TrendingUp,
      color: 'red',
      description: 'Require attention'
    },
    {
      title: 'Healthy Eyes',
      value: stats.negative,
      icon: Users,
      color: 'green',
      description: 'Normal results'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 text-white',
      red: 'from-red-500 to-red-600 text-white',
      green: 'from-green-500 to-green-600 text-white',
      purple: 'from-purple-500 to-purple-600 text-white'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getBgColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-50 to-blue-100 border-blue-200',
      red: 'from-red-50 to-red-100 border-red-200',
      green: 'from-green-50 to-green-100 border-green-200',
      purple: 'from-purple-50 to-purple-100 border-purple-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-col md:flex-row md:justify-center gap-6">
        {cards.map((card, index) => (
          <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 min-w-[320px] max-w-xs w-full flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(card.color)} shadow-lg`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-xs text-gray-500">{card.description}</p>
            </div>
            {/* Subtle background pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getBgColorClasses(card.color)} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
          </div>
        ))}
      </div>
    </div>
  )
}