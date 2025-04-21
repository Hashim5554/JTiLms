-- Drop the existing function first
drop function if exists public.delete_user(uuid);

-- Create a function to delete a user
create or replace function public.delete_user(user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  -- Delete from auth.users table
  delete from auth.users where id = user_id;
  
  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'User deleted successfully'
  );
  
  return result;
exception when others then
  -- Return error response
  result := json_build_object(
    'success', false,
    'message', SQLERRM
  );
  return result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.delete_user(uuid) to authenticated; 