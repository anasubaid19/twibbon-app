# Product Requirements Document: OpenFrame (Twibbon App)

## 1. Executive Summary

**Problem**: Existing twibbon tools are either built into social media platforms (with limited control) or require desktop software. Most tools only support one frame slot — a single photo behind a single frame. For complex designs (multiple people in one frame, collage-style overlays, before/after comparisons), creators need **multiple photo slots per campaign** with custom-defined areas.

**Solution**: OpenFrame — a modern SaaS twibbon platform. Creators upload a PNG frame design, then **define photo areas by dragging rectangles** directly on the frame preview. Each area is a numbered slot. Participants (or the creator) can then upload one photo per slot, adjust them independently, and download the full composite.

**Success Criteria**:

- Users can register, log in, and create a campaign in under 2 minutes
- Creator can define 1–N photo areas by dragging rectangles on a canvas in < 30 seconds per area
- Each slot's photo can be independently repositioned and zoomed
- Composite renders at full PNG transparency with sub-second download
- Public gallery with paginated loading (< 500ms page load)
- Achieve 95+ Lighthouse Performance on public pages

---

## 2. User Experience & Functionality

### User Personas

| Persona | Description |
|---------|-------------|
| **Creator** | Someone who wants to make a campaign — community organizer, event host, brand manager. Needs auth, dashboard, CRUD campaigns, and area-mapping tool. |
| **Participant** | Someone who clicks a shared link and fills the photo slots. No auth needed. Uploads one photo per slot, adjusts, downloads. |
| **Browser** | Someone exploring the public gallery to find campaigns to participate in. |

### User Stories & Acceptance Criteria

**US-01: Register & Login**

> As a user, I want to register and log in so I can create and manage my campaigns.

- Registration: username + password (min 8 chars, hashed with bcrypt via Better Auth)
- Login sets HTTP-only session cookie (no localStorage)
- Password reset via recovery code

**US-02: Create Campaign — Upload Frame + Define Areas (Core Feature)**

> As a creator, I want to upload a PNG frame and draw rectangular areas on it so participants know where each photo should go.

- Upload PNG background/frame (max 10MB, alpha channel preserved)
- After upload, the frame image is shown on a **drawing canvas**
- Creator clicks "Add Area" → a resizeable, draggable rectangle appears on the canvas
- Creator can:
  - **Drag** the rectangle to reposition it
  - **Drag corners/edges** to resize it
  - **Delete** a selected area
  - **Reorder** areas (they are numbered 1, 2, 3…)
  - **Add** as many areas as needed (no hard limit, practical max ~20)
- Each area snaps to the canvas boundary (can't drag outside)
- Areas are stored as relative coordinates (% of image width/height) so they work at any output resolution
- Set campaign name (required), description (optional)
- Auto-generate a SEO-friendly slug from the name

**US-03: Edit Campaign**

> As a creator, I want to edit my campaign — change name, description, replace the frame, or adjust area positions.

- Update name, description
- Replace frame image (existing areas reposition relative to new image dimensions)
- Add/remove/reorder/resize areas
- Delete campaign (removes frame + all uploaded slot photos)

**US-04: Fill Twibbon Slots (Participant)**

> As a participant, I want to choose how to fill the frame — single photo across all slots, or one photo per slot.

---

**Mode A — Single Photo (diprioritaskan, ditawarkan pertama)**

> Upload 1 foto, otomatis diterapkan ke semua slot.

- Upload satu foto (JPG/PNG, max 15MB) — sama untuk semua slot
- Setiap slot menampilkan **crop otomatis** dari foto tersebut sesuai area slot-nya
- Partisipan bisa sesuaikan posisi/zoom **secara global** — semua slot bergerak bersamaan
- Download dengan satu klik

**Mode B — Multi Photo**

> Upload foto berbeda untuk tiap slot, kontrol independen.

- Aktifkan mode "Upload per Slot" toggle
- Upload satu foto per slot (JPG/PNG, max 5MB per slot)
- Setiap slot punya editor independen: drag/zoom hanya memengaruhi slot itu
- Preview full composite
- Download at 1×, 2×, or 3× output → PNG with alpha

**US-05: Browse Gallery**

> As a browser, I want to see all public campaigns in a gallery.

- Card grid with campaign thumbnail (auto-generated preview with placeholder photos)
- Paginated loading
- Search by campaign name
- Sort by newest

**US-06: Share Campaign**

> As a creator, I want a nice-looking page for my campaign so participants can find it.

- Public page at `/twibbon/:slug`
- Shows the full frame with area outlines + description
- Basic OG metadata for social shares

---

### Non-Goals

- No social media auto-publish (download only)
- No analytics dashboard
- No real-time collaboration
- No paid tiers / billing (MVP is free)
- No native mobile apps
- No animated/video frames
- No AI auto-fill / face detection

---

## 3. Technical Specifications

### Architecture Overview

```
TanStack Start App (SSR + API)
├── Routes (TanStack Router file-based)
│   ├── / → Landing / Gallery
│   ├── /login → Login
│   ├── /register → Register
│   ├── /dashboard → User's campaigns
│   ├── /create → Create campaign (upload frame + define areas)
│   ├── /edit/:id → Edit campaign
│   └── /twibbon/:slug → Public twibbon editor (fill slots)
├── Auth (Better Auth + HTTP-only cookies)
├── API / Server Functions
│   ├── auth.* → Register, login, logout, reset-password
│   ├── campaigns.* → CRUD, list, lookup
│   └── upload.* → Frame image, slot photos
└── Database (PostgreSQL via Drizzle ORM)
```

### Stack

- **Framework**: TanStack Start (TanStack Router + server functions)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Design system**: shadcn/ui — palet netral dengan aksen biru, font Geist (lihat spec bagian 7)
- **Auth**: Better Auth (email/password + session cookies)
- **ORM**: Drizzle
- **Database**: PostgreSQL
- **Linter/Formatter**: Biome
- **Image processing**: Sharp (composite overlays)
- **File storage**: Local filesystem (MVP) → R2/S3 (future)

### Database Schema

```sql
-- Managed by Better Auth: user, session, account, verification

CREATE TABLE campaigns (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id),
  name            TEXT NOT NULL,
  description     TEXT DEFAULT '',
  frame_path      TEXT NOT NULL,       -- path to the uploaded PNG
  frame_width     INT NOT NULL,         -- original pixel w
  frame_height    INT NOT NULL,         -- original pixel h
  slug            TEXT NOT NULL UNIQUE,
  slot_count      INT NOT NULL DEFAULT 1,
  is_public       BOOLEAN DEFAULT TRUE,
  use_count       INTEGER DEFAULT 0,   -- number of times composite was downloaded
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE frame_slots (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  slot_index    INT NOT NULL,            -- 1-based ordering
  x             REAL NOT NULL,           -- % of frame width (0–100)
  y             REAL NOT NULL,           -- % of frame height (0–100)
  width         REAL NOT NULL,           -- % of frame width
  height        REAL NOT NULL,           -- % of frame height
  label         TEXT DEFAULT '',         -- optional label ("Photo 1", "Left")
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### API / Server Functions

| Function | Auth | Purpose |
|----------|------|---------|
| `auth.register` | No | Register user |
| `auth.login` | No | Login, set session cookie |
| `auth.logout` | Yes | Clear session |
| `auth.forgotPassword` | No | Reset via recovery code |
| `campaigns.listMy` | Yes | User's campaigns |
| `campaigns.listPublic` | No | Public gallery (paginated) |
| `campaigns.getBySlug` | No | Full campaign data (frame info + slots) |
| `campaigns.getById` | Yes | Campaign data for editing |
| `campaigns.create` | Yes | Create campaign (frame + slot definitions) |
| `campaigns.update` | Yes | Update campaign (frame replacement + slot changes) |
| `campaigns.delete` | Yes | Delete campaign + all assets |
| `upload.frame` | Yes | Upload frame image (multipart) |
| `upload.slotPhoto` | No | Upload slot photo (multipart, session-bound) |
| `composite.render` | No | Generate & download final composite |

### Image Processing Pipeline

```
Creator Flow:
  1. Upload PNG frame → Sharp reads dimensions → store frame_path, frame_width, frame_height
  2. Creator draws areas on canvas → data sent as [{x:%, y:%, w:%, h:%}, …] → stored in frame_slots

Participant Flow — Single Photo Mode (default):
  1. Visit /twibbon/:slug → see frame with numbered slot outlines
  2. Upload 1 photo (JPG/PNG, ≤15MB)
  3. Photo stored server-side with session token
  4. Adjust global position/zoom — all slot crops update in sync (client-side transform only)
  5. On download:
     a. Sharp loads the frame image
     b. For each slot: crop source photo to slot rect, resize to slot dimensions, composite at slot position
     c. Layers merged: slot 1 → slot 2 → … → frame on top
     d. Output at requested scale → PNG with alpha

Participant Flow — Multi Photo Mode (toggle):
  1. Toggle "Upload per Slot"
  2. For each slot: upload photo (JPG/PNG, ≤5MB)
  3. Each slot editor: independent drag/zoom controls
  4. On download: same Sharp pipeline, each slot uses its own photo
```

### The Two Canvas Experiences

**Creator canvas (area-mapping tool):**
- Frame image rendered as the canvas background
- Slot rectangles drawn as SVG `<rect>` overlays
- Each rect has 8 drag handles (4 corners, 4 edges) for resizing
- Rect can be dragged by its center handle to reposition
- Blue semi-transparent fill with dashed border on empty slots
- Show area number label (1, 2, 3…) on each rect
- Reorder by drag-and-drop or up/down buttons

**Participant canvas (slot-filling tool):**
- Each slot gets its own editing view
- Participant uploads photo → displayed inside slot boundary
- Within the slot clip area:
  - Drag to pan the photo
  - Scroll/pinch to zoom
  - Photo fills the slot entirely (cover behavior), user adjusts the "crop window"
- Slot editor shows the visible portion + a dimmed overflow indicator
- Full composite preview at the bottom

### File Storage Layout

```
uploads/
├── frames/
│   └── {campaign_id}/
│       └── original.png
├── slots/
│   └── {session_token}/
│       ├── slot_1.jpg
│       ├── slot_2.jpg
│       └── slot_3.jpg
└── composites/
    └── {campaign_id}/
        └── {output_hash}.png   (cached)
```

### Security & Privacy

- Passwords hashed with bcrypt (via Better Auth)
- HTTP-only, Secure, SameSite session cookies
- Slot photos stored with ephemeral session tokens (expire after 1h)
- Uploads validated: file type, size, content-type verification
- Files stored outside public webroot
- Rate limiting on auth endpoints
- SQL injection prevented via Drizzle ORM
- Image processing runs server-side (no client-side composite leaking raw frames)

### Apple Design Integration

| Principle | Application |
|-----------|-------------|
| **Response** | Button feedback on `pointerdown`. Area-resize handles show instantly on hover. |
| **Direct manipulation** | Area rectangles track 1:1 with pointer during drag/resize. Slot photos track 1:1 during pan. |
| **Interruptibility** | Springs for all animated transitions. Drag can be interrupted mid-move. |
| **Spatial consistency** | Area editor and slot editor share the same coordinate model. Enter/exit on same path. |
| **Spring defaults** | Critically damped for UI. Slight bounce on momentum throws. |
| **Rubber-banding** | Area resize handle overshoot at canvas edge. Photo pan overshoot at slot boundary. |
| **Translucency** | Toolbar panels with backdrop-filter blur. |
| **Typography** | System font stack. Size-specific letter-spacing. |

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Slot area = 0x0 | Creator can't save; validation requires min 20×20px |
| Slot extends beyond frame | Clamp to frame boundary on drag (can't drag outside) |
| Single photo mode | 1 upload, applied to all slots; global pan/zoom moves all crops together |
| Multi photo mode | One upload per slot; each slot has independent pan/zoom |
| Frame image replaced after slots defined | Existing slot positions are preserved as percentages; they re-map to new dimensions |
| Participant uploads portrait photo for landscape slot | Photo covers the slot area; user adjusts by zooming out or panning |
| CEO of the fan meeting (2 person) | Define 2 slot areas: [left_half] and [right_half] |
| Family Christmas photo (6 person) | Define 6 slot areas arranged in 2×3 grid |
| Before/after comparison | Define 2 slot areas side by side |

---

## 4. Risks & Roadmap

### Phased Rollout

| Phase | Features |
|-------|----------|
| **MVP (v1.0)** | Auth (register/login/reset), create campaign with area mapping (1–N slots), participant fill & download, public gallery |
| **v1.1** | OG tags / social share, search campaigns, use counter, auto-preview thumbnail, slot labels |
| **v1.2** | Analytics (views, uses per campaign), admin dashboard |
| **v2.0** | Paid tiers (higher resolution, private campaigns, batch processing) |

### Technical Risks

| Risk | Mitigation |
|------|------------|
| **Sharp composite with many layers (10+ slots)** | Stream pipeline; each slot is a separate Sharp overlay operation. Test with 20 layers. |
| **Canvas area-drawer complexity** | Use lightweight canvas library (e.g., Fabric.js) vs. building from scratch. |
| **Slot photo upload UX for many slots** | Participant fills slots one at a time, visual progress indicator per slot. |
| **Area coordinates accuracy across resolutions** | Store as % (0–100), convert to px at render time based on actual image dimensions. |
| **Misaligned slot labels when reordering** | Slot index is the order key; labels update on reorder. |

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Multiple slots per campaign** | Core differentiator vs. existing twibbon tools. Unlocks collaboration/social use cases. |
| **Relative coordinates (%) for slot areas** | Resolution-independent; same slots work at any output scale (1×, 2×, 3×). |
| **Slot photos stored per session** | No auth needed for participants; cleanup via TTL/cron. |
| **Fabric.js for area drawing** | Handles rectangle selection, drag, resize, handles natively. Avoids writing canvas math from scratch. |
| **Apple design** | The core interaction — area definition and photo positioning — is pure direct manipulation. Springs, 1:1 tracking, rubber-banding make it feel physical. |
