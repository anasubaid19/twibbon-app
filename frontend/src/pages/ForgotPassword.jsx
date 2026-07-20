import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import useTheme from '../hooks/useTheme'

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ username: '', recovery_code: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [newRecoveryCode, setNewRecoveryCode] = useState('')
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm)
      return setError('Password baru dan konfirmasi tidak cocok')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/forgot-password', {
        username: form.username,
        recovery_code: form.recovery_code,
        new_password: form.new_password
      })
      setNewRecoveryCode(data.newRecoveryCode)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(newRecoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 2) return (
    <div className="auth-wrap">
      <div className="auth-box fade-up" style={{maxWidth:460}}>
        <div className="auth-logo">✅ Reset Berhasil<span className="dot">.</span></div>
        <p className="auth-sub">Password berhasil diperbarui. Recovery code lama sudah tidak berlaku — simpan yang baru ini.</p>
        <div className="recovery-box">{newRecoveryCode}</div>
        <div className="alert alert-error" style={{marginBottom:16}}>
          ⚠️ Ini recovery code barumu. Simpan sekarang sebelum menutup halaman.
        </div>
        <button className="btn btn-ghost" style={{width:'100%',marginBottom:10}} onClick={copy}>
          {copied ? '✅ Tersalin!' : '📋 Salin Recovery Code Baru'}
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Lanjut ke Halaman Login →
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
        <div className="auth-logo">Reset Password<span className="dot">.</span></div>
        <p className="auth-sub">Masukkan username dan recovery code yang kamu simpan saat mendaftar</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <input name="username" placeholder="username kamu" value={form.username} onChange={handle} required autoFocus />
          </div>
          <div className="field">
            <label>Recovery Code</label>
            <input name="recovery_code"
              placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              value={form.recovery_code} onChange={handle} required
              style={{fontFamily:'monospace',letterSpacing:1}}
            />
          </div>
          <div className="field">
            <label>Password Baru <span style={{color:'var(--muted)',textTransform:'none',letterSpacing:0}}>min. 6 karakter</span></label>
            <input name="new_password" type="password" placeholder="••••••••" value={form.new_password} onChange={handle} required />
          </div>
          <div className="field">
            <label>Konfirmasi Password Baru</label>
            <input name="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={handle} required />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Reset Password →'}
          </button>
        </form>
        <div className="auth-divider">atau</div>
        <p style={{textAlign:'center',fontSize:'0.85rem',color:'var(--muted)'}}>
          Ingat password? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
