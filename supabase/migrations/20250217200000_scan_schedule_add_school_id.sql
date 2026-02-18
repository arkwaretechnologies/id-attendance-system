-- Add school_id to scan_schedule so schedules are per-school.
-- Overlap check: only prevent overlap within the same school.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scan_schedule' and column_name = 'school_id'
  ) then
    alter table public.scan_schedule
      add column school_id integer references public.school(school_id) on delete cascade;
  end if;
end $$;

comment on column public.scan_schedule.school_id is 'School this schedule belongs to; null = global/app-wide';

-- Recreate overlap function to scope by school_id (same school cannot have overlapping sessions).
create or replace function check_scan_schedule_no_overlap()
returns trigger as $$
begin
  if exists (
    select 1 from public.scan_schedule s
    where s.id is distinct from new.id
      and (s.time_in, s.time_out) overlaps (new.time_in, new.time_out)
      and (
        (new.school_id is null and s.school_id is null)
        or (new.school_id is not null and s.school_id is not null and s.school_id = new.school_id)
      )
  ) then
    raise exception 'This session overlaps with an existing session for this school. Please choose different times.';
  end if;
  return new;
end;
$$ language plpgsql;
