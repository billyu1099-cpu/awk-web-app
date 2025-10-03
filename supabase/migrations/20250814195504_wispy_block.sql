/*
  # Delete Projects_old backup table

  1. Cleanup
    - Drop the Projects_old backup table since the migration was successful
    - Remove any associated policies or constraints
*/

-- Drop the backup table
DROP TABLE IF EXISTS public."Projects_old" CASCADE;

-- Also clean up any remaining references to the old table name variations
DROP TABLE IF EXISTS public."Projects" CASCADE;
DROP TABLE IF EXISTS public."T1 Projects" CASCADE;