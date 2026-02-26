import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'
import { getCall, summarizeCall, markReviewed } from '../services/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiShield, FiAlertTriangle, FiFileText, FiCpu, FiLoader } from 'react-icons/fi'
import { jsPDF } from 'jspdf'

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

  const handleResolve = async () => {
    try {
      setSummarizing(true)
      const res = await markReviewed(id)
      setCall(res.data.call || res.call)
      toast.success('Call marked as Resolved')
    } catch (err) {
      toast.error('Failed to resolve call')
    } finally {
      setSummarizing(false)
    }
  }

  const handleExportReport = () => {
    if (!call) return
    toast.loading('Generating Security Report...', { id: 'export' })
    try {
      const doc = new jsPDF()

      // Header
      doc.setFillColor(5, 5, 5)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.text("VishingGuard Security Report", 20, 25)

      // Content
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 50)

      doc.setFontSize(16)
      doc.text("Call Metadata", 20, 70)
      doc.setFontSize(12)
      doc.text(`File: ${call.filename}`, 20, 80)
      doc.text(`Timestamp: ${call.timestamp}`, 20, 90)
      doc.text(`Risk Score: ${call.risk}%`, 20, 100)
      doc.text(`Status: ${call.status}`, 20, 110)

      doc.setFontSize(16)
      doc.text("AI Summary", 20, 130)
      doc.setFontSize(10)
      const splitSummary = doc.splitTextToSize(summary || "No summary available.", 170)
      doc.text(splitSummary, 20, 140)

      doc.setFontSize(16)
      doc.text("Transcript", 20, 180)
      const splitTranscript = doc.splitTextToSize(call.transcript || "N/A", 170)
      doc.text(splitTranscript, 20, 190)

      doc.save(`Vishing_Report_${call.id.slice(0, 8)}.pdf`)
      toast.success('Report exported successfully!', { id: 'export' })
    } catch (err) {
      toast.error('Export failed.', { id: 'export' })
      console.error(err)
    }
  }

  if (loading) return (
    <div className="bg-gray-950 min-h-screen flex items-center justify-center text-white font-sans">
      <FiLoader className="text-blue-500 animate-spin text-4xl" />
    </div>
  )

  if (!call) return (
    <div className="bg-gray-950 min-h-screen flex flex-col items-center justify-center p-8 text-white font-sans">
      <h1 className="text-2xl font-bold mb-4">Call Not Found</h1>
      <button onClick={() => navigate('/dashboard')} className="text-blue-500 flex items-center gap-2">
        <FiArrowLeft /> Back to Dashboard
      </button>
    </div>
  )

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100 pb-12 font-sans">
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
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${call.status === 'Scam' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : call.status === 'Resolved' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'
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
                  <button
                    onClick={handleResolve}
                    disabled={call.status === 'Resolved'}
                    className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${call.status === 'Resolved'
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                  >
                    {call.status === 'Resolved' ? '✓ Resolved' : 'Mark as Resolved'}
                  </button>
                  <button
                    onClick={handleExportReport}
                    className="w-full border border-gray-700 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
                  >
                    Export Report (PDF)
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
