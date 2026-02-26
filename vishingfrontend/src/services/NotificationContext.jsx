import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getCalls } from './api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const NotificationContext = createContext()

export const useNotification = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([])
    const [lastSeenId, setLastSeenId] = useState(null)
    const navigate = useNavigate()
    const pollingRef = useRef(null)

    const checkNewScams = async () => {
        try {
            const response = await getCalls()
            const calls = response.data || response

            if (calls.length > 0) {
                const latestCall = calls[calls.length - 1]

                // If it's a new scam call and we haven't seen it yet
                if (latestCall.status === 'Scam' && latestCall.id !== lastSeenId) {
                    setLastSeenId(latestCall.id)
                    setAlerts(prev => [latestCall, ...prev])

                    // Show a toast that navigates to the call
                    toast.error(
                        (t) => (
                            <span className="flex flex-col gap-1 cursor-pointer" onClick={() => {
                                navigate(`/calls/${latestCall.id}`)
                                toast.dismiss(t.id)
                            }}>
                                <strong className="text-sm font-bold">🚨 SCAM ALERT DETECTED!</strong>
                                <span className="text-xs opacity-80">Click to view details: {latestCall.filename}</span>
                            </span>
                        ),
                        { duration: 6000, position: 'top-right' }
                    )
                }
            }
        } catch (err) {
            console.error("Polling error", err)
        }
    }

    useEffect(() => {
        // Initial check
        checkNewScams()

        // Poll every 5 seconds
        pollingRef.current = setInterval(checkNewScams, 5000)

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [lastSeenId])

    const dismissAlert = (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id))
    }

    return (
        <NotificationContext.Provider value={{ alerts, dismissAlert }}>
            {children}
        </NotificationContext.Provider>
    )
}
