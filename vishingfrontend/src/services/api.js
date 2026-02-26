import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'
const api = axios.create({ baseURL: API_BASE, timeout: 20000 })
export const authLogin = (credentials) => api.post('/auth/login', credentials)
export const authRegister = (payload) => api.post('/auth/register', payload)
export const getCalls = () => api.get('/calls')
export const getCall = (id) => api.get(`/calls/${id}`)
export const uploadFile = (formData, onUploadProgress) => api.post('/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress })
export const analyzeFolder = (path) => api.post('/analyze_folder', { path })
export const summarizeCall = (id) => api.post(`/summarize/${id}`)
export const markReviewed = (id) => api.put(`/calls/${id}/resolve`)
export default api