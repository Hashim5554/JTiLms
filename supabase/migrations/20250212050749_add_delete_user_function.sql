-- Create a function to delete a user
create or replace function delete_user(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Delete from auth.users table
  delete from auth.users where id = user_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function delete_user(uuid) to authenticated; 