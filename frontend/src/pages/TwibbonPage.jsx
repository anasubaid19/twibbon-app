import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

const RATIO_DIMS = {
  '1:1':  [1080, 1080], '4:5':  [1080, 1350], '5:4':  [1350, 1080],
  '3:4':  [1080, 1440], '4:3':  [1440, 1080], '16:9': [1920, 1080], '9:16': [1080, 1920]
}

export default function TwibbonPage() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(null)
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dlScale, setDlScale] = useState(1)
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const photoRef = useRef(null)

  useEffect(() => {
    axios.get(`/api/campaigns/${id}`)
      .then(r => setCampaign(r.data))
      .catch(() => setError('Kampanye tidak ditemukan atau bersifat private'))
  }, [id])

  useEffect(() => { if (campaign) drawCanvas() }, [campaign, photo, scale, offsetX, offsetY])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !campaign) return
    const [w, h] = RATIO_DIMS[campaign.ratio] || [1080, 1080]
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)
    if (!photoRef.current) {
      const size = 40
      for (let x = 0; x < w; x += size) {
        for (let y = 0; y < h; y += size) {
          ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#1a1a1f' : '#141418'
          ctx.fillRect(x, y, size, size)
        }
      }
    }
    if (photoRef.current) {
      const img = photoRef.current
      const imgAspect = img.naturalWidth / img.naturalHeight
      const canvasAspect = w / h
      let drawW, drawH
      if (imgAspect > canvasAspect) {
        drawH = h * scale
        drawW = drawH * imgAspect
      } else {
        drawW = w * scale
        drawH = drawW / imgAspect
      }
      const sx = (w - drawW) / 2 + offsetX
      const sy = (h - drawH) / 2 + offsetY
      ctx.drawImage(img, sx, sy, drawW, drawH)
    }
    if (frameRef.current) ctx.drawImage(frameRef.current, 0, 0, w, h)
  }

  const loadFrame = src => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { frameRef.current = img; drawCanvas() }
    img.src = src
  }

  useEffect(() => { if (campaign) loadFrame(`/uploads/frames/${campaign.frame_path}`) }, [campaign])

  const handlePhoto = e => {
    const f = e.target.files[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setPhoto(url)
    const img = new Image()
    img.onload = () => { photoRef.current = img; setScale(1); setOffsetX(0); setOffsetY(0); drawCanvas() }
    img.src = url
  }

  const onMouseDown = e => { setDragging(true); setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY }) }
  const onMouseMove = e => { if (!dragging) return; setOffsetX(e.clientX - dragStart.x); setOffsetY(e.clientY - dragStart.y) }
  const onMouseUp = () => setDragging(false)
  const onTouchStart = e => { e.preventDefault(); const t = e.touches[0]; setDragging(true); setDragStart({ x: t.clientX - offsetX, y: t.clientY - offsetY }) }
  const onTouchMove = e => { e.preventDefault(); if (!dragging) return; const t = e.touches[0]; setOffsetX(t.clientX - dragStart.x); setOffsetY(t.clientY - dragStart.y) }

  const download = () => {
    const [w, h] = RATIO_DIMS[campaign.ratio] || [1080, 1080]
    const W = w * dlScale, H = h * dlScale
    const offscreen = document.createElement('canvas')
    offscreen.width = W
    offscreen.height = H
    const ctx = offscreen.getContext('2d')
    if (photoRef.current) {
      const img = photoRef.current
      const imgAspect = img.naturalWidth / img.naturalHeight
      const canvasAspect = W / H
      let drawW, drawH
      if (imgAspect > canvasAspect) {
        drawH = H * scale
        drawW = drawH * imgAspect
      } else {
        drawW = W * scale
        drawH = drawW / imgAspect
      }
      const sx = (W - drawW) / 2 + offsetX * dlScale
      const sy = (H - drawH) / 2 + offsetY * dlScale
      ctx.drawImage(img, sx, sy, drawW, drawH)
    }
    if (frameRef.current) ctx.drawImage(frameRef.current, 0, 0, W, H)
    const link = document.createElement('a')
    link.download = `openframe-${campaign.name.replace(/\s+/g, '-')}-${dlScale}x.png`
    link.href = offscreen.toDataURL('image/png')
    link.click()
  }

  const PREVIEW_SIZE = Math.min(460, window.innerWidth - 48)

  if (error) return (
    <>
      <Navbar />
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'80px 24px',gap:16}}>
        <span style={{fontSize:'3rem'}}>😕</span>
        <p style={{color:'var(--muted)'}}>{error}</p>
        <Link to="/" className="btn btn-ghost">← Kembali</Link>
      </div>
    </>
  )

  if (!campaign) return <><Navbar /><div className="spinner" /></>

  const [w, h] = RATIO_DIMS[campaign.ratio] || [1080, 1080]
  const previewW = w > h ? PREVIEW_SIZE : Math.round(PREVIEW_SIZE * w / h)
  const previewH = h > w ? PREVIEW_SIZE : Math.round(PREVIEW_SIZE * h / w)
  const dlDims = { 1: [w, h], 2: [w*2, h*2], 3: [w*3, h*3] }

  return (
    <>
      <Navbar />
      <div className="twibbon-wrap">
        <h1 className="twibbon-title fade-up">{campaign.name}</h1>
        {campaign.description && (
          <p style={{color:'var(--muted)',marginBottom:8,textAlign:'center',maxWidth:480}} className="fade-up">
            {campaign.description}
          </p>
        )}
        <p className="twibbon-meta fade-up">
          Rasio <strong>{campaign.ratio}</strong> &nbsp;·&nbsp; oleh <strong>@{campaign.username}</strong>
        </p>

        <div className="canvas-wrap fade-up-2"
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
          style={{cursor: photo ? (dragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none'}}
        >
          <canvas ref={canvasRef} style={{width: previewW, height: previewH, display:'block'}} />
        </div>

        <div className="twibbon-controls fade-up-3">
          <div className="field" style={{marginBottom:0}}>
            <label>📸 Upload Foto Kamu</label>
            <input type="file" accept="image/*" onChange={handlePhoto} />
          </div>

          {photo && (
            <>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <span style={{fontSize:'0.78rem',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>🔍 Zoom</span>
                  <span style={{fontFamily:'monospace',fontSize:'0.85rem',background:'var(--surface2)',border:'1px solid var(--border)',padding:'2px 10px',borderRadius:20,color:'var(--accent)'}}>
                    {Math.round(scale * 100)}%
                  </span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <button className="btn btn-ghost" style={{padding:'4px 12px',fontSize:'1.1rem',borderRadius:8,flexShrink:0}}
                    onClick={() => setScale(s => Math.max(0.5, parseFloat((s-0.1).toFixed(2))))}>−</button>
                  <input type="range" min="0.5" max="3" step="0.01" value={scale}
                    onChange={e => setScale(parseFloat(e.target.value))} style={{flex:1}} />
                  <button className="btn btn-ghost" style={{padding:'4px 12px',fontSize:'1.1rem',borderRadius:8,flexShrink:0}}
                    onClick={() => setScale(s => Math.min(3, parseFloat((s+0.1).toFixed(2))))}>+</button>
                </div>
                <div style={{display:'flex',justifyContent:'center',marginTop:8}}>
                  <button style={{background:'none',border:'none',color:'var(--muted)',fontSize:'0.75rem',cursor:'pointer'}}
                    onClick={() => { setScale(1); setOffsetX(0); setOffsetY(0) }}>↺ Reset posisi</button>
                </div>
              </div>

              <p style={{fontSize:'0.78rem',color:'var(--muted)',textAlign:'center'}}>
                💡 Drag foto di canvas untuk menggeser posisi
              </p>

              {/* Resolusi download */}
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px'}}>
                <p style={{fontSize:'0.78rem',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>
                  📐 Resolusi Download
                </p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[1,2,3].map(s => (
                    <button key={s}
                      onClick={() => setDlScale(s)}
                      className={dlScale === s ? 'btn btn-primary' : 'btn btn-ghost'}
                      style={{flexDirection:'column',gap:2,padding:'10px 6px',borderRadius:10,fontSize:'0.85rem',width:'100%'}}
                    >
                      <span style={{fontWeight:700}}>{s}×</span>
                      <span style={{fontSize:'0.68rem',opacity:0.7}}>{dlDims[s][0]}×{dlDims[s][1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" onClick={download} style={{fontSize:'1rem',padding:'14px'}}>
                ⬇️ Download {dlScale}× ({dlDims[dlScale][0]}×{dlDims[dlScale][1]} px)
              </button>
            </>
          )}

          {!photo && (
            <p style={{textAlign:'center',color:'var(--muted)',fontSize:'0.85rem',padding:'8px 0'}}>
              Upload foto untuk mulai membuat OpenFrame
            </p>
          )}
        </div>
      </div>
    </>
  )
}
