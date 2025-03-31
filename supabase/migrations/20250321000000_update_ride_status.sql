/*
  # Update existing rides status

  1. Changes
    - Update any existing rides with 'pending' status to 'active'
*/

-- Update any existing rides with 'pending' status to 'active'
UPDATE rides
SET status = 'active'
WHERE status = 'pending';

-- Verify the update
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM rides WHERE status = 'pending'
  ) THEN
    RAISE NOTICE 'Some rides still have pending status';
  ELSE
    RAISE NOTICE 'All rides have been updated successfully';
  END IF;
END $$; 