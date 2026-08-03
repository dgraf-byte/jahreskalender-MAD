-- Im Supabase SQL Editor vollständig ausführen.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('admin','editor','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  project_number text not null,
  project_title text not null,
  category text not null check (category in ('Montage','Lieferung','Inbetriebnahme','Abnahme','Service','Sonstiges')),
  status text not null default 'Geplant' check (status in ('Geplant','Bestätigt','Erledigt','Verschoben')),
  start_date date not null,
  end_date date not null,
  customer text,
  location text,
  responsible text,
  team text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_date_range check (end_date >= start_date)
);

alter table public.profiles enable row level security;
alter table public.calendar_entries enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'viewer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "authenticated users can view profiles"
on public.profiles for select to authenticated using (true);

create policy "admins can update profiles"
on public.profiles for update to authenticated
using ((select role from public.profiles where id = auth.uid()) = 'admin')
with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "authenticated users can view entries"
on public.calendar_entries for select to authenticated using (true);

create policy "editors can insert entries"
on public.calendar_entries for insert to authenticated
with check ((select role from public.profiles where id = auth.uid()) in ('admin','editor'));

create policy "editors can update entries"
on public.calendar_entries for update to authenticated
using ((select role from public.profiles where id = auth.uid()) in ('admin','editor'))
with check ((select role from public.profiles where id = auth.uid()) in ('admin','editor'));

create policy "editors can delete entries"
on public.calendar_entries for delete to authenticated
using ((select role from public.profiles where id = auth.uid()) in ('admin','editor'));

create or replace function public.set_entry_audit_fields()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if tg_op = 'INSERT' then new.created_by = auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists calendar_entries_audit on public.calendar_entries;
create trigger calendar_entries_audit before insert or update on public.calendar_entries
for each row execute procedure public.set_entry_audit_fields();
