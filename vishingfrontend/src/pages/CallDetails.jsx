import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'
import { sampleCalls } from '../services/mockData'
import toast from 'react-hot-toast'

export default function CallDetails() {
  const { id } = useParams()
  const [call, setCall] = useState(null)

  useEffect(() => {
    const found = sampleCalls.find(c => c.id === id)
    setCall(found || null)
  }, [id])

  if (!call) return <div className="ml-64 p-6">Call not found</div>

  const markReviewed = async () => {
    toast.success('Marked as reviewed (demo)')
  }

  return (
    <div>
      <Sidebar />
      <Topbar />
      <main className="ml-64 p-6">
        <h1 className="text-2xl font-bold mb-6">Call Details</h1>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-gray-800 p-6 rounded-md shadow-sm">
            <h3 className="font-semibold mb-2">Transcript</h3>
            <p className="whitespace-pre-wrap text-gray-200">{call.transcript}</p>

            {Array.isArray(call.highlights) && call.highlights.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Highlights</h4>
                <div className="flex gap-2 flex-wrap">
                  {call.highlights.map(h => (
                    <span key={h} className="px-3 py-1 bg-gray-700 rounded-md text-sm">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="bg-gray-800 p-6 rounded-md shadow-sm flex flex-col items-center justify-center">
            <div className="text-gray-400 mb-2">Risk Score</div>
            <div className="text-4xl font-bold">{call.risk}%</div>
            <button
              onClick={markReviewed}
              className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
            >
              Mark Reviewed
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}
