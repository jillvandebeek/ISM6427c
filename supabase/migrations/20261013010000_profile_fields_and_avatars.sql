-- Applied via the Supabase MCP on 2026-10-13.
-- Richer user profiles: avatar (photo or emoji), bio, birth date, favourite colour,
-- and an onboarding marker so first-time users are asked to create their profile.
alter table public.profiles
  add column bio text check (char_length(bio) <= 160),
  add column avatar_emoji text check (char_length(avatar_emoji) <= 16),
  add column avatar_path text check (char_length(avatar_path) <= 200),
  add column birth_date date check (birth_date >= date '1900-01-01'),
  add column favorite_color text check (favorite_color in ('rood','oranje','geel','groen','blauw','paars','roze','zwart')),
  add column onboarded_at timestamptz;

alter table public.profiles
  add constraint profiles_display_name_not_blank check (display_name is null or char_length(trim(display_name)) between 1 and 30);

-- Keep updated_at honest and refuse birth dates in the future.
create or replace function public.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_date is not null and new.birth_date > current_date then
    raise exception 'birth_date cannot be in the future' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.profiles_before_update() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.profiles_before_update();

-- Users may edit these profile columns (never id or created_at).
revoke update on public.profiles from authenticated;
grant update (display_name, bio, avatar_emoji, avatar_path, birth_date, favorite_color, onboarded_at, updated_at)
  on public.profiles to authenticated;

-- Private bucket for profile photos: each user owns the folder named after their user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can view their own avatar"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can replace their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
