-- 20261025075525: indexes on the remaining foreign keys.
CREATE INDEX IF NOT EXISTS ix_workspace_snapshots_updated_by
  ON public.workspace_snapshots (updated_by);
CREATE INDEX IF NOT EXISTS ix_server_audit_events_actor_id
  ON public.server_audit_events (actor_id);
CREATE INDEX IF NOT EXISTS ix_erp_business_records_created_by
  ON public.erp_business_records (created_by);
CREATE INDEX IF NOT EXISTS ix_erp_business_records_updated_by
  ON public.erp_business_records (updated_by);
