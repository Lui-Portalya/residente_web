CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'resident')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE residences (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL DEFAULT '',
  monthly_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (monthly_fee_cents >= 0),
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE residence_residents (
  residence_id INTEGER NOT NULL REFERENCES residences(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  is_primary INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (residence_id, user_id)
);
CREATE INDEX idx_rr_user ON residence_residents(user_id);

CREATE TABLE common_areas (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 0,
  open_time TEXT NOT NULL DEFAULT '08:00',
  close_time TEXT NOT NULL DEFAULT '22:00',
  slot_minutes INTEGER NOT NULL DEFAULT 60 CHECK (slot_minutes > 0),
  fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  active INTEGER NOT NULL DEFAULT 1
);

-- start_at / end_at are community-local naive datetimes: YYYY-MM-DDTHH:mm
CREATE TABLE reservations (
  id INTEGER PRIMARY KEY,
  common_area_id INTEGER NOT NULL REFERENCES common_areas(id),
  residence_id INTEGER NOT NULL REFERENCES residences(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (end_at > start_at)
);
CREATE INDEX idx_res_area_start ON reservations(common_area_id, start_at);
CREATE INDEX idx_res_residence ON reservations(residence_id, start_at);

CREATE TABLE charges (
  id INTEGER PRIMARY KEY,
  residence_id INTEGER NOT NULL REFERENCES residences(id),
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'common_area')),
  period TEXT,
  reservation_id INTEGER REFERENCES reservations(id),
  description TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'void')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX uq_charge_maintenance ON charges(residence_id, period) WHERE type = 'maintenance';
CREATE UNIQUE INDEX uq_charge_reservation ON charges(reservation_id) WHERE reservation_id IS NOT NULL;
CREATE INDEX idx_charge_residence ON charges(residence_id, status);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  charge_id INTEGER NOT NULL REFERENCES charges(id),
  residence_id INTEGER NOT NULL REFERENCES residences(id),
  registered_by INTEGER NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  method TEXT NOT NULL CHECK (method IN ('cash', 'transfer', 'card', 'other')),
  reference TEXT NOT NULL DEFAULT '',
  paid_at TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pay_residence ON payments(residence_id, paid_at);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE login_attempts (
  key TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX idx_login_attempts ON login_attempts(key, at);
