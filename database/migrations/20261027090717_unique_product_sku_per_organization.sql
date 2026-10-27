-- Enforce case-insensitive product SKU uniqueness within an organization.
-- Verified before applying: no duplicate non-empty organization/SKU pairs existed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_erp_org_product_sku
ON public.erp_business_records (
  organization_id,
  upper(btrim(payload ->> 'sku'))
)
WHERE collection = 'products'
  AND NULLIF(btrim(payload ->> 'sku'), '') IS NOT NULL;
