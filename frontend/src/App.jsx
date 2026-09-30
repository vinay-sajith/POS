import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import api from './api'
import Login from './pages/Login'
import AdminShell from './pages/AdminShell'
import Billing from './pages/Billing'

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const load = () => localStorage.getItem('token')
    ? api.get('/auth/me/').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true))
    : setReady(true)
  useEffect(() => { load() }, [])
  const logout = () => { localStorage.removeItem('token'); setUser(null) }
  if (!ready) return <div className="center">Loading…</div>
  if (!user) return <Login onLogin={() => { setReady(false); load() }} />
  const home = user.role === 'admin' ? '/admin' : '/billing'
  const admin = el => user.role === 'admin' ? el : <Navigate to="/billing" />
  return (
    <Routes>
      <Route path="/admin/*" element={admin(<AdminShell base="/admin" user={user} logout={logout} />)} />
      <Route path="/m/*" element={admin(<AdminShell base="/m" user={user} logout={logout} />)} />
      <Route path="/billing" element={<Billing user={user} logout={logout} />} />
      <Route path="*" element={<Navigate to={home} />} />
    </Routes>
  )
}
