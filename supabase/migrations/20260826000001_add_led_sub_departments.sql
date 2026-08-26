-- Add led_sub_departments column to employees table to allow explicit assignment of sub-department leadership

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS led_sub_departments TEXT[] DEFAULT '{}';
