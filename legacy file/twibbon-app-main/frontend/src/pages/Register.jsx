import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import useTheme from '../hooks/useTheme'

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/register', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)
      setRecoveryCode(data.recoveryCode)
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(recoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (recoveryCode) return (
    <div className="auth-wrap">
      <div className="auth-box fade-up" style={{maxWidth:460}}>
        <div className="auth-logo">🔑 Simpan Kode<span className="dot">.</span></div>
        <p className="auth-sub">
          Akun berhasil dibuat! Kode ini <strong>hanya muncul sekali</strong> — simpan di tempat aman seperti notes atau password manager.
        </p>
        <div className="recovery-box">{recoveryCode}</div>
        <div className="alert alert-error">
          ⚠️ Tanpa kode ini, kamu tidak bisa reset password jika lupa.
        </div>
        <button className="btn btn-ghost" style={{width:'100%',marginBottom:10}} onClick={copy}>
          {copied ? '✅ Tersalin!' : '📋 Salin Recovery Code'}
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Sudah disimpan → Masuk Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="auth-wrap">
      <div style={{position:'fixed',top:16,right:20}}>
        <button className="theme-toggle" onClick={toggle}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>
      <div className="auth-box fade-up">
        <div className="auth-logo">OpenFrame<span className="dot">.</span></div>
        <p className="auth-sub">Buat akun gratis — tanpa email, tanpa nomor telepon</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Username <span style={{color:'var(--muted)',textTransform:'none',letterSpacing:0}}>min. 3 karakter</span></label>
            <input name="username" placeholder="pilih username unik" value={form.username} onChange={handle} required autoFocus />
          </div>
          <div className="field">
            <label>Password <span style={{color:'var(--muted)',textTransform:'none',letterSpacing:0}}>min. 6 karakter</span></label>
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Membuat akun...' : 'Daftar Sekarang →'}
          </button>
        </form>
        <div className="auth-divider">atau</div>
        <p style={{textAlign:'center',fontSize:'0.85rem',color:'var(--muted)'}}>
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
