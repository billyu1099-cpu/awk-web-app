/*
  # Add Foreign Key Constraint

  1. Foreign Key Relationship
    - Add foreign key constraint between Projects.client_id and "Client Contact Information".id
    - This enables Supabase's automatic join syntax to work properly

  2. Security
    - Maintains existing RLS policies
    - Ensures referential integrity
*/

-- Add foreign key constraint between Projects and Client Contact Information
ALTER TABLE "Projects" 
ADD CONSTRAINT fk_projects_client_id 
FOREIGN KEY (client_id) 
REFERENCES "Client Contact Information"(id);