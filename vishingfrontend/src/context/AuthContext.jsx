import React, { createContext, useContext, useState, useEffect } from 'react'
const AuthContext = createContext()
export function AuthProvider({ children }){
const [user, setUser] = useState(()=>{
try{ const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null }catch{ return null }
})
useEffect(()=>{ try{ if(user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user') }catch{} },[user])
const login = (userData)=> setUser(userData)
const logout = ()=> setUser(null)
return (
<AuthContext.Provider value={{ user, login, logout }}>
{children}
</AuthContext.Provider>
)
}
export const useAuth = ()=> useContext(AuthContext)