-- Update users without contract numbers with sequential CT-00001 format
-- Using a CTE to generate sequential numbers based on creation order

WITH numbered_profiles AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM profiles
  WHERE contract_number IS NULL
)
UPDATE profiles
SET contract_number = 'CT-' || LPAD(np.rn::text, 5, '0'),
    updated_at = now()
FROM numbered_profiles np
WHERE profiles.id = np.id;