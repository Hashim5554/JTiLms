-- Create moddatetime function if it doesn't exist
create or replace function moddatetime()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Drop existing announcements table if it exists
drop table if exists public.announcements cascade;

-- Create announcements table with proper structure
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  class_id uuid references public.classes(id) on delete cascade,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.announcements enable row level security;

-- Create policies
create policy "Announcements are viewable by everyone"
  on public.announcements for select
  using (true);

create policy "Users can create announcements"
  on public.announcements for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own announcements"
  on public.announcements for update
  using (auth.uid() = created_by);

create policy "Users can delete their own announcements"
  on public.announcements for delete
  using (auth.uid() = created_by);

-- Add indexes for better performance
create index if not exists idx_announcements_created_by on public.announcements(created_by);

-- Create updated_at trigger
create trigger handle_updated_at before update on public.announcements
  for each row execute procedure moddatetime();

-- Create a function to get announcement with profile data
create or replace function public.get_announcements_with_profiles()
returns table (
  id uuid,
  title text,
  content text,
  class_id uuid,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  username text,
  role text
) language sql security definer as $$
  select 
    a.*,
    p.username,
    p.role
  from public.announcements a
  left join public.profiles p on a.created_by = p.id;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_announcements_with_profiles() to authenticated; 