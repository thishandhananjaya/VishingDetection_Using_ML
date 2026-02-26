import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const loc = useLocation()
  const items = [
    ['/', 'Dashboard'],
    ['/calls', 'Flagged Calls'],
    ['/upload', 'Upload & Analyze'],
    ['/settings', 'Settings']
  ]
  return (
    <aside className="w-64 bg-gray-850 p-6 min-h-screen fixed left-0 top-0 border-r border-gray-700">
      <h2 className="text-2xl font-semibold mb-8">Vishing Monitor</h2>
      <nav className="flex flex-col gap-3">
        {items.map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className={`px-4 py-2 rounded transition-colors duration-200 text-gray-200 ${
              loc.pathname === to ? 'bg-gray-700 font-medium' : 'hover:bg-gray-700'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
