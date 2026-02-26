import React, { useEffect, useState } from 'react'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'
import { getCalls } from '../services/api'
import { motion } from 'framer-motion'
import { FiActivity, FiShield, FiAlertOctagon, FiClock, FiTrendingUp } from 'react-icons/fi'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useNotification } from '../services/NotificationContext'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, scams: 0, safe: 0, recent: [], chartData: [] })
  const { alerts, dismissAlert } = useNotification()

  useEffect(() => {
    getCalls().then(res => {
      const data = res.data || res
      const scams = data.filter(c => c.status === 'Scam').length

      // Prepare chart data (e.g., last 10 entries)
      const chartData = data.slice(-10).map((c, i) => ({
        name: `Call ${i + 1}`,
        risk: c.risk
      }))

      setStats({
        total: data.length,
        scams: scams,
        safe: data.length - scams,
        recent: data.slice(-5).reverse(),
        chartData: chartData
      })
    }).catch(err => console.error("Failed to fetch calls", err))
  }, [])

  const cards = [
    { label: 'Total Analyzed', value: stats.total, icon: FiActivity, color: 'blue' },
    { label: 'Scams Detected', value: stats.scams, icon: FiAlertOctagon, color: 'red' },
    { label: 'Verified Safe', value: stats.safe, icon: FiShield, color: 'green' },
  ]

  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    red: 'bg-red-500/10 text-red-500',
    green: 'bg-green-500/10 text-green-500'
  }

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100 font-sans">
      <Sidebar />
      <Topbar />
      <main className="ml-64 p-8">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.2)] overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="bg-red-500 p-2 rounded-lg animate-pulse">
                  <FiAlertOctagon size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-red-500 font-bold uppercase tracking-tighter">Immediate Action Required: Scam Detected</h4>
                  <p className="text-gray-300 text-sm">A new scam call was detected in "{alert.filename}". Summary and transcript are ready for review.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  to={`/calls/${alert.id}`}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg"
                  onClick={() => dismissAlert(alert.id)}
                >
                  Investigate
                </Link>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <header className="mb-10 flex justify-between items-end">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black tracking-tight"
            >
              Security Overview
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 text-lg"
            >
              Real-time vishing analytics and keyword detection.
            </motion.p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-2xl hover:border-gray-700 transition-all cursor-default group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl ${colorClasses[card.color]} group-hover:scale-110 transition-transform`}>
                  <card.icon size={24} />
                </div>
              </div>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">{card.label}</h3>
              <p className="text-5xl font-black mt-2 tabular-nums">{card.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Risk Graph */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiTrendingUp className="text-purple-500" /> Avg. Detection Risk
              </h2>
            </div>
            <div className="h-64 w-full">
              {stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRisk)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 italic">
                  Not enough data for chart.
                </div>
              )}
            </div>
          </motion.section>

          {/* Activity Feed */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiClock className="text-blue-500" /> Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-gray-800/50">
              {stats.recent.map((call, idx) => (
                <div key={call.id || idx} className="p-6 flex items-start justify-between hover:bg-gray-800/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 ${call.status === 'Scam' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]' : 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]'}`} />
                    <div>
                      <h4 className="font-bold text-sm tracking-wide">{call.filename}</h4>
                      <p className="text-xs text-gray-500 mb-2">{call.timestamp}</p>
                      {call.keywords && call.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {call.keywords.map(kw => (
                            <span key={kw} className="text-[10px] bg-red-500/10 text-red-500/80 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase ${call.status === 'Scam' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {call.status}
                  </span>
                </div>
              ))}
              {stats.recent.length === 0 && (
                <div className="p-20 text-center text-gray-600 italic">No activity recorded yet.</div>
              )}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  )
}
