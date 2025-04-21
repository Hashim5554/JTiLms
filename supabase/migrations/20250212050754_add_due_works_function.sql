-- Create function to get due works with subject and creator info
create or replace function public.get_due_works_with_info()
returns table (
  id uuid,
  title text,
  description text,
  due_date timestamp with time zone,
  subject_id uuid,
  class_id uuid,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  subject_name text,
  creator_username text
)
language sql
security definer
as $$
  select 
    dw.id,
    dw.title,
    dw.description,
    dw.due_date,
    dw.subject_id,
    dw.class_id,
    dw.created_by,
    dw.created_at,
    dw.updated_at,
    s.name as subject_name,
    p.username as creator_username
  from public.due_works dw
  left join public.subjects s on dw.subject_id = s.id
  left join public.profiles p on dw.created_by = p.id
  where dw.due_date >= now()
  order by dw.due_date asc;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_due_works_with_info() to authenticated; 