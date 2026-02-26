import React, { useState } from 'react'
import Sidebar from '../components/sidebar'
import Topbar from '../components/Topbar'
import { uploadFile, analyzeFolder } from '../services/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUpload, FiFolder, FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [folderPath, setFolderPath] = useState('')
  const [mode, setMode] = useState('file') // 'file' or 'folder'
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const handleUpload = async e => {
    e.preventDefault()
    if (!file) return toast.error('Please select an audio file')

    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)

    try {
      const response = await uploadFile(fd)
      const data = response.data || response
      setResults(prev => [data, ...prev])
      toast.success('Single file analysis complete')
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFolderProcess = async e => {
    e.preventDefault()
    if (!folderPath) return toast.error('Please enter a folder path')

    setLoading(true)
    try {
      const response = await analyzeFolder(folderPath)
      const data = response.data || response
      if (Array.isArray(data)) {
        setResults(prev => [...data, ...prev])
        toast.success(`Processed ${data.length} files from folder`)
      } else {
        toast.error('Unexpected response format')
      }
    } catch (err) {
      toast.error('Folder processing failed. Ensure the path is correct and accessible by the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100">
      <Sidebar />
      <Topbar />
      <main className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Vishing Analysis Engine
            </h1>
            <p className="text-gray-400 mt-2">Detect scams in audio recordings using advanced ML.</p>
          </header>

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setMode('file')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${mode === 'file' ? 'bg-blue-600 shadow-lg shadow-blue-900/40' : 'bg-gray-800 hover:bg-gray-700'
                }`}
            >
              <FiUpload /> Single File
            </button>
            <button
              onClick={() => setMode('folder')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${mode === 'folder' ? 'bg-purple-600 shadow-lg shadow-purple-900/40' : 'bg-gray-800 hover:bg-gray-700'
                }`}
            >
              <FiFolder /> Batch Folder
            </button>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl mb-12">
            {mode === 'file' ? (
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center hover:border-blue-500 transition-colors group cursor-pointer relative">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FiUpload className="mx-auto text-4xl mb-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  <p className="text-lg font-medium">{file ? file.name : 'Drop audio file or click to browse'}</p>
                  <p className="text-sm text-gray-500 mt-1">Supports WAV, MP3, M4A</p>
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <FiLoader className="animate-spin" /> : 'Start Analysis'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleFolderProcess} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">System Path to Folder</label>
                  <input
                    type="text"
                    value={folderPath}
                    onChange={e => setFolderPath(e.target.value)}
                    placeholder="e.g. C:\Users\Downloads\CallRecordings"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <FiLoader className="animate-spin" /> : 'Scan Folder'}
                </button>
              </form>
            )}
          </div>

          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              Recent Findings <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-blue-400">{results.length}</span>
            </h2>
            <div className="grid gap-4">
              <AnimatePresence>
                {results.map((res, idx) => (
                  <motion.div
                    key={res.id || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-5 rounded-xl border flex items-center justify-between transition-all bg-gray-900 ${res.status === 'Scam' ? 'border-red-900/50 bg-red-900/5 shadow-red-900/10' : 'border-green-900/50 bg-green-900/5 shadow-green-900/10'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${res.status === 'Scam' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {res.status === 'Scam' ? <FiAlertTriangle size={24} /> : <FiCheckCircle size={24} />}
                      </div>
                      <div>
                        <h4 className="font-bold">{res.filename}</h4>
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-md italic">"{res.transcript}"</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black ${res.status === 'Scam' ? 'text-red-500' : 'text-green-500'}`}>
                        {res.status}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">Confidence: {res.risk}%</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {results.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-2xl text-gray-600">
                  No analysis results yet. Start by uploading a file or scanning a folder.
                </div>
              )}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  )
}
