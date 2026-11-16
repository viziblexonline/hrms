-- HRMS Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null check (role in ('student', 'teacher', 'admin')) default 'student',
  phone text,
  avatar text,
  teacher_id uuid references public.profiles(id) on delete set null,
  class_id text,
  class_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- App domain data (keeps existing AppData JSON shape for fast migrate)
create table if not exists public.app_data (
  id text primary key default 'main',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_data (id, payload)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- Auto-create profile when a user signs up (email or Google)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  chosen_role text;
  chosen_name text;
begin
  chosen_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  if chosen_role not in ('student', 'teacher', 'admin') then
    chosen_role := 'student';
  end if;
  -- Bootstrap institute admin email keeps admin; other public signups cannot
  if lower(new.email) = 'admin@hrms.edu.pk' then
    chosen_role := 'admin';
  elsif chosen_role = 'admin' then
    chosen_role := 'student';
  end if;
  chosen_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, name, role, avatar)
  values (
    new.id,
    new.email,
    chosen_name,
    chosen_role,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(nullif(excluded.name, ''), profiles.name),
    avatar = coalesce(excluded.avatar, profiles.avatar),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.app_data enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "App data readable by authenticated" on public.app_data;
create policy "App data readable by authenticated"
  on public.app_data for select
  to authenticated
  using (true);

drop policy if exists "App data writable by authenticated" on public.app_data;
create policy "App data writable by authenticated"
  on public.app_data for insert
  to authenticated
  with check (true);

drop policy if exists "App data updatable by authenticated" on public.app_data;
create policy "App data updatable by authenticated"
  on public.app_data for update
  to authenticated
  using (true)
  with check (true);

-- Optional: allow anon read of nothing sensitive (login page doesn't need it)
