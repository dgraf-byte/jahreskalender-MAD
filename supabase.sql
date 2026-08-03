-- Maderegger Planer V2 – im Supabase SQL Editor vollständig ausführen
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('admin','editor','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_number text not null unique,
  title text not null,
  customer text,
  location text,
  manager text,
  contact_name text,
  phone text,
  status text not null default 'Aktiv' check (status in ('Aktiv','In Planung','Abgeschlossen','Storniert')),
  project_link text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planner_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null check (category in ('Montage','Lieferung','Inbetriebnahme','Abnahme','Service','Konstruktion','Produktion','Sonstiges')),
  status text not null default 'Geplant' check (status in ('Geplant','Bestätigt','Erledigt','Verschoben')),
  start_date date not null,
  end_date date not null,
  responsible text,
  team text,
  time_note text,
  priority text not null default 'Normal' check (priority in ('Niedrig','Normal','Hoch')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_entries_valid_range check (end_date >= start_date)
);

create index if not exists planner_entries_dates_idx on public.planner_entries(start_date,end_date);
create index if not exists planner_entries_project_idx on public.planner_entries(project_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.planner_entries enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,role)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.email),'viewer')
  on conflict(id) do nothing;
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid();
$$;

create or replace function public.set_audit_fields()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.updated_at=now();
  if tg_op='INSERT' then new.created_by=auth.uid(); end if;
  return new;
end;$$;

drop trigger if exists projects_audit on public.projects;
create trigger projects_audit before insert or update on public.projects
for each row execute procedure public.set_audit_fields();
drop trigger if exists planner_entries_audit on public.planner_entries;
create trigger planner_entries_audit before insert or update on public.planner_entries
for each row execute procedure public.set_audit_fields();

-- Policies wiederholbar anlegen
drop policy if exists "profiles_read" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
drop policy if exists "projects_read" on public.projects;
drop policy if exists "projects_insert" on public.projects;
drop policy if exists "projects_update" on public.projects;
drop policy if exists "projects_delete" on public.projects;
drop policy if exists "entries_read" on public.planner_entries;
drop policy if exists "entries_insert" on public.planner_entries;
drop policy if exists "entries_update" on public.planner_entries;
drop policy if exists "entries_delete" on public.planner_entries;

create policy "profiles_read" on public.profiles for select to authenticated using (true);
create policy "profiles_admin_update" on public.profiles for update to authenticated
using (public.current_user_role()='admin') with check (public.current_user_role()='admin');

create policy "projects_read" on public.projects for select to authenticated using (true);
create policy "projects_insert" on public.projects for insert to authenticated with check (public.current_user_role() in ('admin','editor'));
create policy "projects_update" on public.projects for update to authenticated using (public.current_user_role() in ('admin','editor')) with check (public.current_user_role() in ('admin','editor'));
create policy "projects_delete" on public.projects for delete to authenticated using (public.current_user_role()='admin');

create policy "entries_read" on public.planner_entries for select to authenticated using (true);
create policy "entries_insert" on public.planner_entries for insert to authenticated with check (public.current_user_role() in ('admin','editor'));
create policy "entries_update" on public.planner_entries for update to authenticated using (public.current_user_role() in ('admin','editor')) with check (public.current_user_role() in ('admin','editor'));
create policy "entries_delete" on public.planner_entries for delete to authenticated using (public.current_user_role() in ('admin','editor'));

-- Realtime aktivieren (Fehler vermeiden, falls Tabellen schon enthalten sind)
do $$ begin
  alter publication supabase_realtime add table public.projects;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.planner_entries;
exception when duplicate_object then null; end $$;

-- Bereits vorhandene Benutzer nachträglich in profiles übernehmen
insert into public.profiles(id,full_name,role)
select id,coalesce(raw_user_meta_data->>'full_name',email),'viewer' from auth.users
on conflict(id) do nothing;
