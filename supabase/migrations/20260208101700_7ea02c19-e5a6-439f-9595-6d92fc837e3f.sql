
-- Add allowed_finishes column to tables
ALTER TABLE seats_sofa ADD COLUMN allowed_finishes text[] DEFAULT ARRAY['A','B','C'];
ALTER TABLE backrests ADD COLUMN allowed_finishes text[] DEFAULT ARRAY['A','B','C'];
ALTER TABLE sides ADD COLUMN allowed_finishes text[] DEFAULT ARRAY['A','B','C'];
ALTER TABLE pillows ADD COLUMN allowed_finishes text[] DEFAULT ARRAY['A','B','C'];
