-- 20261025075826: explicit deny policies for direct client roles.
-- FastAPI uses the server-side database connection and tenant-scopes each request.
-- Do not grant anon/authenticated roles direct access to this private business data.
CREATE POLICY deny_public_api_access ON public.organizations
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_public_api_access ON public.users
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_public_api_access ON public.auth_sessions
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_public_api_access ON public.workspace_snapshots
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_public_api_access ON public.server_audit_events
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_public_api_access ON public.erp_business_records
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
