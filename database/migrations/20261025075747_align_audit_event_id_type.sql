-- 20261025075747: align SQLAlchemy Integer primary-key type.
ALTER TABLE public.server_audit_events ALTER COLUMN id TYPE INTEGER;
