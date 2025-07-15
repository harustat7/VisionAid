import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { BarChart3, TrendingUp, PieChart, Activity, Calendar, Users, ChevronRight, X, Eye, User } from 'lucide-react'
import { AnalyticsService, AnalyticsData } from '../services/analyticsService'

export const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('last-30-days')
  const [filteredData, setFilteredData] = useState<AnalyticsData | null>(null)
  const [showAllActivity, setShowAllActivity] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (analyticsData) {
      filterDataByPeriod(selectedPeriod)
    }
  }, [selectedPeriod, analyticsData])

  const fetchAnalytics = async () => {
    try {
      const data = await AnalyticsService.getAnalyticsData()
      setAnalyticsData(data)
      setFilteredData(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDataByPeriod = (period: string) => {
    if (!analyticsData) return

    const now = new Date()
    let cutoffDate: Date

    switch (period) {
      case 'last-7-days':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last-30-days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last-90-days':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        setFilteredData(analyticsData)
        return
    }

    // Filter recent activity by date
    const filteredActivity = analyticsData.recentActivity.filter(activity => {
      // For demo purposes, we'll simulate date filtering
      // In a real app, you'd parse the actual date from activity.time
      const activityIndex = analyticsData.recentActivity.indexOf(activity)
      const daysSinceActivity = activityIndex * 2 // Simulate days ago
      return daysSinceActivity <= (period === 'last-7-days' ? 7 : period === 'last-30-days' ? 30 : 90)
    })

    // Calculate filtered stats based on the period
    const totalInPeriod = Math.floor(analyticsData.totalScans * (period === 'last-7-days' ? 0.2 : period === 'last-30-days' ? 0.7 : 0.9))
    const positiveInPeriod = Math.floor(analyticsData.positiveCases * (period === 'last-7-days' ? 0.2 : period === 'last-30-days' ? 0.7 : 0.9))
    const negativeInPeriod = Math.floor(analyticsData.negativeCases * (period === 'last-7-days' ? 0.2 : period === 'last-30-days' ? 0.7 : 0.9))
    const uncertainInPeriod = totalInPeriod - positiveInPeriod - negativeInPeriod

    setFilteredData({
      totalScans: totalInPeriod,
      positiveCases: positiveInPeriod,
      negativeCases: negativeInPeriod,
      uncertainCases: uncertainInPeriod,
      successRate: totalInPeriod > 0 ? (negativeInPeriod / totalInPeriod) * 100 : 0,
      monthlyTrend: analyticsData.monthlyTrend,
      recentActivity: filteredActivity
    })
  }

  const handleViewAllActivity = () => {
    setShowAllActivity(true)
  }

  const generateChartData = () => {
    if (!filteredData) return []
    
    // Generate mock chart data based on monthly trend
    const chartData = filteredData.monthlyTrend.map((month, index) => ({
      month: month.month,
      scans: month.scans,
      positive: month.positive,
      height: Math.max((month.scans / Math.max(...filteredData.monthlyTrend.map(m => m.scans))) * 100, 10)
    }))

    return chartData
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  const metrics = [
    { 
      name: 'Total Scans', 
      value: filteredData?.totalScans || 0, 
      trend: 'up' 
    },
    { 
      name: 'Positive Cases', 
      value: filteredData?.positiveCases || 0, 
      trend: 'up' 
    },
    { 
      name: 'Success Rate', 
      value: `${filteredData?.successRate.toFixed(1) || 0}%`, 
      trend: 'up' 
    },
    { 
      name: 'Negative Cases', 
      value: filteredData?.negativeCases || 0, 
      trend: 'up' 
    },
  ]

  const chartData = generateChartData()

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="last-90-days">Last 90 days</option>
              <option value="all-time">All time</option>
            </select>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.name}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dynamic Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Scan Volume Trends</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64">
              {chartData.length > 0 ? (
                <div className="h-full flex items-end justify-between space-x-2">
                  {chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center space-y-1">
                        {/* Positive cases bar */}
                        <div 
                          className="w-full bg-red-500 rounded-t transition-all duration-1000 ease-out"
                          style={{ 
                            height: `${Math.max((data.positive / Math.max(data.scans, 1)) * data.height, 2)}px`,
                            minHeight: data.positive > 0 ? '4px' : '0px'
                          }}
                          title={`${data.positive} positive cases`}
                        ></div>
                        {/* Total scans bar */}
                        <div 
                          className="w-full bg-blue-500 rounded-b transition-all duration-1000 ease-out"
                          style={{ 
                            height: `${Math.max(data.height - (data.positive / Math.max(data.scans, 1)) * data.height, 2)}px`,
                            minHeight: data.scans > data.positive ? '4px' : '0px'
                          }}
                          title={`${data.scans - data.positive} negative/uncertain cases`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2 text-center transform -rotate-45 origin-center">
                        {data.month}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No data available for selected period</p>
                  </div>
                </div>
              )}
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Negative/Uncertain</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">Positive Cases</span>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Result Distribution</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Negative (Healthy)</span>
                </div>
                <span className="font-medium">{filteredData?.negativeCases || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Positive (Cataract)</span>
                </div>
                <span className="font-medium">{filteredData?.positiveCases || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Uncertain</span>
                </div>
                <span className="font-medium">{filteredData?.uncertainCases || 0}</span>
              </div>
              
              {/* Visual Progress Bars */}
              <div className="mt-6 space-y-3">
                {[
                  { label: 'Negative', value: filteredData?.negativeCases || 0, color: 'bg-green-500' },
                  { label: 'Positive', value: filteredData?.positiveCases || 0, color: 'bg-red-500' },
                  { label: 'Uncertain', value: filteredData?.uncertainCases || 0, color: 'bg-yellow-500' }
                ].map((item, index) => {
                  const total = (filteredData?.totalScans || 1)
                  const percentage = total > 0 ? (item.value / total) * 100 : 0
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ease-out ${item.color}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Show only 3 activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </h3>
              <button 
                onClick={handleViewAllActivity}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredData?.recentActivity.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity for the selected period</p>
              </div>
            ) : (
              // Show only first 3 activities
              filteredData?.recentActivity.slice(0, 3).map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.patient}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.result === 'positive' ? 'bg-red-100 text-red-800' :
                        activity.result === 'negative' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.result === 'positive' ? 'Cataract Detected' :
                         activity.result === 'negative' ? 'No Cataract' : 'Uncertain'}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{activity.confidence} confidence</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Show indicator if there are more activities */}
            {filteredData && filteredData.recentActivity.length > 3 && (
              <div className="p-4 bg-gray-50 text-center">
                <button 
                  onClick={handleViewAllActivity}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  +{filteredData.recentActivity.length - 3} more activities
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View All Activity Modal */}
        {showAllActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Activity className="h-6 w-6 mr-2 text-blue-600" />
                    All Recent Activity
                  </h3>
                  <button
                    onClick={() => setShowAllActivity(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-gray-600 mt-1">
                  Complete list of cataract detection activities for {selectedPeriod.replace('-', ' ')}
                </p>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                {filteredData?.recentActivity.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h4>
                    <p>No cataract detection activities found for the selected period.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredData?.recentActivity.map((activity, index) => (
                      <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <Eye className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <User className="h-4 w-4 text-gray-400" />
                                <p className="font-medium text-gray-900">{activity.patient}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <p className="text-sm text-gray-500">{activity.time}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              activity.result === 'positive' ? 'bg-red-100 text-red-800' :
                              activity.result === 'negative' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {activity.result === 'positive' ? 'Cataract Detected' :
                               activity.result === 'negative' ? 'No Cataract' : 'Uncertain'}
                            </span>
                            <p className="text-sm text-gray-500 mt-1 font-medium">{activity.confidence} confidence</p>
                          </div>
                        </div>
                        
                        {/* Additional details for modal view */}
                        <div className="mt-4 ml-16 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Analysis Result:</strong> {
                              activity.result === 'positive' 
                                ? 'Potential cataract formation detected. Recommend ophthalmologist consultation.'
                                : activity.result === 'negative'
                                ? 'Eye appears healthy. Continue regular eye care routine.'
                                : 'Uncertain results. Consider retaking scan or professional evaluation.'
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {filteredData?.recentActivity.length || 0} activities for {selectedPeriod.replace('-', ' ')}
                  </p>
                  <button
                    onClick={() => setShowAllActivity(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}