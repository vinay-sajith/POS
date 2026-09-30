import { useState } from 'react'
import api, { errText } from '../api'

export default function Login({ onLogin }) {
  const [f, setF] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')
  const submit = async e => {
    e.preventDefault(); setErr('')
    try { const { data } = await api.post('/auth/login/', f); localStorage.setItem('token', data.access); onLogin() }
    catch (x) { setErr(x.response?.status === 401 ? 'Invalid username or password' : errText(x)) }
  }
  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <h1>🧵 TexPOS</h1><p className="muted">Textile & Retail Billing</p>
        <input placeholder="Username" value={f.username} onChange={e => setF({ ...f, username: e.target.value })} autoFocus />
        <input type="password" placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        {err && <div className="error">{err}</div>}
        <button className="btn primary">Sign in</button>
        <div className="muted small">Demo — admin / admin123 · staff / staff123</div>
      </form>
    </div>
  )
}
