import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Topbar() {
  const { user, logout } = useAuth()
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 ml-64">
      <div className="text-lg font-semibold">{user?.name || 'Supervisor'}</div>
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  )
}
