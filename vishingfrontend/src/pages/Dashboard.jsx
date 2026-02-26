import React, { useEffect, useState } from 'react'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'
import { getCalls } from '../services/api'
import { motion } from 'framer-motion'
import { FiActivity, FiShield, FiAlertOctagon, FiClock } from 'react-icons/fi'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, scams: 0, safe: 0, recent: [] })

  useEffect(() => {
    getCalls().then(res => {
      const data = res.data || res
      const scams = data.filter(c => c.status === 'Scam').length
      setStats({
        total: data.length,
        scams: scams,
        safe: data.length - scams,
        recent: data.slice(-5).reverse()
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
    <div className="bg-gray-950 min-h-screen text-gray-100">
      <Sidebar />
      <Topbar />
      <main className="ml-64 p-8">
        <header className="mb-10">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold"
          >
            Security Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400"
          >
            Overview of recent vishing detection activity.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                  <card.icon size={24} />
                </div>
              </div>
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{card.label}</h3>
              <p className="text-4xl font-black mt-1">{card.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FiClock className="text-blue-500" /> Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {stats.recent.map((call, idx) => (
              <div key={call.id || idx} className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${call.status === 'Scam' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                  <div>
                    <h4 className="font-medium text-sm">{call.filename}</h4>
                    <p className="text-xs text-gray-500">{call.timestamp}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${call.status === 'Scam' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                  {call.status}
                </span>
              </div>
            ))}
            {stats.recent.length === 0 && (
              <div className="p-12 text-center text-gray-600 italic">No activity recorded yet.</div>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  )
}
