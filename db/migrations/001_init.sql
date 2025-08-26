-- 001_init.sql
-- Core schema for Kratos Event Platform

-- Enable required extensions (idempotent)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- USERS table (stores profile info after OAuth)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique, -- references auth.users.id (cannot FK directly across schemas in Supabase templates, optional manual)
  name text not null,
  email text not null unique,
  phone text,
  photo_url text,
  college text,
  department text,
  year text,
  created_at timestamptz not null default now()
);

-- EVENTS table
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  rules text,
  category text not null check (category in ('pre-events','technical','non-technical','grounds')),
  price integer not null check (price >= 0),
  min_team_size int not null check (min_team_size >= 1),
  max_team_size int not null check (max_team_size >= min_team_size),
  created_at timestamptz not null default now()
);
create index if not exists idx_events_category on public.events(category);

-- REGISTRATIONS (an order/transaction grouping one or more events & participants)
create table if not exists public.registrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  total_amount integer not null check (total_amount >= 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  payment_id text, -- Razorpay payment id
  created_at timestamptz not null default now()
);
create index if not exists idx_registrations_user on public.registrations(user_id);

-- REGISTRATION PARTICIPANTS (one row per participant per event within a registration)
create table if not exists public.registration_participants (
  id uuid primary key default uuid_generate_v4(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  college text,
  department text,
  year text,
  is_leader boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_reg_part_registration on public.registration_participants(registration_id);
create index if not exists idx_reg_part_event on public.registration_participants(event_id);

-- RLS (Row Level Security)
alter table public.users enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_participants enable row level security;
alter table public.events enable row level security; -- usually open for read

-- Policies
-- EVENTS: allow read for anon, auth
create policy if not exists "Events are readable by anyone" on public.events for select using (true);
-- Optionally restrict modifications to service role only (no policy => blocked for non-service-role)

-- USERS: owner can select/update self; insert allowed for authenticated to bootstrap profile
create policy if not exists "Users select own" on public.users for select using (auth.uid() = auth_user_id);
create policy if not exists "Users insert self" on public.users for insert with check (auth.uid() = auth_user_id);
create policy if not exists "Users update self" on public.users for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- REGISTRATIONS: owner can select/insert/update own rows
create policy if not exists "Registrations select own" on public.registrations for select using (auth.uid() = (select auth_user_id from public.users u where u.id = registrations.user_id));
create policy if not exists "Registrations insert own" on public.registrations for insert with check (auth.uid() = (select auth_user_id from public.users u where u.id = registrations.user_id));
create policy if not exists "Registrations update own" on public.registrations for update using (auth.uid() = (select auth_user_id from public.users u where u.id = registrations.user_id));

-- PARTICIPANTS: owner of registration can view/insert
create policy if not exists "Participants select via registration owner" on public.registration_participants for select using (
  auth.uid() = (select auth_user_id from public.users u join public.registrations r on r.user_id = u.id where r.id = registration_participants.registration_id)
);
create policy if not exists "Participants insert via registration owner" on public.registration_participants for insert with check (
  auth.uid() = (select auth_user_id from public.users u join public.registrations r on r.user_id = u.id where r.id = registration_participants.registration_id)
);

-- (Optional) Function to sync profile after OAuth (call from edge function / client)
create or replace function public.upsert_user_profile(p_name text, p_email text, p_photo text)
returns uuid
language plpgsql
as $$
declare
  v_auth uuid := auth.uid();
  v_user_id uuid;
begin
  if v_auth is null then
    raise exception 'Not authenticated';
  end if;
  select id into v_user_id from public.users where auth_user_id = v_auth;
  if v_user_id is null then
    insert into public.users(auth_user_id, name, email, photo_url)
      values (v_auth, coalesce(p_name,'Anonymous'), p_email, p_photo)
      returning id into v_user_id;
  else
    update public.users set name = coalesce(p_name,name), photo_url = coalesce(p_photo, photo_url) where id = v_user_id;
  end if;
  return v_user_id;
end;
$$;
