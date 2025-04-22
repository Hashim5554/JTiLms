-- Update class names to ensure they match the expected format
DO $$
DECLARE
  cls RECORD;
BEGIN
  -- Loop through all classes
  FOR cls IN 
    SELECT id, grade, section FROM classes
  LOOP
    -- Update the name to match the "Grade X - Section Y" format
    UPDATE classes
    SET name = 'Grade ' || cls.grade || ' - Section ' || cls.section
    WHERE id = cls.id AND (name IS NULL OR name != 'Grade ' || cls.grade || ' - Section ' || cls.section);
  END LOOP;
END $$; 