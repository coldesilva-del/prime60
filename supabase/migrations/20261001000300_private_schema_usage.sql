-- Signed-in users execute private helper functions indirectly (triggers and
-- RLS policies call private.is_admin() and private.set_updated_at()), which
-- requires USAGE on the schema. Execute privileges on sensitive functions
-- (claim_founding_number) remain revoked, and anon still has no access.
grant usage on schema private to authenticated;
