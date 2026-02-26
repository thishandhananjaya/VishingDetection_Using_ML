import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'
import { getCall, summarizeCall } from '../services/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiShield, FiAlertTriangle, FiFileText, FiCpu, FiLoader } from 'react-icons/fi'

export default function CallDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [call, setCall] = useState(null)
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await getCall(id)
        setCall(res.data || res)

        // Auto-summarize if not already done
        handleSummarize()
      } catch (err) {
        toast.error('Failed to load call details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSummarize = async () => {
    try {
      setSummarizing(true)
      const res = await summarizeCall(id)
      setSummary(res.data?.summary || res.summary)
    } catch (err) {
      console.error("Summarization failed", err)
    } finally {
      setSummarizing(false)
    }
  }

  if (loading) return (
    <div className="bg-gray-950 min-h-screen flex items-center justify-center">
      <FiLoader className="text-blue-500 animate-spin text-4xl" />
    </div>
  )

  if (!call) return (
    <div className="bg-gray-950 min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Call Not Found</h1>
      <button onClick={() => navigate('/dashboard')} className="text-blue-500 flex items-center gap-2">
        <FiArrowLeft /> Back to Dashboard
      </button>
    </div>
  )

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100 pb-12">
      <Sidebar />
      <Topbar />
      <main className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-6xl"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to List
          </button>

          <header className="flex justify-between items-start mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${call.status === 'Scam' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'
                  }`}>
                  {call.status} DETECTED
                </span>
                <span className="text-gray-500 text-sm">{call.timestamp}</span>
              </div>
              <h1 className="text-4xl font-black">{call.filename}</h1>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Risk Confidence</div>
              <div className={`text-5xl font-black ${call.status === 'Scam' ? 'text-red-500' : 'text-green-500'}`}>
                {call.risk}%
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Transcript */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FiFileText className="text-blue-500" /> Full Transcript
                </h2>
                <p className="text-gray-300 leading-relaxed text-lg italic whitespace-pre-wrap">
                  "{call.transcript}"
                </p>
              </section>

              {call.keywords && call.keywords.length > 0 && (
                <section className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Trigger Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {call.keywords.map(kw => (
                      <span key={kw} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl border border-red-900/30 font-bold">
                        {kw}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* AI Summary Side Panel */}
            <aside className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FiCpu size={80} />
                </div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiCpu className="text-blue-400" /> AI Insights
                </h2>
                {summarizing ? (
                  <div className="flex items-center gap-3 text-gray-400">
                    <FiLoader className="animate-spin" /> Deep analysis in progress...
                  </div>
                ) : (
                  <p className="text-gray-200 leading-relaxed text-sm">
                    {summary || "No summary available."}
                  </p>
                )}
                <button
                  onClick={handleSummarize}
                  className="mt-6 text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest"
                >
                  Regenerate Summary
                </button>
              </motion.div>

              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
                <h3 className="font-bold mb-4">Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                    Mark as Resolved
                  </button>
                  <button className="w-full border border-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors">
                    Export Report
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
