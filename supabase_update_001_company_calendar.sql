create extension if not exists pgcrypto;
create table if not exists public.company_calendar_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Montage',
  title text not null,
  start_date date not null,
  end_date date not null,
  project_number text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_calendar_valid_dates check (end_date >= start_date)
);
create or replace function public.set_company_calendar_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists trg_company_calendar_updated_at on public.company_calendar_entries;
create trigger trg_company_calendar_updated_at before update on public.company_calendar_entries for each row execute function public.set_company_calendar_updated_at();
alter table public.company_calendar_entries enable row level security;
drop policy if exists "public read company calendar" on public.company_calendar_entries;
drop policy if exists "public insert company calendar" on public.company_calendar_entries;
drop policy if exists "public update company calendar" on public.company_calendar_entries;
drop policy if exists "public delete company calendar" on public.company_calendar_entries;
create policy "public read company calendar" on public.company_calendar_entries for select to anon, authenticated using (true);
create policy "public insert company calendar" on public.company_calendar_entries for insert to anon, authenticated with check (true);
create policy "public update company calendar" on public.company_calendar_entries for update to anon, authenticated using (true) with check (true);
create policy "public delete company calendar" on public.company_calendar_entries for delete to anon, authenticated using (true);
alter publication supabase_realtime add table public.company_calendar_entries;
