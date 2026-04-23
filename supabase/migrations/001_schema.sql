-- ═══════════════════════════════════════════════════════════════
--  Oncowellness CRM — Schema inicial
--  Ejecutar en Supabase SQL Editor o via CLI: supabase db push
-- ═══════════════════════════════════════════════════════════════

-- ── Extensiones ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Clínicas (multi-tenancy) ──────────────────────────────────────────────────
CREATE TABLE clinics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Perfiles de usuario ───────────────────────────────────────────────────────
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  clinic_id   UUID REFERENCES clinics ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'clinician'
                CHECK (role IN ('admin', 'clinician', 'reader')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Programas ─────────────────────────────────────────────────────────────────
CREATE TABLE programs (
  code        TEXT NOT NULL,
  clinic_id   UUID REFERENCES clinics ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('FX','PS','NU','EO','TS')),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sessions    INTEGER,
  duration    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (code, clinic_id)
);

-- ── Bundles / Packs ───────────────────────────────────────────────────────────
CREATE TABLE bundles (
  code        TEXT NOT NULL,
  clinic_id   UUID REFERENCES clinics ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phase       TEXT NOT NULL CHECK (phase IN ('F1','F2','F3','F4','F5','F6','F7','F8')),
  description TEXT NOT NULL DEFAULT '',
  programs    TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (code, clinic_id)
);

-- ── Pacientes ─────────────────────────────────────────────────────────────────
CREATE TABLE patients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id           UUID NOT NULL REFERENCES clinics ON DELETE CASCADE,
  -- Datos personales
  name                TEXT NOT NULL,
  age                 INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  gender              TEXT NOT NULL CHECK (gender IN ('M','F')),
  email               TEXT,
  phone               TEXT,
  -- Datos clínicos
  diagnosis           TEXT NOT NULL DEFAULT '',
  cancer_type         TEXT NOT NULL DEFAULT '',
  stage               TEXT NOT NULL DEFAULT '',
  oncologist          TEXT NOT NULL DEFAULT '',
  diagnosis_date      DATE,
  -- Journey
  current_phase       TEXT NOT NULL DEFAULT 'F1'
                        CHECK (current_phase IN ('F1','F2','F3','F4','F5','F6','F7','F8')),
  mind_state          TEXT NOT NULL DEFAULT 'Activo'
                        CHECK (mind_state IN ('Activo','Ansioso','Depresivo','Resiliente','Vulnerable')),
  alert_status        TEXT NOT NULL DEFAULT 'verde'
                        CHECK (alert_status IN ('verde','amarillo','rojo')),
  -- Programas y bundles asignados
  assigned_programs   TEXT[] NOT NULL DEFAULT '{}',
  assigned_bundles    TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX patients_clinic_id_idx ON patients (clinic_id);
CREATE INDEX patients_alert_status_idx ON patients (clinic_id, alert_status);

-- ── Trigger: updated_at automático ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Mediciones funcionales ────────────────────────────────────────────────────
CREATE TABLE handgrip_measurements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date              DATE NOT NULL,
  dominant_hand     NUMERIC(5,1) NOT NULL CHECK (dominant_hand >= 0),
  non_dominant_hand NUMERIC(5,1) NOT NULL CHECK (non_dominant_hand >= 0),
  is_baseline       BOOLEAN,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX handgrip_patient_idx ON handgrip_measurements (patient_id, date);

CREATE TABLE six_mwt_measurements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date            DATE NOT NULL,
  distance_meters INTEGER NOT NULL CHECK (distance_meters >= 0),
  heart_rate_peak INTEGER CHECK (heart_rate_peak >= 0),
  fatigue         NUMERIC(3,1) CHECK (fatigue >= 0 AND fatigue <= 10),
  is_baseline     BOOLEAN,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX six_mwt_patient_idx ON six_mwt_measurements (patient_id, date);

CREATE TABLE thirty_sts_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date        DATE NOT NULL,
  reps        INTEGER NOT NULL CHECK (reps >= 0),
  is_baseline BOOLEAN,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX thirty_sts_patient_idx ON thirty_sts_measurements (patient_id, date);

CREATE TABLE tug_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date        DATE NOT NULL,
  seconds     NUMERIC(5,2) NOT NULL CHECK (seconds >= 0),
  is_baseline BOOLEAN,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX tug_patient_idx ON tug_measurements (patient_id, date);

CREATE TABLE transverso_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date        DATE NOT NULL,
  score       SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 3),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX transverso_patient_idx ON transverso_measurements (patient_id, date);

CREATE TABLE balance_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date        DATE NOT NULL,
  seconds     NUMERIC(5,2) NOT NULL CHECK (seconds >= 0),
  test_type   TEXT NOT NULL CHECK (test_type IN ('monopodal','romberg')),
  is_baseline BOOLEAN,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX balance_patient_idx ON balance_measurements (patient_id, date);

-- ── Evaluaciones psicológicas ─────────────────────────────────────────────────
CREATE TABLE phq9_assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date        DATE NOT NULL,
  answers     SMALLINT[] NOT NULL,
  total_score SMALLINT NOT NULL CHECK (total_score BETWEEN 0 AND 27),
  severity    TEXT NOT NULL CHECK (severity IN ('minimal','mild','moderate','moderately_severe','severe')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX phq9_patient_idx ON phq9_assessments (patient_id, date);

CREATE TABLE gad7_assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date        DATE NOT NULL,
  answers     SMALLINT[] NOT NULL,
  total_score SMALLINT NOT NULL CHECK (total_score BETWEEN 0 AND 21),
  severity    TEXT NOT NULL CHECK (severity IN ('minimal','mild','moderate','severe')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE facitf_assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date        DATE NOT NULL,
  answers     SMALLINT[] NOT NULL,
  total_score SMALLINT NOT NULL CHECK (total_score BETWEEN 0 AND 52),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE eortc_assessments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date                DATE NOT NULL,
  global_health       SMALLINT NOT NULL CHECK (global_health BETWEEN 0 AND 100),
  physical_function   SMALLINT NOT NULL,
  role_function       SMALLINT NOT NULL,
  emotional_function  SMALLINT NOT NULL,
  cognitive_function  SMALLINT NOT NULL,
  social_function     SMALLINT NOT NULL,
  fatigue             SMALLINT NOT NULL,
  nausea              SMALLINT NOT NULL,
  pain                SMALLINT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Sesiones / Citas ──────────────────────────────────────────────────────────
CREATE TABLE sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  program_code TEXT NOT NULL,
  date         DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('pendiente','confirmada','realizada','cancelada')),
  notes        TEXT,
  therapist    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX sessions_patient_idx ON sessions (patient_id, date);
CREATE INDEX sessions_date_idx ON sessions (patient_id, date, status);

-- ── Órdenes de crisis ─────────────────────────────────────────────────────────
CREATE TABLE crisis_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date        DATE NOT NULL,
  trigger_desc TEXT NOT NULL,
  program     TEXT NOT NULL DEFAULT 'PS-01',
  status      TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (status IN ('pendiente','atendida')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX crisis_orders_patient_idx ON crisis_orders (patient_id, status);

-- ── Notas clínicas ────────────────────────────────────────────────────────────
CREATE TABLE clinical_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  date       DATE NOT NULL,
  author     TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('evolucion','interconsulta','incidencia')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX clinical_notes_patient_idx ON clinical_notes (patient_id, date DESC);

-- ── Contenido enviado al paciente ─────────────────────────────────────────────
CREATE TABLE patient_content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients ON DELETE CASCADE,
  code        TEXT NOT NULL,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,
  enabled     BOOLEAN DEFAULT TRUE,
  sent_date   DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id, code)
);

-- ── Audit log ─────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users,
  clinic_id   UUID REFERENCES clinics,
  action      TEXT NOT NULL,          -- 'INSERT' | 'UPDATE' | 'DELETE'
  table_name  TEXT NOT NULL,
  record_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX audit_log_clinic_idx ON audit_log (clinic_id, created_at DESC);
