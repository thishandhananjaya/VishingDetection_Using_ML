import React, { useEffect, useState } from 'react'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'
import CallRow from '../components/CallRow'
import { sampleCalls } from '../services/mockData'

export default function CallsList() {
  const [calls, setCalls] = useState([])
  useEffect(() => setCalls(sampleCalls), [])

  return (
    <div>
      <Sidebar />
      <Topbar />
      <main className="ml-64 p-6">
        <h1 className="text-2xl font-bold mb-6">Flagged Calls</h1>
        <div className="bg-gray-800 rounded-md overflow-hidden">
          <table className="w-full table-auto">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-3 text-left">Caller</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Risk</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {calls.map(c => <CallRow key={c.id} call={c} />)}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
