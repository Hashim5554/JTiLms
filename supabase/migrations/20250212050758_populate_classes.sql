-- Populate classes table with grades 3-8 and sections A-H
DO $$
DECLARE
  grade INT;
  section TEXT;
  sections TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
BEGIN
  -- First check if there are already classes in the system
  IF EXISTS (SELECT 1 FROM classes LIMIT 1) THEN
    RAISE NOTICE 'Classes already exist, skipping population';
    RETURN;
  END IF;
  
  -- Create classes for grades 3-8 with sections A-H
  FOR grade IN 3..8 LOOP
    FOREACH section IN ARRAY sections LOOP
      INSERT INTO classes (grade, section, max_students)
      VALUES (grade, section, 40);
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Successfully created 48 classes for grades 3-8 with sections A-H';
END;
$$; 