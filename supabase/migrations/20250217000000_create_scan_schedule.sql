-- Scan schedule table: sessions with time_in and time_out for scanning.
-- Sessions must not overlap (enforced by trigger).

create table if not exists public.scan_schedule (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  time_in time not null,
  time_out time not null,
  created_at timestamptz default now(),
  constraint time_out_after_time_in check (time_out > time_in)
);

-- Prevent overlapping sessions (same day / same schedule scope).
create or replace function check_scan_schedule_no_overlap()
returns trigger as $$
begin
  if exists (
    select 1 from public.scan_schedule s
    where s.id is distinct from new.id
      and (s.time_in, s.time_out) overlaps (new.time_in, new.time_out)
  ) then
    raise exception 'This session overlaps with an existing session. Please choose different times.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_scan_schedule_no_overlap on public.scan_schedule;
create trigger trigger_scan_schedule_no_overlap
  before insert or update on public.scan_schedule
  for each row execute function check_scan_schedule_no_overlap();

comment on table public.scan_schedule is 'Scanning sessions with time in and time out; times must not overlap';

-- RLS: allow authenticated users to select, insert, update, delete.
alter table public.scan_schedule enable row level security;

create policy "Authenticated users can select scan_schedule"
  on public.scan_schedule for select
  to authenticated
  using (true);

create policy "Authenticated users can insert scan_schedule"
  on public.scan_schedule for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update scan_schedule"
  on public.scan_schedule for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete scan_schedule"
  on public.scan_schedule for delete
  to authenticated
  using (true);
