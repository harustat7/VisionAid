import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { 
  Bell, 
  Shield, 
  Palette, 
  Download, 
  Trash2, 
  Save,
  AlertTriangle,
  User,
  Mail,
  Lock,
  Check,
  Eye,
  EyeOff,
  HardDrive
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../lib/supabase'
import { NotificationService } from '../services/notificationService'

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth()
  const { theme, changeTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [storageUsage, setStorageUsage] = useState('0 MB')
  
  // Settings state
  const [settings, setSettings] = useState({
    // User Information
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    
    // Notifications
    emailNotifications: true,
    reportNotifications: true,
    
    // Appearance
    language: 'en',
    
    // Privacy
    dataAnalytics: true,
    
    // Password change
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadSettings()
    calculateStorageUsage()
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    try {
      // Load notification settings
      const notificationSettings = await NotificationService.getNotificationSettings(user.id)
      
      // Load other settings from localStorage
      const savedSettings = localStorage.getItem('visionaid_settings')
      let otherSettings = {}
      if (savedSettings) {
        try {
          otherSettings = JSON.parse(savedSettings)
        } catch (error) {
          console.error('Failed to load saved settings:', error)
        }
      }

      setSettings(prev => ({
        ...prev,
        ...notificationSettings,
        ...otherSettings
      }))
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const calculateStorageUsage = async () => {
    try {
      // Get user's detections to estimate storage
      const { data: detections, error } = await supabase
        .from('cataract_detections')
        .select('image_url')

      if (error) throw error

      // Estimate storage (each image ~2-5MB)
      const estimatedSize = (detections?.length || 0) * 3.5 // Average 3.5MB per image
      
      if (estimatedSize < 1) {
        setStorageUsage('< 1 MB')
      } else if (estimatedSize < 1024) {
        setStorageUsage(`${estimatedSize.toFixed(1)} MB`)
      } else {
        setStorageUsage(`${(estimatedSize / 1024).toFixed(2)} GB`)
      }
    } catch (error) {
      console.error('Failed to calculate storage:', error)
      setStorageUsage('Unknown')
    }
  }

  const handleUpdateProfile = async () => {
    if (!settings.fullName.trim()) {
      alert('Name cannot be empty')
      return
    }

    setLoading(true)
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: settings.fullName.trim()
        }
      })

      if (error) throw error

      alert('Profile updated successfully!')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Save notification settings
      await NotificationService.saveNotificationSettings(user.id, {
        emailNotifications: settings.emailNotifications,
        reportNotifications: settings.reportNotifications
      })
      
      // Save other settings to localStorage
      localStorage.setItem('visionaid_settings', JSON.stringify({
        language: settings.language,
        dataAnalytics: settings.dataAnalytics
      }))
      
      // Test email notification if enabled
      if (settings.emailNotifications) {
        try {
          await NotificationService.sendEmailNotification(
            settings.email,
            'VisionAid Settings Updated',
            'Your notification settings have been updated successfully. You will now receive email notifications for cataract analysis results and reports.',
            'general'
          )
        } catch (error) {
          console.error('Failed to send test notification:', error)
        }
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!settings.currentPassword || !settings.newPassword) {
      alert('Please fill in all password fields')
      return
    }
    
    if (settings.newPassword !== settings.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    
    if (settings.newPassword.length < 6) {
      alert('New password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: settings.newPassword
      })

      if (error) throw error
      
      setSettings({
        ...settings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordChange(false)
      alert('Password changed successfully!')
    } catch (error) {
      console.error('Failed to change password:', error)
      alert('Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      setLoading(true)
      
      // Get user's detection data
      const { data: detections, error } = await supabase
        .from('cataract_detections')
        .select('*')

      if (error) throw error

      // Generate comprehensive user data export
      const userData = {
        profile: {
          name: user?.user_metadata?.full_name || 'User',
          email: user?.email,
          joinDate: user?.created_at,
          lastSignIn: user?.last_sign_in_at
        },
        settings: {
          emailNotifications: settings.emailNotifications,
          reportNotifications: settings.reportNotifications,
          theme: theme,
          language: settings.language,
          dataAnalytics: settings.dataAnalytics
        },
        detections: detections?.map(d => ({
          id: d.id,
          patientName: d.patient_name,
          patientAge: d.patient_age,
          result: d.detection_result,
          confidence: d.confidence_score,
          date: d.created_at,
          notes: d.notes
        })) || [],
        statistics: {
          totalScans: detections?.length || 0,
          positiveResults: detections?.filter(d => d.detection_result === 'positive').length || 0,
          negativeResults: detections?.filter(d => d.detection_result === 'negative').length || 0,
          uncertainResults: detections?.filter(d => d.detection_result === 'uncertain').length || 0
        },
        exportDate: new Date().toISOString(),
        exportVersion: '1.0'
      }

      const dataStr = JSON.stringify(userData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `visionaid_data_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      alert('Data exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteMessage(null)
    try {
      const { error } = await supabase.auth.signOut()
      setDeleteMessage('Account deletion request submitted. Please contact support to complete deletion if not automatic.')
      setShowDeleteConfirm(false)
      window.location.href = '/signin'
    } catch (err: any) {
      setDeleteMessage(err.message || 'Failed to delete account.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            {saved && (
              <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <Check className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Settings saved!</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <Palette className="h-5 w-5 text-gray-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => changeTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {theme === 'system' ? 'Follows your device settings' : `Currently using ${theme} theme`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <Shield className="h-5 w-5 text-gray-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </button>
              </div>

              {showPasswordChange && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={settings.currentPassword}
                        onChange={(e) => setSettings({ ...settings, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={settings.newPassword}
                        onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={settings.confirmPassword}
                        onChange={(e) => setSettings({ ...settings, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePasswordChange}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                    <button
                      onClick={() => setShowPasswordChange(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Data Analytics</h4>
                  <p className="text-sm text-gray-500">Help improve our services</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dataAnalytics}
                    onChange={(e) => setSettings({ ...settings, dataAnalytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-center">
          <button 
            onClick={handleSaveSettings}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

        {/* Danger Zone: Delete Account */}
        {/* DangerZone removed as requested */}
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/60 p-8">
              <h3 className="text-xl font-semibold text-red-700 mb-4 flex items-center"><Trash2 className="h-5 w-5 mr-2" /> Confirm Account Deletion</h3>
              <p className="mb-6 text-gray-700">Are you sure you want to permanently delete your account? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}