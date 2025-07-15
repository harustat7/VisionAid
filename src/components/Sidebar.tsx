import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  FileText, 
  User, 
  Settings,
  Eye,
  Sparkles
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Reports', href: '/reports', icon: FileText },
  ]

  const secondaryNavigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="w-72 bg-white/60 backdrop-blur-sm border-r border-gray-200/60 min-h-screen">
      <div className="p-6 border-b border-gray-100/80">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-4 w-4 text-amber-400 drop-shadow-sm" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
              VisionAid
            </h1>
          </div>
        </div>
      </div>

      <nav className="px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 mt-8">
        <div className="border-t border-gray-200/60 pt-6">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Account
          </p>
          <nav className="space-y-1">
            {secondaryNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom section */}
      {/* Removed AI Powered advanced detection card */}
    </div>
  )
}