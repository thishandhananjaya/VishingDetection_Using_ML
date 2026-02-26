import React from 'react'
import RoutesApp from './routes'
import { Toaster } from 'react-hot-toast'
export default function App(){
return (
<div className="min-h-screen">
<RoutesApp />
<Toaster position="top-right" />
</div>
)
}