-- Migration to add a review column to the soi_applications table

ALTER TABLE public.soi_applications ADD COLUMN IF NOT EXISTS review TEXT;
