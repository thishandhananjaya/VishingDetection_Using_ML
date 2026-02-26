import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShield } from 'react-icons/fi'

export default function PageBuffer({ children }) {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Artificial small delay for premium motion feel
        const timer = setTimeout(() => setLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    return (
        <>
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div
                        key="buffer"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center p-8"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-24 h-24 rounded-full border-t-2 border-b-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center text-blue-500"
                            >
                                <FiShield size={32} />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: loading ? 0 : 1, y: loading ? 10 : 0 }}
                transition={{ duration: 0.6 }}
            >
                {children}
            </motion.div>
        </>
    )
}
