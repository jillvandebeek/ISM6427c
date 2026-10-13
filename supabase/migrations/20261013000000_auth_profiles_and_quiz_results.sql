-- Applied to project duzlfmksmxchgassdmpj via the Supabase MCP on 2026-10-13.
-- Kept here so the schema is versioned alongside the app.

-- Profiles: one row per auth user, created automatically on sign-up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 30));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Quiz results: each completed quiz is saved for the signed-in user.
create table public.quiz_results (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  match_key text not null check (match_key in ('moon','mars','jupiter','saturn','sun','europa','voyager','blackhole')),
  age_years smallint check (age_years between 0 and 130),
  color text not null,
  destination text not null,
  role text not null,
  fascination text not null,
  created_at timestamptz not null default now()
);

create index quiz_results_user_created_idx on public.quiz_results (user_id, created_at desc);

alter table public.quiz_results enable row level security;

create policy "Users can read their own results"
  on public.quiz_results for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save their own results"
  on public.quiz_results for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own results"
  on public.quiz_results for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Only signed-in users touch these tables; anonymous visitors get nothing.
revoke all on public.profiles, public.quiz_results from anon;
revoke all on public.profiles, public.quiz_results from authenticated;
grant select, update (display_name, updated_at) on public.profiles to authenticated;
grant select, insert (match_key, age_years, color, destination, role, fascination), delete on public.quiz_results to authenticated;
