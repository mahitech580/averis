-- =========================================================
-- AVERIS — production-oriented healthcare operations schema
-- PostgreSQL 16+
-- =========================================================
-- Reference architecture only. The current GitHub Pages client
-- does not execute this file. It documents the persistence model
-- for a future authenticated backend with auditability and
-- real-time event delivery.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM (
  'organization_admin','clinical_admin','doctor','nurse',
  'care_coordinator','receptionist','pharmacist','lab_technician',
  'operations','analyst','patient'
);

CREATE TYPE patient_status AS ENUM ('active','stable','needs_attention','critical','archived');
CREATE TYPE risk_level AS ENUM ('low','medium','high');
CREATE TYPE appointment_status AS ENUM (
  'scheduled','confirmed','checked_in','in_progress',
  'completed','cancelled','no_show'
);
CREATE TYPE task_status AS ENUM ('todo','in_progress','blocked','completed');
CREATE TYPE priority_level AS ENUM ('low','medium','high','urgent');
CREATE TYPE care_stage AS ENUM ('new','assigned','in_progress','waiting','resolved');
CREATE TYPE bed_status AS ENUM ('available','occupied','cleaning','reserved','isolation','maintenance');
CREATE TYPE event_type AS ENUM (
  'patient_created','appointment_created','appointment_updated',
  'appointment_checked_in','appointment_completed','appointment_cancelled',
  'care_item_created','care_item_updated','task_created','task_updated',
  'lab_result_posted','lab_result_critical','medication_updated',
  'bed_status_changed','message_sent','notification_created','system_health'
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  organization_type TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  plan TEXT NOT NULL DEFAULT 'enterprise',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address_line1 TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'IN',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(organization_id, code)
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  specialty TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(organization_id, code)
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email CITEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  specialty TEXT NOT NULL,
  license_reference TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  capacity_per_day INT NOT NULL DEFAULT 12 CHECK (capacity_per_day > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  medical_record_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  phone TEXT,
  email CITEXT,
  address TEXT,
  primary_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  primary_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status patient_status NOT NULL DEFAULT 'active',
  risk_level risk_level NOT NULL DEFAULT 'low',
  attendance_rate NUMERIC(5,2) CHECK (attendance_rate BETWEEN 0 AND 100),
  prior_cancellations INT NOT NULL DEFAULT 0 CHECK (prior_cancellations >= 0),
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  UNIQUE(organization_id, medical_record_number)
);

CREATE TABLE encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  encounter_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  disposition TEXT,
  notes TEXT
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  appointment_type TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  confirmation_state TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  UNIQUE(provider_id, starts_at)
);

CREATE TABLE care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  diagnosis_context TEXT,
  progress_pct INT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  start_date DATE NOT NULL,
  review_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE care_plan_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  target_date DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

CREATE TABLE care_hub_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  care_plan_id UUID REFERENCES care_plans(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  issue TEXT NOT NULL,
  stage care_stage NOT NULL DEFAULT 'new',
  priority priority_level NOT NULL DEFAULT 'medium',
  due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority priority_level NOT NULL DEFAULT 'medium',
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  unit_name TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  status bed_status NOT NULL DEFAULT 'available',
  isolation_type TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(location_id, bed_number)
);

CREATE TABLE bed_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  admitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  discharged_at TIMESTAMPTZ,
  CHECK (discharged_at IS NULL OR discharged_at > admitted_at)
);

CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generic_name TEXT NOT NULL,
  strength TEXT,
  form TEXT,
  sku TEXT,
  reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE medication_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(medication_id, location_id)
);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
  dosage TEXT NOT NULL,
  route TEXT,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'ordered',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_at TIMESTAMPTZ,
  resulted_at TIMESTAMPTZ
);

CREATE TABLE lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  analyte TEXT NOT NULL,
  value_text TEXT NOT NULL,
  numeric_value NUMERIC,
  unit TEXT,
  reference_range TEXT,
  interpretation TEXT,
  critical BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity priority_level NOT NULL DEFAULT 'medium',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE system_events (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  request_id UUID,
  ip_hash TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  connection_type TEXT NOT NULL,
  external_tenant_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations','users','patients','appointments','care_plans',
    'care_hub_items','tasks'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t,t
    );
  END LOOP;
END $$;

CREATE INDEX idx_patients_org_status ON patients(organization_id,status,risk_level);
CREATE INDEX idx_patients_provider ON patients(primary_provider_id);
CREATE INDEX idx_appointments_org_start ON appointments(organization_id,starts_at);
CREATE INDEX idx_appointments_provider_start ON appointments(provider_id,starts_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id,starts_at);
CREATE INDEX idx_care_queue ON care_hub_items(organization_id,stage,priority,due_at);
CREATE INDEX idx_tasks_queue ON tasks(organization_id,status,priority,due_at);
CREATE INDEX idx_beds_status ON beds(organization_id,status,department_id);
CREATE INDEX idx_bed_assignments_active ON bed_assignments(bed_id) WHERE discharged_at IS NULL;
CREATE INDEX idx_lab_orders_status ON lab_orders(organization_id,status,ordered_at);
CREATE INDEX idx_lab_results_critical ON lab_results(critical,reviewed_at) WHERE critical = TRUE;
CREATE INDEX idx_notifications_unread ON notifications(user_id,created_at) WHERE read_at IS NULL;
CREATE INDEX idx_system_events_live ON system_events(organization_id,occurred_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type,entity_id,occurred_at DESC);
CREATE INDEX idx_audit_log_org_time ON audit_log(organization_id,occurred_at DESC);

-- Real-time feed consumers can query recent events efficiently:
CREATE OR REPLACE VIEW recent_operations AS
SELECT id,event_type,entity_type,entity_id,payload,occurred_at
FROM system_events
ORDER BY occurred_at DESC
LIMIT 500;
