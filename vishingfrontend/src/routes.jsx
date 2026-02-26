import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CallsList from './pages/CallsList'
import CallDetails from './pages/CallDetails'
import Upload from './pages/Upload'
import Settings from './pages/Settings'
import Welcome from './pages/Welcome'
import PageBuffer from './components/PageBuffer'
import { useAuth } from './context/AuthContext'
function PrivateRoute({ children }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    return <PageBuffer>{children}</PageBuffer>
}
export default function RoutesApp() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/welcome" element={<PrivateRoute><Welcome /></PrivateRoute>} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/calls" element={<PrivateRoute><CallsList /></PrivateRoute>} />
            <Route path="/calls/:id" element={<PrivateRoute><CallDetails /></PrivateRoute>} />
            <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}