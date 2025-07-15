import { Trash2 } from 'lucide-react'
import React, { useState } from 'react'

interface DangerZoneProps {
  onDelete: () => void
  loading: boolean
  message: string | null
}

const DangerZone: React.FC<DangerZoneProps> = ({ onDelete, loading, message }) => {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 mt-8">
      <div className="flex items-center mb-6">
        <Trash2 className="h-5 w-5 text-red-500 mr-3" />
        <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
      </div>
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-red-900">Delete Account</h4>
            <p className="text-sm text-red-600">Permanently delete your account and all data</p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={loading}
          >
            Delete Account
          </button>
        </div>
        {message && (
          <div className={`mt-4 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>
        )}
      </div>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/60 p-8">
            <h3 className="text-xl font-semibold text-red-700 mb-4 flex items-center">
              <Trash2 className="h-5 w-5 mr-2" /> Confirm Account Deletion
            </h3>
            <p className="mb-6 text-gray-700">
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); onDelete(); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DangerZone 