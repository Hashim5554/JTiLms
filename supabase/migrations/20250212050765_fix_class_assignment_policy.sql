-- Create a function to assign students to classes that bypasses RLS
CREATE OR REPLACE FUNCTION public.assign_student_to_class(
  user_id UUID,
  class_id UUID
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  assignment_id UUID;
BEGIN
  -- Check if assignment already exists
  SELECT id INTO assignment_id 
  FROM class_assignments 
  WHERE user_id = $1 AND class_id = $2;
  
  -- If assignment exists, return it
  IF assignment_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'id', assignment_id,
      'user_id', user_id,
      'class_id', class_id,
      'message', 'Student already assigned to class'
    );
  END IF;
  
  -- Insert new assignment
  INSERT INTO class_assignments (
    user_id,
    class_id
  ) VALUES (
    user_id,
    class_id
  )
  RETURNING id INTO assignment_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'id', assignment_id,
    'user_id', user_id,
    'class_id', class_id,
    'message', 'Student assigned to class successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'details', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.assign_student_to_class(UUID, UUID) TO authenticated;

-- Create enhanced user creation function that handles class assignment
CREATE OR REPLACE FUNCTION public.create_student_with_class(
  email TEXT,
  password TEXT,
  username TEXT,
  class_id UUID DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  user_id UUID;
BEGIN
  -- First create the user
  result := public.create_new_user(email, password, 'student', username);
  
  -- Check if user creation was successful
  IF result->>'error' IS NOT NULL THEN
    RETURN result;
  END IF;
  
  -- Get the user ID
  user_id := (result->>'id')::UUID;
  
  -- If class_id is provided, assign student to class
  IF class_id IS NOT NULL THEN
    result := public.assign_student_to_class(user_id, class_id);
    
    -- If class assignment failed, return error
    IF result->>'error' IS NOT NULL THEN
      RETURN jsonb_build_object(
        'user_created', TRUE,
        'class_assigned', FALSE,
        'error', result->>'error'
      );
    END IF;
    
    -- Return complete success
    RETURN jsonb_build_object(
      'id', user_id,
      'email', email,
      'username', username,
      'role', 'student',
      'class_id', class_id,
      'class_assigned', TRUE
    );
  END IF;
  
  -- If no class_id provided, just return user creation result
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'details', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_student_with_class(TEXT, TEXT, TEXT, UUID) TO authenticated; 