-- The profile guard reverted plan and founding_number for every non-admin
-- caller, including the email-verification trigger and the service role, so
-- founding numbers were claimed from the counter but never written to the
-- profile. Only signed-in end users (auth.uid() present) are restricted now.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not (select private.is_admin()) then
    new.is_admin := old.is_admin;
    new.plan := old.plan;
    new.founding_number := old.founding_number;
  end if;
  return new;
end;
$$;
