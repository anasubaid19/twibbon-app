import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

const RATIOS = ['1:1', '4:5', '5:4', '3:4', '4:3', '16:9', '9:16']
const RATIO_VALUES = {
  '1:1': 1/1, '4:5': 4/5, '5:4': 5/4,
  '3:4': 3/4, '4:3': 4/3, '16:9': 16/9, '9:16': 9/16
}
const detectRatio = (w, h) => {
  const actual = w / h
  let closest = '1:1', minDiff = Infinity
  for (const [label, val] of Object.entries(RATIO_VALUES)) {
    const diff = Math.abs(actual - val)
    if (diff < minDiff) { minDiff = diff; closest = label }
  }
  return closest
}

export default function EditCampaign() {
  const { id } = useParams()
  const [form, setForm] = useState({ name: '', description: '', ratio: '1:1', is_public: 'true', slug: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [detectedRatio, setDetectedRatio] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    axios.get(`/api/campaigns/${id}`)
      .then(({ data }) => {
        setForm({
          name: data.name,
          description: data.description || '',
          ratio: data.ratio,
          is_public: data.is_public ? 'true' : 'false',
          slug: data.slug || ''
        })
        setPreview(`/uploads/frames/${data.frame_path}`)
      })
      .catch(() => setError('Kampanye tidak ditemukan'))
      .finally(() => setFetching(false))
  }, [id])

  const handle = e => {
    const { name, value } = e.target
    if (name === 'slug') {
      setForm(prev => ({ ...prev, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    if (f.type !== 'image/png') return setError('Hanya file PNG yang diizinkan')
    if (f.size > 5 * 1024 * 1024) return setError('Ukuran file maksimal 5 MB')
    setError('')
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    const img = new Image()
    img.onload = () => {
      const ratio = detectRatio(img.naturalWidth, img.naturalHeight)
      setDetectedRatio(ratio)
      setForm(prev => ({ ...prev, ratio }))
    }
    img.src = url
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('ratio', form.ratio)
      fd.append('is_public', form.is_public)
      fd.append('slug', form.slug)
      if (file) fd.append('frame', file)
      await axios.put(`/api/campaigns/${id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const baseUrl = window.location.origin

  if (fetching) return <><Navbar showBack /><div className="spinner" /></>

  return (
    <>
      <Navbar showBack />
      <div className="container">
        <div className="page-header fade-up">
          <div>
            <h2>Edit Kampanye</h2>
            <p className="page-header-sub">Perbarui detail dan frame kampanyemu</p>
          </div>
        </div>

        <div className="create-grid fade-up-2">
          <form onSubmit={submit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label>Ganti Frame PNG <span style={{color:'var(--muted)',textTransform:'none',letterSpacing:0}}>/ opsional, maks 5 MB</span></label>
              <input type="file" accept="image/png" onChange={handleFile} />
              {!file && <p style={{fontSize:'0.76rem',color:'var(--muted)',marginTop:5}}>Kosongkan jika tidak ingin mengganti frame</p>}
            </div>

            <div className="field">
              <label>Nama Kampanye</label>
              <input name="name" placeholder="cth: HUT RI ke-80" value={form.name} onChange={handle} required />
            </div>

            <div className="field">
              <label>Link Kampanye <span style={{color:'var(--muted)',textTransform:'none',letterSpacing:0}}>/ custom URL</span></label>
              <div style={{display:'flex',alignItems:'center',background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',overflow:'hidden',transition:'border 0.2s'}}
                onFocusCapture={e => e.currentTarget.style.borderColor='var(--accent)'}
                onBlurCapture={e => e.currentTarget.style.borderColor='var(--border)'}
              >
                <span style={{padding:'10px 10px 10px 14px',color:'var(--muted)',fontSize:'0.8rem',whiteSpace:'nowrap',borderRight:'1px solid var(--border)',background:'var(--surface2)',fontWeight:600}}>
                  /twibbon/
                </span>
                <input
                  name="slug"
                  placeholder="nama-kampanye-kamu"
                  value={form.slug}
                  onChange={handle}
                  style={{border:'none',borderRadius:0,background:'transparent',flex:1,outline:'none',padding:'10px 14px',color:'var(--text)',fontSize:'0.92rem'}}
                />
              </div>
              {form.slug && (
                <p style={{fontSize:'0.76rem',color:'var(--muted)',marginTop:5}}>
                  🔗 <span style={{color:'var(--accent)'}}>{baseUrl}/twibbon/{form.slug}</span>
                </p>
              )}
              <p style={{fontSize:'0.72rem',color:'var(--muted)',marginTop:3}}>
                Huruf kecil, angka, dan tanda hubung (-). Kosongkan untuk pakai ID otomatis.
              </p>
            </div>

            <div className="field">
              <label>Deskripsi <span style={{color:'var(--muted)',textTransform:'none',letterSpacing:0}}>/ opsional</span></label>
              <textarea name="description" placeholder="Deskripsi singkat kampanye..." value={form.description} onChange={handle} />
            </div>

            <div className="field">
              <label>
                Rasio Gambar
                {detectedRatio && <span className="badge badge-public" style={{marginLeft:8,textTransform:'none',letterSpacing:0}}>✨ Auto: {detectedRatio}</span>}
              </label>
              <select name="ratio" value={form.ratio} onChange={handle}>
                {RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Visibilitas</label>
              <select name="is_public" value={form.is_public} onChange={handle}>
                <option value="true">🌍 Publik — bisa diakses siapa saja</option>
                <option value="false">🔒 Private — hanya kamu</option>
              </select>
            </div>

            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                Batal
              </button>
            </div>
          </form>

          <div>
            <label style={{fontSize:'0.78rem',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:10}}>Preview Frame</label>
            <div className={`preview-box ${preview ? 'has-image' : ''}`} style={{minHeight:320}}>
              {preview
                ? <img src={preview} alt="preview" />
                : <div className="preview-empty"><div className="preview-empty-icon">🖼️</div><p>Frame saat ini akan tampil di sini</p></div>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
