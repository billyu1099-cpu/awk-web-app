/*
  # Transform Projects table to new schema

  1. Schema Changes
    - Rename existing Projects table to Projects_old for backup
    - Create new projects table with updated schema
    - Map and migrate existing data to new structure
    - Drop old table after successful migration

  2. Key Transformations
    - Convert services_required from JSON to JSONB
    - Convert preparer from TEXT to TEXT[] array
    - Map old column names to new column names
    - Apply new data types (NUMERIC for money, proper constraints)
    - Drop unmapped columns (t183_form_status, gst_status, uht_status, etc.)

  3. Data Integrity
    - Preserve all existing data in matching columns
    - Apply proper type conversions
    - Maintain foreign key relationships
*/

-- Step 1: Rename existing table for backup
ALTER TABLE IF EXISTS public."Projects" RENAME TO "Projects_old";

-- Step 2: Update foreign key reference table name (assuming it exists)
-- Note: The schema shows reference to public.clients, but we have "Client Contact Information"
-- We'll reference the existing client table
DO $$
BEGIN
  -- Check if we need to rename the client table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Client Contact Information' AND table_schema = 'public') THEN
    ALTER TABLE public."Client Contact Information" RENAME TO clients;
  END IF;
END $$;

-- Step 3: Create new projects table with updated schema
CREATE TABLE public.projects (
    project_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_name TEXT NOT NULL,
    client_id BIGINT,
    client_name TEXT,
    referred_by TEXT,
    main_client_folder TEXT,
    engagement_type TEXT,
    client_partners TEXT,
    year_end DATE,
    services_required JSONB,
    number_of_returns INT,
    date_in DATE,
    date_completed DATE,
    preparer TEXT[],
    reviewer TEXT,
    status TEXT CHECK (status IN ('waiting on client', 'with preparer', 'with reviewer', 'ready for filing', 'completed')),
    client_status TEXT CHECK (client_status IN ('Client to sign engagement and pay deposit', 'Client to provide information', 'client to review', 'client to sign', 'completed')),
    preparer_status TEXT CHECK (preparer_status IN ('not started', 'To do', 'WIP', 'Sent to reviewer', 'completed')),
    reviewer_status TEXT CHECK (reviewer_status IN ('not started', 'reviewing', 'approved')),
    comments TEXT,
    estimated_fees NUMERIC(12,2),
    approximated_actual_time_used NUMERIC(8,2),
    partner_performance_review TEXT,
    date_of_efile_mail DATE,
    invoice_number TEXT,
    amount NUMERIC(12,2),
    hst_amount NUMERIC(12,2),
    amount_received NUMERIC(12,2),
    outstanding NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT NOT NULL,
    last_modified_by TEXT,
    CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL
);

-- Step 4: Migrate data from old table to new table
INSERT INTO public.projects (
    project_name,
    client_id,
    client_name,
    referred_by,
    main_client_folder,
    engagement_type,
    client_partners,
    year_end,
    services_required,
    number_of_returns,
    date_in,
    date_completed,
    preparer,
    reviewer,
    status,
    client_status,
    preparer_status,
    reviewer_status,
    comments,
    estimated_fees,
    approximated_actual_time_used,
    partner_performance_review,
    date_of_efile_mail,
    invoice_number,
    amount,
    hst_amount,
    amount_received,
    outstanding,
    notes,
    created_at,
    updated_at,
    created_by,
    last_modified_by
)
SELECT 
    COALESCE(project_name, 'Untitled Project') as project_name,
    client_id,
    -- Get client name from joined client table if available
    (SELECT CONCAT_WS(' ', 
        NULLIF(c.title, ''), 
        NULLIF(c.first_name, ''), 
        NULLIF(c.middle_name, ''), 
        NULLIF(c.last_name, '')
    ) FROM public.clients c WHERE c.id = p.client_id) as client_name,
    referred_by,
    main_client_folder,
    engagement_type,
    client_partners,
    year_end::DATE,
    -- Convert services_required from JSON to JSONB
    CASE 
        WHEN services_required IS NOT NULL THEN services_required::JSONB
        ELSE NULL
    END as services_required,
    number_of_returns::INT,
    date_in::DATE,
    date_completed::DATE,
    -- Convert preparer from TEXT to TEXT[] array
    CASE 
        WHEN preparer IS NOT NULL AND preparer != '' THEN ARRAY[preparer]
        ELSE NULL
    END as preparer,
    reviewer,
    -- Map old status to new status values (default to 'with preparer' if not mappable)
    CASE 
        WHEN preparer_status = 'Completed' AND reviewer_status = 'Completed' THEN 'completed'
        WHEN reviewer_status = 'In Progress' THEN 'with reviewer'
        WHEN preparer_status = 'In Progress' THEN 'with preparer'
        WHEN preparer_status = 'Awaiting Review' THEN 'ready for filing'
        ELSE 'waiting on client'
    END as status,
    -- Default client_status (since it didn't exist in old schema)
    'Client to provide information' as client_status,
    -- Map old preparer_status to new values
    CASE 
        WHEN preparer_status = 'Not Started' THEN 'not started'
        WHEN preparer_status = 'In Progress' THEN 'WIP'
        WHEN preparer_status = 'Awaiting Review' THEN 'Sent to reviewer'
        WHEN preparer_status = 'Completed' THEN 'completed'
        ELSE 'not started'
    END as preparer_status,
    -- Map old reviewer_status to new values
    CASE 
        WHEN reviewer_status = 'Not Started' THEN 'not started'
        WHEN reviewer_status = 'In Progress' THEN 'reviewing'
        WHEN reviewer_status = 'Completed' THEN 'approved'
        ELSE 'not started'
    END as reviewer_status,
    comments,
    estimated_fees::NUMERIC(12,2),
    approx_actual_time::NUMERIC(8,2) as approximated_actual_time_used,
    partner_performance_review,
    date_of_efile::DATE as date_of_efile_mail,
    invoice_number,
    invoice_amount::NUMERIC(12,2) as amount,
    hst_amount::NUMERIC(12,2),
    amount_received::NUMERIC(12,2),
    outstanding_amount::NUMERIC(12,2) as outstanding,
    comments as notes, -- Duplicate comments as notes for now
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at,
    created_by,
    last_modified_by
FROM public."Projects_old" p;

-- Step 5: Enable RLS and create policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can read projects"
    ON public.projects
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert projects"
    ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
    ON public.projects
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
    ON public.projects
    FOR DELETE
    TO authenticated
    USING (true);

-- Step 6: Create indexes for better performance
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_preparer_status ON public.projects(preparer_status);
CREATE INDEX idx_projects_reviewer_status ON public.projects(reviewer_status);
CREATE INDEX idx_projects_year_end ON public.projects(year_end);
CREATE INDEX idx_projects_created_at ON public.projects(created_at);

-- Step 7: Drop the old table (uncomment when ready)
-- DROP TABLE IF EXISTS public."Projects_old";