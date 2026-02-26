import React, { useEffect, useState } from 'react'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'
import { getCalls } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiFilter, FiCalendar, FiArrowRight, FiActivity, FiX, FiSearch, FiClock } from 'react-icons/fi'

export default function CallsList() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', startDate: '', endDate: '' })
  const [showFilters, setShowFilters] = useState(false)

  const fetchCalls = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.startDate) params.append('start_date', filter.startDate)
      if (filter.endDate) params.append('end_date', filter.endDate)

      const res = await getCalls() // Use simple call if API handles it, or pass params
      const data = res.data || res

      // Since our local dev might not handle query params perfectly yet, we also filter client-side for safety
      let result = Array.isArray(data) ? data : []
      if (filter.status) result = result.filter(c => c.status === filter.status)

      setCalls(result)
    } catch (err) {
      console.error("Failed to fetch calls", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalls()
  }, [filter])

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100 font-sans">
      <Sidebar />
      <Topbar />
      <main className="ml-64 p-8">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Intelligence Logs</h1>
            <p className="text-gray-500 text-lg font-medium">Review and audit all processed call recordings.</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
              }`}
          >
            <FiFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </header>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 mb-8 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Detection Status</label>
                  <select
                    value={filter.status}
                    onChange={e => setFilter({ ...filter, status: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="Scam">Scam Only</option>
                    <option value="Safe">Safe Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={filter.startDate}
                    onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={filter.endDate}
                    onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilter({ status: '', startDate: '', endDate: '' })}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl text-sm font-bold transition-colors"
                  >
                    Reset Analytics
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">Scanning Logs...</p>
            </div>
          ) : calls.length > 0 ? (
            calls.map((call, i) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-[2rem] p-6 hover:border-gray-700 transition-all shadow-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${call.status === 'Scam' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {call.status === 'Scam' ? <FiActivity size={24} /> : <FiSearch size={24} />}
                  </div>
                  <div>
                    <h4 className="text-xl font-black tracking-tight group-hover:text-blue-400 transition-colors uppercase">{call.filename}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><FiCalendar /> {call.timestamp}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${call.status === 'Scam' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-green-500/30 text-green-500 bg-green-500/5'
                        }`}>
                        {call.status} DETECTED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Risk Score</p>
                    <p className={`text-4xl font-black ${call.status === 'Scam' ? 'text-red-500' : 'text-green-500'}`}>{call.risk}%</p>
                  </div>
                  <Link
                    to={`/calls/${call.id}`}
                    className="p-4 bg-white text-black rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-xl group/btn"
                  >
                    <FiArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-32 text-center text-gray-600 italic">No logs found matching criteria.</div>
          )}
        </div>
      </main>
    </div>
  )
}
