/*
  # Add Dummy Data for Testing

  1. New Records
    - Adds a dummy client to "Client Contact Information" table
    - Adds a dummy project to "Projects" table with realistic data
  
  2. Data Details
    - Client: Tech Solutions Inc. with complete contact information
    - Project: Corporate tax return engagement with typical workflow data
    - Includes financial information, dates, and status tracking
*/

-- Insert dummy client
INSERT INTO "Client Contact Information" (
  id,
  title,
  first_name,
  middle_name,
  last_name,
  company,
  phone_numbers,
  mobile,
  email,
  bill_address,
  ship_address
) VALUES (
  1,
  'Mr.',
  'John',
  'Michael',
  'Anderson',
  'Tech Solutions Inc.',
  '(416) 555-0123',
  '(647) 555-0456',
  'john.anderson@techsolutions.com',
  '123 Business Street
Toronto, ON M5V 3A8
Canada',
  '123 Business Street
Toronto, ON M5V 3A8
Canada'
) ON CONFLICT (id) DO NOTHING;

-- Insert dummy project
INSERT INTO "Projects" (
  client_id,
  project_name,
  engagement_type,
  main_client_folder,
  referred_by,
  year_end,
  date_in,
  target_completion_date,
  date_completed,
  date_of_efile,
  client_partners,
  preparer,
  reviewer,
  services_required,
  number_of_returns,
  t183_form_status,
  gst_status,
  uht_status,
  preparer_status,
  reviewer_status,
  partner_performance_review,
  approx_actual_time,
  comments,
  estimated_fees,
  invoice_number,
  invoice_amount,
  hst_amount,
  amount_received,
  outstanding_amount,
  created_at,
  updated_at,
  created_by,
  last_modified_by
) VALUES (
  1,
  'Tech Solutions Inc. - 2023 Corporate Tax Return',
  'Corporate Tax Return',
  'TS_2023_Corporate',
  'Sarah Wilson - Existing Client',
  '2023-12-31',
  '2024-01-15',
  '2024-03-15',
  NULL,
  NULL,
  'David Brown, Jennifer Lee',
  'Sarah Johnson',
  'Mike Chen',
  '{"corporateTax": true, "gst": true, "t1135": true, "bookkeeping": false, "personalTax": false, "uht": false}',
  1,
  'Pending',
  true,
  false,
  'In Progress',
  'Not Started',
  'Initial review shows good documentation. Client is well-organized.',
  25.5,
  'Working on GST reconciliation. Need to verify some expense categories with client.',
  15000.00,
  'INV-2024-001',
  15000.00,
  1950.00,
  10000.00,
  6950.00,
  '2024-01-15 09:00:00',
  '2024-01-20 14:30:00',
  'System Admin',
  'Sarah Johnson'
);