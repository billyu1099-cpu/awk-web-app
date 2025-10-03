/*
  # Add due date column to projects table

  1. New Column
    - `due_date` (DATE) - Project due date, separate from year_end date

  2. Notes
    - Due date is different from year_end date
    - Year_end remains for basic information
    - Due date will be used in the key metrics card
*/

ALTER TABLE public.projects 
ADD COLUMN due_date DATE;

-- Add index for due_date for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);