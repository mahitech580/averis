-- =========================================================
-- AVERIS BY MAHI — reference production data model
-- PostgreSQL-style schema for a future authenticated backend.
-- The GitHub Pages build does not execute this file.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('owner','administrator','clinician','coordinator','scheduler','billing','pharmacy','laboratory','viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE patient_status AS ENUM ('active','stable','needs_attention','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE risk_level AS ENUM ('low','medium','high'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE appointment_status AS ENUM ('scheduled','confirmed','checked_in','completed','cancelled','no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_status AS ENUM ('todo','in_progress','blocked','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE priority_level AS ENUM ('low','normal','high','urgent','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE bed_status AS ENUM ('available','occupied','cleaning','isolation','maintenance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft','pending','paid','review','overdue','void'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_level AS ENUM ('info','warning','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug citext NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email citext NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,email)
);

CREATE TABLE providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  specialty text NOT NULL,
  department text NOT NULL,
  daily_capacity integer NOT NULL DEFAULT 12 CHECK (daily_capacity > 0),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  full_name text NOT NULL,
  date_of_birth date,
  gender text,
  department text,
  primary_provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,
  status patient_status NOT NULL DEFAULT 'active',
  risk risk_level NOT NULL DEFAULT 'low',
  condition_summary text,
  last_visit_at timestamptz,
  next_visit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,external_id)
);

CREATE TABLE encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  encounter_type text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  summary text
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  appointment_type text NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE care_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  issue text NOT NULL,
  stage text NOT NULL DEFAULT 'new',
  priority priority_level NOT NULL DEFAULT 'normal',
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  priority priority_level NOT NULL DEFAULT 'normal',
  status task_status NOT NULL DEFAULT 'todo',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  ward text NOT NULL,
  bed_code text NOT NULL,
  status bed_status NOT NULL DEFAULT 'available',
  current_patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id,bed_code)
);

CREATE TABLE pharmacy_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  category text,
  unit text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level numeric(12,2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  ordered_by uuid REFERENCES users(id) ON DELETE SET NULL,
  test_name text NOT NULL,
  priority priority_level NOT NULL DEFAULT 'normal',
  ordered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ordered'
);

CREATE TABLE lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  result_summary text NOT NULL,
  critical boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resulted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  payer text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  status invoice_status NOT NULL DEFAULT 'pending',
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation_members (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id,user_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  level event_level NOT NULL DEFAULT 'info',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE system_events (
  id bigserial PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  level event_level NOT NULL DEFAULT 'info',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id bigserial PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_org_status ON patients(organization_id,status,risk);
CREATE INDEX idx_patients_provider ON patients(primary_provider_id);
CREATE INDEX idx_appointments_start ON appointments(starts_at,status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id,starts_at);
CREATE INDEX idx_care_items_queue ON care_items(stage,priority,updated_at);
CREATE INDEX idx_tasks_queue ON tasks(status,priority,due_at);
CREATE INDEX idx_beds_status ON beds(status,ward);
CREATE INDEX idx_lab_results_review ON lab_results(critical,acknowledged_at,resulted_at);
CREATE INDEX idx_invoices_status ON invoices(status,issued_at);
CREATE INDEX idx_messages_conversation ON messages(conversation_id,sent_at);
CREATE INDEX idx_events_time ON system_events(occurred_at DESC);
CREATE INDEX idx_audit_time ON audit_events(created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patients_updated_at ON patients;
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS care_items_updated_at ON care_items;
CREATE TRIGGER care_items_updated_at BEFORE UPDATE ON care_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS beds_updated_at ON beds;
CREATE TRIGGER beds_updated_at BEFORE UPDATE ON beds
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS inventory_updated_at ON pharmacy_inventory;
CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON pharmacy_inventory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW current_operational_picture AS
SELECT
  (SELECT count(*) FROM patients WHERE status <> 'archived') AS active_patients,
  (SELECT count(*) FROM appointments WHERE starts_at::date = current_date) AS appointments_today,
  (SELECT count(*) FROM beds WHERE status IN ('occupied','isolation')) AS occupied_beds,
  (SELECT count(*) FROM beds WHERE status = 'available') AS available_beds,
  (SELECT count(*) FROM tasks WHERE status <> 'completed') AS open_tasks,
  (SELECT count(*) FROM care_items WHERE stage <> 'resolved' AND priority IN ('urgent','critical')) AS urgent_care_items,
  (SELECT count(*) FROM lab_results WHERE critical = true AND acknowledged_at IS NULL) AS unacknowledged_critical_results;
