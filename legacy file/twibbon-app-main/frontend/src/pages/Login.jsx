import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import useTheme from '../hooks/useTheme'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div style={{position:'fixed',top:16,right:20}}>
        <button className="theme-toggle" onClick={toggle}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>
      <div className="auth-box fade-up">
        <div className="auth-logo">OpenFrame<span className="dot">.</span></div>
        <p className="auth-sub">Masuk ke akun kamu dan mulai berkarya</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <input name="username" placeholder="username kamu" value={form.username} onChange={handle} required autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required />
          </div>
          <div style={{textAlign:'right',marginBottom:18}}>
            <Link to="/forgot-password" style={{fontSize:'0.8rem'}}>Lupa password?</Link>
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk →'}
          </button>
        </form>
        <div className="auth-divider">atau</div>
        <p style={{textAlign:'center',fontSize:'0.85rem',color:'var(--muted)'}}>
          Belum punya akun? <Link to="/register">Daftar gratis</Link>
        </p>
      </div>
    </div>
  )
}
