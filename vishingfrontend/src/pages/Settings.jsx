import React from 'react'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'

export default function Settings() {
  return (
    <div>
      <Sidebar />
      <Topbar />
      <main className="ml-64 p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="bg-gray-800 p-6 rounded-md shadow-sm w-2/3">
          <h2 className="font-semibold mb-4">Profile & Notifications</h2>
          <p className="text-gray-300">
            Alerts  
            
          </p>
        </div>
      </main>
    </div>
  )
}
