import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiShield, FiActivity, FiUserCheck } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Welcome() {
    const navigate = useNavigate()
    const { user } = useAuth()

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/')
        }, 4000)
        return () => clearTimeout(timer)
    }, [navigate])

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[150px] rounded-full"
                />
            </div>

            <div className="relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="inline-flex p-6 rounded-full bg-blue-500/10 text-blue-500 mb-8 border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.2)]"
                >
                    <FiShield size={64} className="animate-pulse" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    <h2 className="text-gray-500 text-xs font-black uppercase tracking-[0.5em] mb-4">Identity Verified</h2>
                    <h1 className="text-6xl font-black tracking-tighter mb-6">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user?.name || 'Administrator'}</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md mx-auto font-medium leading-relaxed">
                        Initializing secure vishing detection protocols and intelligence feeds...
                    </p>
                </motion.div>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "200px" }}
                    transition={{ delay: 1, duration: 2.5 }}
                    className="h-1 bg-blue-500 mx-auto mt-12 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)]"
                />

                <div className="mt-16 flex justify-center gap-12 text-gray-600">
                    <div className="flex flex-col items-center gap-2">
                        <FiUserCheck size={20} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Secure Session</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <FiActivity size={20} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">System Ready</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
