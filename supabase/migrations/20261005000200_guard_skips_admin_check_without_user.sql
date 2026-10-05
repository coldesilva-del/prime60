-- With no signed-in user (service role, auth triggers) the guard must not call
-- private.is_admin(): those roles have no usage on the private schema, and
-- a single boolean expression does not guarantee the call is skipped.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    if not (select private.is_admin()) then
      new.is_admin := old.is_admin;
      new.plan := old.plan;
      new.founding_number := old.founding_number;
    end if;
  end if;
  return new;
end;
$$;
