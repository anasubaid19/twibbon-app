import { Link, useNavigate } from 'react-router-dom'
import useTheme from '../hooks/useTheme'

export default function Navbar({ showBack, backTo = '/dashboard', backLabel = '← Dashboard' }) {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const isLoggedIn = !!localStorage.getItem('token')

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="navbar-brand" style={{textDecoration:'none'}}>
          OpenFrame
        </Link>

        <div className="navbar-actions">
          <a href="https://trakteer.id/m_anas_ubaidillah/gift" target="_blank" rel="noopener noreferrer"
            className="theme-toggle"
            title="Traktir kopi ☕"
            style={{textDecoration:'none', fontSize:'0.8rem', gap:5}}
          >
            ☕ <span style={{fontSize:'0.78rem'}}>Support</span>
          </a>

          <button className="theme-toggle" onClick={toggle} title="Toggle tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {showBack && (
            <Link to={backTo} className="btn btn-ghost" style={{padding:'6px 14px',fontSize:'0.82rem'}}>
              {backLabel}
            </Link>
          )}

          {isLoggedIn && !showBack && (
            <>
              <span className="navbar-user">👤 {username}</span>
              <button className="btn btn-ghost" style={{padding:'6px 14px',fontSize:'0.82rem'}} onClick={logout}>
                Keluar
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
