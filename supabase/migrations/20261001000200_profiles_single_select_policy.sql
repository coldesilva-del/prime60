-- Merge the two permissive SELECT policies on profiles into one (advisor 0006).
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
