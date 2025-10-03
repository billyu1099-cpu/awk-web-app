/*
  # Ensure Projects table exists with correct structure
  
  1. Drop T1 Projects table if it exists
  2. Ensure Projects table exists with the correct schema
  3. Set up proper RLS policies
*/

-- Drop T1 Projects table if it exists
DROP TABLE IF EXISTS "T1 Projects";

-- Create Projects table if it doesn't exist (based on your original schema)
CREATE TABLE IF NOT EXISTS "Projects" (
  project_id bigint PRIMARY KEY,
  client_id bigint,
  project_name text,
  engagement_type text,
  main_client_folder text,
  referred_by text NOT NULL,
  year_end date,
  date_in date,
  target_completion_date date,
  date_completed date,
  date_of_efile date,
  client_partners text,
  preparer text,
  reviewer text,
  services_required json,
  number_of_returns bigint,
  t183_form_status text,
  gst_status boolean,
  uht_status boolean,
  preparer_status text,
  reviewer_status text,
  partner_performance_review text,
  approx_actual_time real,
  comments text,
  estimated_fees real,
  invoice_number text,
  invoice_amount real,
  hst_amount real,
  amount_received real,
  outstanding_amount real,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  created_by text NOT NULL,
  last_modified_by text,
  CONSTRAINT fk_projects_client_id FOREIGN KEY (client_id) REFERENCES "Client Contact Information"(id)
);

-- Enable RLS
ALTER TABLE "Projects" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read projects" ON "Projects";
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON "Projects";
DROP POLICY IF EXISTS "Authenticated users can update projects" ON "Projects";
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON "Projects";

-- Create RLS policies for Projects table
CREATE POLICY "Authenticated users can read projects"
  ON "Projects"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON "Projects"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON "Projects"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON "Projects"
  FOR DELETE
  TO authenticated
  USING (true);