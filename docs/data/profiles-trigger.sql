-- run in Supabase SQL editor
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_role text := metadata ->> 'role';
  resolved_role user_role := 'member';
  display_name text := null;
  avatar_url text := null;
begin
  if raw_role is not null and raw_role in ('member', 'librarian', 'admin') then
    resolved_role := raw_role::user_role;
  end if;

  display_name := coalesce(metadata ->> 'full_name', metadata ->> 'name', new.email);
  avatar_url := metadata ->> 'avatar_url';

  insert into public.users (id, email, role)
  values (new.id, new.email, resolved_role)
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role,
        updated_at = now();

  insert into public.profiles (user_id, display_name, avatar_url, role, app_metadata)
  values (new.id, display_name, avatar_url, resolved_role, metadata)
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        role = excluded.role,
        app_metadata = excluded.app_metadata,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();