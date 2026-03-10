
-- Step 1: Add completed_by to legs
ALTER TABLE legs ADD COLUMN completed_by text DEFAULT 'Dziewczyny od nóżek (kompletacja do worka)';
UPDATE legs SET completed_by = 'Tapicer (na stanowisku)' WHERE code = 'N4';

-- Step 2: Deduplicate legs (keep oldest per code)
DELETE FROM legs a USING legs b WHERE a.code = b.code AND a.created_at > b.created_at;

-- Step 3: Drop series_id from legs (drop FK first)
ALTER TABLE legs DROP CONSTRAINT IF EXISTS legs_series_id_fkey;
ALTER TABLE legs DROP COLUMN series_id;

-- Step 4: Add unique constraint on code
ALTER TABLE legs ADD CONSTRAINT legs_code_unique UNIQUE (code);

-- Step 5: Add leg_count to chests
ALTER TABLE chests ADD COLUMN leg_count integer DEFAULT 4;

-- Step 6: Add pufa_leg_count to series_config
ALTER TABLE series_config ADD COLUMN pufa_leg_count integer DEFAULT 4;
