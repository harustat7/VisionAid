import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { PatientService, Patient } from '../services/patientService'
import { CataractDetectionService } from '../services/cataractDetection'
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText, 
  Download, 
  Filter, 
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'


interface ReportData {
  totalPatients: number
  totalScans: number
  positiveCases: number
  negativeCases: number
  uncertainCases: number
  averageAge: number
  topPatients: Patient[]
  recentActivity: any[]
}

declare global {
  interface Window {
    jspdf: any;
  }
}

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'individual'>('weekly')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientDetails, setShowPatientDetails] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [activeTab])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const patients = await PatientService.getPatients()
      const stats = await CataractDetectionService.getAnalysisStats()
      
      // Calculate average age
      const totalAge = patients.reduce((sum, patient) => sum + patient.age, 0)
      const averageAge = patients.length > 0 ? Math.round(totalAge / patients.length) : 0
      
      // Get top patients by scan count
      const topPatients = patients
        .sort((a, b) => b.totalScans - a.totalScans)
        .slice(0, 5)

      setReportData({
        totalPatients: patients.length,
        totalScans: stats.total,
        positiveCases: stats.positive,
        negativeCases: stats.negative,
        uncertainCases: stats.uncertain,
        averageAge,
        topPatients,
        recentActivity: [] // Would be populated with recent scans
      })

      setFilteredPatients(patients)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setFilteredPatients(reportData?.topPatients || [])
    } else {
      const filtered = (reportData?.topPatients || []).filter(patient =>
        patient.name.toLowerCase().includes(term.toLowerCase())
      )
      setFilteredPatients(filtered)
    }
  }

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowPatientDetails(true)
  }

  const getStatusIcon = (result?: string) => {
    switch (result) {
      case 'positive':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'negative':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'uncertain':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Eye className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (result?: string) => {
    switch (result) {
      case 'positive':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'negative':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'uncertain':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // CSV export for monthly reports
  const handleExportMonthlyCSV = () => {
    if (!reportData) return
    const headers = ['Total Patients', 'Total Scans', 'Positive Cases', 'Negative Cases', 'Uncertain Cases']
    const values = [
      reportData.totalPatients,
      reportData.totalScans,
      reportData.positiveCases,
      reportData.negativeCases,
      reportData.uncertainCases
    ]
    let csv = headers.join(',') + '\n' + values.join(',') + '\n\n'
    csv += 'Top Patients (Name, Age, Total Scans, Last Result)\n'
    csv += reportData.topPatients.map(p => `${p.name},${p.age},${p.totalScans},${p.lastResult || ''}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `monthly_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // CSV export for weekly reports
  const handleExportWeeklyCSV = () => {
    if (!reportData) return
    const headers = ['Total Patients', 'Total Scans', 'Positive Cases', 'Negative Cases', 'Uncertain Cases']
    const values = [
      reportData.totalPatients,
      reportData.totalScans,
      reportData.positiveCases,
      reportData.negativeCases,
      reportData.uncertainCases
    ]
    let csv = headers.join(',') + '\n' + values.join(',') + '\n\n'
    csv += 'Top Patients This Week (Name, Age, Total Scans, Last Result)\n'
    csv += reportData.topPatients.map(p => `${p.name},${p.age},${p.totalScans},${p.lastResult || ''}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weekly_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // PDF export for individual patient (use global jsPDF from window.jspdf)
  const handleExportPatientPDF = (patient: Patient) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Patient Cataract Report', 14, 18);
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Patient Information', 14, 30);
    doc.autoTable({
      startY: 34,
      head: [['Name', 'Age', 'Status', 'Total Scans']],
      body: [[patient.name, patient.age, patient.status, patient.totalScans]],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 11 }
    });
    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 50;
    doc.text('Latest Scan Summary', 14, y);
    y += 4;
    doc.autoTable({
      startY: y,
      head: [['Last Result', 'Last Scan Date']],
      body: [[patient.lastResult || 'N/A', patient.lastScan ? new Date(patient.lastScan).toLocaleDateString() : 'N/A']],
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] },
      styles: { fontSize: 11 }
    });
    doc.save(`${patient.name.replace(/\s+/g, '_')}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  const tabs = [
    { id: 'weekly', name: 'Weekly Reports', icon: Calendar },
    { id: 'monthly', name: 'Monthly Reports', icon: TrendingUp },
    { id: 'individual', name: 'Individual Reports', icon: Users }
  ]

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6">
                <div className="animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
            <p className="text-gray-600">Comprehensive analysis and insights for all patient data</p>
          </div>
          <div className="flex items-center space-x-3">
            {(activeTab === 'monthly' || activeTab === 'weekly') && (
              <button
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                onClick={() => {
                  if (activeTab === 'monthly') handleExportMonthlyCSV()
                  else if (activeTab === 'weekly') handleExportWeeklyCSV()
                }}
                disabled={activeTab !== 'monthly' && activeTab !== 'weekly'}
                title={activeTab === 'monthly' || activeTab === 'weekly' ? 'Export report as CSV' : 'Switch to Weekly or Monthly Reports to export'}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-2">
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Report Content */}
        {activeTab === 'weekly' && (
          <div className="space-y-8">
            {/* Weekly Overview (copied from Monthly Overview) */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60 p-8">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Weekly Overview</h3>
                  <p className="text-gray-600">Comprehensive weekly statistics and trends</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl border border-blue-700">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{reportData?.totalScans || 0}</div>
                  <div className="text-sm text-blue-200 font-medium">Total Scans</div>
                  <div className="text-xs text-blue-300 mt-1">This week</div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-green-900 to-green-800 rounded-2xl border border-green-700">
                  <div className="text-3xl font-bold text-green-400 mb-2">{reportData?.negativeCases || 0}</div>
                  <div className="text-sm text-green-200 font-medium">Healthy Results</div>
                  <div className="text-xs text-green-300 mt-1">Normal cases</div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-red-900 to-red-800 rounded-2xl border border-red-700">
                  <div className="text-3xl font-bold text-red-400 mb-2">{reportData?.positiveCases || 0}</div>
                  <div className="text-sm text-red-200 font-medium">Cataract Cases</div>
                  <div className="text-xs text-red-300 mt-1">Require treatment</div>
                </div>
              </div>
            </div>

            {/* Charts Section (keep as is) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl">
                    <PieChart className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Detection Results</h3>
                    <p className="text-gray-400">Weekly breakdown</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-900/80 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="font-medium text-green-100">Healthy Eyes</span>
                    </div>
                    <span className="text-2xl font-bold text-green-300">{reportData?.negativeCases || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-900/80 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <span className="font-medium text-red-100">Cataract Detected</span>
                    </div>
                    <span className="text-2xl font-bold text-red-300">{reportData?.positiveCases || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-900/80 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-yellow-300" />
                      <span className="font-medium text-yellow-100">Uncertain</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-200">{reportData?.uncertainCases || 0}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-800 to-purple-900 rounded-xl">
                    <Activity className="h-6 w-6 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Top Patients</h3>
                    <p className="text-gray-400">Most active this week</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {reportData?.topPatients.slice(0, 5).map((patient, index) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-2xl hover:bg-gray-700 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-white">{patient.name}</p>
                          <p className="text-sm text-gray-400">{patient.age} years old</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-300">{patient.totalScans} scans</span>
                        {getStatusIcon(patient.lastResult)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="space-y-8">
            {/* Monthly Overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60 p-8">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Monthly Overview</h3>
                  <p className="text-gray-600">Comprehensive monthly statistics and trends</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl border border-blue-700">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{reportData?.totalScans || 0}</div>
                  <div className="text-sm text-blue-200 font-medium">Total Scans</div>
                  <div className="text-xs text-blue-300 mt-1">This month</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-900 to-green-800 rounded-2xl border border-green-700">
                  <div className="text-3xl font-bold text-green-400 mb-2">{reportData?.negativeCases || 0}</div>
                  <div className="text-sm text-green-200 font-medium">Healthy Results</div>
                  <div className="text-xs text-green-300 mt-1">Normal cases</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-red-900 to-red-800 rounded-2xl border border-red-700">
                  <div className="text-3xl font-bold text-red-400 mb-2">{reportData?.positiveCases || 0}</div>
                  <div className="text-sm text-red-200 font-medium">Cataract Cases</div>
                  <div className="text-xs text-red-300 mt-1">Require treatment</div>
                </div>
              </div>
            </div>
            {/* Detection Results and Top Patients (side by side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Detection Results - Monthly breakdown */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <PieChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Detection Results</h3>
                    <p className="text-gray-600">Monthly breakdown</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50/80 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-900">Healthy Eyes</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{reportData?.negativeCases || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50/80 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-gray-900">Cataract Detected</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{reportData?.positiveCases || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50/80 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-gray-900">Uncertain</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">{reportData?.uncertainCases || 0}</span>
                  </div>
                </div>
              </div>
              {/* Top Patients - Most active this month */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Top Patients</h3>
                    <p className="text-gray-600">Most active this month</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {reportData?.topPatients.slice(0, 5).map((patient, index) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl hover:bg-gray-100/80 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.age} years old</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{patient.totalScans} scans</span>
                        {getStatusIcon(patient.lastResult)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'individual' && (
          <div className="space-y-8">
            {/* Search and Filter */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>

            {/* Individual Patient Reports */}
            <div className="grid grid-cols-1 gap-6">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600">{patient.age} years old • {patient.totalScans} scans</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(patient.lastResult)}`}>
                        {patient.lastResult || 'No scans'}
                      </div>
                      <button
                        onClick={() => handlePatientSelect(patient)}
                        className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                  
                  {patient.lastScan && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last scan: {new Date(patient.lastScan).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(patient.lastResult)}
                          <span className="capitalize">{patient.lastResult || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Details Modal */}
        {showPatientDetails && selectedPatient && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/60">
              <div className="p-6 border-b border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedPatient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedPatient.name}</h3>
                      <p className="text-gray-600">{selectedPatient.age} years old</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportPatientPDF(selectedPatient)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => setShowPatientDetails(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100/80 rounded-xl"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-blue-50 rounded-2xl">
                    <div className="text-2xl font-bold text-blue-600">{selectedPatient.totalScans}</div>
                    <div className="text-sm text-blue-600">Total Scans</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-2xl">
                    <div className="text-2xl font-bold text-green-600">{selectedPatient.age}</div>
                    <div className="text-sm text-green-600">Age</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-2xl">
                    <div className="text-2xl font-bold text-purple-600">{selectedPatient.status}</div>
                    <div className="text-sm text-purple-600">Status</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(selectedPatient.lastResult)}
                        <div>
                          <p className="font-medium text-gray-900">Latest Scan</p>
                          <p className="text-sm text-gray-600">
                            {selectedPatient.lastScan ? new Date(selectedPatient.lastScan).toLocaleDateString() : 'No scans yet'}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(selectedPatient.lastResult)}`}>
                        {selectedPatient.lastResult || 'No result'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 