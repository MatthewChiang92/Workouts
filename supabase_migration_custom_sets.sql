-- Migration: Add support for custom sets
-- Run this in your Supabase SQL Editor to add custom sets functionality

-- Add new columns to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS exercise_mode TEXT DEFAULT 'quick',
ADD COLUMN IF NOT EXISTS custom_sets JSONB DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.exercises.exercise_mode IS 'Mode of exercise entry: quick (traditional sets/reps/weight) or custom (individual sets)';
COMMENT ON COLUMN public.exercises.custom_sets IS 'Array of individual sets with reps and weight for custom mode: [{"reps": 12, "weight": 60}, {"reps": 10, "weight": 65}]';

-- Create index for better performance when querying by mode
CREATE INDEX IF NOT EXISTS exercises_mode_idx ON public.exercises(exercise_mode);

-- Example of custom_sets JSON structure:
-- [
--   {"reps": 12, "weight": 60},
--   {"reps": 10, "weight": 65}, 
--   {"reps": 8, "weight": 70}
-- ]