-- Fix infinite recursion in user_roles RLS policies.
-- Any policy that checks "is admin?" by selecting from user_roles causes recursion.
-- Solution: SECURITY DEFINER function (runs as owner, bypasses RLS) + drop ALL policies, recreate safe ones.

-- 1. Create helper. Must be SECURITY DEFINER so the inner SELECT bypasses RLS.
--    Owner of this function must bypass RLS (e.g. postgres); then the SELECT inside does not trigger policies.
create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  );
$$;

-- Grant execute so anon/authenticated can use it in policy expressions
grant execute on function public.current_user_is_admin() to anon;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_is_admin() to service_role;

-- 2. Drop every policy on user_roles (by name from pg_policies) so none with recursive checks remain
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'user_roles'
  loop
    execute format('drop policy if exists %I on public.user_roles', pol.policyname);
  end loop;
end $$;

-- 3. Recreate only safe policies

-- Users can see their own row (no subquery on user_roles)
create policy "Users can view their own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Admins can do everything (uses function; function bypasses RLS)
create policy "Admins can view all roles"
  on public.user_roles for select
  using (public.current_user_is_admin());

create policy "Admins can insert roles"
  on public.user_roles for insert
  with check (public.current_user_is_admin());

create policy "Admins can update roles"
  on public.user_roles for update
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can delete roles"
  on public.user_roles for delete
  using (public.current_user_is_admin());
