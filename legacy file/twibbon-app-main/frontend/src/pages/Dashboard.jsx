import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  const fetchCampaigns = async () => {
    try {
      const { data } = await axios.get('/api/campaigns/my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCampaigns(data)
    } catch {
      localStorage.clear()
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [])

  const deleteCampaign = async (id) => {
    if (!confirm('Hapus kampanye ini?')) return
    try {
      await axios.delete(`/api/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCampaigns(campaigns.filter(c => c.id !== id))
    } catch { alert('Gagal menghapus kampanye') }
  }

  const copyLink = (campaign) => {
    const identifier = campaign.slug || campaign.id
    const url = window.location.origin + '/twibbon/' + identifier
    navigator.clipboard.writeText(url)
    alert('Link berhasil disalin!')
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header fade-up">
          <div>
            <h2>Kampanye Saya</h2>
            <p className="page-header-sub">Kelola semua kampanye twibbon kamu</p>
          </div>
          <Link to="/create" className="btn btn-primary" style={{width:'auto'}}>
            + Buat Kampanye
          </Link>
        </div>

        {loading && <div className="spinner" />}

        {!loading && campaigns.length === 0 && (
          <div className="empty fade-up">
            <div className="empty-icon">🎨</div>
            <h3>Belum ada kampanye</h3>
            <p>Buat kampanye pertamamu dan bagikan ke semua orang</p>
            <Link to="/create" className="btn btn-primary" style={{width:'auto'}}>
              + Buat Kampanye Pertama
            </Link>
          </div>
        )}

        {!loading && campaigns.length > 0 && (
          <div className="grid fade-up-2">
            {campaigns.map(c => (
              <div className="card" key={c.id}>
                <div className="card-thumb">
                  <img src={'/uploads/frames/' + c.frame_path} alt={c.name} />
                </div>
                <div className="card-body">
                  <div className="card-title">{c.name}</div>
                  <div className="card-meta">
                    <span className="badge badge-ratio">{c.ratio}</span>
                    <span className={'badge ' + (c.is_public ? 'badge-public' : 'badge-private')}>
                      {c.is_public ? 'Publik' : 'Private'}
                    </span>
                  </div>
                  {c.description && <p className="card-desc">{c.description}</p>}
                  {c.slug && (
                    <p style={{fontSize:'0.72rem',color:'var(--muted)',marginBottom:10}}>
                      🔗 /twibbon/{c.slug}
                    </p>
                  )}
                  <div className="card-actions">
                    <button className="btn btn-ghost" style={{fontSize:'0.78rem',padding:'5px 12px'}} onClick={() => copyLink(c)}>
                      🔗 Salin
                    </button>
                    <Link to={'/twibbon/' + (c.slug || c.id)} className="btn btn-ghost" style={{fontSize:'0.78rem',padding:'5px 12px'}}>
                      👁 Lihat
                    </Link>
                    <Link to={'/edit/' + c.id} className="btn btn-ghost" style={{fontSize:'0.78rem',padding:'5px 12px'}}>
                      ✏️ Edit
                    </Link>
                    <button className="btn btn-danger" style={{fontSize:'0.78rem',padding:'5px 10px'}} onClick={() => deleteCampaign(c.id)}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="fade-up-3" style={{
          margin:'12px 0 48px', background:'var(--surface)',
          border:'1px solid var(--border)', borderRadius:18,
          padding:'24px 28px', display:'flex',
          alignItems:'center', justifyContent:'space-between',
          flexWrap:'wrap', gap:16
        }}>
          <div>
            <p style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:'1rem',marginBottom:4}}>
              ☕ Suka dengan OpenFrame?
            </p>
            <p style={{fontSize:'0.82rem',color:'var(--muted)',maxWidth:400}}>
              Aplikasi ini gratis selamanya. Kalau suka, yuk dukung developer-nya!
            </p>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <a href="https://www.instagram.com/_anasubaid/" target="_blank" rel="noreferrer"
              className="btn btn-ghost"
              style={{fontSize:'0.82rem',padding:'8px 16px',textDecoration:'none'}}>
              📸 Instagram
            </a>
            <a href="https://trakteer.id/m_anas_ubaidillah/gift" target="_blank" rel="noreferrer"
              className="btn btn-primary"
              style={{fontSize:'0.82rem',padding:'8px 16px',textDecoration:'none',width:'auto'}}>
              ☕ Traktir Kopi
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
