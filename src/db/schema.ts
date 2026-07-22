import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  // Diisi server tepat setelah pendaftaran. Nullable karena Better Auth
  // membuat baris user lebih dulu, baru kita tempelkan hash-nya.
  recoveryCodeHash: text('recovery_code_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const campaigns = pgTable(
  'campaigns',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').default('').notNull(),
    // Satu URL kanonik per campaign. Unique-nya ditegakkan database, bukan
    // hanya oleh pemeriksaan di aplikasi — dua permintaan bersamaan dengan
    // nama sama akan lolos pemeriksaan itu.
    slug: text('slug').notNull().unique(),
    // Relatif terhadap direktori upload, mis. `frames/<id>/a1b2c3d4.png`.
    framePath: text('frame_path').notNull(),
    // Piksel asli, dibaca Sharp. Jadi acuan saat koordinat persen
    // diterjemahkan kembali ke piksel di berkas hasil.
    frameWidth: integer('frame_width').notNull(),
    frameHeight: integer('frame_height').notNull(),
    isPublic: boolean('is_public').default(true).notNull(),
    useCount: integer('use_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('campaigns_user_id_idx').on(table.userId)],
)

export const frameSlots = pgTable(
  'frame_slots',
  {
    id: text('id').primaryKey(),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    slotIndex: integer('slot_index').notNull(),
    // Persen 0–100 dari dimensi frame — bebas resolusi, sehingga slot yang
    // sama bekerja pada keluaran 1x, 2x, maupun 3x (spec 5.3).
    x: real('x').notNull(),
    y: real('y').notNull(),
    width: real('width').notNull(),
    height: real('height').notNull(),
    label: text('label').default('').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('frame_slots_campaign_id_idx').on(table.campaignId),
    // Nomor slot adalah kunci urutan yang dilihat partisipan. Dua baris
    // dengan nomor sama membuat urutannya bergantung pada kebetulan.
    unique('frame_slots_campaign_slot_unique').on(table.campaignId, table.slotIndex),
  ],
)

export const rateLimit = pgTable('rate_limit', {
  key: text('key').primaryKey(),
  // Dipakai pembatas milik kita: penghitung atomik per jendela.
  count: integer('count').default(0).notNull(),
  windowStart: timestamp('window_start').defaultNow().notNull(),
  // Dipakai Better Auth lewat customStorage. Isinya opaque — kita menyimpan
  // dan mengembalikannya apa adanya, tidak pernah menafsirkannya, supaya
  // perubahan bentuk internal Better Auth tidak merembet ke skema kita.
  value: text('value'),
})
