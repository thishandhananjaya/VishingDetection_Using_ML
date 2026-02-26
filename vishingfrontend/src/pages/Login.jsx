import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authLogin } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FiLock, FiMail, FiShield, FiArrowRight, FiShieldOff } from 'react-icons/fi'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authLogin({ email, password })
      login(res.data.user)
      toast.success('Identified & Authenticated')
      navigate('/welcome')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white p-4 font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-gray-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <header className="text-center mb-10">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="inline-flex p-4 rounded-3xl bg-blue-500/10 text-blue-500 mb-6 border border-blue-500/20"
            >
              <FiShield size={32} />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight mb-2">VishingGuard</h1>
            <p className="text-gray-500 text-sm font-medium tracking-wide border-t border-white/5 pt-4">CENTRAL SECURITY GATEWAY</p>
          </header>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Authority Email</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium"
                  placeholder="admin@vishing.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Security Key</label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-xl"
            >
              {loading ? 'Authorizing...' : 'Unlock Secure System'}
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.form>

          <footer className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <FiShieldOff /> AES-256 ENCRYPTED TRANSACTION
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  )
}
