-- Set security_invoker=true on public views missing it to satisfy linter rule 0010 (Security Definer View)
-- This ensures views execute with the querying user's permissions and underlying RLS is enforced.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
      AND (
        c.reloptions IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(c.reloptions) o WHERE o = 'security_invoker=true'
        )
      )
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker=true);', r.schema_name, r.view_name);
  END LOOP;
END $$;

-- Optional: Document the change for the key view if present
COMMENT ON VIEW public.products_catalog IS 'Public product catalog view (security_invoker=true) to enforce RLS of querying user';