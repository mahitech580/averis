-- =========================================================
-- AVERIS — reference relational schema
-- =========================================================
-- This file is DOCUMENTATION ONLY. The live Averis demo is a
-- 100% static site (HTML/CSS/JS) that runs on GitHub Pages and
-- stores all data in the browser's localStorage — nothing here
-- is executed by the site. This schema simply shows how the
-- same data model would map onto a real relational database if
-- Averis were ever connected to a backend.
-- Target dialect: PostgreSQL (adjust types for other engines).
-- =========================================================

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  org_type        TEXT NOT NULL,        -- Single clinic / Multi-location / Diagnostic center / Hospital network
  plan            TEXT NOT NULL DEFAULT 'Starter', -- Starter / Growth / Enterprise
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'Organization Admin',
                  -- Organization Admin / Doctor / Care Coordinator / Receptionist / Patient
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  full_name       TEXT NOT NULL,
  specialty       TEXT NOT NULL,
  location        TEXT NOT NULL
);

CREATE TABLE patients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_id          TEXT NOT NULL,      -- human-facing code, e.g. AV-20481
  full_name           TEXT NOT NULL,
  age                 INT,
  gender              TEXT,
  provider_id         UUID REFERENCES providers(id),
  care_status         TEXT NOT NULL DEFAULT 'Active', -- Active / Stable / Needs Attention / Critical
  risk_level          TEXT NOT NULL DEFAULT 'Low',    -- Low / Medium / High
  attendance_rate     NUMERIC(5,2),
  prior_cancellations INT DEFAULT 0,
  last_visit          DATE,
  archived            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES providers(id),
  department      TEXT NOT NULL,
  appt_date       DATE NOT NULL,
  appt_time       TIME NOT NULL,
  duration_min    INT NOT NULL DEFAULT 30,
  appt_type       TEXT NOT NULL,   -- Check-up / Follow-up / Consultation / Procedure / Screening / Telehealth
  status          TEXT NOT NULL DEFAULT 'Scheduled',
                  -- Scheduled / Confirmed / Checked In / In Progress / Completed / Cancelled / No Show
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, appt_date, appt_time)   -- enforces no double-booking per provider
);

CREATE TABLE care_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id     UUID REFERENCES providers(id),
  title           TEXT NOT NULL,
  start_date      DATE NOT NULL,
  review_date     DATE,
  progress_pct    INT NOT NULL DEFAULT 0
);

CREATE TABLE care_plan_goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id    UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  goal            TEXT NOT NULL,
  is_complete     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE care_hub_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  issue           TEXT NOT NULL,
  stage           TEXT NOT NULL DEFAULT 'New', -- New / Assigned / In Progress / Waiting / Resolved
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  patient_id      UUID REFERENCES patients(id),
  assigned_user_id UUID REFERENCES users(id),
  priority        TEXT NOT NULL DEFAULT 'Medium', -- Low / Medium / High / Urgent
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'To Do'   -- To Do / In Progress / Completed
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  sender_user_id  UUID NOT NULL REFERENCES users(id),
  body            TEXT NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  is_unread       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes for the queries the dashboard runs most:
CREATE INDEX idx_appt_org_date ON appointments (organization_id, appt_date);
CREATE INDEX idx_appt_provider_date ON appointments (provider_id, appt_date);
CREATE INDEX idx_patients_org_status ON patients (organization_id, care_status);
CREATE INDEX idx_tasks_org_status ON tasks (organization_id, status);
